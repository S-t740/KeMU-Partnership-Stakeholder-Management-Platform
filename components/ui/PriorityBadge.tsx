'use client';

import { cn, PRIORITY_COLORS, PRIORITY_DOT_COLORS, TASK_PRIORITY_COLORS, TASK_PRIORITY_DOT } from '@/lib/utils';
import type { PartnerPriority, TaskPriority } from '@/lib/supabase';

interface PartnerPriorityBadgeProps {
  priority: PartnerPriority;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function PartnerPriorityBadge({ priority, size = 'sm', dot = true }: PartnerPriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        PRIORITY_COLORS[priority]
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', PRIORITY_DOT_COLORS[priority])} />}
      {priority}
    </span>
  );
}

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

export function TaskPriorityBadge({ priority, size = 'sm' }: TaskPriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        TASK_PRIORITY_COLORS[priority]
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', TASK_PRIORITY_DOT[priority])} />
      {priority}
    </span>
  );
}
