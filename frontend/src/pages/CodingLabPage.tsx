import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, Play, Send, Brain, ChevronRight, Terminal, 
  Settings, CheckCircle, AlertCircle, Info, Loader2,
  Maximize2, RefreshCcw, Sparkles, Layout, X, FolderOpen,
  Lock, Unlock, Clock, MessageSquare, BookOpen, History, UserCheck, Columns
} from 'lucide-react';
import { 
  fetchProblems, 
  fetchProblemRecommendations,
  runCodeExecution, 
  submitCodeChallenge, 
  fetchMySubmissions,
  startCodingInterview,
  chatCodingInterview,
  finishCodingInterview,
  monitorCodingInterview,
  fetchSubmissionAuditStatus,
  addProblemDiscussion
} from '../services/api.service';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { GlowingButton } from '../components/ui/GlowingButton';
import { Navbar } from '../components/shared/Navbar';
import { cn } from '../utils/cn';
import { useToast } from '../contexts/ToastContext';

export default function CodingLabPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const preselectedProblemId = searchParams.get('problem');
  const [problems, setProblems] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [code, setCode] = useState('// Select a problem to begin...');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'editorial' | 'output' | 'submissions' | 'discussion'>('problem');
  const [review, setReview] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [customInput, setCustomInput] = useState('');
  const [executionPhase, setExecutionPhase] = useState<'compiling' | 'testing' | 'judging'>('compiling');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2700);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [leftWidth, setLeftWidth] = useState(480);
  const [activeRightDrawer, setActiveRightDrawer] = useState<'hint' | 'audit' | 'chat' | 'scorecard' | null>(null);
  const [interviewMode, setInterviewMode] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [interviewLimitSelected, setInterviewLimitSelected] = useState(2700);

  // Telemetry States
  const [openedAt, setOpenedAt] = useState<number>(Date.now());
  const [firstKeystrokeAt, setFirstKeystrokeAt] = useState<number | null>(null);
  const [compileAttempts, setCompileAttempts] = useState(0);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [editorialViewed, setEditorialViewed] = useState(false);

  const [interviewSession, setInterviewSession] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'supportive' | 'interrogative' | 'silent' | 'demanding'>('interrogative');

  const [newDiscussion, setNewDiscussion] = useState('');
  const [postingDiscussion, setPostingDiscussion] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      alert("Mock Interview Simulation Time Expired! Please submit your code.");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(new Set());

  // Load submissions and track solved problems whenever problem or output updates
  useEffect(() => {
    fetchMySubmissions()
      .then((res: any) => {
        if (selectedProblem) {
          const filtered = res.data.filter((sub: any) => sub.problem?._id === selectedProblem._id);
          setSubmissions(filtered);
        }
        const solved = new Set<string>();
        res.data.forEach((sub: any) => {
          if (sub.status === 'Accepted' && sub.problem?._id) {
            solved.add(sub.problem._id);
          }
        });
        setSolvedProblemIds(solved);
      })
      .catch((err) => console.error("Failed to load submissions:", err));
  }, [selectedProblem, output]);

  // Proactive AI Monitor for Interview Mode
  useEffect(() => {
    let interval: any = null;
    if (interviewMode && interviewSession) {
      interval = setInterval(async () => {
        try {
          const res = await monitorCodingInterview({
            sessionId: interviewSession._id,
            currentCode: code,
            language
          });
          if (res.data.interrupt && res.data.session) {
            setInterviewSession(res.data.session);
            setActiveRightDrawer('chat');
            toast.toast('AI Interviewer Interruption', 'The interviewer has something to say.', 'info');
          }
        } catch (err) {
          console.error("Failed to monitor interview:", err);
        }
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [interviewMode, interviewSession, code, language]);



  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;
    const doDrag = (moveEvent: MouseEvent) => {
      setLeftWidth(Math.max(350, Math.min(800, startWidth + (moveEvent.clientX - startX))));
    };
    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // PHASE 8: AUTOSAVE SYSTEM
  useEffect(() => {
    if (selectedProblem) {
       const saved = localStorage.getItem(`code_${selectedProblem._id}_${language}`);
       if (saved) {
           setCode(saved);
       } else {
           setCode(selectedProblem.starterCode?.[language] || '');
       }
    }
  }, [selectedProblem, language]);

  useEffect(() => {
    if (selectedProblem && code !== '// Select a problem to begin...') {
       localStorage.setItem(`code_${selectedProblem._id}_${language}`, code);
    }
  }, [code]);

  const [loadingProblems, setLoadingProblems] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProblems(true);
        const [problemsRes, historyRes, recsRes] = await Promise.all([
          fetchProblems(),
          fetchMySubmissions(),
          fetchProblemRecommendations().catch(() => ({ data: { recommendations: [] } }))
        ]);
        
        setProblems(problemsRes.data);
        setHistory(historyRes.data);
        if (recsRes.data.success) {
          setRecommendations(recsRes.data.recommendations);
        }
        
        // Auto-select problem from ?problem=<id> URL param (from Today's Executive Focus)
        if (preselectedProblemId) {
          const targeted = problemsRes.data.find((p: any) => p._id === preselectedProblemId);
          if (targeted) {
            setSelectedProblem(targeted);
            setCode(targeted.starterCode[language] || '');
          } else if (problemsRes.data.length > 0) {
            const first = problemsRes.data[0];
            setSelectedProblem(first);
            setCode(first.starterCode[language] || '');
          }
        } else if (problemsRes.data.length > 0) {
            const first = problemsRes.data[0];
            setSelectedProblem(first);
            setCode(first.starterCode[language] || '');
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to initialize Coding Engine. Verify API connection.");
      } finally {
        setLoadingProblems(false);
      }
    };
    loadData();
  }, []);

  const handleSelectProblem = (problem: any) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode[language] || '');
    setActiveTab('problem');
    setOutput(null);
    setReview(null);
    setIsDrawerOpen(false);
    
    // Reset Telemetry
    setOpenedAt(Date.now());
    setFirstKeystrokeAt(null);
    setCompileAttempts(0);
    setHintsRevealed(0);
    setEditorialViewed(false);
  };

  const handleRun = async () => {
    setCompileAttempts(prev => prev + 1);
    setLoading(true);
    setActiveTab('output');
    setExecutionPhase('compiling');
    setTimeout(() => setExecutionPhase('testing'), 800);
    try {
      const inputToRun = customInput || (selectedProblem?.testCases?.[0]?.input) || '';
      const res = await runCodeExecution({ code, language, input: inputToRun });
      setOutput(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setActiveTab('output');
    setExecutionPhase('compiling');
    setTimeout(() => setExecutionPhase('testing'), 800);
    setTimeout(() => setExecutionPhase('judging'), 1600);
    try {
      const timeToFirstCode = firstKeystrokeAt ? Math.round((firstKeystrokeAt - openedAt) / 1000) : 0;
      const totalTime = Math.round((Date.now() - openedAt) / 1000);
      const totalThinkingTime = totalTime - timeToFirstCode;

      const telemetry = {
        timeToFirstCode,
        totalThinkingTime,
        totalTime,
        compileAttempts,
        hintsUsed: hintsRevealed,
        editorialViewed
      };

      const res = await submitCodeChallenge({ problemId: selectedProblem._id, code, language, telemetry });
      const subData = res.data;
      setOutput({
        status: subData.status,
        results: subData.results,
        time: subData.runtime || 0,
        memory: subData.memory || 0,
        telemetry: subData.telemetry
      });

      // Show AI Audit loading state
      setReview(null);
      setActiveRightDrawer('audit');

      // Poll background AI Audit
      if (subData._id) {
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const pollRes = await fetchSubmissionAuditStatus(subData._id);
            if (pollRes.data.aiReviewReady) {
              setReview(pollRes.data.aiReview);
              clearInterval(pollInterval);
            }
          } catch (pollErr) {
            console.error("Error polling audit:", pollErr);
          }
          if (attempts > 15) {
            clearInterval(pollInterval); // timeout after 30s
          }
        }, 2000);
      }

      // Refresh submissions tab dynamically
      if (selectedProblem) {
        const subRes = await fetchMySubmissions();
        const filtered = subRes.data.filter((sub: any) => sub.problem?._id === selectedProblem._id);
        setSubmissions(filtered);
      }

      if (subData.xpEarned > 0) {
        toast.xpToast(subData.xpEarned, `Successfully executed ${selectedProblem?.title}`);
      }

    } catch (err) {
      console.error(err);
      toast.toast('Execution Failed', 'There was an error running your code.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartInterview = async () => {
    if (!selectedProblem) return;
    try {
      setChatLoading(true);
      const res = await startCodingInterview({ 
        problemId: selectedProblem._id, 
        tone: selectedTone 
      });
      setInterviewSession(res.data);
      setInterviewMode(true);
      setTimeLeft(interviewLimitSelected);
      setIsTimerRunning(true);
      setShowInterviewModal(false);
      setActiveRightDrawer('chat');
    } catch (err) {
      console.error("Failed to start AI interview:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !interviewSession) return;
    try {
      setChatLoading(true);
      const userMsg = chatMessage;
      setChatMessage('');
      
      // Optimistic update for candidate message bubble
      setInterviewSession((prev: any) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { role: 'candidate', content: userMsg, timestamp: new Date() }
        ]
      }));

      const res = await chatCodingInterview({
        sessionId: interviewSession._id,
        message: userMsg,
        currentCode: code,
        language
      });
      
      setInterviewSession(res.data);
    } catch (err) {
      console.error("Failed to send chat message:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!interviewSession) return;
    try {
      setChatLoading(true);
      const res = await finishCodingInterview({
        sessionId: interviewSession._id,
        currentCode: code,
        language
      });
      setInterviewSession(res.data);
      setIsTimerRunning(false);
      setInterviewMode(false);
      setActiveRightDrawer('scorecard');
    } catch (err) {
      console.error("Failed to finish interview:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handlePostDiscussion = async () => {
    if (!newDiscussion.trim() || !selectedProblem) return;
    try {
      setPostingDiscussion(true);
      const res = await addProblemDiscussion(selectedProblem._id, newDiscussion);
      setSelectedProblem({
        ...selectedProblem,
        discussions: res.data
      });
      setNewDiscussion('');
      toast.toast('Discussion Posted', 'Your insight has been shared with the community.', 'success');
    } catch (err) {
      console.error("Failed to post discussion:", err);
      toast.toast('Error', 'Failed to post discussion.', 'error');
    } finally {
      setPostingDiscussion(false);
    }
  };

  return (
    <div className="h-screen bg-[#050505] text-slate-100 flex flex-col overflow-hidden selection:bg-indigo-500/30 font-sans">
      <Navbar />
      
      {/* Slide-out Drawer for Problem Selection */}
      <AnimatePresence>
         {isDrawerOpen && (
            <>
               {/* Backdrop */}
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDrawerOpen(false)}
                  className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
               />
               {/* Drawer Content */}
               <motion.div 
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                  className="fixed left-0 top-0 bottom-0 w-[480px] bg-[#050506]/90 backdrop-blur-3xl border-r border-white/10 z-[101] flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
               >
                  {/* Ambient Glows */}
                  <div className="absolute top-0 left-0 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/4" />
                  <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 translate-x-1/4" />

                  <div className="relative p-8 pb-4 z-10 flex flex-col h-full">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                              <FolderOpen className="w-5 h-5 text-indigo-400" />
                           </div>
                           <div>
                              <h2 className="text-sm font-black text-white uppercase tracking-widest leading-tight">Challenge Library</h2>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{problems.length} Dynamic FAANG challenges seeded</p>
                              </div>
                           </div>
                        </div>
                        <button 
                           onClick={() => setIsDrawerOpen(false)}
                           className="p-2.5 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5 hover:border-white/10"
                        >
                           <X className="w-4 h-4" />
                        </button>
                     </div>
                     
                     {/* Search and Filter */}
                     <div className="space-y-4 mb-8 relative z-10">
                        <div className="relative group">
                           <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
                           <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 z-10" />
                           <input 
                              type="text" 
                              placeholder="SEARCH TOPIC OR COMPANY..." 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="relative w-full bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner"
                           />
                        </div>
                        <div className="flex gap-2">
                           {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
                              <button 
                                 key={d}
                                 onClick={() => setFilterDifficulty(d as any)}
                                 className={cn(
                                    "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                                    filterDifficulty === d 
                                       ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-[0_4px_20px_rgba(99,102,241,0.4)]" 
                                       : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10 hover:bg-white/10 hover:text-white"
                                 )}
                              >
                                 {d}
                              </button>
                           ))}
                        </div>
                     </div>
                     
                     {/* Problem List Area */}
                     <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-4 custom-scrollbar relative z-10">
                        {/* Recommendations */}
                        {searchTerm === '' && filterDifficulty === 'All' && recommendations.length > 0 && (
                           <div className="mb-8 space-y-3">
                              <div className="flex items-center gap-2 mb-4 px-1">
                                 <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                                 <h3 className="text-[11px] font-black text-amber-400 uppercase tracking-widest shadow-amber-400/20 drop-shadow-md">AI Recommended For You</h3>
                              </div>
                              {recommendations.map((p) => {
                                 const isSolved = solvedProblemIds.has(p._id);
                                 return (
                                    <button 
                                       key={`rec-${p._id}`} 
                                       onClick={() => handleSelectProblem(p)}
                                       className={cn(
                                          "w-full p-5 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group relative overflow-hidden",
                                          selectedProblem?._id === p._id 
                                             ? "bg-amber-500/20 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]" 
                                             : "bg-gradient-to-br from-amber-500/10 via-[#0a0a0c]/80 to-[#0a0a0c]/90 border-amber-500/30 hover:border-amber-400/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                       )}
                                    >
                                       <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
                                       <div className="relative z-10 flex-1">
                                          <div className="flex items-center gap-2 mb-3">
                                             <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                                p.difficulty === 'Easy' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                p.difficulty === 'Medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                             )}>
                                                {p.difficulty}
                                             </span>
                                             <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[8px] font-black uppercase tracking-wider">{p.category}</span>
                                          </div>
                                          <div className="flex items-center gap-3 mb-1.5">
                                             <h3 className={cn("text-base font-black tracking-tight transition-colors", selectedProblem?._id === p._id ? "text-white" : "text-white group-hover:text-amber-400")}>{p.title}</h3>
                                             {isSolved && <CheckCircle className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                          </div>
                                          <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest flex items-center gap-1.5">
                                             <Brain className="w-3 h-3" /> {p.recommendationReasons?.[0] || 'High Priority Mastery Target'}
                                          </p>
                                       </div>
                                       <ChevronRight className={cn("w-5 h-5 transition-all z-10", selectedProblem?._id === p._id ? "text-amber-400 translate-x-1" : "text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1")} />
                                    </button>
                                 );
                              })}
                           </div>
                        )}

                        {/* Regular Problem List */}
                        {loadingProblems ? (
                           Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
                           ))
                        ) : problems
                           .filter(p => (filterDifficulty === 'All' || p.difficulty === filterDifficulty) && p.title.toLowerCase().includes(searchTerm.toLowerCase()))
                           .map((p) => {
                              const isSolved = solvedProblemIds.has(p._id);
                              const rate = p.acceptanceRate !== undefined ? p.acceptanceRate : 0;
                              return (
                                 <button 
                                    key={p._id} 
                                    onClick={() => handleSelectProblem(p)}
                                    className={cn(
                                       "w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group relative overflow-hidden backdrop-blur-sm",
                                       selectedProblem?._id === p._id 
                                          ? "bg-indigo-500/15 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]" 
                                          : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20 hover:-translate-y-0.5"
                                    )}
                                 >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/0 group-hover:bg-indigo-500/50 transition-colors duration-300" />
                                    <div className="space-y-2 pl-2 flex-1">
                                       <div className="flex items-center gap-2 mb-1">
                                          <span className={cn(
                                             "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border",
                                             p.difficulty === 'Easy' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                                             p.difficulty === 'Medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                                             "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                          )}>{p.difficulty}</span>
                                          {isSolved && (
                                             <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                <CheckCircle className="w-2.5 h-2.5" /> Solved
                                             </span>
                                          )}
                                       </div>
                                       <h3 className="text-[13px] font-black text-white group-hover:text-indigo-300 transition-colors truncate tracking-wide">{p.title}</h3>
                                       
                                       <div className="flex items-center gap-2">
                                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{p.category}</span>
                                          <span className="w-1 h-1 rounded-full bg-white/10" />
                                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Acc: {rate}%</span>
                                          {p.companyTags && p.companyTags.length > 0 && (
                                             <>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="text-[9px] text-indigo-400/80 font-bold uppercase tracking-wider truncate max-w-[100px]">{p.companyTags[0]}</span>
                                             </>
                                          )}
                                       </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-300">
                                       <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300" />
                                    </div>
                                 </button>
                              );
                           })}
                     </div>
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>

      {/* Workspace Header */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl px-6 py-3 flex items-center justify-between z-50 mt-20">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Code2 className="w-5 h-5 text-indigo-400" />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                     <h1 className="text-sm font-black text-white uppercase tracking-widest">{selectedProblem?.title || 'Coding Lab'}</h1>
                     {selectedProblem && solvedProblemIds.has(selectedProblem._id) && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase flex items-center gap-1 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                           <CheckCircle className="w-2.5 h-2.5" /> Solved
                        </span>
                     )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedProblem?.category || 'Algorithms'}</p>
               </div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-indigo-400 outline-none"
            >
               <option value="javascript">JavaScript</option>
               <option value="python">Python 3</option>
               <option value="cpp">C++</option>
               <option value="java">Java</option>
            </select>
            <button 
               onClick={() => {
                  if (selectedProblem) setCode(selectedProblem.starterCode[language] || '');
               }}
               className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
               title="Reset to default code"
            >
               <RefreshCcw className="w-3.5 h-3.5" />
               Reset
            </button>
         </div>

         <div className="flex items-center gap-3">
            {interviewMode ? (
               <div className="flex items-center gap-2.5 px-4 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px] font-black uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                  ⏱️ {formatTime(timeLeft)}
               </div>
            ) : (
               <button 
                  onClick={() => setShowInterviewModal(true)}
                  className="flex items-center gap-2.5 px-4 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 border border-indigo-500/20 transition-all shadow-[0_0_15px_rgba(99,102,241,0.05)]"
               >
                  <Clock className="w-4 h-4" /> Start Interview
               </button>
            )}

            <button 
               onClick={() => setActiveRightDrawer('hint')} 
               className="flex items-center gap-2.5 px-4 h-11 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
            >
               <Sparkles className="w-4 h-4 text-indigo-400" /> Get Hint
            </button>

            {review && (
               <button 
                  onClick={() => setActiveRightDrawer('audit')} 
                  className="flex items-center gap-2.5 px-4 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 border border-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
               >
                  <Brain className="w-4 h-4 text-emerald-400 animate-pulse" /> AI Audit
               </button>
            )}

            <div className="h-6 w-px bg-white/10" />

            <button onClick={handleRun} disabled={loading || submitting} className="flex items-center gap-3 px-5 h-11 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run Code
            </button>
            <GlowingButton onClick={handleSubmit} disabled={loading || submitting || !selectedProblem} className="h-11 px-6">
               {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} <span className="text-[10px] ml-2">Submit Simulation</span>
            </GlowingButton>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* Left: Problem Selection & Description */}
         <div style={{ width: leftWidth }} className="border-r border-white/5 bg-[#050506]/75 flex flex-col overflow-hidden shrink-0">
            <div className="flex p-2 gap-1 border-b border-white/5 bg-slate-950/50 overflow-x-auto select-none custom-scrollbar shrink-0">
               <button onClick={() => setActiveTab('problem')} className={cn("px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shrink-0", activeTab === 'problem' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300")}><BookOpen className="w-3.5 h-3.5" /> Problem</button>
               <button onClick={() => setActiveTab('editorial')} className={cn("px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shrink-0", activeTab === 'editorial' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300")}><Columns className="w-3.5 h-3.5" /> Editorial</button>
               <button onClick={() => setActiveTab('output')} className={cn("px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shrink-0", activeTab === 'output' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300")}><Terminal className="w-3.5 h-3.5" /> Output</button>
               <button onClick={() => setActiveTab('submissions')} className={cn("px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shrink-0", activeTab === 'submissions' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300")}><History className="w-3.5 h-3.5" /> Submissions</button>
               <button onClick={() => setActiveTab('discussion')} className={cn("px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shrink-0", activeTab === 'discussion' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300")}><MessageSquare className="w-3.5 h-3.5" /> Discussion</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <AnimatePresence mode="wait">
                  {activeTab === 'problem' && (
                     <motion.div key="desc" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                        {/* Clean Problem List Button trigger */}
                        <button 
                           onClick={() => setIsDrawerOpen(true)}
                           className="w-full py-4 px-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-3 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.05)] group animate-pulse"
                        >
                           <FolderOpen className="w-4 h-4 group-hover:rotate-6 transition-transform" /> Browse Algorithmic Library ({problems.length} Challenges)
                        </button>

                        {selectedProblem ? (
                           <div className="space-y-8">
                              <div className="flex items-center gap-2">
                                 <span className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase border",
                                    selectedProblem.difficulty === 'Easy' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                    selectedProblem.difficulty === 'Medium' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                    "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                 )}>
                                    {selectedProblem.difficulty}
                                 </span>
                                 <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase text-slate-400">
                                    Acceptance Rate: {selectedProblem.acceptanceRate !== undefined ? `${selectedProblem.acceptanceRate}%` : "N/A"}
                                 </span>
                              </div>
                              <div className="space-y-4">
                                 <div className="flex items-center gap-3">
                                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{selectedProblem.title}</h2>
                                    {solvedProblemIds.has(selectedProblem._id) && (
                                       <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                          <CheckCircle className="w-4 h-4" /> Solved
                                       </span>
                                    )}
                                 </div>
                                 {selectedProblem.scenario && (
                                    <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2 mb-4">
                                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">⚡ Real-world Corporate Scenario</p>
                                       <p className="text-xs text-indigo-200/80 font-medium leading-relaxed italic">"{selectedProblem.scenario}"</p>
                                    </div>
                                 )}
                                 <p className="text-slate-400 leading-relaxed font-medium text-xs whitespace-pre-line">{selectedProblem.description}</p>
                              </div>
                              
                              {selectedProblem.constraints && selectedProblem.constraints.length > 0 && (
                                 <div className="space-y-4 py-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 px-5">
                                    <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Technical Constraints</h4>
                                    <ul className="space-y-2">
                                       {selectedProblem.constraints.map((c: string, i: number) => (
                                          <li key={i} className="text-[10px] text-indigo-200/60 font-mono leading-relaxed">• {c}</li>
                                       ))}
                                    </ul>
                                 </div>
                              )}

                              {selectedProblem.companyTags && selectedProblem.companyTags.length > 0 && (
                                 <div className="space-y-3">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Asked at</h4>
                                    <div className="flex flex-wrap gap-2">
                                       {selectedProblem.companyTags.map((c: string) => (
                                          <span key={c} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] text-slate-300 font-bold uppercase tracking-wider">{c}</span>
                                       ))}
                                    </div>
                                 </div>
                              )}

                              {selectedProblem.relatedProblems && selectedProblem.relatedProblems.length > 0 && (
                                 <div className="space-y-3">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progressive Sibling Challenges</h4>
                                    <div className="flex flex-wrap gap-2">
                                       {selectedProblem.relatedProblems.map((pName: string) => (
                                          <span key={pName} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] text-slate-300 font-bold uppercase tracking-wider">{pName}</span>
                                       ))}
                                    </div>
                                 </div>
                              )}

                              <div className="space-y-6 pt-6">
                                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Simulation Examples</h4>
                                 {selectedProblem.testCases.filter((t: any) => !t.hidden).map((t: any, i: number) => (
                                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                       <div>
                                          <p className="text-[9px] font-black text-slate-600 uppercase mb-2">Input</p>
                                          <code className="text-xs text-indigo-300 font-mono block bg-black/40 p-3 rounded-lg">{t.input}</code>
                                       </div>
                                       <div>
                                          <p className="text-[9px] font-black text-slate-600 uppercase mb-2">Expected Output</p>
                                          <code className="text-xs text-emerald-300 font-mono block bg-black/40 p-3 rounded-lg">{t.expectedOutput}</code>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ) : (
                           <div className="h-64 flex flex-col items-center justify-center opacity-30">
                              <Layout className="w-12 h-12 mb-4 animate-pulse" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Select Problem Data</p>
                           </div>
                        )}
                     </motion.div>
                  )}

                  {activeTab === 'editorial' && (
                     <motion.div key="editorial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                        <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                           <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> Optimal Complexity Target</h4>
                           <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                              <code className="text-sm font-mono text-white block">{selectedProblem?.optimalComplexity || "N/A"}</code>
                           </div>
                           {selectedProblem?.editorial && (
                              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                 {selectedProblem.editorial}
                              </p>
                           )}
                        </div>
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reference Solution ({language})</h4>
                           <pre className="p-5 rounded-2xl bg-white/5 border border-white/5 overflow-x-auto text-[10px] font-mono text-indigo-300 custom-scrollbar leading-relaxed">
                              <code>{selectedProblem?.solutionCode?.[language] || (language === 'javascript' ? "// Solution Code Not Available" : "# Solution Code Not Available")}
                              </code>
                           </pre>
                        </div>
                     </motion.div>
                  )}

                  {activeTab === 'submissions' && (
                     <motion.div key="submissions" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">My Submissions ({submissions.length})</h4>
                        {submissions.length === 0 ? (
                           <div className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center space-y-2">
                              <History className="w-6 h-6 text-slate-600 mx-auto animate-pulse" />
                              <p className="text-xs font-black text-slate-400 uppercase">No Submissions Found</p>
                              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-relaxed">Your successful compiler submissions will persist here.</p>
                           </div>
                        ) : (
                           submissions.map((sub, i) => (
                              <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group">
                                 <div>
                                    <div className="flex items-center gap-2.5">
                                       <span className={cn(
                                          "text-[10px] font-black uppercase tracking-widest",
                                          sub.status === 'Accepted' ? "text-emerald-400" : "text-rose-400"
                                       )}>{sub.status}</span>
                                       <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[7px] text-slate-500 font-black uppercase tracking-wider">{sub.language}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">{new Date(sub.createdAt).toLocaleString()}</p>
                                 </div>
                                 <div className="text-right">
                                    <span className="text-xs font-mono text-slate-400 font-bold">{sub.runtime !== undefined && sub.runtime !== null ? `${(sub.runtime * 1000).toFixed(0)}ms` : "N/A"}</span>
                                 </div>
                              </div>
                           ))
                        )}
                     </motion.div>
                  )}

                  {activeTab === 'discussion' && (
                     <motion.div key="discussion" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Community Discussion</h4>
                           <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest">Active</span>
                        </div>

                        <div className="flex flex-col gap-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                           <textarea 
                              value={newDiscussion}
                              onChange={(e) => setNewDiscussion(e.target.value)}
                              placeholder="Share your approach, constraints observed, or ask a question..."
                              className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-all resize-none h-24 custom-scrollbar"
                           />
                           <div className="flex justify-end">
                              <GlowingButton onClick={handlePostDiscussion} disabled={postingDiscussion || !newDiscussion.trim()} className="h-9 px-5 text-[9px]">
                                 {postingDiscussion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />} Post Insight
                              </GlowingButton>
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                           {selectedProblem?.discussions && selectedProblem.discussions.length > 0 ? (
                              selectedProblem.discussions.map((item: any, i: number) => (
                                 <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                       <span className="text-[9px] font-black text-indigo-300 uppercase">{item.author}</span>
                                       <span className="text-[8px] text-slate-600 font-bold uppercase">{item.timeAgo}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{item.content}</p>
                                 </div>
                              ))
                           ) : (
                              <div className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center space-y-2">
                                 <p className="text-xs font-black text-slate-400 uppercase">No Discussions Yet</p>
                              </div>
                           )}
                        </div>
                     </motion.div>
                  )}

                  {activeTab === 'output' && (
                     <motion.div key="output" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        {loading || submitting ? (
                           <div className="h-64 flex flex-col items-center justify-center gap-6">
                              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                 <RefreshCcw className="w-8 h-8 text-indigo-400 animate-spin" />
                              </div>
                              <div className="text-center space-y-2">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">
                                    {executionPhase === 'compiling' ? 'Compiling Code...' : executionPhase === 'testing' ? 'Executing Hidden Tests...' : 'Judging Solution...'}
                                 </p>
                              </div>
                           </div>
                        ) : output ? (
                           <div className="space-y-8">
                              <div className={cn(
                                 "p-6 rounded-3xl border flex items-center gap-4",
                                 output.status === 'Accepted' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                              )}>
                                 {output.status === 'Accepted' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                 <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest">{output.status}</h3>
                                    <p className="text-[10px] font-bold opacity-60 uppercase">Execution Sequence Complete</p>
                                 </div>
                              </div>

                              {output.status === 'Accepted' && output.telemetry && (
                                 <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                                    <div className="flex items-center gap-2">
                                       <Sparkles className="w-5 h-5 text-indigo-400" />
                                       <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Skill Inference Telemetry Report</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                       <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Time to Code</p>
                                          <p className="text-sm font-black text-indigo-300">{output.telemetry.timeToFirstCode}s</p>
                                       </div>
                                       <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Time</p>
                                          <p className="text-sm font-black text-emerald-400">{output.telemetry.totalTime}s</p>
                                       </div>
                                       <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Compile Attempts</p>
                                          <p className="text-sm font-black text-amber-400">{output.telemetry.compileAttempts}</p>
                                       </div>
                                       <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hints Used</p>
                                          <p className="text-sm font-black text-rose-400">{output.telemetry.hintsUsed}</p>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              {output.results && (
                                 <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hidden Test Suite</h4>
                                    <div className="p-4 rounded-2xl bg-black/50 border border-white/5 flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Tests Passed</span>
                                        <span className="text-xs font-black text-white">{output.results.filter((r:any) => r.passed).length} / {output.results.length}</span>
                                    </div>
                                    {output.results.map((r: any, i: number) => (
                                       <div key={i} className={cn("p-4 rounded-2xl border space-y-4", r.passed ? "bg-emerald-500/5 border-emerald-500/10" : "bg-rose-500/5 border-rose-500/30")}>
                                          <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-3">
                                                {r.passed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                                                <span className="text-[10px] font-bold text-slate-300 uppercase">Test Case {i + 1} {r.hidden && '(Hidden)'}</span>
                                             </div>
                                             <span className={cn("text-[9px] font-black uppercase", r.passed ? "text-emerald-400" : "text-rose-400")}>{r.passed ? 'Passed' : 'Failed'}</span>
                                             {!r.passed && (
                                                <div className="w-full pt-4 border-t border-white/5 space-y-4">
                                                   <div>
                                                      <span className="text-[8px] font-black text-slate-500 uppercase">Test Input</span>
                                                      <pre className="text-[10px] text-indigo-300 font-mono mt-1.5 p-3 rounded-lg bg-black/40 border border-white/5 overflow-x-auto">{r.input}</pre>
                                                   </div>
                                                   <div className="grid grid-cols-2 gap-4">
                                                      <div className="p-3.5 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/10 space-y-1">
                                                         <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">🟢 Expected Result</span>
                                                         <pre className="text-[11px] text-emerald-400 font-mono font-black mt-1 overflow-x-auto">{r.expected}</pre>
                                                      </div>
                                                      <div className="p-3.5 rounded-2xl bg-rose-500/[0.02] border border-rose-500/25 space-y-1">
                                                         <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">🔴 Actual Output</span>
                                                         <pre className="text-[11px] text-rose-400 font-mono font-black mt-1 overflow-x-auto">{r.actual || "NULL / NO OUTPUT"}</pre>
                                                      </div>
                                                   </div>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {(output.stdout || output.stderr || output.compile_output) && (
                                 <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Output Log</h4>
                                    <pre className="p-6 rounded-2xl bg-black text-xs text-indigo-400 font-mono overflow-x-auto border border-white/5">
                                       {output.stdout || output.stderr || output.compile_output}
                                    </pre>
                                 </div>
                              )}
                           </div>
                        ) : (
                           <div className="h-64 flex flex-col items-center justify-center text-center p-8 opacity-40">
                              <Terminal className="w-12 h-12 mb-4" />
                              <p className="text-xs font-black uppercase tracking-widest">No Execution History</p>
                           </div>
                        )}
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>

         {/* Draggable Divider */}
         <div 
            onMouseDown={handleMouseDown}
            className="w-1 hover:w-1.5 bg-white/5 hover:bg-indigo-500/50 cursor-col-resize transition-all shrink-0 z-40 relative group"
         >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-white/10 group-hover:bg-indigo-400 transition-all" />
         </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col bg-[#0b0b0b]">
           <div className="px-8 py-3 border-b border-white/5 flex items-center justify-between bg-slate-900/30">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simulation Buffer</span>
                 </div>
                 <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                     <Settings className="w-3 h-3" />
                     Isolated Execution Environment
                  </div>
               </div>
              </div>
           </div>

            {selectedProblem?.recommendationReasons && selectedProblem.recommendationReasons.length > 0 && (
               <div className="mx-8 mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                     <Sparkles className="w-4 h-4 text-indigo-400" />
                     <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Why Am I Seeing This Challenge?</h4>
                  </div>
                  <ul className="space-y-2">
                     {selectedProblem.recommendationReasons.map((reason: string, i: number) => (
                        <li key={i} className="text-xs text-indigo-200/80 flex items-center gap-2 font-medium">
                           <CheckCircle className="w-3 h-3 text-emerald-400" />
                           {reason}
                        </li>
                     ))}
                  </ul>
               </div>
            )}

           <div className="flex-1">
              <Editor
                 height="100%"
                 language={language}
                 theme="vs-dark"
                 value={code}
                 onChange={(val) => {
                   setCode(val || '');
                   if (!firstKeystrokeAt) setFirstKeystrokeAt(Date.now());
                 }}
                 options={{
                   fontSize: 16,
                   fontFamily: "'JetBrains Mono', monospace",
                   minimap: { enabled: false },
                   padding: { top: 32 },
                   automaticLayout: true,
                   renderLineHighlight: 'all',
                   fontWeight: '500'
                 }}
              />
           </div>
           
           {/* Custom Input Panel */}
           <div className="h-[200px] border-t border-white/5 bg-slate-900/40 p-4 flex flex-col shrink-0">
              <div className="flex items-center justify-between mb-3">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Terminal className="w-3 h-3" /> Custom Execution Input
                 </span>
              </div>
              <textarea 
                 value={customInput}
                 onChange={(e) => setCustomInput(e.target.value)}
                 className="flex-1 bg-black/50 border border-white/5 rounded-xl p-4 text-xs font-mono text-indigo-300 resize-none outline-none focus:border-indigo-500/50 transition-all custom-scrollbar"
                 placeholder="e.g. nums = [2,7,11,15]&#10;target = 9"
              />
           </div>
        </div>

      {/* Dynamic Slide-out Contextual AI Drawers */}
      <AnimatePresence>
         {activeRightDrawer && (
            <>
               {/* Drawer Backdrop */}
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveRightDrawer(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80]"
               />
               
               {/* Right Slide-over Panel */}
               <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                  className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#070708] border-l border-white/5 z-[90] flex flex-col shadow-2xl p-8"
               >
                  <div className="flex items-center justify-between mb-8 shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                           {activeRightDrawer === 'hint' ? <Sparkles className="w-4 h-4 text-indigo-400" /> : 
                            activeRightDrawer === 'audit' ? <Brain className="w-4 h-4 text-emerald-400" /> :
                            activeRightDrawer === 'chat' ? <MessageSquare className="w-4 h-4 text-indigo-400 animate-pulse" /> :
                            <CheckCircle className="w-4 h-4 text-emerald-400 animate-bounce" />}
                        </div>
                        <div>
                           <h2 className="text-xs font-black text-white uppercase tracking-widest">
                              {activeRightDrawer === 'hint' ? "Neural Hint Engine" : 
                               activeRightDrawer === 'audit' ? "AI Core Audit" :
                               activeRightDrawer === 'chat' ? "AI FAANG Interviewer" :
                               "Calibration Scorecard"}
                           </h2>
                           <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                              {activeRightDrawer === 'hint' ? "Real-time algorithmic assistance" : 
                               activeRightDrawer === 'audit' ? "Full architectural solution breakdown" :
                               activeRightDrawer === 'chat' ? "Multi-turn simulation feedback dialogue" :
                               "Calibrated candidate capability report"}
                           </p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setActiveRightDrawer(null)}
                        className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all border border-white/5"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar flex flex-col">
                     {activeRightDrawer === 'hint' && (
                        interviewMode ? (
                           <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                 <Lock className="w-6 h-6 text-rose-400 animate-pulse" />
                              </div>
                              <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest">AI Assistance Locked</h3>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                                 Neural hints are strictly disabled during Mock Interview exams to enforce high-pressure, authentic coding simulation.
                              </p>
                           </div>
                        ) : (
                           <div className="space-y-6">
                              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 relative">
                                 <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-ping" />
                                 <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
                                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Compiler Pro-Tip</p>
                                 <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                    Analyze array sizes and bound conditions first. For premium memory allocation, process input bytes in-place before constructing recursive callstacks.
                                 </p>
                              </div>

                              {selectedProblem?.progressiveHints && selectedProblem.progressiveHints.length > 0 ? (
                                 <div className="space-y-4">
                                    {selectedProblem.progressiveHints.map((hint: any, idx: number) => {
                                       const isRevealed = idx < hintsRevealed;
                                       return (
                                          <div key={idx} className={`p-5 rounded-2xl border transition-all ${isRevealed ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-white/[0.02] border-white/5 backdrop-blur-sm'}`}>
                                             <div className="flex items-center justify-between mb-2">
                                                <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isRevealed ? 'text-indigo-400' : 'text-slate-500'}`}>
                                                   {isRevealed ? <Sparkles className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />} 
                                                   Hint {idx + 1}: {hint.type}
                                                </p>
                                             </div>
                                             {isRevealed ? (
                                                <p className="text-xs text-indigo-200/80 font-medium leading-relaxed">{hint.content}</p>
                                             ) : (
                                                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                                                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Locked to preserve mastery score</p>
                                                   {idx === hintsRevealed && (
                                                      <button 
                                                         onClick={() => setHintsRevealed(prev => prev + 1)}
                                                         className="px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-[10px] font-black uppercase tracking-wider transition-colors border border-indigo-500/20"
                                                      >
                                                         Reveal Next Hint
                                                      </button>
                                                   )}
                                                </div>
                                             )}
                                          </div>
                                       );
                                    })}
                                 </div>
                              ) : (
                                 <p className="text-[10px] text-slate-500 uppercase font-black text-center py-12">No progressive hints configured.</p>
                              )}
                           </div>
                        )
                     )}

                     {activeRightDrawer === 'audit' && (
                        review ? (
                           <div className="space-y-6">
                              <div className="p-6 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/20 flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Brain className="w-6 h-6 text-emerald-400" />
                                 </div>
                                 <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Efficiency Metrics</h3>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase">Optimal Solution Rating: {review.score}/100</p>
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-[8px] font-black text-slate-600 uppercase">Time Bounds</span>
                                    <code className="text-xs text-indigo-300 font-mono block">{review.complexity.time}</code>
                                 </div>
                                 <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-[8px] font-black text-slate-600 uppercase">Space Bound</span>
                                    <code className="text-xs text-indigo-300 font-mono block">{review.complexity.space}</code>
                                 </div>
                              </div>

                              {review.interviewerFeedback && (
                                 <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> Simulation Core Feedback</p>
                                    <p className="text-xs text-indigo-200/80 font-medium leading-relaxed">"{review.interviewerFeedback}"</p>
                                 </div>
                              )}

                              {review.betterApproach && (
                                 <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Architectural Optimization</p>
                                    <p className="text-xs text-emerald-200/80 font-medium leading-relaxed">{review.betterApproach}</p>
                                 </div>
                              )}

                              {review.issues && review.issues.length > 0 && (
                                 <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identified Inefficiencies</h4>
                                    {review.issues.map((iss: any, i: number) => (
                                       <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                          <div className="flex items-center justify-between">
                                             <span className={cn(
                                                "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                                                iss.type === 'bug' || iss.type === 'security' ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                                             )}>{iss.type}</span>
                                             <span className="text-[8px] font-bold text-slate-500 uppercase">{iss.severity}</span>
                                          </div>
                                          <p className="text-xs text-white font-medium">{iss.description}</p>
                                          <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">Fix Suggested: {iss.suggestion}</p>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        ) : submitting ? (
                           <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
                              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                              <p className="text-xs font-black uppercase tracking-widest text-indigo-400 animate-pulse">Core Audit Processing...</p>
                              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-relaxed">
                                 Groq AI is performing background code review, security audits, and space-time complexity analysis.
                              </p>
                           </div>
                        ) : (
                           <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-30 my-auto">
                              <Brain className="w-10 h-10 text-slate-600 animate-pulse" />
                              <p className="text-xs font-black uppercase tracking-widest">No Submission Audits Found</p>
                              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-relaxed">Submit your solution parameters to seed deep machine audits.</p>
                           </div>
                        )
                     )}

                     {activeRightDrawer === 'chat' && (
                        <div className="flex flex-col h-full justify-between flex-1">
                           <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[62vh] custom-scrollbar">
                              {interviewSession?.messages?.map((msg: any, idx: number) => (
                                 <div 
                                    key={idx} 
                                    className={cn(
                                       "p-4 rounded-2xl max-w-[85%] space-y-1.5",
                                       msg.role === 'interviewer' 
                                          ? "bg-white/5 border border-white/5 mr-auto text-slate-300" 
                                          : "bg-indigo-600 border border-indigo-500 ml-auto text-white"
                                    )}
                                 >
                                    <span className="text-[8px] font-black uppercase opacity-60 tracking-wider">
                                       {msg.role === 'interviewer' ? "Interviewer (FAANG Lead)" : "Candidate (You)"}
                                    </span>
                                    <p className="text-xs font-medium leading-relaxed">{msg.content}</p>
                                 </div>
                              ))}
                              {chatLoading && (
                                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mr-auto text-slate-300 max-w-[85%] flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">Interviewer is thinking...</span>
                                 </div>
                              )}
                           </div>

                           <div className="mt-auto shrink-0 space-y-4">
                              <div className="border-t border-white/5 pt-4 flex gap-2">
                                 <input 
                                    type="text"
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                                    placeholder="Talk to interviewer..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition-all font-medium"
                                 />
                                 <button 
                                    onClick={handleSendChatMessage}
                                    disabled={chatLoading || !chatMessage.trim()}
                                    className="px-4 rounded-xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 transition-all"
                                 >
                                    Send
                                 </button>
                              </div>

                              <button 
                                 onClick={handleFinishInterview}
                                 disabled={chatLoading}
                                 className="w-full py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                 <X className="w-4 h-4" /> End & Grade Interview
                              </button>
                           </div>
                        </div>
                     )}

                     {activeRightDrawer === 'scorecard' && (
                        <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-1">
                           <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 text-center space-y-2">
                              <CheckCircle className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
                              <h3 className="text-sm font-black text-white uppercase tracking-widest">Interview Scorecard</h3>
                              <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Calibration Matrix Complete</p>
                           </div>

                           <div className="space-y-4">
                              {[
                                 { label: 'Problem Solving', val: interviewSession?.feedbackScorecard?.problemSolving || 80, color: 'text-indigo-400', bg: 'bg-indigo-500' },
                                 { label: 'Optimization', val: interviewSession?.feedbackScorecard?.optimization || 75, color: 'text-emerald-400', bg: 'bg-emerald-500' },
                                 { label: 'Code Quality', val: interviewSession?.feedbackScorecard?.codeQuality || 85, color: 'text-purple-400', bg: 'bg-purple-500' },
                                 { label: 'Communication', val: interviewSession?.feedbackScorecard?.communication || 90, color: 'text-amber-400', bg: 'bg-amber-500' }
                              ].map((score) => (
                                 <div key={score.label} className="space-y-1.5 p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                                       <span className="text-slate-400">{score.label}</span>
                                       <span className={score.color}>{score.val} / 100</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                       <div className={cn("h-full rounded-full transition-all duration-500", score.bg)} style={{ width: `${score.val}%` }} />
                                    </div>
                                 </div>
                              ))}
                           </div>

                           {interviewSession?.feedbackScorecard?.feedbackSummary && (
                              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recruiter Assessment</p>
                                 <p className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                                    {interviewSession.feedbackScorecard.feedbackSummary}
                                 </p>
                              </div>
                           )}

                           {selectedProblem?.weaknessConnections && selectedProblem.weaknessConnections.length > 0 && (
                              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                                 <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">⚠️ Mastery Gap Identified</p>
                                 <p className="text-xs text-amber-200/80 font-medium leading-relaxed">
                                    Based on the interview calibration, we recommend focusing on these topics:
                                 </p>
                                 <div className="flex flex-wrap gap-2 pt-2">
                                    {selectedProblem.weaknessConnections.map((tag: string) => (
                                       <span key={tag} className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-300 uppercase tracking-wider">{tag.replace('_', ' ')}</span>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>

      {/* Mock Interview Settings Modal */}
      <AnimatePresence>
         {showInterviewModal && (
            <>
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowInterviewModal(false)}
                  className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120]"
               />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-[#070708] border border-white/5 z-[121] rounded-3xl p-8 shadow-2xl space-y-6"
               >
                  <div className="text-center space-y-2">
                     <Clock className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
                     <h3 className="text-xs font-black text-white uppercase tracking-widest">Mock Interview Mode</h3>
                     <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                        Start a timed exam. AI hints will be fully disabled to replicate high-pressure conditions.
                     </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     {[
                        { label: '15 Mins', value: 900 },
                        { label: '30 Mins', value: 1800 },
                        { label: '45 Mins', value: 2700 },
                        { label: '60 Mins', value: 3600 }
                     ].map((t) => (
                        <button 
                           key={t.value}
                           onClick={() => setInterviewLimitSelected(t.value)}
                           className={cn(
                              "py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                              interviewLimitSelected === t.value ? "bg-indigo-500 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10"
                           )}
                        >
                           {t.label}
                        </button>
                     ))}
                  </div>

                  <div className="space-y-2">
                     <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Interviewer Tone</span>
                     <div className="grid grid-cols-2 gap-2">
                        {[
                           { label: 'Supportive 🤝', val: 'supportive' },
                           { label: 'Interrogative 🔍', val: 'interrogative' },
                           { label: 'Silent 🤐', val: 'silent' },
                           { label: 'Demanding ⚡', val: 'demanding' }
                        ].map((tone) => (
                           <button 
                              key={tone.val}
                              onClick={() => setSelectedTone(tone.val as any)}
                              className={cn(
                                 "py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all",
                                 selectedTone === tone.val ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10"
                              )}
                           >
                              {tone.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex gap-3">
                     <button 
                        onClick={() => setShowInterviewModal(false)}
                        className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={handleStartInterview}
                        className="flex-1 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                     >
                        Start Exam
                     </button>
                  </div>
               </motion.div>
            </>
         )}
                  </AnimatePresence>
      </div>
    </div>
  );
}
