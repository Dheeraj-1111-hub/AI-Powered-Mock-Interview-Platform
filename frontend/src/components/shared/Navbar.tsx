import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Command, List, X, SignOut, User, CaretDown, Sparkle, Bell } from '@phosphor-icons/react';
import { cn } from '../../utils';
import { AuthContext } from '../../services/auth.service';
import { fetchActivityFeed } from '../../services/api.service';

export function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
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
    { name: 'Resume', path: '/resume' },
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
      {/* ACETERNITY FLOATING NAVBAR */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={cn(
          'fixed inset-x-0 top-6 z-[100] transition-all duration-500 mx-auto w-[95%] max-w-[1200px]',
        )}
      >
        <div className="h-14 px-3 flex items-center justify-between bg-[#030303]/70 backdrop-blur-xl border border-white/[0.08] rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group relative z-20 pl-2">
            <div className="flex h-9 w-9 items-center justify-center relative transition-transform group-hover:scale-105">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-md group-hover:bg-indigo-500/40 transition-colors" />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]">
                <path d="M12.9868 2.0003L4.48682 12.0003H11.9868L10.9868 21.0003L20.4868 9.5003H12.9868L12.9868 2.0003Z" fill="url(#sparkGradientNav)" stroke="url(#sparkStrokeNav)" strokeWidth="1.5" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="sparkGradientNav" x1="4.48682" y1="2.0003" x2="20.4868" y2="21.0003" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" />
                    <stop offset="1" stopColor="#a3a3a3" />
                  </linearGradient>
                  <linearGradient id="sparkStrokeNav" x1="4.48682" y1="2.0003" x2="20.4868" y2="21.0003" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" />
                    <stop offset="1" stopColor="#525252" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="font-heading text-sm font-bold tracking-tight text-white hidden sm:block">
              HireIQ
            </span>
          </Link>

          {/* Desktop Nav with Aceternity Hover Animations */}
          <nav className="hidden md:flex items-center justify-center gap-1 relative z-20">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onMouseEnter={() => setHoveredIndex(link.name)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "relative px-4 py-2 text-xs font-semibold transition-colors rounded-full z-10",
                    isActive ? "text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  {/* Aceternity Hover Pill */}
                  {hoveredIndex === link.name && !isActive && (
                    <motion.span
                      layoutId="nav-hover"
                      className="absolute inset-0 bg-white/[0.04] rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  {/* Aceternity Active Pill */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 bg-white/[0.08] border border-white/[0.05] rounded-full -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 relative z-20 pr-1">
            <button
              className="hidden md:flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0A0A0A] px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:bg-white/[0.04] hover:text-white group shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
                document.dispatchEvent(event);
              }}
            >
              <Command size={14} className="group-hover:text-white transition-colors" />
              <span>Search</span>
              <span className="px-1.5 py-0.5 rounded flex items-center justify-center bg-[#1A1A1A] border border-white/[0.08] text-[9px] text-slate-300 font-mono shadow-sm">⌘K</span>
            </button>
            
            <div className="flex items-center pl-1">
              {user ? (
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <button 
                      onClick={() => { setNotificationsOpen(!notificationsOpen); setUserMenuOpen(false); }}
                      className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-all group"
                    >
                      <Bell size={18} weight={notificationsOpen ? "fill" : "regular"} className={cn("transition-colors", notificationsOpen ? "text-white" : "text-slate-400 group-hover:text-white")} />
                      {notifications.length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] border border-[#0a0a0a]"></span>
                      )}
                    </button>

                    <AnimatePresence>
                      {notificationsOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                          className="absolute right-0 mt-4 w-80 rounded-3xl bg-slate-900/90 border border-white/10 p-2 shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden origin-top-right z-50"
                        >
                          <div className="px-4 py-3 border-b border-white/5 mb-2 flex justify-between items-center">
                             <p className="text-xs font-black text-white uppercase tracking-wider">Notifications</p>
                             <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                          </div>
                          <div className="max-h-[350px] overflow-y-auto custom-scrollbar px-1">
                            {notifications.length === 0 ? (
                              <div className="py-8 flex flex-col items-center justify-center opacity-50">
                                 <Bell size={32} weight="thin" className="mb-2" />
                                 <p className="text-[10px] font-mono text-white uppercase tracking-widest text-center">All caught up</p>
                              </div>
                            ) : (
                              notifications.map((notif: any, i: number) => (
                                <div key={i} className="mb-1 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-default group">
                                  <p className="text-xs font-bold text-white mb-1 flex items-center justify-between group-hover:text-indigo-300 transition-colors">
                                    {notif.title}
                                    {notif.metadata?.xpEarned > 0 && (
                                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">+{notif.metadata.xpEarned} XP</span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">{notif.description}</p>
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
                      className={cn(
                        "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all border group ml-1",
                        userMenuOpen ? "bg-white/10 border-white/20" : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
                      )}
                    >
                    <div className="w-7 h-7 rounded-full bg-[#0A0A0A] flex items-center justify-center overflow-hidden border border-white/[0.08] group-hover:border-white/20 transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                       <User size={14} weight="bold" className="text-slate-300 group-hover:text-white" />
                    </div>
                    <CaretDown size={12} weight="bold" className={cn("text-slate-400 transition-transform hidden sm:block group-hover:text-white", userMenuOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                        className="absolute right-0 mt-4 w-64 rounded-3xl bg-slate-900/90 border border-white/10 p-2 shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden origin-top-right z-50"
                      >
                          <div className="px-4 py-4 border-b border-white/5 mb-2 bg-white/[0.02] rounded-2xl m-1">
                             <p className="text-sm font-black text-white truncate">{user.name}</p>
                             <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest truncate">{user.email || 'User'}</p>
                          </div>
                          
                          <Link
                           to="/profile"
                           className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors mb-1 group"
                           onClick={() => setUserMenuOpen(false)}
                         >
                            <Sparkle size={16} weight="fill" className="text-indigo-400 group-hover:scale-110 transition-transform" />
                            DNA Profile
                         </Link>
                         <button 
                           onClick={handleLogout}
                           className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 transition-colors group mt-1"
                         >
                            <SignOut size={16} weight="bold" className="group-hover:scale-110 transition-transform" />
                            Disconnect
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
               </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/auth" className="hidden sm:block px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                    Log in
                  </Link>
                  <Link
                    to="/auth"
                    className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition-all hover:bg-slate-200"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-slate-300 hover:text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 ml-1"
              onClick={() => setMobileMenuOpen(true)}
            >
              <List size={18} weight="bold" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Spacer to push content down since header is floating now */}
      <div className="h-12" />

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 z-[120] w-full max-w-sm border-l border-white/10 bg-[#0a0a0a] px-6 py-6 md:hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center relative">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                      <path d="M12.9868 2.0003L4.48682 12.0003H11.9868L10.9868 21.0003L20.4868 9.5003H12.9868L12.9868 2.0003Z" fill="url(#sparkGradientMob)" stroke="url(#sparkStrokeMob)" strokeWidth="1.5" strokeLinejoin="round"/>
                      <defs>
                        <linearGradient id="sparkGradientMob" x1="4.48682" y1="2.0003" x2="20.4868" y2="21.0003" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#ffffff" />
                          <stop offset="1" stopColor="#a3a3a3" />
                        </linearGradient>
                        <linearGradient id="sparkStrokeMob" x1="4.48682" y1="2.0003" x2="20.4868" y2="21.0003" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#ffffff" />
                          <stop offset="1" stopColor="#525252" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <span className="font-heading text-xl font-black text-white tracking-tight">HireIQ</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors bg-white/5"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {navLinks.map((link) => {
                   const isActive = location.pathname === link.path;
                   return (
                     <Link
                       key={link.name}
                       to={link.path}
                       onClick={() => setMobileMenuOpen(false)}
                       className={cn(
                         "px-5 py-4 rounded-2xl border text-sm font-black transition-all",
                         isActive 
                           ? "bg-white/[0.08] border-white/[0.05] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                           : "bg-transparent border-transparent text-slate-400 hover:bg-white/[0.04] hover:border-white/[0.05] hover:text-white"
                       )}
                     >
                       {link.name}
                     </Link>
                   )
                })}
              </div>
              
              <div className="mt-auto pt-8 border-t border-white/10">
                {user ? (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-4">
                       <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                          <User size={24} className="text-slate-400" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-white">{user.name}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">{user.email || 'User'}</p>
                       </div>
                    </div>
                    <Link
                       to="/profile"
                       onClick={() => setMobileMenuOpen(false)}
                       className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-black text-black transition-all hover:bg-slate-200 mb-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                     >
                       <Sparkle size={16} weight="fill" />
                       DNA Profile
                     </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.02] border border-white/10 px-4 py-4 text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <SignOut size={16} weight="bold" />
                      Disconnect
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-4 text-sm font-bold text-white"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center rounded-2xl bg-white px-4 py-4 text-sm font-black text-black"
                    >
                      Sign up
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
