import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../services/api.service';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { GlowingButton } from '../components/ui/GlowingButton';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      
      <div className="w-full max-w-md relative z-10 glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl">
        <Link to="/auth" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
        </Link>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mb-2">
            Reset password
          </h1>
          <p className="text-sm text-slate-400">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl bg-emerald-500/10 p-6 border border-emerald-500/20 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-emerald-400 font-medium mb-2">Check your email</h3>
            <p className="text-sm text-emerald-400/80 mb-6">
              We've sent a password reset link to {email}
            </p>
            <GlowingButton onClick={() => navigate('/auth')} variant="secondary" className="w-full">
              Return to login
            </GlowingButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-rose-500/10 p-4 border border-rose-500/20">
                <p className="text-sm text-rose-400 text-center">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <GlowingButton
              type="submit"
              className="w-full py-3.5"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send reset link'}
            </GlowingButton>
          </form>
        )}
      </div>
    </div>
  );
}
