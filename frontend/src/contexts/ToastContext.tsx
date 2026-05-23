import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, Sparkles, Trophy } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'xp' | 'milestone';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (title: string, description?: string, type?: ToastType) => void;
  xpToast: (xp: number, reason: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, description?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const xpToast = useCallback((xp: number, reason: string) => {
    addToast(`+${xp} XP`, reason, 'xp');
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, xpToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl w-[320px] ${
                t.type === 'xp' ? 'bg-indigo-950/80 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]' :
                t.type === 'milestone' ? 'bg-amber-950/80 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]' :
                'bg-slate-900/90 border-white/10'
              }`}
            >
              <div className="mt-0.5">
                {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                {t.type === 'xp' && <Sparkles className="w-5 h-5 text-indigo-400" />}
                {t.type === 'milestone' && <Trophy className="w-5 h-5 text-amber-400" />}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${
                  t.type === 'xp' ? 'text-indigo-100' :
                  t.type === 'milestone' ? 'text-amber-100' :
                  'text-white'
                }`}>
                  {t.title}
                </h4>
                {t.description && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
