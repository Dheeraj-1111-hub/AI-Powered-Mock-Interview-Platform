import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Target, Code2, Brain, ChevronRight, Loader2, Save } from 'lucide-react';
import { initCareerProfile, saveOnboardingProgress } from '../../services/api.service';
import { cn } from '../../utils/cn';

const TOPICS = ['Arrays','Strings','Hashing','Two Pointers','Sliding Window','Binary Search','Linked Lists','Trees','Graphs','Dynamic Programming','Recursion','Heaps','System Design'];
const FREQUENCIES = ['Never', 'Occasionally', 'Weekly', 'Daily'];
const PLATFORMS = ['LeetCode', 'HackerRank', 'Codeforces', 'None'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const PERSONAS = [
  { value: 'faang_engineer', label: 'FAANG Engineer', desc: 'Optimization & scalability focus' },
  { value: 'startup_cto', label: 'Startup CTO', desc: 'Shipping & execution focus' },
  { value: 'dsa_coach', label: 'DSA Coach', desc: 'Patterns & algorithms focus' },
  { value: 'career_recruiter', label: 'Career Recruiter', desc: 'ATS & communication focus' },
];

const CALIBRATION_QUESTIONS = [
  {
    id: 'q1',
    question: 'What is the time complexity of searching in a perfectly balanced Binary Search Tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    answer: 'O(log n)'
  },
  {
    id: 'q2',
    question: 'Which algorithmic pattern is best suited for finding the longest substring with K unique characters?',
    options: ['Binary Search', 'Sliding Window', 'Depth First Search', 'Matrix Traversal'],
    answer: 'Sliding Window'
  },
  {
    id: 'q3',
    question: 'In a hash map, what causes a collision?',
    options: ['Memory overflow', 'Two keys hashing to the same bucket', 'Using strings as keys', 'Deleting an element'],
    answer: 'Two keys hashing to the same bucket'
  }
];

const NARRATION_STEPS = [
  "Mapping capability signals...",
  "Estimating weak-topic likelihood...",
  "Building adaptive roadmap...",
  "Initializing mentor memory..."
];

interface Props {
  savedStep?: number;
  initialStatus?: string;
  initialData?: any;
  onComplete: (data: any) => void;
}

export default function CareerOnboarding({ savedStep = 0, initialStatus, initialData, onComplete }: Props) {
  const [step, setStep] = useState(savedStep);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(initialStatus === 'processing');
  const [narrationIdx, setNarrationIdx] = useState(0);
  const [form, setForm] = useState({
    targetRole: initialData?.targetRole || '', targetCompany: initialData?.targetCompany || '', currentYear: initialData?.currentYear || 'junior',
    dailyHoursAvailable: initialData?.dailyHoursAvailable || 2,
    weakTopics: initialData?.weakTopics || ([] as string[]), strongTopics: initialData?.strongTopics || ([] as string[]),
    persona: initialData?.persona || 'faang_engineer',
    practiceFrequency: initialData?.practiceFrequency || 'Weekly', platformsUsed: initialData?.platformsUsed || ([] as string[]), highestDifficulty: initialData?.highestDifficulty || 'Easy',
    calibrationAnswers: initialData?.calibrationAnswers || ({} as Record<string, string>),
  });

  useEffect(() => {
    let interval: any;
    if (submitting || initialStatus === 'processing') {
      interval = setInterval(() => {
        setNarrationIdx(prev => Math.min(prev + 1, NARRATION_STEPS.length - 1));
      }, 1500);
    } else {
      setNarrationIdx(0);
    }
    return () => clearInterval(interval);
  }, [submitting, initialStatus]);

  const toggleTopic = (list: 'weakTopics' | 'strongTopics', topic: string) => {
    setForm(f => ({
      ...f,
      [list]: f[list].includes(topic) ? f[list].filter(t => t !== topic) : [...f[list], topic],
    }));
  };

  const togglePlatform = (platform: string) => {
    setForm(f => ({
      ...f,
      platformsUsed: f.platformsUsed.includes(platform) ? f.platformsUsed.filter(p => p !== platform) : [...f.platformsUsed, platform],
    }));
  };

  const saveProgress = async (nextStep: number) => {
    setSaving(true);
    try { await saveOnboardingProgress({ step: nextStep, data: form }); } catch {}
    setSaving(false);
    setStep(nextStep);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await initCareerProfile(form);
      onComplete(res.data);
    } catch (e) { 
      console.error(e); 
      setSubmitting(false);
    }
  };

  const steps = [
    {
      icon: <Target className="w-6 h-6 text-indigo-400" />,
      title: 'Your Target',
      content: (
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Role</label>
            <input value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}
              placeholder="e.g. Software Engineer, SDE-2, ML Engineer"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white outline-none focus:border-indigo-500/60 transition-all placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Company</label>
            <input value={form.targetCompany} onChange={e => setForm(f => ({ ...f, targetCompany: e.target.value }))}
              placeholder="e.g. Google, OpenAI, Stripe, Startup"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white outline-none focus:border-indigo-500/60 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>
      ),
    },
    {
      icon: <Rocket className="w-6 h-6 text-emerald-400" />,
      title: 'Behavioral Signals',
      content: (
        <div className="space-y-5 h-[280px] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Practice Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map(f => (
                <button key={f} onClick={() => setForm(s => ({ ...s, practiceFrequency: f }))}
                  className={cn('px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                    form.practiceFrequency === f ? 'bg-indigo-500/15 border-indigo-500/40 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/15')}
                >{f}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Platforms Used</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => togglePlatform(p)}
                  className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                    form.platformsUsed.includes(p) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20')}
                >{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Highest Difficulty Consistently Solved</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setForm(s => ({ ...s, highestDifficulty: d }))}
                  className={cn('px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                    form.highestDifficulty === d ? 'bg-indigo-500/15 border-indigo-500/40 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/15')}
                >{d}</button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <Code2 className="w-6 h-6 text-violet-400" />,
      title: 'Capability Sampling',
      content: (
        <div className="space-y-6 h-[280px] overflow-y-auto pr-2 custom-scrollbar">
          {CALIBRATION_QUESTIONS.map((q, idx) => (
            <div key={q.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-xs font-bold text-white mb-3">Q{idx + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map(opt => (
                  <button key={opt} onClick={() => setForm(f => ({ ...f, calibrationAnswers: { ...f.calibrationAnswers, [q.id]: opt } }))}
                    className={cn('w-full text-left px-4 py-2 rounded-lg text-[11px] border transition-all',
                      form.calibrationAnswers[q.id] === opt ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/15')}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Brain className="w-6 h-6 text-rose-400" />,
      title: 'Strengths & Gaps',
      content: (
        <div className="space-y-6 h-[280px] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-3">Strong Topics (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(t => (
                <button key={t} onClick={() => toggleTopic('strongTopics', t)}
                  className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                    form.strongTopics.includes(t) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/15')}
                >{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-3">Weak Topics (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(t => (
                <button key={t} onClick={() => toggleTopic('weakTopics', t)}
                  className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                    form.weakTopics.includes(t) ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/15')}
                >{t}</button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <Rocket className="w-6 h-6 text-amber-400" />,
      title: 'Choose Your Mentor',
      content: (
        <div className="space-y-3 h-[280px] overflow-y-auto pr-2 custom-scrollbar">
          {PERSONAS.map(p => (
            <button key={p.value} onClick={() => setForm(f => ({ ...f, persona: p.value }))}
              className={cn('w-full p-5 rounded-2xl border text-left transition-all',
                form.persona === p.value ? 'bg-indigo-500/15 border-indigo-500/40' : 'bg-white/5 border-white/5 hover:border-white/15')}
            >
              <p className="text-sm font-black text-white">{p.label}</p>
              <p className="text-[11px] text-slate-400 mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      ),
    },
  ];

  if (submitting || initialStatus === 'processing') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-[#030305] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-spin-slow">
            <Brain className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">Initializing Intelligence</h2>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden w-64 mx-auto mb-6">
              <motion.div className="h-full bg-indigo-500"
                initial={{ width: '0%' }}
                animate={{ width: `${((narrationIdx + 1) / NARRATION_STEPS.length) * 100}%` }}
                transition={{ duration: 1.5 }}
              />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse h-4">
              {NARRATION_STEPS[narrationIdx]}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <motion.div className="h-full bg-indigo-500" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="p-10">
          <div className="flex items-center gap-3 mb-8">
            {steps[step].icon}
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Step {step + 1} of {steps.length}</p>
              <h2 className="text-xl font-black text-white">{steps[step].title}</h2>
            </div>
          </div>
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {steps[step].content}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            <button onClick={() => saveProgress(Math.max(0, step - 1))}
              className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 disabled:opacity-40"
              disabled={step === 0}
            >Back</button>
            <div className="flex items-center gap-3">
              <button onClick={() => saveProgress(step)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
              >{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save</button>
              {step < steps.length - 1 ? (
                <button onClick={() => saveProgress(step + 1)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
                >Next <ChevronRight className="w-3 h-3" /></button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >{submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />} Launch Career OS</button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
