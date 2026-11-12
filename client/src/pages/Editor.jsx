import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import {
  AlertCircle,
  FolderOpen,
  LoaderCircle,
  SlidersHorizontal,
  Type,
} from "lucide-react";
import { useEditorStore } from "../store/editorStore";
import EditorHeader from "../components/editor/EditorHeader";
import Sidebar from "../components/editor/Sidebar";
import Preview from "../components/editor/Preview";
import Timeline from "../components/editor/Timeline";
import Inspector from "../components/editor/Inspector";
import ExportModal from "../components/editor/ExportModal";
import ShortcutsModal from "../components/editor/ShortcutsModal";
import PanelDrawer from "../components/editor/PanelDrawer";
import { toast } from "../components/ui/toast";

export default function Editor() {
  const { projectId: routeProjectId } = useParams();
  const navigate = useNavigate();
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const fileInput = useRef(null);
  const audioInput = useRef(null);
  const clipClipboard = useRef(null);
  const saveQueue = useRef(Promise.resolve());
  const exportJobRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [inspectorDraft, setInspectorDraft] = useState(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState("media");
  const [exportError, setExportError] = useState("");
  const [pageError, setPageError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [drawer, setDrawer] = useState(null);
  const closeDrawer = useCallback(() => {
    setDrawer(null);
    setInspectorDraft(null);
  }, []);

  const assets = useEditorStore((state) => state.assets);
  const clips = useEditorStore((state) => state.clips);
  const selectedClipId = useEditorStore((state) => state.selectedClipId);
  const currentTime = useEditorStore((state) => state.currentTime);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const zoom = useEditorStore((state) => state.zoom);
  const history = useEditorStore((state) => state.history);
  const future = useEditorStore((state) => state.future);
  const projectId = useEditorStore((state) => state.projectId);
  const projectName = useEditorStore((state) => state.projectName);
  const aspectRatio = useEditorStore((state) => state.aspectRatio);
  const backgroundColor = useEditorStore((state) => state.backgroundColor);
  const backgroundAssetId = useEditorStore((state) => state.backgroundAssetId);
  const projectLoaded = useEditorStore((state) => state.projectLoaded);
  const uploadProgress = useEditorStore((state) => state.uploadProgress);
  const isSaving = useEditorStore((state) => state.isSaving);
  const storeError = useEditorStore((state) => state.error);
  const setProjectName = useEditorStore((state) => state.setProjectName);
  const setProjectBackground = useEditorStore(
    (state) => state.setProjectBackground,
  );
  const setSaving = useEditorStore((state) => state.setSaving);
  const setError = useEditorStore((state) => state.setError);
  const setUploadProgress = useEditorStore((state) => state.setUploadProgress);
  const openProject = useEditorStore((state) => state.openProject);
  const createProject = useEditorStore((state) => state.createProject);
  const saveCurrentProject = useEditorStore(
    (state) => state.saveCurrentProject,
  );
  const exportCurrentProject = useEditorStore(
    (state) => state.exportCurrentProject,
  );
  const getExportProgress = useEditorStore((state) => state.getExportProgress);
  const cancelExport = useEditorStore((state) => state.cancelExport);
  const uploadFiles = useEditorStore((state) => state.uploadFiles);
  const addToTimeline = useEditorStore((state) => state.addToTimeline);
  const addTextClip = useEditorStore((state) => state.addTextClip);
  const selectClip = useEditorStore((state) => state.selectClip);
  const setCurrentTime = useEditorStore((state) => state.setCurrentTime);
  const setPlaying = useEditorStore((state) => state.setPlaying);
  const setZoom = useEditorStore((state) => state.setZoom);
  const updateClip = useEditorStore((state) => state.updateClip);
  const moveClip = useEditorStore((state) => state.moveClip);
  const splitClip = useEditorStore((state) => state.splitClip);
  const removeClip = useEditorStore((state) => state.removeClip);
  const trimClip = useEditorStore((state) => state.trimClip);
  const duplicateClip = useEditorStore((state) => state.duplicateClip);
  const setClipLayer = useEditorStore((state) => state.setClipLayer);
  const removeAsset = useEditorStore((state) => state.removeAsset);
  const snapshot = useEditorStore((state) => state.snapshot);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const isActiveProjectLoaded =
    projectLoaded && Boolean(routeProjectId) && projectId === routeProjectId;

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    let active = true;
    const load = async () => {
      const token = await getToken();
      const project = routeProjectId
        ? await openProject(routeProjectId, user.id, token)
        : await createProject(user.id, token);
      if (!active) return;
      setPageError("");
      if (!routeProjectId)
        navigate(`/editor/${project._id}`, { replace: true });
    };
    load().catch((error) => {
      if (active)
        setPageError(
          error.response?.data?.error || "Could not open this project.",
        );
    });
    return () => {
      active = false;
    };
  }, [
    isLoaded,
    user?.id,
    routeProjectId,
    getToken,
    openProject,
    createProject,
    navigate,
  ]);

  useEffect(() => {
    if (!isActiveProjectLoaded || !projectId || !user?.id) return undefined;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      const request = {
        name: projectName,
        aspectRatio,
        backgroundColor,
        backgroundAssetId,
        assets,
        clips,
      };
      saveQueue.current = saveQueue.current.then(async () => {
        try {
          const token = await getToken();
          await saveCurrentProject(projectId, request, token);
          setError(null);
        } catch (error) {
          setError(
            error.response?.data?.error ||
              "Project changes could not be saved.",
          );
        } finally {
          setSaving(false);
        }
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [
    isActiveProjectLoaded,
    projectId,
    user?.id,
    getToken,
    projectName,
    aspectRatio,
    backgroundColor,
    backgroundAssetId,
    assets,
    clips,
    saveCurrentProject,
    setSaving,
    setError,
  ]);

  const contentDuration = Math.max(
    0,
    ...clips.map((clip) => clip.start + clip.duration),
  );
  const timelineDuration = Math.max(15, contentDuration);
  const previewDuration = Math.max(1, contentDuration);
  const togglePlayback = useCallback(() => {
    const state = useEditorStore.getState();
    if (!state.isPlaying && state.currentTime >= previewDuration)
      setCurrentTime(0);
    setPlaying(!state.isPlaying);
  }, [previewDuration, setCurrentTime, setPlaying]);
  const activeInspectorDraft =
    inspectorDraft?.id === selectedClipId ? inspectorDraft : null;
  const previewClips = activeInspectorDraft
    ? clips.map((clip) =>
        clip.id === activeInspectorDraft.id
          ? { ...clip, ...activeInspectorDraft }
          : clip,
      )
    : clips;
  const activeVideos = previewClips
    .filter(
      (clip) =>
        clip.kind === "video" &&
        currentTime >= clip.start &&
        currentTime < clip.start + clip.duration,
    )
    .sort((a, b) => a.start - b.start);
  const activeClip = activeVideos.at(-1);
  const activeAsset = assets.find((asset) => asset.id === activeClip?.assetId);
  const activeImages = previewClips
    .filter(
      (clip) =>
        clip.kind === "image" &&
        currentTime >= clip.start &&
        currentTime < clip.start + clip.duration,
    )
    .map((clip) => ({
      clip,
      asset: assets.find((asset) => asset.id === clip.assetId),
    }))
    .filter(({ asset }) => asset);
  const activeTexts = previewClips.filter(
    (clip) =>
      clip.kind === "text" &&
      currentTime >= clip.start &&
      currentTime < clip.start + clip.duration,
  );
  const activeAudio = previewClips.filter(
    (clip) =>
      clip.kind === "audio" &&
      currentTime >= clip.start &&
      currentTime < clip.start + clip.duration,
  );
  const selected = clips.find((clip) => clip.id === selectedClipId);
  const previewSelected = activeInspectorDraft
    ? { ...selected, ...activeInspectorDraft }
    : selected;
  const selectedAsset = assets.find((asset) => asset.id === selected?.assetId);
  const backgroundAsset = assets.find(
    (asset) => asset.id === backgroundAssetId && asset.kind === "image",
  );
  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => {
      const time = useEditorStore.getState().currentTime;
      if (time >= previewDuration) {
        setPlaying(false);
        return;
      }
      setCurrentTime(Math.min(previewDuration, time + 0.05));
    }, 50);
    return () => window.clearInterval(timer);
  }, [isPlaying, previewDuration, setCurrentTime, setPlaying]);

  useEffect(() => {
    const handleEditorShortcut = (event) => {
      if (exportOpen || shortcutsOpen) return;
      const target = event.target;
      const isEditingText =
        target instanceof HTMLElement &&
        target.closest(
          "input, textarea, select, [contenteditable='true'], [role='textbox']",
        );
      if (isEditingText) return;

      const store = useEditorStore.getState();
      const hasModifier = event.ctrlKey || event.metaKey;
      if (hasModifier) {
        const key = event.key.toLowerCase();
        if (key === "s") {
          event.preventDefault();
          toast(
            store.isSaving ? "Saving your changes…" : "All changes saved",
            store.isSaving ? "info" : "success",
            1800,
          );
        } else if (key === "z" && event.shiftKey) {
          event.preventDefault();
          store.redo();
        } else if (key === "z") {
          event.preventDefault();
          store.undo();
        } else if (key === "y") {
          event.preventDefault();
          store.redo();
        } else if ((key === "c" || key === "x") && store.selectedClipId) {
          const clip = store.clips.find(
            (item) => item.id === store.selectedClipId,
          );
          if (!clip) return;
          event.preventDefault();
          clipClipboard.current = JSON.parse(JSON.stringify(clip));
          if (key === "x") store.removeClip(clip.id);
          toast(key === "x" ? "Clip cut" : "Clip copied", "info", 1500);
        } else if (key === "v" && clipClipboard.current) {
          event.preventDefault();
          store.pasteClip(clipClipboard.current, store.currentTime);
          toast("Clip pasted", "success", 1500);
        }
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      } else if (
        (event.key === "Delete" || event.key === "Backspace") &&
        store.selectedClipId
      ) {
        event.preventDefault();
        store.removeClip(store.selectedClipId);
      } else if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
      } else if (event.key.toLowerCase() === "s" && store.selectedClipId) {
        event.preventDefault();
        store.splitClip(store.selectedClipId, store.currentTime);
      } else if (event.key.toLowerCase() === "d" && store.selectedClipId) {
        event.preventDefault();
        store.duplicateClip(store.selectedClipId);
        toast("Clip duplicated", "success", 1500);
      } else if (
        [",", ".", "<", ">"].includes(event.key) &&
        store.selectedClipId
      ) {
        event.preventDefault();
        const clip = store.clips.find(
          (item) => item.id === store.selectedClipId,
        );
        if (!clip) return; // 'event.repeat' hata diya taaki hold karne par continuous chale
        const direction = event.key === "," || event.key === "<" ? -1 : 1;
        const step = event.shiftKey ? 1 : 0.25; // Normal press par 0.25s, Shift par 1s
        const nextStart = Math.max(
          0,
          Math.round((clip.start + direction * step) * 1000) / 1000,
        );
        if (nextStart !== clip.start) {
          store.moveClip(clip.id, nextStart, clip.track);
        }
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const step =
          (event.shiftKey ? 1 : 1 / 30) * (event.key === "ArrowLeft" ? -1 : 1);
        store.setCurrentTime(
          Math.min(previewDuration, store.currentTime + step),
        );
      } else if (event.key === "Home") {
        event.preventDefault();
        store.setCurrentTime(0);
      } else if (event.key === "End") {
        event.preventDefault();
        store.setCurrentTime(previewDuration);
      } else if (event.key === "Escape" && !drawer) {
        store.selectClip(null);
      }
    };

    window.addEventListener("keydown", handleEditorShortcut);
    return () => window.removeEventListener("keydown", handleEditorShortcut);
  }, [exportOpen, shortcutsOpen, drawer, previewDuration, togglePlayback]);

  const handleUpload = useCallback(
    async (files) => {
      const selectedFiles = Array.from(files || []);
      if (!selectedFiles.length || !user?.id) return;
      setIsUploading(true);
      setPageError("");
      try {
        const token = await getToken();
        const uploaded = await uploadFiles(selectedFiles, token);
        uploaded.forEach((asset) => addToTimeline(asset.id));
        toast(
          `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} added to the timeline`,
          "success",
        );
      } catch (error) {
        const message =
          error.response?.data?.error ||
          error.message ||
          "Media upload failed.";
        setPageError(message);
        toast(message, "error", 5000);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [user?.id, getToken, uploadFiles, addToTimeline, setUploadProgress],
  );

  const openFilePicker = (kind = "media") => {
    (kind === "audio" ? audioInput : fileInput).current?.click();
  };
  const handleFileInputChange = (event, kind = "media") => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const acceptedFiles = files.filter((file) => {
      const isAudio =
        file.type.startsWith("audio/") ||
        /\.(aac|flac|m4a|mp3|ogg|wav)$/i.test(file.name);
      if (kind === "audio") return isAudio;
      return (
        file.type.startsWith("image/") ||
        file.type.startsWith("video/") ||
        /\.(avif|bmp|gif|jpe?g|mkv|mov|mp4|png|svg|webm|webp|m4v|avi|3gp)$/i.test(file.name)
      );
    });
    if (acceptedFiles.length !== files.length) {
      toast(
        kind === "audio"
          ? "The Audio panel only accepts audio files."
          : "The Media panel only accepts images and videos.",
        "error",
        4000,
      );
    }
    if (acceptedFiles.length) handleUpload(acceptedFiles);
  };

  const handleExportClose = async () => {
    const job = exportJobRef.current;
    if (!job) {
      setExportOpen(false);
      return;
    }

    job.cancelled = true;
    exportJobRef.current = null;
    setIsExporting(false);
    setExportProgress(0);
    setExportOpen(false);
    try {
      const token = await getToken({ skipCache: true });
      if (!token)
        throw new Error(
          "Your sign-in expired. Sign in again to cancel this export.",
        );
      await cancelExport(projectId, job.id, token);
    } catch (error) {
      setPageError(
        `${error.response?.data?.error || error.message || "Could not cancel the export."} The server may still be rendering.`,
      );
    }
  };

  const handleExport = async (settings) => {
    const exportId = crypto.randomUUID();
    const job = { id: exportId, cancelled: false };
    exportJobRef.current = job;
    setIsExporting(true);
    setExportProgress(0);
    setExportError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in to continue.");
      if (job.cancelled) return;
      const projectSnapshot = {
        name: projectName,
        aspectRatio,
        backgroundColor,
        backgroundAssetId,
        assets,
        clips,
      };
      const pendingSave = saveQueue.current
        .catch(() => undefined)
        .then(() =>
          saveCurrentProject(projectId, projectSnapshot, token),
        );
      saveQueue.current = pendingSave.catch((error) => {
        setError(
          error.response?.data?.error || "Project changes could not be saved.",
        );
      });
      await pendingSave;
      if (job.cancelled) return;
      const pollProgress = async () => {
        while (exportJobRef.current?.id === exportId && !job.cancelled) {
          try {
            let progressToken = await getToken();
            if (!progressToken)
              throw new Error(
                "Your sign-in expired. Sign in again to continue exporting.",
              );
            let result;
            try {
              result = await getExportProgress(
                projectId,
                exportId,
                progressToken,
              );
            } catch (error) {
              if (error.response?.status !== 401) throw error;
              progressToken = await getToken({ skipCache: true });
              if (!progressToken) throw error;
              result = await getExportProgress(
                projectId,
                exportId,
                progressToken,
              );
            }
            setExportError("");
            setExportProgress(result.progress);
            if (result.status === "complete") return;
          } catch (error) {
            if (job.cancelled || exportJobRef.current?.id !== exportId) return;
            if (error.response?.status !== 404) {
              setExportError(
                error.response?.data?.error ||
                  error.message ||
                  "Could not retrieve export progress.",
              );
            }
          }
          await new Promise((resolve) => window.setTimeout(resolve, 500));
        }
      };
      void pollProgress();
      const blob = await exportCurrentProject(
        { ...settings, aspectRatio, exportId },
        token,
      );
      if (job.cancelled || exportJobRef.current?.id !== exportId) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${
        settings.name
          .replace(/\.mp4$/i, "")
          .replace(/[^a-z0-9-_ ]/gi, "")
          .trim()
          .slice(0, 100) || "aurora-export"
      }.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setExportOpen(false);
      toast("Export ready. Your MP4 is downloading.", "success", 5000);
    } catch (error) {
      if (job.cancelled || exportJobRef.current?.id !== exportId) return;
      let message = error.response?.data?.error || error.message;
      if (error.response?.data instanceof Blob) {
        try {
          const response = JSON.parse(await error.response.data.text());
          message = response.error || message;
        } catch {
          message =
            "FFmpeg could not render this project. Check the media files and export settings.";
        }
      }
      setExportError(message || "Video export failed.");
    } finally {
      if (exportJobRef.current?.id === exportId) {
        exportJobRef.current = null;
        setIsExporting(false);
      }
    }
  };

  if (!isLoaded || (!isActiveProjectLoaded && !pageError)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080a0e] text-sm text-cyan-300">
        <LoaderCircle size={17} className="mr-2 animate-spin" />
        Opening your studio…
      </div>
    );
  }

  if (pageError && !isActiveProjectLoaded) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#080a0e] px-5 text-center">
        <AlertCircle size={28} className="text-rose-400" />
        <p role="alert" className="max-w-lg text-sm text-rose-200">
          {pageError}
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-200 hover:bg-white/5"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#080a0e] font-sans text-slate-200">
      <EditorHeader
        history={history}
        future={future}
        undo={undo}
        redo={redo}
        setExportOpen={() => {
          setExportError("");
          setExportOpen(true);
        }}
        onImport={() => openFilePicker("media")}
        projectName={projectName}
        setProjectName={setProjectName}
        isSaving={isSaving}
        hasError={Boolean(storeError)}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />
      <input
        ref={fileInput}
        type="file"
        multiple
        accept="video/*,image/*,.mp4,.mov,.webm,.m4v,.mkv,.avi,.3gp,.png,.jpg,.jpeg,.gif,.webp,.bmp,.avif,.svg"
        className="hidden"
        onChange={(event) => handleFileInputChange(event)}
      />
      <input
        ref={audioInput}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
        className="hidden"
        onChange={(event) => handleFileInputChange(event, "audio")}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_210px] lg:grid-cols-[264px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)_260px] xl:grid-rows-[minmax(0,1fr)_220px]">
        <Sidebar
          assets={assets}
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          selectedClip={selected}
          addToTimeline={addToTimeline}
          addTextClip={() => addTextClip(currentTime)}
          onPickFiles={openFilePicker}
          removeAsset={removeAsset}
          updateClip={updateClip}
          backgroundColor={backgroundColor}
          backgroundAssetId={backgroundAssetId}
          setProjectBackground={setProjectBackground}
        />
        <main className="flex min-h-0 min-w-0 flex-col bg-[#080a0e]">
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/[0.06] bg-[#0c0f14] px-3 py-2 xl:hidden">
            <button
              type="button"
              onClick={() => setDrawer("library")}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#11151c] px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-white active:scale-[0.97] lg:hidden"
            >
              <FolderOpen size={14} />
              Library
            </button>
            <button
              type="button"
              onClick={() => {
                addTextClip(currentTime);
                toast("Text overlay added", "success", 1500);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#11151c] px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-white active:scale-[0.97] lg:hidden"
            >
              <Type size={14} />
              Add text
            </button>
            <button
              type="button"
              onClick={() => setDrawer("properties")}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#11151c] px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-white active:scale-[0.97]"
            >
              <SlidersHorizontal size={14} />
              Properties
              {selected ? (
                <span className="max-w-[8rem] truncate text-slate-400">
                  · {selected.name}
                </span>
              ) : null}
            </button>
          </div>
          {(pageError || storeError || isUploading) && (
            <div
              role={pageError || storeError ? "alert" : "status"}
              className={`flex shrink-0 items-center gap-2 border-b px-4 py-2 text-xs ${pageError || storeError ? "border-rose-500/20 bg-rose-500/10 text-rose-300" : "border-cyan-500/20 bg-cyan-500/5 text-cyan-300"}`}
            >
              {pageError || storeError || `Uploading media… ${uploadProgress}%`}
            </div>
          )}
          <Preview
            activeAsset={activeAsset}
            activeClip={activeClip}
            activeImages={activeImages}
            activeTexts={activeTexts}
            activeAudio={activeAudio}
            assets={assets}
            currentTime={currentTime}
            duration={previewDuration}
            isPlaying={isPlaying}
            aspectRatio={aspectRatio}
            backgroundColor={backgroundColor}
            backgroundAsset={backgroundAsset}
            onBackgroundClick={() => setActiveSidebarTab("background")}
            setPlaying={setPlaying}
            togglePlayback={togglePlayback}
            selectedClip={previewSelected}
            selectClip={selectClip}
            updateClip={updateClip}
            removeClip={removeClip}
            snapshot={snapshot}
          />
        </main>
        <Inspector
          selected={selected}
          selectedAsset={selectedAsset}
          currentTime={currentTime}
          updateClip={updateClip}
          duplicateClip={duplicateClip}
          splitClip={splitClip}
          setClipLayer={setClipLayer}
          onDraftChange={setInspectorDraft}
        />
        <Timeline
          clips={clips}
          assets={assets}
          selectedClipId={selectedClipId}
          selectedClip={selected}
          currentTime={currentTime}
          duration={timelineDuration}
          zoom={zoom}
          selectClip={selectClip}
          setCurrentTime={setCurrentTime}
          setZoom={setZoom}
          moveClip={moveClip}
          addToTimeline={addToTimeline}
          trimClip={trimClip}
          snapshot={snapshot}
          updateClip={updateClip}
        />
      </div>

      <PanelDrawer
        open={drawer === "library"}
        title="Library"
        onClose={closeDrawer}
      >
        <Sidebar
          className="flex h-full w-full select-none bg-[#0c0f14]"
          assets={assets}
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          selectedClip={selected}
          addToTimeline={addToTimeline}
          addTextClip={() => addTextClip(currentTime)}
          onPickFiles={openFilePicker}
          removeAsset={removeAsset}
          updateClip={updateClip}
          backgroundColor={backgroundColor}
          backgroundAssetId={backgroundAssetId}
          setProjectBackground={setProjectBackground}
        />
      </PanelDrawer>
      <PanelDrawer
        open={drawer === "properties"}
        title="Properties"
        onClose={closeDrawer}
      >
        <Inspector
          className="flex h-full min-h-0 min-w-0 flex-col bg-[#0c0f14]"
          selected={selected}
          selectedAsset={selectedAsset}
          currentTime={currentTime}
          updateClip={updateClip}
          duplicateClip={duplicateClip}
          splitClip={splitClip}
          setClipLayer={setClipLayer}
          onDraftChange={setInspectorDraft}
        />
      </PanelDrawer>
      {shortcutsOpen && (
        <ShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}

      {exportOpen && (
        <ExportModal
          onClose={handleExportClose}
          onExport={handleExport}
          aspectRatio={aspectRatio}
          projectName={projectName}
          isExporting={isExporting}
          progress={exportProgress}
          error={exportError}
          clipCount={clips.length}
        />
      )}
    </div>
  );
}
