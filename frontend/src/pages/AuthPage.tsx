import { FormEvent, useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../services/auth.service';
import { loginUser, registerUser } from '../services/api.service';
import { GlowingButton } from '../components/ui/GlowingButton';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
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


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] px-4 sm:px-6 relative overflow-hidden font-sans">
      {/* Ultra-Minimal Premium Background */}
      <div className="absolute inset-0 bg-[#000000] z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_50%)] z-0 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="relative rounded-2xl p-8 sm:p-12 border border-white/[0.08] shadow-[0_0_100px_rgba(0,0,0,1)] bg-[#050505]">
          <div className="text-center mb-8">
            <motion.div 
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20 mb-8 shadow-[0_0_40px_rgba(99,102,241,0.2)] relative"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_12px_rgba(99,102,241,0.8)]">
                <path d="M12.9868 2.0003L4.48682 12.0003H11.9868L10.9868 21.0003L20.4868 9.5003H12.9868L12.9868 2.0003Z" fill="url(#sparkGradientAuth)" stroke="url(#sparkStrokeAuth)" strokeWidth="1.5" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="sparkGradientAuth" x1="4.48682" y1="2.0003" x2="20.4868" y2="21.0003" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" />
                    <stop offset="1" stopColor="#a3a3a3" />
                  </linearGradient>
                  <linearGradient id="sparkStrokeAuth" x1="4.48682" y1="2.0003" x2="20.4868" y2="21.0003" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" />
                    <stop offset="1" stopColor="#525252" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {mode === 'login' 
                ? 'Enter your credentials to continue' 
                : 'Initialize your career acceleration sequence'}
            </p>
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
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Full Name</label>
                  <div className="relative group/input">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="peer w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-10 pr-4 py-3.5 text-white placeholder-slate-600 outline-none transition-colors focus:border-white/20 focus:bg-white/[0.04] text-sm"
                      placeholder="Enter full name"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 peer-focus:text-white transition-colors pointer-events-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Work Email</label>
              <div className="relative group/input">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="peer w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-10 pr-4 py-3.5 text-white placeholder-slate-600 outline-none transition-colors focus:border-white/20 focus:bg-white/[0.04] text-sm"
                  placeholder="name@company.com"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 peer-focus:text-white transition-colors pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1 mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                {mode === 'login' && (
                  <Link to="/forgot-password" style={{ pointerEvents: 'none', opacity: 0.5 }} className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative group/input">
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="peer w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-10 pr-4 py-3.5 text-white placeholder-slate-600 outline-none transition-colors focus:border-white/20 focus:bg-white/[0.04] text-sm"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 peer-focus:text-white transition-colors pointer-events-none" />
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
                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold">{mode === 'login' ? 'Continue' : 'Create account'}</span>
                  <ArrowRight className="h-4 w-4 opacity-70" />
                </div>
              )}
            </GlowingButton>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-400">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setSuccess('');
                }}
                className="text-white hover:underline transition-all ml-1 font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
