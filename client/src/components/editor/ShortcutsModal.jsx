import { useEffect } from "react";
import { X } from "lucide-react";

const rows = [
  ["Play / pause", "Space"],
  ["Split selected clip at playhead", "S"],
  ["Duplicate selected clip", "D"],
  ["Delete selected clip", "Delete / Backspace"],
  ["Move selected clip by 0.25 seconds", ", / ."],
  ["Move selected clip by 1 second", "Shift + , / ."],
  ["Step one frame", "← / →"],
  ["Step one second", "Shift + ← / →"],
  ["Jump to start / end", "Home / End"],
  ["Undo", "Ctrl / ⌘ + Z"],
  ["Redo", "Ctrl / ⌘ + Shift + Z or Y"],
  ["Copy, cut, paste selected clip", "Ctrl / ⌘ + C / X / V"],
  ["Show save status", "Ctrl / ⌘ + S"],
  ["Deselect clip", "Esc"],
  ["Show this list", "?"],
];

export default function ShortcutsModal({ onClose }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape" || event.key === "?") { event.preventDefault(); onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="shortcuts-heading" className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#11151d] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="shortcuts-heading" className="text-base font-semibold text-white">Keyboard shortcuts</h2>
          <button type="button" autoFocus onClick={onClose} aria-label="Close shortcuts" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"><X size={17} /></button>
        </div>
        <dl className="max-h-[70vh] divide-y divide-white/5 overflow-y-auto px-5 py-2">
          {rows.map(([action, keys]) => (
            <div key={action} className="flex items-center justify-between gap-4 py-2.5 text-xs">
              <dt className="text-slate-300">{action}</dt>
              <dd><kbd className="rounded-md border border-white/10 bg-[#0b0e13] px-2 py-1 font-mono text-[10px] text-cyan-200">{keys}</kbd></dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-white/10 px-5 py-3 text-[11px] text-slate-500">On Mac, use ⌘ in place of Ctrl.</p>
      </section>
    </div>
  );
}
