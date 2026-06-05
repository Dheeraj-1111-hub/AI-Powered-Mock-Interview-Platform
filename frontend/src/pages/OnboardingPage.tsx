import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../services/auth.service';
import { completeOnboarding } from '../services/api.service';
import { GlowingButton } from '../components/ui/GlowingButton';
import { Briefcase, Code2, GraduationCap, CheckCircle2, ChevronRight, Loader2, Target, Zap, Rocket, Search, X } from 'lucide-react';
import { cn } from '../utils/cn';

const ROLES = [
  'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'Mobile Engineer',
  'DevOps Engineer', 'Cloud Engineer', 'Platform Engineer', 'Data Engineer',
  'Data Scientist', 'ML Engineer', 'AI Engineer', 'Generative AI Engineer',
  'MLOps Engineer', 'Security Engineer', 'QA Engineer', 'Product Manager',
  'Engineering Manager', 'System Design Specialist'
];

const EXPERIENCES = [
  'Student', 'Intern', 'New Grad', 'Junior', 'Mid-Level', 'Senior', 
  'Staff', 'Principal', 'Architect', 'Engineering Manager'
];

const SKILLS_LIST = [
  'React', 'NextJS', 'Angular', 'Vue', 'NodeJS', 'Express', 'NestJS',
  'Python', 'FastAPI', 'Django', 'Java', 'Spring Boot', 'Go', 'Rust',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'LangChain', 'LangGraph',
  'OpenAI', 'TensorFlow', 'PyTorch', 'Redis', 'PostgreSQL', 'MongoDB'
];

export default function OnboardingPage() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [roleSearch, setRoleSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  const filteredRoles = ROLES.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase()));
  const filteredSkills = SKILLS_LIST.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !skills.includes(s));

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
                  className="space-y-8 flex flex-col h-full"
                >
                  <div className="shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                       <Target className="w-5 h-5 text-indigo-400" />
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Phase 01: Specialization</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Define Your Vector</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed mb-6">Search and select your target operational role for calibrated simulation.</p>
                    
                    <div className="relative mb-6">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input 
                        type="text" 
                        value={roleSearch}
                        onChange={(e) => setRoleSearch(e.target.value)}
                        placeholder="Search roles (e.g. AI Engineer)..."
                        className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-0 h-[300px]">
                    {filteredRoles.length > 0 ? filteredRoles.map(r => (
                      <button
                        key={r}
                        onClick={() => { setRole(r); setRoleSearch(''); }}
                        className={cn(
                          "w-full flex items-center justify-between p-5 rounded-2xl border transition-all group",
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
                    )) : (
                      <div className="text-center py-8 text-slate-500">No roles found matching "{roleSearch}"</div>
                    )}
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
                  className="space-y-8 flex flex-col h-full"
                >
                  <div className="shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                       <Rocket className="w-5 h-5 text-indigo-400" />
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Phase 02: Calibration</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Seniority Level</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">We adjust challenge heuristics based on your career timeline.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 h-[400px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {EXPERIENCES.map(e => (
                        <button
                          key={e}
                          onClick={() => setExperience(e)}
                          className={cn(
                            "flex items-center p-4 rounded-2xl border transition-all group text-left",
                            experience === e 
                              ? "bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                              : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:border-white/20"
                          )}
                        >
                           <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 transition-colors", experience === e ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-600")}>
                              <GraduationCap className="w-5 h-5" />
                           </div>
                           <span className="font-bold uppercase tracking-widest text-[10px] leading-tight flex-1">{e}</span>
                           {experience === e && <Zap className="w-4 h-4 text-indigo-400 animate-pulse ml-2 shrink-0" />}
                        </button>
                      ))}
                    </div>
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
                  className="space-y-8 flex flex-col h-full"
                >
                  <div className="shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                       <Code2 className="w-5 h-5 text-indigo-400" />
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Phase 03: Arsenal</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Primary Stack</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed mb-6">Search and select the technologies you want to master.</p>
                    
                    <div className="relative mb-4">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input 
                        type="text" 
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        placeholder="Search skills (e.g. Kubernetes, React)..."
                        className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                      />
                    </div>

                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4 p-4 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl min-h-[60px]">
                        {skills.map(s => (
                          <div key={s} className="flex items-center gap-2 bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase">
                            {s}
                            <button onClick={() => toggleSkill(s)} className="hover:text-rose-300 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 h-[250px]">
                    <div className="flex flex-wrap gap-3">
                      {filteredSkills.map(s => (
                        <button
                          key={s}
                          onClick={() => { toggleSkill(s); setSkillSearch(''); }}
                          className="flex items-center px-5 py-3 rounded-xl border bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Code2 className="w-3 h-3 mr-2 text-slate-600" />
                          {s}
                        </button>
                      ))}
                      {filteredSkills.length === 0 && (
                        <div className="w-full text-center py-8 text-slate-500">No new skills found matching "{skillSearch}"</div>
                      )}
                    </div>
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
