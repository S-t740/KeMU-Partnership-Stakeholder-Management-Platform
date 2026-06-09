import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

export function daysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '…' : str;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export const STAKEHOLDER_CATEGORIES = [
  'Foundation',
  'Corporate',
  'Embassy',
  'Individual/Diaspora',
  'County Government',
  'NGO/Development Partner',
  'University/Research',
  'Strategic Partner',
] as const;

export const OPPORTUNITY_STATUSES = [
  'Identified',
  'Researching',
  'Applying',
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Closed',
] as const;

export const ENGAGEMENT_TYPES = [
  'Phone Call',
  'Meeting',
  'Email',
  'Proposal Submission',
  'Event Attendance',
  'Partnership Discussion',
  'Other',
] as const;

export const DOCUMENT_TYPES = [
  'Proposal',
  'MoU',
  'Partnership Agreement',
  'Grant Application',
  'Meeting Minutes',
  'Report',
  'Other',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Foundation: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Corporate: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Embassy: 'bg-red-500/20 text-red-300 border-red-500/30',
  'Individual/Diaspora': 'bg-green-500/20 text-green-300 border-green-500/30',
  'County Government': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'NGO/Development Partner': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'University/Research': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Strategic Partner': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

export const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Prospect: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Archived: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const OPPORTUNITY_STATUS_COLORS: Record<string, string> = {
  Identified: 'bg-slate-500/20 text-slate-300',
  Researching: 'bg-blue-500/20 text-blue-300',
  Applying: 'bg-purple-500/20 text-purple-300',
  Submitted: 'bg-yellow-500/20 text-yellow-300',
  'Under Review': 'bg-orange-500/20 text-orange-300',
  Approved: 'bg-emerald-500/20 text-emerald-300',
  Rejected: 'bg-red-500/20 text-red-300',
  Closed: 'bg-slate-500/20 text-slate-400',
};
