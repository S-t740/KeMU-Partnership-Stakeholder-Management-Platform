'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, CheckCircle2, Clock, AlertTriangle, Calendar, Users2 } from 'lucide-react';
import { getFollowUps, completeFollowUp } from '@/lib/db';
import { Button, Card, EmptyState, LoadingSpinner } from '@/components/ui/index';
import { cn, formatDate, isOverdue, daysUntil } from '@/lib/utils';
import type { FollowUp } from '@/lib/supabase';

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all');

  useEffect(() => {
    getFollowUps().then(setFollowups).finally(() => setLoading(false));
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await completeFollowUp(id);
      setFollowups((prev) => prev.map((f) => f.id === id ? { ...f, completed: true } : f));
    } catch (e) { console.error(e); }
  };

  if (loading) return <LoadingSpinner />;

  const today = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);

  const pending = followups.filter((f) => !f.completed);
  const completed = followups.filter((f) => f.completed);
  const overdueList = pending.filter((f) => isOverdue(f.due_date));
  const todayList = pending.filter((f) => f.due_date === today);
  const weekList = pending.filter((f) => {
    const d = new Date(f.due_date);
    return d >= new Date() && d <= weekEnd && f.due_date !== today;
  });

  const displayed = filter === 'overdue' ? overdueList
    : filter === 'today' ? todayList
    : filter === 'week' ? weekList
    : pending;

  return (
    <div className="space-y-5">
      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'All Pending', count: pending.length, icon: Clock, color: 'text-slate-300' },
          { key: 'today', label: 'Due Today', count: todayList.length, icon: Calendar, color: 'text-sky-400' },
          { key: 'week', label: 'Due This Week', count: weekList.length, icon: Calendar, color: 'text-blue-400' },
          { key: 'overdue', label: 'Overdue', count: overdueList.length, icon: AlertTriangle, color: 'text-red-400' },
        ].map((item) => (
          <button key={item.key} onClick={() => setFilter(item.key as any)}
            className={cn('metric-card text-left transition-all', filter === item.key ? 'border-sky-500/30 bg-sky-500/5' : '')}>
            <div className="flex items-center gap-2 mb-1.5">
              <item.icon className={cn('h-4 w-4', item.color)} />
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
            <p className={cn('text-2xl font-bold', item.color)}>{item.count}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Link href="/followups/new"><Button size="sm"><Plus className="h-4 w-4" /> Schedule Follow-Up</Button></Link>
      </div>

      {/* Follow-up list */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CheckCircle2 className="h-10 w-10" />}
              title={filter === 'overdue' ? 'No overdue follow-ups! ✓' : pending.length === 0 ? 'No follow-ups scheduled' : 'No follow-ups in this view'}
              subtitle={pending.length === 0 ? 'Schedule your first follow-up to stay on top of stakeholder engagement' : 'All clear in this category'}
              action={pending.length === 0 ? <Link href="/followups/new"><Button size="sm"><Plus className="h-4 w-4" /> Schedule Follow-Up</Button></Link> : undefined}
            />
          </Card>
        ) : displayed.map((f) => {
          const days = daysUntil(f.due_date);
          const over = isOverdue(f.due_date);
          return (
            <Card key={f.id}>
              <div className="px-5 py-4 flex items-start gap-4">
                <button
                  onClick={() => handleComplete(f.id)}
                  className={cn('mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 transition-all hover:scale-110', over ? 'border-red-500 hover:bg-red-500/20' : 'border-sky-500 hover:bg-sky-500/20')}
                  title="Mark complete"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{f.title}</p>
                      {(f.stakeholders as any)?.name && (
                        <Link href={`/stakeholders/${f.stakeholder_id}`} className="text-xs text-sky-400 hover:text-sky-300">
                          {(f.stakeholders as any).name}
                        </Link>
                      )}
                    </div>
                    <div className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                      over ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                        : days === 0 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/15')}>
                      {over ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                      {over ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `In ${days} days`}
                    </div>
                  </div>
                  {f.notes && <p className="text-xs text-slate-500 mt-1.5">{f.notes}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    {f.responsible_officer && <span className="flex items-center gap-1"><Users2 className="h-3 w-3" />{f.responsible_officer}</span>}
                    <span>{formatDate(f.due_date)}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Completed ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.map((f) => (
              <div key={f.id} className="glass-card rounded-lg border border-white/[0.05] px-5 py-3 flex items-center gap-3 opacity-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 line-through truncate">{f.title}</p>
                  <p className="text-[11px] text-slate-600">{(f.stakeholders as any)?.name} · {formatDate(f.due_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
