import { useRef, useState } from "react";
import { Film, Music2, Type, Volume2, VolumeX, ZoomIn, ZoomOut } from "lucide-react";
import { getClipGroup, getTimelineTracks, getTrackGroup, getTrackNumber } from "./timelineTracks";

const formatTime = (seconds) => {
  const value = Math.max(0, Number(seconds) || 0);
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(Math.floor(value % 60)).padStart(2, "0")}.${String(Math.floor((value % 1) * 10))}`;
};

const pixelsPerSecond = 56;
const labelWidth = 128;
const trackStyle = {
  media: "border-violet-400/40 bg-violet-400/15",
  audio: "border-cyan-400/40 bg-cyan-400/15",
  text: "border-sky-400/40 bg-sky-400/15",
};

export default function Timeline({
  clips, assets, selectedClip, selectedClipId, currentTime, duration, zoom,
  selectClip, setCurrentTime, setZoom, moveClip, addToTimeline, trimClip, snapshot, updateClip,
}) {
  const timelineRef = useRef(null);
  const trimRef = useRef(null);
  const [dropError, setDropError] = useState("");
  const [draggingClipId, setDraggingClipId] = useState(null);
  const tracks = getTimelineTracks(clips);
  const hasAudio = selectedClip?.kind === "audio" || selectedClip?.kind === "video";
  const scale = pixelsPerSecond * zoom;
  const width = Math.max(400, duration * scale) + labelWidth;

  const timeAtPointer = (clientX) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    return Math.max(0, (clientX - rect.left + timelineRef.current.scrollLeft - labelWidth) / scale);
  };

  const handleDrop = (event, trackId) => {
    event.preventDefault();
    event.stopPropagation();
    const assetId = event.dataTransfer.getData("application/x-aurora-asset");
    const clipId = event.dataTransfer.getData("application/x-aurora-clip");
    const time = timeAtPointer(event.clientX);
    if (assetId) {
      const asset = assets.find((item) => item.id === assetId);
      if (asset && getClipGroup({ kind: asset.kind }) !== getTrackGroup(trackId)) {
        setDropError(`Drop ${asset.kind} media on its matching timeline lane.`);
        return;
      }
      addToTimeline(assetId, trackId, time);
      setDropError("");
    } else if (clipId) {
      const clip = clips.find((item) => item.id === clipId);
      if (clip && getClipGroup(clip) !== getTrackGroup(trackId)) {
        setDropError(`Move this clip to a ${getClipGroup(clip)} lane.`);
        return;
      }
      if (moveClip(clipId, time, trackId)) setDropError("");
      setDraggingClipId(null);
    }
  };

  const handleScrub = (event) => {
    if (event.target.closest("[data-no-scrub]")) return;
    setCurrentTime(Math.min(duration, timeAtPointer(event.clientX)));
  };

  const startTrim = (event, clip, edge) => {
    event.preventDefault();
    event.stopPropagation();
    const asset = assets.find((item) => item.id === clip.assetId);
    const sameTrack = clips.filter((item) => item.id !== clip.id && item.track === clip.track);
    const previousEnd = Math.max(0, ...sameTrack.filter((item) => item.start + item.duration <= clip.start).map((item) => item.start + item.duration));
    const nextStart = Math.min(Infinity, ...sameTrack.filter((item) => item.start >= clip.start + clip.duration).map((item) => item.start));
    const pointerId = event.pointerId;
    trimRef.current = {
      clipId: clip.id,
      kind: clip.kind,
      edge,
      pointerId,
      startX: event.clientX,
      start: clip.start,
      duration: clip.duration,
      sourceStart: clip.sourceStart || 0,
      speed: clip.speed || 1,
      assetDuration: ["video", "audio"].includes(clip.kind) ? Number(asset?.duration) || Infinity : Infinity,
      minimumStart: Math.max(
        previousEnd,
        clip.start - (["video", "audio"].includes(clip.kind) ? clip.sourceStart || 0 : 0) / (clip.speed || 1),
        0,
      ),
      maximumEnd: Number.isFinite(nextStart) ? nextStart : Infinity,
      hasSnapshot: false,
    };
    selectClip(clip.id);
    event.currentTarget.setPointerCapture(pointerId);
  };

  const updateTrim = (event) => {
    const drag = trimRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.hasSnapshot) {
      snapshot();
      drag.hasSnapshot = true;
    }
    const delta = (event.clientX - drag.startX) / scale;
    const minimumDuration = 0.1;
    let start = drag.start;
    let clipDuration;
    let sourceStart = drag.sourceStart;

    if (drag.edge === "left") {
      const minimumStart = Math.max(drag.minimumStart, drag.start - drag.duration + minimumDuration);
      start = Math.max(minimumStart, Math.min(drag.start + drag.duration - minimumDuration, drag.start + delta));
      clipDuration = drag.start + drag.duration - start;
      sourceStart = drag.kind === "video" || drag.kind === "audio"
        ? Math.max(0, drag.sourceStart + (start - drag.start) * drag.speed)
        : drag.sourceStart;
    } else {
      const maximumBySource = (drag.assetDuration - drag.sourceStart) / drag.speed;
      const maximumDuration = Math.max(minimumDuration, Math.min(drag.maximumEnd - drag.start, maximumBySource));
      clipDuration = Math.max(minimumDuration, Math.min(maximumDuration, drag.duration + delta));
    }

    trimClip(drag.clipId, { start, duration: clipDuration, sourceStart });
  };

  const endTrim = (event) => {
    if (trimRef.current?.pointerId !== event.pointerId) return;
    trimRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section aria-label="Timeline editor" className="z-20 col-span-full flex h-full min-w-0 flex-col border-t border-white/[0.08] bg-[#0c0f14] select-none">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#090b0f] px-4 sm:px-6">
        <p className="hidden min-w-0 truncate text-[11px] text-slate-500 sm:block">{clips.length ? `${clips.length} clip${clips.length === 1 ? "" : "s"} · ${formatTime(currentTime)}` : "Drag media onto a lane, or click an item in the library to add it."}</p>
        <div className="ml-auto flex items-center gap-2 text-slate-400">
          {hasAudio && (
            <div className="mr-2 flex items-center gap-2 border-r border-white/10 pr-3">
              <button
                type="button"
                aria-label={selectedClip.muted ? "Unmute selected clip" : "Mute selected clip"}
                aria-pressed={Boolean(selectedClip.muted)}
                title={selectedClip.muted ? "Unmute selected clip" : "Mute selected clip"}
                onClick={() => updateClip(selectedClip.id, { muted: !selectedClip.muted })}
                className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${selectedClip.muted ? "border-rose-400/30 bg-rose-400/10 text-rose-300" : "border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"}`}
              >
                {selectedClip.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}
          <button title="Zoom out" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="rounded p-1 hover:bg-white/5 hover:text-white"><ZoomOut size={15} /></button>
          <input aria-label="Timeline zoom" type="range" min="0.5" max="3" step="0.25" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-20 accent-cyan-400 sm:w-24" />
          <span aria-live="polite" className="w-9 text-right font-mono text-[10px] tabular-nums text-slate-300">{Math.round(zoom * 100)}%</span>
          <button title="Zoom in" onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="rounded p-1 hover:bg-white/5 hover:text-white"><ZoomIn size={15} /></button>
        </div>
      </div>
      {dropError && <p role="status" className="border-b border-amber-500/20 bg-amber-500/[0.06] px-4 py-1.5 text-[10px] text-amber-300">{dropError}</p>}

      <div ref={timelineRef} onClick={handleScrub} className="relative min-h-0 flex-1 overflow-auto" onDragOver={(event) => event.preventDefault()}>
        <div className="relative min-h-full" style={{ width }}>
          <div className="sticky left-0 z-10 h-7 border-b border-white/[0.06] bg-[#090b0f]" style={{ width }}>
            <div className="absolute inset-y-0 border-r border-white/[0.08] bg-[#090b0f]" style={{ width: labelWidth }} />
            {Array.from({ length: Math.ceil(duration) + 1 }, (_, second) => (
              <div key={second} className="absolute inset-y-0 border-l border-white/10 pl-1.5 pt-1 font-mono text-[9px] text-slate-600" style={{ left: labelWidth + second * scale }}>
                {second % 5 === 0 ? formatTime(second) : ""}
              </div>
            ))}
          </div>

          {tracks.map((track) => (
            <div
              key={track.id}
              data-track={track.id}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes(`application/x-aurora-${track.group}`)) {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => handleDrop(event, track.id)}
              className="relative flex h-[52px] border-b border-white/[0.06]"
              style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px)", backgroundSize: `${scale}px 100%` }}
            >
              <div data-no-scrub className="sticky left-0 z-10 flex w-32 shrink-0 items-center gap-2 border-r border-white/[0.08] bg-[#10141b] px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {track.group === "media" ? <Film size={14} /> : track.group === "audio" ? <Music2 size={14} /> : <Type size={14} />}
                {track.group} {track.number}
              </div>
              {clips.filter((clip) => getTrackGroup(clip.track) === track.group && getTrackNumber(clip.track) === track.number).map((clip) => {
                const asset = assets.find((item) => item.id === clip.assetId);
                return (
                  <div
                    key={clip.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggingClipId(clip.id);
                      event.dataTransfer.setData("application/x-aurora-clip", clip.id);
                      event.dataTransfer.setData(`application/x-aurora-${getClipGroup(clip)}`, clip.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDraggingClipId(null)}
                    onPointerMove={updateTrim}
                    onPointerUp={endTrim}
                    onPointerCancel={endTrim}
                    onClick={(event) => { event.stopPropagation(); selectClip(clip.id); }}
                    title={`${clip.name} · ${formatTime(clip.duration)}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        selectClip(clip.id);
                      }
                    }}
                    className={`absolute top-1.5 flex h-10 items-center gap-2 overflow-hidden rounded-lg border px-2 text-left shadow-md transition ${trackStyle[track.group]} ${draggingClipId === clip.id ? "cursor-grabbing opacity-70" : "cursor-grab"} ${selectedClipId === clip.id ? "ring-2 ring-cyan-300 ring-offset-1 ring-offset-[#0c0f14]" : "hover:brightness-125"}`}
                    style={{ left: labelWidth + clip.start * scale, width: Math.max(46, clip.duration * scale) }}
                  >
                    {["video", "image", "audio", "text"].includes(clip.kind) && selectedClipId === clip.id && (
                      <>
                        <button
                          type="button"
                          aria-label={`Trim start of ${clip.name}`}
                          title="Drag to trim the start"
                          onPointerDown={(event) => startTrim(event, clip, "left")}
                          onClick={(event) => event.stopPropagation()}
                          className="absolute inset-y-0 left-0 z-10 flex w-2 cursor-ew-resize items-center justify-center bg-black/10 hover:bg-cyan-300/50"
                        >
                          <span className="h-4 w-px bg-white/80" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Trim end of ${clip.name}`}
                          title="Drag to trim the end"
                          onPointerDown={(event) => startTrim(event, clip, "right")}
                          onClick={(event) => event.stopPropagation()}
                          className="absolute inset-y-0 right-0 z-10 flex w-2 cursor-ew-resize items-center justify-center bg-black/10 hover:bg-cyan-300/50"
                        >
                          <span className="h-4 w-px bg-white/80" />
                        </button>
                      </>
                    )}
                    {asset?.kind === "image" ? <img src={asset.url} alt="" className="h-7 w-9 shrink-0 rounded object-cover" /> : null}
                    <span className="pointer-events-none min-w-0">
                      <span className="block truncate text-[10px] font-semibold text-white">{clip.kind === "text" ? clip.text || clip.name : clip.name}</span>
                      <span className="block text-[9px] text-white/60">{formatTime(clip.duration)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-cyan-300 shadow-[0_0_10px_#22d3ee]" style={{ left: labelWidth + currentTime * scale }}>
            <div className="absolute left-[-6px] top-0 h-3 w-3 rounded-sm bg-cyan-300" />
          </div>
        </div>
      </div>
    </section>
  );
}
