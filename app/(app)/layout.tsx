import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AuthGuard from '@/components/auth/AuthGuard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { template: '%s | KeMU Partnerships Hub', default: 'KeMU Partnerships Hub' },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
          <TopBar />
          <main className="flex-1 overflow-y-auto scrollbar-thin p-6 pb-20">
            <div className="page-enter max-w-[1600px] mx-auto min-h-full flex flex-col">
              <div className="flex-1">
                {children}
              </div>
              <footer className="mt-12 py-6 border-t border-white/[0.06] text-center text-xs text-slate-500">
                © {new Date().getFullYear()} CRIBI — All Rights Reserved
              </footer>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
