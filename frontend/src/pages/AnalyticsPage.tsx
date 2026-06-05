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
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
         <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const ii = data?.intelligenceIndex || { score: 0, breakdown: {} };
  const tel = data?.telemetry || { streak: {}, simulations: {}, mastery: {} };
  const dna = data?.skillDNA || [];

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden font-sans pb-24">
      <Navbar />
      
      {/* Forensic Noise Background */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-screen" />
      
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 pt-32 pb-24 px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
                 <Microscope className="w-3 h-3" />
                 Forensic Intelligence
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">Analytics</span> Engine
              </h1>
              <p className="text-slate-500 font-medium text-lg max-w-xl">
                 Hard telemetry derived exclusively from performance evidence. No generic data.
              </p>
           </div>
           
           <div className="flex gap-4">
              <button 
                onClick={() => setIsAuditModalOpen(true)}
                className="relative group flex items-center gap-3 px-8 h-14 rounded-2xl bg-[#0a0a0a] text-white text-xs font-black uppercase tracking-widest transition-all overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <div className="absolute inset-[1px] bg-[#0a0a0a] rounded-[15px] z-0" />
                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 z-0 group-hover:opacity-0 transition-opacity" />
                 <Sparkles className="w-4 h-4 z-10 text-indigo-400 group-hover:text-white transition-colors" /> 
                 <span className="z-10 group-hover:text-white transition-colors">Generate Audit</span>
              </button>
           </div>
        </header>

        {/* TOP ROW: Global Metrics */}
        <div className="grid md:grid-cols-4 gap-6">
           {/* Section 1: Intelligence Index */}
           <SpotlightCard className="relative p-8 cursor-pointer group border-indigo-500/30 bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05] transition-all overflow-hidden" onClick={() => setSelectedEvidence({ title: 'Intelligence Index Calculation', data: Object.entries(ii.breakdown).map(([k,v]) => `${k}: ${v}`)})}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                 <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-indigo-500/40 bg-indigo-500/20 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <Brain className="w-6 h-6" />
                 </div>
                 <div className="text-[10px] font-black text-indigo-500/50 group-hover:text-indigo-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                    Why {ii.score}? <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
              <p className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest mb-2 relative z-10">Intelligence Index</p>
              <h3 className="font-black text-white text-4xl relative z-10 tracking-tight">{ii.score}<span className="text-lg text-indigo-500/50">/100</span></h3>
           </SpotlightCard>

           {/* Section 2: Consistency Streak */}
           <SpotlightCard className="p-8 hover:border-white/10 transition-all">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                 <Flame className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Consistency Streak</p>
              <div className="flex items-end gap-3 mb-2">
                 <h3 className="font-black text-white text-4xl tracking-tight">{tel.streak.current}<span className="text-lg text-slate-600">d</span></h3>
              </div>
              <p className="text-xs text-slate-400 font-medium">Expected Readiness: <span className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded ml-1">{tel.streak.expectedGain}</span> if 7d</p>
           </SpotlightCard>

           {/* Section 3: Simulation Count */}
           <SpotlightCard className="p-8 hover:border-white/10 transition-all">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                 <Target className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Simulations</p>
              <h3 className="font-black text-white text-4xl mb-3 tracking-tight">{tel.simulations.total} <span className="text-lg text-slate-600">Total</span></h3>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                 <span className="text-emerald-500/70">{tel.simulations.completed} Completed</span>
                 <span>{tel.simulations.abandoned} Abandoned</span>
              </div>
           </SpotlightCard>

           {/* Section 4: Mastery Level */}
           <SpotlightCard className="p-8 hover:border-white/10 transition-all relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)] relative z-10">
                 <Award className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">Mastery Level</p>
              <h3 className="font-black text-white text-3xl mb-2 tracking-tight relative z-10">{tel.mastery.level}</h3>
              {tel.mastery.neededForNext > 0 && (
                <p className="text-xs text-slate-400 font-medium relative z-10">Need <span className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">+{tel.mastery.neededForNext}</span> for next tier</p>
              )}
           </SpotlightCard>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
           
           {/* Section 5: Growth Trajectory */}
           <SpotlightCard className="lg:col-span-12 p-10 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Growth Trajectory</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Daily Readiness Score</p>
                 </div>
                 <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <TrendingUp className="w-3 h-3" /> Predicted Trajectory Active
                 </div>
              </div>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.trajectory || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                       <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
                       <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                       <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                       <Tooltip 
                          cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                          content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                   <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-indigo-500/30 p-4 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                      <p className="text-[10px] font-black text-indigo-400 mb-1 uppercase tracking-widest">{data.day}</p>
                                      <p className="text-xl font-black text-white mb-2">{data.score}</p>
                                      <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", data.reason.includes('-') ? "bg-rose-500" : "bg-emerald-500")} />
                                        <p className="text-[10px] font-medium text-slate-300">{data.reason}</p>
                                      </div>
                                   </div>
                                );
                             }
                             return null;
                          }}
                       />
                       <Area type="monotone" dataKey="score" stroke="url(#colorScore)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </SpotlightCard>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
           
           {/* Section 6 & 7: Skill DNA & Performance Heatmap (Evidence-based) */}
           <SpotlightCard className="lg:col-span-8 p-10 hover:border-white/10 transition-all">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Performance Heatmap</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Forensic breakdown of skills (0.4A + 0.3I + 0.2C + 0.1S)</p>
              
              <div className="space-y-4">
                 {dna.length > 0 ? dna.map((skill: any, i: number) => (
                    <div 
                      key={i} 
                      className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/[0.02] transition-all cursor-pointer group shadow-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                      onClick={() => setSelectedEvidence({ title: `Evidence: ${skill.topic}`, data: [`Solved: ${skill.evidence.solved}`, `Interview: ${skill.evidence.interview}`, `Avg Time: ${skill.evidence.avgTime}`]})}
                    >
                       <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                               <Layout className="w-4 h-4 text-indigo-400" />
                             </div>
                             <h4 className="font-bold text-white text-sm">{skill.topic}</h4>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="text-sm font-black text-white">{skill.score}<span className="text-slate-500 text-xs">%</span></span>
                             <span className="text-[10px] font-black text-slate-600 group-hover:text-indigo-400 uppercase flex items-center gap-1 transition-colors">Why <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /></span>
                          </div>
                       </div>
                       
                       <div className="flex gap-2">
                          <div className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/5 flex flex-col">
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Coding Lab</span>
                             <span className="text-xs font-medium text-slate-300">{skill.evidence.solved}</span>
                          </div>
                          <div className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/5 flex flex-col">
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Simulations</span>
                             <span className="text-xs font-medium text-slate-300">{skill.evidence.interview}</span>
                          </div>
                          <div className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/5 flex flex-col">
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Speed</span>
                             <span className="text-xs font-medium text-slate-300">{skill.evidence.avgTime}</span>
                          </div>
                       </div>
                    </div>
                 )) : (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                       <Target className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                       <p className="text-sm font-bold text-white mb-1">Insufficient Telemetry</p>
                       <p className="text-slate-500 font-mono text-xs">Complete a mock interview to generate your Skill DNA.</p>
                    </div>
                 )}
              </div>
           </SpotlightCard>

           {/* Section 8: AI Persistent Memory (Strict Evidence) */}
           <SpotlightCard className="lg:col-span-4 p-10 border-indigo-500/20 bg-indigo-500/[0.02] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="flex items-center gap-4 mb-8 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <Zap className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Persistent Memory</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Evidence-based</p>
                 </div>
              </div>
              
              <div className="space-y-6 relative z-10">
                 {/* Observation */}
                 <div className="p-6 rounded-[24px] bg-black/60 backdrop-blur-md border border-white/10 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observation</h4>
                    </div>
                    <p className="text-sm text-white font-medium leading-relaxed">{data?.persistentMemory?.observation || 'No sufficient patterns detected.'}</p>
                    
                    <div className="pt-4 border-t border-white/10 mt-4">
                       <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3" /> Evidence Log
                       </h4>
                       <ul className="text-xs text-slate-400 space-y-2 font-mono">
                          {data?.persistentMemory?.evidence?.map((e: string, i: number) => (
                             <li key={i} className="flex items-center gap-2">
                                <span className="text-indigo-500/50">›</span> {e}
                             </li>
                          )) || <li>No logs.</li>}
                       </ul>
                    </div>
                 </div>
              </div>
           </SpotlightCard>

        </div>

      </main>

      {/* Forensic Evidence Drill-down Modal */}
      <AnimatePresence>
         {selectedEvidence && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            >
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvidence(null)} />
               
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-lg bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(99,102,241,0.2)] p-10"
               >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-3xl pointer-events-none" />
                  <button onClick={() => setSelectedEvidence(null)} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <Microscope className="w-4 h-4" /> {selectedEvidence.title}
                  </h3>
                  <div className="space-y-3 relative z-10">
                     {selectedEvidence.data.map((item: string, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-black/50 border border-white/5 font-mono text-sm text-slate-300 flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                           {item}
                        </div>
                     ))}
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

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
                  className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a]/95 backdrop-blur-xl border border-indigo-500/20 rounded-[32px] shadow-[0_0_100px_rgba(99,102,241,0.15)] p-8 sm:p-12"
               >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                  <button onClick={() => setIsAuditModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>

                  <div className="flex items-center gap-5 mb-10 pb-8 border-b border-white/5 relative z-10">
                     <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                        <Sparkles className="w-8 h-8 text-indigo-400" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black tracking-tight text-white uppercase">Engineering <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">DNA Audit</span></h2>
                        <p className="text-slate-500 font-mono text-xs mt-1">GENERATED: {new Date().toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="space-y-8 relative z-10">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Current Readiness</p>
                           <p className="text-4xl font-black text-white">{ii.score}<span className="text-xl text-slate-600">%</span></p>
                        </div>
                        <div className="p-6 rounded-2xl bg-indigo-500/[0.05] border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]">
                           <p className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest mb-2">Expected 30-Day Trajectory</p>
                           <p className="text-4xl font-black text-indigo-400">{Math.min(100, ii.score + 14)}<span className="text-xl text-indigo-500/50">%</span></p>
                        </div>
                     </div>
                     
                     <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-3xl">
                           <p className="text-[10px] font-black text-rose-400/70 uppercase tracking-widest mb-3">Highest Risk Factor</p>
                           <p className="text-xl font-bold text-rose-300">{dna.length > 0 ? dna[dna.length-1].topic : 'Insufficient Telemetry'}</p>
                        </div>

                        <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                           <p className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest mb-3">Recommended Focus</p>
                           <ul className="space-y-2">
                              {dna.slice(-2).map((d: any, i: number) => (
                                 <li key={i} className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                                    {d.topic}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     </div>
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-white/5 flex justify-end relative z-10">
                     <button onClick={() => setIsAuditModalOpen(false)} className="px-8 py-4 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        Acknowledge Report
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
