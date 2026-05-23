import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../services/auth.service';
import { completeOnboarding } from '../services/api.service';
import { GlowingButton } from '../components/ui/GlowingButton';
import { Briefcase, Code2, GraduationCap, CheckCircle2, ChevronRight, Loader2, Target, Zap, Rocket } from 'lucide-react';
import { cn } from '../utils/cn';

const ROLES = ['Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'Data Scientist', 'Product Manager'];
const EXPERIENCES = ['Entry Level (0-2 yrs)', 'Mid Level (3-5 yrs)', 'Senior (5+ yrs)'];
const SKILLS_LIST = ['React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'TypeScript', 'System Design'];

export default function OnboardingPage() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await completeOnboarding({ role, experience, skills });
      const updatedUser = res.data.user;
      localStorage.setItem('hireiq_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !role) return;
    if (step === 2 && !experience) return;
    if (step === 3 && skills.length === 0) return;
    
    if (step === 3) {
      handleComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] px-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/[0.05] rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse" />
      
      <div className="w-full max-w-2xl relative z-10">
        <div className="glass-panel rounded-[40px] p-8 sm:p-14 border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden min-h-[600px] flex flex-col bg-white/[0.01]">
          
          {/* Progress Protocol */}
          <div className="flex items-center justify-between mb-16 px-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all duration-500 border",
                  step >= i 
                    ? "bg-indigo-500 border-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]" 
                    : "bg-white/5 border-white/5 text-slate-600"
                )}>
                  {step > i ? <CheckCircle2 className="w-5 h-5" /> : `0${i}`}
                </div>
                {i < 3 && (
                  <div className={cn(
                    "h-px flex-1 mx-4 rounded-full transition-all duration-1000",
                    step > i ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-white/5"
                  )} />
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-8"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                       <Target className="w-5 h-5 text-indigo-400" />
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Phase 01: Specialization</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Define Your Vector</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">Select your target operational role for calibrated interview simulation.</p>
                  </div>
                  <div className="grid gap-4">
                    {ROLES.map(r => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={cn(
                          "w-full flex items-center justify-between p-6 rounded-2xl border transition-all group",
                          role === r 
                            ? "bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                            : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center">
                           <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-colors", role === r ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-600")}>
                              <Briefcase className="w-5 h-5" />
                           </div>
                           <span className="font-bold uppercase tracking-widest text-xs">{r}</span>
                        </div>
                        {role === r && <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-8"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                       <Rocket className="w-5 h-5 text-indigo-400" />
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Phase 02: Calibration</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Seniority Level</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">We adjust challenge heuristics based on your career timeline.</p>
                  </div>
                  <div className="grid gap-4">
                    {EXPERIENCES.map(e => (
                      <button
                        key={e}
                        onClick={() => setExperience(e)}
                        className={cn(
                          "w-full flex items-center justify-between p-6 rounded-2xl border transition-all group",
                          experience === e 
                            ? "bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                            : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center">
                           <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-colors", experience === e ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-600")}>
                              <GraduationCap className="w-5 h-5" />
                           </div>
                           <span className="font-bold uppercase tracking-widest text-xs">{e}</span>
                        </div>
                        {experience === e && <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-8"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                       <Code2 className="w-5 h-5 text-indigo-400" />
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Phase 03: Arsenal</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Primary Stack</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">Select the technologies you want to master through AI simulation.</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {SKILLS_LIST.map(s => {
                      const isSelected = skills.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleSkill(s)}
                          className={cn(
                            "flex items-center px-6 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest",
                            isSelected 
                              ? "bg-indigo-500 text-white border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.3)]" 
                              : "bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/[0.05] hover:border-white/20"
                          )}
                        >
                          <Zap className={cn("w-3 h-3 mr-3", isSelected ? "text-white" : "text-slate-700")} />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-16 flex justify-between items-center">
             <button 
               onClick={() => step > 1 && setStep(s => s - 1)}
               disabled={step === 1}
               className={cn("text-[10px] font-black uppercase tracking-widest transition-all", step === 1 ? "opacity-0" : "text-slate-600 hover:text-white")}
             >
                Go Back
             </button>
             <GlowingButton 
              onClick={nextStep} 
              disabled={
                (step === 1 && !role) || 
                (step === 2 && !experience) || 
                (step === 3 && skills.length === 0) ||
                loading
              }
              className="h-14 px-10 text-xs"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-black uppercase tracking-[0.2em]">{step === 3 ? 'Finalize Protocol' : 'Continue Sequence'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </GlowingButton>
          </div>
          
        </div>
      </div>
    </div>
  );
}
