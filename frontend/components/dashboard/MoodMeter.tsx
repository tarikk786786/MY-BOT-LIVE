'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MoodData {
  mood: string;
  count: number;
  percentage: number;
}

interface MoodMeterProps {
  data?: MoodData[];
  loading?: boolean;
}

const moodConfig: Record<
  string,
  { emoji: string; label: string; color: string; bg: string }
> = {
  happy: { emoji: '😊', label: 'Happy', color: '#00d084', bg: 'rgba(0,208,132,0.15)' },
  excited: { emoji: '🤩', label: 'Excited', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  loving: { emoji: '🥰', label: 'Loving', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  neutral: { emoji: '😐', label: 'Neutral', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  sad: { emoji: '😢', label: 'Sad', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  anxious: { emoji: '😰', label: 'Anxious', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  angry: { emoji: '😠', label: 'Angry', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

const defaultData: MoodData[] = [
  { mood: 'happy', count: 45, percentage: 45 },
  { mood: 'excited', count: 22, percentage: 22 },
  { mood: 'loving', count: 15, percentage: 15 },
  { mood: 'neutral', count: 10, percentage: 10 },
  { mood: 'sad', count: 5, percentage: 5 },
  { mood: 'angry', count: 3, percentage: 3 },
];

export default function MoodMeter({ data = defaultData, loading }: MoodMeterProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3">
      {sorted.map((item, i) => {
        const config = moodConfig[item.mood] || {
          emoji: '💬',
          label: item.mood,
          color: '#94a3b8',
          bg: 'rgba(148,163,184,0.15)',
        };

        return (
          <motion.div
            key={item.mood}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-base">{config.emoji}</span>
                <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                  {config.label}
                </span>
              </div>
              <span className="text-xs font-semibold" style={{ color: config.color }}>
                {item.percentage}%
              </span>
            </div>

            {/* Bar */}
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: config.color }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
