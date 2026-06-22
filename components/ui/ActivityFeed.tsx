'use client';

import { cn, FOLLOWUP_STATUS_COLORS, formatDate, formatRelativeDate, ACTIVITY_TABLE_LABELS, ACTIVITY_ACTION_COLORS } from '@/lib/utils';
import type { ActivityLogEntry } from '@/lib/supabase';
import { GitCommitHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';

interface ActivityFeedProps {
  entries: ActivityLogEntry[];
  emptyMessage?: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  INSERT: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
};

export function ActivityFeed({ entries, emptyMessage = 'No activity recorded yet.' }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GitCommitHorizontal className="h-8 w-8 text-slate-600 mb-3" />
        <p className="text-xs text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, ActivityLogEntry[]> = {};
  entries.forEach((e) => {
    const day = new Date(e.performed_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  });

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day}>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">{day}</p>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-white/[0.06]" />
            <div className="space-y-3">
              {items.map((entry) => {
                const Icon = ACTION_ICONS[entry.action] ?? GitCommitHorizontal;
                const actionColor = ACTIVITY_ACTION_COLORS[entry.action] ?? 'text-slate-400';
                const tableLabel = ACTIVITY_TABLE_LABELS[entry.table_name] ?? entry.table_name;
                return (
                  <div key={entry.id} className="flex gap-4 pl-1">
                    {/* Dot */}
                    <div className={cn('relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0B1121] border border-white/10', actionColor)}>
                      <Icon className="h-2.5 w-2.5" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-3 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-200">
                            <span className={cn('font-semibold', actionColor)}>
                              {entry.action === 'INSERT' ? 'Created' : entry.action === 'UPDATE' ? 'Updated' : 'Deleted'}
                            </span>
                            {' '}{tableLabel}
                            {entry.record_label && (
                              <span className="text-slate-400"> · {entry.record_label}</span>
                            )}
                          </p>
                          {entry.performed_by_name && (
                            <p className="text-[10px] text-slate-500 mt-0.5">by {entry.performed_by_name}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-600 shrink-0 mt-0.5">
                          {formatRelativeDate(entry.performed_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
