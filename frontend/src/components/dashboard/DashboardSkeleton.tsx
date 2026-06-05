import { Brain } from 'lucide-react';
import { Navbar } from '../shared/Navbar';
import { motion } from 'framer-motion';

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 font-sans overflow-hidden flex flex-col relative">
      <Navbar />
      <div className="fixed inset-0 bg-grid-white pointer-events-none opacity-40" />
      
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse" />
      
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        
        {/* Core Container */}
        <div className="relative flex items-center justify-center mb-12">
           {/* Neural Rings */}
           <motion.div 
             animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             className="absolute w-40 h-40 border border-indigo-500/30 rounded-full"
           />
           <motion.div 
             animate={{ scale: [1, 2, 1], opacity: [0.1, 0, 0.1] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
             className="absolute w-40 h-40 border border-indigo-500/20 rounded-full"
           />

           {/* Fixed Center Icon */}
           <motion.div
             animate={{ scale: [1, 1.05, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="relative z-10 w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_50px_rgba(99,102,241,0.2)]"
           >
             <Brain className="w-12 h-12 text-indigo-400" />
           </motion.div>
        </div>

        {/* Cinematic Text */}
        <div className="flex flex-col items-center gap-4">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="flex gap-2"
           >
             {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                />
             ))}
           </motion.div>
           
           <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-[0.3em] text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
             Calibrating Career Intelligence
           </h2>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
             Accessing Neural Synapses
           </p>
        </div>
      </main>
    </div>
  );
};
