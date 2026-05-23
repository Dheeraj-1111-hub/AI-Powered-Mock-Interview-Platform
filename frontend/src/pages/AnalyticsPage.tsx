import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchDashboard, 
  getInterviewHistory, 
  getCodeSubmissions 
} from '../services/api.service';
import { 
  Area, AreaChart, Bar, BarChart, CartesianGrid, 
  ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
  PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  BarChart3, TrendingUp, Target, Brain, ArrowLeft, 
  Sparkles, Zap, Flame, Clock, Calendar, ChevronRight,
  Layout, ShieldCheck, Microscope, Award, Loader2
} from 'lucide-react';
import { Navbar } from '../components/shared/Navbar';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { cn } from '../utils/cn';
import { AuthContext } from '../services/auth.service';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchDashboard();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const radarData = data?.radarData || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
         <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden font-sans pb-24">
      <Navbar />
      
      {/* Cinematic Background */}
      <div className="fixed inset-0 bg-grid-white opacity-20 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 pt-32 px-6 max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
                 <Microscope className="w-3 h-3" />
                 Performance Intelligence
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Intelligence <span className="text-indigo-400">Hub</span></h1>
              <p className="text-slate-500 font-medium text-lg max-w-xl">
                 Deep-dive into your growth trajectory. Aggregated data from AI simulations and coding labs.
              </p>
           </div>
           
           <div className="flex gap-4">
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 px-6 h-14 rounded-2xl bg-white/5 text-slate-400 text-xs font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all">
                 <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={() => setIsAuditModalOpen(true)}
                className="flex items-center gap-3 px-8 h-14 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
              >
                 <Sparkles className="w-4 h-4" /> Generate Audit
              </button>
           </div>
        </header>

        {/* Global Performance Matrix */}
        <div className="grid md:grid-cols-4 gap-6">
           {[
              { label: 'Intelligence Index', value: data?.stats?.averageScore || 0, icon: Brain, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
              { label: 'Consistency Streak', value: data?.stats?.streak || 0, suffix: 'Days', icon: Flame, color: 'text-rose-400', bg: 'bg-rose-400/10' },
              { label: 'Simulation Count', value: data?.stats?.totalInterviews || 0, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { label: 'Mastery Level', value: (data?.stats?.averageScore || 0) >= 90 ? 'Elite' : (data?.stats?.averageScore || 0) >= 70 ? 'Advanced' : (data?.stats?.averageScore || 0) >= 40 ? 'Intermediate' : 'Beginner', isText: true, icon: Award, color: 'text-amber-400', bg: 'bg-amber-400/10' },
           ].map((stat, i) => (
              <SpotlightCard key={i} className="p-8">
                 <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-white/5", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                 </div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                 <h3 className={cn("font-black text-white", stat.isText ? "text-xl mt-1" : "text-3xl")}>
                    {stat.value} {stat.suffix && <span className="text-lg font-medium text-slate-500 ml-1">{stat.suffix}</span>}
                 </h3>
              </SpotlightCard>
           ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
           
           {/* Growth Trend Area Chart */}
           <SpotlightCard className="lg:col-span-8 p-10">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Growth Trajectory</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score Trends over time</p>
                 </div>
                 <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    <TrendingUp className="w-3 h-3" /> {data?.insights?.memory?.growthRate || '0%'} Growth
                 </div>
              </div>
              <div className="h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.trends}>
                       <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                       <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                       <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }} />
                       <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </SpotlightCard>

           {/* AI Mindmap / Radar Chart */}
           <SpotlightCard className="lg:col-span-4 p-10 flex flex-col items-center">
              <div className="w-full mb-10">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Skill DNA</h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Technological Footprint</p>
              </div>
              <div className="flex-1 w-full flex items-center justify-center">
                 <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                       <PolarGrid stroke="#ffffff10" />
                       <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9 }} />
                       <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                       <Radar name="Candidate" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>
           </SpotlightCard>

        </div>

        <div className="grid lg:grid-cols-12 gap-8">
           
           {/* Topic Heatmap */}
           <SpotlightCard className="lg:col-span-5 p-10">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Performance Heatmap</h3>
              <div className="space-y-6">
                 {data?.topicAverages && data.topicAverages.length > 0 ? (
                   data.topicAverages.map((topic: any, i: number) => (
                      <div key={i} className="space-y-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{topic.topic}</span>
                            <span className="text-[10px] font-black text-indigo-400 uppercase">{topic.average.toFixed(0)}%</span>
                         </div>
                         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${topic.average}%` }}
                              transition={{ duration: 1, ease: "circOut" }}
                              className={cn(
                                 "h-full",
                                 topic.average > 80 ? "bg-emerald-500" : topic.average > 60 ? "bg-indigo-500" : "bg-rose-500"
                              )}
                            />
                         </div>
                      </div>
                   ))
                 ) : (
                   <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                      <Target className="w-8 h-8 text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-white mb-1">Insufficient Data</p>
                      <p className="text-xs text-slate-400 max-w-[200px]">Complete at least one mock interview to generate your topic performance heatmap.</p>
                   </div>
                 )}
              </div>
           </SpotlightCard>

           {/* AI Memory / Long-term Memory Section */}
           <SpotlightCard className="lg:col-span-7 p-10 border-indigo-500/20 bg-indigo-500/[0.02]">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                       <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Persistent Memory</h3>
                       <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Neural Link</p>
                    </div>
                 </div>
                 <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              
              <div className="space-y-6">
                 <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Long-term Context Findings</h4>
                    <p className="text-sm text-slate-200 font-medium leading-relaxed italic">
                       "{data?.insights?.memory?.pattern || 'Analyzing your behavioral patterns across simulations...'}"
                    </p>
                 </div>
                 
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-[32px] bg-black/40 border border-white/5">
                       <div className="flex items-center gap-3 mb-4">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] font-black text-white uppercase">Primary Growth</span>
                       </div>
                       <p className="text-xs text-slate-400 font-medium">Your mastery in {user?.skills?.[0] || 'core skills'} has grown by {data?.insights?.memory?.growthRate || '0%'}.</p>
                    </div>
                    <div className="p-6 rounded-[32px] bg-black/40 border border-white/5">
                       <div className="flex items-center gap-3 mb-4">
                          <AlertTriangleIcon className="w-4 h-4 text-rose-400" />
                          <span className="text-[10px] font-black text-white uppercase">Critical Weakness</span>
                       </div>
                       <p className="text-xs text-slate-400 font-medium">Topic "{data?.insights?.memory?.criticalWeakness || 'General Concepts'}" requires immediate attention.</p>
                    </div>
                 </div>
              </div>
           </SpotlightCard>

        </div>

        {/* Recent Telemetry Feed */}
        <SpotlightCard className="p-10 border-white/5 bg-slate-950/50">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Recent Telemetry</h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Engineering DNA Log</p>
              </div>
           </div>
           
           <div className="space-y-4">
              {data?.activityTimeline?.length > 0 ? data.activityTimeline.map((item: any, i: number) => (
                 <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                       {item.type === 'milestone' ? <Award className="w-4 h-4 text-amber-400" /> :
                        item.type === 'interview' ? <Target className="w-4 h-4 text-indigo-400" /> :
                        item.type === 'coding' ? <Layout className="w-4 h-4 text-emerald-400" /> :
                        <Brain className="w-4 h-4 text-fuchsia-400" />}
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-white tracking-tight">{item.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                             {new Date(item.date).toLocaleDateString()}
                          </span>
                       </div>
                       <p className="text-xs text-slate-400 mb-2">{item.description}</p>
                       {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-2">
                             {item.tags.map((tag: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-white/10 text-slate-300">
                                   {tag}
                                </span>
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              )) : (
                 <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-slate-500 font-mono text-xs">No telemetry data recorded yet.</p>
                 </div>
              )}
           </div>
        </SpotlightCard>

      </main>

      {/* Audit Modal Overlay */}
      <AnimatePresence>
         {isAuditModalOpen && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            >
               <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsAuditModalOpen(false)} />
               
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-[0_0_80px_rgba(99,102,241,0.2)] p-8 sm:p-12"
               >
                  <button onClick={() => setIsAuditModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>

                  <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
                     <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Sparkles className="w-8 h-8 text-indigo-400" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black tracking-tight text-white">Engineering DNA Audit</h2>
                        <p className="text-slate-400 font-mono text-xs mt-1">GENERATED: {new Date().toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                     <div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Executive Summary</h3>
                        <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/5">
                           {data?.insights?.improvementPlan || "Loading AI synthesis..."}
                        </p>
                     </div>
                     <div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Behavioral Telemetry</h3>
                        <div className="space-y-3">
                           {radarData.map((stat: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                 <span className="text-xs font-bold text-slate-300">{stat.subject}</span>
                                 <div className="flex items-center gap-3">
                                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                       <div className="h-full bg-indigo-500" style={{ width: `${stat.A}%` }} />
                                    </div>
                                    <span className="text-[10px] font-mono text-indigo-400 w-8 text-right">{stat.A}%</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Recommended Actions</h3>
                     {data?.insights?.quickActions?.map((action: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/[0.02] border border-indigo-500/10">
                           <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                           <p className="text-sm text-slate-300">{action}</p>
                        </div>
                     )) || (
                        <p className="text-xs text-slate-500 font-mono">Insufficient data to generate specific actions.</p>
                     )}
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
                     <button className="px-6 py-3 rounded-full bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                        Export as PDF (Coming Soon)
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex flex-col items-center gap-6">
       <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-pulse">
          <BarChart3 className="w-8 h-8 text-indigo-400" />
       </div>
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Aggregating Intelligence Matrix</p>
    </div>
  );
}

function AlertTriangleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
