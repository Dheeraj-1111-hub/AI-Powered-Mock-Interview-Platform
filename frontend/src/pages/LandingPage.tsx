import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { Footer } from '../components/shared/Footer';
import { GlowingButton } from '../components/ui/GlowingButton';
import { CommandPalette } from '../components/ui/CommandPalette';
import { fadeIn, staggerContainer } from '../design/tokens';
import { 
  Bot, Code2, FileText, Sparkles, Target, Zap, 
  ChevronRight, BarChart3, PlayCircle, ShieldCheck,
  BrainCircuit, Rocket, Trophy, ArrowRight, Dna
} from 'lucide-react';
import { cn } from '../utils/cn';

// Aceternity-style Spotlight Card with Hover Glow
const BentoCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative rounded-3xl border border-white/10 bg-slate-950 overflow-hidden",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.15), transparent 40%)`,
        }}
      />
      <div className="absolute inset-[1px] bg-slate-950/80 rounded-[23px] z-0" />
      <div className="relative z-20 h-full p-8">{children}</div>
    </div>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 10]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#030303] text-slate-50 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      <CommandPalette />
      <Navbar />

      {/* Aurora / Sparkles Core Background Layer */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        {/* Animated Aurora Gradients */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-600/10 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-violet-600/10 blur-[120px]" 
        />
      </div>

      <main className="relative z-10">
        
        {/* SECTION 1: Aceternity Hero */}
        <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6 flex flex-col items-center justify-center min-h-screen">
          <div className="max-w-5xl mx-auto text-center w-full relative">
            
            {/* Background glowing line */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent blur-sm"></div>

            <motion.div 
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="relative z-10 flex flex-col items-center"
            >
              <motion.div 
                variants={fadeIn}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300 mb-10 hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Next-Gen Career Intelligence is here</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </motion.div>

              <motion.h1 
                variants={fadeIn}
                className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500"
              >
                Master the <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500 drop-shadow-[0_0_40px_rgba(99,102,241,0.4)]">Interview</span> with AI.
              </motion.h1>

              <motion.p 
                variants={fadeIn}
                className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed"
              >
                Land your dream role at top-tier tech companies. HireIQ provides hyper-realistic AI simulations, real-time execution telemetry, and ATS-optimized resume intelligence.
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-6">
                <button 
                  onClick={() => navigate('/auth')} 
                  className="relative group rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-950 transition-all hover:scale-105 active:scale-95 overflow-hidden flex items-center gap-2"
                >
                  <span className="relative z-10 flex items-center gap-2">Initialize Account <ArrowRight className="w-4 h-4" /></span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite] z-0" />
                </button>
                <button className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all group">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] group-hover:bg-white/[0.05] group-hover:border-white/20 transition-all">
                    <PlayCircle className="w-5 h-5 text-indigo-400" />
                  </div>
                  Watch Experience
                </button>
              </motion.div>

              {/* Social Proof */}
              <motion.div variants={fadeIn} className="mt-24 pt-10 border-t border-white/5 w-full max-w-3xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Trusted by engineers at top tech companies</p>
                <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                  <span className="text-xl font-black tracking-tighter">GOOGLE</span>
                  <span className="text-xl font-black tracking-tighter">META</span>
                  <span className="text-xl font-black tracking-tighter">STRIPE</span>
                  <span className="text-xl font-black tracking-tighter">OPENAI</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 2: Aceternity Bento Grid (Engine & Features) */}
        <section id="engine" className="py-32 px-6 relative">
          <div className="max-w-6xl mx-auto">
            <div className="mb-24">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
              >
                Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Impact</span>.
              </motion.h2>
              <p className="text-slate-400 text-lg max-w-2xl">
                Every tool in HireIQ is built to replicate the actual intensity of high-stakes technical interviews. No gamification. Just pure intelligence.
              </p>
            </div>

            <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
              
              {/* Feature 1: The Engine (Spans 2 columns) */}
              <BentoCard className="md:col-span-2 group">
                <div className="flex flex-col h-full relative z-10">
                  <Bot className="w-10 h-10 text-indigo-400 mb-6" />
                  <h3 className="text-3xl font-black mb-4 tracking-tight">AI Interview Engine</h3>
                  <p className="text-slate-400 text-lg max-w-md">
                    Dynamic HR, Technical, and System Design rounds. Our AI doesn't just ask questions—it actively probes your logic with Llama 3 state machines.
                  </p>
                  
                  {/* Decorative terminal element */}
                  <div className="mt-auto pt-8">
                    <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 font-mono text-xs text-indigo-300 overflow-hidden relative">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-950 z-10 pointer-events-none"></div>
                       <p className="text-slate-500 mb-2">System evaluating response logic...</p>
                       <p>&gt; Candidate recognized edge case (n = 0).</p>
                       <p>&gt; Adjusting follow-up difficulty: +15%.</p>
                       <p className="animate-pulse">&gt; Generating system design constraint...</p>
                    </div>
                  </div>
                </div>
                {/* Background glow */}
                <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors"></div>
              </BentoCard>

              {/* Feature 2: DNA Profile */}
              <BentoCard className="md:col-span-1 group">
                <div className="flex flex-col h-full relative z-10">
                  <Dna className="w-10 h-10 text-fuchsia-400 mb-6" />
                  <h3 className="text-2xl font-black mb-3 tracking-tight">Engineering DNA</h3>
                  <p className="text-slate-400">
                    A continuously evolving reflection of your operational traits, powered by real-time behavioral telemetry.
                  </p>
                  <div className="mt-auto pt-8">
                     <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs font-mono">
                           <span className="text-slate-500">Hint Dependency</span>
                           <span className="text-emerald-400 font-bold">LOW</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                           <span className="text-slate-500">Panic Signals</span>
                           <span className="text-amber-400 font-bold">MEDIUM</span>
                        </div>
                     </div>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-[200px] h-[200px] bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-fuchsia-500/20 transition-colors"></div>
              </BentoCard>

              {/* Feature 3: Code Lab */}
              <BentoCard className="md:col-span-1 group">
                <div className="flex flex-col h-full relative z-10">
                  <Code2 className="w-10 h-10 text-emerald-400 mb-6" />
                  <h3 className="text-2xl font-black mb-3 tracking-tight">Elite Coding Lab</h3>
                  <p className="text-slate-400">
                    Real-time execution in 40+ languages. Integrated Monaco editor with AI mentor code reviews.
                  </p>
                </div>
                <div className="absolute -left-10 -bottom-10 w-[200px] h-[200px] bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
              </BentoCard>

              {/* Feature 4: Analytics (Spans 2 columns) */}
              <BentoCard className="md:col-span-2 group">
                <div className="flex flex-col h-full relative z-10">
                  <BarChart3 className="w-10 h-10 text-amber-400 mb-6" />
                  <h3 className="text-3xl font-black mb-4 tracking-tight">Mastery Analytics</h3>
                  <p className="text-slate-400 text-lg max-w-md">
                    Visual heatmaps, topic score distributions, and performance trends. Track your actual readiness over time.
                  </p>
                  <div className="mt-auto pt-8 flex gap-4">
                     {/* Decorative bars */}
                     {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                       <div key={i} className="w-8 bg-white/[0.03] rounded-t-lg relative overflow-hidden group-hover:bg-white/[0.05] transition-colors" style={{ height: '100px' }}>
                          <motion.div 
                            initial={{ height: 0 }}
                            whileInView={{ height: `${h}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="absolute bottom-0 w-full bg-gradient-to-t from-amber-500/50 to-amber-400/20 rounded-t-lg"
                          />
                       </div>
                     ))}
                  </div>
                </div>
              </BentoCard>

            </div>
          </div>
        </section>

        {/* SECTION: How It Works */}
        <section id="how-it-works" className="py-32 px-6 relative border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="mb-24 text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
              >
                How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Works</span>.
              </motion.h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                A deterministic pipeline designed to turn raw engineering potential into interview execution certainty.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              {[
                { step: "01", title: "Initialize DNA", desc: "Complete the rigorous technical calibration to map your baseline capabilities and cognitive gaps.", icon: <BrainCircuit className="w-6 h-6 text-white" /> },
                { step: "02", title: "Execute Sprints", desc: "Follow dynamically generated roadmaps. Every code submission updates your global readiness score.", icon: <Code2 className="w-6 h-6 text-white" /> },
                { step: "03", title: "Dominate Rounds", desc: "Engage in highly adversarial AI mock interviews that mimic real FAANG pressure constraints.", icon: <Trophy className="w-6 h-6 text-white" /> }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(255,255,255,0.05)] mb-8">
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                       {item.icon}
                    </div>
                  </div>
                  <span className="text-indigo-400 font-mono font-bold mb-4">{item.step}</span>
                  <h3 className="text-2xl font-black tracking-tight mb-4">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed max-w-xs">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: Testimonials */}
        <section id="testimonials" className="py-32 px-6 relative border-t border-white/5 bg-gradient-to-b from-transparent to-slate-950/50">
          <div className="max-w-6xl mx-auto">
            <div className="mb-24 text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
              >
                Engineering <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Outcomes</span>.
              </motion.h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                The data speaks for itself. See how elite engineers use HireIQ to secure their next role.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "Sarah J.", role: "L5 SWE @ Google", text: "The System Design simulator is terrifyingly accurate. It caught the exact database partitioning flaw that a real Google interviewer grilled me on a week later.", metric: "92% System Design Readiness" },
                { name: "Michael T.", role: "Backend Engineer @ Stripe", text: "I was stuck at medium-level dynamic programming. The adaptive roadmap didn't just give me problems; it generated a recovery sprint that fixed my fundamental logic flaws.", metric: "14-Day Recovery Sprint" },
                { name: "David Chen", role: "E4 @ Meta", text: "Unlike other platforms, the telemetry tracking here is brutally honest. It told me my execution speed was too slow, even when my answers were right. That honesty got me the offer.", metric: "Execution Speed +40%" },
                { name: "Elena R.", role: "Senior MLE @ OpenAI", text: "The adversarial AI mock interviews are incredible. They interrupt you, challenge your assumptions, and force you to defend your code. Best prep tool on the market.", metric: "Passed 5/5 Onsites" }
              ].map((t, idx) => (
                <BentoCard key={idx} className="bg-slate-900/50">
                   <div className="flex flex-col h-full">
                     <p className="text-lg text-slate-300 italic mb-8 leading-relaxed">"{t.text}"</p>
                     <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-6">
                        <div>
                           <h4 className="font-bold text-white tracking-tight">{t.name}</h4>
                           <p className="text-xs text-slate-500 font-mono mt-1">{t.role}</p>
                        </div>
                        <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-bold text-indigo-400">
                           {t.metric}
                        </div>
                     </div>
                   </div>
                </BentoCard>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: FAQ */}
        <section id="faq" className="py-32 px-6 relative border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="mb-24 text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
              >
                Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-500">Questions</span>.
              </motion.h2>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { q: "How does the AI Interviewer differ from ChatGPT?", a: "Our AI engine uses specialized Llama 3 state machines designed exclusively for technical interviews. It maintains context across 45-minute sessions, interrupts you if you go off track, and evaluates your code logic, not just the syntax." },
                { q: "Is the Coding Lab compatible with real interview environments?", a: "Yes. The Coding Lab is built on the Monaco Editor (the core of VS Code) and executes your code in secure Docker sandboxes via Judge0, replicating the exact environment used by HackerRank and CoderPad." },
                { q: "What is Engineering DNA?", a: "Engineering DNA is our proprietary telemetry system. Instead of just tracking 'problems solved', it measures how fast you code, how often you use hints, your compilation error rate, and your panic signals during mock interviews." },
                { q: "Can I use this for non-FAANG roles?", a: "Absolutely. During onboarding, you define your target company and role. The Adaptive Roadmap Engine will calibrate the difficulty, topics, and interview style to match your specific career trajectory." }
              ].map((faq, idx) => (
                <div key={idx} className="p-8 rounded-3xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                     <span className="text-indigo-500 font-black">Q.</span> {faq.q}
                  </h3>
                  <p className="text-slate-400 leading-relaxed pl-8">
                     {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: Aceternity CTA */}
        <section className="py-40 relative overflow-hidden flex justify-center">
          <div className="absolute inset-0 bg-indigo-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030303_70%)]" />
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
              className="relative p-16 rounded-[48px] border border-white/10 bg-slate-950/50 backdrop-blur-3xl shadow-2xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <Rocket className="w-16 h-16 text-indigo-400 mx-auto mb-10 group-hover:-translate-y-4 transition-transform duration-700 ease-out" />
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Career OS</span> starts here.
              </h2>
              <p className="text-slate-400 text-xl mb-12 max-w-xl mx-auto">
                Stop practicing blindly. Start training with the most advanced AI preparation engine available.
              </p>
              
              <button 
                onClick={() => navigate('/auth')} 
                className="relative group/btn rounded-full bg-indigo-500 px-12 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]"
              >
                <span className="relative z-10 flex items-center gap-2">Enter HireIQ Now <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></span>
              </button>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}