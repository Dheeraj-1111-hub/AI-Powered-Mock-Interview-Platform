import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, MessageSquare, Code2, 
  Brain, Send, ChevronRight, X, PhoneOff, Sparkles, Loader2,
  Monitor, Zap, Target, User, ShieldCheck, Trophy, ArrowRight, Play, Layout,
  Activity, ShieldAlert, CheckCircle, AlertCircle
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Editor from '@monaco-editor/react';

import { AuthContext } from '../services/auth.service';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { GlowingButton } from '../components/ui/GlowingButton';
import { Navbar } from '../components/shared/Navbar';
import { IntelligenceHub } from '../components/feedback/IntelligenceHub';
import { cn } from '../utils/cn';
import { startInterview, submitAnswer, endInterview, getFollowUpQuestion, getInterviewDetails, injectFollowUp } from '../services/api.service';

export default function RoomPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<'setup' | 'active' | 'feedback'>('setup');
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState<any>(null);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const [answer, setAnswer] = useState('');
  const [code, setCode] = useState('// Start coding here...');
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [timer, setTimer] = useState(0);
  
  // Real-time Intelligence State
  const [evaluation, setEvaluation] = useState<any>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<any[]>([]);

  // Socket State
  const socketRef = useRef<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Video State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVidOn, setIsVidOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (mode === 'active') {
      if (!stream) initMedia();
      initSocket();
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => {
        clearInterval(interval);
        stream?.getTracks().forEach(track => track.stop());
        socketRef.current?.disconnect();
      }
    }
  }, [mode]);

  // Session Restoration Logic
  const [hasSavedSession, setHasSavedSession] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hireiq_active_session');
    if (saved) {
        setHasSavedSession(true);
    }
  }, []);

  const handleResume = () => {
    const saved = localStorage.getItem('hireiq_active_session');
    if (saved) {
        const data = JSON.parse(saved);
        setInterview(data.interview);
        setCurrentRoundIdx(data.round);
        setCurrentQuestionIdx(data.question);
        setMode('active');
    }
  };

  useEffect(() => {
      if (mode === 'active' && interview) {
          localStorage.setItem('hireiq_active_session', JSON.stringify({
              interview,
              round: currentRoundIdx,
              question: currentQuestionIdx
          }));
      }
      if (mode === 'feedback') {
          localStorage.removeItem('hireiq_active_session');
      }
  }, [interview, currentRoundIdx, currentQuestionIdx, mode]);

  const initSocket = () => {
    const socketUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:4000';
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join-room', { 
        room: interview?._id, 
        user: user?.name,
        peerId: socket.id 
      });
    });

    socket.on('message', (msg: any) => {
      if (msg.user === 'AI Moderator') {
        setHints(prev => [msg.text, ...prev].slice(0, 3));
      }
    });

    socket.on('disconnect', () => setSocketConnected(false));
  };

  const initMedia = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Media access denied", err);
    }
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setExecutionResult(null);
    try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE}/codes/run`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('hireiq_token')}`
            },
            body: JSON.stringify({
                code,
                language: 'javascript' // Default for now
            })
        });
        const data = await response.json();
        setExecutionResult(data);
    } catch (error) {
        console.error('Run code error:', error);
    } finally {
        setIsRunning(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await startInterview({
        role: user?.role || 'Frontend Engineer',
        experience: user?.experience || 'Mid Level',
        stack: user?.skills?.join(', ') || 'React, Node.js',
        companyType: 'Product Based',
        persona: 'Skeptical Senior Architect'
      });
      localStorage.removeItem('hireiq_active_session');
      setInterview(res.data);
      setCurrentRoundIdx(0);
      setCurrentQuestionIdx(0);
      setAnswer('');
      setCode('// Start coding here...');
      setTranscript([]);
      setHints([]);
      setWarnings([]);
      setEvaluation(null);
      setMode('active');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const isTechnical = currentRound?.name?.toLowerCase().includes('technical');
    const submissionContent = isTechnical ? code : answer;

    if (!submissionContent?.trim() || submitting) return;
    
    setSubmitting(true);
    setEvaluating(true);
    try {
      const res = await submitAnswer({
        interviewId: interview._id,
        roundIndex: currentRoundIdx,
        questionIndex: currentQuestionIdx,
        answer: submissionContent
      });
      
      const updatedInterview = res.data.interview;
      setEvaluation(res.data.evaluation);
      setInterview(updatedInterview);
      setTranscript(prev => [...prev, {
        question: currentQuestion.text,
        answer: submissionContent,
        score: res.data.evaluation.score
      }]);
      setAnswer('');

      // TRIGGER AI MODERATION VIA SOCKET
      socketRef.current?.emit('ai-moderate', {
        room: updatedInterview._id,
        context: `User answered: ${submissionContent}. Evaluation: ${JSON.stringify(res.data.evaluation)}`
      });

      // CHECK FOR FOLLOW-UP REQUIREMENT (Limit to 1 follow-up per parent question)
      const isAlreadyFollowUp = currentQuestion.text.includes('Follow-up:');
      
      if (res.data.evaluation.score < 60 && !isAlreadyFollowUp) {
          try {
              const followUp = await getFollowUpQuestion({
                  role: updatedInterview.role,
                  roundName: updatedInterview.rounds[currentRoundIdx].name,
                  prevQuestion: updatedInterview.rounds[currentRoundIdx].questions[currentQuestionIdx].text,
                  prevAnswer: submissionContent, // Use actual content (code or text)
                  persona: updatedInterview.persona.name
              });
              
              if (followUp.data.text) {
                  // PERSIST INJECTION TO BACKEND with a prefix to track
                  const finalInterviewRes = await injectFollowUp({
                      interviewId: updatedInterview._id,
                      roundIndex: currentRoundIdx,
                      questionIndex: currentQuestionIdx,
                      questionText: `Follow-up: ${followUp.data.text}`
                  });
                  setInterview(finalInterviewRes.data);
              }
          } catch (followUpErr) {
              console.error("Follow-up injection failed", followUpErr);
          }
      }

      // Move to next question or round
      // Re-fetch current round length as it might have changed due to injection
      try {
          const latestInterview = await getInterviewDetails(updatedInterview._id);
          const currentRound = latestInterview.data?.rounds[currentRoundIdx];
          
          if (currentRound && currentQuestionIdx < currentRound.questions.length - 1) {
            setCurrentQuestionIdx(currentQuestionIdx + 1);
          } else if (latestInterview.data?.rounds && currentRoundIdx < latestInterview.data.rounds.length - 1) {
            setCurrentRoundIdx(currentRoundIdx + 1);
            setCurrentQuestionIdx(0);
          } else {
            handleEnd(updatedInterview._id);
          }
      } catch (err) {
          console.error("Navigation failed", err);
          handleEnd(); // Fallback to end
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
      setEvaluating(false);
    }
  };

  const handleEnd = async (interviewId?: string) => {
    setSubmitting(true);
    try {
      await endInterview({ interviewId: interviewId || interview._id });
      setMode('feedback');
      if (interviewId) {
          navigate(`/results/${interviewId}`);
      }
    } catch (err) {
      console.error(err);
      setMode('feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const currentRound = interview?.rounds[currentRoundIdx];
  const currentQuestion = currentRound?.questions[currentQuestionIdx];

  // Setup View
  if (mode === 'setup') {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 relative">
        <Navbar />
        <div className="fixed inset-0 bg-grid-white pointer-events-none opacity-20" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full">
           <SpotlightCard className="p-12 text-center">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
                <Brain className="w-12 h-12 text-indigo-400" />
              </div>
              <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">AI Interview Terminal</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-10 leading-loose">
                Prepare for a high-stakes simulation calibrated to <span className="text-indigo-400">{user?.role}</span> standards.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-10">
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Target Persona</p>
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">Skeptical Architect</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Difficulty</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Elite Simulation</p>
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                  <GlowingButton onClick={handleStart} className="w-full py-6 text-lg" disabled={loading}>
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-black uppercase tracking-[0.2em]">Initialize Elite Session</span>
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                    )}
                  </GlowingButton>

                  {hasSavedSession && (
                      <button 
                        onClick={handleResume}
                        className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:bg-white/10 transition-all"
                      >
                         Resume Active Session
                      </button>
                  )}
              </div>
           </SpotlightCard>
        </motion.div>
      </div>
    );
  }

  // Active View
  if (mode === 'active') {
    return (
      <div className="h-screen bg-[#050505] text-slate-100 flex flex-col overflow-hidden font-sans">
        {/* Cinematic Header */}
        <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl px-8 py-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Active Session: {interview?.persona.name}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-4">
               {interview?.rounds.map((r: any, i: number) => (
                 <div key={i} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all", i === currentRoundIdx ? "bg-indigo-500/10 border-indigo-500 text-white" : "border-white/5 text-slate-600")}>
                    <span className="text-[9px] font-black uppercase tracking-widest">{r.name}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase">Question</span>
                <span className="text-sm font-black text-white">{currentQuestionIdx + 1} / {currentRound?.questions.length}</span>
             </div>
             <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-sm font-black text-white tabular-nums">{formatTime(timer)}</span>
             </div>
             <button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">
                <PhoneOff className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
          
          {/* Left: Moderator Presence */}
          <div className="w-full xl:w-[400px] border-b xl:border-b-0 xl:border-r border-white/5 bg-black/40 flex flex-col p-6 gap-6 overflow-y-auto shrink-0">
             
             {/* AI Persona Card */}
             <SpotlightCard className="p-5 border-indigo-500/20 bg-indigo-500/[0.03]">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                      <User className="w-6 h-6 text-indigo-400" />
                   </div>
                   <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">{interview?.persona.name}</h3>
                      <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">{interview?.persona.style}</p>
                   </div>
                </div>
                <div className="space-y-2">
                   {interview?.persona.goals.map((goal: string, i: number) => (
                     <div key={i} className="flex items-start gap-2 text-[9px] text-slate-400 font-medium leading-relaxed">
                        <Target className="w-2.5 h-2.5 text-indigo-400 mt-0.5" />
                        {goal}
                     </div>
                   ))}
                </div>
             </SpotlightCard>

             {/* Live Feed */}
             <div className="relative aspect-video rounded-[24px] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl shadow-indigo-500/5 group shrink-0">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-40" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-xl rounded-xl text-[8px] font-black text-white uppercase tracking-[0.2em] border border-white/10">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                   CANDIDATE: {user?.name}
                </div>
                {/* Control Overlay */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                   <button onClick={() => setIsMicOn(!isMicOn)} className={cn("w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-xl border border-white/10 transition-all", isMicOn ? "bg-white/5 text-white" : "bg-rose-500 text-white")}>
                      {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                   </button>
                   <button onClick={() => setIsVidOn(!isVidOn)} className={cn("w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-xl border border-white/10 transition-all", isVidOn ? "bg-white/5 text-white" : "bg-rose-500 text-white")}>
                      {isVidOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                   </button>
                </div>
             </div>

             {/* Round Progress */}
             <div className="space-y-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Curriculum Mastery</p>
                {interview?.rounds.map((r: any, i: number) => (
                  <div key={i} className={cn("p-4 rounded-2xl border transition-all flex items-center justify-between", 
                    i === currentRoundIdx ? "bg-indigo-500/10 border-indigo-500/50" : "bg-white/5 border-white/5 opacity-50")}>
                    <div className="flex items-center gap-3">
                       <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black", 
                          i < currentRoundIdx ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white")}>
                          {i < currentRoundIdx ? <Trophy className="w-3 h-3" /> : i + 1}
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest">{r.name}</span>
                    </div>
                    {i === currentRoundIdx && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />}
                  </div>
                ))}
             </div>

             <div className="mt-auto p-5 rounded-[24px] bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                   <ShieldCheck className="w-4 h-4 text-emerald-400" />
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Environment Secure</span>
                </div>
                <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
                   AI-Moderation active. Question sequence calibrated to technical seniority. All responses analyzed for clarity and technical depth.
                </p>
             </div>
          </div>

          {/* Center: Interaction Workspace */}
          <div className="flex-1 flex flex-col bg-[#0b0b0b] relative overflow-hidden">
             <div className="absolute inset-0 bg-grid-white opacity-[0.02] pointer-events-none" />
             
             {/* Question Area */}
             <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                <div className="max-w-4xl mx-auto w-full p-12 space-y-12">
                   <AnimatePresence mode="wait">
                      <motion.div 
                        key={currentQuestion?.text}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-10"
                      >
                         <div className="space-y-4">
                            <div className="flex items-center gap-3">
                               <Sparkles className="w-5 h-5 text-indigo-400" />
                               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Moderator Query</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                               {currentQuestion?.text}
                            </h2>
                         </div>

                         {/* Editor / Text Selection */}
                         {currentRound?.name.toLowerCase().includes('technical') || currentRound?.name.toLowerCase().includes('code') ? (
                           <div className="space-y-4">
                              <div className="flex items-center justify-between px-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Integrated Development Environment</label>
                                 <div className="flex items-center gap-3">
                                    <button 
                                      onClick={handleRunCode}
                                      disabled={isRunning}
                                      className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                       {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                       Run Code
                                    </button>
                                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Auto-save Active</span>
                                 </div>
                              </div>
                              <div className="h-[400px] rounded-3xl overflow-hidden border border-white/5 bg-[#1e1e1e] relative group">
                                 <Editor
                                   height="100%"
                                   defaultLanguage="javascript"
                                   theme="vs-dark"
                                   value={code}
                                   onChange={(v) => setCode(v || '')}
                                   options={{
                                     fontSize: 14,
                                     minimap: { enabled: false },
                                     scrollBeyondLastLine: false,
                                     padding: { top: 20 }
                                   }}
                                 />
                                 
                                 {/* Execution Output Overlay */}
                                 {executionResult && (
                                    <div className="absolute bottom-0 left-0 right-0 max-h-40 bg-black/90 border-t border-white/10 p-4 font-mono text-[10px] overflow-y-auto z-20">
                                       <div className="flex items-center justify-between mb-2">
                                          <span className="text-slate-500 uppercase font-black">Execution Output</span>
                                          <button onClick={() => setExecutionResult(null)}><X className="w-3 h-3 text-slate-500" /></button>
                                       </div>
                                       {executionResult.stdout && <pre className="text-emerald-400">{executionResult.stdout}</pre>}
                                       {executionResult.stderr && <pre className="text-rose-400">{executionResult.stderr}</pre>}
                                       {executionResult.compile_output && <pre className="text-amber-400">{executionResult.compile_output}</pre>}
                                       <div className="mt-2 text-slate-500 text-[8px]">
                                          Status: {executionResult.status} • Time: {executionResult.time}s • Memory: {executionResult.memory}KB
                                       </div>
                                    </div>
                                 )}
                              </div>
                              <textarea 
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-sm text-slate-300 outline-none focus:border-indigo-500 transition-all min-h-[100px]"
                                placeholder="Explain your code or provide additional context..."
                              />
                           </div>
                         ) : (
                           <div className="space-y-6">
                              <div className="flex items-center justify-between px-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Input Response</label>
                              </div>
                              <textarea 
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                disabled={evaluating}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-[32px] p-8 text-lg text-slate-200 outline-none focus:border-indigo-500 transition-all min-h-[300px] shadow-2xl placeholder:text-slate-700 font-medium leading-relaxed"
                                placeholder="Type your response with technical depth..."
                              />
                           </div>
                         )}

                         <div className="flex justify-end pt-4">
                            <GlowingButton 
                              onClick={handleSubmit} 
                              disabled={(!answer.trim() && !code.trim()) || evaluating}
                              className="h-16 px-10"
                            >
                               {evaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                 <div className="flex items-center gap-3">
                                    <span className="font-black uppercase tracking-[0.2em]">Commit Response</span>
                                    <ChevronRight className="w-4 h-4" />
                                 </div>
                               )}
                            </GlowingButton>
                         </div>
                      </motion.div>
                   </AnimatePresence>
                </div>
             </div>
          </div>

          {/* Right: Intelligence Hub */}
          <IntelligenceHub 
            evaluation={evaluation}
            hints={hints}
            warnings={warnings}
            isAnalyzing={evaluating}
          />

        </div>
      </div>
    );
   // Feedback View
  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 flex flex-col items-center justify-start p-6 relative overflow-x-hidden">
       <Navbar />
       
       {/* Cinematic Background */}
       <div className="fixed inset-0 bg-grid-white pointer-events-none opacity-20" />
       <div className="fixed top-0 left-1/4 w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
       <div className="fixed bottom-0 right-1/4 w-[50%] h-[50%] bg-fuchsia-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

       <motion.div 
         initial={{ opacity: 0, y: 20 }} 
         animate={{ opacity: 1, y: 0 }} 
         className="max-w-6xl w-full relative z-10 pt-28 pb-20 space-y-8"
       >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
             <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                   <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                      <Trophy className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Mission Accomplished</span>
                   </div>
                   <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{interview?.role}</span>
                   </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                   Intelligence <span className="text-gradient">Report</span>
                </h1>
             </div>
             
             <div className="flex items-center justify-center gap-4">
                <GlowingButton onClick={() => navigate('/dashboard')} className="h-14 px-8">
                   Return to Hub
                </GlowingButton>
                <button 
                  onClick={() => navigate('/analytics')}
                  className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
                >
                   Analytics Sync <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
             {/* Left: Mastery Score & AI Summary */}
             <div className="xl:col-span-8 space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                   <SpotlightCard className="p-8 text-center flex flex-col justify-center bg-white/[0.02]">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Composite Score</p>
                      <div className="text-7xl font-black text-white mb-4 tracking-tighter">{interview?.overallScore || 0}</div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${interview?.overallScore}%` }} className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                      </div>
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Exceeds {Math.max(0, (interview?.overallScore || 0) - 10)}% of candidates</p>
                   </SpotlightCard>

                   <div className="md:col-span-2 space-y-6">
                      <SpotlightCard className="p-8 h-full bg-white/[0.02]">
                         <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Recruiter Executive Briefing</h3>
                         </div>
                         <p className="text-lg text-slate-300 leading-relaxed font-medium italic">
                            "{interview?.report?.summary || interview?.feedback || "Evaluation processing in progress. AI is finalizing your skill-matrix assessment..."}"
                         </p>
                         <div className="mt-8 flex flex-wrap gap-3">
                            {interview?.report?.strengths?.map((tag: string, i: number) => (
                              <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                 {tag}
                              </span>
                            ))}
                         </div>
                      </SpotlightCard>
                   </div>
                </div>

                {/* Question Timeline / Transcript */}
                <SpotlightCard className="p-8 bg-white/[0.02]">
                   <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                         <Activity className="w-5 h-5 text-emerald-400" />
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">Interaction Transcript</h3>
                      </div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                         {interview?.rounds.reduce((acc: number, r: any) => acc + (r.questions?.length || 0), 0)} TOTAL QUERIES
                      </div>
                   </div>
                   
                   <div className="space-y-6">
                      {interview?.rounds.flatMap((r: any) => r.questions).filter((q: any) => q.status === 'answered').map((q: any, i: number) => (
                         <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">QUERY {i + 1}</span>
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-white tracking-widest">{q.evaluation?.score}%</span>
                                  <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                     <div className="h-full bg-emerald-500" style={{ width: `${q.evaluation?.score}%` }} />
                                  </div>
                               </div>
                            </div>
                            <h4 className="text-md font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{q.text}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2 italic">"{q.answer}"</p>
                         </div>
                      ))}
                   </div>
                </SpotlightCard>
             </div>

             {/* Right: Recruiter Grade & Meta Metrics */}
             <div className="xl:col-span-4 space-y-8">
                <SpotlightCard className="p-8 bg-indigo-500/5 border-indigo-500/20 border-2">
                   <div className="text-center space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2">
                         <Brain className="w-4 h-4 text-indigo-400" />
                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Recruiter Verdict</span>
                      </div>
                      <div className="text-5xl font-black text-white tracking-tighter">
                         {interview?.report?.verdict || (interview?.overallScore >= 80 ? 'RECOMMENDED' : interview?.overallScore >= 60 ? 'CONSIDER' : 'DEVELOPMENT')}
                      </div>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                         Candidate demonstrates {interview?.overallScore >= 80 ? 'exceptional' : 'solid'} technical depth and system intuition suitable for {interview?.role} roles.
                      </p>
                   </div>
                </SpotlightCard>

                <SpotlightCard className="p-8 bg-white/[0.02] space-y-8">
                   <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Neural Gap Analysis
                   </h3>
                   
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Technical Strengths</p>
                         <div className="space-y-2">
                            {interview?.report?.strengths?.map((s, i) => (
                               <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-200 text-[10px] font-bold uppercase tracking-widest">
                                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                                  {s}
                               </div>
                            )) || (
                               <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-200 text-xs font-bold">
                                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                                  Excellent communication & clarity
                               </div>
                            )}
                         </div>
                      </div>
                      
                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Optimization Areas</p>
                         <div className="space-y-2">
                            {interview?.report?.weaknesses?.map((w, i) => (
                               <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-200 text-[10px] font-bold uppercase tracking-widest">
                                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                                  {w}
                               </div>
                            )) || (
                               <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-200 text-xs font-bold">
                                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                                  Technical precision in complex rounds
                               </div>
                            )}
                         </div>
                      </div>

                      <div className="pt-4">
                         <button 
                           onClick={() => navigate('/analytics')}
                           className="w-full py-4 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                         >
                            View Career Roadmap
                         </button>
                      </div>
                   </div>
                </SpotlightCard>
             </div>
          </div>
       </motion.div>
    </div>
  );
}
}