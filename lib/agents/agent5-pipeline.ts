// ─── Agent 5: Pipeline Record Creator (Supabase) ──────────────
import { createClient } from '@supabase/supabase-js';
import type { OpportunityDetail, EligibilityResult, DepartmentMatch, AgentLogEntry } from './types';

// Use service-level client (server-side only) — falls back to anon key
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function runAgent5Pipeline(
  opportunity: OpportunityDetail,
  eligibility: EligibilityResult,
  departmentMatch: DepartmentMatch,
  log: AgentLogEntry[]
): Promise<{ id: string; name: string } | null> {
  log.push({
    agent: 'Agent 5 — Pipeline Creator',
    status: 'running',
    message: `Creating pipeline record for: "${opportunity.title}"`,
    timestamp: new Date().toISOString(),
  });

  const supabase = getSupabaseAdmin();

  try {
    // ── 1. Find or create a stakeholder for the funder ──────────
    let stakeholderId: string;

    const { data: existing } = await supabase
      .from('stakeholders')
      .select('id')
      .ilike('name', `%${opportunity.funder.substring(0, 30)}%`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      stakeholderId = existing.id;
    } else {
      // Create a new stakeholder record for the funder
      const { data: newStakeholder, error: stakeholderError } = await supabase
        .from('stakeholders')
        .insert({
          name: opportunity.funder,
          category: 'Foundation',
          status: 'Prospect',
          notes: `Auto-created by AI Agent from: ${opportunity.source_url}`,
          areas_of_interest: opportunity.program_areas,
          tags: ['AI-Discovered', 'Funder'],
        })
        .select('id')
        .single();

      if (stakeholderError) throw stakeholderError;
      stakeholderId = newStakeholder.id;
    }

    // ── 2. Check for duplicate opportunity ─────────────────────
    const { data: duplicate } = await supabase
      .from('opportunities')
      .select('id')
      .eq('stakeholder_id', stakeholderId)
      .ilike('name', `%${opportunity.title.substring(0, 40)}%`)
      .maybeSingle();

    if (duplicate) {
      log.push({
        agent: 'Agent 5 — Pipeline Creator',
        status: 'skipped',
        message: `Duplicate detected — opportunity already exists: "${opportunity.title}"`,
        timestamp: new Date().toISOString(),
      });
      return null;
    }

    // ── 3. Build notes with AI analysis ─────────────────────────
    const notes = [
      `🤖 AI-Discovered Opportunity`,
      `Source: ${opportunity.source_url}`,
      ``,
      `📊 Eligibility Assessment (${eligibility.confidence}% confidence):`,
      eligibility.reason,
      ``,
      `🏫 Recommended Lead Department: ${departmentMatch.department}`,
      `Reasoning: ${departmentMatch.reasoning}`,
      ``,
      `🔗 Application: ${opportunity.application_url}`,
    ].join('\n');

    // ── 4. Create the opportunity record ────────────────────────
    const { data: newOpp, error: oppError } = await supabase
      .from('opportunities')
      .insert({
        stakeholder_id: stakeholderId,
        name: opportunity.title,
        description: opportunity.description,
        funding_amount: opportunity.funding_amount,
        currency: opportunity.currency ?? 'USD',
        deadline: opportunity.deadline,
        status: 'Identified',
        responsible_officer: 'Stephen Ngaruiya',
        notes,
      })
      .select('id, name')
      .single();

    if (oppError) throw oppError;

    log.push({
      agent: 'Agent 5 — Pipeline Creator',
      status: 'success',
      message: `✅ Created pipeline record: "${newOpp.name}" (ID: ${newOpp.id})`,
      timestamp: new Date().toISOString(),
      data: { id: newOpp.id, name: newOpp.name, stakeholder_id: stakeholderId },
    });

    return { id: newOpp.id, name: newOpp.name };
  } catch (err: any) {
    log.push({
      agent: 'Agent 5 — Pipeline Creator',
      status: 'error',
      message: `Failed to create pipeline record: ${err.message}`,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
}
