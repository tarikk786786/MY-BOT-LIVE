'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageCircle,
  Smartphone,
  Brain,
  Sparkles,
  Code2,
  BarChart3,
  Settings,
  Bot,
  ChevronRight,
  Menu,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useWAStore, useUIStore } from '@/lib/store';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chats', label: 'Live Chats', icon: MessageCircle, badge: true },
  { href: '/whatsapp', label: 'WhatsApp', icon: Smartphone, status: true },
  { href: '/memory', label: 'Memory', icon: Brain },
  { href: '/personality', label: 'Personalities', icon: Sparkles },
  { href: '/prompts', label: 'Prompt Editor', icon: Code2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { status } = useWAStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={clsx(
          'fixed lg:relative z-30 h-full flex-shrink-0 overflow-hidden',
          'lg:translate-x-0'
        )}
      >
        <div
          className="h-full w-[260px] flex flex-col"
          style={{
            background: 'rgba(10, 10, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-6">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00d084, #7c3aed)' }}
            >
              <Bot size={22} className="text-white" />
            </motion.div>
            <div>
              <h1
                className="text-base font-bold"
                style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
              >
                CompanionAI
              </h1>
              <p className="text-xs" style={{ color: '#475569' }}>
                WhatsApp Platform
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group',
                      isActive
                        ? 'text-white'
                        : 'hover:bg-white/5'
                    )}
                    style={
                      isActive
                        ? {
                            background:
                              'linear-gradient(135deg, rgba(0,208,132,0.12), rgba(124,58,237,0.08))',
                            borderLeft: '2px solid #00d084',
                            color: '#e2e8f0',
                          }
                        : { color: '#94a3b8' }
                    }
                  >
                    {/* Active glow */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(0,208,132,0.06), rgba(124,58,237,0.04))',
                        }}
                      />
                    )}

                    <Icon
                      size={18}
                      className={clsx(
                        'relative z-10 flex-shrink-0 transition-colors',
                        isActive
                          ? 'text-[#00d084]'
                          : 'text-current group-hover:text-[#e2e8f0]'
                      )}
                    />
                    <span className="relative z-10 flex-1">{item.label}</span>

                    {/* WhatsApp status dot */}
                    {item.status && (
                      <span
                        className={clsx(
                          'relative z-10 status-dot',
                          status.connected ? 'connected' : 'disconnected',
                          status.connected && 'pulse-glow'
                        )}
                      />
                    )}

                    {isActive && (
                      <ChevronRight
                        size={14}
                        className="relative z-10 text-[#00d084] opacity-70"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom: WA Status */}
          <div className="p-4">
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{
                background: status.connected
                  ? 'rgba(0, 208, 132, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${
                  status.connected
                    ? 'rgba(0,208,132,0.2)'
                    : 'rgba(239,68,68,0.2)'
                }`,
              }}
            >
              {status.connected ? (
                <Wifi size={16} style={{ color: '#00d084' }} />
              ) : (
                <WifiOff size={16} style={{ color: '#ef4444' }} />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: status.connected ? '#00d084' : '#ef4444',
                  }}
                >
                  {status.connected ? 'Connected' : 'Disconnected'}
                </p>
                {status.phone && (
                  <p
                    className="text-xs truncate"
                    style={{ color: '#475569' }}
                  >
                    {status.phone}
                  </p>
                )}
              </div>
              {status.connected && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 pulse-glow"
                  style={{ background: '#00d084', color: '#00d084' }}
                />
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
