'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, TrendingUp, Handshake, CalendarCheck,
  AlertTriangle, DollarSign, CheckCircle2, Clock,
  ArrowRight, Building2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getDashboardStats, getFollowUps, getStakeholders, getOpportunities } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Card, Button, LoadingSpinner } from '@/components/ui/index';
import { MetricCard } from '@/components/ui/MetricCard';
import { formatCurrency, formatDate, isOverdue } from '@/lib/utils';
import type { FollowUp, Stakeholder, Opportunity } from '@/lib/supabase';

const PIE_COLORS = ['#0EA5E9', '#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#14b8a6', '#8b5cf6', '#ec4899'];

const engagementTrend = [
  { month: 'Jan', meetings: 3, emails: 8, proposals: 1 },
  { month: 'Feb', meetings: 5, emails: 12, proposals: 2 },
  { month: 'Mar', meetings: 4, emails: 9, proposals: 1 },
  { month: 'Apr', meetings: 7, emails: 14, proposals: 3 },
  { month: 'May', meetings: 6, emails: 11, proposals: 2 },
  { month: 'Jun', meetings: 2, emails: 5, proposals: 1 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-lg border border-white/10 p-3 shadow-xl">
        <p className="text-xs font-semibold text-white mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs" style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-lg border border-white/10 p-2.5 shadow-xl">
        <p className="text-xs font-semibold text-white">{payload[0].name}</p>
        <p className="text-xs text-sky-400">{payload[0].value} stakeholders</p>
      </div>
    );
  }
  return null;
};

interface Stats {
  totalStakeholders: number;
  activeStakeholders: number;
  totalOpportunities: number;
  overdueFollowUps: number;
  totalFunding: number;
  approvedFunding: number;
  categoryBreakdown: { name: string; value: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentStakeholders, setRecentStakeholders] = useState<Stakeholder[]>([]);
  const [overdueList, setOverdueList] = useState<FollowUp[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getStakeholders(),
      getFollowUps(),
      getOpportunities(),
    ]).then(([s, stakeholders, followups, opps]) => {
      setStats(s);
      setRecentStakeholders(stakeholders.slice(0, 4));
      setOverdueList(followups.filter((f) => !f.completed && isOverdue(f.due_date)));
      setOpportunities(opps);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const categoryData = stats?.categoryBreakdown ?? [];
  const fundingPipeline = ['Identified', 'Researching', 'Applying', 'Submitted', 'Under Review', 'Approved'].map((st) => ({
    status: st,
    count: opportunities.filter((o) => o.status === st).length,
  }));

  const dueToday = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const dueThisWeekCount = opportunities.filter((o) => {
    if (!o.deadline) return false;
    const d = new Date(o.deadline);
    return d >= new Date() && d <= weekEnd;
  }).length;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Stakeholders"
          value={stats?.totalStakeholders ?? 0}
          subtitle={`${stats?.activeStakeholders ?? 0} active`}
          icon={Users}
          iconColor="text-sky-400"
        />
        <MetricCard
          title="Opportunities"
          value={stats?.totalOpportunities ?? 0}
          subtitle={`${opportunities.filter((o) => o.status === 'Approved').length} approved`}
          icon={TrendingUp}
          iconColor="text-indigo-400"
        />
        <MetricCard
          title="Engagements"
          value="—"
          subtitle="This year"
          icon={Handshake}
          iconColor="text-emerald-400"
        />
        <MetricCard
          title="Overdue Follow-Ups"
          value={stats?.overdueFollowUps ?? 0}
          subtitle="Require immediate action"
          icon={AlertTriangle}
          iconColor="text-amber-400"
        />
      </div>

      {/* Funding KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Funding Pipeline"
          value={`$${((stats?.totalFunding ?? 0) / 1000000).toFixed(1)}M`}
          subtitle="All opportunities"
          icon={DollarSign}
          iconColor="text-emerald-400"
        />
        <MetricCard
          title="Funding Approved"
          value={formatCurrency(stats?.approvedFunding ?? 0)}
          subtitle="Confirmed & active"
          icon={CheckCircle2}
          iconColor="text-emerald-400"
        />
        <MetricCard
          title="Upcoming Deadlines"
          value={dueThisWeekCount}
          subtitle="Opportunities due this week"
          icon={CalendarCheck}
          iconColor="text-sky-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Engagement Activity" subtitle="Jan – Jun 2026" className="xl:col-span-2">
          <div className="px-5 pb-5 pt-3">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={engagementTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="meetings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="emails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="meetings" name="Meetings" stroke="#0EA5E9" fill="url(#meetings)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="emails" name="Emails" stroke="#6366f1" fill="url(#emails)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="proposals" name="Proposals" stroke="#f59e0b" fill="none" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Stakeholders by Category">
          <div className="px-4 pb-4 pt-2">
            {categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-slate-500 text-xs">No stakeholders yet.</p>
                <Link href="/stakeholders/new" className="mt-2">
                  <Button variant="ghost" size="sm">Add first stakeholder</Button>
                </Link>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-1">
                  {categoryData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-400 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Funding Pipeline */}
        <Card title="Funding Pipeline" subtitle="By stage" action={
          <Link href="/opportunities"><Button variant="ghost" size="sm">View all <ArrowRight className="h-3 w-3" /></Button></Link>
        }>
          <div className="px-5 pb-5 pt-3">
            {fundingPipeline.every((f) => f.count === 0) ? (
              <div className="py-10 text-center text-slate-500 text-xs">No opportunities yet. <Link href="/opportunities/new" className="text-sky-400 hover:text-sky-300">Add one →</Link></div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={fundingPipeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Opportunities" radius={[4, 4, 0, 0]}>
                    {fundingPipeline.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          {/* Overdue */}
          <Card title="Overdue Follow-Ups" action={
            <Link href="/followups"><Button variant="ghost" size="sm">View all <ArrowRight className="h-3 w-3" /></Button></Link>
          }>
            <div className="px-5 py-3 space-y-2">
              {overdueList.length === 0 ? (
                <p className="text-xs text-emerald-400 py-2">✓ All follow-ups are on track!</p>
              ) : overdueList.slice(0, 3).map((f) => (
                <div key={f.id} className="flex items-start gap-3 py-2 border-b border-white/[0.05] last:border-0">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{f.title}</p>
                    <p className="text-[10px] text-slate-500">Due {formatDate(f.due_date)} · {f.responsible_officer}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Stakeholders */}
          <Card title="Recent Stakeholders" action={
            <Link href="/stakeholders"><Button variant="ghost" size="sm">View all <ArrowRight className="h-3 w-3" /></Button></Link>
          }>
            <div className="px-5 py-3 space-y-2">
              {recentStakeholders.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-500 mb-2">No stakeholders yet.</p>
                  <Link href="/stakeholders/new"><Button size="sm" variant="secondary"><Plus className="h-3.5 w-3.5" /> Add first</Button></Link>
                </div>
              ) : recentStakeholders.map((s) => (
                <Link key={s.id} href={`/stakeholders/${s.id}`} className="flex items-center gap-3 py-1.5 hover:bg-white/[0.03] rounded-lg -mx-2 px-2 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-sky-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500">{s.category}</p>
                  </div>
                  <Badge label={s.status} type="status" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
