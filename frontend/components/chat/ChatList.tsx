'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface Contact {
  id: string;
  name: string;
  phone: string;
  unreadCount?: number;
  lastMessage?: string;
  lastTimestamp?: number;
  mood?: string;
}

interface ChatListProps {
  contacts: Contact[];
  selectedId?: string;
  onSelect: (contact: Contact) => void;
  loading?: boolean;
}

const moodEmoji: Record<string, string> = {
  happy: '😊', sad: '😢', angry: '😠',
  excited: '🤩', neutral: '😐', anxious: '😰', loving: '🥰',
};

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

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export default function ChatList({ contacts, selectedId, onSelect, loading }: ChatListProps) {
  const [search, setSearch] = useState('');

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 flex-shrink-0">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#475569' }}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e2e8f0',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="skeleton w-11 h-11 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-28 rounded" />
                  <div className="skeleton h-3 w-40 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm" style={{ color: '#475569' }}>
              {search ? 'No contacts found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {filtered.map((contact, i) => {
              const isSelected = contact.id === selectedId;
              const color = getAvatarColor(contact.name);

              return (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={!isSelected ? { background: 'rgba(255,255,255,0.04)' } : {}}
                  onClick={() => onSelect(contact)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={
                    isSelected
                      ? {
                          background: 'linear-gradient(135deg, rgba(0,208,132,0.12), rgba(124,58,237,0.06))',
                          border: '1px solid rgba(0,208,132,0.2)',
                        }
                      : {}
                  }
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: color }}
                    >
                      {getInitials(contact.name)}
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
                        style={{ color: isSelected ? '#e2e8f0' : '#cbd5e1' }}
                      >
                        {contact.name}
                      </p>
                      {contact.lastTimestamp && (
                        <span className="text-xs flex-shrink-0 ml-1" style={{ color: '#334155', fontSize: '10px' }}>
                          {formatDistanceToNow(new Date(contact.lastTimestamp * 1000), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs truncate" style={{ color: '#475569' }}>
                        {contact.lastMessage || contact.phone}
                      </p>
                      {(contact.unreadCount ?? 0) > 0 && (
                        <span
                          className="ml-1 flex-shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: '#00d084', fontSize: '10px' }}
                        >
                          {contact.unreadCount! > 9 ? '9+' : contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
