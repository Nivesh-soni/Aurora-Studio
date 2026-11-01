import { motion } from "framer-motion";
import {
  UploadCloud,
  Scissors,
  Download,
  CheckCircle2,
} from "lucide-react";

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 border-t border-white/5 bg-[#0c0f17]/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
            Simple Workflow
          </p>

          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            From blank canvas to finished reel in three steps
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

          {[
            {
              step: "01",
              icon: UploadCloud,
              title: "Import Media",
              desc: "Drag and drop your raw footage, audio tracks, and images directly into the browser workspace.",
              badge: "Zero Server Latency",
            },
            {
              step: "02",
              icon: Scissors,
              title: "Edit Your Story",
              desc: "Arrange clips on the magnetic timeline, apply cinematic effects, and fine-tune every frame.",
              badge: "WebGPU Realtime Shaders",
            },
            {
              step: "03",
              icon: Download,
              title: "Export Your Video",
              desc: "Render your final masterpiece in stunning quality and save it directly to your device.",
              badge: "100% Watermark-Free",
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-[#0c0f17] border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/5 relative z-10">
                  <Icon className="w-8 h-8" />

                  <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-cyan-500 text-[#07090e] text-xs font-black flex items-center justify-center border-4 border-[#07090e]">
                    {item.step}
                  </div>
                </div>

                <h3 className="mt-6 text-xl font-bold text-white">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
                  {item.desc}
                </p>

                <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
                  <CheckCircle2 className="w-3 h-3" />
                  {item.badge}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}