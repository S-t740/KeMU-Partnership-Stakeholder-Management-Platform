// ─── Agent 4: Department Matcher (OpenAI) ─────────────────────
import OpenAI from 'openai';
import type { OpportunityDetail, DepartmentMatch, AgentLogEntry } from './types';
import { DEPARTMENT_SYSTEM_PROMPT, buildDepartmentPrompt } from './prompts';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runAgent4Matcher(
  opportunity: OpportunityDetail,
  log: AgentLogEntry[]
): Promise<DepartmentMatch> {
  log.push({
    agent: 'Agent 4 — Department Matcher',
    status: 'running',
    message: `Matching departments for: "${opportunity.title}"`,
    timestamp: new Date().toISOString(),
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: DEPARTMENT_SYSTEM_PROMPT },
        { role: 'user', content: buildDepartmentPrompt(opportunity) },
      ],
      temperature: 0.2,
      max_tokens: 250,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    const result: DepartmentMatch = {
      department: parsed.department ?? 'Directorate of Partnerships & Linkages',
      program_areas: Array.isArray(parsed.program_areas) ? parsed.program_areas : [],
      reasoning: parsed.reasoning ?? '',
    };

    log.push({
      agent: 'Agent 4 — Department Matcher',
      status: 'success',
      message: `Matched to: ${result.department} | Areas: ${result.program_areas.join(', ')}`,
      timestamp: new Date().toISOString(),
      data: { department: result.department, program_areas: result.program_areas },
    });

    return result;
  } catch (err: any) {
    log.push({
      agent: 'Agent 4 — Department Matcher',
      status: 'error',
      message: `Department matching failed: ${err.message}`,
      timestamp: new Date().toISOString(),
    });
    return {
      department: 'Directorate of Partnerships & Linkages',
      program_areas: opportunity.program_areas,
      reasoning: 'Automated matching failed — assigned to partnerships office.',
    };
  }
}
