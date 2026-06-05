import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('../pages/LandingPage'));
const AuthPage = lazy(() => import('../pages/AuthPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const InterviewPage = lazy(() => import('../pages/InterviewPage'));
const AIPracticeRoom = lazy(() => import('../pages/AIPracticeRoom'));
const CollabRoom = lazy(() => import('../pages/CollabRoom'));
const CodingLabPage = lazy(() => import('../pages/CodingLabPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const VerifyEmailPage = lazy(() => import('../pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));
const OnboardingPage = lazy(() => import('../pages/OnboardingPage'));
const ResumePage = lazy(() => import('../pages/ResumePage'));
const CareerPage = lazy(() => import('../pages/CareerPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const ResultsPage = lazy(() => import('../pages/ResultsPage'));

// Shared Components
import { CustomCursor } from '../components/ui/CustomCursor';
import { PageTransition } from '../components/layout/PageTransition';
import { AuthContext, AuthUser } from '../services/auth.service';
import { CommandPalette } from '../components/ui/CommandPalette';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 bg-grid-white opacity-20 pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-8 relative z-10"
        >
           <div className="w-20 h-20 rounded-[40px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_80px_rgba(99,102,241,0.2)] animate-pulse relative">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_16px_rgba(99,102,241,0.8)]">
                <path d="M12.9868 2.0003L4.48682 12.0003H11.9868L10.9868 21.0003L20.4868 9.5003H12.9868L12.9868 2.0003Z" fill="url(#sparkGradientApp)" stroke="url(#sparkStrokeApp)" strokeWidth="1.5" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="sparkGradientApp" x1="4.48682" y1="2.0003" x2="20.4868" y2="21.0003" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#818cf8" />
                    <stop offset="1" stopColor="#3730a3" />
                  </linearGradient>
                  <linearGradient id="sparkStrokeApp" x1="4.48682" y1="2.0003" x2="20.4868" y2="21.0003" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#e0e7ff" />
                    <stop offset="1" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>
           </div>
           <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500">Establishing Neural Link</p>
              <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                 <motion.div 
                   initial={{ x: '-100%' }}
                   animate={{ x: '100%' }}
                   transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                   className="w-full h-full bg-indigo-500"
                 />
              </div>
           </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303]">
        <CustomCursor />
        <CommandPalette />
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <PageTransition><LandingPage /></PageTransition>} />
              <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
              <Route path="/verify-email" element={<PageTransition><VerifyEmailPage /></PageTransition>} />
              <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
              <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
              
              <Route path="/onboarding" element={user ? <PageTransition><OnboardingPage /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/dashboard" element={user ? <PageTransition><DashboardPage /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/resume" element={user ? <PageTransition><ResumePage /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/interview" element={user ? <PageTransition><InterviewPage /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/room" element={user ? <PageTransition><AIPracticeRoom /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/collab" element={user ? <PageTransition><CollabRoom /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/collab/:roomId" element={user ? <PageTransition><CollabRoom /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/coding" element={user ? <PageTransition><CodingLabPage /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/career" element={user ? <PageTransition><CareerPage /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/profile" element={user ? <PageTransition><ProfilePage /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/analytics" element={user ? <PageTransition><AnalyticsPage /></PageTransition> : <Navigate to="/auth" />} />
              <Route path="/results/:id" element={user ? <PageTransition><ResultsPage /></PageTransition> : <Navigate to="/auth" />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
    </div>
  );
}

function PageLoader() {
    return (
        <div className="h-screen bg-[#030303] flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Synchronizing Buffer...</p>
        </div>
    );
}

export default App;
