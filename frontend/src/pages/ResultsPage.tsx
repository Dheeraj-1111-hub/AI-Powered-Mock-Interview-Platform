import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Sparkles, Brain, ShieldAlert, CheckCircle, 
  AlertCircle, ChevronRight, Activity, Download, ArrowLeft,
  Loader2, Zap, Target, Star
} from 'lucide-react';
import { getInterviewDetails } from '../services/api.service';
import { Navbar } from '../components/shared/Navbar';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { GlowingButton } from '../components/ui/GlowingButton';
import { cn } from '../utils/cn';

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const res = await getInterviewDetails(id!);
        setInterview(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const report = interview?.report || {
    summary: interview?.feedback || "Analysis in progress...",
    strengths: interview?.tags || ["Communication", "Engagement"],
    weaknesses: ["Technical Precision", "Scalability Depth"],
    recommendations: ["Review Distributed Systems", "Practice API Design"],
    verdict: interview?.overallScore >= 80 ? 'RECOMMENDED' : interview?.overallScore >= 60 ? 'CONSIDER' : 'DEVELOPMENT'
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 flex flex-col items-center justify-start p-6 relative overflow-x-hidden print:p-0 print:bg-white print:text-black">
       <div className="print:hidden">
         <Navbar />
       </div>
       
       <style dangerouslySetInnerHTML={{ __html: `
         @media print {
           .print\\:hidden { display: none !important; }
           .bg-grid-white { display: none !important; }
           .SpotlightCard { 
             background: white !important; 
             color: black !important; 
             border: 1px solid #e2e8f0 !important;
             box-shadow: none !important;
           }
           .text-white { color: black !important; }
           .text-slate-100 { color: black !important; }
           .text-slate-300 { color: #334155 !important; }
           .text-slate-400 { color: #64748b !important; }
           .text-slate-500 { color: #94a3b8 !important; }
           .bg-white\\/\\[0\\.02\\] { background: #f8fafc !important; }
           .bg-white\\/5 { background: #f1f5f9 !important; }
           .bg-indigo-500\\/5 { background: #eff6ff !important; }
           .text-indigo-400 { color: #4f46e5 !important; }
           .border-white\\/5 { border-color: #e2e8f0 !important; }
           body { background: white !important; }
         }
       `}} />

       {/* Cinematic Background */}
       <div className="fixed inset-0 bg-grid-white pointer-events-none opacity-20 print:hidden" />
       <div className="fixed top-0 left-1/4 w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none print:hidden" />

       <motion.div 
         initial={{ opacity: 0, y: 20 }} 
         animate={{ opacity: 1, y: 0 }} 
         className="max-w-6xl w-full relative z-10 pt-28 pb-20 space-y-8 print:pt-10 print:pb-10"
       >
          {/* Top Navigation */}
          <div className="flex items-center gap-4 mb-4 print:hidden">
             <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
             </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
             <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                   <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                      <Star className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Intelligence Briefing</span>
                   </div>
                   <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 text-slate-400">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{interview?.role}</span>
                   </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase print:text-black">
                   Performance <span className="text-indigo-400">Audit</span>
                </h1>
             </div>
             
             <div className="flex items-center justify-center gap-4 print:hidden">
                <button 
                  onClick={handleExportPDF}
                  className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
                >
                   <Download className="w-4 h-4" /> Export PDF
                </button>
                <GlowingButton onClick={() => navigate('/analytics')} className="h-14 px-8">
                   View Trends
                </GlowingButton>
             </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
             {/* Main Content */}
             <div className="xl:col-span-8 space-y-8">
                {/* Composite Score & Summary */}
                <div className="grid md:grid-cols-3 gap-6">
                   <SpotlightCard className="p-8 text-center flex flex-col justify-center bg-white/[0.02]">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Composite Score</p>
                      <div className="text-7xl font-black text-white mb-4 tracking-tighter">{interview?.overallScore || 0}</div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                         <motion.div 
                           initial={{ width: 0 }} 
                           animate={{ width: `${interview?.overallScore}%` }} 
                           className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                         />
                      </div>
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Mastery Level: {report.verdict}</p>
                   </SpotlightCard>

                   <div className="md:col-span-2">
                      <SpotlightCard className="p-8 h-full bg-white/[0.02]">
                         <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Executive Performance Summary</h3>
                         </div>
                         <p className="text-lg text-slate-300 leading-relaxed font-medium italic">
                            "{report.summary}"
                         </p>
                         <div className="mt-8 flex flex-wrap gap-3">
                            {report.strengths.map((tag: string, i: number) => (
                              <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                 {tag}
                              </span>
                            ))}
                         </div>
                      </SpotlightCard>
                   </div>
                </div>

                {/* Question Transcript */}
                <SpotlightCard className="p-8 bg-white/[0.02]">
                   <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                         <Activity className="w-5 h-5 text-emerald-400" />
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">Interaction Transcript</h3>
                      </div>
                   </div>
                   
                   <div className="space-y-6">
                      {interview?.rounds.flatMap((r: any) => r.questions).filter((q: any) => q.status === 'answered').map((q: any, i: number) => (
                         <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 group">
                            <div className="flex items-center justify-between mb-4">
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Query {i + 1}</span>
                               <div className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-black text-white uppercase tracking-widest">
                                  {q.evaluation?.score}% Match
                               </div>
                            </div>
                            <h4 className="text-md font-bold text-white mb-2">{q.text}</h4>
                            <p className="text-xs text-slate-400 italic">"{q.answer}"</p>
                         </div>
                      ))}
                   </div>
                </SpotlightCard>
             </div>

             {/* Sidebar: Verdict & Roadmap */}
             <div className="xl:col-span-4 space-y-8">
                <SpotlightCard className="p-8 bg-indigo-500/5 border-indigo-500/20 border-2">
                   <div className="text-center space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2">
                         <Target className="w-4 h-4 text-indigo-400" />
                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Verdict</span>
                      </div>
                      <div className="text-5xl font-black text-white tracking-tighter">{report.verdict}</div>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                         Based on {interview?.rounds.length} rounds of technical and behavioral assessment.
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
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Top Weaknesses</p>
                         <div className="space-y-2">
                            {report.weaknesses.map((w: string, i: number) => (
                               <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-200 text-[10px] font-bold uppercase tracking-widest">
                                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                                  {w}
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AI Roadmap</p>
                         <div className="space-y-2">
                            {report.recommendations.map((r: string, i: number) => (
                               <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-200 text-[10px] font-bold uppercase tracking-widest">
                                  <Zap className="w-4 h-4 shrink-0 text-indigo-400" />
                                  {r}
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </SpotlightCard>
             </div>
          </div>
       </motion.div>
    </div>
  );
}
