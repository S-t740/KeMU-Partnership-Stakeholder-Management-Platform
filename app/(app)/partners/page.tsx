'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Star, TrendingUp, Users, Plus, Briefcase, ChevronDown,
  ChevronUp, ExternalLink, Search, SlidersHorizontal, Globe
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getPartnersByPriority, getStrategicDashboardStats } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Button, Card, EmptyState, LoadingSpinner, Select } from '@/components/ui/index';
import { PartnerPriorityBadge } from '@/components/ui/PriorityBadge';
import {
  cn, PARTNER_PRIORITIES, PROGRAM_AREAS, PROGRAM_COLORS,
  PRIORITY_DOT_COLORS, PROGRAM_HEX, CATEGORY_COLORS,
  formatCurrency
} from '@/lib/utils';
import type { Stakeholder, PartnerPriority } from '@/lib/supabase';

const PRIORITY_ORDER: PartnerPriority[] = [
  'Strategic Priority', 'Growth Opportunity', 'Engagement Priority', 'General Partner',
];

const PRIORITY_GRADIENT: Record<string, string> = {
  'Strategic Priority':  'from-rose-500/10 to-transparent border-rose-500/20',
  'Growth Opportunity':  'from-amber-500/10 to-transparent border-amber-500/20',
  'Engagement Priority': 'from-sky-500/10 to-transparent border-sky-500/20',
  'General Partner':     'from-slate-500/10 to-transparent border-slate-500/20',
};

