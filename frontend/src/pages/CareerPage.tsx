import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Map, Brain, Microscope, ChevronDown,
  Flame, Zap, Clock, TrendingUp, RefreshCw, Code2, AlertTriangle, Settings, RotateCcw
} from 'lucide-react';
import { AuthContext } from '../services/auth.service';
import { getCareerIntelligence, resetCareerOS } from '../services/api.service';
import { Navbar } from '../components/shared/Navbar';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { cn } from '../utils/cn';
import CareerOnboarding from '../components/career/CareerOnboarding';
import SkillMatrix from '../components/career/SkillMatrix';
import WeeklyRoadmap from '../components/career/WeeklyRoadmap';
import MentorSidebar from '../components/career/MentorSidebar';
import TodayEngine from '../components/career/TodayEngine';
import ActivityFeed from '../components/career/ActivityFeed';
import StrategyCenterModal from '../components/career/StrategyCenterModal';
import ReadinessExplainabilityDrawer from '../components/career/ReadinessExplainabilityDrawer';

const STATE_CONFIG: Record<string, { color: string; glow: string; next: string }> = {
  'Foundation Building': { color: 'text-slate-400',  glow: 'bg-slate-500/10 border-slate-500/20',  next: 'Emerging Solver' },
  'Emerging Solver':     { color: 'text-blue-400',   glow: 'bg-blue-500/10 border-blue-500/20',    next: 'Execution Capable' },
  'Execution Capable':   { color: 'text-amber-400',  glow: 'bg-amber-500/10 border-amber-500/20',  next: 'Interview Ready' },
  'Interview Ready':     { color: 'text-indigo-400', glow: 'bg-indigo-500/10 border-indigo-500/20',next: 'Advanced Optimization' },
  'Advanced Optimization': { color: 'text-emerald-400',glow: 'bg-emerald-500/10 border-emerald-500/20', next: '' },
};

