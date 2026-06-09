'use client';

import { cn, CATEGORY_COLORS, STATUS_COLORS, OPPORTUNITY_STATUS_COLORS } from '@/lib/utils';

interface BadgeProps {
  label: string;
  type?: 'category' | 'status' | 'opportunity' | 'custom';
  className?: string;
}

export function Badge({ label, type = 'custom', className }: BadgeProps) {
  let colorClass = '';
  if (type === 'category') colorClass = CATEGORY_COLORS[label] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  else if (type === 'status') colorClass = STATUS_COLORS[label] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  else if (type === 'opportunity') colorClass = OPPORTUNITY_STATUS_COLORS[label] ?? 'bg-slate-500/20 text-slate-300';

  return (
    <span className={cn('badge-base', colorClass, className)}>
      {type !== 'custom' && type !== 'opportunity' && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      )}
      {label}
    </span>
  );
}
