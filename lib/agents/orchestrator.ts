// ─── Orchestrator: Chains all 6 agents ───────────────────────
import { runAgent1Searcher } from './agent1-searcher';
import { runAgent2Reader } from './agent2-reader';
import { runAgent3Eligibility } from './agent3-eligibility';
import { runAgent4Matcher } from './agent4-matcher';
import { runAgent5Pipeline } from './agent5-pipeline';
import { runAgent6Notify } from './agent6-notify';
import type { AgentLogEntry, AgentRunResult } from './types';

export async function runAgentPipeline(
  customQuery?: string
): Promise<AgentRunResult> {
  const startTime = Date.now();
  const log: AgentLogEntry[] = [];
  const opportunitiesAdded: Array<{ id: string; name: string; url: string }> = [];
  let foundCount = 0;
  let addedCount = 0;
  let skippedCount = 0;

  const runId = `run_${Date.now()}`;

  log.push({
    agent: 'Orchestrator',
    status: 'running',
    message: '🚀 KeMU AI Agent Network starting...',
    timestamp: new Date().toISOString(),
  });

  try {
    // ── AGENT 1: Search ──────────────────────────────────────────
    const searchResults = await runAgent1Searcher(customQuery, log);
    foundCount = searchResults.length;

    if (searchResults.length === 0) {
      log.push({
        agent: 'Orchestrator',
        status: 'success',
        message: 'No search results found. Pipeline complete.',
        timestamp: new Date().toISOString(),
      });
      return {
        run_id: runId,
        status: 'completed',
        search_query: customQuery ?? 'default queries',
        found_count: 0,
        added_count: 0,
        skipped_count: 0,
        log,
        opportunities_added: [],
        duration_ms: Date.now() - startTime,
      };
    }

    // ── AGENTS 2–6: Process each search result ────────────────
    // Limit to top 8 results to manage costs
    const topResults = searchResults.slice(0, 8);

    for (const result of topResults) {
      log.push({
        agent: 'Orchestrator',
        status: 'running',
        message: `─── Processing: ${result.title} ───`,
        timestamp: new Date().toISOString(),
      });

      // Agent 2: Read the page
      const opportunity = await runAgent2Reader(result, log);
      if (!opportunity) {
        skippedCount++;
        continue;
      }

      // Agent 3: Check eligibility
      const eligibility = await runAgent3Eligibility(opportunity, log);
      if (!eligibility.eligible && eligibility.confidence > 70) {
        // Skip only if clearly ineligible with high confidence
        skippedCount++;
        log.push({
          agent: 'Orchestrator',
          status: 'skipped',
          message: `Skipping "${opportunity.title}" — not eligible for KeMU`,
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      // Agent 4: Match department
      const departmentMatch = await runAgent4Matcher(opportunity, log);

      // Agent 5: Create pipeline record
      const created = await runAgent5Pipeline(opportunity, eligibility, departmentMatch, log);
      if (!created) {
        skippedCount++;
        continue;
      }

      // Agent 6: Send notification
      await runAgent6Notify(opportunity, eligibility, departmentMatch, created.id, log);

      opportunitiesAdded.push({
        id: created.id,
        name: created.name,
        url: opportunity.source_url,
      });
      addedCount++;
    }

    log.push({
      agent: 'Orchestrator',
      status: 'success',
      message: `✅ Pipeline complete — ${addedCount} opportunities added, ${skippedCount} skipped`,
      timestamp: new Date().toISOString(),
      data: { added: addedCount, skipped: skippedCount },
    });

    return {
      run_id: runId,
      status: 'completed',
      search_query: customQuery ?? 'default queries',
      found_count: foundCount,
      added_count: addedCount,
      skipped_count: skippedCount,
      log,
      opportunities_added: opportunitiesAdded,
      duration_ms: Date.now() - startTime,
    };
  } catch (err: any) {
    log.push({
      agent: 'Orchestrator',
      status: 'error',
      message: `Pipeline failed with error: ${err.message}`,
      timestamp: new Date().toISOString(),
    });

    return {
      run_id: runId,
      status: 'failed',
      search_query: customQuery ?? 'default queries',
      found_count: foundCount,
      added_count: addedCount,
      skipped_count: skippedCount,
      log,
      opportunities_added: opportunitiesAdded,
      error: err.message,
      duration_ms: Date.now() - startTime,
    };
  }
}
