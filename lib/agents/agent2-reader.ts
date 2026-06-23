// ─── Agent 2: Opportunity Reader (Jina Reader + OpenAI extraction) ──
import OpenAI from 'openai';
import type { OpportunityDetail, SearchResult, AgentLogEntry } from './types';
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionPrompt } from './prompts';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchWithJina(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const res = await fetch(jinaUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      'Accept': 'text/plain',
      'X-Return-Format': 'text',
    },
    signal: AbortSignal.timeout(20000), // 20 second timeout
  });
  if (!res.ok) throw new Error(`Jina Reader returned ${res.status}`);
  return res.text();
}

export async function runAgent2Reader(
  result: SearchResult,
  log: AgentLogEntry[]
): Promise<OpportunityDetail | null> {
  log.push({
    agent: 'Agent 2 — Opportunity Reader',
    status: 'running',
    message: `Reading: ${result.url}`,
    timestamp: new Date().toISOString(),
  });

  try {
    // Step 1: Fetch page content via Jina Reader
    const pageContent = await fetchWithJina(result.url);

    if (!pageContent || pageContent.length < 200) {
      log.push({
        agent: 'Agent 2 — Opportunity Reader',
        status: 'skipped',
        message: `Page content too short or empty: ${result.url}`,
        timestamp: new Date().toISOString(),
      });
      return null;
    }

    // Step 2: Extract structured data with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: buildExtractionPrompt(pageContent, result.url) },
      ],
      temperature: 0.1,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    // Validate — must have at least a title
    if (!parsed.title || parsed.title.length < 5) {
      log.push({
        agent: 'Agent 2 — Opportunity Reader',
        status: 'skipped',
        message: `Could not extract valid opportunity from: ${result.url}`,
        timestamp: new Date().toISOString(),
      });
      return null;
    }

    const detail: OpportunityDetail = {
      title: parsed.title ?? result.title,
      funder: parsed.funder ?? 'Unknown',
      description: parsed.description ?? result.snippet,
      funding_amount: typeof parsed.funding_amount === 'number' ? parsed.funding_amount : null,
      currency: parsed.currency ?? 'USD',
      deadline: parsed.deadline ?? null,
      eligibility_text: parsed.eligibility_text ?? '',
      application_url: parsed.application_url ?? result.url,
      source_url: result.url,
      program_areas: Array.isArray(parsed.program_areas) ? parsed.program_areas : [],
    };

    log.push({
      agent: 'Agent 2 — Opportunity Reader',
      status: 'success',
      message: `Extracted: "${detail.title}" from ${result.url}`,
      timestamp: new Date().toISOString(),
      data: { title: detail.title, funder: detail.funder, deadline: detail.deadline },
    });

    return detail;
  } catch (err: any) {
    log.push({
      agent: 'Agent 2 — Opportunity Reader',
      status: 'error',
      message: `Failed to read ${result.url}: ${err.message}`,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
}
