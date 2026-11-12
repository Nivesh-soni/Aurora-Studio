import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function PanelDrawer({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] xl:hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.section
            role="dialog" aria-modal="true" aria-label={title}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="absolute inset-x-0 bottom-0 flex h-[78vh] max-h-[640px] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-[#0c0f14] shadow-2xl shadow-black/60 sm:inset-x-auto sm:right-4 sm:w-[380px]"
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] px-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">{title}</h2>
              <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"><X size={16} /></button>
            </div>
            <div className="min-h-0 flex-1">{children}</div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
