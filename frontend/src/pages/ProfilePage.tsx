import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/shared/Navbar';
import { getEngineeringDNA } from '../services/api.service';
import { 
  Dna, Brain, Activity, Target, ShieldAlert, CheckCircle2, AlertTriangle, 
  Clock, GitBranch, TerminalSquare, Microscope, History, Trophy
} from 'lucide-react';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';
import { calculateLevelFromXP, calculateXPForLevel } from '../utils/leveling';

interface DNAData {
  user: any;
  intelligence: any;
  events: any[];
}

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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function ProfilePage() {
  const [data, setData] = useState<DNAData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEngineeringDNA()
      .then(res => {
        setData(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="text-slate-500 text-xs font-mono uppercase tracking-widest animate-pulse relative z-10 flex items-center gap-3">
          <Dna className="w-4 h-4 animate-spin" />
          Sequencing DNA...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, intelligence, events } = data;
  const telemetry = user.behavioralTelemetry;

  // GAMIFICATION LOGIC
  const totalXP = user.xp || 0;
  
  let milestones: any[] = [];
  if (events && Array.isArray(events)) {
    events.forEach(evt => {
      // Look for explicit milestones from gamification or legacy system
      if (evt.type === 'milestone' || evt.severity === 'milestone') {
          milestones.push({ ...evt, title: evt.title || 'Achievement Unlocked' });
      }
    });
  }

  const currentLevel = calculateLevelFromXP(totalXP);
  const xpForCurrentLevel = calculateXPForLevel(currentLevel);
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
  const xpIntoLevel = totalXP - xpForCurrentLevel;
  const xpRequiredForNext = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpRequiredForNext) * 100));
  
  const ranks = [
    "Initiate", "Junior Engineer", "Mid-Level Developer", "Senior Engineer", 
    "Staff Engineer", "Principal Architect", "Distinguished Fellow"
  ];
  const currentRank = ranks[Math.min(currentLevel - 1, ranks.length - 1)];

  // Pad milestones array to show empty slots
  const displayBadges = [...milestones];
  while (displayBadges.length < 4) {
      displayBadges.push(null);
  }

  return (
    <div className="min-h-screen bg-[#030303] text-slate-300 font-sans selection:bg-indigo-500/30 relative">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      <Navbar />

      <motion.main 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="pt-32 pb-24 px-6 md:px-12 max-w-5xl mx-auto space-y-12 relative z-10"
      >
        
        {/* PAGE HEADER */}
        <motion.div variants={fadeUp} className="border-b border-white/10 pb-6 mb-12">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Dna className="w-8 h-8 text-indigo-400" />
            Engineering DNA
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-2 uppercase tracking-widest">
            A continuously evolving reflection of your operational traits
          </p>
        </motion.div>

        {/* SYSTEM 0: GAMIFICATION & PROGRESSION */}
        <motion.section variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* XP & Level Panel */}
          <div className="lg:col-span-2 p-8 border border-indigo-500/20 bg-indigo-950/10 rounded-2xl relative overflow-hidden group hover:bg-indigo-950/20 transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-colors pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10">
               <div>
                  <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Target className="w-3.5 h-3.5" />
                     Career Progression
                  </div>
                  <h2 className="text-3xl font-black text-white">
                     Level {currentLevel}: <span className="text-gradient bg-gradient-to-r from-indigo-400 to-fuchsia-400">{currentRank}</span>
                  </h2>
               </div>
               <div className="text-right">
                  <div className="text-3xl font-mono font-black text-white">{totalXP} <span className="text-sm text-indigo-400">XP</span></div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Total Experience</div>
               </div>
            </div>

            <div className="relative z-10">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  <span>Current Level Progress</span>
                  <span>{Math.round(progressPercent)}% to Level {currentLevel + 1}</span>
               </div>
               <div className="h-3 w-full bg-black/50 border border-white/5 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${progressPercent}%` }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 relative"
                  >
                     <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
                  </motion.div>
               </div>
               <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-2">
                  <span>{xpForCurrentLevel} XP</span>
                  <span>{xpForNextLevel} XP</span>
               </div>
            </div>
          </div>

          {/* Trophy Room (Milestones) */}
          <div className="p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Trophy Room</h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full font-bold">
                   {milestones.length} Unlocked
                </span>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                {displayBadges.slice(0, 4).map((badge, idx) => (
                   <div 
                      key={idx} 
                      className={cn(
                         "aspect-square rounded-xl flex flex-col items-center justify-center border transition-all p-2 text-center group cursor-default",
                         badge 
                            ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                            : "bg-slate-900/50 border-white/5 opacity-40 grayscale"
                      )}
                   >
                      <div className={cn(
                         "w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-transform",
                         badge ? "bg-amber-500/20 text-amber-400 group-hover:scale-110" : "bg-white/5 text-slate-500"
                      )}>
                         <Trophy className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest line-clamp-2 w-full leading-tight text-white">
                         {badge ? badge.title : "Locked"}
                      </span>
                   </div>
                ))}
             </div>
          </div>
        </motion.section>

        {/* SYSTEM 1: ENGINEERING IDENTITY CORE */}
        <motion.section variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-white/10 bg-white/[0.02] rounded-xl hover:bg-white/[0.03] hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] transition-all">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Current Identity</div>
            <h2 className="text-2xl font-black text-white leading-tight mb-6">
              {user.careerState || 'Foundation Building'}
            </h2>
            
            <div className="space-y-4 text-sm font-mono">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-slate-400">Primary Track</span>
                <span className="text-white font-medium">{user.careerStrategies?.[user.careerStrategies.length - 1]?.targetRole || 'Software Engineer'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-slate-400">Strategic Mode</span>
                <span className="text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded">
                  {user.careerStrategies?.[user.careerStrategies.length - 1]?.mode || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-slate-400">Confidence Level</span>
                <span className={cn(
                  "font-black px-2 py-0.5 rounded",
                  telemetry?.confidence === 'LOW' ? 'text-rose-400 bg-rose-500/10' :
                  telemetry?.confidence === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10' :
                  'text-emerald-400 bg-emerald-500/10'
                )}>
                  {telemetry?.confidence || 'LOW'}
                </span>
              </div>
              <div className="flex justify-between items-start pt-2">
                <span className="text-slate-400">Evidence Strength</span>
                <div className="text-right text-xs text-slate-500">
                  Derived from:<br/>
                  <span className="text-white">{intelligence?.readiness?.evidenceCount?.codingSessions || 0} coding sessions</span><br/>
                  <span className="text-white">{intelligence?.readiness?.evidenceCount?.mockInterviews || 0} interviews</span>
                </div>
              </div>
            </div>
          </div>

          {/* SYSTEM 7: THE ENGINEERING MIRROR */}
          <div className="p-6 border border-white/10 bg-indigo-950/10 rounded-xl flex flex-col hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] transition-all">
            <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Brain className="w-3.5 h-3.5" />
              AI Reflection Mirror
            </div>
            <div className="flex-1 text-sm text-slate-300 leading-relaxed font-serif italic border-l-2 border-indigo-500/30 pl-4 py-2">
              "{user.aiReflection || 'System is gathering initial execution telemetry to form a reliable baseline of your behavioral traits.'}"
            </div>
            <div className="mt-4 text-[9px] text-slate-500 uppercase tracking-widest font-mono text-right">
              Generated from behavioral observation
            </div>
          </div>
        </motion.section>

        {/* SYSTEM 3: OBSERVED STRENGTH MAP */}
        <motion.section variants={fadeUp}>
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-400" />
              Observed Strength Map
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                 <div className="bg-white/5 px-4 py-2 border-b border-white/10 text-xs font-bold text-white uppercase tracking-widest flex items-center justify-between">
                   <span>Confirmed Strengths</span>
                   <span className="text-[9px] text-slate-500 font-mono">Score &gt; 60</span>
                 </div>
                 <div className="divide-y divide-white/5 bg-white/[0.01]">
                    {intelligence?.topicScores && Object.entries(intelligence.topicScores)
                      .filter(([_, data]: any) => data.score > 60)
                      .slice(0, 3)
                      .map(([topic, data]: any) => (
                        <div key={topic} className="p-4">
                           <div className="flex items-center justify-between mb-2">
                              <div>
                                 <div className="text-sm font-bold text-white">{topic}</div>
                                 <div className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">Evidence: {data.attempts} sessions</div>
                              </div>
                              <div className="text-right">
                                 <div className="text-lg font-mono text-emerald-400">{Math.round(data.score)}</div>
                              </div>
                           </div>
                           <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(100, data.score)}%` }}
                               transition={{ duration: 1, delay: 0.5 }}
                               className="h-full bg-emerald-500 rounded-full"
                             />
                           </div>
                        </div>
                    ))}
                    {(!intelligence?.topicScores || Object.values(intelligence.topicScores).filter((d: any) => d.score > 60).length === 0) && (
                      <div className="p-4 text-xs text-slate-500 font-mono">No confirmed strengths observed yet.</div>
                    )}
                 </div>
              </div>

              {/* Weaknesses */}
              <div className="border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                 <div className="bg-white/5 px-4 py-2 border-b border-white/10 text-xs font-bold text-white uppercase tracking-widest flex items-center justify-between">
                   <span>Observed Frictions</span>
                   <span className="text-[9px] text-slate-500 font-mono">Score &le; 60</span>
                 </div>
                 <div className="divide-y divide-white/5 bg-white/[0.01]">
                    {intelligence?.topicScores && Object.entries(intelligence.topicScores)
                      .filter(([_, data]: any) => data.score <= 60 && data.attempts > 0)
                      .slice(0, 3)
                      .map(([topic, data]: any) => (
                        <div key={topic} className="p-4">
                           <div className="flex items-center justify-between mb-2">
                              <div>
                                 <div className="text-sm font-bold text-white">{topic}</div>
                                 <div className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">Evidence: {data.attempts} sessions</div>
                              </div>
                              <div className="text-right">
                                 <div className="text-lg font-mono text-amber-400">{Math.round(data.score)}</div>
                              </div>
                           </div>
                           <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(100, data.score)}%` }}
                               transition={{ duration: 1, delay: 0.5 }}
                               className="h-full bg-amber-500 rounded-full"
                             />
                           </div>
                        </div>
                    ))}
                    {(!intelligence?.topicScores || Object.values(intelligence.topicScores).filter((d: any) => d.score <= 60 && d.attempts > 0).length === 0) && (
                      <div className="p-4 text-xs text-slate-500 font-mono">No observed frictions yet.</div>
                    )}
                 </div>
              </div>
           </div>
        </motion.section>

        {/* SYSTEM 4: EXECUTION BEHAVIOR PANEL */}
        <motion.section variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                Execution Telemetry
             </h3>
             <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-2 py-1 rounded">
               Confidence: {telemetry?.confidence || 'LOW'}
             </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'Hint Dependency', value: telemetry?.hintDependency || 'Medium' },
               { label: 'Recovery Ability', value: telemetry?.recoveryAbility || 'Medium' },
               { label: 'Persistence', value: telemetry?.persistence || 'Medium' },
               { label: 'Interview Stability', value: telemetry?.interviewStability || 'Medium' },
             ].map((item, i) => (
               <div key={i} className="p-4 border border-white/5 bg-white/[0.01] rounded-xl hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-default">
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">{item.label}</div>
                  <div className={cn(
                    "text-lg font-mono font-bold",
                    item.value === 'Low' ? (item.label === 'Hint Dependency' ? 'text-emerald-400' : 'text-rose-400') :
                    item.value === 'High' ? (item.label === 'Hint Dependency' ? 'text-rose-400' : 'text-emerald-400') :
                    'text-amber-400'
                  )}>
                    {item.value}
                  </div>
               </div>
             ))}
             <div className="col-span-2 md:col-span-4 p-4 border border-white/5 bg-white/[0.01] rounded-xl hover:bg-white/[0.03] transition-all">
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Primary Panic Signal</div>
                <div className="text-sm text-slate-300 font-mono border-l-2 border-rose-500/50 pl-3">
                  {telemetry?.panicSignals || 'Execution speed drops sharply under timers'}
                </div>
             </div>
          </div>
        </motion.section>

        {/* SYSTEM 5: STRATEGIC ADAPTATION CENTER */}
        <motion.section variants={fadeUp}>
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-slate-400" />
              Strategic Memory
           </h3>
           <div className="space-y-3">
             {user.careerStrategies?.slice().reverse().map((strat: any, i: number) => (
               <div key={i} className="p-4 border border-white/10 bg-white/[0.02] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{strat.mode}</span>
                      {strat.state === 'active' && (
                        <span className="text-[8px] uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Active</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Target: {strat.targetCompany} • {strat.targetRole}
                    </div>
                  </div>
                  <div className="md:text-right border-t border-white/10 md:border-t-0 pt-3 md:pt-0">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Reason for Switch</div>
                    <div className="text-xs text-slate-300 max-w-xs">{strat.whyStrategyChanged || 'Initial Calibration'}</div>
                  </div>
               </div>
             ))}
             {(!user.careerStrategies || user.careerStrategies.length === 0) && (
               <div className="text-xs text-slate-500 font-mono p-4 border border-white/5 rounded-xl">No strategy history available.</div>
             )}
           </div>
        </motion.section>

        {/* SYSTEM 2 & 6: EVOLUTION TIMELINE & EVIDENCE VAULT */}
        <motion.section variants={fadeUp}>
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Evolution Timeline & Evidence Vault
           </h3>
           <div className="border-l border-white/10 ml-2 pl-6 space-y-8 py-4 relative">
             {events.slice(0, 10).map((event: any, i: number) => (
               <div key={i} className="relative group">
                 <div className="absolute -left-[31px] top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-[#030303] group-hover:scale-150 group-hover:bg-indigo-400 transition-all"></div>
                 <div className="text-[10px] text-slate-500 font-mono mb-1">
                   {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })}
                 </div>
                 <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                   {event.eventType === 'SYSTEM' && <Microscope className="w-3 h-3 text-indigo-400" />}
                   {event.eventType === 'USER' && <TerminalSquare className="w-3 h-3 text-emerald-400" />}
                   {event.title}
                 </div>
                 <div className="text-xs text-slate-400 leading-relaxed max-w-2xl bg-white/[0.02] p-3 rounded-lg border border-white/5 mt-2 group-hover:bg-white/[0.04] transition-colors">
                   {event.description}
                 </div>
               </div>
             ))}
             {events.length === 0 && (
               <div className="text-xs text-slate-500 font-mono">Timeline is currently empty.</div>
             )}
           </div>
        </motion.section>

      </motion.main>
    </div>
  );
}
