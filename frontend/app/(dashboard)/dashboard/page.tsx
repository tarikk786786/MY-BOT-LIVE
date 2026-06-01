'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Bot,
  Clock,
  BarChart2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { analyticsApi, chatApi } from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import WAStatusBadge from '@/components/dashboard/WAStatusBadge';
import RecentChats from '@/components/dashboard/RecentChats';
import MoodMeter from '@/components/dashboard/MoodMeter';
import { format } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div
        className="rounded-xl px-3 py-2"
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
          {label}
        </p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.value} {p.name}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.getOverview().then((r) => r.data),
  });

  const { data: dailyStats, isLoading: dailyLoading } = useQuery({
    queryKey: ['analytics-daily'],
    queryFn: () => analyticsApi.getDailyStats().then((r) => r.data),
  });

  const { data: moodStats } = useQuery({
    queryKey: ['analytics-moods'],
    queryFn: () => analyticsApi.getMoodStats().then((r) => r.data),
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => chatApi.getContacts().then((r) => r.data),
  });

  const stats = [
    {
      title: 'Total Messages',
      value: overview?.totalMessages?.toLocaleString() ?? '—',
      change: overview?.messagesTrend,
      icon: MessageSquare,
      color: 'green' as const,
    },
    {
      title: 'Active Contacts',
      value: overview?.activeContacts ?? '—',
      change: overview?.contactsTrend,
      icon: Users,
      color: 'purple' as const,
    },
    {
      title: 'AI Replies',
      value: overview?.aiReplies?.toLocaleString() ?? '—',
      change: overview?.aiTrend,
      icon: Bot,
      color: 'blue' as const,
    },
    {
      title: 'Avg Response Time',
      value: overview?.avgResponseTime ? `${overview.avgResponseTime}s` : '—',
      change: overview?.responseTrend,
      icon: Clock,
      color: 'orange' as const,
    },
  ];

  const chartData = dailyStats?.map((d: any) => ({
    date: format(new Date(d.date), 'MMM d'),
    incoming: d.incoming,
    outgoing: d.outgoing,
  })) ?? [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-6"
    >
      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} loading={overviewLoading} />
        ))}
      </motion.div>

      {/* Middle Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Chats */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{
            background: 'rgba(15,15,26,0.8)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-semibold"
              style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
            >
              Recent Conversations
            </h3>
            <a href="/chats" className="text-xs font-medium" style={{ color: '#00d084' }}>
              View all →
            </a>
          </div>
          <RecentChats
            contacts={contacts?.slice(0, 6) ?? []}
            loading={contactsLoading}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <WAStatusBadge />
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(15,15,26,0.8)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h3
              className="font-semibold mb-4"
              style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
            >
              Mood Distribution
            </h3>
            <MoodMeter data={moodStats} />
          </div>
        </div>
      </motion.div>

      {/* Chart Row */}
      <motion.div variants={itemVariants}>
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(15,15,26,0.8)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className="font-semibold"
                style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
              >
                Message Volume
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                Last 7 days — incoming vs outgoing
              </p>
            </div>
            <BarChart2 size={18} style={{ color: '#475569' }} />
          </div>

          {dailyLoading ? (
            <div className="skeleton h-52 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d084" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00d084" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#475569', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#475569', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="incoming"
                  name="messages"
                  stroke="#00d084"
                  strokeWidth={2}
                  fill="url(#colorIn)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="outgoing"
                  name="replies"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#colorOut)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-full" style={{ background: '#00d084' }} />
              <span className="text-xs" style={{ color: '#94a3b8' }}>Incoming</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-full" style={{ background: '#7c3aed' }} />
              <span className="text-xs" style={{ color: '#94a3b8' }}>Outgoing (AI)</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
