'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color?: 'green' | 'purple' | 'blue' | 'orange';
  loading?: boolean;
}

const colorMap = {
  green: {
    bg: 'rgba(0, 208, 132, 0.1)',
    border: 'rgba(0, 208, 132, 0.2)',
    icon: '#00d084',
    glow: 'rgba(0,208,132,0.15)',
  },
  purple: {
    bg: 'rgba(124, 58, 237, 0.1)',
    border: 'rgba(124, 58, 237, 0.2)',
    icon: '#a855f7',
    glow: 'rgba(124,58,237,0.15)',
  },
  blue: {
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.2)',
    icon: '#60a5fa',
    glow: 'rgba(59,130,246,0.15)',
  },
  orange: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.2)',
    icon: '#fbbf24',
    glow: 'rgba(245,158,11,0.15)',
  },
};

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'green',
  loading = false,
}: StatsCardProps) {
  const colors = colorMap[color];

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="skeleton h-8 w-8 rounded-xl mb-4" />
        <div className="skeleton h-4 w-24 mb-2 rounded" />
        <div className="skeleton h-8 w-16 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: `0 12px 40px ${colors.glow}` }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl p-5 cursor-default transition-all"
      style={{
        background: 'rgba(15,15,26,0.8)',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 4px 20px ${colors.glow}`,
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: colors.bg }}
      >
        <Icon size={20} style={{ color: colors.icon }} />
      </div>

      {/* Title */}
      <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>
        {title}
      </p>

      {/* Value */}
      <motion.p
        key={String(value)}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-2xl font-bold"
        style={{ color: '#e2e8f0', fontFamily: 'Sora, sans-serif' }}
      >
        {value}
      </motion.p>

      {/* Change */}
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {change >= 0 ? (
            <TrendingUp size={14} style={{ color: '#00d084' }} />
          ) : (
            <TrendingDown size={14} style={{ color: '#ef4444' }} />
          )}
          <span
            className="text-xs font-medium"
            style={{ color: change >= 0 ? '#00d084' : '#ef4444' }}
          >
            {change >= 0 ? '+' : ''}{change}%
          </span>
          <span className="text-xs" style={{ color: '#475569' }}>
            vs last week
          </span>
        </div>
      )}
    </motion.div>
  );
}
