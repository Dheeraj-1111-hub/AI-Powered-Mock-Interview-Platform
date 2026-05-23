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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                <span className="font-bold text-white">IQ</span>
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