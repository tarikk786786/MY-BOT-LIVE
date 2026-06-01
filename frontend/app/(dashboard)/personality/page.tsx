'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Star,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  Sparkles,
  Check,
  Thermometer,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { personalityApi } from '@/lib/api';

interface Personality {
  _id: string;
  name: string;
  mode: string;
  description?: string;
  traits: string[];
  temperature: number;
  isDefault: boolean;
  systemPrompt?: string;
}

const modeColors: Record<string, { bg: string; border: string; text: string }> = {
  best_friend: { bg: 'rgba(0,208,132,0.12)', border: 'rgba(0,208,132,0.3)', text: '#00d084' },
  girlfriend: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', text: '#ec4899' },
  mentor: { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.3)', text: '#a855f7' },
  gym_bro: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  emotional: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
  funny: { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', text: '#eab308' },
};

const emptyPersonality: Partial<Personality> = {
  name: '',
  mode: 'best_friend',
  description: '',
  traits: [],
  temperature: 0.8,
  systemPrompt: '',
};

export default function PersonalityPage() {
  const [modal, setModal] = useState<Partial<Personality> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newTrait, setNewTrait] = useState('');
  const queryClient = useQueryClient();

  const { data: personalities = [], isLoading } = useQuery({
    queryKey: ['personalities'],
    queryFn: () => personalityApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => personalityApi.create(data),
    onSuccess: () => {
      toast.success('Personality created!');
      queryClient.invalidateQueries({ queryKey: ['personalities'] });
      setModal(null);
    },
    onError: () => toast.error('Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      personalityApi.update(id, data),
    onSuccess: () => {
      toast.success('Personality updated!');
      queryClient.invalidateQueries({ queryKey: ['personalities'] });
      setModal(null);
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => personalityApi.delete(id),
    onSuccess: () => {
      toast.success('Personality deleted');
      queryClient.invalidateQueries({ queryKey: ['personalities'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => personalityApi.setDefault(id),
    onSuccess: () => {
      toast.success('Default personality set!');
      queryClient.invalidateQueries({ queryKey: ['personalities'] });
    },
    onError: () => toast.error('Failed to set default'),
  });

  const seedMutation = useMutation({
    mutationFn: personalityApi.seedDefaults,
    onSuccess: () => {
      toast.success('Default personalities seeded!');
      queryClient.invalidateQueries({ queryKey: ['personalities'] });
    },
    onError: () => toast.error('Seed failed'),
  });

  const openNew = () => {
    setIsNew(true);
    setModal({ ...emptyPersonality });
  };

  const openEdit = (p: Personality) => {
    setIsNew(false);
    setModal({ ...p });
  };

  const handleSave = () => {
    if (!modal) return;
    if (isNew) {
      createMutation.mutate(modal);
    } else {
      updateMutation.mutate({ id: modal._id as string, data: modal });
    }
  };

  const addTrait = () => {
    if (!newTrait.trim() || !modal) return;
    setModal((m) => ({ ...m, traits: [...(m?.traits || []), newTrait.trim()] }));
    setNewTrait('');
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
          >
            Personalities
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            Configure your AI companion's personas
          </p>
        </div>
        <div className="flex gap-2">
          {personalities.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.25)',
                color: '#a855f7',
              }}
            >
              {seedMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Zap size={14} />
              )}
              Seed Defaults
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #00d084, #00b894)' }}
          >
            <Plus size={16} />
            New Personality
          </motion.button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personalities.map((p: Personality, i: number) => {
            const colors = modeColors[p.mode] || modeColors.best_friend;
            return (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                className="rounded-2xl p-5 card-hover relative"
                style={{
                  background: 'rgba(15,15,26,0.8)',
                  border: `1px solid ${p.isDefault ? 'rgba(0,208,132,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {/* Default Star */}
                {p.isDefault && (
                  <div className="absolute top-3 right-3">
                    <Star size={16} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                  </div>
                )}

                {/* Mode Badge */}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-3"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
                >
                  <Sparkles size={10} />
                  {p.mode.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>

                <h3
                  className="font-bold mb-1"
                  style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
                >
                  {p.name}
                </h3>

                {p.description && (
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: '#64748b' }}>
                    {p.description}
                  </p>
                )}

                {/* Traits */}
                {p.traits?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.traits.slice(0, 4).map((trait) => (
                      <span
                        key={trait}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                      >
                        {trait}
                      </span>
                    ))}
                    {p.traits.length > 4 && (
                      <span className="text-xs" style={{ color: '#475569' }}>
                        +{p.traits.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Temperature */}
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer size={12} style={{ color: '#f59e0b' }} />
                  <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.temperature * 100}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #f59e0b)',
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: '#64748b' }}>
                    {p.temperature}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#94a3b8',
                    }}
                  >
                    <Edit3 size={12} />
                    Edit
                  </motion.button>

                  {!p.isDefault && (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => defaultMutation.mutate(p._id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        color: '#f59e0b',
                      }}
                    >
                      <Star size={12} />
                      Set Default
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => deleteMutation.mutate(p._id)}
                    className="p-1.5 rounded-lg"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      color: '#ef4444',
                    }}
                  >
                    <Trash2 size={12} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl p-6 space-y-4"
              style={{
                background: '#14141f',
                border: '1px solid rgba(255,255,255,0.1)',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
            >
              <div className="flex items-center justify-between">
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
                >
                  {isNew ? 'New Personality' : 'Edit Personality'}
                </h3>
                <button onClick={() => setModal(null)} style={{ color: '#475569' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#94a3b8' }}>Name</label>
                  <input
                    type="text"
                    value={modal.name || ''}
                    onChange={(e) => setModal((m) => ({ ...m, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
                    placeholder="Persona name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#94a3b8' }}>Mode</label>
                  <select
                    value={modal.mode || 'best_friend'}
                    onChange={(e) => setModal((m) => ({ ...m, mode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
                  >
                    <option value="best_friend">Best Friend</option>
                    <option value="girlfriend">Girlfriend</option>
                    <option value="mentor">Mentor</option>
                    <option value="gym_bro">Gym Bro</option>
                    <option value="emotional">Emotional Support</option>
                    <option value="funny">Funny</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#94a3b8' }}>Description</label>
                <input
                  type="text"
                  value={modal.description || ''}
                  onChange={(e) => setModal((m) => ({ ...m, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
                  placeholder="Brief description..."
                />
              </div>

              {/* Traits */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: '#94a3b8' }}>Traits</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(modal.traits || []).map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#a855f7' }}
                    >
                      {t}
                      <button onClick={() => setModal((m) => ({ ...m, traits: m?.traits?.filter((_, j) => j !== i) }))}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTrait}
                    onChange={(e) => setNewTrait(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTrait()}
                    placeholder="Add trait..."
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
                  />
                  <button onClick={addTrait} className="px-3 rounded-lg text-sm" style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7' }}>
                    Add
                  </button>
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: '#94a3b8' }}>
                  Temperature: {modal.temperature?.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={modal.temperature ?? 0.8}
                  onChange={(e) => setModal((m) => ({ ...m, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: '#334155' }}>
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving || !modal.name}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #00d084, #00b894)' }}
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isNew ? 'Create' : 'Save Changes'}
                </motion.button>
                <button
                  onClick={() => setModal(null)}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
