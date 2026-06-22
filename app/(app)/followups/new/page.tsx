'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/index';
import { getStakeholders, getOpportunities, createFollowUp } from '@/lib/db';
import { TASK_PRIORITIES, FOLLOW_UP_STATUSES } from '@/lib/utils';
import type { Stakeholder, Opportunity } from '@/lib/supabase';

export default function NewFollowUpPage() {
  const router = useRouter();
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    stakeholder_id: '',
    opportunity_id: '',
    title: '',
    notes: '',
    due_date: '',
    status: 'Pending' as string,
    priority: 'Medium' as string,
    responsible_officer: '',
    assigned_to: '',
  });

  useEffect(() => {
    Promise.all([getStakeholders(), getOpportunities()])
      .then(([s, o]) => { setStakeholders(s); setOpportunities(o); })
      .catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Filter opportunities by selected stakeholder
  const filteredOpps = form.stakeholder_id
    ? opportunities.filter((o) => o.stakeholder_id === form.stakeholder_id)
    : opportunities;

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
        opportunity_id: form.opportunity_id || undefined,
        title: form.title,
        notes: form.notes || undefined,
        due_date: form.due_date,
        status: form.status as any,
        priority: form.priority as any,
        responsible_officer: form.responsible_officer || undefined,
        assigned_to: form.assigned_to || undefined,
        completed: form.status === 'Completed',
      });
      router.push('/followups');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="text-xs font-medium text-slate-400 block mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/followups">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <h1 className="text-lg font-bold text-white">Create Task / Follow-Up</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl border border-white/[0.06] p-6 space-y-4">
        
        {/* Partner */}
        <Field label="Partner / Stakeholder" required>
          <select
            className="form-input"
            value={form.stakeholder_id}
            onChange={(e) => { set('stakeholder_id', e.target.value); set('opportunity_id', ''); }}
            required
          >
            <option value="">Select partner…</option>
            {stakeholders.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>

        {/* Title */}
        <Field label="Task Title" required>
          <input
            className="form-input"
            placeholder="e.g. Send proposal follow-up email"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </Field>

        {/* Status + Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Status">
            <select className="form-input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {FOLLOW_UP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className="form-input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        {/* Due Date + Assigned To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Due Date" required>
            <input
              type="date"
              className="form-input"
              value={form.due_date}
              onChange={(e) => set('due_date', e.target.value)}
              required
            />
          </Field>
          <Field label="Assigned To">
            <input
              className="form-input"
              placeholder="e.g. Sarah Kamau"
              value={form.assigned_to}
              onChange={(e) => set('assigned_to', e.target.value)}
            />
          </Field>
        </div>

        {/* Responsible Officer */}
        <Field label="Responsible Officer">
          <input
            className="form-input"
            placeholder="e.g. Partnerships Fellow"
            value={form.responsible_officer}
            onChange={(e) => set('responsible_officer', e.target.value)}
          />
        </Field>

        {/* Linked Opportunity */}
        <Field label="Link to Opportunity (optional)">
          <select
            className="form-input"
            value={form.opportunity_id}
            onChange={(e) => set('opportunity_id', e.target.value)}
          >
            <option value="">No linked opportunity</option>
            {filteredOpps.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          {form.stakeholder_id && filteredOpps.length === 0 && (
            <p className="text-[10px] text-slate-500 mt-1">No opportunities for this partner yet.</p>
          )}
        </Field>

        {/* Notes */}
        <Field label="Notes">
          <textarea
            className="form-input min-h-[100px] resize-none"
            placeholder="Any additional context or instructions…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>
        )}

        <div className="pt-2 flex gap-3">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Create Task'}
          </Button>
          <Link href="/followups">
            <Button variant="secondary" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
