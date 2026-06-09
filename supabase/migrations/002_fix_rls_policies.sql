-- ============================================================
-- Uzury Platform — RLS Policy Fix
-- Run this in: Supabase Dashboard → SQL Editor
-- Purpose: Allow anon/service role full access until Auth is
--          implemented. Policies can be tightened later.
-- ============================================================

-- Drop the restrictive policies we created earlier
DROP POLICY IF EXISTS "Admins full access on stakeholders" ON public.stakeholders;
DROP POLICY IF EXISTS "Officers can read stakeholders" ON public.stakeholders;
DROP POLICY IF EXISTS "Officers can insert stakeholders" ON public.stakeholders;
DROP POLICY IF EXISTS "Officers can update stakeholders" ON public.stakeholders;
DROP POLICY IF EXISTS "Authenticated users read contacts" ON public.contacts;
DROP POLICY IF EXISTS "Officers manage contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated read engagements" ON public.engagements;
DROP POLICY IF EXISTS "Officers manage engagements" ON public.engagements;
DROP POLICY IF EXISTS "Authenticated read opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Officers manage opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Authenticated read followups" ON public.followups;
DROP POLICY IF EXISTS "Officers manage followups" ON public.followups;
DROP POLICY IF EXISTS "Authenticated read documents" ON public.documents;
DROP POLICY IF EXISTS "Officers manage documents" ON public.documents;

-- Grant full access to anon and authenticated roles on all tables
-- (Tighten these once Supabase Auth is configured)

CREATE POLICY "Allow all on stakeholders"
  ON public.stakeholders FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on contacts"
  ON public.contacts FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on engagements"
  ON public.engagements FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on opportunities"
  ON public.opportunities FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on followups"
  ON public.followups FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on documents"
  ON public.documents FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on users"
  ON public.users FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on audit_logs"
  ON public.audit_logs FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on import_sessions"
  ON public.import_sessions FOR ALL
  USING (true) WITH CHECK (true);
