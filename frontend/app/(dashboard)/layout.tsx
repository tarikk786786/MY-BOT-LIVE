'use client';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen relative overflow-hidden flex bg-obsidian text-main">
      {/* Mesh Background */}
      <div className="mesh-bg">
        <div className="mesh-orb-1" />
        <div className="mesh-orb-2" />
      </div>

      {/* Floating Sidebar Container */}
      <div className="fixed top-0 left-0 h-full p-4 lg:p-6 z-50">
        <Sidebar currentPath={pathname} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-[100px] lg:pl-[280px] min-h-screen transition-all duration-300">
        <div className="p-4 lg:p-6 flex-1 flex flex-col max-w-[1600px] mx-auto w-full relative z-10">
          <TopBar />
          <main className="flex-1 pt-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
