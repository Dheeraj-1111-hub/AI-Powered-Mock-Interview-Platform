import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, Play, Send, Brain, ChevronRight, Terminal, 
  Settings, CheckCircle, AlertCircle, Info, Loader2,
  Maximize2, RefreshCcw, Sparkles, Layout, X
} from 'lucide-react';
import { fetchProblems, fetchProblemById, runCodeExecution, submitCodeChallenge } from '../services/api.service';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { GlowingButton } from '../components/ui/GlowingButton';
import { Navbar } from '../components/shared/Navbar';
import { cn } from '../utils/cn';

export default function CodingPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [code, setCode] = useState('// Select a problem to begin...');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'output' | 'review'>('problem');
  const [review, setReview] = useState<any>(null);

  useEffect(() => {
    const loadProblems = async () => {
      try {
        const res = await fetchProblems();
        setProblems(res.data);
        if (res.data.length > 0) handleSelectProblem(res.data[0]);
      } catch (err) {
        console.error(err);
      }
    };
    loadProblems();
  }, []);

  const handleSelectProblem = async (problem: any) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode[language] || '');
    setActiveTab('problem');
    setOutput(null);
    setReview(null);
  };

  const handleRun = async () => {
    setLoading(true);
    setActiveTab('output');
    try {
      const inputToRun = selectedProblem?.testCases?.[0]?.input || '';
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
    try {
      const res = await submitCodeChallenge({ problemId: selectedProblem._id, code, language });
      setOutput({ status: res.data.status, results: res.data.results });
      if (res.data.aiReview) setReview(res.data.aiReview);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-[#050505] text-slate-100 flex flex-col overflow-hidden selection:bg-indigo-500/30 font-sans">
      <Navbar />
      
      {/* Workspace Header */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl px-6 py-3 flex items-center justify-between z-50 mt-20">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Code2 className="w-5 h-5 text-indigo-400" />
               </div>
               <div>
                  <h1 className="text-sm font-black text-white uppercase tracking-widest">{selectedProblem?.title || 'Coding Lab'}</h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedProblem?.category}</p>
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
         </div>

         <div className="flex items-center gap-4">
            <button onClick={handleRun} disabled={loading || submitting} className="flex items-center gap-3 px-6 h-11 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run Code
            </button>
            <GlowingButton onClick={handleSubmit} disabled={loading || submitting} className="h-11 px-6">
               {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} <span className="text-[10px] ml-2">Submit Simulation</span>
            </GlowingButton>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Problem Description / Problems List */}
        <div className="w-[450px] border-r border-white/5 bg-black/40 flex flex-col overflow-hidden">
           <div className="flex p-2 gap-1 border-b border-white/5 bg-slate-950/50">
              <button onClick={() => setActiveTab('problem')} className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'problem' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300")}>Description</button>
              <button onClick={() => setActiveTab('output')} className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'output' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300")}>Output</button>
              <button onClick={() => setActiveTab('review')} disabled={!review} className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'review' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300 disabled:opacity-30")}>AI Review</button>
           </div>

           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                 {activeTab === 'problem' && (
                    <motion.div key="desc" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                       <div className="inline-flex px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase text-indigo-400">
                          {selectedProblem?.difficulty}
                       </div>
                       <div className="space-y-4">
                          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{selectedProblem?.title}</h2>
                          <p className="text-slate-400 leading-relaxed font-medium">{selectedProblem?.description}</p>
                       </div>
                       
                       <div className="space-y-6 pt-6">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Test Cases</h4>
                          {selectedProblem?.testCases.filter((t: any) => !t.hidden).map((t: any, i: number) => (
                             <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <div>
                                   <p className="text-[9px] font-black text-slate-600 uppercase mb-2">Input</p>
                                   <code className="text-xs text-indigo-300 font-mono">{t.input}</code>
                                </div>
                                <div>
                                   <p className="text-[9px] font-black text-slate-600 uppercase mb-2">Expected Output</p>
                                   <code className="text-xs text-emerald-300 font-mono">{t.expectedOutput}</code>
                                </div>
                             </div>
                          ))}
                       </div>
                    </motion.div>
                 )}

                 {activeTab === 'output' && (
                    <motion.div key="output" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                       {loading || submitting ? (
                          <div className="h-64 flex flex-col items-center justify-center gap-6">
                             <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-spin">
                                <RefreshCcw className="w-8 h-8 text-indigo-400" />
                             </div>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Executing in Sandbox</p>
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

                             {output.results && (
                                <div className="space-y-4">
                                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Test Results</h4>
                                   {output.results.map((r: any, i: number) => (
                                      <div key={i} className={cn("p-4 rounded-2xl border flex items-center justify-between", r.passed ? "bg-emerald-500/5 border-emerald-500/10" : "bg-rose-500/5 border-rose-500/10")}>
                                         <div className="flex items-center gap-3">
                                            {r.passed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                                            <span className="text-[10px] font-bold text-slate-300 uppercase">Case {i + 1}</span>
                                         </div>
                                         <span className={cn("text-[9px] font-black uppercase", r.passed ? "text-emerald-400" : "text-rose-400")}>{r.passed ? 'Passed' : 'Failed'}</span>
                                      </div>
                                   ))}
                                </div>
                             )}

                             {output.stdout && (
                                <div className="space-y-4">
                                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Standard Output</h4>
                                   <pre className="p-6 rounded-2xl bg-black text-xs text-indigo-400 font-mono overflow-x-auto border border-white/5">
                                      {output.stdout}
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

                 {activeTab === 'review' && review && (
                    <motion.div key="review" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                       <SpotlightCard className="p-8 border-indigo-500/20 bg-indigo-500/[0.03]">
                          <div className="flex items-center gap-4 mb-6">
                             <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-indigo-400" />
                             </div>
                             <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Audit Result</h3>
                                <p className="text-[9px] font-bold text-indigo-400 uppercase">Quality Score: {review.score}/100</p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-8">
                             <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Time Complexity</p>
                                <code className="text-xs text-white font-mono">{review.complexity.time}</code>
                             </div>
                             <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Space Complexity</p>
                                <code className="text-xs text-white font-mono">{review.complexity.space}</code>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Structural Findings</h4>
                             {review.issues.map((issue: any, i: number) => (
                                <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                                   <div className="flex items-center justify-between">
                                      <span className={cn(
                                         "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                                         issue.type === 'bug' ? "bg-rose-500/10 text-rose-400" : 
                                         issue.type === 'optimization' ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-500/10 text-slate-400"
                                      )}>{issue.type}</span>
                                   </div>
                                   <p className="text-xs text-white font-medium">{issue.description}</p>
                                   <p className="text-[10px] text-slate-500 italic">Suggestion: {issue.suggestion}</p>
                                </div>
                             ))}
                          </div>
                       </SpotlightCard>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col bg-[#0b0b0b]">
           <div className="px-8 py-3 border-b border-white/5 flex items-center justify-between bg-slate-900/30">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal Buffer</span>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                    <Settings className="w-3 h-3" />
                    UTF-8 Simulation
                 </div>
              </div>
           </div>
           <div className="flex-1">
              <Editor
                 height="100%"
                 language={language}
                 theme="vs-dark"
                 value={code}
                 onChange={(val) => setCode(val || '')}
                 options={{
                   fontSize: 16,
                   fontFamily: "'JetBrains Mono', monospace",
                   minimap: { enabled: false },
                   padding: { top: 32 },
                   automaticLayout: true,
                   renderLineHighlight: 'all'
                 }}
              />
           </div>
        </div>

      </div>
    </div>
  );
}
