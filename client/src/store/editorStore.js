import { create } from "zustand";
import { API_URL, uploadFiles as uploadMedia } from "../services/http";
import {
  createProject as createProjectRequest,
  cancelExport as cancelExportRequest,
  exportProject as exportProjectRequest,
  getExportProgress as getExportProgressRequest,
  getProject,
  saveProject as saveProjectRequest,
} from "../services/projectService";
import { findAvailableTrack, getClipGroup, getTrackGroup, normalizeClipTracks } from "../components/editor/timelineTracks";
import { DEFAULT_ASPECT_RATIO } from "../constants/aspectRatios";

const clone = (value) => JSON.parse(JSON.stringify(value));
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const getAssetUrl = (asset) => asset.url || `${API_URL}/uploads/${encodeURIComponent(asset.fileName)}`;
const getDefaultLayerOrder = (clip, index) => (
  (clip.kind === "video" ? 0 : clip.kind === "image" ? 1000 : clip.kind === "text" ? 2000 : -1) + index / 1000
);
const normalizeClipLayers = (clips) => {
  const orderedVisualClips = clips
    .map((clip, index) => ({ clip, index }))
    .filter(({ clip }) => clip.kind === "video" || clip.kind === "image" || clip.kind === "text")
    .sort((first, second) => (
      Number(first.clip.layerOrder ?? getDefaultLayerOrder(first.clip, first.index))
      - Number(second.clip.layerOrder ?? getDefaultLayerOrder(second.clip, second.index))
    ));
  const layers = new Map(orderedVisualClips.map(({ clip }, index) => [clip.id, index]));
  return clips.map((clip) => layers.has(clip.id) ? { ...clip, layerOrder: layers.get(clip.id) } : clip);
};
const nextLayerOrder = (clips) => Math.max(-1, ...clips
  .filter((clip) => clip.kind === "video" || clip.kind === "image" || clip.kind === "text")
  .map((clip, index) => Number(clip.layerOrder ?? getDefaultLayerOrder(clip, index)))) + 1;
let projectLoadId = 0;

