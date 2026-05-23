import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Clock, Code2, Brain, FileText, ChevronRight, Play, Loader2 } from 'lucide-react';
import { getTodayFocus, completeTodayTask } from '../../services/api.service';
import { cn } from '../../utils/cn';

interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  type: 'solve' | 'interview' | 'learn' | 'review';
  estMinutes: number;
}

export default function TodayEngine({ onXPUpdate }: { onXPUpdate?: (xp: number) => void }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [executingTask, setExecutingTask] = useState<string | null>(null);

  useEffect(() => {
    loadFocus();
  }, []);

  const handleExecute = async (task: DailyTask) => {
    setExecutingTask(task.id);
    // Simulate system intelligence pre-loading
    await new Promise(resolve => setTimeout(resolve, 800));
    setExecutingTask(null);

    if (task.type === 'solve' || task.type === 'learn') {
      navigate('/coding');
    } else if (task.type === 'interview') {
      navigate('/interview');
    } else {
      navigate('/analytics');
    }
  };

  const loadFocus = async () => {
    try {
      const res = await getTodayFocus();
      let loadedTasks = res.data.dailyFocus?.tasks || [];
      
      // Never show an empty state. If API returns nothing, provide intelligent fallbacks.
      if (loadedTasks.length === 0) {
        loadedTasks = [
          { id: 'fallback-1', title: 'Review System Design Fundamentals', completed: false, type: 'learn', estMinutes: 30 },
          { id: 'fallback-2', title: 'Complete 2 Random Medium DSA Problems', completed: false, type: 'solve', estMinutes: 45 },
          { id: 'fallback-3', title: 'Update Resume Impact Metrics', completed: false, type: 'review', estMinutes: 15 },
        ];
      }
      
      setTasks(loadedTasks);
    } catch (err) {
      console.error('Failed to load today focus:', err);
      // Provide fallbacks on error as well
      setTasks([
        { id: 'err-1', title: 'Warm up: Array Manipulation', completed: false, type: 'solve', estMinutes: 20 },
        { id: 'err-2', title: 'Read about Database Indexing', completed: false, type: 'learn', estMinutes: 25 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      setCompletingTask(taskId);
      const res = await completeTodayTask(taskId);
      if (res.data.success) {
        setTasks(res.data.dailyFocus.tasks);
        if (onXPUpdate && res.data.xp) {
          onXPUpdate(res.data.xp);
        }
      }
    } catch (err) {
      console.error('Failed to complete task', err);
    } finally {
      setCompletingTask(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'solve': return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'interview': return <Brain className="w-4 h-4 text-purple-400" />;
      case 'learn': return <FileText className="w-4 h-4 text-blue-400" />;
      default: return <Target className="w-4 h-4 text-zinc-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-48 flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-t-2 border-emerald-500 animate-spin" />
          <span className="text-sm text-zinc-500">Generating today's intelligence payload...</span>
        </div>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const totalMinutes = tasks.reduce((acc, t) => acc + t.estMinutes, 0);
  const remainingMinutes = tasks.filter(t => !t.completed).reduce((acc, t) => acc + t.estMinutes, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative">
      {/* Dynamic Top Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
        <motion.div 
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="p-6 border-b border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Today's Executive Focus
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Data-driven tasks targeting your highest priority skill gaps.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm bg-zinc-950/50 rounded-lg px-4 py-2 border border-zinc-800/50">
          <div className="flex items-center gap-2 text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {completedCount} / {totalCount} completed
          </div>
          <div className="w-px h-4 bg-zinc-800" />
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4 text-blue-400" />
            {remainingMinutes}m remaining
          </div>
        </div>
      </div>

      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/20 mx-auto mb-3" />
            <p>No tasks remaining for today. Great work!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    task.completed 
                      ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" 
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleComplete(task.id)}
                      disabled={task.completed || completingTask === task.id}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        task.completed 
                          ? "bg-emerald-500 border-emerald-500" 
                          : "border-zinc-600 hover:border-emerald-500 hover:bg-emerald-500/10"
                      )}
                    >
                      {task.completed && <CheckCircle2 className="w-4 h-4 text-zinc-900" />}
                    </button>
                    <div>
                      <h3 className={cn("font-medium transition-colors", task.completed ? "text-emerald-400 line-through" : "text-white")}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          {getIcon(task.type)}
                          <span className="uppercase tracking-wider">{task.type}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estMinutes} mins
                        </span>
                      </div>
                    </div>
                  </div>
                  {!task.completed && (
                    <button 
                      onClick={() => handleExecute(task)}
                      disabled={executingTask === task.id}
                      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-800 disabled:opacity-50"
                    >
                      {executingTask === task.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      Execute
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
