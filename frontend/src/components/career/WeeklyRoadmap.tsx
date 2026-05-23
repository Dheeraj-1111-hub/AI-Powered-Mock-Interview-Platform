import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, Zap, Loader2, Lock,
  ChevronDown, Code2, Brain, FileText, RotateCcw,
  Trophy, Star
} from 'lucide-react';
import { completeWeek, adaptRoadmap } from '../../services/api.service';
import { cn } from '../../utils/cn';

interface WeekTask {
  id: string;
  title: string;
  completed: boolean;
  type: 'solve' | 'interview' | 'learn' | 'review';
  xpReward: number;
}

interface Week {
  week: number;
  focus: string;
  topics: string[];
  problems: number;
  difficulty: string;
  mockInterviews: number;
  status?: 'locked' | 'active' | 'completed' | 'struggling' | 'regenerated' | 'skipped';
  confidenceScore?: number;
  decisionReasoning?: string;
  completedAt?: string;
  keyMilestone?: string;
  tasks?: WeekTask[];
}

interface Props {
  weeklyPlan: Week[];
  completedWeeks: number[];
  readinessScore: number;
  onUpdate: (data: any) => void;
}

const diffColor = (d: string) => {
  if (d === 'Easy')   return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (d === 'Mixed')  return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (d === 'Medium') return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  return                     'text-rose-400 bg-rose-500/10 border-rose-500/20';
};

const taskIcon = (type: string) => {
  switch (type) {
    case 'solve':     return <Code2 className="w-3.5 h-3.5 text-emerald-400" />;
    case 'interview': return <Brain className="w-3.5 h-3.5 text-purple-400" />;
    case 'learn':     return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    default:          return <RotateCcw className="w-3.5 h-3.5 text-amber-400" />;
  }
};

