import { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Scissors,
  Magnet,
  Maximize2,
  Film,
  Download,
  UploadCloud,
  RotateCcw,
  RotateCw,
  SplitSquareVertical,
} from "lucide-react";

export default function Showcase() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDucking, setAudioDucking] = useState(true);
  const [aiCaptions, setAiCaptions] = useState(true);

  return (
    <section
      id="showcase"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 scroll-mt-24"
    >
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/5 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
          <span className="uppercase tracking-wider font-semibold text-slate-300 text-[10px]">
            Interactive Workspace Viewport
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Engine: v2.4-WebGPU</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Buffer: 100%
          </span>
        </div>
      </div>

      {/* Video Editor Mockup Window */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="rounded-2xl border border-white/10 bg-[#0d1017] shadow-2xl shadow-indigo-950/50 overflow-hidden"
      >
        {/* Window Header */}
        <div className="px-4 py-3 bg-[#090b10] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-white/10 text-xs font-mono text-slate-300">
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cinematic_Reel_2025.aurora</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
                4K UHD 60FPS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-slate-400">
              <button className="p-1 hover:text-white" title="Undo">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:text-white" title="Redo">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:text-white">
                <Scissors className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:text-white">
                <SplitSquareVertical className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded border border-white/5 font-mono">
              Zoom 100%
            </div>
            <button className="px-3 py-1 rounded bg-linear-to-r from-cyan-500 to-blue-600 text-xs font-medium text-white shadow-sm flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export MP4
            </button>
          </div>
        </div>

        {/* Three Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-95 border-b border-white/5">
          {/* Left Bin / Assets (3 cols) */}
          <div className="lg:col-span-3 border-r border-white/5 p-3 flex flex-col justify-between bg-[#0a0c12]">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span>Project Bin (5)</span>
              </div>
              <div className="flex gap-2 text-xs border-b border-white/5 pb-2 mb-3 text-slate-400">
                <span className="text-cyan-400 font-medium">Media</span>
                <span className="hover:text-slate-200 cursor-pointer">
                  Audio
                </span>
                <span className="hover:text-slate-200 cursor-pointer">
                  Titles
                </span>
                <span className="hover:text-slate-200 cursor-pointer">FX</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    title: "Cyber_Relic_V1.mp4",
                    duration: "00:42",
                    grad: "from-cyan-900 to-indigo-950",
                  },
                  {
                    title: "Aurora_Peak_4K.mov",
                    duration: "01:15",
                    grad: "from-indigo-900 to-purple-950",
                  },
                  {
                    title: "Dune_MistyForest.mp4",
                    duration: "00:28",
                    grad: "from-emerald-950 to-slate-900",
                  },
                  {
                    title: "Creator_Portrait_A1.mp4",
                    duration: "02:04",
                    grad: "from-blue-900 to-slate-900",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="group cursor-pointer rounded-lg bg-slate-900/60 border border-white/5 p-1.5 hover:border-cyan-500/40 transition-all"
                  >
                    <div
                      className={`h-16 rounded bg-linear-to-br ${item.grad} relative flex items-center justify-center overflow-hidden`}
                    >
                      <Film className="w-4 h-4 text-white/40 group-hover:scale-110 transition-transform" />
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1 rounded bg-black/60 text-slate-300">
                        {item.duration}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-300 truncate font-mono">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Drop area */}
            <div className="mt-3 border border-dashed border-white/10 rounded-lg p-3 text-center bg-white/1">
              <UploadCloud className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <p className="text-[10px] text-slate-300">
                Drop Media Clips Here
              </p>
              <p className="text-[9px] text-slate-400">
                Supports MP4, MOV, WAV, ProRes
              </p>
            </div>
          </div>

          {/* Center: Video Preview Monitor (6 cols) */}
          <div className="lg:col-span-6 p-4 flex flex-col justify-between bg-[#080a0f]">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
              <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                PREVIEW MONITOR • 3840 x 2160 (16:9)
              </span>
              <span className="font-mono text-cyan-400 font-semibold text-[11px]">
                00:01:26:18 / 00:03:45:00
              </span>
            </div>

            {/* Monitor Screen Frame */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center shadow-inner group">
              {/* Aurora Artwork Canvas */}
              <div className="absolute inset-0 bg-linear-to-t from-indigo-950 via-slate-950 to-slate-900">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-cyan-400/20 via-indigo-500/10 to-transparent" />

                {/* Glowing Mountain & Aurora Silhouette simulation */}
                <div className="absolute bottom-0 inset-x-0 h-28 bg-linear-to-t from-black via-slate-950/80 to-transparent" />

                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                  <span className="text-[9px] uppercase tracking-widest text-cyan-300 font-mono block">
                    Title Track
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                    AURORA VISIONS
                  </h4>
                </div>
              </div>

              {/* Center playback micro-interaction */}
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPlaying(!isPlaying)}
                className="z-10 w-12 h-12 rounded-full bg-cyan-500/90 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 backdrop-blur-md"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </motion.button>

              <div className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-slate-300 flex items-center gap-1">
                <Maximize2 className="w-3 h-3" /> Full Res
              </div>
            </div>

            {/* Transport controls */}
            <div className="mt-3 flex items-center justify-between px-2">
              <div className="flex items-center gap-3 text-slate-400">
                <button className="hover:text-white">
                  <SkipBack className="h-5" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3 ml-0.5" />
                  )}
                </button>
                <button className="hover:text-white">
                  <SkipForward className="h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <button className="p-1 hover:text-cyan-400">
                  <Scissors className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 hover:text-cyan-400">
                  <Magnet className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Inspector Panel (3 cols) */}
          <div className="lg:col-span-3 border-l border-white/5 p-3 bg-[#0a0c12] text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-semibold text-slate-300">Inspector</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                V1 Selected
              </span>
            </div>

            {/* Transform */}
            <div>
              <p className="text-[11px] font-mono text-slate-400 mb-2 uppercase">
                Transform
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-1.5 rounded bg-white/2 border border-white/5 flex justify-between">
                  <span className="text-slate-400">Scale</span>
                  <span className="text-cyan-400 font-semibold">100.0%</span>
                </div>
                <div className="p-1.5 rounded bg-white/2 border border-white/5 flex justify-between">
                  <span className="text-slate-400">Rotation</span>
                  <span className="text-slate-200">0.0°</span>
                </div>
                <div className="p-1.5 rounded bg-white/2 border border-white/5 flex justify-between">
                  <span className="text-slate-400">Pos X</span>
                  <span className="text-slate-200">0 px</span>
                </div>
                <div className="p-1.5 rounded bg-white/2 border border-white/5 flex justify-between">
                  <span className="text-slate-400">Pos Y</span>
                  <span className="text-slate-200">0 px</span>
                </div>
              </div>
            </div>

            {/* Color & Lumetri */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 uppercase">
                <span>Color & Lumetri LUT</span>
                <span className="text-indigo-400 text-[10px]">
                  PROG_FILM.CUBE
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                    <span>Temperature</span>
                    <span className="text-cyan-400">+14</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 w-3/5" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                    <span>Vibrance</span>
                    <span className="text-indigo-400">+28</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-3/4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-[11px]">
                  AI Speech Captions
                </span>
                <button
                  onClick={() => setAiCaptions(!aiCaptions)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    aiCaptions ? "bg-cyan-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                      aiCaptions ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-[11px]">
                  Audio Ducking
                </span>
                <button
                  onClick={() => setAudioDucking(!audioDucking)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    audioDucking ? "bg-cyan-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                      audioDucking ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Timeline Section */}
        <div className="p-4 bg-[#090b10]">
          {/* Timeline Ruler */}
          <div className="h-5 flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-white/5 pb-1">
            <span>00:00:00</span>
            <span>00:00:30</span>
            <span className="text-cyan-400 font-bold">00:01:00</span>
            <span>00:01:30</span>
            <span>00:02:00</span>
            <span>00:02:30</span>
            <span>00:03:00</span>
          </div>

          {/* Timeline Tracks */}
          <div className="mt-3 space-y-2 relative">
            {/* Playhead marker line */}
            <div className="absolute top-0 bottom-0 left-[38%] w-0.5 bg-cyan-400 z-20 pointer-events-none shadow-[0_0_10px_#22d3ee]">
              <div className="w-3 h-3 bg-cyan-400 -translate-x-1.25 rotate-45 rounded-sm" />
            </div>

            {/* Track T1 (Text/FX) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 w-7">
                T1 👁
              </span>
              <div className="flex-1 h-7 rounded bg-slate-900/80 border border-white/5 flex items-center px-1 overflow-hidden">
                <div className="ml-[30%] w-[32%] h-5 rounded bg-purple-900/60 border border-purple-500/40 text-[10px] text-purple-200 px-2 flex items-center font-mono truncate">
                  ✦ Kinetic Neon Title.fx
                </div>
              </div>
            </div>

            {/* Track V2 */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 w-7">
                V2 👁
              </span>
              <div className="flex-1 h-7 rounded bg-slate-900/80 border border-white/5 flex items-center px-1 overflow-hidden gap-1.5">
                <div className="ml-[12%] w-[24%] h-5 rounded bg-blue-950 border border-blue-600/40 text-[10px] text-blue-200 px-2 flex items-center font-mono truncate">
                  B-Roll Cutaway (Misty Road)
                </div>
                <div className="w-[18%] h-5 rounded bg-indigo-950 border border-indigo-500/40 text-[10px] text-indigo-200 px-2 flex items-center font-mono truncate">
                  Cyber_Grade.LUT
                </div>
              </div>
            </div>

            {/* Track V1 (Main Video) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-400 font-bold w-7">
                V1 👁
              </span>
              <div className="flex-1 h-8 rounded bg-slate-900/80 border border-white/5 flex items-center px-1 overflow-hidden gap-1">
                <div className="w-[35%] h-6 rounded bg-linear-to-r from-cyan-950 to-blue-950 border border-cyan-500/50 text-[10px] text-cyan-200 px-2 flex items-center font-mono truncate">
                  Cyber_Rain_Master.mp4{" "}
                  <span className="text-[9px] text-slate-400 ml-1">
                    4K 60FPS
                  </span>
                </div>
                <div className="w-[45%] h-6 rounded bg-linear-to-r from-blue-950 to-indigo-950 border border-cyan-400/80 text-[10px] text-cyan-100 px-2 flex items-center font-mono truncate shadow-sm shadow-cyan-500/30">
                  Aurora_Peak_Hero.mov{" "}
                  <span className="text-[9px] text-cyan-300 ml-1">Snapped</span>
                </div>
              </div>
            </div>

            {/* Track A1 (Audio Waveform) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 w-7">
                A1 🔊
              </span>
              <div className="flex-1 h-7 rounded bg-slate-900/80 border border-white/5 flex items-center px-1 overflow-hidden">
                <div className="w-[75%] h-5 rounded bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-300 px-2 flex items-center font-mono truncate">
                  Cinematic_Overture_Master.wav
                  {/* Simulated Waveform SVG */}
                  <svg
                    className="w-24 h-3 ml-2 text-cyan-400 opacity-60"
                    viewBox="0 0 100 12"
                  >
                    <path
                      d="M0 6 Q5 0 10 6 T20 6 T30 1 T40 10 T50 3 T60 8 T70 2 T80 9 T90 4 T100 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
