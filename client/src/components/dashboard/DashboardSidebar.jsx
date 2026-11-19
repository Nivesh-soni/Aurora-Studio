import { Clapperboard, FolderOpen } from "lucide-react";

export default function DashboardSidebar() {
  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-white/[0.06] bg-[#090b10] md:sticky md:top-0 md:flex">
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/[0.06] px-5">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-cyan-500 to-indigo-500 p-px shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#07090e] rounded-[7px] flex items-center justify-center">
              <img
                src="logo.svg"
                className="text-cyan-400 group-hover:rotate-6 transition-transform"
                alt="Aurora Studio Logo"
              />
            </div>
          </div>
          <span className="font-semibold text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
            Aurora <span className="text-slate-400 font-normal">Studio</span>
          </span>
        </a>
      </div>
      <nav aria-label="Dashboard" className="p-3">
        <a href="#projects" aria-current="page" className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2.5 text-xs font-medium text-cyan-300">
          <FolderOpen size={16} /> Projects
        </a>
      </nav>
    </aside>
  );
}
