'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/index';
import { createEngagement, getStakeholders } from '@/lib/db';
import { ENGAGEMENT_TYPES } from '@/lib/utils';
import type { Stakeholder } from '@/lib/supabase';

export default function NewEngagementPage() {
  const router = useRouter();
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpRequired, setFollowUpRequired] = useState(false);

  const [form, setForm] = useState({
    stakeholder_id: '',
    engagement_type: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    outcome: '',
    responsible_officer: '',
    follow_up_date: '',
  });

  useEffect(() => {
    getStakeholders().then(setStakeholders).catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stakeholder_id || !form.engagement_type || !form.date || !form.summary) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createEngagement({
        stakeholder_id: form.stakeholder_id,
        engagement_type: form.engagement_type as any,
        date: form.date,
        summary: form.summary,
        outcome: form.outcome || undefined,
        responsible_officer: form.responsible_officer || undefined,
        follow_up_required: followUpRequired,
        follow_up_date: followUpRequired && form.follow_up_date ? form.follow_up_date : undefined,
      });
      router.push('/engagements');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/engagements">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <h1 className="text-lg font-bold text-white">Log New Engagement</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl border border-white/[0.06] p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Stakeholder <span className="text-red-400">*</span></label>
            <select className="form-input" value={form.stakeholder_id} onChange={(e) => set('stakeholder_id', e.target.value)} required>
              <option value="">Select stakeholder…</option>
              {stakeholders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Engagement Type <span className="text-red-400">*</span></label>
            <select className="form-input" value={form.engagement_type} onChange={(e) => set('engagement_type', e.target.value)} required>
              <option value="">Select type…</option>
              {ENGAGEMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Date <span className="text-red-400">*</span></label>
            <input type="date" className="form-input" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Responsible Officer</label>
            <input className="form-input" placeholder="Officer name" value={form.responsible_officer} onChange={(e) => set('responsible_officer', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Follow-up Required?</label>
            <select className="form-input" value={followUpRequired ? 'yes' : 'no'} onChange={(e) => setFollowUpRequired(e.target.value === 'yes')}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          {followUpRequired && (
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Follow-up Date</label>
              <input type="date" className="form-input" value={form.follow_up_date} onChange={(e) => set('follow_up_date', e.target.value)} />
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1.5">Summary <span className="text-red-400">*</span></label>
          <textarea className="form-input min-h-[100px] resize-none" placeholder="What was discussed or done?" value={form.summary} onChange={(e) => set('summary', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1.5">Outcome</label>
          <textarea className="form-input min-h-[80px] resize-none" placeholder="What was the result?" value={form.outcome} onChange={(e) => set('outcome', e.target.value)} />
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}

        <div className="pt-2 flex gap-3">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Engagement'}
          </Button>
          <Link href="/engagements"><Button variant="secondary" type="button">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
