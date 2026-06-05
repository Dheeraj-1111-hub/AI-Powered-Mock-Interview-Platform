import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-white/10 bg-slate-950 pt-16">
      {/* Background glow */}
      <div className="absolute left-1/2 top-0 -z-10 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

      <div className="absolute left-1/2 top-0 -z-10 h-32 w-1/2 -translate-x-1/2 bg-indigo-500/10 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="space-y-8 xl:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-lg blur-sm" />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]">
                  <path d="M12.9868 2.0003L4.48682 12.0003H11.9868L10.9868 21.0003L20.4868 9.5003H12.9868L12.9868 2.0003Z" fill="url(#sparkGradientFooter)" stroke="url(#sparkStrokeFooter)" strokeWidth="1.5" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="sparkGradientFooter" x1="4.48682" y1="2.0003" x2="20.4868" y2="21.0003" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#818cf8" />
                      <stop offset="1" stopColor="#3730a3" />
                    </linearGradient>
                    <linearGradient id="sparkStrokeFooter" x1="4.48682" y1="2.0003" x2="20.4868" y2="21.0003" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#e0e7ff" />
                      <stop offset="1" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <span className="text-xl font-bold tracking-tight text-white">
                HireIQ
              </span>
            </Link>

            <p className="max-w-xs text-sm leading-6 text-slate-400">
              The AI Operating System for Careers. Master your interviews and
              land your dream job with intelligent preparation.
            </p>

            {/* Social Icons */}
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-slate-500 transition-colors hover:text-indigo-400 text-xl"
              >
                X
              </a>

              <a
                href="#"
                className="text-slate-500 transition-colors hover:text-indigo-400 text-xl"
              >
                🌐
              </a>

              <a
                href="#"
                className="text-slate-500 transition-colors hover:text-indigo-400 text-xl"
              >
                in
              </a>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              {/* Product */}
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">
                  Product
                </h3>

                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link
                      to="/features"
                      className="text-sm leading-6 text-slate-400 transition-colors hover:text-white"
                    >
                      Features
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/interviews"
                      className="text-sm leading-6 text-slate-400 transition-colors hover:text-white"
                    >
                      Mock Interviews
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/resume"
                      className="text-sm leading-6 text-slate-400 transition-colors hover:text-white"
                    >
                      Resume AI
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/pricing"
                      className="text-sm leading-6 text-slate-400 transition-colors hover:text-white"
                    >
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">
                  Company
                </h3>

                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <a
                      href="#"
                      className="text-sm leading-6 text-slate-400 transition-colors hover:text-white"
                    >
                      About
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="text-sm leading-6 text-slate-400 transition-colors hover:text-white"
                    >
                      Blog
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="text-sm leading-6 text-slate-400 transition-colors hover:text-white"
                    >
                      Careers
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="text-sm leading-6 text-slate-400 transition-colors hover:text-white"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Legal */}
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">
                  Legal
                </h3>

                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <a
                      href="#"
                      className="text-sm leading-6 text-slate-400 transition-colors hover:text-white"
                    >
                      Privacy Policy
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="text-sm leading-6 text-slate-400 transition-colors hover:text-white"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-slate-400">
            &copy; {currentYear} HireIQ AI, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}