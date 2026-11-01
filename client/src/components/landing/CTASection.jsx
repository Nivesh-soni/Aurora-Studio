import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Zap,
  Play,
} from "lucide-react";

const pulseGlow = {
  initial: {
    boxShadow: "0 0 0 0 rgba(6, 182, 212, 0.5)",
  },
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(6, 182, 212, 0.5)",
      "0 0 0 14px rgba(6, 182, 212, 0)",
      "0 0 0 0 rgba(6, 182, 212, 0)",
    ],
    transition: {
      duration: 2.2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-[#0c0f17] p-8 sm:p-14 text-center shadow-2xl shadow-cyan-500/5"
        >
          <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5" />
              Your Creative Journey Starts Here
            </div>

            <h2 className="mt-6 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Got a story to bring to life?
            </h2>

            <p className="mt-5 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Stop wrestling with heavy software. Step into the future of
              video editing and turn your raw footage into cinematic stories
              right from your browser.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                variants={pulseGlow}
                initial="initial"
                animate="animate"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#07090e] font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                Start Creating Now
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                <Play className="w-4 h-4" />
                Watch 2-Min Demo
              </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-slate-400">
              {[
                "100% Free Starter Tier",
                "No Software Install",
                "4K Export Ready",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}