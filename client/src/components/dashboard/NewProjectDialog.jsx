import { useRef, useState } from "react";
import { ArrowLeft, FilePlus2, Film, Image, LoaderCircle, Music2, RectangleHorizontal, RectangleVertical, Square, Upload, X } from "lucide-react";
import { ASPECT_RATIOS, DEFAULT_ASPECT_RATIO } from "../../constants/aspectRatios";

const formatSize = (bytes) => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const getKind = (file) => file.type.startsWith("video/")
  ? "video"
  : file.type.startsWith("audio/") ? "audio" : "image";

export default function NewProjectDialog({
  onClose,
  onCreateBlank,
  onCreateFromFiles,
  isCreating,
  progress,
  error,
}) {
  const inputRef = useRef(null);
  const [mode, setMode] = useState("choose");
  const [files, setFiles] = useState([]);
  const [projectName, setProjectName] = useState("Untitled project");
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);

  const addFiles = (selectedFiles) => {
    const additions = Array.from(selectedFiles || []);
    setFiles((currentFiles) => {
      const currentKeys = new Set(currentFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const newFiles = additions.filter((file) => (
        !currentKeys.has(`${file.name}-${file.size}-${file.lastModified}`)
      ));
      return [...currentFiles, ...newFiles];
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && !isCreating && onClose()}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="create-project-title" className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#11151d] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            {mode !== "choose" && (
              <button onClick={() => setMode("choose")} disabled={isCreating} aria-label="Back to project options" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
                <ArrowLeft size={17} />
              </button>
            )}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">New project</p>
              <h2 id="create-project-title" className="mt-1 text-lg font-semibold text-white">
                {mode === "choose" ? "How would you like to start?" : mode === "import" ? "Import your media" : "Set up your video"}
              </h2>
            </div>
          </div>
          <button onClick={onClose} disabled={isCreating} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-40" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {mode === "choose" ? (
          <div className="space-y-4 p-6">
            {error && <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setMode("blank")}
              disabled={isCreating}
              className="group rounded-xl border border-white/10 bg-[#0b0e13] p-5 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.04] disabled:opacity-60"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><FilePlus2 size={20} /></span>
              <span className="mt-4 block text-sm font-semibold text-white">Blank editor</span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">Open an empty project and build your timeline.</span>
              {isCreating && <LoaderCircle size={16} className="mt-4 animate-spin text-cyan-300" />}
            </button>
            <button
              onClick={() => setMode("import")}
              disabled={isCreating}
              className="group rounded-xl border border-white/10 bg-[#0b0e13] p-5 text-left transition hover:border-indigo-400/50 hover:bg-indigo-400/[0.04] disabled:opacity-60"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300"><Upload size={20} /></span>
              <span className="mt-4 block text-sm font-semibold text-white">Import media</span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">Choose multiple videos, images, or audio files.</span>
            </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {mode === "import" && (
              <>
                <label className="block space-y-2">
                  <span className="text-xs font-medium text-slate-300">Project name</span>
                  <input value={projectName} onChange={(event) => setProjectName(event.target.value)} maxLength={120} className="w-full rounded-xl border border-white/10 bg-[#0b0e13] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/60" />
                </label>

                <button onClick={() => inputRef.current?.click()} disabled={isCreating} className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-500/[0.04] px-5 py-7 text-center transition hover:border-cyan-400 hover:bg-cyan-500/[0.08] disabled:opacity-50">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><FilePlus2 size={21} /></span>
                  <span className="text-sm font-semibold text-white">Browse files</span>
                  <span className="text-xs text-slate-500">Select multiple files or add more later</span>
                </button>
                <input ref={inputRef} type="file" multiple accept="video/*,image/*,audio/*" className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
              </>
            )}
            {mode === "blank" && (
              <label className="block space-y-2">
                <span className="text-xs font-medium text-slate-300">Project name</span>
                <input value={projectName} onChange={(event) => setProjectName(event.target.value)} maxLength={120} className="w-full rounded-xl border border-white/10 bg-[#0b0e13] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/60" />
              </label>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-300">Video aspect ratio</p>
              <div className="grid grid-cols-5 gap-2">
                {ASPECT_RATIOS.map(({ value, label, width, height }) => {
                  const Icon = value === "1:1" ? Square : width > height ? RectangleHorizontal : RectangleVertical;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={aspectRatio === value}
                      onClick={() => setAspectRatio(value)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-1 py-2 text-center transition ${aspectRatio === value ? "border-cyan-400 bg-cyan-400/10 text-cyan-200" : "border-white/10 text-slate-400 hover:border-white/25 hover:text-white"}`}
                    >
                      <Icon size={17} />
                      <span className="text-[9px]">{label}</span>
                      <span className="font-mono text-[9px]">{value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {files.length > 0 && (
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-white/5 bg-[#0b0e13] p-2">
                {files.map((file, index) => {
                  const Icon = getKind(file) === "video" ? Film : getKind(file) === "audio" ? Music2 : Image;
                  return (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.03]">
                      <Icon size={16} className="shrink-0 text-cyan-400" />
                      <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{file.name}</span>
                      <span className="text-[10px] text-slate-500">{formatSize(file.size)}</span>
                      <button onClick={() => setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index))} disabled={isCreating} className="rounded p-1 text-slate-500 hover:text-rose-400" aria-label={`Remove ${file.name}`}>
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {isCreating && mode === "import" && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400"><span>Uploading selected media…</span><span>{progress}%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} /></div>
              </div>
            )}
            {error && <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
              <button onClick={onClose} disabled={isCreating} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5 disabled:opacity-40">Cancel</button>
              {mode === "import" ? (
                <button onClick={() => onCreateFromFiles({ name: projectName, files, aspectRatio })} disabled={isCreating || !files.length || !projectName.trim()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">
                {isCreating ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />}
                {isCreating ? `Uploading… ${progress}%` : `Upload & start editing · ${files.length}`}
                </button>
              ) : (
                <button onClick={() => onCreateBlank({ name: projectName, aspectRatio })} disabled={isCreating} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">
                  {isCreating ? <LoaderCircle size={15} className="animate-spin" /> : <FilePlus2 size={15} />}
                  {isCreating ? "Creating…" : "Create blank project"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
