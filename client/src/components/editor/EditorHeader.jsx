import { useNavigate } from "react-router-dom";
import { ArrowLeft, Undo2, Redo2, Download, Upload, CloudCheck, CloudOff, Keyboard, LoaderCircle } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

export default function EditorHeader({ history, future, undo, redo, setExportOpen, onImport, projectName, setProjectName, isSaving, onShowShortcuts, hasError }) {
  const navigate = useNavigate();

  return (
    <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0c0e12] px-3 sm:px-5">
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg p-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-xs font-bold text-cyan-400">
            AS
          </div>
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            aria-label="Project name"
            maxLength={120}
            className="w-28 border-b border-transparent bg-transparent py-0.5 text-xs font-semibold text-white outline-none transition-colors focus:border-cyan-500 sm:w-48"
          />
          <span role="status" aria-live="polite" className={`hidden sm:inline-flex items-center gap-1 text-[10px] ${hasError ? "text-rose-300" : "text-slate-400"}`}>
            {hasError ? <CloudOff size={12} /> : isSaving ? <LoaderCircle size={12} className="animate-spin" /> : <CloudCheck size={12} className="text-emerald-400" />}
            {hasError ? "Not saved" : isSaving ? "Saving" : "Saved"}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button onClick={onImport} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white sm:px-3">
          <Upload size={14} /><span className="hidden sm:inline">Import</span>
        </button>
        <div className="flex items-center bg-[#141820] border border-white/10 rounded-lg p-0.5">
          <button title="Undo (Ctrl+Z)" aria-label="Undo" disabled={!history.length} onClick={undo} className="p-1.5 rounded text-slate-300 hover:bg-white/5 disabled:opacity-30 cursor-pointer"><Undo2 size={14} /></button>
          <button title="Redo (Ctrl+Shift+Z)" aria-label="Redo" disabled={!future.length} onClick={redo} className="p-1.5 rounded text-slate-300 hover:bg-white/5 disabled:opacity-30 cursor-pointer"><Redo2 size={14} /></button>
        </div>
        <button type="button" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts" onClick={onShowShortcuts} className="hidden rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white md:flex"><Keyboard size={14} /></button>

        <button 
          onClick={() => setExportOpen(true)} 
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-1.5 text-xs font-bold text-white transition cursor-pointer shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/40 active:scale-[0.97]"
        >
          <Download size={14} /> Export
        </button>

        <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-lg" } }} />
      </div>
    </header>
  );
}