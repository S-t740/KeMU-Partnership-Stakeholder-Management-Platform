'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Handshake,
  TrendingUp,
  CalendarCheck,
  FileText,
  Upload,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Building2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, description: 'Analytics & Overview' },
  { name: 'Stakeholders', href: '/stakeholders', icon: Users, description: 'Directory' },
  { name: 'Engagements', href: '/engagements', icon: Handshake, description: 'Activity Log' },
  { name: 'Opportunities', href: '/opportunities', icon: TrendingUp, description: 'Pipeline' },
  { name: 'Follow-Ups', href: '/followups', icon: CalendarCheck, description: 'Reminders' },
  { name: 'Documents', href: '/documents', icon: FileText, description: 'Repository' },
  { name: 'Import Data', href: '/import', icon: Upload, description: 'Excel Import' },
];

const bottomNav = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen sidebar-gradient border-r border-white/[0.06] transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 border border-white/10 hover:bg-slate-600 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-slate-300" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-slate-300" />
        )}
      </button>

      {/* Logo / Brand */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]', collapsed && 'justify-center px-0')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white leading-tight">Uzury</div>
            <div className="text-[10px] text-sky-400/80 font-medium uppercase tracking-widest">Platform</div>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/10 text-sky-300 border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <span className="text-[10px] text-sky-400/70 font-normal">{item.description}</span>
                  )}
                </div>
              )}
              {!collapsed && isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Stats mini widget */}
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/15 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-semibold text-sky-300">Stakeholder Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-white">12</div>
              <div className="text-[10px] text-slate-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">9</div>
              <div className="text-[10px] text-slate-400">Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="border-t border-white/[0.06] p-2 space-y-0.5">
        {bottomNav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            title={collapsed ? item.name : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all',
              collapsed && 'justify-center px-0'
            )}
          >
            <item.icon className="h-5 w-5 shrink-0 text-slate-500" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
        {/* User */}
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 mt-1',
            collapsed && 'justify-center px-0'
          )}
        >
          <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-300 truncate">Administrator</div>
              <div className="text-[10px] text-slate-500 truncate">admin@uzury.org</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
