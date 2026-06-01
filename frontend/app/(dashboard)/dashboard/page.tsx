'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Bot, Zap, ArrowUpRight } from 'lucide-react';
import { analyticsApi, chatApi } from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentChats from '@/components/dashboard/RecentChats';
import MoodMeter from '@/components/dashboard/MoodMeter';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-panel p-3 rounded-xl shadow-2xl border border-white/10">
        <p className="text-xs font-medium text-silver mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm font-bold flex items-center gap-2" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
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
    { title: 'Total Messages', value: overview?.totalMessages?.toLocaleString() ?? '—', change: overview?.messagesTrend, icon: MessageSquare, color: 'emerald' },
    { title: 'Active Contacts', value: overview?.activeContacts ?? '—', change: overview?.contactsTrend, icon: Users, color: 'amethyst' },
    { title: 'AI Replies', value: overview?.aiReplies?.toLocaleString() ?? '—', change: overview?.aiTrend, icon: Bot, color: 'blue' },
    { title: 'Avg Response', value: overview?.avgResponseTime ? `${overview.avgResponseTime}s` : '—', change: overview?.responseTrend, icon: Zap, color: 'orange' },
  ];

  const chartData = dailyStats?.map((d: any) => ({
    date: format(new Date(d.date), 'MMM d'),
    incoming: d.incoming,
    outgoing: d.outgoing,
  })) ?? [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        
        {/* Top Row: Stats (4 columns) */}
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <StatsCard {...stat as any} loading={overviewLoading} />
          </motion.div>
        ))}

        {/* Main Chart (Spans 3 columns) */}
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3 glass-card p-6 h-[400px] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-glow/5 blur-[100px] rounded-full pointer-events-none transition-all duration-700 group-hover:bg-emerald-glow/10" />
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h3 className="text-xl font-display font-semibold text-white">Engagement Volume</h3>
              <p className="text-sm text-silver mt-1">Incoming vs AI Generated Responses</p>
            </div>
            <button className="btn-magnetic w-10 h-10 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={18} className="text-silver" />
            </button>
          </div>

          <div className="flex-1 relative z-10">
            {dailyLoading ? (
              <div className="w-full h-full animate-pulse bg-white/5 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="incoming" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" activeDot={{r: 6, fill: '#10b981', stroke: '#000', strokeWidth: 2}} />
                  <Area type="monotone" dataKey="outgoing" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" activeDot={{r: 6, fill: '#8b5cf6', stroke: '#000', strokeWidth: 2}} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Mood Analysis (1 column) */}
        <motion.div variants={itemVariants} className="glass-card p-6 h-[400px] flex flex-col relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-amethyst-glow/10 blur-[80px] rounded-full pointer-events-none" />
          <h3 className="text-xl font-display font-semibold text-white mb-6">Mood Radar</h3>
          <div className="flex-1">
            <MoodMeter data={moodStats} />
          </div>
        </motion.div>

        {/* Recent Chats (Full width bottom row) */}
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-4 glass-card p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-semibold text-white">Active Conversations</h3>
            <a href="/chats" className="text-sm font-medium text-emerald-glow hover:text-emerald-400 transition-colors">
              View all
            </a>
          </div>
          <RecentChats contacts={contacts?.slice(0, 8) ?? []} loading={contactsLoading} />
        </motion.div>

      </div>
    </motion.div>
  );
}
