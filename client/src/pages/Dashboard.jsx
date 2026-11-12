import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardTopbar from "../components/dashboard/DashboardTopbar";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import ProjectGrid from "../components/dashboard/ProjectGrid";
import NewProjectDialog from "../components/dashboard/NewProjectDialog";
import useProjectStore from "../store/projectStore";
import { toast } from "../components/ui/toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [search, setSearch] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dialogError, setDialogError] = useState("");
  const [actionError, setActionError] = useState("");
  const projects = useProjectStore((state) => state.projects);
  const isLoading = useProjectStore((state) => state.isLoading);
  const projectError = useProjectStore((state) => state.error);
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const createProject = useProjectStore((state) => state.createProject);
  const createProjectFromFiles = useProjectStore((state) => state.createProjectFromFiles);
  const deleteProject = useProjectStore((state) => state.deleteProject);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return undefined;
    let active = true;
    getToken()
      .then((token) => loadProjects(token))
      .catch(() => {
        if (!active) return;
      });
    return () => { active = false; };
  }, [isLoaded, isSignedIn, getToken, loadProjects]);

  if (!isLoaded) {
    return <div className="flex min-h-screen items-center justify-center bg-[#07090e] text-xs font-mono text-cyan-400">LOADING WORKSPACE...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#07090e] text-slate-400">
        <p className="text-sm">Session expired or unauthorized.</p>
        <button onClick={() => navigate("/")} className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white transition hover:bg-white/10">Return to landing</button>
      </div>
    );
  }

  const displayName = user?.firstName || user?.fullName || "Creator";
  const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(search.toLowerCase()));

  const createBlankProject = async ({ name, aspectRatio }) => {
    setIsCreating(true);
    setDialogError("");
    try {
      const token = await getToken();
      const project = await createProject(token, { name, aspectRatio });
      setShowNewProject(false);
      navigate(`/editor/${project._id}`);
    } catch (error) {
      setDialogError(error.response?.data?.error || "Could not create a new project.");
    } finally {
      setIsCreating(false);
    }
  };

  const importFiles = async ({ name, files, aspectRatio }) => {
    setIsCreating(true);
    setUploadProgress(0);
    setDialogError("");
    try {
      const token = await getToken();
      const project = await createProjectFromFiles(token, name, files, aspectRatio, setUploadProgress);
      setShowNewProject(false);
      navigate(`/editor/${project._id}`);
    } catch (error) {
      setDialogError(error.response?.data?.error || error.message || "Media upload failed. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const removeProject = async (projectId) => {
    if (!window.confirm("Delete this project and its unused uploaded media? This cannot be undone.")) return;
    try {
      const token = await getToken();
      await deleteProject(projectId, token);
      setActionError("");
      toast("Project deleted", "success");
    } catch (error) {
      const message = error.response?.data?.error || "Could not delete this project.";
      setActionError(message);
      toast(message, "error", 5000);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#07090e] font-sans text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200">
      <DashboardSidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-[#07090e]">
        <DashboardTopbar />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col space-y-8 p-5 sm:p-8">
          <WelcomeBanner displayName={displayName} openNewProject={() => { setDialogError(""); setShowNewProject(true); }} />
          {(actionError || projectError) && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">{actionError || projectError}</p>}
          {isLoading && projects.length === 0
            ? <div role="status" aria-label="Loading your projects" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="aurora-skeleton h-52 rounded-2xl border border-white/5" />)}</div>
            : (
              <ProjectGrid
                filteredProjects={filteredProjects}
                search={search}
                setSearch={setSearch}
                openEditor={(projectId) => navigate(`/editor/${projectId}`)}
                onDelete={removeProject}
                onCreateProject={() => { setDialogError(""); setShowNewProject(true); }}
              />
            )}
        </div>
      </main>
      {showNewProject && (
        <NewProjectDialog
          onClose={() => setShowNewProject(false)}
          onCreateBlank={createBlankProject}
          onCreateFromFiles={importFiles}
          isCreating={isCreating}
          progress={uploadProgress}
          error={dialogError}
        />
      )}
    </div>
  );
}
