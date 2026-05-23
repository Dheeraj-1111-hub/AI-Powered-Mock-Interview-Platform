import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Timer, Send, Sparkles, Brain, CheckCircle, 
  ChevronRight, ArrowLeft, Loader2, MessageSquare,
  Zap, Trophy, AlertTriangle, PlayCircle, Mic, MicOff
} from 'lucide-react';
import { startInterview as apiStartInterview, submitAnswer as apiSubmitAnswer, endInterview } from '../services/api.service';
import { GlowingButton } from '../components/ui/GlowingButton';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { Navbar } from '../components/shared/Navbar';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../utils/cn';

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
                   <span className="text-xs font-bold text-emerald-400">Score: {q.evaluation?.score || 0}%</span>
                   <span className="text-xs font-medium text-slate-400">Clarity: {q.evaluation?.clarity || 'N/A'}</span>
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
  
  const [isListening, setIsListening] = useState(false);
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
  }, [chat, step]);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !plan || !interviewId) return;
    
    setLoading(true);
    
    try {
      const res = await apiSubmitAnswer({ 
        interviewId,
        roundIndex: currentRoundIdx,
        questionIndex: currentQuestionIdx,
        answer 
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
    <div className="min-h-screen bg-[#030303] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <Navbar />
      <div className="fixed inset-0 bg-grid-white pointer-events-none opacity-40" />

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
        
        <AnimatePresence mode="wait">
          {step === 'config' && (
            <motion.div 
              key="config"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <SpotlightCard className="p-12">
                 <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 rounded-[24px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-indigo-400" />
                   </div>
                   <div>
                     <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Initiate AI Simulation</h1>
                     <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Advanced Interview Configuration</p>
                   </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <InputGroup label="Target Role" value={config.role} onChange={(v) => setConfig({...config, role: v})} />
                       <InputGroup label="Experience" value={config.experience} onChange={(v) => setConfig({...config, experience: v})} />
                       <InputGroup label="Interviewer Persona" value={config.persona} onChange={(v) => setConfig({...config, persona: v})} />
                    </div>
                    <div className="space-y-6">
                       <InputGroup label="Tech Stack" value={config.stack} onChange={(v) => setConfig({...config, stack: v})} />
                       <InputGroup label="Company Type" value={config.companyType} onChange={(v) => setConfig({...config, companyType: v})} />
                       
                       <div className="pt-6">
                          <GlowingButton onClick={startInterview} disabled={loading} className="w-full h-14">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Spawn AI Interrogator"}
                          </GlowingButton>
                       </div>
                    </div>
                 </div>
              </SpotlightCard>
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
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">INTERVIEWER GOALS</p>
                         {plan.persona.goals.map((goal, i) => (
                           <div key={i} className="flex items-center gap-3 text-xs text-slate-400">
                              <Zap className="w-3 h-3 text-indigo-500" />
                              {goal}
                           </div>
                         ))}
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
                                         <Trophy className="w-4 h-4 text-amber-400" />
                                         <span className="text-xs font-black uppercase tracking-widest">{msg.evaluation.score}%</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-white/60">
                                         <Sparkles className="w-3 h-3" />
                                         <span>{msg.evaluation.clarity} Clarity</span>
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
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitAnswer())}
                            placeholder="Type or speak your answer... (Shift+Enter for new line)"
                            className="w-full bg-transparent border-none text-xl font-medium text-white placeholder:text-slate-600 focus:ring-0 resize-none min-h-[120px] p-4 custom-scrollbar"
                         />
                         <div className="flex justify-between p-2 items-center">
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
                  {/* Hero Section */}
                  <SpotlightCard className="p-12 border-indigo-500/30 text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 bg-[length:200%_auto] animate-gradient" />
                     
                     {/* SVG Animated Ring */}
                     <div className="relative w-64 h-64 mx-auto flex items-center justify-center mb-8">
                       <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                          <circle cx="128" cy="128" r="116" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                          <motion.circle 
                            cx="128" cy="128" r="116" stroke="url(#score-gradient)" strokeWidth="16" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 116}
                            initial={{ strokeDashoffset: 2 * Math.PI * 116 }}
                            animate={{ strokeDashoffset: (2 * Math.PI * 116) - ((reportData.overallScore || 0) / 100) * (2 * Math.PI * 116) }}
                            transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#818cf8" />
                              <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                          </defs>
                       </svg>
                       <div className="absolute flex flex-col items-center justify-center">
                         <motion.span 
                           initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring" }}
                           className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-emerald-400"
                         >
                           {reportData.overallScore || 0}
                         </motion.span>
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Overall Score</span>
                       </div>
                     </div>
                     
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
                       <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                         <Sparkles className="w-5 h-5 text-indigo-400" />
                         <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">Verdict: {reportData.report?.verdict || "Evaluated"}</span>
                       </div>
                       <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tight">Executive Summary</h2>
                       <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                          {reportData.report?.summary || "Your performance has been successfully calibrated and recorded into your profile."}
                       </p>
                     </motion.div>
                  </SpotlightCard>

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

      </main>
    </div>
  );
}

const InputGroup = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">{label}</label>
    <input 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
    />
  </div>
);
