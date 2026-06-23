'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/index';
import { createStakeholder } from '@/lib/db';
import { STAKEHOLDER_CATEGORIES } from '@/lib/utils';

export default function NewStakeholderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: '',
    organization_type: '',
    country: 'Kenya',
    county: '',
    website: '',
    strategic_alignment: '',
    notes: '',
    assigned_officer: '',
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category) {
      setError('Organization name and category are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createStakeholder({
        name: form.name,
        category: form.category as any,
        organization_type: form.organization_type || undefined,
        country: form.country || undefined,
        county: form.county || undefined,
        website: form.website || undefined,
        strategic_alignment: form.strategic_alignment || undefined,
        notes: form.notes || undefined,
        assigned_officer: form.assigned_officer || undefined,
        status: 'Active',
      });
      router.push(`/stakeholders/${created.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/stakeholders">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <h1 className="text-lg font-bold text-white">Add New Stakeholder</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl border border-white/[0.06] p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Organization Name <span className="text-red-400">*</span></label>
            <input className="form-input" placeholder="e.g. Gates Foundation" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Category <span className="text-red-400">*</span></label>
            <select className="form-input" value={form.category} onChange={(e) => set('category', e.target.value)} required>
              <option value="">Select category…</option>
              {STAKEHOLDER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Organization Type</label>
            <input className="form-input" placeholder="e.g. Philanthropic Foundation" value={form.organization_type} onChange={(e) => set('organization_type', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Country</label>
            <input className="form-input" placeholder="e.g. Kenya" value={form.country} onChange={(e) => set('country', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">County / Region</label>
            <input className="form-input" placeholder="e.g. Nairobi" value={form.county} onChange={(e) => set('county', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Website</label>
            <input className="form-input" placeholder="https://" value={form.website} onChange={(e) => set('website', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Assigned Officer</label>
            <input className="form-input" placeholder="Officer name" value={form.assigned_officer} onChange={(e) => set('assigned_officer', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1.5">Strategic Alignment</label>
          <textarea className="form-input min-h-[80px] resize-none" placeholder="How does this stakeholder align with KeMU's mission?" value={form.strategic_alignment} onChange={(e) => set('strategic_alignment', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1.5">Notes</label>
          <textarea className="form-input min-h-[80px] resize-none" placeholder="Internal notes about this stakeholder…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}

        <div className="pt-2 flex gap-3">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Stakeholder'}
          </Button>
          <Link href="/stakeholders"><Button variant="secondary" type="button">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
