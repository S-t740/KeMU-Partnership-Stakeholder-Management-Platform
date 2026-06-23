// ─── Agent 6: Email Notifier (Resend) ─────────────────────────
import { Resend } from 'resend';
import type { OpportunityDetail, EligibilityResult, DepartmentMatch, AgentLogEntry } from './types';

const resend = new Resend(process.env.RESEND_API_KEY);

function buildEmailHtml(
  opportunity: OpportunityDetail,
  eligibility: EligibilityResult,
  department: DepartmentMatch,
  opportunityId: string,
  appUrl: string
): string {
  const deadline = opportunity.deadline
    ? new Date(opportunity.deadline).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Not specified';

  const amount = opportunity.funding_amount
    ? `${opportunity.currency} ${opportunity.funding_amount.toLocaleString()}`
    : 'Not specified';

  const confidenceColor = eligibility.confidence >= 70 ? '#10b981' : eligibility.confidence >= 40 ? '#f59e0b' : '#ef4444';
  const appLink = `${appUrl}/opportunities`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030712;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:16px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 8px 0;">🤖 KeMU AI Agent Alert</p>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">New Funding Opportunity Found</h1>
    </div>

    <!-- Opportunity Card -->
    <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:16px;">
      <h2 style="color:#f1f5f9;font-size:18px;font-weight:700;margin:0 0 4px 0;">${opportunity.title}</h2>
      <p style="color:#0ea5e9;font-size:13px;font-weight:600;margin:0 0 16px 0;">📌 ${opportunity.funder}</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px 0;">${opportunity.description}</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;">
          <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px 0;">Funding Amount</p>
          <p style="color:#10b981;font-size:15px;font-weight:700;margin:0;">${amount}</p>
        </div>
        <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;">
          <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px 0;">Deadline</p>
          <p style="color:#f59e0b;font-size:15px;font-weight:700;margin:0;">${deadline}</p>
        </div>
      </div>
    </div>

    <!-- Eligibility -->
    <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px 0;">🎯 KeMU Eligibility Assessment</p>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <span style="background:${confidenceColor};color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;">${eligibility.eligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}</span>
        <span style="color:#94a3b8;font-size:12px;">${eligibility.confidence}% confidence</span>
      </div>
      <p style="color:#cbd5e1;font-size:13px;line-height:1.5;margin:0;">${eligibility.reason}</p>
    </div>

    <!-- Department Match -->
    <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px 0;">🏫 Recommended Lead Department</p>
      <p style="color:#e2e8f0;font-size:14px;font-weight:600;margin:0 0 6px 0;">${department.department}</p>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 8px 0;">${department.reasoning}</p>
      ${department.program_areas.length > 0 ? `
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${department.program_areas.map(a => `<span style="background:rgba(99,102,241,0.2);color:#818cf8;font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid rgba(99,102,241,0.3);">${a}</span>`).join('')}
      </div>` : ''}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${appLink}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">View in Pipeline →</a>
    </div>

    <!-- Source -->
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;text-align:center;">
      <p style="color:#475569;font-size:11px;margin:0 0 4px 0;">Source: <a href="${opportunity.source_url}" style="color:#0ea5e9;">${opportunity.source_url.substring(0, 60)}...</a></p>
      <p style="color:#334155;font-size:10px;margin:0;">© ${new Date().getFullYear()} CRIBI — KeMU AI Agent Network</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

export async function runAgent6Notify(
  opportunity: OpportunityDetail,
  eligibility: EligibilityResult,
  department: DepartmentMatch,
  opportunityId: string,
  log: AgentLogEntry[]
): Promise<void> {
  const recipientEmail = process.env.NOTIFICATION_EMAIL ?? 'stephen.ngaruiya@kemu.ac.ke';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kemu-partnerships.vercel.app';

  log.push({
    agent: 'Agent 6 — Notifier',
    status: 'running',
    message: `Sending notification to ${recipientEmail}`,
    timestamp: new Date().toISOString(),
  });

  try {
    const { data, error } = await resend.emails.send({
      from: 'KeMU AI Agents <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `🤖 New Opportunity: ${opportunity.title} — ${opportunity.funder}`,
      html: buildEmailHtml(opportunity, eligibility, department, opportunityId, appUrl),
    });

    if (error) throw new Error(error.message);

    log.push({
      agent: 'Agent 6 — Notifier',
      status: 'success',
      message: `📧 Notification sent to ${recipientEmail} (ID: ${data?.id})`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    log.push({
      agent: 'Agent 6 — Notifier',
      status: 'error',
      message: `Email notification failed: ${err.message}`,
      timestamp: new Date().toISOString(),
    });
  }
}