export const useEditorStore = create((set, get) => ({
  assets: [],
  clips: [],
  projectId: null,
  projectName: "Untitled project",
  aspectRatio: DEFAULT_ASPECT_RATIO,
  backgroundColor: "#000000",
  backgroundAssetId: null,
  clerkId: null,
  projectLoaded: false,
  isSaving: false,
  uploadProgress: 0,
  error: null,
  selectedClipId: null,
  currentTime: 0,
  isPlaying: false,
  zoom: 1,
  history: [],
  future: [],

  loadProject: (project, clerkId) => set({
    projectId: project._id,
    projectName: project.name,
    aspectRatio: project.aspectRatio || DEFAULT_ASPECT_RATIO,
    backgroundColor: project.backgroundColor || "#000000",
    backgroundAssetId: project.backgroundAssetId || null,
    clerkId,
    assets: (project.assets || []).map((asset) => ({ ...asset, url: getAssetUrl(asset) })),
    clips: normalizeClipLayers(normalizeClipTracks(project.clips || [])),
    projectLoaded: true,
    isSaving: false,
    error: null,
    selectedClipId: null,
    currentTime: 0,
    history: [],
    future: [],
  }),

  setProjectName: (projectName) => set({ projectName }),
  setProjectBackground: (patch) => set((state) => ({ ...patch, backgroundColor: patch.backgroundColor || state.backgroundColor })),
  setSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),

  openProject: async (projectId, clerkId, token) => {
    const requestId = ++projectLoadId;
    const project = await getProject(projectId, token);
    if (requestId === projectLoadId) get().loadProject(project, clerkId);
    return project;
  },

  createProject: async (clerkId, token) => {
    const requestId = ++projectLoadId;
    const project = await createProjectRequest(token);
    if (requestId === projectLoadId) get().loadProject(project, clerkId);
    return project;
  },

  saveCurrentProject: async (projectId, project, token) => {
    const { projectName, assets, clips } = get();
    if (!projectId) return;
    return saveProjectRequest(projectId, project || { name: projectName, assets, clips }, token);
  },

  exportCurrentProject: async (settings, token) => {
    const { projectId } = get();
    if (!projectId) throw new Error("Open a project before exporting.");
    return exportProjectRequest(projectId, settings, token);
  },

  getExportProgress: async (projectId, exportId, token) => getExportProgressRequest(projectId, exportId, token),
  cancelExport: async (projectId, exportId, token) => cancelExportRequest(projectId, exportId, token),

  uploadFiles: async (files, token) => {
    set({ error: null, uploadProgress: 0 });
    const assets = await uploadMedia(files, token, (uploadProgress) => set({ uploadProgress }));
    set((state) => ({ assets: [...state.assets, ...assets.map((asset) => ({ ...asset, url: getAssetUrl(asset) }))] }));
    return assets;
  },

  snapshot: () => {
    const { assets, clips } = get();
    set((state) => ({ history: [...state.history.slice(-39), clone({ assets, clips })], future: [] }));
  },

  addToTimeline: (assetId, track = null, startAt = null) => {
    const { assets, clips } = get();
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const kind = asset.kind;
    const group = getClipGroup({ kind });
    if (track && getTrackGroup(track) !== group) return;
    const duration = Math.max(0.1, asset.duration || 5);
    const start = startAt === null
      ? clips.filter((clip) => getClipGroup(clip) === group).reduce((max, clip) => Math.max(max, clip.start + clip.duration), 0)
      : Math.max(0, startAt);
    const targetTrack = findAvailableTrack(clips, group, start, duration, null, track);
    const clip = {
      id: makeId(),
      assetId,
      name: asset.name,
      kind,
      track: targetTrack,
      start,
      sourceStart: 0,
      duration,
      volume: 100,
      muted: false,
      crop: "fit",
      speed: 1,
      opacity: 100,
      effects: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
      ...(kind === "video" || kind === "image" ? { layerOrder: nextLayerOrder(clips) } : {}),
      ...(kind === "image" || kind === "video" ? { x: 50, y: 50, scale: 100, rotation: 0 } : {}),
    };
    get().snapshot();
    set((state) => ({ clips: [...state.clips, clip], selectedClipId: clip.id }));
  },

  addTextClip: (start = get().currentTime) => {
    const clips = get().clips;
    const duration = 5;
    const startAt = Math.max(0, start);
    const track = findAvailableTrack(clips, "text", startAt, duration);
    get().snapshot();
    const clip = {
      id: makeId(),
      name: "Text overlay",
      kind: "text",
      track,
      text: "Your title",
      start: startAt,
      sourceStart: 0,
      duration: 5,
      speed: 1,
      opacity: 100,
      textColor: "#ffffff",
      fontSize: 48,
      fontFamily: "Arial",
      x: 50,
      y: 50,
      scale: 100,
      rotation: 0,
      layerOrder: nextLayerOrder(clips),
      textPosition: "center",
      animation: { type: "none", duration: 0.5 },
    };
    set((state) => ({ clips: [...state.clips, clip], selectedClipId: clip.id }));
  },

  pasteClip: (sourceClip, start = get().currentTime) => {
    if (!sourceClip) return null;
    const clips = get().clips;
    const startAt = Math.max(0, Number(start) || 0);
    const group = getClipGroup(sourceClip);
    const clip = {
      ...clone(sourceClip),
      id: makeId(),
      start: startAt,
      ...((sourceClip.kind === "video" || sourceClip.kind === "image" || sourceClip.kind === "text")
        ? { layerOrder: nextLayerOrder(clips) }
        : {}),
      track: findAvailableTrack(clips, group, startAt, sourceClip.duration, null, sourceClip.track),
    };
    get().snapshot();
    set((state) => ({
      clips: [...state.clips, clip],
      selectedClipId: clip.id,
      currentTime: startAt,
    }));
    return clip.id;
  },

  duplicateClip: (id) => {
    const sourceClip = get().clips.find((clip) => clip.id === id);
    if (!sourceClip) return null;
    return get().pasteClip(sourceClip, sourceClip.start + sourceClip.duration);
  },

  selectClip: (id) => set({ selectedClipId: id }),
  setCurrentTime: (time) => set({ currentTime: Math.max(0, Number(time) || 0) }),
  setPlaying: (value) => set({ isPlaying: value }),
  setZoom: (zoom) => set({ zoom }),

  updateClip: (id, patch, { history = true } = {}) => {
    if (!get().clips.some((clip) => clip.id === id)) return;
    if (history) get().snapshot();
    set((state) => ({
      clips: state.clips.map((clip) => {
        if (clip.id !== id) return clip;
        const updated = { ...clip, ...patch };
        if (patch.speed !== undefined && (clip.kind === "video" || clip.kind === "audio")) {
          const asset = state.assets.find((item) => item.id === clip.assetId);
          const availableSource = asset?.duration
            ? Math.max(0.1, asset.duration - (clip.sourceStart || 0))
            : clip.duration * (clip.speed || 1);
          const sourceLength = Math.min(clip.duration * (clip.speed || 1), availableSource);
          updated.duration = Math.max(0.1, sourceLength / updated.speed);
        }
        return updated;
      }),
    }));
  },

  setClipLayer: (id, direction) => {
    const clips = get().clips;
    const target = clips.find((clip) => clip.id === id);
    if (!target || !["video", "image", "text"].includes(target.kind)) return;
    const ordered = normalizeClipLayers(clips)
      .filter((clip) => clip.kind === "video" || clip.kind === "image" || clip.kind === "text")
      .sort((first, second) => first.layerOrder - second.layerOrder);
    const currentIndex = ordered.findIndex((clip) => clip.id === id);
    if (currentIndex < 0 || (direction === "front" && currentIndex === ordered.length - 1)
      || (direction === "back" && currentIndex === 0)) return;
    const [movingClip] = ordered.splice(currentIndex, 1);
    ordered.splice(direction === "front" ? ordered.length : 0, 0, movingClip);
    const layerOrders = new Map(ordered.map((clip, index) => [clip.id, index]));
    get().snapshot();
    set((state) => ({
      clips: state.clips.map((clip) => layerOrders.has(clip.id)
        ? { ...clip, layerOrder: layerOrders.get(clip.id) }
        : clip),
    }));
  },

  trimClip: (id, patch) => {
    const clip = get().clips.find((item) => item.id === id);
    if (!clip || !["video", "audio", "image", "text"].includes(clip.kind)) return;
    const nextStart = Math.max(0, Number(patch.start) || 0);
    const nextDuration = Math.max(0.1, Number(patch.duration) || 0.1);
    const nextSourceStart = clip.kind === "video" || clip.kind === "audio"
      ? Math.max(0, Number(patch.sourceStart) || 0)
      : clip.sourceStart || 0;
    const nextEnd = nextStart + nextDuration;
    const hasOverlap = get().clips.some((item) => (
      item.id !== id
      && item.track === clip.track
      && nextStart < item.start + item.duration
      && nextEnd > item.start
    ));
    if (hasOverlap) return;
    get().updateClip(id, {
      start: nextStart,
      duration: nextDuration,
      sourceStart: nextSourceStart,
    }, { history: false });
  },

  moveClip: (id, start, track) => {
    const clip = get().clips.find((item) => item.id === id);
    if (!clip) return false;
    const group = getClipGroup(clip);
    if (track && track !== "auto" && getTrackGroup(track) !== group) return false;
    const nextStart = Math.max(0, start);
    const nextTrack = findAvailableTrack(get().clips, group, nextStart, clip.duration, id, track === "auto" ? null : track);
    get().snapshot();
    set((state) => ({
      clips: state.clips.map((clip) => clip.id === id
        ? { ...clip, start: nextStart, track: nextTrack }
        : clip),
    }));
    return true;
  },

  splitClip: (id, atTime) => {
    const clip = get().clips.find((item) => item.id === id);
    if (!clip) return;
    const local = atTime - clip.start;
    if (local < 0.15 || local > clip.duration - 0.15) return;
    get().snapshot();
    const right = { ...clip, id: makeId(), start: atTime, sourceStart: clip.sourceStart + local * (clip.speed || 1), duration: clip.duration - local };
    set((state) => ({
      clips: state.clips.flatMap((item) => item.id === id ? [{ ...item, duration: local }, right] : [item]),
      selectedClipId: right.id,
    }));
  },

  removeClip: (id) => {
    if (!get().clips.some((clip) => clip.id === id)) return;
    get().snapshot();
    set((state) => ({
      clips: state.clips.filter((clip) => clip.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    }));
  },

  removeAsset: (assetId) => {
    const { assets, clips, selectedClipId } = get();
    if (!assets.some((asset) => asset.id === assetId)) return;
    const removedClipIds = new Set(clips.filter((clip) => clip.assetId === assetId).map((clip) => clip.id));
    get().snapshot();
    set((state) => ({
      assets: state.assets.filter((asset) => asset.id !== assetId),
      clips: state.clips.filter((clip) => clip.assetId !== assetId),
      backgroundAssetId: state.backgroundAssetId === assetId ? null : state.backgroundAssetId,
      selectedClipId: removedClipIds.has(selectedClipId) ? null : state.selectedClipId,
    }));
  },

  undo: () => set((state) => {
    if (!state.history.length) return {};
    const previous = state.history[state.history.length - 1];
    const previousAssets = Array.isArray(previous) ? state.assets : previous.assets;
    return {
      assets: previousAssets,
      clips: Array.isArray(previous) ? previous : previous.clips,
      history: state.history.slice(0, -1),
      future: [clone({ assets: state.assets, clips: state.clips }), ...state.future],
    };
  }),
  redo: () => set((state) => {
    if (!state.future.length) return {};
    const next = state.future[0];
    return {
      assets: next.assets,
      clips: next.clips,
      future: state.future.slice(1),
      history: [...state.history, clone({ assets: state.assets, clips: state.clips })],
    };
  }),
}));
