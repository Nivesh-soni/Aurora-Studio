import { useEffect, useRef, useState } from "react";
import { Crop, FastForward, Maximize2, Minimize2, Play, Pause, Rewind, Volume2, X } from "lucide-react";
import { getClipAnimationStyle, getClipFilter, getClipTransitionStyle } from "./clipEffects";
import { getAspectRatioStyle } from "../../constants/aspectRatios";
import { getEdgeResizeTransform } from "./transformMath";

const rotateCursor = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M20 7v5h-5M4 17v-5h5M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3' fill='none' stroke='%23e2e8f0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") 12 12, crosshair";

function TransformControls({
  clip,
  cropMode = false,
  onTransformStart,
  removeClip,
}) {
  const safeScale = (value) => {
    const scale = Number(value);
    return Number.isFinite(scale) && scale !== 0 ? scale : 1;
  };
  const textScale = clip.kind === "text"
    ? safeScale(clip.scale ?? 100) / 100
    : 1;
  const scaleX = textScale * safeScale(clip.scaleX ?? 1);
  const scaleY = textScale * safeScale(clip.scaleY ?? 1);
  const fixedControlStyle = (transformOrigin = "center") => ({
    transform: `scale(${1 / scaleX}, ${1 / scaleY})`,
    transformOrigin,
  });
  const edgeHitStyle = (edge) => ({
    transform: edge === "left" || edge === "right"
      ? `scaleX(${1 / scaleX})`
      : `scaleY(${1 / scaleY})`,
    transformOrigin: edge === "left"
      ? "center left"
      : edge === "right"
        ? "center right"
        : edge === "top"
          ? "top center"
          : "bottom center",
  });

  return (
    <>
      <span className={`pointer-events-none absolute inset-0 border ${cropMode ? "border-amber-300 border-dashed" : "border-cyan-300/80"}`} />
      {!cropMode && (
        <>
          <button type="button" data-transform-handle="rotate" aria-label="Rotate selected media" onPointerDown={(event) => onTransformStart(event, clip)} onClick={(event) => event.stopPropagation()} className="absolute left-1/2 -top-5 z-20 flex h-4 w-4 -translate-x-1/2 items-center justify-center bg-transparent" style={{ cursor: rotateCursor }}>
            <span className="h-2 w-2 rounded-full border border-white bg-cyan-400 shadow-[0_0_0_1px_#0f172a]" style={fixedControlStyle()} />
          </button>
          {["tl", "tr", "bl", "br"].map((corner) => (
            <button key={corner} type="button" data-transform-handle={`resize-${corner}`} aria-label="Resize selected media proportionally" onPointerDown={(event) => onTransformStart(event, clip)} onClick={(event) => event.stopPropagation()} className={`absolute z-20 flex h-4 w-4 items-center justify-center bg-transparent ${corner === "tl" || corner === "br" ? "cursor-nwse-resize" : "cursor-nesw-resize"} ${corner.includes("t") ? "top-0" : "bottom-0"} ${corner.includes("l") ? "left-0" : "right-0"}`}>
              <span className="h-2 w-2 rounded-[1px] border border-white bg-cyan-400 shadow-[0_0_0_1px_#0f172a]" style={fixedControlStyle(`${corner.includes("t") ? "top" : "bottom"} ${corner.includes("l") ? "left" : "right"}`)} />
            </button>
          ))}
          {[
            { edge: "top", position: "inset-x-4 top-0 h-3" },
            { edge: "right", position: "inset-y-4 right-0 w-3" },
            { edge: "bottom", position: "inset-x-4 bottom-0 h-3" },
            { edge: "left", position: "inset-y-4 left-0 w-3" },
          ].map(({ edge, position }) => (
            <button
              key={edge}
              type="button"
              data-transform-handle={`resize-${edge}`}
              aria-label={`Resize selected media from ${edge} edge`}
              onPointerDown={(event) => onTransformStart(event, clip)}
              onClick={(event) => event.stopPropagation()}
              style={edgeHitStyle(edge)}
              className={`absolute z-20 flex items-center justify-center bg-transparent ${position} ${edge === "top" || edge === "bottom" ? "cursor-ns-resize" : "cursor-ew-resize"}`}
            >
              <span className={`${edge === "top" || edge === "bottom" ? "h-0.5 w-5" : "h-5 w-0.5"} rounded-full bg-cyan-300 shadow-[0_0_0_1px_#0f172a]`} style={fixedControlStyle()} />
            </button>
          ))}
        </>
      )}
      {cropMode && clip.kind === "image" && ["top", "right", "bottom", "left"].map((edge) => (
        <button key={edge} type="button" data-transform-handle={`crop-${edge}`} aria-label={`Crop image from ${edge} edge`} onPointerDown={(event) => onTransformStart(event, clip)} onClick={(event) => event.stopPropagation()} style={edgeHitStyle(edge)} className={`absolute z-20 flex items-center justify-center bg-transparent ${edge === "top" || edge === "bottom" ? "inset-x-2 h-3" : "inset-y-2 w-3"} ${edge === "top" ? "top-2 cursor-ns-resize" : ""} ${edge === "right" ? "right-2 cursor-ew-resize" : ""} ${edge === "bottom" ? "bottom-2 cursor-ns-resize" : ""} ${edge === "left" ? "left-2 cursor-ew-resize" : ""}`}>
          <span className={`${edge === "top" || edge === "bottom" ? "h-2 w-5" : "h-5 w-2"} rounded-full border border-amber-100 bg-amber-400/90 shadow`} style={fixedControlStyle()} />
        </button>
      ))}
      <button type="button" aria-label="Remove from timeline" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); removeClip(clip.id); }} style={fixedControlStyle("top right")} className="absolute right-1 top-1 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-black/80 text-white shadow hover:bg-rose-600">
        <X size={14} />
      </button>
    </>
  );
}

