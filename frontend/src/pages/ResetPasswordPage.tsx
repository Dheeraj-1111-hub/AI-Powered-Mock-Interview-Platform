import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/api.service';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { GlowingButton } from '../components/ui/GlowingButton';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      
      <div className="w-full max-w-md relative z-10 glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mb-2">
            Create new password
          </h1>
          <p className="text-sm text-slate-400">
            Please enter your new password below.
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl bg-emerald-500/10 p-6 border border-emerald-500/20 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-emerald-400 font-medium mb-6">Password Reset Successful</h3>
            <GlowingButton onClick={() => navigate('/auth')} variant="primary" className="w-full">
              Proceed to Login
            </GlowingButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-rose-500/10 p-4 border border-rose-500/20">
                <p className="text-sm text-rose-400 text-center">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <GlowingButton
              type="submit"
              className="w-full py-3.5 mt-6"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset password'}
            </GlowingButton>
          </form>
        )}
      </div>
    </div>
  );
}
