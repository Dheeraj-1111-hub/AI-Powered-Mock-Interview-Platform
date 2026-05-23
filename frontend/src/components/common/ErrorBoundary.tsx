import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-red-500/5 border border-red-500/20 p-8 rounded-3xl text-center space-y-6"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
               <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <div className="space-y-2">
               <h2 className="text-xl font-black text-white uppercase tracking-tight">Intelligence Recovery</h2>
               <p className="text-sm text-slate-400">
                  The AI engine encountered an unexpected anomaly. We've captured the diagnostics.
               </p>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full p-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-slate-200 transition-all"
            >
               <RotateCcw className="w-4 h-4" />
               Restart Engine
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