const PIE_COLORS = ['#f43f5e', '#f59e0b', '#0ea5e9', '#64748b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-lg border border-white/10 p-3 shadow-xl">
        <p className="text-xs font-semibold text-white mb-1">{label ?? payload[0].name}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs" style={{ color: p.color ?? p.fill }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StrategicPartnersPage() {
  const [partners, setPartners] = useState<Stakeholder[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getStrategicDashboardStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([getPartnersByPriority(), getStrategicDashboardStats()])
      .then(([p, s]) => { setPartners(p); setStats(s); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => partners.filter((p) => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !(p.country ?? '').toLowerCase().includes(q)) return false;
    if (programFilter && !(p.program_areas ?? []).includes(programFilter)) return false;
    if (categoryFilter && p.category !== categoryFilter) return false;
    return true;
  }), [partners, search, programFilter, categoryFilter]);

  const grouped = useMemo(() =>
    PRIORITY_ORDER.reduce((acc, tier) => {
      acc[tier] = filtered.filter((p) => p.partner_priority === tier);
      return acc;
    }, {} as Record<PartnerPriority, Stakeholder[]>),
    [filtered]
  );

  if (loading) return <LoadingSpinner />;

  const priorityChartData = (stats?.byPriority ?? []).map((d, i) => ({
    ...d, fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const programChartData = (stats?.byProgram ?? []).map((d) => ({
    ...d, fill: PROGRAM_HEX[d.name] ?? '#6366f1',
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-rose-400" />
            Strategic Partners
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Priority-tiered partner management &amp; programmatic alignment</p>
        </div>
        <Link href="/stakeholders/new">
          <Button size="sm"><Plus className="h-4 w-4" /> Add Partner</Button>
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PRIORITY_ORDER.map((tier, i) => (
          <div key={tier} className={cn('metric-card border bg-gradient-to-br', PRIORITY_GRADIENT[tier])}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT_COLORS[tier])} />
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide truncate">{tier}</p>
            </div>
            <p className="text-2xl font-bold text-white">{partners.filter((p) => p.partner_priority === tier).length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">partners</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Partners by Priority" subtitle="Distribution across tiers">
          <div className="px-5 pb-5 pt-3">
            {priorityChartData.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No data yet</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={priorityChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                      {priorityChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {priorityChartData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                        <span className="text-slate-400 text-[11px] truncate max-w-[130px]">{d.name}</span>
                      </div>
                      <span className="text-white font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Partners by Program Area" subtitle="Programmatic reach">
          <div className="px-5 pb-5 pt-3">
            {programChartData.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">Tag partners with program areas to see this chart</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={programChartData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Partners" radius={[0, 4, 4, 0]}>
                    {programChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners…"
            className="form-input pl-9 w-full text-sm"
          />
        </div>

        {/* Program area chip filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setProgramFilter('')}
            className={cn('px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all',
              programFilter === '' ? 'bg-white/10 text-white border-white/20' : 'text-slate-400 border-white/10 hover:border-white/20')}
          >
            All Programs
          </button>
          {PROGRAM_AREAS.map((prog) => (
            <button
              key={prog}
              onClick={() => setProgramFilter(prog === programFilter ? '' : prog)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all',
                programFilter === prog ? PROGRAM_COLORS[prog] : 'text-slate-500 border-white/10 hover:border-white/20'
              )}
            >
              {prog}
            </button>
          ))}
        </div>
      </div>

      {/* Priority tier swimlanes */}
      <div className="space-y-4">
        {PRIORITY_ORDER.map((tier) => {
          const tierPartners = grouped[tier];
          const isCollapsed = collapsed[tier];
          return (
            <div key={tier} className={cn('glass-card rounded-xl border', PRIORITY_GRADIENT[tier].split(' ').slice(-1)[0])}>
              {/* Tier header */}
              <button
                onClick={() => setCollapsed((prev) => ({ ...prev, [tier]: !prev[tier] }))}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors rounded-t-xl"
              >
                <div className="flex items-center gap-3">
                  <span className={cn('h-2.5 w-2.5 rounded-full shadow-lg', PRIORITY_DOT_COLORS[tier])} />
                  <span className="text-sm font-semibold text-white">{tier}</span>
                  <span className="text-[11px] text-slate-500 bg-white/5 rounded px-2 py-0.5">{tierPartners.length}</span>
                </div>
                {isCollapsed ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
              </button>

              {!isCollapsed && (
                <div className="p-4">
                  {tierPartners.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-6">
                      No {tier.toLowerCase()} partners {programFilter ? `for "${programFilter}"` : ''} yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {tierPartners.map((partner) => (
                        <PartnerCard key={partner.id} partner={partner} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && partners.length > 0 && (
        <Card>
          <EmptyState
            icon={<SlidersHorizontal className="h-8 w-8" />}
            title="No partners match your filters"
            subtitle="Try adjusting the search or program area selection"
            action={<Button variant="secondary" size="sm" onClick={() => { setSearch(''); setProgramFilter(''); }}>Clear filters</Button>}
          />
        </Card>
      )}

      {partners.length === 0 && (
        <Card>
          <EmptyState
            icon={<Star className="h-10 w-10" />}
            title="No partners yet"
            subtitle="Add stakeholders and assign priority tiers to get started"
            action={<Link href="/stakeholders/new"><Button size="sm"><Plus className="h-4 w-4" /> Add First Partner</Button></Link>}
          />
        </Card>
      )}
    </div>
  );
}

function PartnerCard({ partner }: { partner: Stakeholder }) {
  return (
    <Link href={`/stakeholders/${partner.id}`} className="group block">
      <div className="glass-card rounded-lg border border-white/[0.06] p-4 h-full hover:border-white/15 transition-all duration-200 hover:-translate-y-0.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center">
            <Globe className="h-4 w-4 text-sky-400" />
          </div>
          <Badge label={partner.status} type="status" />
        </div>

        <p className="text-sm font-semibold text-white leading-snug mb-0.5 group-hover:text-sky-300 transition-colors">
          {partner.name}
        </p>
        <p className="text-[10px] text-slate-500 mb-3">{partner.category} {partner.country ? `· ${partner.country}` : ''}</p>

        {/* Program tags */}
        {(partner.program_areas ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {(partner.program_areas ?? []).slice(0, 2).map((prog) => (
              <span key={prog} className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium border', PROGRAM_COLORS[prog])}>
                {prog}
              </span>
            ))}
            {(partner.program_areas ?? []).length > 2 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] text-slate-500 bg-white/5">
                +{(partner.program_areas ?? []).length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <PartnerPriorityBadge priority={partner.partner_priority} />
          <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
