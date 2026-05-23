import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Command, Menu, X, LogOut, User as UserIcon, ChevronDown, Sparkles, Bell } from 'lucide-react';
import { cn } from '../../utils/cn';
import { AuthContext } from '../../services/auth.service';
import { fetchActivityFeed } from '../../services/api.service';

export function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchActivityFeed().then(res => {
        if (res.data?.activity) {
          setNotifications(res.data.activity.filter((a: any) => a.type === 'milestone' || a.metadata?.xpEarned > 0));
        }
      }).catch(err => console.error("Failed to fetch notifications", err));
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('hireiq_token');
    localStorage.removeItem('hireiq_user');
    setUser(null);
    navigate('/');
  };

  const navLinks = user ? [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Career OS', path: '/career' },
    { name: 'Coding Lab', path: '/coding' },
    { name: 'Interviews', path: '/interview' },
    { name: 'Analytics', path: '/analytics' },
  ] : [
    { name: 'Features', path: '/#features' },
    { name: 'Engine', path: '/#engine' },
    { name: 'How It Works', path: '/#how-it-works' },
    { name: 'Testimonials', path: '/#testimonials' },
    { name: 'FAQ', path: '/#faq' },
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100] flex justify-center mt-4 md:mt-6 px-4 pointer-events-none">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={cn(
            'pointer-events-auto flex items-center justify-between rounded-[2rem] border transition-all duration-500 w-full max-w-5xl px-4 py-2.5',
            scrolled 
              ? 'border-white/10 bg-slate-950/70 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-2xl'
              : 'border-white/5 bg-slate-950/30 backdrop-blur-xl'
          )}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 pl-2 group relative z-20">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all">
              <span className="font-heading font-black text-white text-sm">IQ</span>
              <div className="absolute inset-0 rounded-xl ring-1 ring-white/30" />
            </div>
            <span className="font-heading text-lg font-black tracking-tight text-white/90 group-hover:text-white transition-colors hidden sm:block">
              HireIQ
            </span>
          </Link>

          {/* Desktop Nav - The Aceternity Floating Pills */}
          <nav className="hidden md:flex items-center justify-center relative z-20" onMouseLeave={() => setHoveredIndex(null)}>
            {navLinks.map((link, idx) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={(e) => {
                    if (link.path.startsWith('/#')) {
                      if (location.pathname === '/') {
                        e.preventDefault();
                        const id = link.path.split('#')[1];
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  className="relative px-5 py-2 text-xs font-black uppercase tracking-widest transition-colors rounded-full"
                >
                  <AnimatePresence>
                    {hoveredIndex === idx && (
                      <motion.span
                        className="absolute inset-0 rounded-full bg-white/10 -z-10"
                        layoutId="hoverBackground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.15 } }}
                        exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
                      />
                    )}
                  </AnimatePresence>
                  <span className={cn(
                    "relative z-10 transition-colors duration-300",
                    isActive ? "text-white" : hoveredIndex === idx ? "text-white" : "text-slate-400"
                  )}>
                    {link.name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3 relative z-20">
            <button
              className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-white/10 hover:text-white hover:border-white/20 group"
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
                document.dispatchEvent(event);
              }}
            >
              <Command className="h-3 w-3 group-hover:text-indigo-400 transition-colors" />
              <span>Cmd K</span>
            </button>
            
            <div className="flex items-center pl-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => { setNotificationsOpen(!notificationsOpen); setUserMenuOpen(false); }}
                      className="relative p-2 rounded-full hover:bg-white/10 transition-all group"
                    >
                      <Bell className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                      {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.8)] border border-slate-950"></span>
                      )}
                    </button>

                    <AnimatePresence>
                      {notificationsOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                          className="absolute right-0 mt-4 w-72 rounded-3xl bg-slate-900/90 border border-white/10 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden origin-top-right z-50"
                        >
                          <div className="px-4 py-3 border-b border-white/5 mb-2 flex justify-between items-center">
                             <p className="text-xs font-black text-white uppercase tracking-wider">Notifications</p>
                             <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar px-1">
                            {notifications.length === 0 ? (
                              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center py-4">All caught up</p>
                            ) : (
                              notifications.map((notif: any, i: number) => (
                                <div key={i} className="mb-1 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                  <p className="text-[10px] font-black text-white uppercase tracking-wider mb-1 flex items-center justify-between">
                                    {notif.title}
                                    {notif.metadata?.xpEarned > 0 && (
                                      <span className="text-emerald-400">+{notif.metadata.xpEarned} XP</span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-slate-400 leading-relaxed">{notif.description}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => { setUserMenuOpen(!userMenuOpen); setNotificationsOpen(false); }}
                    className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/10 transition-all border border-transparent hover:border-white/10 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500/40 transition-colors overflow-hidden relative">
                       <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <UserIcon className="w-4 h-4 text-indigo-300 group-hover:text-white relative z-10" />
                    </div>
                    <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform hidden sm:block group-hover:text-white", userMenuOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                        className="absolute right-0 mt-4 w-56 rounded-3xl bg-slate-900/90 border border-white/10 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden origin-top-right"
                      >
                          <div className="px-4 py-3 border-b border-white/5 mb-2">
                             <p className="text-xs font-black text-white uppercase tracking-wider truncate">{user.name}</p>
                             <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mt-0.5">Active Session</p>
                          </div>
                          
                          <Link
                           to="/profile"
                           className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-white transition-colors mb-1 group"
                           onClick={() => setUserMenuOpen(false)}
                         >
                            <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            DNA Profile
                         </Link>
                         <button 
                           onClick={handleLogout}
                           className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 transition-colors group"
                         >
                            <LogOut className="w-4 h-4 text-rose-500/50 group-hover:text-rose-400 transition-colors" />
                            Disconnect
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
               </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/auth" className="hidden sm:block px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                    Log in
                  </Link>
                  <Link
                    to="/auth"
                    className="relative group rounded-full bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-950 transition-all hover:scale-105 active:scale-95 overflow-hidden"
                  >
                    <span className="relative z-10">Sign up</span>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite] z-0" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-slate-300 hover:text-white p-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 z-[120] w-full max-w-sm border-l border-white/10 bg-slate-950 px-6 py-6 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                    <span className="font-heading font-black text-white text-sm">IQ</span>
                  </div>
                  <span className="font-heading text-xl font-black text-white tracking-tight">HireIQ</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors bg-white/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-4 rounded-2xl bg-white/[0.02] border border-white/5 text-sm font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              
              <div className="mt-auto pt-8 border-t border-white/10">
                {user ? (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/10 mb-4">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                          <UserIcon className="w-6 h-6 text-indigo-400" />
                       </div>
                       <div>
                          <p className="text-xs font-black text-white uppercase tracking-wider">{user.name}</p>
                          <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mt-1">Active Session</p>
                       </div>
                    </div>
                    <Link
                       to="/profile"
                       onClick={() => setMobileMenuOpen(false)}
                       className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-4 text-xs font-black uppercase tracking-widest text-white shadow-sm transition-all mb-3 active:scale-95"
                     >
                       <Sparkles className="w-4 h-4 text-indigo-400" />
                       DNA Profile
                     </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-4 text-xs font-black uppercase tracking-widest text-rose-400 shadow-sm transition-all active:scale-95"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex w-full justify-center rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-4 text-xs font-black uppercase tracking-widest text-white shadow-sm active:scale-95 transition-transform"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex w-full justify-center rounded-2xl bg-white px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-transform"
                    >
                      Initialize Account
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
