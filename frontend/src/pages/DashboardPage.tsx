import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Pulse, Brain, Target, Fire, CaretRight, Code, CircleNotch, Sparkle,
  TrendUp, CalendarBlank, Trophy, ArrowUpRight, Plus, ChartLineUp, TerminalWindow, Graph, Info
} from '@phosphor-icons/react';

import { AuthContext } from '../services/auth.service';
import { fetchDashboard } from '../services/api.service';
import { Navbar } from '../components/shared/Navbar';
import { cn } from '../utils';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

interface DashboardData {
  intelligenceIndex?: {
    score: number;
    breakdown: any;
  };
  telemetry?: {
    streak: { current: number; longest: number; expectedGain: string };
    simulations: { total: number; completed: number; abandoned: number };
    mastery: { score: number; level: string; neededForNext: number };
  };
  trajectory?: Array<{ day: string; score: number; reason: string }>;
  skillDNA?: Array<{ topic: string; score: number; evidence: any }>;
  persistentMemory?: { observation: string; evidence: string[] };
  recentInterviews?: Array<{
    id: string;
    role: string;
    score: number;
    date: string;
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

  const ii = data?.intelligenceIndex?.score || 0;
  const growthRate = data?.telemetry?.streak?.expectedGain || '+0%';
  const isPositiveGrowth = growthRate.includes('+');

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10"></div>
      <Navbar />
      
      <main className="relative z-10 pt-32 pb-24 px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Cinematic Header */}
        <div className="mb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 flex items-center gap-2 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Live Engine</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 text-white">
              Intelligence Briefing
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl font-medium">
              Welcome back, <span className="text-slate-200">{user?.name?.split(' ')[0] || 'Candidate'}</span>. Your platform velocity is trending <span className={cn(isPositiveGrowth ? "text-indigo-400" : "text-slate-300", "font-bold")}>{growthRate}</span> this week.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-4"
          >
            <button onClick={() => navigate('/career')} className="group flex items-center gap-2 h-10 px-5 rounded-lg bg-white text-black text-sm font-bold hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Resume Operations <ArrowUpRight size={16} weight="bold" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* MODULAR BENTO GRID */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        >
          
          {/* PRIMARY METRICS - ROW 1 */}
          <div className="col-span-1 lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
             <MetricCard 
                label="Intelligence Index" 
                value={data?.intelligenceIndex?.score || 0} 
                suffix="PT"
                trend={data?.intelligenceIndex?.score ? "+Active" : "New"}
                icon={Brain} 
                color="indigo"
                evidence={data?.intelligenceIndex?.evidence}
             />
             <MetricCard 
                label="Active Streak" 
                value={data?.telemetry?.streak?.current || 0} 
                suffix="D"
                trend={data?.telemetry?.streak?.current ? "Fire" : "Stable"}
                icon={Fire} 
                color="amber"
             />
             <MetricCard 
                label="Simulations" 
                value={data?.telemetry?.simulations?.total || 0} 
                suffix="X"
                trend={data?.telemetry?.simulations?.total ? `+${data.telemetry.simulations.total}` : "Start"}
                icon={Target} 
                color="emerald"
             />
             <MetricCard 
                label="Mastery Level" 
                value={data?.telemetry?.mastery?.score || 0} 
                suffix="PT"
                trend={data?.telemetry?.mastery?.level || "Beginner"}
                icon={TerminalWindow} 
                color="fuchsia"
                evidence={data?.telemetry?.mastery?.evidence}
             />
          </div>

          {/* MAIN COLUMN - CHARTS & ACTIVITY */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-5">
            
            {/* VELOCITY CHART */}
            <motion.div variants={fadeUp} className="bg-indigo-950/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group hover:bg-indigo-950/20 transition-all">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-500/10 transition-colors" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                    <ChartLineUp size={20} className="text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Growth Velocity</h3>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Real-time Performance Index</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Tracking</span>
                </div>
              </div>
              
              <div className="w-full h-[320px] relative z-10">
                {(!data?.trajectory || data.trajectory.length < 2) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                     <Graph size={32} className="text-slate-600 mb-4" />
                     <h4 className="text-white font-bold text-sm mb-2 text-center">Velocity Tracking Inactive</h4>
                     <p className="text-xs text-slate-500 mb-6 text-center max-w-sm font-medium">
                        Complete your first technical evaluation to initialize the data engine.
                     </p>
                     <button onClick={() => navigate('/interview')} className="h-9 px-5 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        Initialize Tracking
                     </button>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.trajectory || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        fontWeight={600}
                        tickLine={false} 
                        axisLine={false}
                        dy={15}
                      />
                      <YAxis 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        fontWeight={600}
                        tickLine={false} 
                        axisLine={false}
                        dx={-10}
                      />
                      <Tooltip 
                         content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#111] px-4 py-3 rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{payload[0].payload.day}</p>
                                <p className="text-base font-black text-white">{payload[0].value} <span className="text-[10px] text-slate-500">PT</span></p>
                                <p className="text-[10px] font-medium text-slate-400 mt-1">{payload[0].payload.reason}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#818cf8" 
                        strokeWidth={3} 
                        fill="url(#velocityGradient)" 
                        animationDuration={1500}
                        activeDot={{ r: 6, fill: "#ffffff", stroke: "#818cf8", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* ACTIVITY FEED */}
            <motion.div variants={fadeUp} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center">
                      <Pulse size={16} className="text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">System Log</h3>
                  </div>
                  <button onClick={() => navigate('/analytics')} className="text-[11px] font-bold text-slate-500 hover:text-white transition-colors">
                    VIEW ALL
                  </button>
               </div>

               <div className="space-y-3">
                  <AnimatePresence>
                     {data?.recentInterviews?.slice(0, 4).map((item, i) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-colors flex items-center gap-4 group cursor-pointer"
                        >
                           <div className="w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 transition-colors bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                               <Target size={16} weight="fill" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">Simulation: {item.role}</h4>
                              <p className="text-[12px] text-slate-500 truncate mt-0.5 font-medium">Score: {item.score}%</p>
                           </div>
                           <div className="shrink-0 text-right hidden sm:block">
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                 {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                           </div>
                        </motion.div>
                     ))}
                  </AnimatePresence>
                  
                  {(!data?.recentInterviews || data.recentInterviews.length === 0) && (
                      <div className="py-8 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-4">No events logged</p>
                          <button onClick={() => navigate('/interview')} className="h-8 px-4 rounded-md bg-white/[0.05] border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 transition-colors">
                             Start Session
                          </button>
                      </div>
                  )}
               </div>
            </motion.div>
          </div>

          {/* SIDEBAR - INTELLIGENCE COMMAND */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-5">
            
            {/* AI STRATEGIC ADVISOR */}
            <motion.div variants={fadeUp} className="bg-indigo-950/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group hover:bg-indigo-950/20 transition-all">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Sparkle size={20} weight="fill" className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Advisor</h3>
                  <p className="text-[11px] font-medium text-indigo-400/70 uppercase tracking-widest mt-0.5">Automated Strategy</p>
                </div>
              </div>

              <div className="relative z-10">
                {(!data?.persistentMemory) ? (
                  <>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                      System standing by. I need behavioral data to generate an optimization path. Let's begin.
                    </p>
                    <div className="space-y-2">
                      <div className="p-3 bg-[#111] border border-white/5 rounded-xl group/btn hover:border-indigo-500/30 transition-colors cursor-pointer" onClick={() => navigate('/interview')}>
                         <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Priority 1</p>
                         <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-200">Baseline Interview</p>
                            <CaretRight size={14} className="text-slate-500 group-hover/btn:text-indigo-400 transition-colors" />
                         </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl mb-6 shadow-inner">
                      <p className="text-[13px] text-slate-300 font-medium leading-relaxed italic">
                        "{data.persistentMemory.observation}"
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                        <div 
                          onClick={() => navigate('/analytics')}
                          className="p-3 bg-[#111] border border-white/5 rounded-xl group/btn hover:border-white/20 transition-colors cursor-pointer flex items-center justify-between"
                        >
                           <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">High Priority</p>
                              <p className="text-sm font-bold text-slate-200">View Drill-down Audit</p>
                           </div>
                           <ArrowUpRight size={14} className="text-slate-600 group-hover/btn:text-white transition-colors" />
                        </div>
                        <div 
                          onClick={() => navigate('/interview')}
                          className="p-3 bg-[#111] border border-white/5 rounded-xl group/btn hover:border-white/20 transition-colors cursor-pointer flex items-center justify-between"
                        >
                           <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Suggested</p>
                              <p className="text-sm font-bold text-slate-200">Target Weakness in Simulation</p>
                           </div>
                           <ArrowUpRight size={14} className="text-slate-600 group-hover/btn:text-white transition-colors" />
                        </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* DOMAIN ANALYSIS */}
            <motion.div variants={fadeUp} className="bg-amber-950/5 border border-amber-500/20 rounded-2xl p-6 flex-1 flex flex-col hover:bg-amber-950/10 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Target size={16} className="text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Domain Matrix</h3>
              </div>

              <div className="space-y-6 flex-1">
                 {data?.skillDNA?.slice(0, 4).map((topic, i) => (
                   <div key={i} className="group">
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-[13px] font-bold text-slate-300 group-hover:text-white transition-colors">{topic.topic}</span>
                         <span className="text-xs font-black text-slate-400">{Math.round(topic.score)}<span className="text-[10px]">PT</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-black/50 border border-white/5 rounded-full overflow-hidden p-[1px]">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${topic.score}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            className={cn("h-full rounded-full", i === 0 ? "bg-amber-400" : "bg-amber-500/40")} 
                         />
                      </div>
                   </div>
                 ))}
                  {(!data?.skillDNA || data.skillDNA.length === 0) && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                       <CircleNotch size={24} className="text-slate-500 animate-spin mb-3" />
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Data</p>
                    </div>
                 )}
              </div>
            </motion.div>

          </div>

        </motion.div>
      </main>
    </div>
  );
}

const MetricCard = ({ label, value, suffix, trend, icon: Icon, color, evidence }: any) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const colorMap: Record<string, string> = {
    indigo: "border-indigo-500/20 bg-indigo-950/10 hover:bg-indigo-950/20",
    amber: "border-amber-500/20 bg-amber-950/10 hover:bg-amber-950/20",
    emerald: "border-emerald-500/20 bg-emerald-950/10 hover:bg-emerald-950/20",
    fuchsia: "border-fuchsia-500/20 bg-fuchsia-950/10 hover:bg-fuchsia-950/20",
  };
  const glowMap: Record<string, string> = {
    indigo: "bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400",
    amber: "bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400",
    emerald: "bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400",
    fuchsia: "bg-fuchsia-500/10 group-hover:bg-fuchsia-500/20 text-fuchsia-400",
  };

  const themeClass = colorMap[color] || colorMap.indigo;
  const glowClass = glowMap[color] || glowMap.indigo;

  return (
    <motion.div variants={fadeUp} className={cn("rounded-2xl p-5 relative overflow-hidden group transition-all", themeClass)}>
      <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none transition-colors", glowClass.split(' ')[0], glowClass.split(' ')[1])} />
      
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border transition-colors", glowClass.split(' ')[0], "border-white/5")}>
           <Icon size={16} className={glowClass.split(' ')[2]} />
        </div>
        <div className="px-2 py-1 rounded bg-black/30 border border-white/5 flex items-center gap-1.5">
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{trend}</span>
        </div>
      </div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-black tracking-tight text-white">{value}</h3>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{suffix}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 group-hover:text-slate-400 transition-colors">{label}</p>
        </div>
        {evidence && (
           <button 
              onMouseEnter={() => setShowEvidence(true)}
              onMouseLeave={() => setShowEvidence(false)}
              className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition-all"
           >
              <Info size={12} weight="bold" />
           </button>
        )}
      </div>

      <AnimatePresence>
         {showEvidence && evidence && (
            <motion.div 
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 5 }}
               transition={{ duration: 0.15 }}
               className="absolute inset-x-0 bottom-0 p-3 bg-black/95 backdrop-blur-xl border-t border-white/10 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
            >
               <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Database size={10} /> Data Provenance
               </p>
               <p className="text-[10px] text-slate-300 leading-relaxed font-medium">{evidence}</p>
            </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  );
};