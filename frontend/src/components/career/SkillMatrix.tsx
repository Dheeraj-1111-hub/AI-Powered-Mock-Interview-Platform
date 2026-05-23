import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TopicScore {
  canonical: string;
  label: string;
  current: number;
  target: number;
  gap: number;
  trend: number;
  source: { codingLab: number; interviewSession: number; aiAudit: number };
}

interface Props { topics: TopicScore[] }

const gapLabel = (gap: number) => {
  if (gap >= 60) return { text: '!! Critical', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  if (gap >= 35) return { text: '● Major',    cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  if (gap >= 15) return { text: '▲ Minor',    cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
  return              { text: '✓ On Track',  cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
};

export default function SkillMatrix({ topics }: Props) {
  if (!topics.length) return (
    <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl">
      <p className="text-slate-600 text-xs font-black uppercase tracking-widest">Complete onboarding to generate matrix</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
        <div className="col-span-3">Topic</div>
        <div className="col-span-3">Progress</div>
        <div className="col-span-1 text-center">Now</div>
        <div className="col-span-1 text-center">Target</div>
        <div className="col-span-2 text-center">Gap</div>
        <div className="col-span-2 text-center">Trend</div>
      </div>
      {topics.slice(0, 12).map((t, i) => {
        const gap = gapLabel(t.gap);
        return (
          <motion.div key={t.canonical} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
          >
            <div className="col-span-3">
              <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">{t.label}</p>
            </div>
            <div className="col-span-3">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div className={cn('h-full rounded-full', t.current >= t.target ? 'bg-emerald-500' : t.current >= t.target * 0.6 ? 'bg-amber-500' : 'bg-rose-500')}
                  initial={{ width: 0 }} animate={{ width: `${Math.min(100, (t.current / Math.max(t.target, 1)) * 100)}%` }} transition={{ duration: 0.8, delay: i * 0.04 }}
                />
              </div>
              <div className="flex justify-between mt-0.5 text-[7px] text-slate-600 font-bold">
                <span>Lab {t.source.codingLab}%</span>
                <span>Int {t.source.interviewSession}%</span>
              </div>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-xs font-black text-white">{t.current}%</span>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-[11px] font-black text-slate-500">{t.target}%</span>
            </div>
            <div className="col-span-2 flex justify-center">
              <span className={cn('px-2 py-0.5 rounded-lg text-[7px] font-black uppercase border', gap.cls)}>{gap.text}</span>
            </div>
            <div className="col-span-2 flex justify-center items-center gap-1">
              {t.trend > 3 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : t.trend < -3 ? <TrendingDown className="w-3 h-3 text-rose-400" /> : <Minus className="w-3 h-3 text-slate-500" />}
              <span className={cn('text-[10px] font-black', t.trend > 3 ? 'text-emerald-400' : t.trend < -3 ? 'text-rose-400' : 'text-slate-500')}>
                {t.trend > 0 ? '+' : ''}{t.trend}%
              </span>
            </div>
          </motion.div>
        );
      })}
      {topics.some(t => t.gap >= 60) && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/5 border border-rose-500/15 mt-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-[10px] text-rose-300 font-medium">
            <span className="font-black">{topics.filter(t => t.gap >= 60).length} critical gaps</span> detected. Your roadmap will prioritize these topics.
          </p>
        </div>
      )}
    </div>
  );
}
