import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, CheckCircle, Zap, Brain, ShieldAlert } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';
import { cn } from '../../utils/cn';

interface IntelligenceHubProps {
  evaluation?: any;
  hints: string[];
  warnings: string[];
  isAnalyzing: boolean;
}

export const IntelligenceHub = ({ evaluation, hints, warnings, isAnalyzing }: IntelligenceHubProps) => {
  return (
    <div className="hidden lg:flex w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-white/5 bg-black/40 flex-col p-6 gap-6 overflow-y-auto relative z-20">
      <div className="flex items-center gap-3 mb-2">
         <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-indigo-400" />
         </div>
         <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Intelligence Hub</h3>
      </div>

      {/* Real-time Scores */}
      {evaluation && (
        <SpotlightCard className="p-5 space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                 {evaluation.technicalCorrectness ? 'Technical Accuracy' : 'Logical Accuracy'}
              </span>
              <span className="text-sm font-black text-white">{evaluation.score}%</span>
           </div>
           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${evaluation.score}%` }} 
                className="h-full bg-indigo-500" 
              />
           </div>
           <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                 <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Confidence</p>
                 <p className={cn("text-[10px] font-bold uppercase", 
                    evaluation.confidence === 'Strong' ? "text-emerald-400" : "text-amber-400"
                 )}>{evaluation.confidence}</p>
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Clarity</p>
                 <p className="text-[10px] font-bold text-white uppercase">{evaluation.clarity}</p>
              </div>
           </div>
        </SpotlightCard>
      )}

      {/* AI Hints */}
      <div className="space-y-4">
         <div className="flex items-center gap-2 px-1">
            <Brain className="w-3 h-3 text-indigo-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Mentorship</span>
         </div>
         <AnimatePresence mode="popLayout">
            {hints.map((hint, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-indigo-200 leading-relaxed font-medium italic"
               >
                 "{hint}"
               </motion.div>
            ))}
         </AnimatePresence>
      </div>

      {/* Warnings / Mistakes */}
      {evaluation?.mistakes?.length > 0 && (
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Critical Gaps Detected</span>
           </div>
           <div className="space-y-2">
              {evaluation.mistakes.map((m: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-200 font-medium">
                   <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                   {m}
                </div>
              ))}
           </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="mt-auto p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
           <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
           <span className="text-[9px] font-black text-white uppercase tracking-widest animate-pulse">Running Neural Evaluation...</span>
        </div>
      )}
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