const formatTimecode = (seconds, frameRate = 30) => {
  const totalFrames = Math.floor(Math.max(0, Number(seconds) || 0) * frameRate);
  const frames = totalFrames % frameRate;
  const totalSeconds = Math.floor(totalFrames / frameRate);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const wholeSeconds = totalSeconds % 60;
  return [hours, minutes, wholeSeconds, frames]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

const getTextBackground = (clip, clipOpacity = 1) => {
  const hex = /^#[\da-f]{6}$/i.test(clip.textBackgroundColor || "") ? clip.textBackgroundColor : "#000000";
  const opacity = Math.max(0, Math.min(100, Number(clip.textBackgroundOpacity) || 0)) / 100 * clipOpacity;
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

function ShapeGraphic({ clip, animationStyle, transitionStyle }) {
  const fill = clip.fillColor || "#38bdf8";
  const stroke = clip.strokeColor || "#000000";
  const strokeWidth = Math.max(0, Number(clip.strokeWidth) || 0);
  const renderStrokeWidth = strokeWidth || (["line", "arrow"].includes(clip.shapeType) ? 3 : 0);
  const radius = Math.max(0, Number(clip.cornerRadius) || 0);
  const common = {
    fill: clip.fillEnabled === false ? "none" : fill,
    stroke,
    strokeWidth,
    vectorEffect: "non-scaling-stroke",
  };
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      pointerEvents="none"
      className="h-full w-full overflow-visible"
      style={{
        opacity: (Math.max(0, Math.min(100, Number(clip.opacity ?? 100))) / 100)
          * animationStyle.opacity
          * transitionStyle.opacity,
      }}
    >
      {clip.shapeType === "circle" || clip.shapeType === "ellipse" ? (
        <ellipse cx="50" cy="50" rx="48" ry={clip.shapeType === "circle" ? "48" : "32"} {...common} />
      ) : clip.shapeType === "triangle" ? (
        <polygon points="50,2 98,98 2,98" {...common} strokeLinejoin="round" />
      ) : clip.shapeType === "line" ? (
        <line x1="2" y1="50" x2="98" y2="50" stroke={stroke} strokeWidth={renderStrokeWidth} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      ) : clip.shapeType === "arrow" ? (
        <path d="M 2 35 H 68 V 5 L 98 50 L 68 95 V 65 H 2 Z" fill={clip.fillEnabled === false ? "none" : fill} stroke={stroke} strokeWidth={renderStrokeWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      ) : (
        <rect x="2" y="2" width="96" height="96" rx={clip.shapeType === "rounded" ? radius : radius * 0.35} {...common} />
      )}
    </svg>
  );
}

export default function Preview({
  activeAsset, activeClip, activeImages, activeTexts, activeShapes, activeAudio, assets, clips,
  selectedClip, currentTime, duration, isPlaying, aspectRatio, setPlaying, togglePlayback,
  setCurrentTime, selectClip, updateClip, removeClip, snapshot, backgroundColor, backgroundAsset, onBackgroundClick,
}) {
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const stageRef = useRef(null);
  const stageAreaRef = useRef(null);
  const audioRefs = useRef({});
  const transformRef = useRef(null);
  const previousPlayingRef = useRef(isPlaying);
  const lastVideoClipIdRef = useRef(null);
  const textEditorRef = useRef(null);
  const cancelledTextEditRef = useRef(null);
  const [textEdit, setTextEdit] = useState(null);
  const [cropModeClipId, setCropModeClipId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const cropMode = selectedClip?.kind === "image" && cropModeClipId === selectedClip.id;
  const [stageAreaSize, setStageAreaSize] = useState({ width: 0, height: 0 });
  const aspectParts = (aspectRatio || "16:9").split(":").map(Number);
  const aspect = aspectParts[0] > 0 && aspectParts[1] > 0 ? aspectParts[0] / aspectParts[1] : 16 / 9;
  const stageWidth = Math.min(stageAreaSize.width, stageAreaSize.height * aspect, 1600);
  const stageHeight = stageWidth / aspect;
  const sourceTime = activeClip
    ? activeClip.sourceStart + (currentTime - activeClip.start) * (activeClip.speed || 1)
    : 0;
  const activeTransitionStyle = activeClip
    ? getClipTransitionStyle(activeClip, currentTime)
    : { opacity: 1, transform: "" };
  const activeAnimationStyle = activeClip
    ? getClipAnimationStyle(activeClip, currentTime)
    : { opacity: 1, transform: "" };

  useEffect(() => {
    const updateFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === previewRef.current);
    };
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  useEffect(() => {
    const area = stageAreaRef.current;
    if (!area) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setStageAreaSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const wasPlaying = previousPlayingRef.current;
    previousPlayingRef.current = isPlaying;
    if (wasPlaying && !isPlaying) return;
    const clipChanged = lastVideoClipIdRef.current !== activeClip?.id;
    lastVideoClipIdRef.current = activeClip?.id ?? null;
    if (isPlaying && !clipChanged) return;
    const target = Math.max(0, sourceTime);
    const seekThreshold = isPlaying ? 0.25 : 0.02;
    if (Number.isFinite(video.duration) && Math.abs(video.currentTime - target) > seekThreshold) {
      try { video.currentTime = Math.min(target, Math.max(0, video.duration - 0.05)); } catch { /* Wait for the media element to become seekable. */ }
    }
  }, [activeAsset, activeClip?.id, sourceTime, isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = activeClip?.speed || 1;
    video.volume = Math.min(1, Math.max(0, Number(activeClip?.volume ?? 100) / 100));
    video.muted = Boolean(activeClip?.muted);
    if (isPlaying) video.play().catch(() => setPlaying(false));
    else video.pause();
  }, [activeAsset, activeClip, isPlaying, setPlaying]);

  useEffect(() => {
    activeAudio.forEach((clip) => {
      const audio = audioRefs.current[clip.id];
      const asset = assets.find((item) => item.id === clip.assetId);
      if (!audio || !asset) return;
      const target = Math.max(0, clip.sourceStart + (currentTime - clip.start) * (clip.speed || 1));
      const seekThreshold = isPlaying ? 0.35 : 0.02;
      if (Number.isFinite(audio.duration) && Math.abs(audio.currentTime - target) > seekThreshold) {
        try { audio.currentTime = Math.min(target, Math.max(0, audio.duration - 0.05)); } catch { /* Wait for the media element to become seekable. */ }
      }
      audio.playbackRate = clip.speed || 1;
      const clipTime = currentTime - clip.start;
      const timeLeft = clip.start + clip.duration - currentTime;
      const transition = clip.transition || {};
      const transitionDuration = transition.type === "fade" ? Number(transition.duration) || 0.5 : 0;
      const fadeIn = Math.min(clip.duration / 2, Math.max(0, Number(clip.fadeIn ?? (["in", "both"].includes(transition.placement || "in") ? transitionDuration : 0)) || 0));
      const fadeOut = Math.min(clip.duration / 2, Math.max(0, Number(clip.fadeOut ?? (["out", "both"].includes(transition.placement) ? transitionDuration : 0)) || 0));
      const fadeInGain = fadeIn > 0 ? Math.min(1, clipTime / fadeIn) : 1;
      const fadeOutGain = fadeOut > 0 ? Math.min(1, timeLeft / fadeOut) : 1;
      const fadeGain = Math.max(0, Math.min(fadeInGain, fadeOutGain));
      audio.volume = Math.min(1, Math.max(0, Number(clip.volume ?? 100) / 100)) * fadeGain;
      audio.muted = Boolean(clip.muted);
      if (isPlaying) audio.play().catch(() => setPlaying(false));
      else audio.pause();
    });
    Object.keys(audioRefs.current).forEach((id) => {
      if (!activeAudio.some((clip) => clip.id === id)) audioRefs.current[id]?.pause();
    });
  }, [activeAudio, assets, currentTime, isPlaying, setPlaying]);

  const startTransform = (event, clip) => {
    if (!clip) return;
    event.preventDefault();
    event.stopPropagation();
    const stage = stageRef.current?.getBoundingClientRect();
    if (!stage) return;
    const handle = event.target.closest("[data-transform-handle]")?.dataset.transformHandle || "move";
    const clipElement = event.currentTarget.closest("[data-preview-clip]")
      || event.target.closest("[data-preview-clip]");
    const textScale = clip.kind === "text" ? Number(clip.scale ?? 100) / 100 : 1;
    const centerX = stage.left + stage.width * (Number(clip.x ?? 50) / 100);
    const centerY = stage.top + stage.height * (Number(clip.y ?? 50) / 100);
    transformRef.current = {
      handle,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      centerX,
      centerY,
      angle: Math.atan2(event.clientY - centerY, event.clientX - centerX),
      clipId: clip.id,
      initialX: Number(clip.x ?? 50),
      initialY: Number(clip.y ?? 50),
      initialScale: Number(clip.scale ?? 100),
      initialScaleX: Number(clip.scaleX) || 1,
      initialScaleY: Number(clip.scaleY) || 1,
      initialWidth: (clipElement?.offsetWidth || stage.width) * textScale,
      initialHeight: (clipElement?.offsetHeight || stage.height) * textScale,
      initialRotation: Number(clip.rotation || 0),
      initialCropTop: Number(clip.cropTop || 0),
      initialCropRight: Number(clip.cropRight || 0),
      initialCropBottom: Number(clip.cropBottom || 0),
      initialCropLeft: Number(clip.cropLeft || 0),
      initialVisibleWidth: 100 - Number(clip.cropLeft || 0) - Number(clip.cropRight || 0),
      initialVisibleHeight: 100 - Number(clip.cropTop || 0) - Number(clip.cropBottom || 0),
      hasSnapshot: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    selectClip(clip.id);
  };

  const updateTransform = (event) => {
    const drag = transformRef.current;
    const stage = stageRef.current?.getBoundingClientRect();
    if (!drag || !stage) return;
    let changes;
    if (drag.handle.startsWith("crop-")) {
      const clipScaleX = drag.initialScale / 100 * drag.initialScaleX;
      const clipScaleY = drag.initialScale / 100 * drag.initialScaleY;
      const dx = (event.clientX - drag.x) / (stage.width * clipScaleX * drag.initialVisibleWidth / 100) * 100;
      const dy = (event.clientY - drag.y) / (stage.height * clipScaleY * drag.initialVisibleHeight / 100) * 100;
      changes = {
        cropTop: Math.max(0, Math.min(45, drag.initialCropTop + (drag.handle.endsWith("top") ? dy : 0))),
        cropRight: Math.max(0, Math.min(45, drag.initialCropRight - (drag.handle.endsWith("right") ? dx : 0))),
        cropBottom: Math.max(0, Math.min(45, drag.initialCropBottom - (drag.handle.endsWith("bottom") ? dy : 0))),
        cropLeft: Math.max(0, Math.min(45, drag.initialCropLeft + (drag.handle.endsWith("left") ? dx : 0))),
      };
    } else if (drag.handle.startsWith("resize-")) {
      const direction = drag.handle.slice("resize-".length);
      if (direction.length === 2) {
        const horizontalDirection = direction.endsWith("r") ? 1 : -1;
        const verticalDirection = direction.startsWith("b") ? 1 : -1;
        const horizontalChange = (event.clientX - drag.x) * horizontalDirection;
        const verticalChange = (event.clientY - drag.y) * verticalDirection * stage.width / stage.height;
        const change = (horizontalChange + verticalChange) / 2 / stage.width * 100;
        changes = { scale: Math.max(10, Math.min(300, drag.initialScale + change)) };
      } else {
        changes = getEdgeResizeTransform({
          edge: direction,
          pointerDeltaX: event.clientX - drag.x,
          pointerDeltaY: event.clientY - drag.y,
          initialX: drag.initialX,
          initialY: drag.initialY,
          initialScaleX: drag.initialScaleX,
          initialScaleY: drag.initialScaleY,
          initialWidth: drag.initialWidth,
          initialHeight: drag.initialHeight,
          rotation: drag.initialRotation,
          stageWidth: stage.width,
          stageHeight: stage.height,
        });
      }
    } else if (drag.handle === "rotate") {
      const angle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX);
      changes = { rotation: drag.initialRotation + ((angle - drag.angle) * 180) / Math.PI };
    } else {
      changes = {
        x: Math.max(0, Math.min(100, drag.initialX + ((event.clientX - drag.x) / stage.width) * 100)),
        y: Math.max(0, Math.min(100, drag.initialY + ((event.clientY - drag.y) / stage.height) * 100)),
      };
    }
    if (!drag.hasSnapshot) {
      snapshot();
      drag.hasSnapshot = true;
    }
    updateClip(drag.clipId, changes, { history: false });
  };

  const endImageTransform = (event) => {
    if (transformRef.current?.pointerId !== event.pointerId) return;
    transformRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => {
    if (textEdit?.id) {
      textEditorRef.current?.focus();
      textEditorRef.current?.select();
    }
  }, [textEdit?.id]);

  const commitTextEdit = (clip) => {
    if (!textEdit || textEdit.id !== clip.id) return;
    if (cancelledTextEditRef.current === clip.id) {
      cancelledTextEditRef.current = null;
      return;
    }
    if (textEdit.value !== clip.text) {
      snapshot();
      updateClip(clip.id, { text: textEdit.value }, { history: false });
    }
    setTextEdit(null);
  };

  const selectClipFromPreview = (clip) => {
    selectClip(clip.id);
  };

  const toggleFullscreen = async () => {
    const preview = previewRef.current;
    if (!preview) return;
    setFullscreenError("");
    try {
      if (document.fullscreenElement === preview) {
        await document.exitFullscreen();
      } else if (preview.requestFullscreen) {
        await preview.requestFullscreen();
      } else {
        throw new Error("Full screen preview is not supported in this browser.");
      }
    } catch (error) {
      setFullscreenError(error instanceof Error ? error.message : "Could not change preview mode.");
    }
  };
  const seekTo = (time) => {
    setPlaying(false);
    setCurrentTime(Math.max(0, Math.min(duration, time)));
  };

  return (
    <div ref={previewRef} className="aurora-preview-shell relative flex min-h-0 flex-1 flex-col bg-[#080a0e]">
      {fullscreenError && (
        <p role="alert" className="absolute left-3 top-3 z-40 rounded-lg border border-rose-400/30 bg-black/80 px-3 py-2 text-[11px] text-rose-200">
          {fullscreenError}
        </p>
      )}
      {!isFullscreen && selectedClip?.kind === "image" && (
        <button
          type="button"
          aria-label={cropMode ? "Finish cropping image" : "Crop selected image"}
          onClick={() => setCropModeClipId(cropMode ? null : selectedClip.id)}
          className="absolute right-3 top-3 z-30 flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#11151c] px-3 py-1.5 text-[11px] font-medium text-slate-200 shadow-lg transition hover:border-amber-300/50 hover:text-amber-200"
        >
          <Crop size={14} />
          {cropMode ? "Done cropping" : "Crop image"}
        </button>
      )}
      <div className="flex min-h-0 flex-1 items-center justify-center p-1 sm:p-2">
        <div ref={stageAreaRef} className="flex h-full w-full items-center justify-center">
        <div ref={stageRef} onClick={(event) => { if (!isFullscreen && event.target === event.currentTarget) onBackgroundClick?.(); }} className="group relative flex max-w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40 ring-1 ring-cyan-400/10" style={{
          width: stageWidth || "100%",
          height: stageHeight || "100%",
          aspectRatio: getAspectRatioStyle(aspectRatio),
          backgroundColor: backgroundColor || "#000000",
        }}>
          {backgroundAsset && <img src={backgroundAsset.url} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />}
          {clips.length === 0 && !backgroundAsset && !activeAsset && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center">
              <p className="text-xs font-medium text-slate-300">Your canvas is empty</p>
              <p className="text-[11px] text-slate-500">Import media or add a text overlay to start editing.</p>
            </div>
          )}
          {activeAsset ? (
            <div
              data-preview-clip
              onPointerDown={(event) => startTransform(event, activeClip)}
              onPointerMove={updateTransform}
              onPointerUp={endImageTransform}
              onPointerCancel={endImageTransform}
              onClick={() => { if (activeClip) selectClip(activeClip.id); }}
              className={`absolute touch-none ${activeClip?.id === selectedClip?.id ? "z-[5] cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
              style={{
                left: `${activeClip?.x ?? 50}%`,
                top: `${activeClip?.y ?? 50}%`,
                width: `${activeClip?.scale ?? 100}%`,
                height: `${activeClip?.scale ?? 100}%`,
                zIndex: activeClip?.layerOrder ?? 0,
                transform: `translate(-50%, -50%) rotate(${activeClip?.rotation || 0}deg) scaleX(${activeClip?.scaleX ?? 1}) scaleY(${activeClip?.scaleY ?? 1}) ${activeTransitionStyle.transform} ${activeAnimationStyle.transform}`,
              }}
            >
              <video
                key={activeClip?.id}
                ref={videoRef}
                src={activeAsset.url}
                playsInline
                className={`h-full w-full ${activeClip?.crop === "fill" ? "object-cover" : "object-contain"}`}
                style={{
                  filter: activeClip ? getClipFilter(activeClip) : undefined,
                  opacity: activeClip ? (Number(activeClip.opacity ?? 100) / 100) * activeTransitionStyle.opacity * activeAnimationStyle.opacity : 1,
                }}
              />
              {!isFullscreen && activeClip?.id === selectedClip?.id && <TransformControls clip={activeClip} onTransformStart={startTransform} removeClip={removeClip} />}
            </div>
          ) : null}

          {activeImages.map(({ clip, asset }) => {
              const cropLeft = Math.max(0, Math.min(45, Number(clip.cropLeft) || 0));
              const cropRight = Math.max(0, Math.min(45, Number(clip.cropRight) || 0));
              const cropTop = Math.max(0, Math.min(45, Number(clip.cropTop) || 0));
              const cropBottom = Math.max(0, Math.min(45, Number(clip.cropBottom) || 0));
              const visibleWidth = 100 - cropLeft - cropRight;
              const visibleHeight = 100 - cropTop - cropBottom;
              const transitionStyle = getClipTransitionStyle(clip, currentTime);
              const animationStyle = getClipAnimationStyle(clip, currentTime);
              return (
                <div
              data-preview-clip
              key={clip.id}
              onPointerDown={(event) => startTransform(event, clip)}
              onPointerMove={updateTransform}
              onPointerUp={endImageTransform}
              onPointerCancel={endImageTransform}
              onClick={() => selectClipFromPreview(clip)}
              className={`absolute overflow-hidden ${clip.id === selectedClip?.id ? "z-10 cursor-grab touch-none active:cursor-grabbing" : "cursor-pointer"}`}
              style={{
                left: `${clip.x ?? 50}%`,
                top: `${clip.y ?? 50}%`,
                width: `${(clip.scale ?? 100) * visibleWidth / 100}%`,
                height: `${(clip.scale ?? 100) * visibleHeight / 100}%`,
                zIndex: clip.layerOrder ?? 0,
                transform: `translate(-50%, -50%) rotate(${clip.rotation || 0}deg) scaleX(${clip.scaleX ?? 1}) scaleY(${clip.scaleY ?? 1}) ${transitionStyle.transform} ${animationStyle.transform}`,
              }}
            >
              <img
                src={asset.url}
                alt=""
                className={`absolute max-w-none ${clip.crop === "fill" ? "object-cover" : "object-contain"}`}
                style={{
                  left: `${-cropLeft * 100 / visibleWidth}%`,
                  top: `${-cropTop * 100 / visibleHeight}%`,
                  width: `${10000 / visibleWidth}%`,
                  height: `${10000 / visibleHeight}%`,
                  filter: getClipFilter(clip),
                  opacity: (Math.max(0, Math.min(100, clip.opacity ?? 100)) / 100) * animationStyle.opacity * transitionStyle.opacity,
                }}
              />
              {!isFullscreen && clip.id === selectedClip?.id && (
                <>
                  <TransformControls clip={clip} cropMode={cropMode} onTransformStart={startTransform} removeClip={removeClip} />
                </>
              )}
                </div>
              );
          })}
          {activeTexts.map((clip) => {
            const animationStyle = getClipAnimationStyle(clip, currentTime);
            const transitionStyle = getClipTransitionStyle(clip, currentTime);
            const visualOpacity =
              (Math.max(0, Math.min(100, clip.opacity ?? 100)) / 100) *
              animationStyle.opacity *
              transitionStyle.opacity;
            const isEditingText = textEdit?.id === clip.id;
            return (
              <div
                data-preview-clip
                key={clip.id}
                onPointerDown={(event) => {
                  if (isEditingText) {
                    event.stopPropagation();
                    return;
                  }
                  startTransform(event, clip);
                }}
                onPointerMove={updateTransform}
                onPointerUp={endImageTransform}
                onPointerCancel={endImageTransform}
                onClick={(event) => {
                  if (isEditingText) {
                    event.stopPropagation();
                    return;
                  }
                  selectClipFromPreview(clip);
                }}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectClip(clip.id);
                  setTextEdit({ id: clip.id, value: clip.text || "" });
                }}
                title={isEditingText ? undefined : "Double-click to edit text"}
                className={`absolute whitespace-pre-wrap text-center [text-shadow:0_2px_10px_#000,0_1px_2px_#000] ${clip.id === selectedClip?.id ? "z-20 cursor-grab touch-none active:cursor-grabbing" : "cursor-pointer"}`}
                style={{
                  left: `${clip.x ?? 50}%`,
                  top: `${clip.y ?? (clip.textPosition === "top" ? 15 : clip.textPosition === "bottom" ? 85 : 50)}%`,
                  width: "80%",
                  zIndex: clip.layerOrder ?? 0,
                  transform: `translate(-50%, -50%) rotate(${clip.rotation || 0}deg) scale(${(clip.scale ?? 100) / 100}) scaleX(${clip.scaleX ?? 1}) scaleY(${clip.scaleY ?? 1}) ${transitionStyle.transform} ${animationStyle.transform}`,
                  color: clip.textColor || "#ffffff",
                  backgroundColor: getTextBackground(clip, visualOpacity),
                  fontSize: `${Math.max(6, (clip.fontSize || 48) * (stageWidth || 1000) / 1000)}px`,
                  fontFamily: clip.fontFamily || "Arial, sans-serif",
                  padding: "0.2em 0.4em",
                  borderRadius: "0.15em",
                  boxDecorationBreak: "clone",
                }}
              >
                {isEditingText ? (
                  <span className="inline-block w-full" style={{ opacity: visualOpacity }}>
                    <textarea
                      ref={textEditorRef}
                      aria-label="Edit preview text"
                      value={textEdit.value}
                      onChange={(event) => setTextEdit({ id: clip.id, value: event.target.value })}
                      onBlur={() => commitTextEdit(clip)}
                      onPointerDown={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelledTextEditRef.current = clip.id;
                          setTextEdit(null);
                        } else if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.blur();
                        }
                      }}
                      rows={Math.max(1, (textEdit.value.match(/\n/g) || []).length + 1)}
                      className="w-full resize-none overflow-hidden border border-dashed border-cyan-300/70 bg-transparent text-center text-inherit leading-tight text-white outline-none [text-shadow:0_2px_10px_#000,0_1px_2px_#000]"
                      style={{ fontSize: "inherit", fontFamily: "inherit", color: "inherit", backgroundColor: "transparent" }}
                    />
                  </span>
                ) : (
                  <>
                    <span
                      className="inline-block w-full"
                      style={{ opacity: visualOpacity }}
                    >
                      {clip.text}
                    </span>
                    {!isFullscreen && clip.id === selectedClip?.id && <TransformControls clip={clip} onTransformStart={startTransform} removeClip={removeClip} />}
                  </>
                )}
              </div>
            );
          })}

          {(activeShapes || []).map((clip) => {
            const scale = (clip.scale ?? 100) / 100;
            const animationStyle = getClipAnimationStyle(clip, currentTime);
            const transitionStyle = getClipTransitionStyle(clip, currentTime);
            let width = (clip.width ?? 30) * scale;
            let height = (clip.height ?? 30) * scale;
            if (clip.shapeType === "circle" && stageWidth > 0 && stageHeight > 0) {
              const diameter = Math.min(stageWidth * width / 100, stageHeight * height / 100);
              width = diameter / stageWidth * 100;
              height = diameter / stageHeight * 100;
            }
            return (
              <div
                data-preview-clip
                key={clip.id}
                onPointerDown={(event) => startTransform(event, clip)}
                onPointerMove={updateTransform}
                onPointerUp={endImageTransform}
                onPointerCancel={endImageTransform}
                onClick={(event) => { event.stopPropagation(); selectClipFromPreview(clip); }}
                className={`absolute touch-none ${clip.id === selectedClip?.id ? "z-20 cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                style={{
                  left: `${clip.x ?? 50}%`,
                  top: `${clip.y ?? 50}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                  zIndex: clip.layerOrder ?? 0,
                  transform: `translate(-50%, -50%) rotate(${clip.rotation || 0}deg) scaleX(${clip.scaleX ?? 1}) scaleY(${clip.scaleY ?? 1}) ${transitionStyle.transform} ${animationStyle.transform}`,
                }}
              >
                <ShapeGraphic clip={clip} animationStyle={animationStyle} transitionStyle={transitionStyle} />
                {!isFullscreen && clip.id === selectedClip?.id && <TransformControls clip={{ ...clip, kind: "shape" }} onTransformStart={startTransform} removeClip={removeClip} />}
              </div>
            );
          })}

          {activeAudio.map((clip) => {
            const asset = assets.find((item) => item.id === clip.assetId);
            return asset ? <audio key={clip.id} ref={(node) => { if (node) audioRefs.current[clip.id] = node; else delete audioRefs.current[clip.id]; }} src={asset.url} preload="auto" /> : null;
          })}

          {!isFullscreen && activeAudio.length > 0 && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-[10px] text-slate-300"><Volume2 size={12} /> Audio active</span>}
          {!isFullscreen && (
            <div
              aria-label={`Playhead ${formatTimecode(currentTime)}, total duration ${formatTimecode(duration)}`}
              className="pointer-events-none absolute bottom-3 right-3 z-30 rounded-md border border-white/10 bg-black/75 px-2 py-1 font-mono text-[8px] font-semibold tabular-nums sm:hidden"
            >
              <span className="text-cyan-100">{formatTimecode(currentTime)}</span>
              <span className="px-1 text-slate-500">/</span>
              <span className="text-slate-300">{formatTimecode(duration)}</span>
            </div>
          )}
        </div>
        </div>
      </div>

      <div className={`relative flex shrink-0 border-t border-white/[0.08] bg-[#0c0f14] ${isFullscreen ? "h-[104px] flex-col px-5 py-1" : "h-[58px] items-center justify-center px-3"}`}>
        {isFullscreen && (
          <div className="flex h-9 w-full items-center gap-3">
            <span className="font-mono text-[10px] font-semibold tabular-nums text-slate-200">
              {formatTimecode(currentTime)}
            </span>
            <input
              type="range"
              aria-label="Preview position"
              min="0"
              max={duration}
              step="0.01"
              value={Math.min(duration, currentTime)}
              onChange={(event) => seekTo(Number(event.target.value))}
              className="min-w-0 flex-1 accent-cyan-400"
            />
            <span className="font-mono text-[10px] tabular-nums text-slate-400">
              {formatTimecode(duration)}
            </span>
          </div>
        )}
        <div className={`relative flex w-full items-center justify-center ${isFullscreen ? "h-[58px] shrink-0" : "h-full"}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Back 5 seconds"
              title="Back 5 seconds"
              onClick={() => seekTo(currentTime - 5)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <Rewind size={15} />
            </button>
            <button aria-label={isPlaying ? "Pause preview" : "Play preview"} onClick={togglePlayback} className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 hover:shadow-cyan-400/40 active:scale-95">
              {isPlaying ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
            </button>
            <button
              type="button"
              aria-label="Forward 5 seconds"
              title="Forward 5 seconds"
              onClick={() => seekTo(currentTime + 5)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <FastForward size={15} />
            </button>
          </div>
          {!isFullscreen && (
            <div
              aria-label={`Playhead ${formatTimecode(currentTime)}, total duration ${formatTimecode(duration)}`}
              className="absolute right-12 hidden items-center gap-1 font-mono text-[9px] font-semibold tabular-nums sm:flex"
            >
              <span className="text-cyan-100">{formatTimecode(currentTime)}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{formatTimecode(duration)}</span>
            </div>
          )}
          <button
            type="button"
            aria-label={isFullscreen ? "Minimize preview" : "View preview full screen"}
            title={isFullscreen ? "Minimize preview" : "View full screen"}
            onClick={toggleFullscreen}
            className="absolute right-0 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/5 hover:text-white"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
