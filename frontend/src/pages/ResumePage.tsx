import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, CheckCircle, AlertCircle, Sparkles, 
  BarChart3, Target, Zap, Search, ArrowRight, BrainCircuit,
  LayoutDashboard, ShieldCheck, Microscope, History, Loader2,
  Briefcase, Edit3, MessageSquare, Star, TrendingUp, X, Check,
  Code, Eye
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { analyzeResume, getLatestResumeAnalysis, getResumeHistory } from '../services/api.service';
import { useToast } from '../contexts/ToastContext';
import { GlowingButton } from '../components/ui/GlowingButton';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { Navbar } from '../components/shared/Navbar';
import { cn } from '../utils/cn';

interface AnalysisResult {
  _id?: string;
  filename: string;
  parsedText: string;
  globalAts: { format: number, keywords: number, sections: number, readability: number, parsing: number, total: number };
  jobAlignment: { score: number, presentKeywords: string[], missingKeywords: string[] };
  recruiterImpact: { score: number, metrics: any };
  projectQuality: { score: number, evaluations: any[] };
  dynamicGuidelines: Array<{ rule: string, status: 'passed' | 'failed', message: string }>;
  sectionQuality: Array<{ name: string, score: number, feedback: string }>;
  skillDNA: { keywords: number, impact: number, brevity: number, actionVerbs: number, formatting: number };
  bulletImprovements: Array<{ original: string, improved: string, changes: any[] }>;
  keywordIntelligence: { present: string[], missing: string[], overused: string[], weak: string[] };
  strategicStrengths: string[];
  criticalGaps: Array<{ topic: string, reason: string }>;
  recruiterFeedback: { strengths: string[], concerns: string[], recommendation: string };
  sixSecondScan: { good: string[], bad: string[] };
  createdAt: Date;
}

