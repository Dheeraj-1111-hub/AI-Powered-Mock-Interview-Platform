import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Map, Brain, Microscope, ChevronDown,
  Flame, Zap, Clock, TrendingUp, RefreshCw, Code2, AlertTriangle, Settings
} from 'lucide-react';
import { AuthContext } from '../services/auth.service';
import { getCareerIntelligence } from '../services/api.service';
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
  const stateConf = STATE_CONFIG[intel?.careerState || 'Explorer'];
  const topicScores = intel?.topicScores || [];
  const completedWeeks = roadmap?.adaptiveSignals?.completedWeeks || [];

  const intelligenceContext = intel ? {
    overallReadiness: intel.readiness?.overall || 0,
    careerState: intel.careerState || 'Explorer',
    targetRole: activeStrategy?.targetRole || profile?.targetRole || 'Software Engineer',
    targetCompany: activeStrategy?.targetCompany || profile?.targetCompany || 'FAANG',
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
  projectedReadyDate.setDate(projectedReadyDate.getDate() + (intel?.weeksToReadiness || 12) * 7);
  const readyMonthYear = projectedReadyDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#030305] text-slate-100 overflow-x-hidden">
      <Navbar />

      {/* Background */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/5 blur-[100px] rounded-full pointer-events-none" />

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
      />

      <main className="relative z-10 pt-28 pb-20 px-6 max-w-[1600px] mx-auto">
        {loading ? (
          <div className="h-[60vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-spin">
                <Brain className="w-7 h-7 text-indigo-400" />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Calibrating Intelligence Engine...</p>
            </div>
          </div>
        ) : (
          <div className="relative max-w-5xl mx-auto">
            <div className="space-y-10">

              {/* ── COMMAND CENTER HEADER ── */}
              <section>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">
                      <Rocket className="w-3 h-3" /> Career OS Active
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                      Career <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Alpha</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                      Targeting <span className="text-white font-black">{activeStrategy?.targetRole || profile?.targetRole || 'Software Engineer'}</span>
                      {(activeStrategy?.targetCompany || profile?.targetCompany) && <span className="text-indigo-400"> @ {activeStrategy?.targetCompany || profile?.targetCompany}</span>}
                    </p>
                    <p className="mt-2 text-xs text-indigo-300 font-medium bg-indigo-500/10 inline-flex items-center px-2.5 py-1 rounded-md border border-indigo-500/20">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      Projected {(activeStrategy?.targetCompany || profile?.targetCompany) || 'FAANG'}-ready date: <span className="text-indigo-100 ml-1 font-bold">{readyMonthYear}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowStrategyModal(true)}
                      className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all shadow-lg shadow-indigo-500/10"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button onClick={() => fetchIntelligence(true)} disabled={refreshing}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Readiness Card */}
                  <SpotlightCard 
                    className="col-span-2 md:col-span-1 p-6 flex flex-col justify-center cursor-pointer hover:border-indigo-500/30 transition-all group"
                    onClick={() => setShowExplainabilityModal(true)}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-indigo-400" />
                          Readiness Band
                        </span>
                        {intel?.systemConfidence && (
                          <span className={cn(
                            'px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border flex items-center gap-1',
                            intel.systemConfidence === 'LOW' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            intel.systemConfidence === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          )}>
                            {intel.systemConfidence === 'LOW' ? <AlertTriangle className="w-2.5 h-2.5" /> : null}
                            Conf: {intel.systemConfidence}
                          </span>
                        )}
                      </div>
                      
                      <h2 className={cn(
                        "text-xl font-black leading-tight tracking-tight",
                        stateConf?.color || 'text-slate-400'
                      )}>
                        {intel?.careerState || 'Foundation Building'}
                      </h2>
                      
                      <div className="mt-2 text-xs text-slate-400 font-medium">
                        Estimated readiness range: <span className="text-white font-mono">{Math.max(0, readiness - 4)}-{Math.min(95, readiness + 4)}</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 text-[9px] text-slate-500 font-medium leading-relaxed">
                        Last updated from:<br/>
                        <span className="text-slate-300">
                          {intel?.readiness?.evidenceCount?.codingSessions || 0} coding sessions, {intel?.readiness?.evidenceCount?.mockInterviews || 0} mock interviews
                        </span>
                      </div>
                      
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-3">
                        <Microscope className="w-3 h-3" /> View Evidence
                      </span>
                    </div>
                  </SpotlightCard>

                  {/* Sub-scores */}
                  {[
                    { label: 'DSA',         val: intel?.readiness?.dsa || 0,         icon: <Code2 className="w-4 h-4" />,      color: 'text-indigo-400' },
                    { label: 'Consistency', val: intel?.readiness?.consistency || 0,  icon: <Flame className="w-4 h-4" />,      color: 'text-amber-400'  },
                    { label: 'Optimization',val: intel?.readiness?.optimization || 0, icon: <Zap className="w-4 h-4" />,        color: 'text-violet-400' },
                  ].map(s => (
                    <SpotlightCard key={s.label} className="p-6">
                      <div className={cn('mb-3', s.color)}>{s.icon}</div>
                      <div className="text-2xl font-black text-white mb-1">{s.val}<span className="text-sm text-slate-500">%</span></div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                      <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-current rounded-full" style={{ color: 'currentColor' }}
                          initial={{ width: 0 }} animate={{ width: `${s.val}%` }} transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                    </SpotlightCard>
                  ))}
                </div>

                {/* (Old Inline Readiness Breakdown matrix removed for dedicated explainability drawer) */}

                {/* Weekly activity mini-chart + XP/streak */}
                {userMeta && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <SpotlightCard className="p-5 flex items-center gap-4">
                      <Flame className="w-8 h-8 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-2xl font-black text-white">{userMeta.streak}</p>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Day Streak</p>
                      </div>
                    </SpotlightCard>
                    <SpotlightCard className="p-5 flex items-center gap-4">
                      <TrendingUp className="w-8 h-8 text-indigo-400 shrink-0" />
                      <div>
                        <p className="text-2xl font-black text-white">{userMeta.xp?.toLocaleString() || 0}</p>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">XP Earned</p>
                      </div>
                    </SpotlightCard>
                    <SpotlightCard className="p-5 flex items-center gap-4">
                      <Clock className="w-8 h-8 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-2xl font-black text-white">{intel?.weeksToReadiness || '—'}</p>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Wks to Ready</p>
                      </div>
                    </SpotlightCard>
                  </div>
                )}
              </section>

              {/* ── TODAY ENGINE ── */}
              <section>
                <TodayEngine onXPUpdate={(xp) => {
                  setData((prev: any) => ({ ...prev, user: { ...prev.user, xp }}));
                }} />
              </section>

              {/* ── SKILL GAP MATRIX (Progressive Disclosure) ── */}
              <section>
                <div 
                  className="flex items-center gap-4 border-b border-white/5 pb-5 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowSkillMatrix(!showSkillMatrix)}
                >
                  <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <Microscope className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                      Skill Gap Matrix
                      <ChevronDown className={cn("w-5 h-5 text-slate-500 transition-transform", showSkillMatrix && "rotate-180")} />
                    </h2>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Weighted · CodingLab 40% · Interviews 30% · Audit 15% · Resume 10% · Streak 5%</p>
                  </div>
                  {topicScores.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[8px] text-slate-400 font-black uppercase">
                      {topicScores.length} topics tracked
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
                      <SkillMatrix topics={topicScores} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* ── WEEKLY ROADMAP ── */}
              <section>
                <div className="flex items-center gap-4 border-b border-white/5 pb-5 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Map className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">12-Week Roadmap</h2>
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
              
              {/* ── ACTIVITY FEED ── */}
              <section>
                <ActivityFeed />
              </section>
            </div>
            
            <MentorSidebar intelligenceContext={intelligenceContext} />
          </div>
        )}
      </main>
    </div>
  );
}


