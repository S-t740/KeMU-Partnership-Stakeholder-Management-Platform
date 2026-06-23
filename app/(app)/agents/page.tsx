'use client';

import { useState } from 'react';
import {
  Bot, Play, Search, CheckCircle2, XCircle,
  AlertTriangle, Clock, Zap, ArrowRight,
  RefreshCw, DollarSign, Building2, Info
} from 'lucide-react';
import type { AgentRunResult, AgentLogEntry } from '@/lib/agents/types';
import Link from 'next/link';

const AGENT_LABELS: Record<string, { icon: string; color: string }> = {
  'Agent 1 — Web Searcher':      { icon: '🔍', color: 'text-sky-400' },
  'Agent 2 — Opportunity Reader':{ icon: '📖', color: 'text-indigo-400' },
  'Agent 3 — Eligibility Checker':{ icon: '✅', color: 'text-emerald-400' },
  'Agent 4 — Department Matcher':{ icon: '🏫', color: 'text-amber-400' },
  'Agent 5 — Pipeline Creator':  { icon: '💾', color: 'text-violet-400' },
  'Agent 6 — Notifier':          { icon: '📧', color: 'text-rose-400' },
  'Orchestrator':                { icon: '🤖', color: 'text-white' },
};

function StatusIcon({ status }: { status: AgentLogEntry['status'] }) {
  if (status === 'success')  return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  if (status === 'error')    return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
  if (status === 'skipped')  return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
  return <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0 animate-spin" />;
}

export default function AgentsPage() {
  const [running, setRunning]         = useState(false);
  const [result, setResult]           = useState<AgentRunResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');

  const runAgents = async () => {
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customQuery.trim() ? { query: customQuery.trim() } : {}),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Agent pipeline failed');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message ?? 'Network error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] dark:border-white/[0.06] border-slate-200 bg-gradient-to-br from-violet-500/10 via-sky-500/5 to-transparent p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Agent Network</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">
              6 AI agents working in sequence to automatically discover, evaluate, and add funding opportunities to your pipeline.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-400">Ready</span>
          </div>
        </div>

        {/* Agent Flow */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {['🔍 Search', '📖 Read', '✅ Eligibility', '🏫 Match', '💾 Pipeline', '📧 Notify'].map((label, i, arr) => (
            <div key={label} className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-white/5 dark:bg-white/5 bg-slate-100 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {label}
              </div>
              {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-slate-400" />}
            </div>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Run Configuration</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Custom Search Query <span className="normal-case font-normal">(optional — leave blank for default queries)</span>
            </label>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2.5 focus-within:border-sky-500/50 transition-colors">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder='e.g. "USAID university grants Kenya 2026"'
                  className="bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none w-full"
                  disabled={running}
                  onKeyDown={(e) => e.key === 'Enter' && !running && runAgents()}
                />
              </div>
              <button
                onClick={runAgents}
                disabled={running}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-sky-500 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
              >
                {running
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Running...</>
                  : <><Play className="h-4 w-4" /> Run Agents</>
                }
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-sky-500/5 border border-sky-500/10">
            <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <strong className="text-slate-700 dark:text-slate-300">Auto-runs daily at 7:00 AM EAT</strong> via Vercel Cron. Each run searches up to 8 URLs, checks eligibility, and sends you an email for each new opportunity found.
            </p>
          </div>
        </div>
      </div>

      {/* Running indicator */}
      {running && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-violet-400 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Agents are working...</p>
              <p className="text-xs text-slate-500">This may take 1–3 minutes. Please wait.</p>
            </div>
          </div>
          <div className="space-y-2">
            {['🔍 Agent 1 searching the web...', '📖 Agent 2 reading pages...', '✅ Agent 3 checking eligibility...', '🏫 Agent 4 matching departments...', '💾 Agent 5 creating records...', '📧 Agent 6 sending notifications...'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="h-1 w-1 rounded-full bg-violet-400" />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Pipeline Error</p>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'URLs Found', value: result.found_count, icon: Search, color: 'text-sky-400', bg: 'bg-sky-500/10' },
              { label: 'Added to Pipeline', value: result.added_count, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Skipped', value: result.skipped_count, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Duration', value: `${(result.duration_ms / 1000).toFixed(1)}s`, icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4">
                <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* New Opportunities */}
          {result.opportunities_added.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                ✅ {result.opportunities_added.length} Opportunity{result.opportunities_added.length !== 1 ? 'ies' : 'y'} Added
              </p>
              <div className="space-y-2">
                {result.opportunities_added.map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between gap-3 py-2 border-b border-emerald-500/10 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{opp.name}</span>
                    </div>
                    <Link href="/opportunities" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors shrink-0">
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Log */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider">Full Agent Log</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${result.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {result.status === 'completed' ? '✅ Completed' : '❌ Failed'}
              </span>
            </div>
            <div className="p-4 space-y-1.5 max-h-[400px] overflow-y-auto font-mono">
              {result.log.map((entry, i) => {
                const agentStyle = AGENT_LABELS[entry.agent] ?? { icon: '•', color: 'text-slate-400' };
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-600 shrink-0 w-16 truncate">
                      {new Date(entry.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <StatusIcon status={entry.status} />
                    <span className={`font-semibold shrink-0 hidden sm:inline ${agentStyle.color}`}>
                      {agentStyle.icon}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 break-words">{entry.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
