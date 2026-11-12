import { create } from "zustand";
import { uploadFiles } from "../services/http";
import { createProject as createProjectRequest, deleteProject as deleteProjectRequest, getProjects } from "../services/projectService";

const createInitialClips = (assets) => {
  const clips = [];
  let videoPosition = 0;
  let imagePosition = 0;

  for (const asset of assets) {
    const duration = Math.max(0.1, asset.duration || 5);
    const start = asset.kind === "video"
      ? videoPosition
      : asset.kind === "image" ? imagePosition : 0;
    clips.push({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      assetId: asset.id,
      name: asset.name,
      kind: asset.kind,
      track: asset.kind === "audio" ? "audio" : asset.kind === "image" ? "image" : "video",
      start,
      sourceStart: 0,
      duration,
      speed: 1,
      volume: 100,
      muted: false,
      opacity: 100,
      crop: "fit",
      effects: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
      ...(asset.kind === "image" || asset.kind === "video" ? { x: 50, y: 50, scale: 100, rotation: 0 } : {}),
    });
    if (asset.kind === "video") videoPosition += duration;
    if (asset.kind === "image") imagePosition += duration;
  }
  return clips;
};

const useProjectStore = create((set) => ({
  projects: [],
  isLoading: false,
  error: null,

  loadProjects: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await getProjects(token);
      set({ projects });
      return projects;
    } catch (error) {
      set({ error: error.response?.data?.error || "Could not load your saved projects." });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (token, project = {}) => {
    const created = await createProjectRequest(token, project);
    set((state) => ({ projects: [created, ...state.projects], error: null }));
    return created;
  },

  createProjectFromFiles: async (token, name, files, aspectRatio, onProgress) => {
    const assets = await uploadFiles(files, token, onProgress);
    const project = await createProjectRequest(token, {
      name,
      aspectRatio,
      assets,
      clips: createInitialClips(assets),
    });
    set((state) => ({ projects: [project, ...state.projects], error: null }));
    return project;
  },

  deleteProject: async (projectId, token) => {
    await deleteProjectRequest(projectId, token);
    set((state) => ({
      projects: state.projects.filter((project) => project._id !== projectId),
      error: null,
    }));
  },
}));

export default useProjectStore;
