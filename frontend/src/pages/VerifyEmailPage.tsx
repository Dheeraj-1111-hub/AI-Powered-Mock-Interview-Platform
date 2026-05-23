import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../services/api.service';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { GlowingButton } from '../components/ui/GlowingButton';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await verifyEmail({ token });
        setStatus('success');
        setMessage(res.data.message);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. Token may be invalid or expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full glass-panel rounded-3xl p-10 text-center border border-white/10 shadow-2xl">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Email</h2>
            <p className="text-slate-400">Please wait while we verify your account...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-slate-400 mb-8">{message}</p>
            <GlowingButton onClick={() => navigate('/auth')} className="w-full">
              Proceed to Login
            </GlowingButton>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-slate-400 mb-8">{message}</p>
            <GlowingButton onClick={() => navigate('/auth')} variant="secondary" className="w-full">
              Back to Login
            </GlowingButton>
          </div>
        )}
      </div>
    </div>
  );
}