export default function CareerPage() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData]           = useState<any>(null);
  const [initStatus, setInitStatus] = useState<string>('pending');
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  const fetchIntelligence = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await getCareerIntelligence();
      setData(res.data);
      const status = res.data?.careerProfile?.initializationStatus || (res.data?.careerProfile?.initialized ? 'completed' : 'pending');
      setInitStatus(status);
    } catch (e) {
      console.error(e);
      setInitStatus('failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchIntelligence(); }, []);

  const handleResetProgress = async () => {
    if (!window.confirm("Are you sure you want to completely restart your Career OS? This will wipe your readiness score, topic mastery, and all roadmap progress.")) return;
    setLoading(true);
    try {
      await resetCareerOS();
      window.location.reload();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleOnboardingComplete = (result: any) => {
    setInitStatus('completed');
    setData((prev: any) => ({
      ...prev,
      careerProfile: { ...result.profile, initializationStatus: 'completed', initialized: true },
      roadmap: result.roadmap,
      intelligence: result.intelligence,
    }));
  };

  const handleRoadmapUpdate = (update: any) => {
    if (update.roadmap) setData((prev: any) => ({ ...prev, roadmap: update.roadmap }));
    if (update.completedWeek) {
      setData((prev: any) => ({
        ...prev,
        roadmap: {
          ...prev.roadmap,
          adaptiveSignals: {
            ...prev.roadmap?.adaptiveSignals,
            completedWeeks: [...(prev.roadmap?.adaptiveSignals?.completedWeeks || []), update.completedWeek],
          }
        }
      }));
    }
  };

  const intel = data?.intelligence;
  const roadmap = data?.roadmap;
  const profile = data?.careerProfile;
  const activeStrategy = data?.activeStrategy;
  const userMeta = data?.user;
  const careerBrain = userMeta?.careerBrain;
  const stateConf = STATE_CONFIG[intel?.careerState || 'Explorer'];
  const topicScores = intel?.topicScores || [];
  const completedWeeks = roadmap?.adaptiveSignals?.completedWeeks || [];

  const skillGraph = careerBrain?.skillGraph || {};
  const sortedSkills = Object.entries(skillGraph).sort((a: any, b: any) => b[1] - a[1]);
  const strongestSkill = sortedSkills.length > 0 ? sortedSkills[0][0] : intel?.strongTopics?.[0]?.replace(/_/g, ' ') || 'N/A';
  const weakestSkill = sortedSkills.length > 0 ? sortedSkills[sortedSkills.length - 1][0] : intel?.strugglingTopics?.[0]?.replace(/_/g, ' ') || 'N/A';
  const confidenceLevel = careerBrain?.confidenceProfile?.level || intel?.systemConfidence;
  const confidenceReason = careerBrain?.confidenceProfile?.reason || 'Calculated from baseline data';
  const displayWeeks = intel?.weeksToReadiness || roadmap?.weeklyPlan?.length || '--';

  const intelligenceContext = intel ? {
    overallReadiness: intel.readiness?.overall || 0,
    careerState: intel.careerState || 'Explorer',
    targetRole: activeStrategy?.targetRole || profile?.targetRole || 'Software Engineer',
    targetCompany: activeStrategy?.targetCompany || profile?.targetCompany || 'Target Company',
    weakTopics: intel.strugglingTopics?.slice(0, 5).map((t: string) => t.replace(/_/g, ' ')) || [],
    strongTopics: intel.strongTopics?.slice(0, 3).map((t: string) => t.replace(/_/g, ' ')) || [],
    streak: userMeta?.streak || 0,
    weeksToReadiness: intel.weeksToReadiness || 12,
    performanceDelta: intel.performanceDelta || '',
  } : null;

  // Readiness ring draw
  const readiness = intel?.readiness?.overall || 0;
  const circumference = 2 * Math.PI * 52;
  const dashoffset = circumference - (readiness / 100) * circumference;

  const [showExplainabilityModal, setShowExplainabilityModal] = useState(false);
  const [showSkillMatrix, setShowSkillMatrix] = useState(false);

  const projectedReadyDate = new Date();
  projectedReadyDate.setDate(projectedReadyDate.getDate() + (intel?.weeksToReadiness || 0) * 7);
  const readyMonthYear = projectedReadyDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10"></div>
      <Navbar />

      {/* Initialization Failed Recovery */}
      {initStatus === 'failed' && !loading && (
        <div className="fixed inset-0 z-50 bg-[#030305] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-rose-500/10 border border-rose-500/20 p-8 rounded-3xl text-center">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Initialization Failed</h2>
            <p className="text-sm text-slate-400 mb-6">A critical failure occurred during the atomic initialization of your career OS. This could be due to AI timeout or connectivity issues.</p>
            <button 
              onClick={() => { setInitStatus('pending'); }} 
              className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-colors"
            >
              Restart Calibration Sequence
            </button>
          </div>
        </div>
      )}

      {/* Onboarding modal */}
      {(initStatus === 'pending' || initStatus === 'processing') && !loading && (
        <CareerOnboarding
          savedStep={profile?.savedStep || 0}
          initialStatus={initStatus}
          initialData={profile}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Strategy Center Modal */}
      <StrategyCenterModal 
        isOpen={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
        activeStrategy={activeStrategy || profile}
        careerStrategies={data?.careerStrategies || []}
        onStrategyUpdated={() => fetchIntelligence(true)}
      />

      {/* Explainability Drawer */}
      <ReadinessExplainabilityDrawer
        isOpen={showExplainabilityModal}
        onClose={() => setShowExplainabilityModal(false)}
        intelligence={intel}
        careerBrain={careerBrain}
      />

      <main className="relative z-10 pt-32 pb-24 px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center gap-8">
               <motion.div 
                  className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)]"
                  animate={{ 
                    boxShadow: ["0px 0px 40px rgba(99,102,241,0.1)", "0px 0px 80px rgba(99,102,241,0.4)", "0px 0px 40px rgba(99,102,241,0.1)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                     <Brain className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                  </motion.div>
                  {/* Neural Particles */}
                  {[...Array(3)].map((_, i) => (
                     <motion.div
                        key={i}
                        className="absolute w-full h-full rounded-3xl border border-indigo-500/30"
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.5 + (i * 0.2) }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                     />
                  ))}
               </motion.div>
               <div className="flex flex-col items-center gap-3">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">Calibrating Intelligence Engine</p>
                 <div className="w-32 h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                       className="h-full w-1/3 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)] rounded-full"
                       animate={{ x: ["-100%", "300%"] }}
                       transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* ── COMMAND CENTER HEADER (Full Width) ── */}
            <section className="mb-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                    Career <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Alpha</span>
                  </h1>
                  <p className="text-slate-500 text-sm font-medium">
                    Targeting <span className="text-white font-black">{activeStrategy?.targetRole || profile?.targetRole || 'Software Engineer'}</span>
                    {(activeStrategy?.targetCompany || profile?.targetCompany) && <span className="text-indigo-400"> @ {activeStrategy?.targetCompany || profile?.targetCompany}</span>}
                  </p>
                  <p className="mt-2 text-xs text-indigo-300 font-medium bg-indigo-500/10 inline-flex items-center px-2.5 py-1 rounded-md border border-indigo-500/20">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Expected {profile?.dreamCompany || activeStrategy?.targetCompany || profile?.targetCompany || 'Target Role'} Readiness: <span className="text-indigo-100 ml-1 font-bold">{displayWeeks} weeks</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleResetProgress}
                    className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all shadow-lg shadow-rose-500/10"
                    title="Restart Career Progress"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowStrategyModal(true)}
                    className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all shadow-lg shadow-indigo-500/10"
                    title="Strategy Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button onClick={() => fetchIntelligence(true)} disabled={refreshing}
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Refresh Intelligence"
                  >
                    <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">
              
              {/* ── LEFT PANE: EXECUTION ── */}
              <div className="xl:col-span-8 space-y-10">
                {/* TODAY ENGINE */}
                <section>
                  <TodayEngine onXPUpdate={(xp) => {
                    setData((prev: any) => ({ ...prev, user: { ...prev.user, xp }}));
                  }} />
                </section>

                {/* WEEKLY ROADMAP */}
                <section>
                  <div className="flex items-center gap-4 border-b border-white/5 pb-5 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Map className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tighter">{roadmap?.weeklyPlan?.length || 12}-Week Roadmap</h2>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Adaptive · completed weeks frozen · future weeks regenerate</p>
                    </div>
                    {roadmap?.adaptiveSignals?.regenerationCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[8px] text-amber-400 font-black uppercase">
                        Adapted {roadmap.adaptiveSignals.regenerationCount}×
                      </span>
                    )}
                  </div>
                  <WeeklyRoadmap
                    weeklyPlan={roadmap?.weeklyPlan || []}
                    completedWeeks={completedWeeks}
                    readinessScore={readiness}
                    onUpdate={handleRoadmapUpdate}
                  />
                </section>
              </div>

              {/* ── RIGHT PANE: INTELLIGENCE SIDEBAR ── */}
              <div className="xl:col-span-4 space-y-8">
                
                {/* READINESS & STATS */}
                <section className="space-y-4">
                  <SpotlightCard 
                    className="p-6 flex flex-col justify-center cursor-pointer bg-[#0a0a0a] border-white/5 rounded-2xl hover:bg-[#0f0f0f] hover:border-indigo-500/20 transition-all group relative overflow-hidden"
                    onClick={() => setShowExplainabilityModal(true)}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-indigo-400" />
                          Readiness Band
                        </span>
                        {confidenceLevel && (
                          <span title={confidenceReason} className={cn(
                            'px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border flex items-center gap-1 cursor-help',
                            confidenceLevel === 'LOW' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            confidenceLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          )}>
                            {confidenceLevel === 'LOW' ? <AlertTriangle className="w-2.5 h-2.5" /> : null}
                            Conf: {confidenceLevel}
                          </span>
                        )}
                      </div>
                      
                      <h2 className={cn(
                        "text-xl font-black leading-tight tracking-tight",
                        stateConf?.color || 'text-slate-400'
                      )}>
                        {intel?.careerState || 'Foundation Building'}
                      </h2>
                      
                      <div className="mt-3 space-y-2 text-[11px] text-slate-400 font-medium bg-black/20 p-3 rounded-xl border border-white/5">
                         <div className="flex justify-between border-b border-white/5 pb-1.5">
                            <span className="uppercase tracking-widest text-[9px] font-black">Readiness</span>
                            <span className="text-white font-mono">{readiness}%</span>
                         </div>
                         <div className="flex justify-between border-b border-white/5 pb-1.5">
                            <span className="uppercase tracking-widest text-[9px] font-black">Strongest</span>
                            <div className="flex items-center gap-1.5">
                              {(intel?.readiness?.evidenceCount?.codingSessions || 0) === 0 && (
                                <span className="text-[7px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 py-0.5 rounded font-bold tracking-wider">EST</span>
                              )}
                              <span className="text-emerald-400 font-mono capitalize">{strongestSkill}</span>
                            </div>
                         </div>
                         <div className="flex justify-between pb-0.5">
                            <span className="uppercase tracking-widest text-[9px] font-black">Weakest</span>
                            <div className="flex items-center gap-1.5">
                              {(intel?.readiness?.evidenceCount?.codingSessions || 0) === 0 && (
                                <span className="text-[7px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 py-0.5 rounded font-bold tracking-wider">EST</span>
                              )}
                              <span className="text-rose-400 font-mono capitalize">{weakestSkill}</span>
                            </div>
                         </div>
                      </div>

                      {(intel?.readiness?.evidenceCount?.codingSessions || 0) === 0 && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <p className="text-[9px] text-amber-400/80 leading-relaxed">
                            EST = Diagnostic estimate only. Solve in <b>Coding Lab</b> or take mock interviews to generate real evidence.
                          </p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-white/5 text-[9px] text-slate-500 font-medium leading-relaxed">
                        Last updated from:<br/>
                        <span className="text-slate-300">
                          {intel?.readiness?.evidenceCount?.codingSessions || 0} coding sessions, {intel?.readiness?.evidenceCount?.mockInterviews || 0} mock interviews
                        </span>
                        {(intel?.readiness?.evidenceCount?.codingSessions || 0) < 5 && (
                          <div className="mt-1 text-amber-500/60">
                            Score penalized {Math.round((1 - (intel?.readiness?.multiplier ?? 0.35)) * 100)}% for low evidence � grows as you practice in Coding Lab.
                          </div>
                        )}
                      </div>
                      
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-3">
                        <Microscope className="w-3 h-3" /> View Evidence
                      </span>
                    </div>
                  </SpotlightCard>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'DSA',         val: intel?.readiness?.dsa || 0,         icon: <Code2 className="w-4 h-4" />,      color: 'text-indigo-400' },
                      { label: 'Consist.',    val: intel?.readiness?.consistency || 0,  icon: <Flame className="w-4 h-4" />,      color: 'text-amber-400'  },
                      { label: 'Optim.',      val: intel?.readiness?.optimization || 0, icon: <Zap className="w-4 h-4" />,        color: 'text-violet-400' },
                    ].map(s => (
                      <SpotlightCard key={s.label} className="p-4 bg-[#0a0a0a] border-white/5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all flex flex-col items-center text-center">
                        <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-[30px] pointer-events-none transition-colors opacity-10 group-hover:opacity-20", s.color.replace('text-', 'bg-'))} />
                        <div className={cn('mb-2 relative z-10 w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 bg-[#111]', s.color)}>{s.icon}</div>
                        <div className="text-lg font-black text-white mb-0.5 relative z-10">{s.val}<span className="text-[10px] text-slate-500">%</span></div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest relative z-10 line-clamp-1">{s.label}</p>
                      </SpotlightCard>
                    ))}
                  </div>

                  {userMeta && (
                    <div className="grid grid-cols-3 gap-3">
                      <SpotlightCard className="p-4 bg-[#0a0a0a] border-white/5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors flex flex-col items-center text-center">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-[20px] pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 bg-[#111] relative z-10 mb-2">
                          <Flame className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-lg font-black text-white relative z-10">{userMeta.streak}</p>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest relative z-10 line-clamp-1">Streak</p>
                      </SpotlightCard>
                      <SpotlightCard className="p-4 bg-[#0a0a0a] border-white/5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors flex flex-col items-center text-center">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-[20px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 bg-[#111] relative z-10 mb-2">
                          <TrendingUp className="w-4 h-4 text-indigo-400" />
                        </div>
                        <p className="text-lg font-black text-white relative z-10">{userMeta.xp?.toLocaleString() || 0}</p>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest relative z-10 line-clamp-1">XP</p>
                      </SpotlightCard>
                      <SpotlightCard className="p-4 bg-[#0a0a0a] border-white/5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors flex flex-col items-center text-center">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[20px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 bg-[#111] relative z-10 mb-2">
                          <Clock className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-lg font-black text-white relative z-10">{displayWeeks}</p>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest relative z-10 line-clamp-1">Weeks</p>
                      </SpotlightCard>
                    </div>
                  )}
                </section>

                {/* SKILL GAP MATRIX */}
                <section>
                  <div 
                    className="flex items-center gap-4 border-b border-white/5 pb-5 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setShowSkillMatrix(!showSkillMatrix)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <Microscope className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
                        Skill Matrix
                        <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", showSkillMatrix && "rotate-180")} />
                      </h2>
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest truncate">Code · Interv · Audit</p>
                    </div>
                    {topicScores.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] text-slate-400 font-black shrink-0">
                        {topicScores.length} topics
                      </span>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {showSkillMatrix && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <SkillMatrix topics={topicScores} codingSessionCount={intel?.readiness?.evidenceCount?.codingSessions || 0} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* ACTIVITY FEED */}
                <section>
                  <ActivityFeed />
                </section>
              </div>
            </div>
            
            <MentorSidebar intelligenceContext={intelligenceContext} />
          </div>
        )}
      </main>
    </div>
  );
}