export default function WeeklyRoadmap({ weeklyPlan, completedWeeks, readinessScore, onUpdate }: Props) {
  const [adapting, setAdapting]       = useState(false);
  const [completing, setCompleting]   = useState<number | null>(null);
  const [expanded, setExpanded]       = useState<number | null>(null);

  const handleComplete = async (weekNum: number) => {
    setCompleting(weekNum);
    try {
      await completeWeek(weekNum);
      onUpdate({ completedWeek: weekNum });
    } catch (e) { console.error(e); }
    setCompleting(null);
  };

  const handleAdapt = async () => {
    setAdapting(true);
    try {
      const res = await adaptRoadmap();
      onUpdate(res.data);
    } catch (e) { console.error(e); }
    setAdapting(false);
  };

  if (!weeklyPlan?.length) return (
    <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl">
      <p className="text-slate-600 text-xs font-black uppercase tracking-widest">Initialize your profile to generate roadmap</p>
    </div>
  );

  const behindCount = weeklyPlan.filter(
    w => !completedWeeks.includes(w.week) && w.week < (completedWeeks.length + 1)
  ).length;

  const totalCompleted = completedWeeks.length;
  const totalWeeks     = weeklyPlan.length;

  return (
    <div className="space-y-4">
      {/* ── Progress bar header ── */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(totalCompleted / totalWeeks) * 100}%` }}
            transition={{ duration: 1, ease: 'circOut' }}
          />
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
          {totalCompleted} / {totalWeeks} weeks
        </span>
      </div>

      {/* ── Behind alert ── */}
      {behindCount > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-black text-amber-300">
              You're behind on {behindCount} week(s). Adapt your roadmap?
            </p>
          </div>
          <button
            onClick={handleAdapt}
            disabled={adapting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50"
          >
            {adapting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {adapting ? 'Adapting...' : 'Adapt Now'}
          </button>
        </div>
      )}

      {/* ── Week cards ── */}
      <div className="grid gap-3">
        {weeklyPlan.map((w, i) => {
          const isCompleted = completedWeeks.includes(w.week);
          const isCurrent   = !isCompleted && w.week === (completedWeeks.length + 1);
          const isExpanded  = expanded === w.week;
          const weekTasks   = w.tasks || [];
          const doneTaskCount = weekTasks.filter(t => t.completed).length;
          const taskProgress  = weekTasks.length > 0
            ? Math.round((doneTaskCount / weekTasks.length) * 100)
            : 0;

          return (
            <motion.div
              key={w.week}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn('rounded-2xl border transition-all overflow-hidden',
                isCompleted ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' :
                isCurrent   ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.08)]' :
                'bg-white/[0.02] border-white/5'
              )}
            >
              {/* Card header */}
              <div
                className={cn('flex items-start justify-between gap-4 p-5', (isCurrent || isCompleted) && 'cursor-pointer')}
                onClick={() => (isCurrent || isCompleted) && setExpanded(isExpanded ? null : w.week)}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Week badge */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black border',
                    isCompleted ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                    isCurrent   ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' :
                    'bg-white/5 border-white/10 text-slate-500'
                  )}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : w.week}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-black text-white truncate">{w.focus}</p>
                      {isCurrent   && <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[7px] font-black uppercase tracking-widest">Current</span>}
                      {isCompleted && <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[7px] font-black uppercase tracking-widest">Done</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {w.topics.slice(0, 4).map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[8px] font-bold text-slate-400 uppercase">{t}</span>
                      ))}
                    </div>
                    {w.keyMilestone && (
                      <p className="text-[10px] text-indigo-300/60 font-medium mt-2 italic">🎯 {w.keyMilestone}</p>
                    )}

                    {w.decisionReasoning && (
                      <div className="mt-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-2">
                        <Brain className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">AI Reasoning</span>
                          <p className="text-xs text-slate-300">{w.decisionReasoning}</p>
                        </div>
                      </div>
                    )}

                    {/* Task progress bar (only when tasks exist) */}
                    {weekTasks.length > 0 && !isCompleted && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${taskProgress}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 font-black">{doneTaskCount}/{weekTasks.length}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border', diffColor(w.difficulty))}>{w.difficulty}</span>
                    <span className="text-[9px] font-black text-slate-500">{w.problems}P</span>
                    {w.confidenceScore !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400" title="AI Confidence Score">
                        {w.confidenceScore}% Conf
                      </span>
                    )}
                    {w.mockInterviews > 0 && <span className="text-[9px] font-black text-violet-400">{w.mockInterviews}M</span>}
                  </div>

                  {isCurrent && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleComplete(w.week); }}
                        disabled={completing === w.week}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500/25 transition-all"
                      >
                        {completing === w.week ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle className="w-2.5 h-2.5" />}
                        Complete
                      </button>
                      <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', isExpanded && 'rotate-180')} />
                    </div>
                  )}
                  {isCompleted && (
                    <ChevronDown className={cn('w-4 h-4 text-slate-600 transition-transform', isExpanded && 'rotate-180')} />
                  )}
                  {!isCurrent && !isCompleted && (
                    <Lock className="w-3 h-3 text-slate-700" />
                  )}
                </div>
              </div>

              {/* Expandable task list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    key="tasks"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-2">
                      {weekTasks.length > 0 ? (
                        weekTasks.map(task => (
                          <div
                            key={task.id}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-xl border text-sm transition-colors',
                              task.completed
                                ? 'bg-emerald-500/5 border-emerald-500/15 opacity-60'
                                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                                task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'
                              )}>
                                {task.completed && <CheckCircle className="w-3 h-3 text-zinc-900" />}
                              </div>
                              <span className="flex items-center gap-2">
                                {taskIcon(task.type)}
                                <span className={cn('text-[11px] font-medium', task.completed ? 'line-through text-slate-500' : 'text-slate-200')}>
                                  {task.title}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-slate-500 font-black uppercase">
                              <Star className="w-3 h-3 text-amber-400" />
                              +{task.xpReward} XP
                            </div>
                          </div>
                        ))
                      ) : (
                        // Show topic breakdown when no explicit tasks exist
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2 flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
                            <Clock className="w-3 h-3" /> This week's targets
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-xl font-black text-white">{w.problems}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Problems</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-xl font-black text-white">{w.mockInterviews}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Mock Interviews</p>
                          </div>
                          {w.topics.map(t => (
                            <div key={t} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                              <span className="text-[10px] text-slate-300 font-medium capitalize">{t}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Week completion reward callout */}
                      {isCurrent && (
                        <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-amber-300 uppercase tracking-wider">Complete this week</p>
                            <p className="text-[9px] text-slate-500">Mark all done above, then hit Complete to freeze this week</p>
                          </div>
                          <span className="ml-auto text-xs font-black text-amber-400">+50 XP</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
