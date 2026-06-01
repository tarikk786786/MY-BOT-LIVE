'use client';
import { usePathname } from 'next/navigation';
import { Bell, Search, User } from 'lucide-react';
import WAStatusBadge from '../dashboard/WAStatusBadge';

export default function TopBar() {
  const pathname = usePathname();
  const pageName = pathname.split('/').pop() || 'dashboard';

  return (
    <header className="w-full flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white capitalize tracking-tight">
          {pageName}
        </h1>
        <p className="text-sm text-silver mt-1">Overview and management</p>
      </div>

      <div className="flex items-center gap-4">
        <WAStatusBadge />
        
        <div className="hidden md:flex items-center glass-panel px-4 py-2 rounded-full">
          <Search size={18} className="text-silver mr-2" />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            className="bg-transparent border-none outline-none text-sm text-white placeholder-silver/50 w-48 focus:w-64 transition-all duration-300"
          />
        </div>

        <button className="btn-magnetic w-10 h-10 rounded-full flex items-center justify-center relative">
          <Bell size={18} className="text-silver" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-glow rounded-full shadow-glow-emerald" />
        </button>

        <button className="btn-magnetic w-10 h-10 rounded-full flex items-center justify-center bg-white/5">
          <User size={18} className="text-white" />
        </button>
      </div>
    </header>
  );
}
