'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList, Users2, CheckCircle2, AlertTriangle,
  Clock, TrendingUp, Plus, ArrowRight, Activity, User
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getFollowUps, getCoordinationStats, getActivityLog } from '@/lib/db';
import { Button, Card, LoadingSpinner, EmptyState } from '@/components/ui/index';
import { TaskPriorityBadge } from '@/components/ui/PriorityBadge';
import { ActivityFeed } from '@/components/ui/ActivityFeed';
import {
  cn, formatDate, isOverdue, daysUntil,
  FOLLOWUP_STATUS_COLORS, TASK_PRIORITY_DOT
} from '@/lib/utils';
import type { FollowUp, ActivityLogEntry } from '@/lib/supabase';

const STATUS_PIE_COLORS: Record<string, string> = {
  'Pending':     '#64748b',
  'In Progress': '#0ea5e9',
  'Completed':   '#10b981',
  'On Hold':     '#f59e0b',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-lg border border-white/10 p-2.5 shadow-xl">
        <p className="text-xs font-semibold text-white">{payload[0].name}</p>
        <p className="text-xs text-slate-300">{payload[0].value} tasks</p>
      </div>
    );
  }
  return null;
};

export default function CoordinationHubPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getCoordinationStats>> | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getFollowUps(),
      getCoordinationStats(),
      getActivityLog(undefined, 40),
    ]).then(([fu, st, log]) => {
      setFollowups(fu);
      setStats(st);
      setActivityLog(log);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const now = new Date();
  const overdueItems = followups.filter((f) => isOverdue(f.due_date) && f.status !== 'Completed');
  const myTasks = followups.filter((f) => f.status !== 'Completed').slice(0, 8);

  const pieData = Object.entries(stats?.byStatus ?? {}).map(([name, value]) => ({
    name, value: value as number, fill: STATUS_PIE_COLORS[name] ?? '#64748b',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-400" />
            Coordination Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Follow-up management, team oversight &amp; activity log</p>
        </div>
        <Link href="/followups/new"><Button size="sm"><Plus className="h-4 w-4" /> New Task</Button></Link>
      </div>

      {/* Overdue escalation banner */}
      {overdueItems.length > 0 && (
        <div className="glass-card rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  {overdueItems.length} Overdue Task{overdueItems.length > 1 ? 's' : ''} Require Attention
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {overdueItems.slice(0, 2).map((f) => f.title).join(' · ')}
                  {overdueItems.length > 2 ? ` and ${overdueItems.length - 2} more` : ''}
                </p>
              </div>
            </div>
            <Link href="/followups">
              <Button variant="danger" size="sm">View Overdue <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: stats?.totalTasks ?? 0, color: 'text-slate-200', icon: ClipboardList },
          { label: 'In Progress', value: stats?.byStatus?.['In Progress'] ?? 0, color: 'text-sky-400', icon: TrendingUp },
          { label: 'Overdue', value: overdueItems.length, color: 'text-red-400', icon: AlertTriangle },
          { label: 'Completion Rate', value: `${stats?.completionRate ?? 0}%`, color: 'text-emerald-400', icon: CheckCircle2 },
        ].map((stat) => (
          <div key={stat.label} className="metric-card">
            <div className="flex items-center gap-2 mb-1.5">
              <stat.icon className={cn('h-4 w-4', stat.color)} />
              <span className="text-xs text-slate-400">{stat.label}</span>
            </div>
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* My Tasks (2/3 wide) */}
        <div className="xl:col-span-2 space-y-4">
          <Card
            title="Open Tasks"
            subtitle="Priority-ordered, all assignees"
            action={<Link href="/followups"><Button variant="ghost" size="sm">View all <ArrowRight className="h-3 w-3" /></Button></Link>}
          >
            <div className="px-5 py-3 space-y-2">
              {myTasks.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-8 w-8" />}
                  title="All tasks completed!"
                  subtitle="No open tasks right now"
                />
              ) : myTasks.map((f) => {
                const days = daysUntil(f.due_date);
                const over = isOverdue(f.due_date);
                return (
                  <div key={f.id} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                    {/* Priority dot */}
                    <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', TASK_PRIORITY_DOT[f.priority])} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{f.title}</p>
                          <Link href={`/stakeholders/${f.stakeholder_id}`} className="text-[10px] text-sky-400 hover:text-sky-300">
                            {(f.stakeholders as any)?.name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                            FOLLOWUP_STATUS_COLORS[f.status]
                          )}>{f.status}</span>
                          <TaskPriorityBadge priority={f.priority} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                        <span className={cn('flex items-center gap-1', over ? 'text-red-400' : '')}>
                          <Clock className="h-3 w-3" />
                          {over ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `In ${days}d`}
                          {' · '}{formatDate(f.due_date)}
                        </span>
                        {(f.assigned_to ?? f.responsible_officer) && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {f.assigned_to ?? f.responsible_officer}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Team Overview */}
          <Card title="Team Overview" subtitle="Task completion by assignee">
            {(stats?.byAssignee ?? []).length === 0 ? (
              <EmptyState
                icon={<Users2 className="h-8 w-8" />}
                title="No assigned tasks yet"
                subtitle="Assign tasks to team members to track here"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Team Member', 'Total', 'Completed', 'Overdue', 'Rate'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(stats?.byAssignee ?? []).map((member) => {
                      const rate = member.total === 0 ? 0 : Math.round((member.completed / member.total) * 100);
                      return (
                        <tr key={member.name} className="table-row-hover">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-500/30 to-indigo-500/30 border border-white/10 flex items-center justify-center">
                                <User className="h-3.5 w-3.5 text-sky-300" />
                              </div>
                              <span className="text-xs font-medium text-slate-200">{member.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300">{member.total}</td>
                          <td className="px-4 py-3 text-xs text-emerald-400">{member.completed}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className={cn(member.overdue > 0 ? 'text-red-400' : 'text-slate-500')}>{member.overdue}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[80px]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-slate-400">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Donut + Activity Log */}
        <div className="space-y-4">
          {/* Task status donut */}
          <Card title="Task Status" subtitle="All tasks">
            <div className="px-4 pb-4 pt-2">
              {pieData.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No tasks yet</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                        {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-1">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                          <span className="text-slate-400 text-[11px]">{d.name}</span>
                        </div>
                        <span className="text-white font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Activity Log */}
          <Card
            title="Activity Log"
            subtitle="Recent platform changes"
            action={<Activity className="h-3.5 w-3.5 text-slate-500" />}
          >
            <div className="px-5 py-4 max-h-[420px] overflow-y-auto">
              <ActivityFeed entries={activityLog} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
