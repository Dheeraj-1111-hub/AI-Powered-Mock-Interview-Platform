import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, CheckCircle, AlertCircle, Sparkles, 
  BarChart3, Target, Zap, Search, ArrowRight, BrainCircuit,
  LayoutDashboard, ShieldCheck, Microscope, History, Loader2,
  Briefcase, Edit3, MessageSquare, Star, TrendingUp, X
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { analyzeResume, getLatestResumeAnalysis, getResumeHistory } from '../services/api.service';
import { GlowingButton } from '../components/ui/GlowingButton';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { Navbar } from '../components/shared/Navbar';
import { cn } from '../utils/cn';

interface BulletImprovement {
  original: string;
  improved: string;
  reason: string;
}

interface AnalysisResult {
  _id?: string;
  atsScore: number;
  roleMatch: number;
  keywordGaps: string[];
  strengths: string[];
  weaknesses: string[];
  rewriteSuggestions: string[];
  bulletImprovements: BulletImprovement[];
  recruiterInsights: string;
  jobDescription?: string;
  sectionScores: {
    experience: number;
    education: number;
    skills: number;
    summary: number;
  };
  keywordHighlighting: Array<{
    keyword: string;
    type: 'skill' | 'action' | 'impact';
    status: 'present' | 'missing';
  }>;
  radarScores: {
    impact: number;
    keywords: number;
    brevity: number;
    actionVerbs: number;
    formatting: number;
  };
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [showJDInput, setShowJDInput] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

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
    if (uploaded) setFile(uploaded);
  };

  const startAnalysis = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const response = await analyzeResume(file, jobDescription);
      setResult(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const radarData = result ? [
    { subject: 'Impact', A: result.radarScores.impact, fullMark: 100 },
    { subject: 'Keywords', A: result.radarScores.keywords, fullMark: 100 },
    { subject: 'Brevity', A: result.radarScores.brevity, fullMark: 100 },
    { subject: 'Action Verbs', A: result.radarScores.actionVerbs, fullMark: 100 },
    { subject: 'Formatting', A: result.radarScores.formatting, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <Navbar />
      
      {/* Immersive Background */}
      <div className="fixed inset-0 bg-grid-white pointer-events-none opacity-40" />
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

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
        <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6">
                <Microscope className="w-3 h-3" />
                <span>Deep Scan Intelligence</span>
             </div>
             <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6">
               Resume <span className="text-gradient">Intelligence</span>
             </h1>
             <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
               Bypass the filters. Our AI scans your resume against thousands of data points to ensure you're FAANG-ready.
             </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* UPLOAD SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <SpotlightCard className="p-8">
              <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">Analysis Terminal</h3>
              
              <div 
                className={cn(
                  "relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all group",
                  file ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/10 hover:border-white/20 bg-white/5"
                )}
              >
                <input 
                  type="file" 
                  onChange={handleUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept=".pdf,.doc,.docx"
                />
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-300 mb-1">
                  {file ? file.name : "Drop your resume here"}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">PDF, DOCX up to 5MB</p>
              </div>

              {/* Job Description Toggle */}
              <div className="mt-6">
                 <button 
                  onClick={() => setShowJDInput(!showJDInput)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors"
                 >
                    {showJDInput ? <X className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                    {showJDInput ? "Remove Job Context" : "Add Job Context (Matching)"}
                 </button>
                 
                 <AnimatePresence>
                   {showJDInput && (
                     <motion.div 
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden mt-4"
                     >
                        <textarea 
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste Job Description here for semantic matching..."
                          className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-all resize-none"
                        />
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              <GlowingButton 
                onClick={startAnalysis} 
                disabled={!file || loading}
                className="w-full mt-8 h-14"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Run Deep Scan <Zap className="w-4 h-4 ml-2" />
                  </>
                )}
              </GlowingButton>
            </SpotlightCard>

            {/* Quick Tips */}
            <SpotlightCard className="p-6">
               <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">ATS GUIDELINES</h4>
               <ul className="space-y-4">
                  {[
                    "Use standard section headers",
                    "Avoid complex tables and columns",
                    "Quantify your impact (metrics)",
                    "Include 50+ targeted keywords"
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                       <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                       {tip}
                    </li>
                  ))}
               </ul>
            </SpotlightCard>

            {/* History Section */}
            <SpotlightCard className="p-6">
               <div className="flex items-center gap-2 mb-6">
                  <History className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Intelligence History</h4>
               </div>
               
               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((h, i) => (
                    <button 
                      key={i}
                      onClick={() => setResult(h)}
                      className={cn(
                        "w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group",
                        result?._id === h._id ? "bg-indigo-500/10 border-indigo-500/30" : "bg-white/5 border-white/5 hover:border-white/10"
                      )}
                    >
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-white uppercase tracking-tighter truncate w-32">{h.filename}</p>
                          <p className="text-[9px] text-slate-500 font-bold">{new Date(h.createdAt).toLocaleDateString()}</p>
                       </div>
                       <div className="text-lg font-black text-indigo-400">{h.atsScore}%</div>
                    </button>
                  ))}
                  {history.length === 0 && (
                    <p className="text-[10px] text-slate-600 font-black uppercase text-center py-4">No past records</p>
                  )}
               </div>
            </SpotlightCard>
          </div>

          {/* RESULTS AREA */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Primary Metrics */}
                  <div className="grid sm:grid-cols-2 gap-6">
                     <ResultMetricCard 
                        label="Global ATS Score" 
                        value={result.atsScore} 
                        color="indigo" 
                        icon={ShieldCheck} 
                     />
                     <ResultMetricCard 
                        label="Job Alignment" 
                        value={result.roleMatch} 
                        color="fuchsia" 
                        icon={Target} 
                     />
                  </div>

                  {/* Section Breakdown & Radar Chart */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <SpotlightCard className="p-8">
                       <h3 className="text-sm font-black text-white mb-8 uppercase tracking-widest">Section Quality</h3>
                       <div className="space-y-6">
                          {[
                            { label: 'Experience', score: result.sectionScores.experience },
                            { label: 'Education', score: result.sectionScores.education },
                            { label: 'Skills', score: result.sectionScores.skills },
                            { label: 'Summary', score: result.sectionScores.summary }
                          ].map((section, i) => (
                            <div key={i} className="space-y-2">
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                  <span className="text-slate-500">{section.label}</span>
                                  <span className="text-white">{section.score}%</span>
                               </div>
                               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${section.score}%` }}
                                    className="h-full bg-indigo-500" 
                                  />
                               </div>
                            </div>
                          ))}
                       </div>
                    </SpotlightCard>

                    <SpotlightCard className="p-8">
                       <h3 className="text-sm font-black text-white mb-8 uppercase tracking-widest">Skill DNA Matrix</h3>
                       <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#1e293b" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
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

                  {/* Bullet Improvement Magic */}
                  <SpotlightCard className="p-8 border-indigo-500/20">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                           <Sparkles className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tighter">AI Bullet Optimization</h3>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Action-Oriented Transformations</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        {result.bulletImprovements?.map((item, i) => (
                          <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6 group hover:border-indigo-500/30 transition-all">
                             <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Original</p>
                                   <p className="text-xs text-slate-400 line-through decoration-rose-500/50 italic">"{item.original}"</p>
                                </div>
                                <div className="space-y-3">
                                   <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Improved (FAANG-Ready)</p>
                                   <p className="text-sm text-white font-bold leading-relaxed">{item.improved}</p>
                                </div>
                             </div>
                             <div className="pt-4 border-t border-white/5 flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-slate-500 font-medium italic">{item.reason}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </SpotlightCard>

                  {/* Keyword Analysis */}
                  <SpotlightCard className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">Keyword Intelligence</h3>
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase">Present</span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase">Missing</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {result.keywordHighlighting.map((item, i) => (
                         <div 
                          key={i}
                          className={cn(
                            "px-4 py-2 rounded-xl border flex items-center gap-2 transition-all",
                            item.status === 'present' 
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                              : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                          )}
                         >
                           {item.status === 'present' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                           <span className="text-xs font-bold uppercase tracking-wide">{item.keyword}</span>
                           <span className="text-[10px] opacity-40 italic">{item.type}</span>
                         </div>
                       ))}
                    </div>
                  </SpotlightCard>

                  {/* Strengths & Weaknesses */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                         <CheckCircle className="w-4 h-4" /> Strategic Strengths
                      </h4>
                      {result.strengths.map((s, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-sm text-slate-300">
                           {s}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                         <AlertCircle className="w-4 h-4" /> Critical Gaps
                      </h4>
                      {result.weaknesses.map((w, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-sm text-slate-300">
                           {w}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recruiter Insights */}
                  <SpotlightCard className="p-8 border-indigo-500/20 bg-indigo-500/[0.02]">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-indigo-400" />
                       </div>
                       <h3 className="text-xl font-black text-white uppercase tracking-tighter">Recruiter Direct-Feedback</h3>
                    </div>
                    <p className="text-lg text-slate-300 leading-relaxed font-medium italic">
                      "{result.recruiterInsights}"
                    </p>
                  </SpotlightCard>

                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-[48px] bg-white/[0.02]"
                >
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                     <LayoutDashboard className="w-12 h-12 text-slate-600" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4">No Analysis Session Active</h3>
                  <p className="text-slate-500 max-w-md mx-auto text-lg">
                    Upload your resume in the sidebar to start a deep scan and unlock recruiter-level insights.
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

const ResultMetricCard = ({ label, value, color, icon: Icon }: any) => {
  const colorMap: any = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    fuchsia: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20"
  };

  return (
    <SpotlightCard className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorMap[color])}>
           <Icon className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</h4>
      </div>
      <div className="flex items-end gap-3">
         <span className="text-6xl font-black text-white leading-none">{value}</span>
         <span className="text-lg font-bold text-slate-500 mb-1">%</span>
      </div>
      {/* Mini Bar */}
      <div className="w-full h-2 bg-white/5 rounded-full mt-8 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={cn("h-full", color === 'indigo' ? "bg-indigo-500" : "bg-fuchsia-500")} 
        />
      </div>
    </SpotlightCard>
  );
};
