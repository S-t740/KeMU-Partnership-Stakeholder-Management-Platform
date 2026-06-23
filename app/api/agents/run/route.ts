// app/api/agents/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runAgentPipeline } from '@/lib/agents/orchestrator';

// Allow up to 5 minutes for the full agent pipeline
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Validate cron secret (for scheduled runs) or allow from UI
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.AGENT_CRON_SECRET;

  // Allow requests from the UI (no auth) or from Vercel cron (with secret)
  const isCronRequest = authHeader === `Bearer ${cronSecret}`;
  const isUiRequest = !authHeader;

  if (!isCronRequest && !isUiRequest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let customQuery: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    customQuery = body?.query ?? undefined;
  } catch {
    customQuery = undefined;
  }

  try {
    const result = await runAgentPipeline(customQuery);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? 'Agent pipeline failed' },
      { status: 500 }
    );
  }
}

// Vercel Cron hits GET
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.AGENT_CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAgentPipeline();
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
