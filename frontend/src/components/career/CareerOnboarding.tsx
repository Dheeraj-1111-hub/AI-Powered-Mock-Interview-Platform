import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Target, Code, Brain, CaretRight, CircleNotch, FloppyDisk, Pulse, Fire, ShieldCheck } from '@phosphor-icons/react';
import { initCareerProfile, saveOnboardingProgress } from '../../services/api.service';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../utils';
import { Input } from '../ui/input';

const TOPICS = ['Arrays','Strings','Hashing','Two Pointers','Sliding Window','Binary Search','Linked Lists','Trees','Graphs','Dynamic Programming','Recursion','Heaps','System Design'];
const FREQUENCIES = ['Never', 'Occasionally', 'Weekly', 'Daily'];
const PLATFORMS = ['LeetCode', 'HackerRank', 'Codeforces', 'None'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const PERSONAS = [
  { value: 'faang_engineer', label: 'FAANG Engineer', desc: 'Strict optimization & scalability focus. Drives high-intensity roadmaps.' },
  { value: 'startup_cto', label: 'Startup CTO', desc: 'Shipping & execution focus. Action-oriented advice and lean problem solving.' },
  { value: 'dsa_coach', label: 'DSA Coach', desc: 'Patterns & algorithms focus. High-repetition, fundamentals-first dashboard.' },
  { value: 'career_recruiter', label: 'Career Recruiter', desc: 'ATS, communication, and behavioral interview focus.' },
];

const QUESTION_BANK = [
  { id: 'q_arr_1', cat: 'Arrays', q: 'What is the optimal time complexity to find the missing number in an array of size n containing numbers from 1 to n?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], a: 'O(n)' },
  { id: 'q_str_1', cat: 'Strings', q: 'Which algorithmic pattern is best suited for finding the longest substring with K unique characters?', options: ['Binary Search', 'Sliding Window', 'Depth First Search', 'Matrix Traversal'], a: 'Sliding Window' },
  { id: 'q_tree_1', cat: 'Trees', q: 'What is the time complexity of searching in a perfectly balanced Binary Search Tree?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], a: 'O(log n)' },
  { id: 'q_graph_1', cat: 'Graphs', q: 'Which graph traversal is typically used to find the shortest path in an unweighted graph?', options: ['DFS', 'BFS', 'Dijkstra', 'Topological Sort'], a: 'BFS' },
  { id: 'q_dp_1', cat: 'Dynamic Programming', q: 'In DP, what technique is used to store results of expensive function calls to avoid re-computation?', options: ['Backtracking', 'Memoization', 'Greedy', 'Divide & Conquer'], a: 'Memoization' },
  { id: 'q_sys_1', cat: 'System Design', q: 'Which of the following is commonly used to distribute traffic across multiple servers?', options: ['Message Queue', 'Load Balancer', 'API Gateway', 'CDN'], a: 'Load Balancer' },
  { id: 'q_oop_1', cat: 'OOP', q: 'Which OOP principle allows objects of different classes to be treated as objects of a common superclass?', options: ['Encapsulation', 'Polymorphism', 'Inheritance', 'Abstraction'], a: 'Polymorphism' },
];

const getRandomQuestions = (num: number) => {
  const shuffled = [...QUESTION_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

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
  // Safe initialization: if they somehow had step 4 or 5 but are 'pending', they were reset. Start at 0.
  const [step, setStep] = useState(() => (savedStep >= 4 ? 0 : Math.max(0, savedStep)));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(initialStatus === 'processing');
  const [narrationIdx, setNarrationIdx] = useState(0);
  const toast = useToast();
  
  // Random questions initialized once per session
  const [calibrationQuestions] = useState(() => getRandomQuestions(3));

  const [form, setForm] = useState({
    targetRole: initialData?.targetRole || '', 
    dreamCompany: initialData?.dreamCompany || '', 
    backupCompany: initialData?.backupCompany || '',
    timeline: initialData?.timeline || '',
    currentYear: initialData?.currentYear || 'junior',
    dailyHoursAvailable: initialData?.dailyHoursAvailable || 2,
    weakTopics: initialData?.weakTopics || ([] as string[]), 
    strongTopics: initialData?.strongTopics || ([] as string[]),
    persona: initialData?.persona || 'faang_engineer',
    practiceFrequency: initialData?.practiceFrequency || 'Weekly', 
    platformsUsed: initialData?.platformsUsed || ([] as string[]), 
    highestDifficulty: initialData?.highestDifficulty || 'Easy',
    calibrationAnswers: initialData?.calibrationAnswers || ({} as Record<string, string>),
    calibrationScore: 0
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
    // Calculate final score
    let score = 0;
    calibrationQuestions.forEach(q => {
      if (form.calibrationAnswers[q.id] === q.a) score++;
    });
    
    try {
      const res = await initCareerProfile({ ...form, calibrationScore: score });
      onComplete(res.data);
    } catch (e: any) { 
      console.error(e); 
      setSubmitting(false);
      toast.toast('Initialization Failed', e.response?.data?.message || 'Failed to generate roadmap from AI. Please try again.', 'error');
    }
  };

  // Compute derived behavioral signals
  const consistencyScore = form.practiceFrequency === 'Daily' ? 95 : form.practiceFrequency === 'Weekly' ? 70 : 30;
  const executionScore = form.platformsUsed.length >= 2 ? 85 : form.platformsUsed.length === 1 ? 60 : 20;
  const disciplineScore = form.highestDifficulty === 'Hard' ? 90 : form.highestDifficulty === 'Medium' ? 75 : 45;

  const steps = [
    {
      icon: <Target size={24} weight="fill" className="text-indigo-400" />,
      title: 'Your Target',
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Target Role</label>
            <Input value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}
              placeholder="e.g. Software Engineer, SDE-2"
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Dream Company</label>
              <Input value={form.dreamCompany} onChange={e => setForm(f => ({ ...f, dreamCompany: e.target.value }))}
                placeholder="e.g. Google"
                className="bg-[#111] border-white/10"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Backup Company</label>
              <Input value={form.backupCompany} onChange={e => setForm(f => ({ ...f, backupCompany: e.target.value }))}
                placeholder="e.g. Amazon"
                className="bg-[#111] border-white/10"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Timeline</label>
            <Input value={form.timeline} onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))}
              placeholder="e.g. 12 months"
              className="bg-[#111] border-white/10"
            />
          </div>
        </div>
      ),
    },
    {
      icon: <Pulse size={24} weight="fill" className="text-emerald-400" />,
      title: 'Behavioral Signals',
      content: (
        <div className="space-y-5 h-[320px] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">Practice Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map(f => (
                <button key={f} onClick={() => setForm(s => ({ ...s, practiceFrequency: f }))}
                  className={cn('px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                    form.practiceFrequency === f ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-[#111] border-white/5 text-slate-400 hover:border-white/20')}
                >{f}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">Platforms Used</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => togglePlatform(p)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    form.platformsUsed.includes(p) ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-[#111] border-white/5 text-slate-400 hover:border-white/20')}
                >{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">Highest Difficulty Consistently Solved</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setForm(s => ({ ...s, highestDifficulty: d }))}
                  className={cn('px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                    form.highestDifficulty === d ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-[#111] border-white/5 text-slate-400 hover:border-white/20')}
                >{d}</button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
             <div className="bg-[#111] p-3 rounded-lg border border-white/5 flex flex-col items-center">
                <Fire size={18} weight="fill" className="text-amber-400 mb-1" />
                <span className="text-lg font-semibold text-white">{consistencyScore}</span>
                <span className="text-[10px] text-slate-500 font-medium">Consistency</span>
             </div>
             <div className="bg-[#111] p-3 rounded-lg border border-white/5 flex flex-col items-center">
                <Rocket size={18} weight="fill" className="text-emerald-400 mb-1" />
                <span className="text-lg font-semibold text-white">{executionScore}</span>
                <span className="text-[10px] text-slate-500 font-medium">Execution</span>
             </div>
             <div className="bg-[#111] p-3 rounded-lg border border-white/5 flex flex-col items-center">
                <ShieldCheck size={18} weight="fill" className="text-indigo-400 mb-1" />
                <span className="text-lg font-semibold text-white">{disciplineScore}</span>
                <span className="text-[10px] text-slate-500 font-medium">Discipline</span>
             </div>
          </div>
        </div>
      ),
    },
    {
      icon: <Brain size={24} weight="fill" className="text-violet-400" />,
      title: 'Diagnostic Core',
      content: (
        <div className="space-y-6 h-[320px] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-xs text-slate-400 mb-2">Complete this simulated technical diagnostic to seed your Career Brain skill graph.</p>
          {calibrationQuestions.map((q, idx) => (
            <div key={q.id} className="bg-[#111] p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-start mb-3">
                 <p className="text-sm font-medium text-white flex-1 pr-4">Q{idx + 1}. {q.q}</p>
                 <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-semibold whitespace-nowrap">{q.cat}</span>
              </div>
              <div className="space-y-2">
                {q.options.map(opt => (
                  <button key={opt} onClick={() => setForm(f => ({ ...f, calibrationAnswers: { ...f.calibrationAnswers, [q.id]: opt } }))}
                    className={cn('w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                      form.calibrationAnswers[q.id] === opt ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' : 'bg-[#1a1a1a] border-white/5 text-slate-400 hover:border-white/20')}
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
      icon: <Target size={24} weight="fill" className="text-amber-400" />,
      title: 'Strategic Advisor',
      content: (
        <div className="space-y-3 h-[320px] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-xs text-slate-400 mb-4">Your mentor drives your roadmap intensity, dashboard content, and analytical insights.</p>
          {PERSONAS.map(p => (
            <button key={p.value} onClick={() => setForm(f => ({ ...f, persona: p.value }))}
              className={cn('w-full p-4 rounded-xl border text-left transition-colors',
                form.persona === p.value ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-[#111] border-white/5 hover:border-white/20')}
            >
              <p className="text-sm font-semibold text-white">{p.label}</p>
              <p className="text-xs text-slate-400 mt-1">{p.desc}</p>
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
          <div className="w-16 h-16 mx-auto rounded-xl bg-[#111] border border-white/10 flex items-center justify-center animate-pulse">
            <Brain size={32} weight="fill" className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Initializing Intelligence</h2>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden w-64 mx-auto mb-4">
              <motion.div className="h-full bg-indigo-500"
                initial={{ width: '0%' }}
                animate={{ width: `${((narrationIdx + 1) / NARRATION_STEPS.length) * 100}%` }}
                transition={{ duration: 1.5 }}
              />
            </div>
            <p className="text-xs font-medium text-slate-400 h-4">
              {NARRATION_STEPS[narrationIdx]}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1 bg-white/5">
          <motion.div className="h-full bg-indigo-500" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            {steps[step].icon}
            <div>
              <p className="text-[10px] font-semibold text-slate-500">Step {step + 1} of {steps.length}</p>
              <h2 className="text-lg font-semibold text-white">{steps[step].title}</h2>
            </div>
          </div>
          <div className="min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {steps[step].content}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            <button onClick={() => saveProgress(Math.max(0, step - 1))}
              className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-xs font-medium hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-40"
              disabled={step === 0}
            >Back</button>
            <div className="flex items-center gap-2">
              <button onClick={() => saveProgress(step)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111] text-slate-300 text-xs font-medium hover:bg-white/5 transition-colors border border-white/10"
              >{saving ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={14} />} Save</button>
              {step < steps.length - 1 ? (
                <button onClick={() => saveProgress(step + 1)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-slate-200 transition-colors"
                >Next <CaretRight size={14} weight="bold" /></button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >{submitting ? <CircleNotch size={14} className="animate-spin" /> : <Rocket size={14} weight="fill" />} Launch</button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
