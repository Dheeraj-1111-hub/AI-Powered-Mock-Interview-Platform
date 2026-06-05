import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Timer, Send, Sparkles, Brain, CheckCircle, 
  ChevronRight, ArrowLeft, Loader2, MessageSquare,
  Zap, Trophy, AlertTriangle, PlayCircle, Mic, MicOff, Volume2, VolumeX,
  Briefcase, Code, Building, UserCircle, Target
} from 'lucide-react';
import { startInterview as apiStartInterview, submitAnswer as apiSubmitAnswer, endInterview } from '../services/api.service';
import { GlowingButton } from '../components/ui/GlowingButton';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { Navbar } from '../components/shared/Navbar';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../utils/cn';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
const MinimalInput = ({ label, value, onChange, icon: Icon, placeholder }: any) => (
  <div className="space-y-2 group relative z-20">
    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
       {label}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-slate-300 transition-colors z-10 pointer-events-none" />}
      <input 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "relative w-full bg-[#111111] border border-[#222222] hover:border-[#333333] rounded-lg py-2.5 pr-4 text-sm text-slate-200 outline-none transition-all duration-200 placeholder:text-slate-600",
          Icon ? "pl-11" : "pl-4",
          "focus:bg-[#151515] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
        )}
      />
    </div>
  </div>
);

interface Round {
  name: string;
  duration: string;
  questions: Array<{
    text: string;
    expectedKeywords: string[];
    difficulty: string;
  }>;
}

interface InterviewPlan {
  persona: {
    name: string;
    style: string;
    goals: string[];
  };
  rounds: Round[];
}

import { useNavigate } from 'react-router-dom';

const QuestionAccordion = ({ roundIdx, qIdx, q }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:bg-white/10">
       <button onClick={() => setIsOpen(!isOpen)} className="w-full p-6 flex items-center justify-between text-left">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black shrink-0">
                Q{qIdx + 1}
             </div>
             <div>
                <h4 className="text-sm font-bold text-white line-clamp-1">{q.text}</h4>
                <div className="flex gap-4 mt-2">
                   <span className="text-xs font-bold text-emerald-400">Accuracy: {q.evaluation?.accuracy || 0}%</span>
                   <span className="text-xs font-bold text-indigo-400">Depth: {q.evaluation?.depth || 0}%</span>
                   <span className="text-xs font-bold text-amber-400">Communication: {q.evaluation?.communication || 0}%</span>
                </div>
             </div>
          </div>
          <ChevronRight className={cn("w-5 h-5 text-slate-500 transition-transform shrink-0", isOpen && "rotate-90")} />
       </button>
       <AnimatePresence>
         {isOpen && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }} 
             animate={{ height: 'auto', opacity: 1 }} 
             exit={{ height: 0, opacity: 0 }}
             className="px-6 pb-6 pt-2 border-t border-white/5"
           >
              <div className="space-y-6 pt-4">
                 <div>
                    <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Your Answer</h5>
                    <p className="text-sm text-slate-300 italic leading-relaxed">"{q.answer}"</p>
                 </div>
                 {q.evaluation?.mistakes && q.evaluation.mistakes.length > 0 && (
                   <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                      <h5 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Detected Mistakes</h5>
                      <ul className="list-disc list-inside text-sm text-rose-300 space-y-1">
                        {q.evaluation.mistakes.map((m: string, i: number) => <li key={i}>{m}</li>)}
                      </ul>
                   </div>
                 )}
                 {q.evaluation?.idealAnswer && (
                   <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                      <h5 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Ideal Answer Pattern</h5>
                      <p className="text-sm text-emerald-200/80 leading-relaxed">{q.evaluation.idealAnswer}</p>
                   </div>
                 )}
              </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

