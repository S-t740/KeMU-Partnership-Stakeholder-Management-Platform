'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus, FileText, Upload, Download, Eye, Trash2, Loader2, X } from 'lucide-react';
import { Button, Card, EmptyState, LoadingSpinner, Select } from '@/components/ui/index';
import { SearchBar } from '@/components/ui/SearchBar';
import { DOCUMENT_TYPES, formatDate, cn } from '@/lib/utils';
import { getDocuments, deleteDocument, uploadDocumentFile, getStakeholders } from '@/lib/db';
import type { Document, Stakeholder } from '@/lib/supabase';

const DOC_ICONS: Record<string, string> = {
  'Proposal': '📋',
  'MoU': '🤝',
  'Partnership Agreement': '📑',
  'Grant Application': '📩',
  'Meeting Minutes': '📝',
  'Report': '📊',
  'Other': '📄',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  
  // Upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    stakeholder_id: '',
    document_type: 'Other',
    description: '',
  });

  useEffect(() => {
    Promise.all([getDocuments(), getStakeholders()])
      .then(([docs, st]) => {
        setDocuments(docs);
        setStakeholders(st);
      })
      .finally(() => setLoading(false));
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFileToUpload(acceptedFiles[0]);
      setUploadModalOpen(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !uploadForm.stakeholder_id) return;
    
    setUploading(true);
    setUploadError(null);
    try {
      const newDoc = await uploadDocumentFile(fileToUpload, {
        stakeholder_id: uploadForm.stakeholder_id,
        document_type: uploadForm.document_type,
        description: uploadForm.description || undefined,
      });
      // The DB returns stakeholders as null sometimes if not joined immediately,
      // so we manually attach the stakeholder name for the UI
      const st = stakeholders.find(s => s.id === uploadForm.stakeholder_id);
      const docWithStakeholder = { ...newDoc, stakeholders: st ? { name: st.name } : undefined };
      
      setDocuments((prev) => [docWithStakeholder, ...prev]);
      setUploadModalOpen(false);
      setFileToUpload(null);
      setUploadForm({ stakeholder_id: '', document_type: 'Other', description: '' });
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <LoadingSpinner />;

  const filtered = documents.filter((d) => {
    const q = search.toLowerCase();
    const stName = (d.stakeholders as any)?.name ?? '';
    if (q && !d.name.toLowerCase().includes(q) && !stName.toLowerCase().includes(q)) return false;
    if (docTypeFilter && d.document_type !== docTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5 relative">
      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          isDragActive ? 'border-sky-500/60 bg-sky-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-slate-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-300 mb-1">Drop files here or click to upload</p>
        <p className="text-xs text-slate-500">PDF, DOCX, XLSX, PNG up to 50MB</p>
        <Button variant="secondary" size="sm" className="mt-4 pointer-events-none">
          <Plus className="h-4 w-4" /> Choose File
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search documents…" className="w-56" />
          <Select
            value={docTypeFilter}
            onChange={setDocTypeFilter}
            options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))}
            placeholder="All Types"
            className="w-44"
          />
        </div>
        <span className="text-xs text-slate-400">{filtered.length} documents</span>
      </div>

      {/* Documents grid */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="h-10 w-10" />}
            title={documents.length === 0 ? "No documents yet" : "No documents found"}
            subtitle={documents.length === 0 ? "Upload your first document above" : "Adjust your filters to see more"}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <Card key={doc.id}>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-2xl shrink-0">{DOC_ICONS[doc.document_type || 'Other'] ?? '📄'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-snug line-clamp-2" title={doc.name}>{doc.name}</p>
                    <p className="text-xs text-sky-400 mt-0.5 truncate">{(doc.stakeholders as any)?.name ?? '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="badge-base bg-white/5 text-slate-400 border-white/10 text-[10px]">{doc.document_type || 'Other'}</span>
                  {doc.file_size && (
                    <span className="badge-base bg-white/5 text-slate-400 border-white/10 text-[10px]">
                      {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mb-3">
                  Uploaded {formatDate(doc.created_at)}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                  {doc.file_path ? (
                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full justify-center">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </a>
                  ) : (
                    <Button variant="ghost" size="sm" className="flex-1 justify-center opacity-50 cursor-not-allowed">
                      <Eye className="h-3.5 w-3.5" /> No file
                    </Button>
                  )}
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Upload Document</h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {fileToUpload && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3">
                  <FileText className="h-6 w-6 text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{fileToUpload.name}</p>
                    <p className="text-[10px] text-slate-400">{(fileToUpload.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">Stakeholder <span className="text-red-400">*</span></label>
                <select 
                  className="form-input" 
                  value={uploadForm.stakeholder_id} 
                  onChange={(e) => setUploadForm(p => ({ ...p, stakeholder_id: e.target.value }))}
                  required
                >
                  <option value="">Select stakeholder…</option>
                  {stakeholders.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">Document Type <span className="text-red-400">*</span></label>
                <select 
                  className="form-input" 
                  value={uploadForm.document_type} 
                  onChange={(e) => setUploadForm(p => ({ ...p, document_type: e.target.value }))}
                  required
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">Description (Optional)</label>
                <textarea 
                  className="form-input resize-none h-20" 
                  placeholder="What is this document about?"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  {uploadError}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <Button type="submit" className="flex-1" disabled={uploading || !uploadForm.stakeholder_id}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? 'Uploading…' : 'Upload File'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
