'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  FileText,
  Settings,
  HelpCircle,
  Menu,
  Upload,
  LogOut,
  Star,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',    icon: LayoutDashboard, href: '/' },
      { label: 'Stakeholders', icon: Users,           href: '/stakeholders' },
      { label: 'Engagements',  icon: Calendar,        href: '/engagements' },
      { label: 'Opportunities',icon: Briefcase,       href: '/opportunities' },
      { label: 'Follow-Ups',   icon: Calendar,        href: '/followups' },
      { label: 'Documents',    icon: FileText,        href: '/documents' },
      { label: 'Import Wizard',icon: Upload,          href: '/import' },
    ],
  },
  {
    label: 'Strategic',
    items: [
      { label: 'Strategic Partners',   icon: Star,     href: '/partners' },
      { label: 'Opportunity Pipeline', icon: BarChart3, href: '/opportunities/dashboard' },
    ],
  },
  {
    label: 'Coordination',
    items: [
      { label: 'Coordination Hub', icon: ClipboardList, href: '/coordination' },
    ],
  },
];

const BOTTOM_NAV_ITEMS = [
  { label: 'Settings',     icon: Settings,   href: '/settings' },
  { label: 'Help & Support', icon: HelpCircle, href: '/help' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setCollapsed(true)} 
        />
      )}

      {/* Mobile Open Button */}
      <button 
        onClick={() => setCollapsed(false)}
        className={cn(
          "fixed top-3 left-4 z-40 p-1.5 rounded-md bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors md:hidden",
          !collapsed && "hidden"
        )}
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          'h-screen flex flex-col bg-slate-50 dark:bg-[#0B1121] border-r border-slate-200 dark:border-white/[0.06] transition-all duration-300 z-50',
          'fixed inset-y-0 left-0 md:relative',
          collapsed ? '-translate-x-full md:translate-x-0 md:w-[72px]' : 'w-64 translate-x-0'
        )}
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-full h-48 bg-sky-500/5 blur-[50px] pointer-events-none" />

        {/* Collapse toggle (Desktop only) */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block absolute -right-3 top-6 bg-[#1E293B] border border-white/10 rounded-full p-1 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Logo / Brand */}
        <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-white/[0.06]', collapsed && 'justify-center px-0')}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)] border border-white/20">
            <img src="/logo.jpg" alt="KeMU Partnerships Hub" className="h-full w-full object-contain mix-blend-multiply" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-white leading-tight">KeMU Partnerships Hub</div>
              <div className="text-[10px] text-sky-500 dark:text-sky-400/80 font-medium uppercase tracking-widest">Platform</div>
            </div>
          )}
        </div>

        {/* Main nav */}
        <div className="flex-1 overflow-y-auto scrollbar-none py-4 px-3 space-y-4 relative z-10">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {/* Section label */}
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group relative',
                        active 
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white',
                        collapsed && 'justify-center px-0'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-400 rounded-r-full shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                      )}
                      <item.icon className={cn('h-5 w-5 shrink-0 transition-transform group-hover:scale-110', active && 'text-sky-400')} />
                      {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
              {/* Divider between sections */}
              {!collapsed && <div className="mt-3 border-t border-white/[0.04]" />}
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="p-3 border-t border-white/[0.06] space-y-1 relative z-10">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group',
                  active 
                    ? 'bg-sky-500/10 text-sky-400' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-300',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );
          })}
          
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group mt-2',
              'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
            {!collapsed && <span className="font-medium text-sm">Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
