// ─── Agent 1: Web Searcher (Tavily) ──────────────────────────
import type { SearchResult, AgentLogEntry } from './types';

const SEARCH_QUERIES = [
  'Kenya university research grants funding call 2025 2026',
  'Africa higher education partnership funding opportunity deadline',
  'East Africa university NGO collaboration grants open call',
  'USAID university grants Kenya higher education 2026',
  'EU Horizon Africa university research funding call',
  'World Bank education grant Kenya university apply',
  'KeMU Kenya Methodist University partnership funding',
];

export async function runAgent1Searcher(
  customQuery?: string,
  log: AgentLogEntry[] = []
): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY!;

  const queries = customQuery ? [customQuery] : SEARCH_QUERIES.slice(0, 4);
  const allResults: SearchResult[] = [];
  const seen = new Set<string>();

  log.push({
    agent: 'Agent 1 — Web Searcher',
    status: 'running',
    message: `Searching ${queries.length} queries via Tavily...`,
    timestamp: new Date().toISOString(),
  });

  for (const query of queries) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'basic',
          max_results: 5,
          include_domains: [],
          exclude_domains: ['youtube.com', 'facebook.com', 'twitter.com', 'instagram.com'],
        }),
      });

      if (!res.ok) {
        log.push({
          agent: 'Agent 1 — Web Searcher',
          status: 'error',
          message: `Tavily search failed for query: "${query}" (${res.status})`,
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      const data = await res.json();
      const results: SearchResult[] = (data.results ?? [])
        .filter((r: any) => r.url && !seen.has(r.url))
        .map((r: any) => {
          seen.add(r.url);
          return {
            title: r.title ?? 'Untitled',
            url: r.url,
            snippet: r.content ?? r.snippet ?? '',
            score: r.score ?? 0,
          };
        });

      allResults.push(...results);
    } catch (err: any) {
      log.push({
        agent: 'Agent 1 — Web Searcher',
        status: 'error',
        message: `Search error: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  log.push({
    agent: 'Agent 1 — Web Searcher',
    status: 'success',
    message: `Found ${allResults.length} unique URLs to investigate`,
    timestamp: new Date().toISOString(),
    data: { count: allResults.length },
  });

  return allResults;
}
