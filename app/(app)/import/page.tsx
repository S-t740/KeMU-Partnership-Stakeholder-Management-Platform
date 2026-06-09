'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check,
  AlertTriangle, CheckCircle2, XCircle, RefreshCw, ChevronDown,
  Merge, SkipForward, Plus, Loader2
} from 'lucide-react';
import { Button, Card } from '@/components/ui/index';
import { cn, STAKEHOLDER_CATEGORIES } from '@/lib/utils';
import * as XLSX from 'xlsx';
import Fuse from 'fuse.js';
import { getStakeholders, bulkInsertStakeholders } from '@/lib/db';
import type { StakeholderInsert } from '@/lib/supabase';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const SYSTEM_FIELDS = [
  { key: 'name', label: 'Organization Name', required: true },
  { key: 'category', label: 'Stakeholder Category', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'county', label: 'County', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'contact_name', label: 'Contact Name', required: false },
  { key: 'contact_email', label: 'Contact Email', required: false },
  { key: 'contact_phone', label: 'Contact Phone', required: false },
  { key: 'contact_position', label: 'Contact Position', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: 'tags', label: 'Tags', required: false },
  { key: 'skip', label: '— Skip this column —', required: false },
];

interface ParsedRow {
  [key: string]: string;
}

interface ValidationResult {
  row: ParsedRow;
  rowIndex: number;
  errors: string[];
  warnings: string[];
}

interface DuplicateResult {
  row: ParsedRow;
  rowIndex: number;
  matchType: 'exact' | 'similar';
  matchedWith: string;
  score?: number;
  action: 'merge' | 'skip' | 'create';
}

