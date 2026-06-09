import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { template: '%s | Uzury Platform', default: 'Uzury Platform' },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="page-enter max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
