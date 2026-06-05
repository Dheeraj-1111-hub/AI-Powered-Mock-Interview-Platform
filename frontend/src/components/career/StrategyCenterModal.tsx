import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Crosshair, Briefcase, Zap, Clock, ShieldAlert, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { previewStrategyShift, shiftStrategy } from '../../services/api.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeStrategy: any;
  careerStrategies: any[];
  onStrategyUpdated: () => void;
}

const MODES = [
  { id: 'faang_sprint', name: 'FAANG Sprint', desc: 'DSA, Algorithms & extreme optimization.' },
  { id: 'startup_builder', name: 'Startup Builder', desc: 'Shipping speed & full-stack architecture.' },
  { id: 'placement_survival', name: 'Placement Survival', desc: 'Aptitude, medium DSA & behavioral.' },
  { id: 'ai_engineer_track', name: 'AI Engineer', desc: 'ML, data pipelines & research.' },
];

export default function StrategyCenterModal({ isOpen, onClose, activeStrategy, careerStrategies, onStrategyUpdated }: Props) {
  const [targetCompany, setTargetCompany] = useState(activeStrategy?.targetCompany || 'Google');
  const [targetRole, setTargetRole] = useState(activeStrategy?.targetRole || 'Software Engineer');
  const [selectedMode, setSelectedMode] = useState(activeStrategy?.mode || 'faang_sprint');
  
  const [preview, setPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  const fetchPreview = async (mode: string) => {
    setSelectedMode(mode);
    setLoadingPreview(true);
    try {
      const res = await previewStrategyShift({ newMode: mode });
      setPreview(res.data);
    } catch (error) {
      console.error(error);
    }
    setLoadingPreview(false);
  };

  const handleSave = async () => {
    setLoadingSave(true);
    try {
      await shiftStrategy({
        targetCompany,
        targetRole,
        newMode: selectedMode,
        whyStrategyChanged: `Manually shifted to ${selectedMode} targeting ${targetCompany}`
      });
      onStrategyUpdated();
      onClose();
    } catch (error) {
      console.error(error);
    }
    setLoadingSave(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/5 bg-slate-950/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Career Strategy Center</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Dynamic Identity Management</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Identity Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Target Company</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  value={targetCompany} onChange={e => setTargetCompany(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-indigo-500/50 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Target Role</label>
              <div className="relative">
                <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  value={targetRole} onChange={e => setTargetRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-indigo-500/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Career Modes */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Career Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => fetchPreview(mode.id)}
                  className={cn(
                    "text-left p-4 rounded-2xl border transition-all relative overflow-hidden group",
                    selectedMode === mode.id 
                      ? "bg-indigo-500/10 border-indigo-500/50" 
                      : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  <div className="relative z-10">
                    <h3 className={cn("text-sm font-bold mb-1", selectedMode === mode.id ? "text-indigo-400" : "text-white")}>
                      {mode.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{mode.desc}</p>
                  </div>
                  {selectedMode === mode.id && (
                    <div className="absolute top-3 right-3">
                      <Check className="w-4 h-4 text-indigo-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <AnimatePresence>
            {preview && selectedMode !== activeStrategy?.mode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex gap-3 items-start mb-4">
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-400">Strategic Shift Detected</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Switching to {preview.targetMode} will alter your roadmap priorities. Here's what changes:
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 pl-8">
                    {Object.entries(preview.deltas || {}).map(([key, value]: any) => {
                      if (value === 0) return null;
                      const isPositive = value > 0;
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-slate-300 capitalize">{key} Focus</span>
                          <span className={cn("text-xs font-bold font-mono", isPositive ? "text-emerald-400" : "text-rose-400")}>
                            {isPositive ? '+' : ''}{value}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Historical Strategies */}
          {careerStrategies?.filter(s => s.state === 'archived').length > 0 && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Archived Strategies</label>
              <div className="space-y-2">
                {careerStrategies.filter(s => s.state === 'archived').map(s => (
                  <div key={s._id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white mb-0.5">{s.targetRole} <span className="text-slate-500 font-normal">@ {s.targetCompany}</span></p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{MODES.find(m => m.id === s.mode)?.name || s.mode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-indigo-400">Peak: {s.peakReadiness || 0}%</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                        {new Date(s.archivedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-white/5 bg-slate-950/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Apply Strategic Shift
          </button>
        </div>
      </motion.div>
    </div>
  );
}
