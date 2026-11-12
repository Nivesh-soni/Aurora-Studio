import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";

export default function WelcomeBanner({ displayName, openNewProject }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-cyan-500/15 bg-[#0d1017] p-6 shadow-xl shadow-cyan-500/[0.03] sm:flex-row sm:items-center sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-500/[0.08] via-transparent to-indigo-500/[0.06]" />
      <div className="relative">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-400">
          <Sparkles size={12} /> Aurora Studio
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Welcome back, {displayName}</h1>
        <p className="mt-2 max-w-lg text-xs leading-5 text-slate-400 sm:text-sm">Continue a project or start a fresh edit in your workspace.</p>
      </div>
      <button
        onClick={openNewProject}
        className="relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-bold text-[#07090e] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
      >
        <Plus size={16} /> New project
      </button>
    </motion.section>
  );
}