export default function InterviewPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<'config' | 'active' | 'feedback'>('config');
  const [config, setConfig] = useState({
    role: 'Frontend Engineer',
    experience: 'Mid-Level',
    stack: 'React, TypeScript, Tailwind',
    companyType: 'FAANG',
    persona: 'Skeptical Senior Architect'
  });

  const [plan, setPlan] = useState<InterviewPlan | null>(null);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [chat, setChat] = useState<Array<{role: 'ai' | 'user', text: string, evaluation?: any}>>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(1800); // 30 mins
  
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [firstInteractionTime, setFirstInteractionTime] = useState<number | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;
    if (step === 'active' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Auto-TTS for AI messages
    if (chat.length > 0) {
      const lastMsg = chat[chat.length - 1];
      if (lastMsg.role === 'ai' && !isMuted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = lastMsg.text.replace(/\[.*?\]:\s*/, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [chat, step, isMuted]);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          if (!firstInteractionTime) setFirstInteractionTime(Date.now());
          setAnswer(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const response = await apiStartInterview(config);
      const interviewData = response.data;
      
      setInterviewId(interviewData._id);
      setPlan({ rounds: interviewData.rounds, persona: interviewData.persona });
      setStep('active');
      
      const firstQ = interviewData.rounds[0].questions[0].text;
      setChat([{ role: 'ai', text: `[${interviewData.persona.name}]: ${firstQ}` }]);
      setQuestionStartTime(Date.now());
      setFirstInteractionTime(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !plan || !interviewId) return;
    
    setLoading(true);
    
    const latencyMs = firstInteractionTime ? firstInteractionTime - questionStartTime : Date.now() - questionStartTime;
    const answerDurationMins = Math.max(0.1, (Date.now() - (firstInteractionTime || questionStartTime)) / 60000);
    const words = answer.trim().split(/\s+/);
    const wpm = Math.round(words.length / answerDurationMins);
    const fillerWords = words.filter(w => ['uh', 'um', 'like', 'actually', 'basically'].includes(w.toLowerCase())).length;

    try {
      const res = await apiSubmitAnswer({ 
        interviewId,
        roundIndex: currentRoundIdx,
        questionIndex: currentQuestionIdx,
        answer,
        latencyMs,
        voiceMetrics: { wpm, fillerWordCount: fillerWords }
      });
      
      const evaluation = res.data.evaluation;
      const updatedInterview = res.data.interview;
      
      // Update plan with any injected follow-up questions from the backend
      setPlan({ rounds: updatedInterview.rounds, persona: updatedInterview.persona });

      setChat(prev => [...prev, { role: 'user', text: answer, evaluation }]);
      setAnswer('');

      const currentRoundQuestions = updatedInterview.rounds[currentRoundIdx].questions;
      const nextQIdx = currentQuestionIdx + 1;

      if (nextQIdx < currentRoundQuestions.length) {
        setCurrentQuestionIdx(nextQIdx);
        const nextQ = currentRoundQuestions[nextQIdx].text;
        setTimeout(() => {
          setChat(prev => [...prev, { role: 'ai', text: nextQ }]);
          setLoading(false);
          setQuestionStartTime(Date.now());
          setFirstInteractionTime(null);
        }, 1000);
      } else {
        const nextRIdx = currentRoundIdx + 1;
        if (nextRIdx < updatedInterview.rounds.length) {
          setCurrentRoundIdx(nextRIdx);
          setCurrentQuestionIdx(0);
          const nextQ = updatedInterview.rounds[nextRIdx].questions[0].text;
          setTimeout(() => {
            setChat(prev => [...prev, { role: 'ai', text: `Moving to ${updatedInterview.rounds[nextRIdx].name}. ${nextQ}` }]);
            setLoading(false);
            setQuestionStartTime(Date.now());
            setFirstInteractionTime(null);
          }, 1000);
        } else {
          // Interview Complete
          try {
             const endRes = await endInterview({ interviewId });
             setReportData(endRes.data);
             if (endRes.data.xpEarned > 0) {
               toast.xpToast(endRes.data.xpEarned, "Interview Simulation Completed");
             }
          } catch(err) { console.error('Failed to end interview', err); }
          setStep('feedback');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      toast.toast("Submission Failed", "There was an error submitting your answer.", "error");
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col">
      <Navbar />
      
      {/* Subtle background noise/grid */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-screen" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-6 py-12 mt-16">
        
        <AnimatePresence mode="wait">
          {step === 'config' && (
            <motion.div 
              key="config"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto mt-12"
            >
              <div className="relative w-full max-w-2xl mx-auto">
                 {/* Subtle ambient colorful glow behind the card */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                 
                 <div className="relative bg-[#0a0a0a] border border-[#222222] rounded-2xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                    
                    <div className="flex flex-col items-center text-center mb-10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                         <Brain className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h1 className="text-2xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
                         Configure Simulation
                      </h1>
                      <p className="mt-2 text-slate-400 text-sm">
                         Define the parameters for your technical interview
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <MinimalInput icon={Briefcase} label="Target Role" value={config.role} onChange={(v: string) => setConfig({...config, role: v})} placeholder="e.g. Frontend Engineer" />
                          <MinimalInput icon={Trophy} label="Experience Level" value={config.experience} onChange={(v: string) => setConfig({...config, experience: v})} placeholder="e.g. Mid-Level" />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <MinimalInput icon={Code} label="Tech Stack" value={config.stack} onChange={(v: string) => setConfig({...config, stack: v})} placeholder="e.g. React, Node, AWS" />
                          <MinimalInput icon={Building} label="Company Type" value={config.companyType} onChange={(v: string) => setConfig({...config, companyType: v})} placeholder="e.g. FAANG" />
                       </div>

                       <MinimalInput icon={UserCircle} label="Interviewer Persona" value={config.persona} onChange={(v: string) => setConfig({...config, persona: v})} placeholder="e.g. Skeptical Senior Architect" />
                       
                       <div className="pt-6">
                          <button
                            onClick={startInterview}
                            disabled={loading}
                            className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {loading ? (
                               <>
                                  <Loader2 className="w-4 h-4 animate-spin" /> Starting...
                               </>
                            ) : (
                               <>
                                  Start Interview <ChevronRight className="w-4 h-4 opacity-70" />
                               </>
                            )}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {step === 'active' && plan && (() => {
            const totalQuestions = plan.rounds.reduce((acc, r) => acc + r.questions.length, 0);
            let globalQuestionIdx = 0;
            for (let i = 0; i < currentRoundIdx; i++) {
              globalQuestionIdx += plan.rounds[i].questions.length;
            }
            globalQuestionIdx += currentQuestionIdx;
            
            return (
              <motion.div 
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]"
              >
                {/* SIDEBAR: Status & Persona */}
                <div className="lg:col-span-4 space-y-6 flex flex-col">
                   <SpotlightCard className="p-6 border-indigo-500/20">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-3">
                            <Timer className="w-5 h-5 text-indigo-400" />
                            <span className="text-xl font-black font-mono text-white tracking-widest">{formatTime(timer)}</span>
                         </div>
                         <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">LIVE</div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>INTERVIEW PROGRESS</span>
                            <span>{globalQuestionIdx + 1} / {totalQuestions}</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-500" 
                              style={{ width: `${((globalQuestionIdx + 1) / totalQuestions) * 100}%` }} 
                            />
                         </div>
                         <div className="text-[10px] font-mono text-indigo-400 text-right uppercase tracking-widest mt-1">
                            Current: {plan.rounds[currentRoundIdx].name}
                         </div>
                      </div>
                   </SpotlightCard>

                   <SpotlightCard className="p-6 flex-1 bg-indigo-500/[0.02]">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <Bot className="w-6 h-6 text-indigo-400" />
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">{plan.persona.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{plan.persona.style}</p>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">LIVE ASSESSMENT GOALS</p>
                         {(() => {
                            const allSkills: {skill: string, idx: number}[] = [];
                            let qCount = 0;
                            plan.rounds.forEach(r => r.questions.forEach((q: any) => {
                               if (q.skill && !allSkills.find(s => s.skill === q.skill)) {
                                 allSkills.push({ skill: q.skill, idx: qCount });
                               }
                               qCount++;
                            }));
                            return allSkills.length > 0 ? allSkills.map((s, i) => {
                               const isAssessed = globalQuestionIdx > s.idx;
                               const isCurrent = globalQuestionIdx === s.idx;
                               return (
                                 <div key={i} className={cn("flex items-center gap-3 text-xs", isAssessed ? "text-emerald-400 font-bold" : isCurrent ? "text-amber-400 font-bold" : "text-slate-500")}>
                                    {isAssessed ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : isCurrent ? <Zap className="w-3 h-3 text-amber-400 animate-pulse" /> : <Brain className="w-3 h-3 text-slate-600" />}
                                    {s.skill} {isAssessed && "(Assessed)"} {isCurrent && "(In Progress)"}
                                 </div>
                               );
                            }) : plan.persona.goals.map((goal, i) => (
                               <div key={i} className="flex items-center gap-3 text-xs text-slate-400">
                                  <Zap className="w-3 h-3 text-indigo-500" />
                                  {goal}
                               </div>
                            ));
                         })()}
                      </div>
                   </SpotlightCard>
                </div>

                {/* MAIN: Chat & Input */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-0">
                   <SpotlightCard className="flex-1 p-8 overflow-hidden flex flex-col min-h-0">
                      <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                         {chat.map((msg, i) => (
                           <div key={i} className={cn("flex", msg.role === 'ai' ? "justify-start" : "justify-end")}>
                              <div className={cn(
                                "max-w-[85%] p-6 rounded-[32px] text-lg font-medium shadow-2xl",
                                msg.role === 'ai' 
                                  ? "bg-white/5 border border-white/5 text-slate-100 rounded-tl-none" 
                                  : "bg-indigo-600 text-white rounded-tr-none"
                              )}>
                                 {msg.text}
                                  {msg.evaluation && (
                                   <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-6">
                                      <div className="flex items-center gap-2">
                                         <Trophy className="w-4 h-4 text-emerald-400" />
                                         <span className="text-xs font-black uppercase tracking-widest text-emerald-400">ACC {msg.evaluation.accuracy}%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                         <Brain className="w-4 h-4 text-indigo-400" />
                                         <span className="text-xs font-black uppercase tracking-widest text-indigo-400">DEP {msg.evaluation.depth}%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                         <Sparkles className="w-4 h-4 text-amber-400" />
                                         <span className="text-xs font-black uppercase tracking-widest text-amber-400">COM {msg.evaluation.communication}%</span>
                                      </div>
                                   </div>
                                 )}
                              </div>
                           </div>
                         ))}
                         {loading && (
                           <div className="flex justify-start">
                              <div className="bg-white/5 p-6 rounded-[32px] rounded-tl-none flex items-center gap-3">
                                 <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                 <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">AI Evaluating...</span>
                              </div>
                           </div>
                         )}
                         <div ref={chatEndRef} />
                      </div>
                   </SpotlightCard>

                   <div className="relative group shrink-0">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      <SpotlightCard className="p-4 relative">
                         <textarea 
                            value={answer}
                            onChange={(e) => {
                               if (!firstInteractionTime) setFirstInteractionTime(Date.now());
                               setAnswer(e.target.value);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitAnswer())}
                            placeholder="Type or speak your answer... (Shift+Enter for new line)"
                            className="w-full bg-transparent border-none text-xl font-medium text-white placeholder:text-slate-600 focus:ring-0 resize-none min-h-[120px] p-4 custom-scrollbar"
                         />
                         <div className="flex justify-between p-2 items-center">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={toggleListen}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                  isListening 
                                    ? "bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/50" 
                                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent"
                                )}
                              >
                                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                {isListening ? "Listening..." : "Enable Voice"}
                              </button>
                              
                              <button
                                onClick={() => {
                                  setIsMuted(!isMuted);
                                  if (!isMuted) window.speechSynthesis.cancel();
                                }}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                  isMuted ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                )}
                              >
                                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                {isMuted ? "AI Muted" : "AI Voice On"}
                              </button>
                            </div>
                            <button 
                              onClick={submitAnswer}
                              disabled={loading || !answer.trim()}
                              className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all"
                            >
                               Submit Response <Send className="w-4 h-4" />
                            </button>
                         </div>
                      </SpotlightCard>
                   </div>
                </div>
              </motion.div>
            );
          })()}

          {step === 'feedback' && (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto py-12 space-y-8"
            >
              {reportData ? (
                <>
                  {/* Premium Split Hero Section */}
                  <SpotlightCard className="p-0 border-indigo-500/20 overflow-hidden">
                     <div className="grid md:grid-cols-12 min-h-[400px]">
                        {/* Left Column: Metrics & Verdict */}
                        <div className="md:col-span-5 bg-black/40 p-12 flex flex-col items-center justify-center border-r border-white/5 relative">
                           {/* Dynamic Top Accent */}
                           <div className={cn(
                             "absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-80",
                             (reportData.overallScore || 0) >= 80 ? "from-emerald-500 to-teal-400" :
                             (reportData.overallScore || 0) >= 50 ? "from-amber-500 to-orange-400" :
                             "from-rose-500 to-red-400"
                           )} />
                           
                           {/* SVG Animated Ring */}
                           <div className="relative w-56 h-56 mx-auto flex items-center justify-center mb-8">
                             <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                                <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                                <motion.circle 
                                  cx="112" cy="112" r="100" 
                                  stroke={
                                    (reportData.overallScore || 0) >= 80 ? "url(#score-emerald)" :
                                    (reportData.overallScore || 0) >= 50 ? "url(#score-amber)" :
                                    "url(#score-rose)"
                                  } 
                                  strokeWidth="12" fill="transparent" 
                                  strokeDasharray={2 * Math.PI * 100}
                                  initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
                                  animate={{ strokeDashoffset: (2 * Math.PI * 100) - ((reportData.overallScore || 0) / 100) * (2 * Math.PI * 100) }}
                                  transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                                  strokeLinecap="round"
                                />
                                <defs>
                                  <linearGradient id="score-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#10b981" />
                                  </linearGradient>
                                  <linearGradient id="score-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#fbbf24" />
                                    <stop offset="100%" stopColor="#f59e0b" />
                                  </linearGradient>
                                  <linearGradient id="score-rose" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#fb7185" />
                                    <stop offset="100%" stopColor="#e11d48" />
                                  </linearGradient>
                                </defs>
                             </svg>
                             <div className="absolute flex flex-col items-center justify-center">
                                 <motion.span 
                                 initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring" }}
                                 className={cn(
                                   "text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br",
                                   (reportData.overallScore || 0) >= 80 ? "from-emerald-400 to-teal-300" :
                                   (reportData.overallScore || 0) >= 50 ? "from-amber-400 to-orange-300" :
                                   "from-rose-400 to-red-300"
                                 )}
                               >
                                 {reportData.overallScore || 0}
                               </motion.span>
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Readiness Score</span>
                             </div>
                           </div>
                           
                           {/* Dynamic Verdict Pill */}
                           <motion.div 
                              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
                              className={cn(
                                "inline-flex items-center gap-3 px-6 py-2 rounded-full border shadow-2xl",
                                (reportData.report?.verdict || '').toUpperCase().includes('HIRE') && !(reportData.report?.verdict || '').toUpperCase().includes('NO') 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10" 
                                  : (reportData.report?.verdict || '').toUpperCase().includes('CONSIDER') || (reportData.report?.verdict || '').toUpperCase().includes('DEVELOPMENT')
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/10"
                                  : "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/10"
                              )}
                           >
                             <Sparkles className="w-4 h-4" />
                             <span className="text-sm font-black uppercase tracking-widest">Verdict: {reportData.report?.verdict || "Evaluated"}</span>
                           </motion.div>
                        </div>

                        {/* Right Column: Summary Report */}
                        <div className="md:col-span-7 p-12 flex flex-col justify-center relative bg-gradient-to-br from-indigo-500/[0.02] to-transparent">
                           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                              <div className="flex items-center gap-4 mb-6">
                                 <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                                    <Brain className="w-7 h-7 text-indigo-400" />
                                 </div>
                                 <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Executive Summary</h2>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Post-Interview Intelligence Report</p>
                                 </div>
                              </div>
                              
                              <div className="prose prose-invert max-w-none">
                                 <p className="text-slate-300 text-lg leading-relaxed font-medium border-l-2 border-indigo-500/30 pl-6 py-2">
                                    {reportData.report?.summary || "Your performance has been successfully calibrated and recorded into your profile. Review the detailed telemetry below for precise actionable feedback."}
                                 </p>
                              </div>
                           </motion.div>
                        </div>
                     </div>
                  </SpotlightCard>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                     {[
                        { label: 'Accuracy', score: reportData.feedbackScorecard?.accuracy || reportData.report?.accuracyScore || 0 },
                        { label: 'Depth', score: reportData.feedbackScorecard?.depth || reportData.report?.depthScore || 0 },
                        { label: 'Communication', score: reportData.feedbackScorecard?.communication || reportData.report?.communicationScore || 0 },
                        { label: 'Confidence', score: reportData.feedbackScorecard?.confidence || reportData.report?.confidenceScore || 0 },
                        { label: 'Practicality', score: reportData.feedbackScorecard?.practicality || reportData.report?.practicalityScore || 0 }
                     ].map(metric => (
                        <div key={metric.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-all">
                           <div className="text-4xl font-black text-indigo-400 mb-2">{metric.score}</div>
                           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{metric.label}</div>
                        </div>
                     ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                     {/* Strengths */}
                     <SpotlightCard className="p-8 border-emerald-500/20 bg-emerald-500/[0.02]">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <Trophy className="w-5 h-5 text-emerald-400" />
                           </div>
                           <h3 className="text-lg font-black text-white uppercase tracking-widest">Core Strengths</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {(reportData.report?.strengths || []).map((s: string, i: number) => (
                             <span key={i} className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">{s}</span>
                           ))}
                        </div>
                     </SpotlightCard>

                     {/* Recommendations */}
                     <SpotlightCard className="p-8 border-rose-500/20 bg-rose-500/[0.02]">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-rose-400" />
                           </div>
                           <h3 className="text-lg font-black text-white uppercase tracking-widest">Critical Growth Areas</h3>
                        </div>
                        <div className="space-y-4">
                           {(reportData.report?.recommendations || []).map((rec: string, i: number) => (
                             <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                <p className="text-sm text-slate-300 font-medium leading-relaxed">{rec}</p>
                              </div>
                           ))}
                        </div>
                     </SpotlightCard>
                  </div>

                  {/* Question Timeline */}
                  <div className="pt-8">
                     <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                        <Brain className="w-6 h-6 text-indigo-400" /> Session Telemetry
                     </h3>
                     <div className="space-y-4">
                        {reportData.rounds?.map((round: any, rIdx: number) => 
                          round.questions.filter((q: any) => q.status === 'answered').map((q: any, qIdx: number) => (
                            <QuestionAccordion key={`${rIdx}-${qIdx}`} roundIdx={rIdx} qIdx={qIdx} q={q} />
                          ))
                        )}
                     </div>
                  </div>

                  <div className="flex justify-center gap-6 pt-12 border-t border-white/10">
                     <GlowingButton onClick={() => navigate('/analytics')} className="px-10 py-4 text-lg">
                       Return to Dashboard
                     </GlowingButton>
                     <button 
                       onClick={() => setStep('config')}
                       className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                     >
                       Deploy New Mock
                     </button>
                  </div>
                </>
              ) : (
                <SpotlightCard className="p-20 text-center flex flex-col items-center border-indigo-500/20">
                   <div className="w-24 h-24 mb-8 relative">
                      <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin" />
                   </div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Compiling Intelligence</h3>
                   <p className="text-slate-400 text-lg">Analyzing your neural pathways and architectural decisions...</p>
                </SpotlightCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// InputGroup removed in favor of Shadcn Form/Input components
