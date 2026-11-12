import { Clapperboard, FolderOpen } from "lucide-react";

export default function DashboardSidebar() {
  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-white/[0.06] bg-[#090b10] md:sticky md:top-0 md:flex">
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/[0.06] px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/15">
          <Clapperboard size={17} />
        </span>
        <span className="text-sm font-semibold tracking-tight text-white">Aurora <span className="font-normal text-slate-400">Studio</span></span>
      </div>
      <nav aria-label="Dashboard" className="p-3">
        <a href="#projects" aria-current="page" className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2.5 text-xs font-medium text-cyan-300">
          <FolderOpen size={16} /> Projects
        </a>
      </nav>
    </aside>
  );
}
