import { SignUpButton } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  MonitorPlay,
  Cpu,
  CheckCircle2,
  HardDrive,
} from "lucide-react";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const pulseGlow = {
  initial: { boxShadow: "0 0 0 0 rgba(6, 182, 212, 0.5)" },
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

export default function Hero() {
  return (
    <section className="pt-16 pb-20 md:pt-22 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center"
      >
        {/* Release Badge */}
        <motion.div variants={fadeInUp}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs text-slate-300 shadow-sm backdrop-blur-md cursor-pointer hover:border-cyan-400 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-cyan-300 font-medium">
              ✦ Aurora Studio 2.0 is live
            </span>
            <span className="text-slate-500">—</span>
            <span className="hidden sm:inline">
              Zero installation, instant 4K rendering
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </motion.div>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          variants={fadeInUp}
          className="mt-8 text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl"
        >
          Your Vision. Your Story. <br />
          <span className="bg-linear-to-r from-indigo-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(34,211,238,0.25)]">
            Your Studio.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeInUp}
          className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed"
        >
          The next-generation browser-based video editing platform combining
          desktop-class multi-track timeline precision with the fluid agility of
          modern cloud creative tools. No downloads, no lag.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeInUp}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          {/* Primary Pulsing CTA */}
          <SignUpButton mode="modal">
            <motion.button
              variants={pulseGlow}
              initial="initial"
              animate="animate"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-medium text-sm bg-linear-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all group"
            >
              <span>Start Creating Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </SignUpButton>

          {/* Secondary CTA */}
          <motion.a
            href="#showcase"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm bg-slate-900/80 border border-white/10 hover:border-slate-600 hover:bg-slate-800/80 text-slate-200 transition-all"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <>Explore the Studio</>
          </motion.a>
        </motion.div>

        {/* Social Proof & Metrics */}
        <motion.div variants={fadeInUp} className="mt-14 w-full max-w-3xl">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            Trusted by 140,000+ creators, filmmakers, and digital studios
            worldwide
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
            {[
              { icon: MonitorPlay, label: "4K 60FPS Support" },
              { icon: Cpu, label: "WebGPU Accelerated" },
              { icon: CheckCircle2, label: "Zero Watermarks" },
              { icon: HardDrive, label: "Browser-Native Cache" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/2 border border-white/5 hover:border-white/10 hover:bg-white/4 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
