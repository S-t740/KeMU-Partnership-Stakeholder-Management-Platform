// ─── Agent 3: KeMU Eligibility Checker (OpenAI) ───────────────
import OpenAI from 'openai';
import type { OpportunityDetail, EligibilityResult, AgentLogEntry } from './types';
import { ELIGIBILITY_SYSTEM_PROMPT, buildEligibilityPrompt } from './prompts';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runAgent3Eligibility(
  opportunity: OpportunityDetail,
  log: AgentLogEntry[]
): Promise<EligibilityResult> {
  log.push({
    agent: 'Agent 3 — Eligibility Checker',
    status: 'running',
    message: `Checking KeMU eligibility for: "${opportunity.title}"`,
    timestamp: new Date().toISOString(),
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ELIGIBILITY_SYSTEM_PROMPT },
        { role: 'user', content: buildEligibilityPrompt(opportunity) },
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    const result: EligibilityResult = {
      eligible: parsed.eligible === true,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
      reason: parsed.reason ?? 'Eligibility could not be determined.',
    };

    log.push({
      agent: 'Agent 3 — Eligibility Checker',
      status: 'success',
      message: result.eligible
        ? `✅ KeMU is ELIGIBLE (${result.confidence}% confidence): ${result.reason}`
        : `❌ Not eligible (${result.confidence}% confidence): ${result.reason}`,
      timestamp: new Date().toISOString(),
      data: { eligible: result.eligible, confidence: result.confidence },
    });

    return result;
  } catch (err: any) {
    // Default to eligible if check fails — better to over-include than miss opportunities
    log.push({
      agent: 'Agent 3 — Eligibility Checker',
      status: 'error',
      message: `Eligibility check failed: ${err.message} — defaulting to eligible for manual review`,
      timestamp: new Date().toISOString(),
    });
    return { eligible: true, confidence: 30, reason: 'Automated check failed — manual review required.' };
  }
}
