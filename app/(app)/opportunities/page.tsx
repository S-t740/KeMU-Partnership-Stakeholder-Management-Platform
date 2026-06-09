'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, DollarSign, Calendar, TrendingUp, LayoutList, LayoutGrid } from 'lucide-react';
import { getOpportunities } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button, Card, EmptyState, Select, LoadingSpinner } from '@/components/ui/index';
import { OPPORTUNITY_STATUSES, formatCurrency, formatDate, cn, isOverdue } from '@/lib/utils';
import type { Opportunity } from '@/lib/supabase';

const STATUS_ORDER = ['Identified', 'Researching', 'Applying', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Closed'];
const STATUS_BG: Record<string, string> = {
  Identified: 'border-t-slate-400', Researching: 'border-t-blue-400', Applying: 'border-t-purple-400',
  Submitted: 'border-t-yellow-400', 'Under Review': 'border-t-orange-400', Approved: 'border-t-emerald-400',
  Rejected: 'border-t-red-400', Closed: 'border-t-slate-600',
};

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  useEffect(() => {
    getOpportunities().then(setOpportunities).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = opportunities.filter((o) => {
    const q = search.toLowerCase();
    const stName = (o.stakeholders as any)?.name ?? '';
    if (q && !o.name.toLowerCase().includes(q) && !stName.toLowerCase().includes(q)) return false;
    if (status && o.status !== status) return false;
    return true;
  });

  const totalPipeline = filtered.reduce((s, o) => s + (o.funding_amount ?? 0), 0);
  const approved = filtered.filter((o) => o.status === 'Approved').reduce((s, o) => s + (o.funding_amount ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search opportunities…" className="w-56" />
          <Select value={status} onChange={setStatus} options={OPPORTUNITY_STATUSES.map((s) => ({ value: s, label: s }))} placeholder="All Stages" className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            <button onClick={() => setView('kanban')} className={cn('p-1.5 rounded transition-colors', view === 'kanban' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300')}><LayoutGrid className="h-3.5 w-3.5" /></button>
            <button onClick={() => setView('list')} className={cn('p-1.5 rounded transition-colors', view === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300')}><LayoutList className="h-3.5 w-3.5" /></button>
          </div>
          <Link href="/opportunities/new"><Button size="sm"><Plus className="h-4 w-4" /> Add Opportunity</Button></Link>
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card"><p className="text-xs text-slate-400 mb-1">Total Pipeline</p><p className="text-lg font-bold text-white">{filtered.length} deals</p></div>
        <div className="metric-card"><p className="text-xs text-slate-400 mb-1">Pipeline Value</p><p className="text-lg font-bold text-emerald-400">${(totalPipeline / 1000000).toFixed(2)}M</p></div>
        <div className="metric-card"><p className="text-xs text-slate-400 mb-1">Approved Value</p><p className="text-lg font-bold text-emerald-400">{formatCurrency(approved)}</p></div>
        <div className="metric-card"><p className="text-xs text-slate-400 mb-1">Active Deadlines</p><p className="text-lg font-bold text-amber-400">{filtered.filter((o) => o.deadline && !isOverdue(o.deadline) && !['Approved','Rejected','Closed'].includes(o.status)).length}</p></div>
      </div>

      {filtered.length === 0 && (
        <Card><EmptyState icon={<TrendingUp className="h-10 w-10" />} title="No opportunities yet"
          subtitle="Track your first funding or partnership opportunity"
          action={<Link href="/opportunities/new"><Button size="sm"><Plus className="h-4 w-4" /> Add Opportunity</Button></Link>} /></Card>
      )}

      {/* Kanban View */}
      {view === 'kanban' && filtered.length > 0 && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {STATUS_ORDER.map((st) => {
              const cols = filtered.filter((o) => o.status === st);
              return (
                <div key={st} className={cn('kanban-col border-t-2', STATUS_BG[st])}>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-xs font-semibold text-slate-300">{st}</span>
                    <span className="text-[11px] text-slate-500 bg-white/5 rounded px-1.5 py-0.5">{cols.length}</span>
                  </div>
                  {cols.map((o) => (
                    <div key={o.id} className="glass-card rounded-lg border border-white/[0.06] p-3 cursor-pointer hover:border-white/15 transition-all">
                      <p className="text-xs font-semibold text-white leading-snug mb-1">{o.name}</p>
                      <p className="text-[11px] text-sky-400 mb-2 truncate">{(o.stakeholders as any)?.name}</p>
                      {o.funding_amount && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mb-1">
                          <DollarSign className="h-3 w-3" />{formatCurrency(o.funding_amount, o.currency)}
                        </div>
                      )}
                      {o.deadline && (
                        <div className={cn('flex items-center gap-1 text-[11px]', isOverdue(o.deadline) ? 'text-red-400' : 'text-slate-500')}>
                          <Calendar className="h-3 w-3" />{formatDate(o.deadline)}
                        </div>
                      )}
                    </div>
                  ))}
                  {cols.length === 0 && <div className="text-[11px] text-slate-600 text-center py-4">Empty</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && filtered.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Opportunity', 'Organization', 'Amount', 'Deadline', 'Status', 'Officer'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((o) => (
                  <tr key={o.id} className="table-row-hover">
                    <td className="px-4 py-3.5"><p className="font-medium text-slate-200">{o.name}</p></td>
                    <td className="px-4 py-3.5"><span className="text-xs text-sky-400">{(o.stakeholders as any)?.name ?? '—'}</span></td>
                    <td className="px-4 py-3.5">{o.funding_amount ? <span className="text-xs font-semibold text-emerald-400">{formatCurrency(o.funding_amount, o.currency)}</span> : <span className="text-slate-500">—</span>}</td>
                    <td className="px-4 py-3.5">{o.deadline ? <span className={cn('text-xs', isOverdue(o.deadline) ? 'text-red-400' : 'text-slate-400')}>{formatDate(o.deadline)}</span> : <span className="text-slate-500">—</span>}</td>
                    <td className="px-4 py-3.5"><Badge label={o.status} type="opportunity" /></td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">{o.responsible_officer ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
