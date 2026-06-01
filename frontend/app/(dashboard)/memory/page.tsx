'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  Search,
  X,
  Save,
  Trash2,
  Tag,
  MessageSquare,
  Shield,
  Loader2,
  ChevronRight,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { memoryApi } from '@/lib/api';

interface Memory {
  contactId: string;
  contactName: string;
  phone: string;
  nickname?: string;
  relationshipLevel: number;
  mood?: string;
  messageCount: number;
  interests?: string[];
  facts?: string[];
  personalityOverride?: string;
  blocked?: boolean;
}

const moodEmoji: Record<string, string> = {
  happy: '😊', sad: '😢', angry: '😠',
  excited: '🤩', neutral: '😐', anxious: '😰', loving: '🥰',
};

const avatarColors = ['#00d084','#7c3aed','#f59e0b','#3b82f6','#ef4444','#8b5cf6'];
function getAvatarColor(name: string) {
  let h = 0;
  for (let c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return avatarColors[Math.abs(h) % avatarColors.length];
}
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export default function MemoryPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Memory | null>(null);
  const [editing, setEditing] = useState<Partial<Memory>>({});
  const [newInterest, setNewInterest] = useState('');
  const [newFact, setNewFact] = useState('');
  const queryClient = useQueryClient();

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: () => memoryApi.getAll().then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      memoryApi.update(id, data),
    onSuccess: () => {
      toast.success('Memory updated!');
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
    onError: () => toast.error('Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memoryApi.delete(id),
    onSuccess: () => {
      toast.success('Memory deleted');
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const filtered = memories.filter((m: Memory) =>
    m.contactName?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search)
  );

  const openMemory = (m: Memory) => {
    setSelected(m);
    setEditing({ ...m });
  };

  const handleSave = () => {
    if (!selected) return;
    updateMutation.mutate({ id: selected.contactId, data: editing });
  };

  const addInterest = () => {
    if (!newInterest.trim()) return;
    setEditing((e) => ({
      ...e,
      interests: [...(e.interests || []), newInterest.trim()],
    }));
    setNewInterest('');
  };

  const addFact = () => {
    if (!newFact.trim()) return;
    setEditing((e) => ({
      ...e,
      facts: [...(e.facts || []), newFact.trim()],
    }));
    setNewFact('');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
          >
            Memory Manager
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            {memories.length} contact memories stored
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#e2e8f0',
          }}
        />
      </div>

      <div className="flex gap-6">
        {/* Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-40 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((m: Memory, i: number) => {
                const color = getAvatarColor(m.contactName);
                return (
                  <motion.div
                    key={m.contactId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -3 }}
                    onClick={() => openMemory(m)}
                    className="rounded-2xl p-4 cursor-pointer transition-all card-hover"
                    style={{
                      background: selected?.contactId === m.contactId
                        ? 'rgba(0,208,132,0.08)'
                        : 'rgba(15,15,26,0.8)',
                      border: `1px solid ${
                        selected?.contactId === m.contactId
                          ? 'rgba(0,208,132,0.3)'
                          : 'rgba(255,255,255,0.06)'
                      }`,
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: color }}
                      >
                        {getInitials(m.contactName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold truncate" style={{ color: '#e2e8f0' }}>
                            {m.nickname || m.contactName}
                          </p>
                          {m.mood && <span className="text-sm">{moodEmoji[m.mood]}</span>}
                        </div>
                        <p className="text-xs truncate" style={{ color: '#475569' }}>
                          {m.phone}
                        </p>
                      </div>
                      {m.blocked && (
                        <Shield size={14} style={{ color: '#ef4444' }} />
                      )}
                    </div>

                    {/* Relationship bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: '#475569' }}>Relationship</span>
                        <span className="text-xs font-semibold" style={{ color: '#00d084' }}>
                          Lv. {m.relationshipLevel || 1}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (m.relationshipLevel || 1) * 10)}%`,
                            background: 'linear-gradient(90deg, #00d084, #7c3aed)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <MessageSquare size={12} style={{ color: '#475569' }} />
                        <span className="text-xs" style={{ color: '#64748b' }}>
                          {m.messageCount} msgs
                        </span>
                      </div>
                      {m.interests?.length ? (
                        <div className="flex items-center gap-1">
                          <Tag size={12} style={{ color: '#475569' }} />
                          <span className="text-xs" style={{ color: '#64748b' }}>
                            {m.interests.length} interests
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 360 }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <div
                className="w-[360px] rounded-2xl p-5 space-y-4"
                style={{
                  background: 'rgba(15,15,26,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}>
                    Edit Memory
                  </h3>
                  <button onClick={() => setSelected(null)} style={{ color: '#475569' }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Nickname */}
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#94a3b8' }}>
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={editing.nickname || ''}
                    onChange={(e) => setEditing((ed) => ({ ...ed, nickname: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e2e8f0',
                    }}
                    placeholder="Enter nickname..."
                  />
                </div>

                {/* Interests */}
                <div>
                  <label className="text-xs font-medium block mb-2" style={{ color: '#94a3b8' }}>
                    Interests
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(editing.interests || []).map((interest, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{
                          background: 'rgba(0,208,132,0.12)',
                          border: '1px solid rgba(0,208,132,0.2)',
                          color: '#00d084',
                        }}
                      >
                        {interest}
                        <button
                          onClick={() =>
                            setEditing((ed) => ({
                              ...ed,
                              interests: ed.interests?.filter((_, j) => j !== i),
                            }))
                          }
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                      placeholder="Add interest..."
                      className="flex-1 px-3 py-1.5 rounded-lg text-sm"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#e2e8f0',
                      }}
                    />
                    <button
                      onClick={addInterest}
                      className="px-2 rounded-lg"
                      style={{ background: 'rgba(0,208,132,0.15)', color: '#00d084' }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Facts */}
                <div>
                  <label className="text-xs font-medium block mb-2" style={{ color: '#94a3b8' }}>
                    Facts
                  </label>
                  <div className="space-y-1 mb-2">
                    {(editing.facts || []).map((fact, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span
                          className="flex-1 text-xs px-2 py-1 rounded"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
                        >
                          {fact}
                        </span>
                        <button
                          onClick={() =>
                            setEditing((ed) => ({
                              ...ed,
                              facts: ed.facts?.filter((_, j) => j !== i),
                            }))
                          }
                          style={{ color: '#475569' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFact}
                      onChange={(e) => setNewFact(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addFact()}
                      placeholder="Add fact..."
                      className="flex-1 px-3 py-1.5 rounded-lg text-sm"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#e2e8f0',
                      }}
                    />
                    <button
                      onClick={addFact}
                      className="px-2 rounded-lg"
                      style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7' }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Personality Override */}
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#94a3b8' }}>
                    Personality Override
                  </label>
                  <select
                    value={editing.personalityOverride || ''}
                    onChange={(e) => setEditing((ed) => ({ ...ed, personalityOverride: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e2e8f0',
                    }}
                  >
                    <option value="">Use default</option>
                    <option value="best_friend">Best Friend</option>
                    <option value="girlfriend">Girlfriend</option>
                    <option value="mentor">Mentor</option>
                    <option value="gym_bro">Gym Bro</option>
                    <option value="emotional">Emotional Support</option>
                    <option value="funny">Funny</option>
                  </select>
                </div>

                {/* Blocked Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Block Contact</p>
                    <p className="text-xs" style={{ color: '#475569' }}>AI won't reply to this contact</p>
                  </div>
                  <button
                    onClick={() => setEditing((ed) => ({ ...ed, blocked: !ed.blocked }))}
                    className="relative w-11 h-6 rounded-full transition-colors"
                    style={{
                      background: editing.blocked ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <span
                      className="absolute top-1 w-4 h-4 rounded-full transition-all"
                      style={{
                        background: 'white',
                        left: editing.blocked ? '24px' : '4px',
                      }}
                    />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #00d084, #00b894)',
                      color: 'white',
                    }}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => deleteMutation.mutate(selected.contactId)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444',
                    }}
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
