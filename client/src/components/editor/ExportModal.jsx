import { useState } from "react";
import { Download, LoaderCircle, X } from "lucide-react";

export default function ExportModal({ onClose, onExport, isExporting, progress = 0, error, clipCount, aspectRatio = "16:9", projectName = "" }) {
  const [resolution, setResolution] = useState("1080p");
  const [fps, setFps] = useState(30);
  const [name, setName] = useState(projectName);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => !isExporting && event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="export-heading" className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#11151d] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">Aurora render</p>
            <h2 id="export-heading" className="mt-1 text-base font-semibold text-white">Export your video</h2>
          </div>
          <button onClick={onClose} aria-label={isExporting ? "Cancel export" : "Close export dialog"} title={isExporting ? "Cancel export" : "Close"} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={17} /></button>
        </div>
        <div className="space-y-5 p-5">
          <label className="block space-y-2 text-xs text-slate-400">
            File name
            <input value={name} onChange={(event) => setName(event.target.value)} disabled={isExporting} maxLength={100} placeholder="aurora-export" className="w-full rounded-lg border border-white/10 bg-[#0b0e13] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-50" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2 text-xs text-slate-400">
              Resolution
              <select value={resolution} onChange={(event) => setResolution(event.target.value)} disabled={isExporting} className="w-full rounded-lg border border-white/10 bg-[#0b0e13] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-50">
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="4K">4K Ultra HD</option>
              </select>
            </label>
            <label className="space-y-2 text-xs text-slate-400">
              Frame rate
              <select value={fps} onChange={(event) => setFps(Number(event.target.value))} disabled={isExporting} className="w-full rounded-lg border border-white/10 bg-[#0b0e13] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-50">
                {[24, 30, 60].map((rate) => <option key={rate} value={rate}>{rate} FPS</option>)}
              </select>
            </label>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#0b0e13] px-4 py-3 text-xs text-slate-400">
            <div className="flex justify-between"><span>Timeline clips</span><span className="font-medium text-slate-200">{clipCount}</span></div>
            <div className="mt-2 flex justify-between"><span>Aspect ratio</span><span className="font-medium text-slate-200">{aspectRatio}</span></div>
          </div>
          {isExporting && (
            <div aria-live="polite">
              <div className="mb-2 flex justify-between text-xs text-slate-300">
                <span>Rendering video…</span>
                <span>{progress}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Export progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="h-2 overflow-hidden rounded-full bg-white/10"
              >
                <div className="h-full rounded-full bg-cyan-400 transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Use the X button to cancel the export.</p>
            </div>
          )}
          {error && <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
          <button onClick={() => onExport({ resolution, fps, name })} disabled={isExporting || !clipCount || !name.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">
            {isExporting ? <LoaderCircle size={17} className="animate-spin" /> : <Download size={17} />}
            {isExporting ? "Rendering…" : "Render & download MP4"}
          </button>
        </div>
      </section>
    </div>
  );
}
