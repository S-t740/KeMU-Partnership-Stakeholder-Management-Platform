'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/index';
import { createOpportunity, getStakeholders } from '@/lib/db';
import { OPPORTUNITY_STATUSES } from '@/lib/utils';
import type { Stakeholder } from '@/lib/supabase';

export default function NewOpportunityPage() {
  const router = useRouter();
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    stakeholder_id: '',
    name: '',
    description: '',
    funding_amount: '',
    currency: 'USD',
    deadline: '',
    status: 'Identified',
    responsible_officer: '',
    notes: '',
  });

  useEffect(() => {
    getStakeholders().then(setStakeholders).catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stakeholder_id || !form.name) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createOpportunity({
        stakeholder_id: form.stakeholder_id,
        name: form.name,
        description: form.description || undefined,
        funding_amount: form.funding_amount ? parseFloat(form.funding_amount) : undefined,
        currency: form.currency,
        deadline: form.deadline || undefined,
        status: form.status as any,
        responsible_officer: form.responsible_officer || undefined,
        notes: form.notes || undefined,
      });
      router.push('/opportunities');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/opportunities">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <h1 className="text-lg font-bold text-white">Add New Opportunity</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl border border-white/[0.06] p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Opportunity Name <span className="text-red-400">*</span></label>
            <input className="form-input" placeholder="e.g. Gates Foundation Education RFP 2026" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Organization <span className="text-red-400">*</span></label>
            <select className="form-input" value={form.stakeholder_id} onChange={(e) => set('stakeholder_id', e.target.value)} required>
              <option value="">Select stakeholder…</option>
              {stakeholders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Stage</label>
            <select className="form-input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {OPPORTUNITY_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Responsible Officer</label>
            <input className="form-input" placeholder="Officer name" value={form.responsible_officer} onChange={(e) => set('responsible_officer', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Funding Amount</label>
            <input type="number" className="form-input" placeholder="0" value={form.funding_amount} onChange={(e) => set('funding_amount', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Currency</label>
            <select className="form-input" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              <option>USD</option><option>KES</option><option>GBP</option><option>EUR</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Application Deadline</label>
            <input type="date" className="form-input" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1.5">Description</label>
          <textarea className="form-input min-h-[100px] resize-none" placeholder="Describe this opportunity…" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1.5">Notes</label>
          <textarea className="form-input min-h-[80px] resize-none" placeholder="Internal notes…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}

        <div className="pt-2 flex gap-3">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Opportunity'}
          </Button>
          <Link href="/opportunities"><Button variant="secondary" type="button">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
