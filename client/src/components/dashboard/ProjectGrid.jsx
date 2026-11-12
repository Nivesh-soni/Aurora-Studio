import { motion } from "framer-motion";
import { Search, Play, Trash2, Film } from "lucide-react";

export default function ProjectGrid({ filteredProjects, search, setSearch, openEditor, onDelete, onCreateProject }) {
  return (
    <section id="projects" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xs font-mono tracking-wider uppercase text-slate-400 font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Projects ({filteredProjects.length})
        </h2>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter projects..."
            className="bg-[#0d1017] border border-white/10 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 w-full sm:w-60 transition shadow-inner"
          />
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
        {filteredProjects.map((project, index) => {
          const projectDuration = Math.max(0, ...(project.clips || []).map((clip) => (clip.start || 0) + (clip.duration || 0)));
          const projectIcon = project.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AS";
          return (
          <motion.div
            key={project._id}
            whileHover={{ y: -3 }}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0d1017] shadow-xl transition hover:border-cyan-500/40"
          >
            <button type="button" onClick={() => openEditor(project._id)} className={`relative flex h-36 w-full items-center justify-center overflow-hidden border-b border-white/5 text-left ${["bg-linear-to-br from-cyan-950 to-slate-900", "bg-linear-to-br from-indigo-950 to-slate-900", "bg-linear-to-br from-blue-950 to-slate-900"][index % 3]}`}>
              <span className="text-4xl font-mono font-bold text-white/10 group-hover:text-white/20 transition-colors">
                {projectIcon}
              </span>

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-xs">
                <div className="h-10 w-10 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/40">
                  <Play size={16} fill="currentColor" />
                </div>
              </div>

              <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-slate-300 border border-white/5">
                {`${String(Math.floor(projectDuration / 60)).padStart(2, "0")}:${String(Math.floor(projectDuration % 60)).padStart(2, "0")}`}
              </span>

              <span className="absolute top-2.5 left-2.5 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {project.resolution || "Draft"}
              </span>
            </button>

            <div className="p-4 flex items-start justify-between gap-2 bg-[#090b10]">
              <div>
                <h3 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {project.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  {project.updatedAt ? `Edited ${new Date(project.updatedAt).toLocaleDateString()}` : "New project"}
                </p>
              </div>
              <button type="button" onClick={() => onDelete(project._id)} aria-label={`Delete ${project.name}`} title="Delete project" className="rounded-lg p-2 text-slate-500 opacity-100 transition hover:bg-rose-500/10 hover:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100">
                <Trash2 size={15} />
              </button>
            </div>
          </motion.div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-[#0d1017]">
          <Film size={28} className="mx-auto text-slate-600 mb-3" />
          <p className="text-xs text-slate-300 font-semibold">No projects found</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {search ? "Try a different search, or" : "Create your first project to start editing."}
          </p>
          <button onClick={onCreateProject} className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300">
            New project
          </button>
        </div>
      )}
    </section>
  );
}