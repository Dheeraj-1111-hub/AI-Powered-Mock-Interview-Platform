import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/shared/Navbar';
import { PageLoader } from '../components/shared/PageLoader';
import { getEngineeringDNA } from '../services/api.service';
import { 
  Dna, Brain, Activity, Target, ShieldAlert, CheckCircle2, AlertTriangle, 
  Clock, GitBranch, TerminalSquare, Microscope, History, Trophy, Info,
  TrendingUp, Zap, ChevronRight, X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
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
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function ProfilePage() {
  const [data, setData] = useState<DNAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [evidenceModal, setEvidenceModal] = useState<{title: string, data: React.ReactNode} | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'history'>('overview');

  useEffect(() => {
    getEngineeringDNA()
      .then(res => {
        setData(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageLoader message="Synchronizing Engineering DNA" />;
  }

  if (!data) return null;

  const { user, intelligence, events } = data;
  const telemetry = user.behavioralTelemetry || {};
  const trophies = user.trophies || [];

  const totalXP = user.xp || 0;
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

  // Interactive Evidence Explainer
  const openEvidence = (title: string, evidenceData: React.ReactNode) => {
     setEvidenceModal({ title, data: evidenceData });
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-300 font-sans selection:bg-indigo-500/30 relative">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      <Navbar />

      <motion.main 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="pt-32 pb-24 px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12 relative z-10"
      >
        
        {/* PAGE HEADER */}
        <motion.div variants={fadeUp} className="border-b border-white/10 pb-6 mb-12 flex justify-between items-end">
          <div>
             <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
               <Brain className="w-8 h-8 text-indigo-400" />
               Behavioral Memory Layer
             </h1>
             <p className="text-xs text-slate-500 font-mono mt-2 uppercase tracking-widest">
               A completely deterministic, evidence-driven model of your engineering identity.
             </p>
          </div>
          <div className="text-right">
             <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Evidence Depth</div>
             <div className="text-xl font-mono text-emerald-400">
               {telemetry.evidenceCount || 0} Data Points
             </div>
          </div>
        </motion.div>

        {/* TAB NAVIGATION */}
        <div className="flex space-x-1 border-b border-white/10 pb-px mb-8">
           {[
             { id: 'overview', label: 'Overview', icon: Target },
             { id: 'telemetry', label: 'Telemetry', icon: Activity },
             { id: 'history', label: 'Git History', icon: History }
           ].map(tab => (
              <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={cn(
                    "px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all",
                    activeTab === tab.id 
                       ? "border-indigo-500 text-white bg-indigo-500/5" 
                       : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
                 )}
              >
                 <tab.icon className="w-4 h-4" />
                 {tab.label}
              </button>
           ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* SYSTEM 0: GAMIFICATION & PROGRESSION */}
            <motion.section variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* XP & Level Panel */}
          <div 
             onClick={() => openEvidence("XP & Leveling System", (
                <div className="space-y-4">
                   <p className="text-sm text-slate-400">Every action generates XP mathematically. There are no arbitrary values.</p>
                   <ul className="text-xs font-mono space-y-2 text-slate-300 bg-white/5 p-4 rounded-xl border border-white/10">
                      <li className="flex justify-between"><span>Easy Problem Solved</span><span className="text-emerald-400">+5 XP</span></li>
                      <li className="flex justify-between"><span>Medium Problem Solved</span><span className="text-amber-400">+15 XP</span></li>
                      <li className="flex justify-between"><span>Hard Problem Solved</span><span className="text-rose-400">+30 XP</span></li>
                      <li className="flex justify-between"><span>Interview Completed</span><span className="text-indigo-400">+50 XP</span></li>
                      <li className="flex justify-between"><span>7-Day Streak Maintained</span><span className="text-fuchsia-400">+500 XP</span></li>
                   </ul>
                   <div className="text-[10px] text-slate-500 uppercase tracking-widest">Growth Velocity</div>
                   <div className="text-lg font-mono text-white">+{user.growthVelocity || 0}% vs last 30 days</div>
                </div>
             ))}
             className="cursor-pointer lg:col-span-2 p-8 border border-indigo-500/20 bg-indigo-950/10 rounded-2xl relative overflow-hidden group hover:bg-indigo-950/20 hover:border-indigo-500/50 transition-all"
          >
            <div className="absolute top-4 right-4 bg-white/5 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
               <Info className="w-4 h-4 text-indigo-400" />
            </div>
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
          <div className="p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl relative group">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Trophy Room</h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full font-bold">
                   {trophies.length} Unlocked
                </span>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                {[...trophies, null, null, null, null].slice(0, 4).map((badge, idx) => (
                   <div 
                      key={idx} 
                      onClick={() => badge && openEvidence(`Trophy: ${badge.title}`, (
                         <div className="space-y-4">
                            <p className="text-sm text-slate-300">{badge.description}</p>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                               <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Unlock Evidence</div>
                               <div className="text-sm font-mono text-emerald-400">{badge.evidence}</div>
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                               Unlocked on {new Date(badge.unlockedAt).toLocaleDateString()}
                            </div>
                         </div>
                      ))}
                      className={cn(
                         "aspect-square rounded-xl flex flex-col items-center justify-center border transition-all p-2 text-center group",
                         badge 
                            ? "cursor-pointer bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                            : "cursor-default bg-slate-900/50 border-white/5 opacity-40 grayscale"
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
        <motion.section variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
             onClick={() => openEvidence("Engineering Identity", (
                <div className="space-y-4 text-sm text-slate-300">
                   <p>Identity is derived strictly from performance thresholds, not manual selection.</p>
                   <ul className="list-disc pl-4 space-y-2">
                      <li><span className="text-emerald-400">Readiness Score:</span> {intelligence.readiness?.overall || user.interviewReadinessScore || 0}/100</li>
                      <li><span className="text-emerald-400">Total Solves:</span> {intelligence.evidenceCount?.codingSessions || 0}</li>
                      <li><span className="text-emerald-400">Mock Interviews:</span> {intelligence.evidenceCount?.mockInterviews || 0}</li>
                   </ul>
                   <div className="p-3 bg-white/5 border border-white/10 rounded-lg mt-4 font-mono text-xs">
                      If readiness &gt; 75 and solves &gt; 100 → Interview Ready<br/>
                      If readiness &lt; 30 → Foundation Building
                   </div>
                </div>
             ))}
             className="cursor-pointer p-6 border border-white/10 bg-white/[0.02] rounded-xl hover:bg-white/[0.03] hover:border-indigo-500/30 transition-all group relative"
          >
            <div className="absolute top-4 right-4 bg-white/5 p-1 rounded opacity-0 group-hover:opacity-100"><Info className="w-3 h-3 text-slate-400" /></div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Current Identity</div>
            <h2 className="text-xl font-black text-white leading-tight">
              {user.careerState || 'Foundation Building'}
            </h2>
          </div>

          <div 
             onClick={() => openEvidence("Archetype Designation", (
                <div className="space-y-4 text-sm text-slate-300">
                   <p>Your archetype is dynamically assigned based on observed algorithmic and behavioral execution.</p>
                   <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-3 border border-white/10 rounded bg-white/5">
                         <div className="text-xs text-slate-500 mb-1 font-mono uppercase">Hint Reliance</div>
                         <div className="text-lg text-white font-mono">{telemetry.hintRate}%</div>
                      </div>
                      <div className="p-3 border border-white/10 rounded bg-white/5">
                         <div className="text-xs text-slate-500 mb-1 font-mono uppercase">Timed Accuracy</div>
                         <div className="text-lg text-white font-mono">{telemetry.timedAccuracy}%</div>
                      </div>
                   </div>
                   <div className="p-3 bg-white/5 border border-white/10 rounded-lg mt-4 font-mono text-xs">
                      High Accuracy + Low Hints → Optimizer<br/>
                      Fast Timed Accuracy → Executor<br/>
                      High Hint Reliance → Researcher
                   </div>
                </div>
             ))}
             className="cursor-pointer p-6 border border-white/10 bg-white/[0.02] rounded-xl hover:bg-white/[0.03] hover:border-emerald-500/30 transition-all group relative"
          >
            <div className="absolute top-4 right-4 bg-white/5 p-1 rounded opacity-0 group-hover:opacity-100"><Info className="w-3 h-3 text-slate-400" /></div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Engineering Archetype</div>
            <h2 className="text-xl font-black text-emerald-400 leading-tight">
              {user.archetype || 'Uncalibrated'}
            </h2>
          </div>

          <div 
             onClick={() => openEvidence("Readiness Score", (
                <div className="space-y-4 text-sm text-slate-300">
                   <p>A deterministic combination of 5 operational pillars.</p>
                   <ul className="space-y-2 font-mono text-xs">
                      <li className="flex justify-between border-b border-white/10 pb-1"><span>DSA Accuracy (40%)</span> <span>{intelligence.readiness?.dsa || 0}/100</span></li>
                      <li className="flex justify-between border-b border-white/10 pb-1"><span>Interview Perf (30%)</span> <span>{intelligence.readiness?.behavioral || 0}/100</span></li>
                      <li className="flex justify-between border-b border-white/10 pb-1"><span>Consistency (15%)</span> <span>{intelligence.readiness?.consistency || 0}/100</span></li>
                      <li className="flex justify-between border-b border-white/10 pb-1"><span>Optimization (15%)</span> <span>{intelligence.readiness?.optimization || 0}/100</span></li>
                      <li className="flex justify-between pt-1 font-bold text-white"><span>Raw Target</span> <span>{intelligence.readiness?.rawScore || 0}/100</span></li>
                   </ul>
                   <div className="p-3 bg-white/5 border border-white/10 rounded-lg mt-4 font-mono text-[10px] text-slate-400">
                      Multiplier: {intelligence.readiness?.multiplier}x based on {telemetry.evidenceCount} data points.
                   </div>
                </div>
             ))}
             className="cursor-pointer p-6 border border-white/10 bg-white/[0.02] rounded-xl hover:bg-white/[0.03] hover:border-fuchsia-500/30 transition-all group relative"
          >
            <div className="absolute top-4 right-4 bg-white/5 p-1 rounded opacity-0 group-hover:opacity-100"><Info className="w-3 h-3 text-slate-400" /></div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Readiness Score</div>
            <h2 className="text-3xl font-mono font-black text-white leading-tight">
              {intelligence.readiness?.overall || user.interviewReadinessScore || 0}<span className="text-sm text-slate-500">/100</span>
            </h2>
          </div>

          <div 
             onClick={() => openEvidence("Predicted Placement Window", (
                <div className="space-y-4 text-sm text-slate-300">
                   <p>Calculated based on your current weekly completion velocity and readiness gap.</p>
                   <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-3 border border-white/10 rounded bg-white/5">
                         <div className="text-xs text-slate-500 mb-1 font-mono uppercase">Readiness Gap</div>
                         <div className="text-lg text-white font-mono">{Math.max(0, 75 - (intelligence.readiness?.overall || user.interviewReadinessScore || 0))} pts</div>
                      </div>
                      <div className="p-3 border border-white/10 rounded bg-white/5">
                         <div className="text-xs text-slate-500 mb-1 font-mono uppercase">Current Pace</div>
                         <div className="text-lg text-white font-mono">{intelligence.weeklyActivity?.slice(-1)[0]?.solved || 0} solves/wk</div>
                      </div>
                   </div>
                </div>
             ))}
             className="cursor-pointer p-6 border border-white/10 bg-white/[0.02] rounded-xl hover:bg-white/[0.03] hover:border-amber-500/30 transition-all group relative"
          >
            <div className="absolute top-4 right-4 bg-white/5 p-1 rounded opacity-0 group-hover:opacity-100"><Info className="w-3 h-3 text-slate-400" /></div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">FAANG Readiness</div>
            <h2 className="text-xl font-black text-amber-400 leading-tight">
              {intelligence.weeksToReadiness ? `${intelligence.weeksToReadiness} Weeks` : 'Uncalibrated'}
            </h2>
          </div>
        </motion.section>
        </div>
        )}

        {/* TELEMETRY TAB */}
        {activeTab === 'telemetry' && (
          <div className="space-y-12">
            {/* SYSTEM 4: EXECUTION BEHAVIOR PANEL (TELEMETRY) */}
            <motion.section variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                Execution Telemetry
             </h3>
             <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-2 py-1 rounded flex items-center gap-2">
               Confidence: <span className={cn(
                  telemetry.confidence === 'LOW' ? 'text-rose-400' :
                  telemetry.confidence === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
               )}>{telemetry.confidence || 'LOW'}</span>
             </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { 
                  label: 'Hint Dependency', 
                  value: telemetry.hintDependency || 'Medium', 
                  evidence: `${telemetry.hintRate || 0}% of problems required hints to solve.`
               },
               { 
                  label: 'Recovery Ability', 
                  value: telemetry.recoveryAbility || 'Medium',
                  evidence: `${telemetry.recoveryRate || 0}% of failed problems were eventually accepted.`
               },
               { 
                  label: 'Persistence', 
                  value: telemetry.persistence || 'Medium',
                  evidence: `Attempt-to-abandonment ratio analysis.`
               },
               { 
                  label: 'Interview Stability', 
                  value: telemetry.interviewStability || 'Medium',
                  evidence: `Standard deviation of mock interview scores.`
               },
             ].map((item, i) => (
               <div 
                  key={i} 
                  onClick={() => openEvidence(item.label, <div className="text-sm font-mono text-emerald-400 bg-emerald-500/10 p-4 border border-emerald-500/20 rounded-xl">{item.evidence}</div>)}
                  className="cursor-pointer group p-4 border border-white/5 bg-white/[0.01] rounded-xl hover:bg-white/[0.04] hover:border-white/20 transition-all relative"
               >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Info className="w-3 h-3 text-slate-500" /></div>
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
             <div 
                onClick={() => openEvidence("Primary Panic Signal", (
                   <div className="space-y-4">
                      <p className="text-sm text-slate-300">Determined by comparing performance under time constraints.</p>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 border border-white/10 rounded-xl bg-white/5 text-center">
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-2">Untimed Accuracy</div>
                            <div className="text-2xl font-mono text-emerald-400">{telemetry.untimedAccuracy || 0}%</div>
                         </div>
                         <div className="p-4 border border-white/10 rounded-xl bg-white/5 text-center">
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-2">Timed Accuracy</div>
                            <div className="text-2xl font-mono text-rose-400">{telemetry.timedAccuracy || 0}%</div>
                         </div>
                      </div>
                   </div>
                ))}
                className="cursor-pointer group col-span-2 md:col-span-4 p-4 border border-white/5 bg-white/[0.01] rounded-xl hover:bg-white/[0.04] hover:border-white/20 transition-all relative"
             >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><Info className="w-3 h-3 text-slate-500" /></div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Primary Panic Signal</div>
                <div className="text-sm text-slate-300 font-mono border-l-2 border-rose-500/50 pl-3">
                  {telemetry.panicSignals || 'Gathering evidence...'}
                </div>
             </div>
          </div>
        </motion.section>

        {/* SYSTEM 3: OBSERVED STRENGTH MAP */}
        <motion.section variants={fadeUp}>
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-400" />
              Observed Topic Mapping
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
                      .filter(([_, data]: any) => data.current > 60)
                      .slice(0, 3)
                      .map(([_, data]: any) => (
                        <div key={data.canonical} className="p-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => openEvidence(`Strength: ${data.label}`, (
                           <div className="space-y-4 font-mono text-sm">
                              <p className="text-slate-400">Score derived from 3 weighted sources:</p>
                              <div className="flex justify-between border-b border-white/10 pb-2"><span>Coding Lab Performance (40%)</span> <span className="text-emerald-400">{data.source.codingLab}</span></div>
                              <div className="flex justify-between border-b border-white/10 pb-2"><span>Interview Sessions (30%)</span> <span className="text-emerald-400">{data.source.interviewSession}</span></div>
                              <div className="flex justify-between pb-2"><span>AI Code Audit Quality (15%)</span> <span className="text-emerald-400">{data.source.aiAudit}</span></div>
                              <div className="p-3 bg-white/5 rounded text-center">Trend: {data.trend > 0 ? `+${data.trend}` : data.trend} this week</div>
                           </div>
                        ))}>
                           <div className="flex items-center justify-between mb-2">
                              <div>
                                 <div className="text-sm font-bold text-white flex items-center gap-2">{data.label} <Info className="w-3 h-3 text-slate-500" /></div>
                              </div>
                              <div className="text-right">
                                 <div className="text-lg font-mono text-emerald-400">{Math.round(data.current)}</div>
                              </div>
                           </div>
                           <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(100, data.current)}%` }}
                               transition={{ duration: 1, delay: 0.5 }}
                               className="h-full bg-emerald-500 rounded-full"
                             />
                           </div>
                        </div>
                    ))}
                    {(!intelligence?.topicScores || Object.values(intelligence.topicScores).filter((d: any) => d.current > 60).length === 0) && (
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
                      .filter(([_, data]: any) => data.current <= 60 && (data.source.codingLab > 0 || data.source.interviewSession > 0))
                      .slice(0, 3)
                      .map(([_, data]: any) => (
                        <div key={data.canonical} className="p-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => openEvidence(`Friction: ${data.label}`, (
                           <div className="space-y-4 font-mono text-sm">
                              <p className="text-slate-400">Score derived from 3 weighted sources:</p>
                              <div className="flex justify-between border-b border-white/10 pb-2"><span>Coding Lab Performance (40%)</span> <span className="text-amber-400">{data.source.codingLab}</span></div>
                              <div className="flex justify-between border-b border-white/10 pb-2"><span>Interview Sessions (30%)</span> <span className="text-amber-400">{data.source.interviewSession}</span></div>
                              <div className="flex justify-between pb-2"><span>AI Code Audit Quality (15%)</span> <span className="text-amber-400">{data.source.aiAudit}</span></div>
                              <div className="p-3 bg-white/5 rounded text-center">Target FAANG Requirement: {data.target}</div>
                           </div>
                        ))}>
                           <div className="flex items-center justify-between mb-2">
                              <div>
                                 <div className="text-sm font-bold text-white flex items-center gap-2">{data.label} <Info className="w-3 h-3 text-slate-500" /></div>
                              </div>
                              <div className="text-right">
                                 <div className="text-lg font-mono text-amber-400">{Math.round(data.current)}</div>
                              </div>
                           </div>
                           <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(100, data.current)}%` }}
                               transition={{ duration: 1, delay: 0.5 }}
                               className="h-full bg-amber-500 rounded-full"
                             />
                           </div>
                        </div>
                    ))}
                    {(!intelligence?.topicScores || Object.values(intelligence.topicScores).filter((d: any) => d.current <= 60 && (d.source.codingLab > 0 || d.source.interviewSession > 0)).length === 0) && (
                      <div className="p-4 text-xs text-slate-500 font-mono">No observed frictions yet.</div>
                    )}
                 </div>
              </div>
           </div>
        </motion.section>
        </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-12">
            {/* SYSTEM 2 & 6: EVOLUTION TIMELINE & EVIDENCE VAULT */}
            <motion.section variants={fadeUp}>
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Career Git History
           </h3>
           <div className="border-l border-white/10 ml-2 pl-6 space-y-8 py-4 relative">
             {events.slice(0, 15).map((event: any, i: number) => (
               <div key={i} className="relative group">
                 <div className={cn(
                    "absolute -left-[31px] top-1 w-2 h-2 rounded-full ring-4 ring-[#030303] group-hover:scale-150 transition-all",
                    event.type === 'achievement' ? 'bg-amber-400 group-hover:bg-amber-300' :
                    event.type === 'interview_completed' ? 'bg-indigo-500 group-hover:bg-indigo-400' :
                    event.eventType === 'SYSTEM' ? 'bg-fuchsia-500 group-hover:bg-fuchsia-400' :
                    'bg-emerald-500 group-hover:bg-emerald-400'
                 )}></div>
                 <div className="text-[10px] text-slate-500 font-mono mb-1">
                   {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                 </div>
                 <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                   {event.title}
                 </div>
                 <div className="text-xs text-slate-400 leading-relaxed max-w-2xl bg-white/[0.02] p-3 rounded-lg border border-white/5 mt-2 group-hover:bg-white/[0.04] transition-colors font-mono">
                   {event.description}
                 </div>
               </div>
             ))}
             {events.length === 0 && (
               <div className="text-xs text-slate-500 font-mono">Timeline is currently empty.</div>
             )}
           </div>
        </motion.section>
        </div>
        )}

      </motion.main>

      {/* EVIDENCE MODAL */}
      <AnimatePresence>
        {evidenceModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Microscope className="w-3 h-3" />
                          Evidence Protocol
                       </div>
                       <h3 className="text-xl font-bold text-white">{evidenceModal.title}</h3>
                    </div>
                    <button onClick={() => setEvidenceModal(null)} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                       <X className="w-4 h-4" />
                    </button>
                 </div>
                 <div className="mb-6">
                    {evidenceModal.data}
                 </div>
                 <button onClick={() => setEvidenceModal(null)} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors">
                    Close Evidence
                 </button>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
