'use client';

import { useState } from 'react';
import {
  HelpCircle, Mail, Phone, ChevronDown, ChevronUp,
  BookOpen, Users, Calendar, DollarSign, FileText,
  Upload, Star, ClipboardList, LayoutDashboard,
  AlertTriangle, Search, ExternalLink, MessageSquare,
  CheckCircle2, Shield
} from 'lucide-react';

const FAQS = [
  {
    category: 'Getting Started',
    icon: LayoutDashboard,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    items: [
      {
        q: 'How do I log in to the platform?',
        a: 'Navigate to the platform URL and enter your institutional email and password on the login page. Contact the system administrator if you have not received your credentials.',
      },
      {
        q: 'What are the different user roles?',
        a: 'There are three roles: Administrator (full access), Partnership Officer (create and manage records), and Executive Management (read-only overview). Your role is assigned by the administrator.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Use the "Forgot Password" option on the login page. A reset link will be sent to your registered email address. If you do not receive it, check your spam folder or contact the administrator.',
      },
    ],
  },
  {
    category: 'Stakeholder Management',
    icon: Users,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    items: [
      {
        q: 'How do I add a new stakeholder?',
        a: 'Click the "+ New" button in the top bar and select "New Stakeholder", or navigate to Stakeholders → click the "Add Stakeholder" button. Fill in the required fields (name and category) and save.',
      },
      {
        q: 'Can I add multiple contacts to one stakeholder?',
        a: 'Yes. Open the stakeholder profile and use the Contacts section to add as many individual contacts as needed. You can designate one as the primary contact.',
      },
      {
        q: 'How do I search for a specific stakeholder?',
        a: 'Use the Search bar in the top navigation bar. You can also use the filter options on the Stakeholders page to filter by category, status, or country.',
      },
      {
        q: 'What does archiving a stakeholder do?',
        a: 'Archiving moves the stakeholder to "Archived" status. They remain in the system for record-keeping but are excluded from active views. This is preferable to deleting records.',
      },
    ],
  },
  {
    category: 'Engagements & Follow-Ups',
    icon: Calendar,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    items: [
      {
        q: 'How do I log a new engagement?',
        a: 'Click "+ New" → "Log Engagement", or go to the Engagements page. Select the stakeholder, choose the engagement type (Meeting, Call, Email, etc.), enter the date, summary, and outcome.',
      },
      {
        q: 'How do I set a follow-up from an engagement?',
        a: 'When logging an engagement, check the "Follow-up Required" checkbox and set the follow-up date. This automatically creates a follow-up task linked to that engagement.',
      },
      {
        q: 'Why are some follow-ups showing as overdue on the dashboard?',
        a: 'A follow-up becomes overdue when its due date has passed and it has not been marked as completed. Open the Follow-Up Manager, find the task, and mark it complete or update the due date.',
      },
      {
        q: 'Can I assign a follow-up to a specific officer?',
        a: 'Yes. When creating or editing a follow-up, use the "Responsible Officer" field to assign it to the relevant team member.',
      },
    ],
  },
  {
    category: 'Opportunities & Funding',
    icon: DollarSign,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    items: [
      {
        q: 'How do I track a funding opportunity?',
        a: 'Go to Opportunities → "Add Opportunity". Link it to a stakeholder, enter the funding amount, deadline, and set the current pipeline stage (Identified, Applying, Submitted, etc.).',
      },
      {
        q: 'What do the pipeline stages mean?',
        a: 'Identified (discovered), Researching (gathering info), Applying (preparing application), Submitted (application sent), Under Review (awaiting decision), Approved (secured), Rejected, Closed.',
      },
      {
        q: 'How do I see all upcoming grant deadlines?',
        a: 'The Dashboard shows "Upcoming Deadlines" and the Opportunity Pipeline Dashboard provides a full view of deadlines sorted by urgency.',
      },
    ],
  },
  {
    category: 'Documents',
    icon: FileText,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    items: [
      {
        q: 'What file types can I upload?',
        a: 'The platform supports PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), images (PNG, JPG), and most common document formats.',
      },
      {
        q: 'Are uploaded documents private?',
        a: 'Yes. Documents are stored in secure private cloud storage. Only authenticated users with the appropriate role can view or download files.',
      },
      {
        q: 'How do I link a document to a stakeholder?',
        a: 'Navigate to the stakeholder profile, go to the Documents tab, and click "Upload Document". All uploaded files are automatically linked to that stakeholder.',
      },
    ],
  },
  {
    category: 'Data Import',
    icon: Upload,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    items: [
      {
        q: 'Can I import existing stakeholder data?',
        a: 'Yes. Use the Import Wizard (sidebar → Import Wizard) to upload an Excel (.xlsx) or CSV file. The wizard will guide you through mapping columns and reviewing records before importing.',
      },
      {
        q: 'What happens to duplicate records during import?',
        a: 'The system detects potential duplicates and flags them for review. You can choose to merge, skip, or import them as new records.',
      },
      {
        q: 'What is the maximum file size for import?',
        a: 'Files up to 10MB are supported. For larger datasets, contact the administrator for a batch import procedure.',
      },
    ],
  },
  {
    category: 'Security & Access',
    icon: Shield,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    items: [
      {
        q: 'Who can see all the data on the platform?',
        a: 'Administrators have full access. Partnership Officers can view and manage records. Executive Management users have read-only access for oversight purposes.',
      },
      {
        q: 'Is there an audit trail of changes?',
        a: 'Yes. Every create, update, and delete action is recorded in the Audit Log, including which user performed the action and when.',
      },
      {
        q: 'How is my data protected?',
        a: 'All data is encrypted in transit (HTTPS/TLS) and at rest. The platform uses Row Level Security (RLS) at the database level, and is hosted on enterprise-grade cloud infrastructure.',
      },
    ],
  },
];

