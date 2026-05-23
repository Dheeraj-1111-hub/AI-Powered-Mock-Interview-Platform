import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Loader2, Cpu, TrendingUp, Users, Code2 } from 'lucide-react';
import { chatWithMentorV2 } from '../../services/api.service';
import { cn } from '../../utils/cn';

const PERSONAS = [
  { key: 'faang_engineer', label: 'FAANG',     icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'indigo' },
  { key: 'startup_cto',    label: 'CTO',       icon: <Cpu className="w-3.5 h-3.5" />,        color: 'violet' },
  { key: 'dsa_coach',      label: 'DSA',       icon: <Code2 className="w-3.5 h-3.5" />,      color: 'emerald' },
  { key: 'career_recruiter', label: 'Recruiter', icon: <Users className="w-3.5 h-3.5" />,    color: 'amber' },
];

const PERSONA_INTROS: Record<string, string> = {
  faang_engineer: "I'm your FAANG Staff Engineer mentor. I'll push you on complexity, optimization, and scalability. Ready to go deep on your technical gaps?",
  startup_cto: "Hey! Startup CTO here. Let's focus on shipping fast, building real things, and knowing which trade-offs matter. What are you working on?",
  dsa_coach: "Welcome. DSA Coach here. I don't give answers — I help you find patterns. What problem type are you struggling with?",
  career_recruiter: "Hi! I'm your Career Recruiter mentor. Let's make sure your resume, LinkedIn, and answers are getting you past the first filter. What stage are you at?",
};

interface Message { role: 'user' | 'mentor'; content: string; tips?: string[]; steps?: string[] }

interface Props {
  intelligenceContext: {
    overallReadiness: number;
    careerState: string;
    targetRole: string;
    targetCompany: string;
    weakTopics: string[];
    strongTopics: string[];
    streak: number;
    weeksToReadiness: number;
    performanceDelta: string;
  } | null;
}

export default function MentorSidebar({ intelligenceContext }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [persona, setPersona] = useState('faang_engineer');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'mentor', content: PERSONA_INTROS['faang_engineer'] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [messages, isOpen]);

  const switchPersona = (p: string) => {
    setPersona(p);
    setMessages([{ role: 'mentor', content: PERSONA_INTROS[p] }]);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await chatWithMentorV2({ message: msg, persona });
      const data = res.data?.mentorResponse ?? res.data;
      const reply = typeof data === 'string' ? data : (data?.reply ?? 'No response received.');
      setMessages(prev => [...prev, {
        role: 'mentor',
        content: reply,
        tips: data?.actionableTips ?? [],
        steps: data?.suggestedNextSteps ?? [],
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'mentor', content: 'Connection error. Please try again.' }]);
    }
    setLoading(false);
  };

  const active = PERSONAS.find(p => p.key === persona)!;
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500 text-white border-indigo-500',
    violet: 'bg-violet-500 text-white border-violet-500',
    emerald: 'bg-emerald-500 text-white border-emerald-500',
    amber: 'bg-amber-500 text-black border-amber-500',
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-indigo-600 border border-indigo-500/50 flex items-center justify-center text-white shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:scale-105 hover:bg-indigo-500 transition-all z-50 group"
      >
        <Brain className="w-7 h-7 group-hover:scale-110 transition-transform" />
        <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#030305] animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 right-8 w-[400px] h-[600px] max-h-[80vh] flex flex-col bg-slate-950/90 backdrop-blur-3xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl z-50"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Brain className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-widest">AI Mentor</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest">Memory Active</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500/20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              {/* Persona chips */}
              <div className="grid grid-cols-4 gap-1">
                {PERSONAS.map(p => (
                  <button key={p.key} onClick={() => switchPersona(p.key)}
                    className={cn('flex flex-col items-center gap-1 py-2 rounded-xl border text-[7px] font-black uppercase tracking-wider transition-all',
                      persona === p.key ? colorMap[p.color] : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/15'
                    )}
                  >
                    {p.icon}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Context snapshot (if available) */}
            {intelligenceContext && (
              <div className="px-4 py-3 bg-indigo-500/5 border-b border-indigo-500/10 shrink-0">
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest">
                  <span className="text-indigo-400">Readiness</span>
                  <span className="text-white font-black">{intelligenceContext.overallReadiness}%</span>
                </div>
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest mt-1">
                  <span className="text-slate-500">Target</span>
                  <span className="text-slate-300">{intelligenceContext.targetRole} @ {intelligenceContext.targetCompany}</span>
                </div>
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest mt-1">
                  <span className="text-rose-400">Weak</span>
                  <span className="text-slate-400 truncate max-w-[60%] text-right">{intelligenceContext.weakTopics.slice(0,2).join(', ')}</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={cn('flex flex-col max-w-[92%]', msg.role === 'user' ? 'ml-auto items-end' : 'items-start')}
                  >
                    <div className={cn('px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium shadow-lg',
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
                    )}>
                      {msg.content}
                    </div>
                    {msg.tips && msg.tips.length > 0 && (
                      <div className="mt-2 space-y-1 w-full">
                        {msg.tips.slice(0, 2).map((tip, j) => (
                          <div key={j} className="flex items-start gap-1.5 text-[9px] text-slate-400 px-1">
                            <span className="text-indigo-400 mt-0.5">→</span> {tip}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 p-3">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-slate-900/50 shrink-0 rounded-b-[32px]">
              <div className="relative">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-xs text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                  placeholder={`Ask ${active.label} mentor...`}
                />
                <button onClick={send} disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-400 transition-all disabled:opacity-40 shadow-lg shadow-indigo-500/20"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
