-- ============================================================
-- Uzury Hub — Strategic Modules Migration
-- Migration 004: Strategic Partner Prioritization +
--               Internal Coordination Workflow
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- NEW ENUMS
-- ============================================================

CREATE TYPE partner_priority AS ENUM (
  'Strategic Priority',
  'Growth Opportunity',
  'Engagement Priority',
  'General Partner'
);

CREATE TYPE followup_status AS ENUM (
  'Pending',
  'In Progress',
  'Completed',
  'On Hold'
);

CREATE TYPE task_priority AS ENUM (
  'High',
  'Medium',
  'Low'
);

-- Add Partnerships Fellow to user_role enum (requires re-create workaround in Postgres)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Partnerships Fellow';

-- ============================================================
-- PARTNER PROGRAMS LOOKUP TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.partner_programs (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed program areas
INSERT INTO public.partner_programs (name, description, color) VALUES
  ('Women Empowerment',   'Programs advancing gender equity and women leadership', '#ec4899'),
  ('Youth Development',   'Skills, mentorship, and opportunity programs for youth', '#f59e0b'),
  ('Entrepreneurship',    'SME support, incubation, and business development',      '#10b981'),
  ('Climate Action',      'Environmental sustainability and climate resilience',     '#14b8a6'),
  ('Digital Skills',      'Technology literacy, coding, and digital access',         '#6366f1'),
  ('Health & Wellbeing',  'Community health, nutrition, and WASH programs',          '#f43f5e')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- ALTER STAKEHOLDERS TABLE
-- ============================================================

ALTER TABLE public.stakeholders
  ADD COLUMN IF NOT EXISTS partner_priority partner_priority NOT NULL DEFAULT 'General Partner',
  ADD COLUMN IF NOT EXISTS program_areas TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_stakeholders_priority ON public.stakeholders(partner_priority);
CREATE INDEX IF NOT EXISTS idx_stakeholders_program_areas ON public.stakeholders USING GIN(program_areas);

-- ============================================================
-- ALTER FOLLOWUPS TABLE
-- ============================================================

-- Add new workflow columns
ALTER TABLE public.followups
  ADD COLUMN IF NOT EXISTS status followup_status NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS priority task_priority NOT NULL DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- Backfill: map existing completed=true rows to status='Completed'
UPDATE public.followups SET status = 'Completed' WHERE completed = TRUE AND status = 'Pending';

CREATE INDEX IF NOT EXISTS idx_followups_status   ON public.followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_priority ON public.followups(priority);
CREATE INDEX IF NOT EXISTS idx_followups_opportunity ON public.followups(opportunity_id);

-- ============================================================
-- RLS FOR partner_programs (read-only for authenticated users)
-- ============================================================

ALTER TABLE public.partner_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read programs"
  ON public.partner_programs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage programs"
  ON public.partner_programs FOR ALL
  USING (public.get_user_role() = 'Administrator');

-- ============================================================
-- ACTIVITY LOG VIEW (surfaces audit_logs with user info)
-- ============================================================

CREATE OR REPLACE VIEW public.activity_log AS
  SELECT
    al.id,
    al.table_name,
    al.record_id,
    al.action,
    al.old_data,
    al.new_data,
    al.performed_at,
    u.full_name  AS performed_by_name,
    u.email      AS performed_by_email,
    -- Attempt to resolve a human-readable label from new_data
    COALESCE(
      al.new_data->>'name',
      al.new_data->>'title',
      al.old_data->>'name',
      al.old_data->>'title',
      al.record_id::TEXT
    ) AS record_label
  FROM public.audit_logs al
  LEFT JOIN public.users u ON u.id = al.performed_by
  ORDER BY al.performed_at DESC;

-- ============================================================
-- END OF MIGRATION 004
-- ============================================================