const GUIDES = [
  { icon: Users, label: 'Adding Your First Stakeholder', time: '2 min read', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { icon: Calendar, label: 'Logging Engagements & Setting Follow-Ups', time: '3 min read', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: DollarSign, label: 'Managing Your Funding Pipeline', time: '4 min read', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: Upload, label: 'Importing Data from Excel or CSV', time: '3 min read', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: Star, label: 'Prioritizing Strategic Partners', time: '2 min read', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { icon: ClipboardList, label: 'Using the Coordination Hub', time: '3 min read', color: 'text-teal-400', bg: 'bg-teal-500/10' },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (key: string) => setOpenFaq(openFaq === key ? null : key);

  const filteredFaqs = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !searchQuery ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] dark:border-white/[0.06] border-slate-200 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-sky-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Help & Support Center</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">
            Find answers to common questions, browse quick-start guides, or reach out directly to the platform administrator for assistance.
          </p>
          {/* Search */}
          <div className="mt-5 flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 max-w-md focus-within:border-sky-500/50 transition-colors">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search help topics…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Quick Start Guides */}
      {!searchQuery && (
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-sky-400" /> Quick-Start Guides
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GUIDES.map((g) => (
              <div
                key={g.label}
                className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-sky-500/30 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer group"
              >
                <div className={`h-8 w-8 rounded-lg ${g.bg} flex items-center justify-center shrink-0`}>
                  <g.icon className={`h-4 w-4 ${g.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors leading-snug">{g.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{g.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-sky-400" /> Frequently Asked Questions
        </h3>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No results found for "<span className="text-sky-400">{searchQuery}</span>"</p>
            <p className="text-xs mt-1">Try a different keyword or contact support below.</p>
          </div>
        )}

        <div className="space-y-4">
          {filteredFaqs.map((cat) => (
            <div key={cat.category} className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
              {/* Category Header */}
              <div className={`flex items-center gap-2.5 px-5 py-3 border-b border-slate-100 dark:border-white/[0.04] ${cat.bg}`}>
                <cat.icon className={`h-4 w-4 ${cat.color}`} />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{cat.category}</span>
              </div>
              {/* FAQ Items */}
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {cat.items.map((item, idx) => {
                  const key = `${cat.category}-${idx}`;
                  const isOpen = openFaq === key;
                  return (
                    <div key={key}>
                      <button
                        onClick={() => toggleFaq(key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors pr-4">
                          {item.q}
                        </span>
                        {isOpen
                          ? <ChevronUp className="h-4 w-4 text-sky-400 shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        }
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5">
                          <div className="flex gap-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.a}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-indigo-500/5 p-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Still need help?
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          If you cannot find what you're looking for, reach out to the platform administrator directly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <a
            href="mailto:stephen.ngaruiya@kemu.ac.ke"
            className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:border-sky-500/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email Support</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                stephen.ngaruiya@kemu.ac.ke
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Typical response within 24 hours</p>
            </div>
          </a>

          {/* Phone */}
          <a
            href="tel:+254794032541"
            className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:border-emerald-500/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Phone / WhatsApp</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                0794 032 541
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Mon – Fri, 8:00 AM – 5:00 PM (EAT)</p>
            </div>
          </a>
        </div>

        {/* Admin info */}
        <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04]">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            SN
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Stephen Ngaruiya</p>
            <p className="text-[10px] text-slate-400">Platform Administrator · KeMU Partnerships Hub</p>
          </div>
        </div>
      </div>
    </div>
  );
}
