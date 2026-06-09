'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/index';
import { getStakeholders, createFollowUp } from '@/lib/db';
import type { Stakeholder } from '@/lib/supabase';

export default function NewFollowUpPage() {
  const router = useRouter();
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    stakeholder_id: '',
    title: '',
    notes: '',
    due_date: '',
    responsible_officer: '',
  });

  useEffect(() => {
    getStakeholders().then(setStakeholders).catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stakeholder_id || !form.title || !form.due_date) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createFollowUp({
        stakeholder_id: form.stakeholder_id,
        title: form.title,
        notes: form.notes || undefined,
        due_date: form.due_date,
        responsible_officer: form.responsible_officer || undefined,
        completed: false,
      });
      router.push('/followups');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/followups">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <h1 className="text-lg font-bold text-white">Schedule Follow-Up</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl border border-white/[0.06] p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1.5">
            Stakeholder <span className="text-red-400">*</span>
          </label>
          <select
            className="form-input"
            value={form.stakeholder_id}
            onChange={(e) => set('stakeholder_id', e.target.value)}
            required
          >
            <option value="">Select stakeholder…</option>
            {stakeholders.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            className="form-input"
            placeholder="e.g. Send proposal follow-up email"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Due Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={form.due_date}
              onChange={(e) => set('due_date', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Responsible Officer
            </label>
            <input
              className="form-input"
              placeholder="e.g. Sarah Kamau"
              value={form.responsible_officer}
              onChange={(e) => set('responsible_officer', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1.5">Notes</label>
          <textarea
            className="form-input min-h-[100px] resize-none"
            placeholder="Any additional context or instructions…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </p>
        )}

        <div className="pt-2 flex gap-3">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Schedule Follow-Up'}
          </Button>
          <Link href="/followups">
            <Button variant="secondary" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
