'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Users, Briefcase } from 'lucide-react';
import { getEngagements } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button, Card, EmptyState, Select, LoadingSpinner } from '@/components/ui/index';
import { ENGAGEMENT_TYPES, formatDate, cn } from '@/lib/utils';
import type { Engagement } from '@/lib/supabase';

const ENGAGEMENT_ICONS: Record<string, string> = {
  'Phone Call': '📞', 'Meeting': '🤝', 'Email': '✉️',
  'Proposal Submission': '📄', 'Event Attendance': '🎪',
  'Partnership Discussion': '💬', 'Other': '📝',
};
const ENGAGEMENT_COLORS: Record<string, string> = {
  'Phone Call': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  'Meeting': 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  'Email': 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  'Proposal Submission': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'Event Attendance': 'bg-pink-500/10 border-pink-500/20 text-pink-400',
  'Partnership Discussion': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'Other': 'bg-slate-500/10 border-slate-500/20 text-slate-400',
};

export default function EngagementsPage() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    getEngagements().then(setEngagements).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = engagements.filter((e) => {
    const q = search.toLowerCase();
    const stName = (e.stakeholders as any)?.name ?? '';
    if (q && !stName.toLowerCase().includes(q) && !e.summary.toLowerCase().includes(q)) return false;
    if (type && e.engagement_type !== type) return false;
    return true;
  });

  const groups = filtered.reduce<Record<string, Engagement[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(groups).sort().reverse();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search engagements…" className="w-64" />
          <Select value={type} onChange={setType} options={ENGAGEMENT_TYPES.map((t) => ({ value: t, label: t }))} placeholder="All Types" className="w-48" />
        </div>
        <Link href="/engagements/new"><Button size="sm"><Plus className="h-4 w-4" /> Log Engagement</Button></Link>
      </div>

      {/* Type summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ENGAGEMENT_TYPES.slice(0, 4).map((t) => {
          const count = engagements.filter((e) => e.engagement_type === t).length;
          return (
            <button key={t} onClick={() => setType(type === t ? '' : t)}
              className={cn('glass-card rounded-xl p-3 text-left transition-all hover:border-white/15', type === t ? 'border-sky-500/30 bg-sky-500/5' : '')}>
              <div className="text-lg mb-1">{ENGAGEMENT_ICONS[t]}</div>
              <div className="text-lg font-bold text-white">{count}</div>
              <div className="text-[11px] text-slate-400">{t}</div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Briefcase className="h-10 w-10" />} title="No engagements yet"
            subtitle="Log your first interaction with a stakeholder"
            action={<Link href="/engagements/new"><Button size="sm"><Plus className="h-4 w-4" /> Log Engagement</Button></Link>} />
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />{formatDate(date)}
                </div>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-slate-600">{groups[date].length} engagement{groups[date].length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {groups[date].map((e) => (
                  <Card key={e.id}>
                    <div className="px-5 py-4 flex items-start gap-4">
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-base', ENGAGEMENT_COLORS[e.engagement_type])}>
                        {ENGAGEMENT_ICONS[e.engagement_type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-semibold text-white">{e.engagement_type}</span>
                          {(e.stakeholders as any)?.name && (
                            <Link href={`/stakeholders/${e.stakeholder_id}`} className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300">
                              <Users className="h-3 w-3" />{(e.stakeholders as any).name}
                            </Link>
                          )}
                          {e.responsible_officer && <span className="text-[11px] text-slate-500">{e.responsible_officer}</span>}
                        </div>
                        <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{e.summary}</p>
                        {e.outcome && (
                          <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                            <span className="text-[11px] font-semibold text-emerald-400">Outcome: </span>
                            <span className="text-[11px] text-slate-300">{e.outcome}</span>
                          </div>
                        )}
                        {e.follow_up_required && e.follow_up_date && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300">
                            <Calendar className="h-3 w-3" />Follow-up due {formatDate(e.follow_up_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
