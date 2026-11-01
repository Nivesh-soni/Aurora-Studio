import { motion } from "framer-motion";
import {
  Scissors,
  Layers,
  Subtitles,
  Volume2,
  Sliders,
  Zap,
} from "lucide-react";

export default function Features() {
  return (
    <section
      id="features"
      className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
          Workbench Architecture
        </p>

        <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Pro-grade power, right inside your browser
        </h2>

        <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
          Engineered from the ground up on WebGPU to bring workstation
          capabilities to any screen without thermal throttling or bulky
          software suites.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            icon: Scissors,
            title: "Precise Video Editing",
            desc: "Frame-accurate razor trimming, ripple editing, and slip & slide tools with magnetic snapping for seamless cuts.",
            preview: (
              <div className="flex items-center gap-1.5 p-2 rounded bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                  Clip A [00:12:04]
                </span>
                <span className="text-cyan-400">|</span>
                <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/30">
                  Clip B [00:38:20]
                </span>
              </div>
            ),
          },
          {
            icon: Layers,
            title: "Multi-track Timeline",
            desc: "Stack unlimited video, audio, caption, and adjustment layers with non-destructive nesting and instant proxy toggles.",
            preview: (
              <div className="space-y-1 p-2 rounded bg-black/40 border border-white/5">
                <div className="h-2 rounded bg-cyan-500/60 w-3/4" />
                <div className="h-2 rounded bg-indigo-500/60 w-5/6" />
                <div className="h-2 rounded bg-purple-500/50 w-1/2" />
              </div>
            ),
          },
          {
            icon: Subtitles,
            title: "AI Text & Captions",
            desc: "AI-powered auto-transcription in 60+ languages with dynamic animated kinetic typography and word-level karaoke highlighting.",
            preview: (
              <div className="p-2 rounded bg-black/40 border border-white/5 text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-medium">
                  Every
                </span>{" "}
                <span className="text-white">frame tells</span>{" "}
                <span className="text-cyan-400 font-semibold underline decoration-cyan-400">
                  your
                </span>{" "}
                <span className="text-white">story.</span>
                <div className="mt-1 text-[9px] text-slate-400 font-mono">
                  Transcribed in 1.2s • 99.4% accuracy
                </div>
              </div>
            ),
          },
          {
            icon: Volume2,
            title: "Studio-Grade Audio",
            desc: "Studio multi-band EQ, neural background noise removal, automatic voice ducking, and smart beat-sync detection.",
            preview: (
              <div className="flex items-end justify-between h-8 p-1.5 rounded bg-black/40 border border-white/5 px-4">
                {[40, 70, 30, 85, 60, 95, 45, 65, 30, 80].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1 rounded-t bg-cyan-400/80"
                  />
                ))}
              </div>
            ),
          },
          {
            icon: Sliders,
            title: "Effects & Color LUTs",
            desc: "Cinematic color presets, optical flow slow-motion, real-time chromatic aberration, 35mm grain, and blend modes.",
            preview: (
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                <div className="py-1.5 rounded bg-gradient-to-tr from-cyan-900 to-blue-700 text-white font-semibold">
                  WASH
                </div>
                <div className="py-1.5 rounded bg-gradient-to-tr from-amber-700 to-teal-800 text-white font-semibold">
                  TEAL
                </div>
                <div className="py-1.5 rounded bg-gradient-to-tr from-slate-900 to-zinc-700 text-white font-semibold">
                  NOIR
                </div>
              </div>
            ),
          },
          {
            icon: Zap,
            title: "Instant MP4 Export",
            desc: "Hardware-accelerated client-side rendering delivering ultra-fast 1080p and 4K MP4 exports directly to disk or cloud.",
            preview: (
              <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-300">
                  <span>Render 4K 60FPS</span>
                  <span className="text-cyan-400 font-bold">
                    4.2x Realtime
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 w-[78%]" />
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  00:28 Remaining • Client GPU Engine
                </div>
              </div>
            ),
          },
        ].map((feature) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.title}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="group relative rounded-2xl bg-[#0c0f17] border border-white/5 hover:border-cyan-500/40 p-6 flex flex-col justify-between transition-colors shadow-lg hover:shadow-cyan-500/10"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                  <Icon className="w-5 h-5" />
                </div>

                <h3 className="mt-4 text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {feature.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                {feature.preview}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}