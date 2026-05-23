import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Activity, Brain, Target, Flame, ChevronRight, Code2, PlaySquare, Loader2, Sparkles, AlertTriangle,
  TrendingUp, Calendar, Trophy, Zap, ArrowUpRight, Search, Plus
} from 'lucide-react';

import { AuthContext } from '../services/auth.service';
import { fetchDashboard } from '../services/api.service';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { GlowingButton } from '../components/ui/GlowingButton';
import { Navbar } from '../components/shared/Navbar';
import { cn } from '../utils/cn';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';

interface DashboardData {
  stats: {
    totalInterviews: number;
    totalCoding: number;
    averageScore: number;
    streak: number;
  };
  trends: Array<{ name: string; score: number }>;
  topicAverages: Array<{ topic: string; average: number; attempts: number }>;
  insights: {
    weakTopics: string[];
    improvementPlan: string;
    quickActions: Array<{ title: string; action: string; type: string }>;
    memory?: {
      growthRate: string;
    };
  };
  activityTimeline: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    date: string;
    tags: string[];
  }>;
}

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchDashboard();
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Derive unlocked badges from milestone events
  const unlockedBadges = data?.activityTimeline?.filter(a => a.type === 'milestone') || [];
  // Ensure we show at least some empty slots if less than 3
  const displayBadges = [...unlockedBadges];
  while (displayBadges.length < 3) {
      displayBadges.push(null as any);
  }

  const growthRate = data?.insights?.memory?.growthRate || '0%';
  const isPositiveGrowth = !growthRate.startsWith('-');

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <Navbar />
      
      {/* Immersive Background */}
      <div className="fixed inset-0 bg-grid-white pointer-events-none opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none animate-pulse" />

      <main className="relative z-10 pt-36 pb-24 px-6 max-w-[1600px] mx-auto">
        
        {/* Cinematic Header */}
        <div className="mb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Live</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">AI Active</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-3">
              Intelligence <span className="text-gradient">Briefing</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl font-medium">
              Welcome, {user?.name?.split(' ')[0] || 'Candidate'}. Your career metrics are trending <span className={cn(isPositiveGrowth ? "text-emerald-400" : "text-amber-400", "font-bold")}>{growthRate}</span> this week.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
               <Calendar className="w-4 h-4 text-slate-500" />
               <span className="text-sm font-bold text-slate-300">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
            </div>
            <GlowingButton onClick={() => {
              navigate('/career');
            }} className="h-14 px-8">
              <Plus className="w-5 h-5 mr-2" /> Resume Career OS
            </GlowingButton>
          </motion.div>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 gap-6">
          
          {/* 1. PRIMARY METRICS - 4 CARDS */}
          <div className="xl:col-span-3 space-y-6">
             <MetricCard 
                label="AI Mastery Score" 
                value={data?.stats.averageScore || 0} 
                suffix="/100"
                trend={data?.stats.averageScore ? "+Active" : "New"}
                icon={Brain} 
                color="indigo" 
             />
             <MetricCard 
                label="Active Streak" 
                value={data?.stats.streak || 0} 
                suffix="DAYS"
                trend={data?.stats.streak ? "Fire" : "Stable"}
                icon={Flame} 
                color="orange" 
             />
          </div>

          <div className="xl:col-span-3 space-y-6">
             <MetricCard 
                label="Interview Count" 
                value={data?.stats.totalInterviews || 0} 
                suffix="SESSIONS"
                trend={data?.stats.totalInterviews ? `+${data.stats.totalInterviews}` : "Start"}
                icon={Target} 
                color="emerald" 
             />
             <MetricCard 
                label="Code Challenges" 
                value={data?.stats.totalCoding || 0} 
                suffix="SOLVED"
                trend={data?.stats.totalCoding ? `+${data.stats.totalCoding}` : "Start"}
                icon={Code2} 
                color="blue" 
             />
          </div>

          {/* 2. PERFORMANCE CHART - LARGE */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="xl:col-span-6"
          >
            <SpotlightCard className="h-full p-8 flex flex-col">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Growth Velocity</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time Performance Index</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-400">MASTERY</span>
                  </div>
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              
              <div className="w-full h-[280px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.trends || []}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#ffffff20" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis hide domain={[0, 'dataMax + 20']} />
                    <Tooltip 
                       content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass-panel px-4 py-2 rounded-xl border-white/10 shadow-2xl">
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{payload[0].payload.name}</p>
                              <p className="text-lg font-black text-white">{payload[0].value} XP</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      strokeWidth={4} 
                      fill="url(#chartGradient)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* 3. AI ACTION CENTER - WIDE */}
          <div className="xl:col-span-8">
            <SpotlightCard className="p-8 border-indigo-500/20 overflow-hidden relative group h-full">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] group-hover:bg-indigo-600/15 transition-colors" />
              
              <div className="flex flex-col lg:flex-row gap-10 relative z-10 h-full">
                <div className="lg:w-1/3">
                  <div className="w-16 h-16 rounded-[24px] bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 mb-6 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4">Strategic Advisor</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-black text-slate-300 uppercase">Priority One: System Design</span>
                    </div>
                  </div>
                </div>

                <div className="lg:w-2/3 border-l border-white/5 lg:pl-10 flex flex-col justify-center">
                  <p className="text-xl text-slate-300 font-medium leading-relaxed mb-8 italic">
                    "{data?.insights.improvementPlan}"
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    {data?.insights.quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(action.action)}
                        className={cn(
                          "px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                          action.type === 'primary' 
                            ? "bg-indigo-500 text-white shadow-lg hover:bg-indigo-400 hover:scale-105 active:scale-95" 
                            : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95"
                        )}
                      >
                        {action.title}
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* 4. ACHIEVEMENTS & TOPICS - TALL */}
          <div className="xl:col-span-4 space-y-6">
             {/* Actual Unlocked Badges */}
             <SpotlightCard className="p-6 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">Milestone Badges</h3>
                   <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex gap-4">
                   {displayBadges.slice(0, 3).map((badge, idx) => (
                      <div 
                         key={idx} 
                         className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center border transition-all",
                            badge 
                               ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]" 
                               : "bg-slate-800/50 border-white/5 opacity-30 grayscale"
                         )}
                         title={badge?.title || "Locked Milestone"}
                      >
                         <Trophy className="w-5 h-5" />
                      </div>
                   ))}
                </div>
                {unlockedBadges.length > 0 && (
                   <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mt-4 font-black">
                      Latest: {unlockedBadges[0].title}
                   </p>
                )}
             </SpotlightCard>

             {/* Focus Areas */}
             <SpotlightCard className="p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Domain Analysis</h3>
                <div className="space-y-5">
                   {data?.topicAverages?.slice(0, 3).map((topic, i) => (
                     <div key={i}>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-slate-200">{topic.topic}</span>
                           <span className="text-xs font-black text-white">{Math.round(topic.average)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${topic.average}%` }}
                              transition={{ duration: 1, delay: i * 0.2 }}
                              className={cn("h-full rounded-full", i === 0 ? "bg-rose-500" : "bg-indigo-500")} 
                           />
                        </div>
                     </div>
                   ))}
                   {(!data?.topicAverages || data.topicAverages.length === 0) && (
                      <p className="text-xs text-slate-500 font-mono">No domain data. Complete an interview to analyze.</p>
                   )}
                </div>
             </SpotlightCard>
          </div>

          {/* 5. FEED - BOTTOM WIDE */}
          <div className="xl:col-span-12">
            <SpotlightCard className="p-8">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Recent Activity</h3>
                  <div className="flex items-center gap-3">
                     <button onClick={() => navigate('/analytics')} className="text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors px-4 py-2 bg-indigo-500/10 rounded-xl">
                       View Full History &rarr;
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <AnimatePresence>
                     {data?.activityTimeline?.slice(0, 5).map((item, i) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group cursor-pointer flex flex-col justify-between"
                        >
                           <div>
                              <div className="flex items-center gap-3 mb-4">
                                 <div className={cn(
                                   "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                                   item.type === 'interview' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : 
                                   item.type === 'coding' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                   item.type === 'milestone' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                   "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400"
                                 )}>
                                    {item.type === 'interview' ? <Target className="w-5 h-5" /> : 
                                     item.type === 'coding' ? <Code2 className="w-5 h-5" /> : 
                                     item.type === 'milestone' ? <Trophy className="w-5 h-5" /> : 
                                     <Brain className="w-5 h-5" />}
                                 </div>
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                 </span>
                              </div>
                              <h4 className="font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">{item.title}</h4>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                           </div>
                           {item.tags && item.tags.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-1">
                                 {item.tags.map(t => (
                                    <span key={t} className="text-[9px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                                       {t}
                                    </span>
                                 ))}
                              </div>
                           )}
                        </motion.div>
                     ))}
                  </AnimatePresence>
                  
                  {(!data?.activityTimeline || data.activityTimeline.length === 0) && (
                      <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl">
                          <Activity className="w-8 h-8 text-slate-600 mb-3" />
                          <p className="text-slate-400 font-medium">No recent activity detected.</p>
                      </div>
                  )}
               </div>
            </SpotlightCard>
          </div>

        </div>
      </main>
    </div>
  );
}

const MetricCard = ({ label, value, suffix, trend, icon: Icon, color }: any) => {
  const colorMap: any = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20 shadow-orange-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10"
  };

  return (
    <motion.div whileHover={{ y: -5 }}>
      <SpotlightCard className="p-6 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className={cn("w-12 h-12 rounded-[18px] flex items-center justify-center border", colorMap[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-center gap-2">
               <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", colorMap[color])}>{trend}</span>
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-4xl font-black text-white">{value}</h3>
          <span className="text-xs font-bold text-slate-500 uppercase">{suffix}</span>
        </div>
      </SpotlightCard>
    </motion.div>
  );
};