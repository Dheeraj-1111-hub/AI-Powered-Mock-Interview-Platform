import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, MessageSquare, Code2, 
  Target, BarChart3, FileText, Search, Settings 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <Command.Dialog 
          open={open} 
          onOpenChange={setOpen} 
          label="Global Command Menu"
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl bg-slate-950/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="flex items-center px-4 border-b border-white/5">
              <Search className="w-4 h-4 text-slate-500 mr-3" />
              <Command.Input 
                placeholder="Search commands or pages..." 
                className="w-full h-14 bg-transparent text-white outline-none placeholder:text-slate-500 text-sm"
              />
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
              <Command.Empty className="py-6 text-center text-slate-500 text-sm">No results found.</Command.Empty>

              <Command.Group heading="Navigation" className="px-2 pt-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Item onSelect={() => runCommand(() => navigate('/dashboard'))} icon={LayoutDashboard}>Dashboard</Item>
                <Item onSelect={() => runCommand(() => navigate('/room'))} icon={MessageSquare}>Interview Room</Item>
                <Item onSelect={() => runCommand(() => navigate('/coding'))} icon={Code2}>Coding Lab</Item>
                <Item onSelect={() => runCommand(() => navigate('/career'))} icon={Target}>Career AI</Item>
                <Item onSelect={() => runCommand(() => navigate('/resume'))} icon={FileText}>Resume Analyzer</Item>
                <Item onSelect={() => runCommand(() => navigate('/analytics'))} icon={BarChart3}>Detailed Analytics</Item>
              </Command.Group>

              <Command.Group heading="Quick Actions" className="px-2 pt-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Item onSelect={() => runCommand(() => navigate('/profile'))} icon={Settings}>Engineering DNA Profile</Item>
              </Command.Group>
            </Command.List>

            <div className="bg-slate-900/50 px-4 py-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <div className="flex gap-4">
                <span><kbd className="bg-white/5 px-1.5 py-0.5 rounded mr-1">↵</kbd> Select</span>
                <span><kbd className="bg-white/5 px-1.5 py-0.5 rounded mr-1">↑↓</kbd> Navigate</span>
              </div>
              <div>
                <span>Press <kbd className="bg-white/5 px-1.5 py-0.5 rounded mx-1">ESC</kbd> to close</span>
              </div>
            </div>
          </motion.div>
        </Command.Dialog>
      )}
    </AnimatePresence>
  );
};

const Item = ({ children, icon: Icon, onSelect }: { children: React.ReactNode, icon: any, onSelect?: () => void }) => {
  return (
    <Command.Item 
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white aria-selected:bg-white/5 aria-selected:text-white transition-all cursor-pointer group"
    >
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      {children}
    </Command.Item>
  );
};
