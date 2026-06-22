'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, CheckCircle2, Clock, AlertTriangle, Calendar,
  Users2, Briefcase, GripVertical, Filter, Search
} from 'lucide-react';
import { getFollowUps, updateFollowUpStatus } from '@/lib/db';
import { Button, Card, EmptyState, LoadingSpinner, Select, Modal } from '@/components/ui/index';
import { TaskPriorityBadge } from '@/components/ui/PriorityBadge';
import {
  cn, formatDate, isOverdue, daysUntil,
  FOLLOW_UP_STATUSES, TASK_PRIORITIES, FOLLOWUP_STATUS_COLORS
} from '@/lib/utils';
import type { FollowUp, FollowUpStatus } from '@/lib/supabase';

const KANBAN_COLUMNS: { status: FollowUpStatus; label: string; icon: React.ElementType; color: string; headerBg: string }[] = [
  { status: 'Pending',     label: 'Pending',     icon: Clock,         color: 'text-slate-300',  headerBg: 'border-t-slate-500' },
  { status: 'In Progress', label: 'In Progress', icon: GripVertical,  color: 'text-sky-400',    headerBg: 'border-t-sky-500'   },
  { status: 'Completed',   label: 'Completed',   icon: CheckCircle2,  color: 'text-emerald-400',headerBg: 'border-t-emerald-500'},
  { status: 'On Hold',     label: 'On Hold',     icon: AlertTriangle, color: 'text-amber-400',  headerBg: 'border-t-amber-500' },
];

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [officerFilter, setOfficerFilter] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    getFollowUps().then(setFollowups).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: FollowUpStatus) => {
    setUpdatingId(id);
    try {
      const updated = await updateFollowUpStatus(id, status);
      setFollowups((prev) => prev.map((f) => f.id === id ? updated : f));
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  if (loading) return <LoadingSpinner />;

  const officers = Array.from(new Set(followups.map((f) => f.assigned_to ?? f.responsible_officer).filter(Boolean) as string[]));

  const filtered = useMemo(() => followups.filter((f) => {
    const q = search.toLowerCase();
    const partnerName = (f.stakeholders as any)?.name ?? '';
    if (q && !f.title.toLowerCase().includes(q) && !partnerName.toLowerCase().includes(q)) return false;
    if (priorityFilter && f.priority !== priorityFilter) return false;
    if (officerFilter) {
      const assignee = f.assigned_to ?? f.responsible_officer;
      if (assignee !== officerFilter) return false;
    }
    return true;
  }), [followups, search, priorityFilter, officerFilter]);

  const byStatus = (status: FollowUpStatus) => filtered.filter((f) => f.status === status);

  // Stats
  const total = filtered.length;
  const today = new Date().toISOString().split('T')[0];
  const dueToday = filtered.filter((f) => f.due_date === today && f.status !== 'Completed').length;
  const overdueCount = filtered.filter((f) => isOverdue(f.due_date) && f.status !== 'Completed').length;
  const completionRate = total === 0 ? 0 : Math.round((byStatus('Completed').length / total) * 100);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: total, color: 'text-slate-200', icon: Clock },
          { label: 'Due Today', value: dueToday, color: 'text-sky-400', icon: Calendar },
          { label: 'Overdue', value: overdueCount, color: 'text-red-400', icon: AlertTriangle },
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'text-emerald-400', icon: CheckCircle2 },
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

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="form-input pl-9 w-48 text-sm"
            />
          </div>
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={TASK_PRIORITIES.map((p) => ({ value: p, label: p }))}
            placeholder="All Priorities"
            className="w-36"
          />
          {officers.length > 0 && (
            <Select
              value={officerFilter}
              onChange={setOfficerFilter}
              options={officers.map((o) => ({ value: o, label: o }))}
              placeholder="All Officers"
              className="w-40"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors', view === 'kanban' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300')}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors', view === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300')}
            >
              List
            </button>
          </div>
          <Link href="/followups/new"><Button size="sm"><Plus className="h-4 w-4" /> New Task</Button></Link>
        </div>
      </div>

      {/* ── Kanban View ── */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {KANBAN_COLUMNS.map((col) => {
              const cards = byStatus(col.status);
              return (
                <div
                  key={col.status}
                  className={cn('w-72 shrink-0 glass-card rounded-xl border border-white/[0.06] border-t-2', col.headerBg)}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <col.icon className={cn('h-4 w-4', col.color)} />
                      <span className="text-sm font-semibold text-white">{col.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 bg-white/5 rounded px-1.5 py-0.5">{cards.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="p-3 space-y-2.5 min-h-[200px]">
                    {cards.length === 0 && (
                      <p className="text-[11px] text-slate-600 text-center py-8">Empty</p>
                    )}
                    {cards.map((f) => (
                      <TaskCard
                        key={f.id}
                        followup={f}
                        currentStatus={col.status}
                        onStatusChange={handleStatusChange}
                        updating={updatingId === f.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── List View ── */}
      {view === 'list' && (
        <Card>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-10 w-10" />}
              title="No tasks match your filters"
              subtitle="Try adjusting your search or filters"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Task', 'Partner', 'Status', 'Priority', 'Due Date', 'Assigned To', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((f) => {
                    const days = daysUntil(f.due_date);
                    const over = isOverdue(f.due_date) && f.status !== 'Completed';
                    return (
                      <tr key={f.id} className="table-row-hover">
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <p className="font-medium text-slate-200 truncate">{f.title}</p>
                          {f.notes && <p className="text-[11px] text-slate-500 truncate mt-0.5">{f.notes}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <Link href={`/stakeholders/${f.stakeholder_id}`} className="text-xs text-sky-400 hover:text-sky-300 truncate block max-w-[130px]">
                            {(f.stakeholders as any)?.name ?? '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', FOLLOWUP_STATUS_COLORS[f.status])}>
                            {f.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5"><TaskPriorityBadge priority={f.priority} /></td>
                        <td className="px-4 py-3.5">
                          <span className={cn('text-xs', over ? 'text-red-400' : 'text-slate-400')}>
                            {formatDate(f.due_date)}
                            {over && ' (overdue)'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-400">{f.assigned_to ?? f.responsible_officer ?? '—'}</td>
                        <td className="px-4 py-3.5">
                          <Select
                            value={f.status}
                            onChange={(v) => handleStatusChange(f.id, v as FollowUpStatus)}
                            options={FOLLOW_UP_STATUSES.map((s) => ({ value: s, label: s }))}
                            className="w-32"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Task Card Component ──────────────────────────────────────────────────────

function TaskCard({
  followup: f,
  currentStatus,
  onStatusChange,
  updating,
}: {
  followup: FollowUp;
  currentStatus: FollowUpStatus;
  onStatusChange: (id: string, status: FollowUpStatus) => void;
  updating: boolean;
}) {
  const days = daysUntil(f.due_date);
  const over = isOverdue(f.due_date) && currentStatus !== 'Completed';
  const partnerName = (f.stakeholders as any)?.name;
  const oppName = (f.opportunities as any)?.name;

  // Next/prev status cycling for quick actions
  const nextStatuses = FOLLOW_UP_STATUSES.filter((s) => s !== currentStatus);

  return (
    <div className={cn(
      'glass-card rounded-lg border border-white/[0.06] p-3 transition-all',
      updating ? 'opacity-50' : 'hover:border-white/15',
      over ? 'border-l-2 border-l-red-500' : ''
    )}>
      {/* Priority + overdue badge */}
      <div className="flex items-center justify-between mb-2">
        <TaskPriorityBadge priority={f.priority} />
        {over && (
          <span className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full font-semibold">
            {Math.abs(days)}d overdue
          </span>
        )}
        {!over && days >= 0 && days <= 3 && (
          <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold">
            In {days}d
          </span>
        )}
      </div>

      <p className="text-xs font-semibold text-white leading-snug mb-1">{f.title}</p>
      {f.notes && <p className="text-[10px] text-slate-500 mb-2 line-clamp-2">{f.notes}</p>}

      {/* Meta */}
      <div className="space-y-1 mb-3">
        {partnerName && (
          <div className="flex items-center gap-1.5 text-[10px] text-sky-400">
            <Users2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{partnerName}</span>
          </div>
        )}
        {oppName && (
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-400">
            <Briefcase className="h-3 w-3 shrink-0" />
            <span className="truncate">{oppName}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{formatDate(f.due_date)}</span>
          {(f.assigned_to ?? f.responsible_officer) && (
            <>
              <span className="text-slate-600">·</span>
              <span className="truncate">{f.assigned_to ?? f.responsible_officer}</span>
            </>
          )}
        </div>
      </div>

      {/* Status actions */}
      <div className="flex gap-1 flex-wrap">
        {nextStatuses.slice(0, 2).map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(f.id, s)}
            disabled={updating}
            className={cn(
              'px-2 py-0.5 rounded text-[9px] font-medium border transition-all hover:bg-white/10',
              FOLLOWUP_STATUS_COLORS[s]
            )}
          >
            → {s}
          </button>
        ))}
      </div>
    </div>
  );
}
