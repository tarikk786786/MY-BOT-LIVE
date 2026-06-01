'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart2,
  Brain,
  Settings,
  QrCode,
  Users
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquare, label: 'Chats', href: '/chats' },
  { icon: BarChart2, label: 'Analytics', href: '/analytics' },
  { icon: Users, label: 'Memory', href: '/memory' },
  { icon: Brain, label: 'Personality', href: '/personality' },
  { icon: QrCode, label: 'WhatsApp', href: '/whatsapp' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function Sidebar({ currentPath }: { currentPath: string }) {
  return (
    <motion.aside 
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="glass-panel h-full rounded-3xl w-20 lg:w-[240px] flex flex-col items-center lg:items-stretch py-8 shadow-2xl relative overflow-hidden"
    >
      <div className="flex items-center justify-center lg:justify-start lg:px-8 mb-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-dark to-emerald-glow flex items-center justify-center shadow-glow-emerald">
          <Brain size={20} className="text-white" />
        </div>
        <h1 className="hidden lg:block ml-4 font-display font-bold text-xl text-gradient tracking-tight">
          AI Comp.
        </h1>
      </div>

      <nav className="flex-1 w-full px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <div className={`group flex items-center justify-center lg:justify-start p-3 lg:px-4 rounded-2xl transition-all duration-300 relative ${isActive ? 'text-white' : 'text-silver hover:text-white'}`}>
                
                {/* Active Indicator Background */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-white/5 rounded-2xl border border-white/10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Active Pill (Left) */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-glow rounded-r-full shadow-glow-emerald" />
                )}

                <div className="relative z-10 flex items-center">
                  <Icon size={22} className={`transition-all duration-300 ${isActive ? 'text-emerald-glow drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'group-hover:text-emerald-glow'}`} />
                  <span className="hidden lg:block ml-4 font-medium text-sm tracking-wide">
                    {item.label}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 w-full">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center hidden lg:block">
          <div className="w-2 h-2 rounded-full bg-emerald-glow shadow-glow-emerald mx-auto mb-2 animate-pulse" />
          <p className="text-xs text-silver font-medium">System Online</p>
        </div>
      </div>
    </motion.aside>
  );
}