const STEPS = [
  { n: 1, label: 'Upload' },
  { n: 2, label: 'Preview' },
  { n: 3, label: 'Map Columns' },
  { n: 4, label: 'Validate' },
  { n: 5, label: 'Duplicates' },
  { n: 6, label: 'Import' },
];

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]);
  const [importDone, setImportDone] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    getStakeholders().then((s) => setExistingNames(s.map((st) => st.name))).catch(() => {});
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      setSheets(wb.SheetNames);
      setSelectedSheet(wb.SheetNames[0]);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: ParsedRow[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      setRawData(json);
      setHeaders(json.length ? Object.keys(json[0]) : []);
      // Auto-map common names
      const autoMap: Record<string, string> = {};
      Object.keys(json[0] ?? {}).forEach((col) => {
        const lc = col.toLowerCase();
        if (lc.includes('organ') || lc === 'name' || lc === 'company') autoMap[col] = 'name';
        else if (lc.includes('categ')) autoMap[col] = 'category';
        else if (lc.includes('country')) autoMap[col] = 'country';
        else if (lc.includes('county')) autoMap[col] = 'county';
        else if (lc.includes('email')) autoMap[col] = lc.includes('contact') ? 'contact_email' : 'contact_email';
        else if (lc.includes('phone') || lc.includes('tel')) autoMap[col] = 'contact_phone';
        else if (lc.includes('contact') || lc.includes('person')) autoMap[col] = 'contact_name';
        else if (lc.includes('website') || lc.includes('web') || lc.includes('url')) autoMap[col] = 'website';
        else if (lc.includes('note')) autoMap[col] = 'notes';
        else autoMap[col] = 'skip';
      });
      setMapping(autoMap);
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [], 'application/vnd.ms-excel': [], 'text/csv': [] },
    multiple: false,
  });

  const runValidation = () => {
    const results: ValidationResult[] = rawData.map((row, i) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const nameCol = Object.entries(mapping).find(([, v]) => v === 'name')?.[0];
      const emailCol = Object.entries(mapping).find(([, v]) => v === 'contact_email')?.[0];
      if (nameCol && !row[nameCol]?.trim()) errors.push('Organization name is required');
      if (emailCol && row[emailCol] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[emailCol])) errors.push('Invalid email format');
      if (nameCol && row[nameCol] && row[nameCol].trim().length < 2) warnings.push('Name seems too short');
      return { row, rowIndex: i + 1, errors, warnings };
    });
    setValidations(results);
    return results;
  };

  const runDuplicateCheck = () => {
    const nameCol = Object.entries(mapping).find(([, v]) => v === 'name')?.[0];
    if (!nameCol) return [];
    const fuse = new Fuse(existingNames, { threshold: 0.35 });
    const results: DuplicateResult[] = [];
    rawData.forEach((row, i) => {
      const name = row[nameCol]?.trim();
      if (!name) return;
      const exact = existingNames.find((n) => n.toLowerCase() === name.toLowerCase());
      if (exact) {
        results.push({ row, rowIndex: i + 1, matchType: 'exact', matchedWith: exact, action: 'merge' });
        return;
      }
      const similar = fuse.search(name);
      if (similar.length > 0) {
        results.push({ row, rowIndex: i + 1, matchType: 'similar', matchedWith: similar[0].item, score: similar[0].score, action: 'create' });
      }
    });
    setDuplicates(results);
    return results;
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    try {
      const nameCol = Object.entries(mapping).find(([, v]) => v === 'name')?.[0];
      const skipRowIndexes = new Set(duplicates.filter((d) => d.action === 'skip').map((d) => d.rowIndex - 1));
      const rows: StakeholderInsert[] = validations
        .filter((v) => v.errors.length === 0)
        .filter((_, i) => !skipRowIndexes.has(i))
        .map((v) => {
          const row = v.row;
          const get = (field: string) => {
            const col = Object.entries(mapping).find(([, f]) => f === field)?.[0];
            return col ? row[col]?.trim() || undefined : undefined;
          };
          const cat = get('category');
          const validCats = STAKEHOLDER_CATEGORIES as readonly string[];
          return {
            name: get('name') ?? 'Unknown',
            category: (validCats.includes(cat ?? '') ? cat : 'Strategic Partner') as any,
            country: get('country'),
            county: get('county'),
            website: get('website'),
            notes: get('notes'),
            status: 'Active' as const,
          };
        });
      const inserted = await bulkInsertStakeholders(rows);
      setImportedCount(inserted.length);
      setImportDone(true);
    } catch (e: any) {
      setImportError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleNext = () => {
    if (step === 3) runValidation();
    if (step === 4) runDuplicateCheck();
    setStep((s) => Math.min(s + 1, 6) as Step);
  };

  const valid = validations.filter((v) => v.errors.length === 0);
  const invalid = validations.filter((v) => v.errors.length > 0);
  const toImport = valid.length - duplicates.filter((d) => d.action === 'skip').length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                step > s.n ? 'wizard-step-complete' : step === s.n ? 'wizard-step-active' : 'wizard-step-inactive'
              )}>
                {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:block whitespace-nowrap',
                step === s.n ? 'text-white' : step > s.n ? 'text-emerald-400' : 'text-slate-500'
              )}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-px mx-3', step > s.n ? 'bg-emerald-500/40' : 'bg-white/10')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card title="Upload Your File" subtitle="Supported: XLSX, XLS, CSV">
          <div className="p-6">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
                isDragActive ? 'dropzone-active' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet className="h-12 w-12 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB · {sheets.length} sheet{sheets.length !== 1 ? 's' : ''} · {rawData.length} rows</p>
                  <Button variant="secondary" size="sm">Change File</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-slate-500" />
                  <p className="text-sm font-medium text-slate-300">Drag and drop your Excel or CSV file here</p>
                  <p className="text-xs text-slate-500">or click to browse</p>
                  <Button variant="secondary" size="sm">Browse Files</Button>
                </div>
              )}
            </div>
            {file && sheets.length > 1 && (
              <div className="mt-4">
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Select Sheet</label>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="form-input w-auto"
                >
                  {sheets.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <Card title="Data Preview" subtitle={`${rawData.length} rows · ${headers.length} columns`}>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="metric-card"><p className="text-xs text-slate-400">Total Rows</p><p className="text-xl font-bold text-white">{rawData.length}</p></div>
              <div className="metric-card"><p className="text-xs text-slate-400">Columns</p><p className="text-xl font-bold text-white">{headers.length}</p></div>
              <div className="metric-card"><p className="text-xs text-slate-400">Sheet</p><p className="text-xl font-bold text-white truncate">{selectedSheet}</p></div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-3 py-2 text-left text-slate-500 font-semibold">#</th>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-slate-400 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {rawData.slice(0, 8).map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2 text-slate-600">{i + 1}</td>
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-[150px] truncate">{row[h] || <span className="text-slate-600">—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rawData.length > 8 && (
              <p className="text-xs text-slate-500 mt-2 text-center">+ {rawData.length - 8} more rows</p>
            )}
          </div>
        </Card>
      )}

      {/* Step 3: Column Mapping */}
      {step === 3 && (
        <Card title="Map Columns" subtitle="Match your Excel columns to system fields">
          <div className="p-5 space-y-3">
            {headers.map((col) => (
              <div key={col} className="flex items-center gap-4">
                <div className="w-48 shrink-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{col}</p>
                  <p className="text-[11px] text-slate-500 truncate">Sample: {rawData[0]?.[col] || '—'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
                <div className="relative flex-1">
                  <select
                    value={mapping[col] ?? 'skip'}
                    onChange={(e) => setMapping((m) => ({ ...m, [col]: e.target.value }))}
                    className="form-input pr-8 appearance-none"
                  >
                    {SYSTEM_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>
                {mapping[col] && mapping[col] !== 'skip' && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
              </div>
            ))}
            <p className="text-xs text-slate-500 mt-2">* Required field</p>
          </div>
        </Card>
      )}

      {/* Step 4: Validation */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="metric-card border-emerald-500/20">
              <p className="text-xs text-slate-400">Valid Rows</p>
              <p className="text-2xl font-bold text-emerald-400">{valid.length}</p>
            </div>
            <div className="metric-card border-red-500/20">
              <p className="text-xs text-slate-400">Rows with Errors</p>
              <p className="text-2xl font-bold text-red-400">{invalid.length}</p>
            </div>
            <div className="metric-card border-amber-500/20">
              <p className="text-xs text-slate-400">Rows with Warnings</p>
              <p className="text-2xl font-bold text-amber-400">{validations.filter((v) => v.warnings.length > 0).length}</p>
            </div>
          </div>
          {invalid.length > 0 && (
            <Card title="Validation Errors">
              <div className="p-4 space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                {invalid.map((v) => {
                  const nameCol = Object.entries(mapping).find(([, val]) => val === 'name')?.[0];
                  return (
                    <div key={v.rowIndex} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                      <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-300">Row {v.rowIndex}{nameCol ? ` · ${v.row[nameCol] || 'Empty name'}` : ''}</p>
                        {v.errors.map((e, i) => <p key={i} className="text-[11px] text-red-400/80">{e}</p>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          {valid.length > 0 && <div className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" />{valid.length} rows are ready to import.</div>}
        </div>
      )}

      {/* Step 5: Duplicates */}
      {step === 5 && (
        <div className="space-y-4">
          <Card title="Duplicate Detection" subtitle={`${duplicates.length} potential duplicates found`}>
            {duplicates.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-emerald-300">No duplicates found!</p>
                <p className="text-xs text-slate-500 mt-1">All records appear to be new entries.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                {duplicates.map((d, i) => {
                  const nameCol = Object.entries(mapping).find(([, v]) => v === 'name')?.[0];
                  return (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', d.matchType === 'exact' ? 'text-red-400' : 'text-amber-400')} />
                            <span className={cn('text-[11px] font-semibold', d.matchType === 'exact' ? 'text-red-300' : 'text-amber-300')}>
                              {d.matchType === 'exact' ? 'Exact duplicate' : 'Similar match'}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-white mt-1">{nameCol ? d.row[nameCol] : `Row ${d.rowIndex}`}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Matches existing: <span className="text-slate-200">{d.matchedWith}</span></p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {(['merge', 'skip', 'create'] as const).map((action) => (
                            <button
                              key={action}
                              onClick={() => setDuplicates((prev) => prev.map((dup, j) => j === i ? { ...dup, action } : dup))}
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all',
                                d.action === action
                                  ? action === 'merge' ? 'bg-sky-500 text-white' : action === 'skip' ? 'bg-slate-500 text-white' : 'bg-emerald-500 text-white'
                                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
                              )}
                            >
                              {action === 'merge' && <Merge className="h-2.5 w-2.5" />}
                              {action === 'skip' && <SkipForward className="h-2.5 w-2.5" />}
                              {action === 'create' && <Plus className="h-2.5 w-2.5" />}
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Step 6: Import Summary */}
      {step === 6 && (
        <div className="space-y-5">
          {!importDone ? (
            <Card title="Ready to Import" subtitle="Review your import summary">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="metric-card">
                    <p className="text-xs text-slate-400">To Import</p>
                    <p className="text-2xl font-bold text-emerald-400">{toImport}</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs text-slate-400">To Merge</p>
                    <p className="text-2xl font-bold text-sky-400">{duplicates.filter((d) => d.action === 'merge').length}</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs text-slate-400">To Skip</p>
                    <p className="text-2xl font-bold text-slate-400">{duplicates.filter((d) => d.action === 'skip').length + invalid.length}</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs text-slate-400">Errors</p>
                    <p className="text-2xl font-bold text-red-400">{invalid.length}</p>
                  </div>
                </div>
                {importError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{importError}</p>
                )}
                <Button
                  className="w-full py-3"
                  onClick={handleImport}
                  disabled={importing || toImport === 0}
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {importing ? 'Importing…' : `Start Import — ${toImport} records`}
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Import Complete!</h2>
                <p className="text-sm text-slate-400 mb-6">Your stakeholder data has been successfully imported.</p>
                <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
                  <div><p className="text-2xl font-bold text-emerald-400">{importedCount}</p><p className="text-xs text-slate-400">Imported</p></div>
                  <div><p className="text-2xl font-bold text-sky-400">{duplicates.filter((d) => d.action === 'merge').length}</p><p className="text-xs text-slate-400">Merged</p></div>
                  <div><p className="text-2xl font-bold text-slate-400">{invalid.length}</p><p className="text-xs text-slate-400">Skipped</p></div>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => { setStep(1); setFile(null); setImportDone(false); setValidations([]); setDuplicates([]); setImportedCount(0); }} variant="secondary">
                    <RefreshCw className="h-4 w-4" /> Import Another File
                  </Button>
                  <Button onClick={() => router.push('/stakeholders')}><ArrowRight className="h-4 w-4" /> View Stakeholders</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Navigation */}
      {!importDone && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((s) => Math.max(s - 1, 1) as Step)}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <span className="text-xs text-slate-500">Step {step} of 6</span>
          <Button
            onClick={handleNext}
            disabled={(step === 1 && !file) || step === 6}
          >
            {step === 5 ? 'Confirm & Continue' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
