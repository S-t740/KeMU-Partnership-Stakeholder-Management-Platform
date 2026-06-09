-- ============================================================
-- Uzury Partnership & Stakeholder Management Platform
-- Supabase PostgreSQL Migration Script
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE stakeholder_category AS ENUM (
  'Foundation',
  'Corporate',
  'Embassy',
  'Individual/Diaspora',
  'County Government',
  'NGO/Development Partner',
  'University/Research',
  'Strategic Partner'
);

CREATE TYPE stakeholder_status AS ENUM (
  'Active',
  'Inactive',
  'Prospect',
  'Archived'
);

CREATE TYPE opportunity_status AS ENUM (
  'Identified',
  'Researching',
  'Applying',
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Closed'
);

CREATE TYPE engagement_type AS ENUM (
  'Phone Call',
  'Meeting',
  'Email',
  'Proposal Submission',
  'Event Attendance',
  'Partnership Discussion',
  'Other'
);

CREATE TYPE user_role AS ENUM (
  'Administrator',
  'Partnership Officer',
  'Executive Management'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'Partnership Officer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stakeholders
CREATE TABLE public.stakeholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category stakeholder_category NOT NULL,
  organization_type TEXT,
  country TEXT,
  county TEXT,
  website TEXT,
  linkedin TEXT,
  twitter TEXT,
  status stakeholder_status NOT NULL DEFAULT 'Active',
  areas_of_interest TEXT[],
  strategic_alignment TEXT,
  notes TEXT,
  tags TEXT[],
  assigned_officer TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  preferred_contact TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Engagements
CREATE TABLE public.engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  engagement_type engagement_type NOT NULL,
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  outcome TEXT,
  follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_date DATE,
  responsible_officer TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunities
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  funding_amount NUMERIC(15,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  deadline DATE,
  status opportunity_status NOT NULL DEFAULT 'Identified',
  responsible_officer TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follow-ups
CREATE TABLE public.followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES public.engagements(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  responsible_officer TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  document_type TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import Sessions
CREATE TABLE public.import_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  total_rows INTEGER,
  imported_rows INTEGER,
  skipped_rows INTEGER,
  error_rows INTEGER,
  merged_rows INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  performed_by UUID REFERENCES public.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_stakeholders_category ON public.stakeholders(category);
CREATE INDEX idx_stakeholders_status ON public.stakeholders(status);
CREATE INDEX idx_stakeholders_country ON public.stakeholders(country);
CREATE INDEX idx_stakeholders_name ON public.stakeholders USING GIN(to_tsvector('english', name));
CREATE INDEX idx_contacts_stakeholder ON public.contacts(stakeholder_id);
CREATE INDEX idx_engagements_stakeholder ON public.engagements(stakeholder_id);
CREATE INDEX idx_engagements_date ON public.engagements(date DESC);
CREATE INDEX idx_opportunities_stakeholder ON public.opportunities(stakeholder_id);
CREATE INDEX idx_opportunities_status ON public.opportunities(status);
CREATE INDEX idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX idx_followups_stakeholder ON public.followups(stakeholder_id);
CREATE INDEX idx_followups_due_date ON public.followups(due_date);
CREATE INDEX idx_followups_completed ON public.followups(completed);
CREATE INDEX idx_documents_stakeholder ON public.documents(stakeholder_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stakeholders_updated_at
  BEFORE UPDATE ON public.stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Admins: full access
CREATE POLICY "Admins full access on stakeholders"
  ON public.stakeholders FOR ALL
  USING (public.get_user_role() = 'Administrator');

-- Partnership Officers: read + write
CREATE POLICY "Officers can read stakeholders"
  ON public.stakeholders FOR SELECT
  USING (public.get_user_role() IN ('Partnership Officer', 'Executive Management'));

CREATE POLICY "Officers can insert stakeholders"
  ON public.stakeholders FOR INSERT
  WITH CHECK (public.get_user_role() = 'Partnership Officer');

CREATE POLICY "Officers can update stakeholders"
  ON public.stakeholders FOR UPDATE
  USING (public.get_user_role() = 'Partnership Officer');

-- Apply similar patterns to other tables
CREATE POLICY "Authenticated users read contacts"
  ON public.contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Officers manage contacts"
  ON public.contacts FOR ALL USING (public.get_user_role() IN ('Administrator', 'Partnership Officer'));

CREATE POLICY "Authenticated read engagements"
  ON public.engagements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Officers manage engagements"
  ON public.engagements FOR ALL USING (public.get_user_role() IN ('Administrator', 'Partnership Officer'));

CREATE POLICY "Authenticated read opportunities"
  ON public.opportunities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Officers manage opportunities"
  ON public.opportunities FOR ALL USING (public.get_user_role() IN ('Administrator', 'Partnership Officer'));

CREATE POLICY "Authenticated read followups"
  ON public.followups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Officers manage followups"
  ON public.followups FOR ALL USING (public.get_user_role() IN ('Administrator', 'Partnership Officer'));

CREATE POLICY "Authenticated read documents"
  ON public.documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Officers manage documents"
  ON public.documents FOR ALL USING (public.get_user_role() IN ('Administrator', 'Partnership Officer'));

-- ============================================================
-- SUPABASE STORAGE BUCKETS (run separately in dashboard or via API)
-- ============================================================

-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- ============================================================
-- END OF MIGRATION
-- ============================================================
