import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowUpCircle, ArrowDownCircle, Flame, Trophy, AlertTriangle, Briefcase, MessagesSquare } from 'lucide-react';
import { getActivityFeed } from '../../services/api.service';
import { cn } from '../../utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface IntelligenceEvent {
  _id: string;
  type: 'skill_improved' | 'skill_declined' | 'roadmap_completed' | 'interview_completed' | 'streak_milestone' | 'optimization_detected' | 'optimization_missing' | 'resume_improved' | 'mentor_intervention' | 'recovery_required';
  eventType?: 'FACT' | 'INFERENCE' | 'SYSTEM';
  title: string;
  description: string;
  delta?: number;
  createdAt: string;
}

export default function ActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['activityFeed'],
    queryFn: async () => {
      const res = await getActivityFeed();
      return res.data.events as IntelligenceEvent[];
    },
    refetchInterval: 15000, // Poll every 15s per architecture spec
  });

  const events = data || [];

  const getIcon = (type: string) => {
    switch (type) {
      case 'skill_improved': 
      case 'optimization_detected':
      case 'resume_improved':
        return <ArrowUpCircle className="w-5 h-5 text-emerald-400" />;
      case 'skill_declined':
      case 'optimization_missing':
        return <ArrowDownCircle className="w-5 h-5 text-red-400" />;
      case 'streak_milestone': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'roadmap_completed': 
      case 'interview_completed':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'mentor_intervention': return <MessagesSquare className="w-5 h-5 text-indigo-400" />;
      case 'recovery_required': return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default: return <Activity className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getEventStyles = (eventType?: string) => {
    switch (eventType) {
      case 'INFERENCE':
        return 'bg-violet-950/10 border-violet-500/30 border-dashed hover:border-violet-500/50';
      case 'SYSTEM':
        return 'bg-blue-950/10 border-blue-500/20 hover:border-blue-500/40 border-l-4 border-l-blue-500';
      case 'FACT':
      default:
        return 'bg-zinc-950 border-zinc-800/50 hover:border-zinc-700 border-l-4 border-l-emerald-500/50';
    }
  };

  const getEventLabel = (eventType?: string) => {
    switch (eventType) {
      case 'INFERENCE': return <span className="text-[9px] font-black uppercase text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">Inference</span>;
      case 'SYSTEM': return <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">System</span>;
      case 'FACT': 
      default: return <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Fact</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 min-h-[300px] flex items-center justify-center animate-pulse">
        <Activity className="w-6 h-6 text-zinc-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[500px]">
      <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between">
        <h3 className="font-medium text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Intelligence Feed
        </h3>
        <span className="text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Updates
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {events.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No recent intelligence events. Complete tasks to generate activity.
          </div>
        ) : (
          <AnimatePresence>
            {events.map((event, index) => (
              <motion.div
                key={event._id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-6 before:absolute before:left-2 before:top-6 before:bottom-[-24px] before:w-px before:bg-zinc-800 last:before:hidden"
              >
                <div className="absolute left-[-2px] top-1 bg-zinc-900 p-0.5 rounded-full z-10">
                  {getIcon(event.type)}
                </div>
                <div className={cn("p-3 rounded-lg transition-colors flex flex-col gap-2", getEventStyles(event.eventType))}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getEventLabel(event.eventType)}
                        <p className="text-sm font-medium text-white">{event.title}</p>
                      </div>
                      <p className="text-sm text-zinc-400 leading-snug">
                        {event.description}
                      </p>
                    </div>
                    {event.delta !== undefined && (
                      <span className={cn(
                        "text-xs font-mono font-medium whitespace-nowrap bg-white/5 px-2 py-1 rounded-md mt-1 shrink-0",
                        event.delta > 0 ? "text-emerald-400" : 
                        event.delta < 0 ? "text-red-400" : "text-zinc-400"
                      )}>
                        {event.delta > 0 ? '+' : ''}{event.delta} XP
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
