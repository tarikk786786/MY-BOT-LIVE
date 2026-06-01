'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  LogOut,
  User,
  ChevronDown,
  Menu,
  Settings,
  Shield,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/chats': 'Live Chats',
  '/whatsapp': 'WhatsApp Manager',
  '/memory': 'Memory Manager',
  '/personality': 'Personalities',
  '/prompts': 'Prompt Editor',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export default function TopBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  const pageTitle =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ||
    'Dashboard';

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    clearAuth();
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'AI';

  return (
    <header
      className="flex items-center justify-between px-6 py-4 flex-shrink-0"
      style={{
        background: 'rgba(10, 10, 20, 0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: '#94a3b8' }}
        >
          <Menu size={20} />
        </button>

        <div>
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
          >
            {pageTitle}
          </h2>
          <p className="text-xs" style={{ color: '#475569' }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-xl transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#94a3b8',
          }}
        >
          <Bell size={18} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#00d084' }}
          />
        </motion.button>

        {/* Avatar Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, #00d084, #7c3aed)',
                color: 'white',
              }}
            >
              {initials}
            </div>
            <span className="text-sm font-medium hidden sm:block" style={{ color: '#e2e8f0' }}>
              {user?.username || 'Admin'}
            </span>
            <ChevronDown
              size={14}
              style={{ color: '#94a3b8' }}
              className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </motion.button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50"
                style={{
                  background: '#14141f',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                }}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="p-2 space-y-1">
                  <div
                    className="px-3 py-2 border-b mb-1"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>
                      {user?.username || 'Admin'}
                    </p>
                    <p className="text-xs" style={{ color: '#475569' }}>
                      {user?.role || 'Administrator'}
                    </p>
                  </div>

                  {[
                    { icon: User, label: 'Profile', action: () => {} },
                    { icon: Settings, label: 'Settings', action: () => router.push('/settings') },
                    { icon: Shield, label: 'Security', action: () => {} },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
                      style={{ color: '#94a3b8' }}
                    >
                      <item.icon size={15} />
                      {item.label}
                    </button>
                  ))}

                  <div
                    className="border-t pt-1 mt-1"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <button
                      onClick={() => { handleLogout(); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-red-500/10"
                      style={{ color: '#ef4444' }}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
