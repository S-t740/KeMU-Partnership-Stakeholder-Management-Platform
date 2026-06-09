'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, MapPin, ChevronRight, Download, Globe
} from 'lucide-react';
import { getStakeholders } from '@/lib/db';
import { cn, STAKEHOLDER_CATEGORIES, formatRelativeDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button, Card, EmptyState, Select, LoadingSpinner } from '@/components/ui/index';
import type { Stakeholder } from '@/lib/supabase';

const STATUSES = ['Active', 'Inactive', 'Prospect', 'Archived'];

export default function StakeholdersPage() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    getStakeholders()
      .then(setStakeholders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const countries = [...new Set(stakeholders.map((s) => s.country).filter(Boolean))].sort() as string[];

  const filtered = stakeholders.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return false;
    if (category && s.category !== category) return false;
    if (status && s.status !== status) return false;
    if (country && s.country !== country) return false;
    return true;
  });

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="text-center py-16">
      <p className="text-red-400 text-sm mb-2">Failed to load stakeholders</p>
      <p className="text-slate-500 text-xs">{error}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-0.5">
            {filtered.length} of {stakeholders.length} stakeholders
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Link href="/stakeholders/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add Stakeholder
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or category…"
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={category}
          onChange={setCategory}
          options={STAKEHOLDER_CATEGORIES.map((c) => ({ value: c, label: c }))}
          placeholder="All Categories"
          className="w-48"
        />
        <Select
          value={status}
          onChange={setStatus}
          options={STATUSES.map((s) => ({ value: s, label: s }))}
          placeholder="All Statuses"
          className="w-36"
        />
        <Select
          value={country}
          onChange={setCountry}
          options={countries.map((c) => ({ value: c, label: c }))}
          placeholder="All Countries"
          className="w-40"
        />
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setView('table')}
            className={cn('px-2 py-1 rounded text-xs font-medium transition-colors', view === 'table' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300')}
          >
            Table
          </button>
          <button
            onClick={() => setView('grid')}
            className={cn('px-2 py-1 rounded text-xs font-medium transition-colors', view === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300')}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <Card>
          {filtered.length === 0 ? (
            <EmptyState
              title={stakeholders.length === 0 ? 'No stakeholders yet' : 'No results found'}
              subtitle={stakeholders.length === 0 ? 'Import existing data or add your first stakeholder' : 'Try adjusting your search or filters'}
              action={
                stakeholders.length === 0 ? (
                  <div className="flex gap-2">
                    <Link href="/import"><Button variant="secondary" size="sm"><Plus className="h-4 w-4" /> Import from Excel</Button></Link>
                    <Link href="/stakeholders/new"><Button size="sm"><Plus className="h-4 w-4" /> Add Stakeholder</Button></Link>
                  </div>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Organization', 'Category', 'Country', 'Status', 'Alignment', 'Last Updated', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((s) => (
                    <tr key={s.id} className="table-row-hover">
                      <td className="px-4 py-3.5">
                        <Link href={`/stakeholders/${s.id}`} className="flex items-center gap-3 group">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500/15 to-indigo-500/15 border border-white/10 flex items-center justify-center shrink-0 text-sky-400 font-bold text-sm">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-200 group-hover:text-white transition-colors leading-tight">
                              {s.name}
                            </div>
                            {s.organization_type && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{s.organization_type}</div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5"><Badge label={s.category} type="category" /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {s.county ? `${s.county}, ` : ''}{s.country ?? '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><Badge label={s.status} type="status" /></td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-xs text-slate-400 truncate" title={s.strategic_alignment ?? ''}>
                          {s.strategic_alignment ?? '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {formatRelativeDate(s.updated_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/stakeholders/${s.id}`}>
                          <button className="text-slate-500 hover:text-sky-400 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title={stakeholders.length === 0 ? 'No stakeholders yet' : 'No results found'}
                subtitle="Import data or add your first stakeholder"
                action={<Link href="/stakeholders/new"><Button size="sm"><Plus className="h-4 w-4" /> Add Stakeholder</Button></Link>}
              />
            </div>
          ) : (
            filtered.map((s) => (
              <Link key={s.id} href={`/stakeholders/${s.id}`}>
                <div className="glass-card rounded-xl border border-white/[0.06] p-4 hover:border-sky-500/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-sky-400 font-bold shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <Badge label={s.status} type="status" />
                  </div>
                  <h3 className="text-sm font-semibold text-white leading-snug mb-0.5 line-clamp-2">{s.name}</h3>
                  <p className="text-[11px] text-slate-500 mb-3">{s.organization_type}</p>
                  <Badge label={s.category} type="category" />
                  <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-3 text-[11px] text-slate-500">
                    {s.country && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {s.county ?? s.country}
                      </div>
                    )}
                    {s.assigned_officer && (
                      <div className="truncate">{s.assigned_officer}</div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