const PIPELINE_STEPS = [
  "Extracting Raw Text...",
  "Running Section Detection...",
  "Mapping Keyword Clusters...",
  "Evaluating Recruiter Impact...",
  "Scanning against ATS Parsers...",
  "Finalizing Executive Audit..."
];

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [showJDInput, setShowJDInput] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const toast = useToast();

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const [latestRes, historyRes] = await Promise.all([
           getLatestResumeAnalysis(),
           getResumeHistory()
        ]);
        if (latestRes.data) setResult(latestRes.data);
        if (historyRes.data) setHistory(historyRes.data);
      } catch (err) {
        console.error('Failed to fetch resume data:', err);
      } finally {
        setRestoring(false);
      }
    };
    fetchLatest();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) {
       // Frontend size validation (5MB)
       if (uploaded.size > 5 * 1024 * 1024) {
          toast.toast('Upload Failed', 'Resume exceeds 5MB limit.', 'error');
          return;
       }
       setFile(uploaded);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setLoading(true);
    setPipelineStep(0);
    
    // Simulate progressive pipeline UX
    const interval = setInterval(() => {
       setPipelineStep(prev => Math.min(prev + 1, PIPELINE_STEPS.length - 1));
    }, 1500);

    try {
      const response = await analyzeResume(file, jobDescription);
      clearInterval(interval);
      setPipelineStep(PIPELINE_STEPS.length - 1);
      setTimeout(() => {
         setResult(response.data);
         setLoading(false);
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      toast.toast('Analysis Failed', err.response?.data?.message || 'Could not parse resume data. Please try again.', 'error');
      setLoading(false);
    }
  };

  const radarData = result ? [
    { subject: 'Impact', A: result.skillDNA.impact, fullMark: 100 },
    { subject: 'Keywords', A: result.skillDNA.keywords, fullMark: 100 },
    { subject: 'Brevity', A: result.skillDNA.brevity, fullMark: 100 },
    { subject: 'Action Verbs', A: result.skillDNA.actionVerbs, fullMark: 100 },
    { subject: 'Formatting', A: result.skillDNA.formatting, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <Navbar />
      
      {/* Immersive Background */}
      <div className="fixed inset-0 bg-grid-white pointer-events-none opacity-40" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none blur-[100px]" />

      {restoring ? (
        <div className="min-h-screen flex items-center justify-center">
           <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-pulse">
                 <Microscope className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Retrieving intelligence history</p>
           </div>
        </div>
      ) : (
        <main className="relative z-10 pt-32 pb-24 px-6 max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 border-b border-white/5 pb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">
                <Microscope className="w-3 h-3" />
                <span>Executive Audit Engine</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2">
               Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Intelligence</span>
             </h1>
             <p className="text-slate-400 max-w-xl font-medium">
               A recruiter-grade parser. Every metric is backed by evidence. Find out exactly what the ATS sees when it processes your profile.
             </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* UPLOAD TERMINAL SIDEBAR */}
          <div className="lg:col-span-3 space-y-6">
            <SpotlightCard className="p-6">
              <h3 className="text-xs font-black text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                 <Upload className="w-4 h-4 text-indigo-400" /> Scan Terminal
              </h3>
              
              <div 
                className={cn(
                  "relative border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all group overflow-hidden",
                  file ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/10 hover:border-white/20 bg-white/5",
                  loading ? "pointer-events-none opacity-50" : ""
                )}
              >
                <input 
                  type="file" 
                  onChange={handleUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  accept=".pdf,.doc,.docx"
                />
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText className={cn("w-6 h-6", file ? "text-indigo-400" : "text-slate-500")} />
                </div>
                <p className="text-xs font-bold text-slate-300 mb-1 text-center truncate w-full px-2">
                  {file ? file.name : "Select PDF / DOCX"}
                </p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Max 5MB</p>
              </div>

              {/* Job Description Toggle */}
              <div className="mt-4">
                 <button 
                  onClick={() => setShowJDInput(!showJDInput)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-colors"
                 >
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <Briefcase className="w-3 h-3 text-indigo-400" /> Target JD
                    </span>
                    {showJDInput ? <X className="w-3 h-3 text-slate-500" /> : <ArrowRight className="w-3 h-3 text-slate-500" />}
                 </button>
                 
                 <AnimatePresence>
                   {showJDInput && (
                     <motion.div 
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden mt-2"
                     >
                        <textarea 
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste Job Description for alignment matching..."
                          className="w-full h-32 bg-[#0a0a0a] border border-white/5 rounded-xl p-3 text-xs text-slate-300 outline-none focus:border-indigo-500/50 transition-all resize-none custom-scrollbar"
                        />
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              <GlowingButton 
                onClick={startAnalysis} 
                disabled={!file || loading}
                className="w-full mt-6 h-12"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Run Analysis <Zap className="w-4 h-4" />
                  </span>
                )}
              </GlowingButton>
            </SpotlightCard>

            {/* LIVE PIPELINE PROGRESSION */}
            <AnimatePresence>
              {loading && (
                 <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                 >
                    <SpotlightCard className="p-5 border-indigo-500/20">
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Pipeline Execution</h4>
                       <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[9px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                          {PIPELINE_STEPS.map((step, idx) => {
                             const isPast = idx < pipelineStep;
                             const isCurrent = idx === pipelineStep;
                             return (
                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                   <div className={cn(
                                      "flex items-center justify-center w-5 h-5 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2",
                                      isPast ? "bg-indigo-500 border-indigo-500 text-white" : isCurrent ? "bg-black border-indigo-500 text-indigo-500 animate-pulse" : "bg-black border-white/10 text-transparent"
                                   )}>
                                      {isPast && <Check className="w-3 h-3" />}
                                   </div>
                                   <div className={cn(
                                      "w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-2 rounded border",
                                      isCurrent ? "bg-indigo-500/10 border-indigo-500/20" : "bg-transparent border-transparent"
                                   )}>
                                      <p className={cn(
                                         "text-[10px] font-bold uppercase tracking-wider",
                                         isPast ? "text-slate-500" : isCurrent ? "text-indigo-400" : "text-slate-700"
                                      )}>{step}</p>
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    </SpotlightCard>
                 </motion.div>
              )}
            </AnimatePresence>

            {/* VERSION HISTORY */}
            {!loading && history.length > 0 && (
               <SpotlightCard className="p-5">
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <History className="w-3 h-3" /> Scan History
                     </h4>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                     {history.map((h, i) => (
                       <button 
                         key={i}
                         onClick={() => setResult(h)}
                         className={cn(
                           "w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between group",
                           result?._id === h._id ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5 hover:border-white/10"
                         )}
                       >
                          <div>
                             <p className="text-[10px] font-bold text-white truncate w-32">{h.filename}</p>
                             <p className="text-[9px] text-slate-500 mt-0.5">{new Date(h.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-xs font-black text-indigo-400">{h.globalAts?.total || 0}%</div>
                       </button>
                     ))}
                  </div>
               </SpotlightCard>
            )}
          </div>

          {/* RESULTS AREA */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  
                  {/* METRICS ROW */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     <MetricBox label="Global ATS Score" value={result.globalAts?.total || 0} color="indigo" />
                     <MetricBox label="Recruiter Impact" value={result.recruiterImpact?.score || 0} color="emerald" />
                     <MetricBox label="Project Quality" value={result.projectQuality?.score || 0} color="amber" />
                     <MetricBox label="JD Alignment" value={result.jobAlignment?.score || 0} color="fuchsia" />
                  </div>

                  {/* 6-SECOND SCAN & RECRUITER VERDICT */}
                  <div className="grid md:grid-cols-12 gap-6">
                     <SpotlightCard className="md:col-span-7 p-6 border-indigo-500/20 bg-indigo-500/[0.02]">
                        <div className="flex items-start justify-between mb-6">
                           <div>
                              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Recruiter Executive Summary</h3>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Simulated 6-Second First Impression</p>
                           </div>
                           <div className={cn(
                              "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                              result.recruiterFeedback?.recommendation === 'Interview Worthy' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                              result.recruiterFeedback?.recommendation === 'Borderline' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                              "bg-rose-500/10 text-rose-400 border-rose-500/20"
                           )}>
                              {result.recruiterFeedback?.recommendation || 'Unknown'}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 rounded-xl bg-[#0a0a0a] border border-emerald-500/10">
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><CheckCircle className="w-3 h-3"/> Standouts</p>
                              <ul className="space-y-2">
                                 {result.sixSecondScan?.good?.map((item, i) => (
                                    <li key={i} className="text-xs text-slate-300 font-medium leading-relaxed">{item}</li>
                                 ))}
                              </ul>
                           </div>
                           <div className="p-4 rounded-xl bg-[#0a0a0a] border border-rose-500/10">
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><AlertCircle className="w-3 h-3"/> Missing</p>
                              <ul className="space-y-2">
                                 {result.sixSecondScan?.bad?.map((item, i) => (
                                    <li key={i} className="text-xs text-slate-300 font-medium leading-relaxed">{item}</li>
                                 ))}
                              </ul>
                           </div>
                        </div>
                     </SpotlightCard>

                     <SpotlightCard className="md:col-span-5 p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-sm font-black text-white uppercase tracking-widest">ATS Parser View</h3>
                           <button onClick={() => setShowRawText(!showRawText)} className="flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded">
                              <Eye className="w-3 h-3" /> {showRawText ? 'Hide' : 'View Raw'}
                           </button>
                        </div>
                        
                        {showRawText ? (
                           <div className="flex-1 bg-black rounded-xl p-4 border border-white/10 overflow-y-auto max-h-[200px] custom-scrollbar">
                              <pre className="text-[10px] text-emerald-400 font-mono whitespace-pre-wrap">{result.parsedText || 'No text extracted. PDF may be an image.'}</pre>
                           </div>
                        ) : (
                           <div className="flex-1 space-y-4">
                              <p className="text-xs text-slate-400 leading-relaxed">
                                 The ATS algorithm broke your resume into logical components. Below are the parsing scores:
                              </p>
                              <div className="space-y-3">
                                 <ProgressRow label="Format Validity" score={result.globalAts?.format || 0} />
                                 <ProgressRow label="Section Detection" score={result.globalAts?.sections || 0} />
                                 <ProgressRow label="Semantic Parsing" score={result.globalAts?.parsing || 0} />
                              </div>
                           </div>
                        )}
                     </SpotlightCard>
                  </div>

                  {/* DEEP DRILL-DOWNS */}
                  <div className="grid md:grid-cols-2 gap-6">
                     
                     {/* Dynamic Guidelines */}
                     <SpotlightCard className="p-6">
                        <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-400" /> Live Diagnostics</h3>
                        <div className="space-y-3">
                           {result.dynamicGuidelines?.map((g, i) => (
                              <div key={i} className={cn(
                                 "p-3 rounded-xl border flex items-start gap-3",
                                 g.status === 'passed' ? "bg-emerald-500/5 border-emerald-500/10" : "bg-rose-500/5 border-rose-500/10"
                              )}>
                                 {g.status === 'passed' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                                 <div>
                                    <p className="text-xs font-bold text-white mb-0.5">{g.rule}</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">{g.message}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </SpotlightCard>

                     {/* DNA Matrix */}
                     <SpotlightCard className="p-6">
                        <h3 className="text-sm font-black text-white mb-2 uppercase tracking-widest flex items-center gap-2"><Radar className="w-4 h-4 text-indigo-400" /> Skill DNA Matrix</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">NLP-driven Analysis</p>
                        <div className="h-48 w-full -ml-4">
                           <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                 <PolarGrid stroke="#1e293b" />
                                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }} />
                                 <Radar
                                    name="Candidate"
                                    dataKey="A"
                                    stroke="#6366f1"
                                    fill="#6366f1"
                                    fillOpacity={0.4}
                                 />
                              </RadarChart>
                           </ResponsiveContainer>
                        </div>
                     </SpotlightCard>
                  </div>

                  {/* BULLET OPTIMIZATION */}
                  <SpotlightCard className="p-6 border-fuchsia-500/20">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20">
                           <Edit3 className="w-4 h-4 text-fuchsia-400" />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-white uppercase tracking-tighter">AI Bullet Optimization</h3>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transforming actions into impact</p>
                        </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-4">
                        {result.bulletImprovements?.map((item, i) => (
                          <div key={i} className="p-5 rounded-2xl bg-black border border-white/5 space-y-4 group hover:border-fuchsia-500/30 transition-all">
                             <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Original Parse</p>
                                <p className="text-xs text-slate-400 line-through decoration-rose-500/50 italic">"{item.original}"</p>
                             </div>
                             <div className="pt-4 border-t border-white/5 space-y-2">
                                <p className="text-[9px] font-black text-fuchsia-400 uppercase tracking-widest">FAANG-Ready Output</p>
                                <p className="text-sm text-white font-medium leading-relaxed">{item.improved}</p>
                             </div>
                             {item.changes && item.changes.length > 0 && (
                               <div className="pt-3 flex flex-wrap gap-2">
                                  {item.changes.map((c: any, ci: number) => (
                                     <span key={ci} className="px-2 py-1 rounded bg-white/5 text-[9px] font-bold text-slate-300 uppercase tracking-widest border border-white/10" title={c.description}>
                                        + {c.type}
                                     </span>
                                  ))}
                               </div>
                             )}
                          </div>
                        ))}
                     </div>
                  </SpotlightCard>

                  {/* KEYWORD INTELLIGENCE */}
                  <SpotlightCard className="p-6">
                    <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tighter">Keyword Intelligence Matrix</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <KeywordBox title="Verified Present" keywords={result.keywordIntelligence?.present} type="good" />
                       <KeywordBox title="Critical Missing" keywords={result.keywordIntelligence?.missing} type="bad" />
                       <KeywordBox title="Overused (Spam)" keywords={result.keywordIntelligence?.overused} type="warn" />
                       <KeywordBox title="Weak / Vague" keywords={result.keywordIntelligence?.weak} type="warn" />
                    </div>
                  </SpotlightCard>

                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-3xl bg-[#0a0a0a]"
                >
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                     <LayoutDashboard className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">System Idle</h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium">
                    Upload your resume to trigger the intelligence pipeline and uncover critical parsing flaws.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </main>
      )}
    </div>
  );
}

const MetricBox = ({ label, value, color }: any) => {
   const colorMap: any = {
     indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]",
     emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]",
     amber: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]",
     fuchsia: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20 shadow-[inset_0_0_20px_rgba(217,70,239,0.05)]"
   };
 
   return (
     <div className={cn("p-5 rounded-2xl border flex flex-col justify-between", colorMap[color])}>
       <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-4">{label}</p>
       <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black">{value}</span>
          <span className="text-sm font-bold opacity-50">%</span>
       </div>
     </div>
   );
};

const ProgressRow = ({ label, score }: { label: string, score: number }) => (
   <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
         <span className="text-slate-400">{label}</span>
         <span className="text-indigo-400">{score}%</span>
      </div>
      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
         <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} className="h-full bg-indigo-500" />
      </div>
   </div>
);

const KeywordBox = ({ title, keywords, type }: { title: string, keywords?: string[], type: 'good'|'bad'|'warn' }) => {
   const styles = {
      good: "border-emerald-500/20 bg-emerald-500/5",
      bad: "border-rose-500/20 bg-rose-500/5",
      warn: "border-amber-500/20 bg-amber-500/5"
   };
   const textStyles = {
      good: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      bad: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      warn: "text-amber-400 bg-amber-500/10 border-amber-500/20"
   };

   return (
      <div className={cn("p-4 rounded-2xl border", styles[type])}>
         <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-80 text-white">{title}</p>
         <div className="flex flex-wrap gap-1.5">
            {keywords?.slice(0, 8).map((k, i) => (
               <span key={i} className={cn("px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border", textStyles[type])}>
                  {k}
               </span>
            ))}
            {(!keywords || keywords.length === 0) && (
               <span className="text-[10px] text-slate-500 italic">None found</span>
            )}
         </div>
      </div>
   )
}
