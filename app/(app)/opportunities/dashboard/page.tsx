'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3, Calendar, DollarSign, TrendingUp, AlertTriangle,
  Clock, ArrowRight, Plus, Filter, Flame
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  FunnelChart, Funnel, LabelList
} from 'recharts';
import { getOpportunities } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Button, Card, EmptyState, LoadingSpinner, Select } from '@/components/ui/index';
import { cn, formatCurrency, formatDate, daysUntil, isOverdue, OPPORTUNITY_STATUSES } from '@/lib/utils';
import type { Opportunity } from '@/lib/supabase';

const FUNNEL_STAGES = ['Identified', 'Researching', 'Applying', 'Submitted', 'Under Review', 'Approved'];

const STAGE_COLORS: Record<string, string> = {
  Identified: '#64748b', Researching: '#3b82f6', Applying: '#a855f7',
  Submitted: '#eab308', 'Under Review': '#f97316', Approved: '#10b981',
};

const DEADLINE_URGENCY = (days: number) => {
  if (days < 0) return { label: 'Overdue', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  if (days === 0) return { label: 'Due Today', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  if (days <= 7) return { label: `${days}d left`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  if (days <= 30) return { label: `${days}d left`, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
  return { label: `${days}d left`, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-lg border border-white/10 p-3 shadow-xl">
        <p className="text-xs font-semibold text-white mb-1">{label ?? payload[0].name}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs text-slate-300">
            {p.name}: <span style={{ color: p.fill ?? p.color }}>{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function OpportunityDashboardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'7' | '30' | '90' | ''>('');

  useEffect(() => {
    getOpportunities().then(setOpportunities).finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const active = useMemo(() => opportunities.filter((o) =>
    !['Rejected', 'Closed'].includes(o.status)
  ), [opportunities]);

  const withDeadline = useMemo(() => active.filter((o) => o.deadline), [active]);

  const filtered = useMemo(() => withDeadline.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (urgencyFilter && o.deadline) {
      const d = daysUntil(o.deadline);
      if (urgencyFilter === '7' && d > 7) return false;
      if (urgencyFilter === '30' && d > 30) return false;
      if (urgencyFilter === '90' && d > 90) return false;
    }
    return true;
  }).sort((a, b) => {
    const da = daysUntil(a.deadline!);
    const db = daysUntil(b.deadline!);
    return da - db;
  }), [withDeadline, statusFilter, urgencyFilter]);

  if (loading) return <LoadingSpinner />;

  // KPIs
  const overdue = withDeadline.filter((o) => o.deadline && isOverdue(o.deadline) && o.status !== 'Approved');
  const dueSoon = withDeadline.filter((o) => { const d = daysUntil(o.deadline!); return d >= 0 && d <= 14; });
  const totalPipeline = active.reduce((s, o) => s + (o.funding_amount ?? 0), 0);
  const approved = opportunities.filter((o) => o.status === 'Approved').reduce((s, o) => s + (o.funding_amount ?? 0), 0);

  // Funnel data
  const funnelData = FUNNEL_STAGES.map((stage) => ({
    name: stage,
    value: opportunities.filter((o) => o.status === stage).length,
    fill: STAGE_COLORS[stage],
  }));

  // Officer breakdown
  const officerMap: Record<string, { count: number; value: number }> = {};
  active.forEach((o) => {
    const name = o.responsible_officer ?? 'Unassigned';
    if (!officerMap[name]) officerMap[name] = { count: 0, value: 0 };
    officerMap[name].count++;
    officerMap[name].value += o.funding_amount ?? 0;
  });
  const officerData = Object.entries(officerMap).map(([name, d]) => ({ name, ...d }));

  // Top high-value opportunities
  const highValue = [...active]
    .filter((o) => o.funding_amount)
    .sort((a, b) => (b.funding_amount ?? 0) - (a.funding_amount ?? 0))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            Opportunity Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Grant tracking, deadline monitoring &amp; funding pipeline analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/opportunities"><Button variant="secondary" size="sm">All Opportunities <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
          <Link href="/opportunities/new"><Button size="sm"><Plus className="h-4 w-4" /> Add Opportunity</Button></Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1.5"><TrendingUp className="h-4 w-4 text-indigo-400" /><span className="text-xs text-slate-400">Active Pipeline</span></div>
          <p className="text-2xl font-bold text-white">{active.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">${(totalPipeline / 1_000_000).toFixed(1)}M total value</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1.5"><DollarSign className="h-4 w-4 text-emerald-400" /><span className="text-xs text-slate-400">Approved</span></div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(approved)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{opportunities.filter((o) => o.status === 'Approved').length} grants</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1.5"><Clock className="h-4 w-4 text-amber-400" /><span className="text-xs text-slate-400">Due in 14 Days</span></div>
          <p className="text-2xl font-bold text-amber-400">{dueSoon.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">require action soon</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1.5"><AlertTriangle className="h-4 w-4 text-red-400" /><span className="text-xs text-slate-400">Overdue</span></div>
          <p className="text-2xl font-bold text-red-400">{overdue.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">missed deadlines</p>
        </div>
      </div>

      {/* High-value alert */}
      {highValue.length > 0 && (
        <div className="glass-card rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">High-Value Opportunities</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {highValue.map((o) => {
              const days = o.deadline ? daysUntil(o.deadline) : null;
              const urgency = days !== null ? DEADLINE_URGENCY(days) : null;
              return (
                <Link key={o.id} href="/opportunities" className="group block">
                  <div className="bg-black/20 rounded-lg border border-white/[0.06] p-3 hover:border-white/15 transition-all">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-sky-300 transition-colors">{o.name}</p>
                    <p className="text-[10px] text-sky-400 truncate mb-2">{(o.stakeholders as any)?.name}</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(o.funding_amount ?? 0, o.currency)}</p>
                    {urgency && (
                      <span className={cn('mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border', urgency.color)}>
                        <Calendar className="h-2.5 w-2.5" /> {urgency.label}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Pipeline funnel */}
        <Card title="Pipeline Stage Funnel" subtitle="Active opportunities by stage">
          <div className="px-5 pb-5 pt-3">
            {funnelData.every((d) => d.value === 0) ? (
              <p className="text-xs text-slate-500 py-8 text-center">No opportunities yet</p>
            ) : (
              <div className="space-y-2">
                {funnelData.map((stage) => {
                  const max = Math.max(...funnelData.map((d) => d.value), 1);
                  const pct = stage.value === 0 ? 0 : Math.max((stage.value / max) * 100, 10);
                  return (
                    <div key={stage.name} className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 w-24 shrink-0 text-right">{stage.name}</span>
                      <div className="flex-1 h-7 bg-white/5 rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md flex items-center justify-end pr-2 transition-all duration-700"
                          style={{ width: `${pct}%`, background: stage.fill }}
                        >
                          {stage.value > 0 && (
                            <span className="text-[10px] text-white font-semibold">{stage.value}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Officer breakdown */}
        <Card title="By Responsible Officer" subtitle="Active opportunities">
          <div className="px-5 pb-5 pt-3">
            {officerData.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={officerData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Opportunities" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Deadline table */}
      <Card title="Upcoming Deadlines" subtitle="Sorted by urgency" action={
        <div className="flex items-center gap-2">
          <Select
            value={urgencyFilter}
            onChange={(v) => setUrgencyFilter(v as any)}
            options={[{ value: '7', label: 'Next 7 days' }, { value: '30', label: 'Next 30 days' }, { value: '90', label: 'Next 90 days' }]}
            placeholder="All deadlines"
            className="w-36"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={OPPORTUNITY_STATUSES.map((s) => ({ value: s, label: s }))}
            placeholder="All stages"
            className="w-32"
          />
        </div>
      }>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-8 w-8" />}
            title="No opportunities with upcoming deadlines"
            subtitle="Add deadline dates to opportunities to track them here"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Opportunity', 'Organization', 'Amount', 'Deadline', 'Urgency', 'Stage', 'Officer'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((o) => {
                  const days = daysUntil(o.deadline!);
                  const urgency = DEADLINE_URGENCY(days);
                  return (
                    <tr key={o.id} className="table-row-hover">
                      <td className="px-4 py-3.5"><p className="font-medium text-slate-200">{o.name}</p></td>
                      <td className="px-4 py-3.5"><span className="text-xs text-sky-400">{(o.stakeholders as any)?.name ?? '—'}</span></td>
                      <td className="px-4 py-3.5">{o.funding_amount ? <span className="text-xs font-semibold text-emerald-400">{formatCurrency(o.funding_amount, o.currency)}</span> : <span className="text-slate-500">—</span>}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">{formatDate(o.deadline!)}</td>
                      <td className="px-4 py-3.5">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border', urgency.color)}>
                          {urgency.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><Badge label={o.status} type="opportunity" /></td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">{o.responsible_officer ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
