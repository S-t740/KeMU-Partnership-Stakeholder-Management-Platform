// ─── Shared types across all agents ──────────────────────────

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface OpportunityDetail {
  title: string;
  funder: string;
  description: string;
  funding_amount: number | null;
  currency: string;
  deadline: string | null;        // ISO date string YYYY-MM-DD or null
  eligibility_text: string;
  application_url: string;
  source_url: string;
  program_areas: string[];
}

export interface EligibilityResult {
  eligible: boolean;
  confidence: number;             // 0–100
  reason: string;
}

export interface DepartmentMatch {
  department: string;
  program_areas: string[];
  reasoning: string;
}

export interface AgentLogEntry {
  agent: string;
  status: 'running' | 'success' | 'skipped' | 'error';
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface AgentRunResult {
  run_id: string;
  status: 'completed' | 'failed';
  search_query: string;
  found_count: number;
  added_count: number;
  skipped_count: number;
  log: AgentLogEntry[];
  opportunities_added: Array<{ id: string; name: string; url: string }>;
  error?: string;
  duration_ms: number;
}
