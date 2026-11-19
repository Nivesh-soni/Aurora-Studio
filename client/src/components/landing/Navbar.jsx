import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useNavigate } from "react-router-dom";
import { LogIn, Menu, X, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/80 border-b border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-cyan-500 to-indigo-500 p-px shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#07090e] rounded-[7px] flex items-center justify-center">
              <img
                src="logo.svg"
                className="text-cyan-400 group-hover:rotate-6 transition-transform"
                alt="Aurora Studio Logo"
              />
            </div>
          </div>
          <span className="font-semibold text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
            Aurora <span className="text-slate-400 font-normal">Studio</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          {["Showcase", "Features", "How It Works", "About"].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-cyan-400 after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-300"
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <SignedOut>
            {/* Sign In Button (Only when logged out) */}
            <SignInButton mode="modal">
              <button className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-2 cursor-pointer">
                Sign In
              </button>
            </SignInButton>

            {/* Get Started Button (Only when logged out) */}
            <SignUpButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                Get Started
                <LogIn size={16} />
              </motion.button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            {/* Dashboard Navigation Button (Only when signed in) */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/80 shadow-md transition-all cursor-pointer"
            >
              <LayoutDashboard size={16} className="text-cyan-400" />
              Dashboard
            </motion.button>

            {/* Clerk User Profile Avatar */}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-[#0a0d15] border-b border-white/10 px-6 py-6 space-y-4"
          >
            <nav className="flex flex-col gap-3">
              {["Features", "How It Works", "Showcase", "About"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-300 hover:text-cyan-400 text-base font-medium py-1"
                >
                  {link}
                </a>
              ))}
            </nav>
            
            {/* Mobile Actions based on Auth state */}
            <div className="pt-4 border-t border-white/15 flex flex-col gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm text-slate-300 hover:text-white cursor-pointer"
                  >
                    Sign In
                  </button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 cursor-pointer"
                  >
                    Get Started
                  </button>
                </SignUpButton>
              </SignedOut>

              <SignedIn>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/dashboard");
                  }}
                  className="w-full py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-white border border-zinc-700 text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard size={16} className="text-cyan-400" />
                  Go to Dashboard
                </button>
              </SignedIn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}