import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, AlertTriangle, Info, CheckCircle2, ShieldAlert, Database } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isOpen: boolean;
  onClose: () => void;
  intelligence: any;
  careerBrain?: any;
}

export default function ReadinessExplainabilityDrawer({ isOpen, onClose, intelligence, careerBrain }: Props) {
  if (!intelligence) return null;

  const { readiness, systemConfidence, reasoning } = intelligence;
  const confidenceProfile = careerBrain?.confidenceProfile;
  const readinessBreakdown = careerBrain?.readinessBreakdown;
  const currentConfidence = confidenceProfile?.level || systemConfidence;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Calculator className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Readiness Math</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">System Calculation Logic</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Confidence Badge */}
              <div className={cn(
                "p-4 rounded-2xl border flex items-start gap-3",
                currentConfidence === 'LOW' ? "bg-rose-500/10 border-rose-500/20" :
                currentConfidence === 'MEDIUM' ? "bg-amber-500/10 border-amber-500/20" :
                "bg-emerald-500/10 border-emerald-500/20"
              )}>
                {currentConfidence === 'LOW' ? <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" /> :
                 currentConfidence === 'MEDIUM' ? <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /> :
                 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                <div>
                  <h3 className={cn("text-xs font-black uppercase tracking-widest mb-1", 
                    currentConfidence === 'LOW' ? "text-rose-400" :
                    currentConfidence === 'MEDIUM' ? "text-amber-400" : "text-emerald-400"
                  )}>
                    System Confidence: {currentConfidence}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {confidenceProfile?.reason || `Confidence is determined by the Data Sufficiency Multiplier (${readiness?.multiplier || 1.0}x).`}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Formula: Raw Score Components</h4>
                <div className="space-y-1 bg-white/5 border border-white/5 rounded-2xl p-2">
                  {readinessBreakdown?.components?.length > 0 ? (
                    readinessBreakdown.components.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{item.name}</span>
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest">Weight: {item.weight}%</span>
                        </div>
                        <span className="text-lg font-black text-white font-mono">{item.score}%</span>
                      </div>
                    ))
                  ) : (
                    [
                      { label: 'Coding Accuracy', value: readiness?.dsa || 0, weight: '40%', evidence: readiness?.evidence?.dsa },
                      { label: 'Interview Performance', value: readiness?.systemDesign || 0, weight: '30%', evidence: readiness?.evidence?.behavioral },
                      { label: 'Consistency Engine', value: readiness?.consistency || 0, weight: '15%', evidence: readiness?.evidence?.consistency },
                      { label: 'Optimization Quality', value: readiness?.optimization || 0, weight: '15%', evidence: readiness?.evidence?.optimization },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col p-3 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{item.label}</span>
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Weight: {item.weight}</span>
                          </div>
                          <span className="text-lg font-black text-white font-mono">{item.value}%</span>
                        </div>
                        {item.evidence && (
                           <div className="mt-2 pt-2 border-t border-white/5 flex items-start gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Database className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                              <p className="text-[10px] text-slate-400 leading-snug font-medium">{item.evidence}</p>
                           </div>
                        )}
                      </div>
                    ))
                  )}
                  <div className="mt-2 pt-3 border-t border-white/10 flex items-center justify-between px-3">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Raw Estimated Score</span>
                    <span className="text-xl font-black text-white font-mono">{readinessBreakdown?.total || readiness?.rawScore || 0}</span>
                  </div>
                </div>
              </div>

              {/* Evidence Engine Calculation */}
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Data Sufficiency Calibration</h4>
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-slate-400">Raw Score</div>
                    <div className="font-mono text-white">{readiness?.rawScore || 0}</div>
                  </div>
                  <div className="flex items-center justify-between mb-4 text-indigo-300">
                    <div className="text-sm font-medium">Reliability Multiplier</div>
                    <div className="font-mono font-bold">x {readiness?.multiplier || 1.0}</div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-indigo-500/20">
                    <div className="text-sm font-black text-white uppercase tracking-widest">Adjusted Score</div>
                    <div className="text-2xl font-black text-indigo-400 font-mono">{readiness?.overall || 0}</div>
                  </div>
                </div>
              </div>

              {/* System Reasoning */}
              {reasoning && reasoning.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Observed Evidence</h4>
                  <div className="space-y-2">
                    {reasoning.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-300 leading-relaxed">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="p-6 border-t border-white/5 bg-slate-950/50">
              <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">
                Data is refreshed after every coding submission or interview.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
