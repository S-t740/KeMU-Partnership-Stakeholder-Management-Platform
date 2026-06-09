import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      stakeholders: { Row: Stakeholder; Insert: StakeholderInsert; Update: Partial<StakeholderInsert> };
      contacts: { Row: Contact; Insert: ContactInsert; Update: Partial<ContactInsert> };
      engagements: { Row: Engagement; Insert: EngagementInsert; Update: Partial<EngagementInsert> };
      opportunities: { Row: Opportunity; Insert: OpportunityInsert; Update: Partial<OpportunityInsert> };
      followups: { Row: FollowUp; Insert: FollowUpInsert; Update: Partial<FollowUpInsert> };
      documents: { Row: Document; Insert: DocumentInsert; Update: Partial<DocumentInsert> };
    };
  };
};

export type StakeholderCategory =
  | 'Foundation'
  | 'Corporate'
  | 'Embassy'
  | 'Individual/Diaspora'
  | 'County Government'
  | 'NGO/Development Partner'
  | 'University/Research'
  | 'Strategic Partner';

export type StakeholderStatus = 'Active' | 'Inactive' | 'Prospect' | 'Archived';

export type OpportunityStatus =
  | 'Identified'
  | 'Researching'
  | 'Applying'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Closed';

export type EngagementType =
  | 'Phone Call'
  | 'Meeting'
  | 'Email'
  | 'Proposal Submission'
  | 'Event Attendance'
  | 'Partnership Discussion'
  | 'Other';

export interface Stakeholder {
  id: string;
  name: string;
  category: StakeholderCategory;
  organization_type: string | null;
  country: string | null;
  county: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  status: StakeholderStatus;
  areas_of_interest: string[] | null;
  strategic_alignment: string | null;
  notes: string | null;
  tags: string[] | null;
  assigned_officer: string | null;
  created_at: string;
  updated_at: string;
}

export interface StakeholderInsert {
  name: string;
  category: StakeholderCategory;
  organization_type?: string;
  country?: string;
  county?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  status?: StakeholderStatus;
  areas_of_interest?: string[];
  strategic_alignment?: string;
  notes?: string;
  tags?: string[];
  assigned_officer?: string;
}

export interface Contact {
  id: string;
  stakeholder_id: string;
  full_name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  preferred_contact: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface ContactInsert {
  stakeholder_id: string;
  full_name: string;
  position?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  preferred_contact?: string;
  is_primary?: boolean;
}

export interface Engagement {
  id: string;
  stakeholder_id: string;
  engagement_type: EngagementType;
  date: string;
  summary: string;
  outcome: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  responsible_officer: string | null;
  created_by: string | null;
  created_at: string;
  stakeholders?: { name: string };
}

export interface EngagementInsert {
  stakeholder_id: string;
  engagement_type: EngagementType;
  date: string;
  summary: string;
  outcome?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  responsible_officer?: string;
  created_by?: string;
}

export interface Opportunity {
  id: string;
  stakeholder_id: string;
  name: string;
  description: string | null;
  funding_amount: number | null;
  currency: string;
  deadline: string | null;
  status: OpportunityStatus;
  responsible_officer: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stakeholders?: { name: string };
}

export interface OpportunityInsert {
  stakeholder_id: string;
  name: string;
  description?: string;
  funding_amount?: number;
  currency?: string;
  deadline?: string;
  status?: OpportunityStatus;
  responsible_officer?: string;
  notes?: string;
}

export interface FollowUp {
  id: string;
  stakeholder_id: string;
  engagement_id: string | null;
  title: string;
  notes: string | null;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
  responsible_officer: string | null;
  created_at: string;
  stakeholders?: { name: string };
}

export interface FollowUpInsert {
  stakeholder_id: string;
  engagement_id?: string;
  title: string;
  notes?: string;
  due_date: string;
  completed?: boolean;
  responsible_officer?: string;
}

export interface Document {
  id: string;
  stakeholder_id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  document_type: string | null;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  stakeholders?: { name: string };
}

export interface DocumentInsert {
  stakeholder_id: string;
  name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  document_type?: string;
  description?: string;
  uploaded_by?: string;
}
