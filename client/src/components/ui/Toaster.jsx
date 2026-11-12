import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { dismiss, useToastStore } from "./toast";


const styles = {
  success: { icon: CircleCheck, tone: "text-emerald-300" },
  error: { icon: CircleAlert, tone: "text-rose-300" },
  info: { icon: Info, tone: "text-cyan-300" },
};

export default function Toaster() {
  const items = useToastStore((state) => state.items);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end">
      <AnimatePresence initial={false}>
        {items.map(({ id, message, type }) => {
          const { icon: Icon, tone } = styles[type] || styles.info;
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              role={type === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border border-white/10 bg-[#0c0f14]/90 px-3.5 py-2.5 text-xs text-slate-100 shadow-xl shadow-black/40 backdrop-blur-xl"
            >
              <Icon size={16} className={`shrink-0 ${tone}`} />
              <span className="min-w-0 flex-1">{message}</span>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(id)} className="rounded p-1 text-slate-500 transition hover:bg-white/5 hover:text-white"><X size={13} /></button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
