import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface PageLoaderProps {
  /** Optional override for the status line beneath the dots */
  message?: string;
}

/**
 * Unified cinematic full-screen loader for HireIQ.
 * Matches the "ESTABLISHING NEURAL LINK" design shown on the live site.
 * Use this for every page-level data-fetch loading state.
 */
export const PageLoader = ({ message = 'ESTABLISHING NEURAL LINK' }: PageLoaderProps) => {
  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center relative overflow-hidden">

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Deep ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Icon cluster */}
      <div className="relative flex items-center justify-center mb-10">

        {/* Outermost expanding ring */}
        <motion.div
          className="absolute w-36 h-36 rounded-full border border-indigo-500/20"
          animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Middle expanding ring */}
        <motion.div
          className="absolute w-36 h-36 rounded-full border border-indigo-500/15"
          animate={{ scale: [1, 2.2, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />

        {/* Inner expanding ring */}
        <motion.div
          className="absolute w-36 h-36 rounded-full border border-indigo-500/10"
          animate={{ scale: [1, 2.6, 1], opacity: [0.1, 0, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        />

        {/* Core icon circle */}
        <motion.div
          className="relative z-10 w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center backdrop-blur-md"
          animate={{
            boxShadow: [
              '0 0 30px rgba(99,102,241,0.15)',
              '0 0 70px rgba(99,102,241,0.45)',
              '0 0 30px rgba(99,102,241,0.15)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Zap
              className="w-9 h-9 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.9)]"
              fill="currentColor"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Bouncing dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-2 mb-5"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
            animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {/* Status text */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400 text-center select-none"
      >
        {message}
      </motion.p>
    </div>
  );
};
