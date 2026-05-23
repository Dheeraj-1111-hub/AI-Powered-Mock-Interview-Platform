import { FormEvent, useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../services/auth.service';
import { loginUser, registerUser } from '../services/api.service';
import { GlowingButton } from '../components/ui/GlowingButton';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, Terminal, Globe } from 'lucide-react';
import { cn } from '../utils/cn';

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (!password) return { score: 0, label: '', color: 'bg-slate-800' };
  if (password.length > 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
};

export default function AuthPage() {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const payload = await loginUser({ email: form.email, password: form.password });
        const data = payload.data;
        localStorage.setItem('hireiq_token', data.token);
        localStorage.setItem('hireiq_user', JSON.stringify(data.user));
        setUser(data.user);
        
        if (!data.user.onboardingCompleted) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } else {
        const payload = await registerUser(form);
        setSuccess(payload.data.message);
        setTimeout(() => {
          setMode('login');
          setSuccess('');
        }, 3000);
        setForm({ name: '', email: '', password: '' });
      }
    } catch (err: any) {
      if (err.response?.data?.code === 'UNVERIFIED') {
        setError('Please check your email and verify your account before logging in.');
      } else {
        setError(err.response?.data?.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform: string) => {
    setSocialLoading(platform);
    setTimeout(() => {
      setSocialLoading(null);
      setError(`The ${platform} integration is currently in Sandbox mode.`);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] px-4 sm:px-6 relative overflow-hidden font-sans">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/[0.08] rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel rounded-[32px] p-8 sm:p-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/[0.01]">
          <div className="text-center mb-8">
            <motion.div 
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20 mb-8 shadow-[0_0_40px_rgba(99,102,241,0.2)]"
            >
              <span className="font-black text-2xl text-indigo-400 tracking-tighter">IQ</span>
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase tracking-tighter">
              {mode === 'login' ? 'System Access' : 'Create Identity'}
            </h1>
            <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              {mode === 'login' 
                ? 'Authentication required for platform entry' 
                : 'Initialize your career acceleration sequence'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
             <button 
               onClick={() => handleSocialLogin('Google')}
               disabled={!!socialLoading}
               className="flex items-center justify-center gap-3 h-12 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.06] transition-all disabled:opacity-50"
             >
                {socialLoading === 'Google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 text-rose-500" />}
                Google
             </button>
             <button 
               onClick={() => handleSocialLogin('Github')}
               disabled={!!socialLoading}
               className="flex items-center justify-center gap-3 h-12 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.06] transition-all disabled:opacity-50"
             >
                {socialLoading === 'Github' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4 text-white" />}
                Github
             </button>
          </div>

          <div className="relative mb-8">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
             <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-[#030303] px-4 text-slate-600">Secure Protocol</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="popLayout">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl bg-rose-500/10 p-4 border border-rose-500/20"
                >
                  <p className="text-[11px] font-bold text-rose-400 text-center uppercase tracking-wider">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-[11px] font-bold text-emerald-400 text-center uppercase tracking-wider">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-2xl border border-white/5 bg-white/[0.03] pl-12 pr-4 py-4 text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:bg-white/[0.06] font-bold text-sm shadow-inner"
                      placeholder="ENTER FULL NAME"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.03] pl-12 pr-4 py-4 text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:bg-white/[0.06] font-bold text-sm shadow-inner"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Key</label>
                {mode === 'login' && (
                  <Link to="/forgot-password" style={{ pointerEvents: 'none', opacity: 0.5 }} className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 tracking-tighter">
                    Recover Access
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.03] pl-12 pr-4 py-4 text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:bg-white/[0.06] font-bold text-sm shadow-inner"
                  placeholder="••••••••"
                />
              </div>
              {mode === 'register' && form.password.length > 0 && (
                <div className="mt-4 px-1">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Entropy Level</span>
                     <span className={cn("text-[9px] font-black uppercase tracking-widest", strength.score > 2 ? 'text-emerald-400' : 'text-slate-500')}>
                        {strength.label}
                     </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div 
                        key={step} 
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-500",
                          strength.score >= step ? strength.color : "bg-white/5"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <GlowingButton
              type="submit"
              className="w-full h-14 mt-6 text-xs"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="font-black uppercase tracking-[0.2em]">{mode === 'login' ? 'Establish Link' : 'Initialize Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </GlowingButton>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {mode === 'login' ? "New operative?" : "Existing operative?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setSuccess('');
                }}
                className="text-indigo-400 hover:text-indigo-300 transition-colors ml-2"
              >
                {mode === 'login' ? 'Request Access' : 'Authenticate'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
