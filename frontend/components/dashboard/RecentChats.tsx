'use client';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Contact {
  id: string;
  name: string;
  phone: string;
  unreadCount?: number;
  lastMessage?: string;
  lastTimestamp?: number;
  mood?: string;
}

interface RecentChatsProps {
  contacts: Contact[];
  loading?: boolean;
}

const moodEmoji: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  excited: '🤩',
  neutral: '😐',
  anxious: '😰',
  loving: '🥰',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const avatarColors = [
  '#00d084', '#7c3aed', '#f59e0b', '#3b82f6',
  '#ef4444', '#8b5cf6', '#06b6d4', '#10b981',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function RecentChats({ contacts, loading }: RecentChatsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-48 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!contacts?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: '#475569' }}>
          No recent conversations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {contacts.map((contact, i) => {
        const color = getAvatarColor(contact.name);
        const initials = getInitials(contact.name);

        return (
          <Link key={contact.id} href={`/chats?contact=${contact.id}`}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{
                background: 'rgba(255,255,255,0.05)',
                x: 2,
              }}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
            >
              {/* Avatar */}
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: color }}
                >
                  {initials}
                </div>
                {contact.mood && moodEmoji[contact.mood] && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-xs">
                    {moodEmoji[contact.mood]}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: '#e2e8f0' }}
                  >
                    {contact.name}
                  </p>
                  {contact.lastTimestamp && (
                    <p className="text-xs flex-shrink-0 ml-2" style={{ color: '#475569' }}>
                      {formatDistanceToNow(new Date(contact.lastTimestamp * 1000), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p
                    className="text-xs truncate"
                    style={{ color: '#64748b' }}
                  >
                    {contact.lastMessage || 'No messages yet'}
                  </p>
                  {contact.unreadCount ? (
                    <span
                      className="ml-2 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: '#00d084', fontSize: '10px' }}
                    >
                      {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
