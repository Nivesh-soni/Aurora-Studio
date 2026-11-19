import {
  Film,
  Image as ImageIcon,
  Layers,
  Music2,
  Paintbrush,
  Plus,
  Sparkles,
  Type,
  Upload,
  Clock3,
  Trash2,
  Shapes,
  Smile,
} from "lucide-react";
import { getClipGroup } from "./timelineTracks";
import ColorSlider from "./ColorSlider";
import { useEditorStore } from "../../store/editorStore";

const snapshotOnce = () => useEditorStore.getState().snapshot();
const snapshotOnKey = (event) => {
  if (!event.repeat && /^(Arrow|Page|Home|End)/.test(event.key)) snapshotOnce();
};

const DEFAULT_ASIDE =
  "hidden w-[264px] shrink-0 select-none border-r border-white/[0.08] bg-[#0c0f14] lg:flex";
const fieldClass =
  "w-full rounded-lg border border-white/[0.08] bg-[#0b0e13] px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/60";

const formatDuration = (seconds) => {
  const value = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
};

const tabs = [
  { id: "media", label: "Media", icon: Upload },
  { id: "audio", label: "Audio", icon: Music2 },
  { id: "text", label: "Text", icon: Type },
  { id: "shapes", label: "Elements", title: "Elements", icon: Shapes },
  { id: "background", label: "BG", title: "Background", icon: Paintbrush },
  { id: "transitions", label: "Trans.", title: "Transitions", icon: Layers },
  { id: "animations", label: "Anim.", title: "Animations", icon: Sparkles },
];

const transitionOptions = [
  {
    id: "none",
    label: "None",
    description: "No transition",
  },
  {
    id: "fade",
    label: "Fade",
    description: "Fade in or out",
  },
  {
    id: "slide-left",
    label: "Slide left",
    description: "Enter from the left",
  },
  {
    id: "slide-right",
    label: "Slide right",
    description: "Enter from the right",
  },
  {
    id: "slide-up",
    label: "Slide up",
    description: "Enter from below",
  },
  {
    id: "slide-down",
    label: "Slide down",
    description: "Enter from above",
  },
  {
    id: "zoom-in",
    label: "Zoom in",
    description: "Grow into place",
  },
  {
    id: "zoom-out",
    label: "Zoom out",
    description: "Shrink into place",
  },
];

const animationOptions = [
  {
    id: "none",
    label: "None",
    description: "No animation",
  },
  {
    id: "fade",
    label: "Fade in",
    description: "Appear gradually",
  },
  {
    id: "slide-up",
    label: "Slide up",
    description: "Move up from below",
  },
  {
    id: "slide-down",
    label: "Slide down",
    description: "Move down from above",
  },
  {
    id: "slide-left",
    label: "Slide left",
    description: "Move in from the left",
  },
  {
    id: "slide-right",
    label: "Slide right",
    description: "Move in from the right",
  },
  {
    id: "zoom-in",
    label: "Zoom in",
    description: "Grow into place",
  },
  {
    id: "zoom-out",
    label: "Zoom out",
    description: "Shrink into place",
  },
];

const emojiOptions = ["😀", "😍", "😂", "😎", "🥳", "❤️", "⭐", "🔥", "👏", "✨", "🌈", "🎉"];

function PresetCard({ option, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-w-0 flex-col gap-2 rounded-xl border p-2 text-left transition ${selected ? "border-cyan-400/60 bg-cyan-400/[0.08]" : "border-white/[0.07] bg-[#11151c] hover:border-white/20"}`}
    >
      <span className="relative block h-12 w-full overflow-hidden rounded-md bg-[#080a0e]">
        <img
          src="/aurora-preview.svg"
          alt=""
          aria-hidden="true"
          className={`aurora-preset-image aurora-preset-${option.id} absolute inset-0 h-full w-full object-cover`}
        />
        <span className="absolute inset-0 border border-white/10" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[10px] font-semibold text-slate-100">
          {option.label}
        </span>
        <span className="mt-1 block min-h-7 text-[9px] leading-3 text-slate-500">
          {option.description}
        </span>
      </span>
    </button>
  );
}

function BackgroundPanel({
  assets,
  backgroundColor,
  backgroundAssetId,
  setProjectBackground,
}) {
  const images = assets.filter((asset) => asset.kind === "image");
  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Canvas color
        </h3>
        <ColorSlider
          label="Solid color"
          value={backgroundColor}
          onChange={(color) => setProjectBackground({
            backgroundColor: color,
            backgroundAssetId: null,
          })}
          className="rounded-xl border border-white/[0.07] bg-[#11151c] p-3"
        />
        <button
          type="button"
          onClick={() =>
            setProjectBackground({
              backgroundColor: "#000000",
              backgroundAssetId: null,
            })
          }
          className="w-full rounded-lg border border-white/[0.07] px-3 py-2 text-left text-[10px] text-slate-400 hover:bg-white/[0.04]"
        >
          Use black background
        </button>
      </section>

      <section className="space-y-2">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Image background
          </h3>
          <p className="mt-1 text-[9px] leading-4 text-slate-600">
            Choose an imported image. Import one from Media first.
          </p>
        </div>
        {images.length ? (
          <div className="grid grid-cols-2 gap-2">
            {images.map((image) => (
              <button
                type="button"
                key={image.id}
                onClick={() =>
                  setProjectBackground({ backgroundAssetId: image.id })
                }
                aria-pressed={backgroundAssetId === image.id}
                title={image.name}
                className={`overflow-hidden rounded-lg border text-left transition ${backgroundAssetId === image.id ? "border-cyan-400 ring-1 ring-cyan-400/50" : "border-white/[0.08] hover:border-white/30"}`}
              >
                <img
                  src={image.url}
                  alt=""
                  className="h-16 w-full object-cover"
                />
                <span className="block truncate px-2 py-1.5 text-[9px] text-slate-300">
                  {image.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[10px] text-slate-600">
            No images in the media library
          </p>
        )}
      </section>
    </div>
  );
}

function TransitionPanel({ selectedClip, updateClip }) {
  if (!selectedClip) {
    return (
      <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-[10px] leading-5 text-slate-500">
        Select a timeline clip to choose its transition.
      </p>
    );
  }
  const transition = selectedClip.transition || {};
  const options =
    selectedClip.kind === "audio"
      ? transitionOptions.filter(
          (option) => option.id === "none" || option.id === "fade",
        )
      : transitionOptions;
  const setTransition = (patch, options) =>
    updateClip(
      selectedClip.id,
      {
        transition: {
          type: "none",
          placement: "in",
          duration: 0.5,
          ...transition,
          ...patch,
        },
      },
      options,
    );
  return (
    <div className="space-y-4">
      <p className="text-[10px] leading-4 text-slate-500">
        Transition for{" "}
        <span className="text-slate-300">
          {selectedClip.name || selectedClip.kind}
        </span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <PresetCard
            key={option.id}
            option={option}
            selected={(transition.type || "none") === option.id}
            onClick={() => setTransition({ type: option.id })}
          />
        ))}
      </div>
      <label className="block space-y-1.5">
        <span className="text-[10px] text-slate-400">Apply at</span>
        <select
          value={transition.placement || "in"}
          onChange={(event) => setTransition({ placement: event.target.value })}
          className={fieldClass}
        >
          <option value="in">Clip start</option>
          <option value="out">Clip end</option>
          <option value="both">Start and end</option>
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="flex justify-between text-[10px] text-slate-400">
          <span>Duration</span>
          <span>{Number(transition.duration ?? 0.5).toFixed(1)} s</span>
        </span>
        <input
          type="range"
          min="0.1"
          max={Math.max(0.1, Math.min(5, selectedClip.duration / 2))}
          step="0.1"
          value={Math.min(
            Number(transition.duration ?? 0.5),
            Math.max(0.1, selectedClip.duration / 2),
          )}
          onPointerDown={snapshotOnce}
          onKeyDown={snapshotOnKey}
          onChange={(event) =>
            setTransition(
              { duration: Number(event.target.value) },
              { history: false },
            )
          }
          className="w-full accent-cyan-400"
        />
      </label>
    </div>
  );
}

function AnimationPanel({ selectedClip, updateClip }) {
  if (!selectedClip) {
    return (
      <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-[10px] leading-5 text-slate-500">
        Select a video, image, text, or shape clip to add an animation.
      </p>
    );
  }
  if (!["video", "image", "text", "shape"].includes(selectedClip.kind)) {
    return (
      <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-[10px] leading-5 text-slate-500">
        Animations are available for visual clips.
      </p>
    );
  }
  const animation = selectedClip.animation || {};
  const setAnimation = (patch, options) =>
    updateClip(
      selectedClip.id,
      { animation: { type: "none", duration: 0.5, ...animation, ...patch } },
      options,
    );
  return (
    <div className="space-y-4">
      <p className="text-[10px] leading-4 text-slate-500">
        Animation for{" "}
        <span className="text-slate-300">
          {selectedClip.name || selectedClip.kind}
        </span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {animationOptions.map((option) => (
          <PresetCard
            key={option.id}
            option={option}
            selected={(animation.type || "none") === option.id}
            onClick={() => setAnimation({ type: option.id })}
          />
        ))}
      </div>
      <label className="block space-y-1.5">
        <span className="flex justify-between text-[10px] text-slate-400">
          <span>Duration</span>
          <span>{Number(animation.duration ?? 0.5).toFixed(1)} s</span>
        </span>
        <input
          type="range"
          min="0.1"
          max={Math.max(0.1, Math.min(5, selectedClip.duration))}
          step="0.1"
          value={Math.min(
            Number(animation.duration ?? 0.5),
            selectedClip.duration,
          )}
          onPointerDown={snapshotOnce}
          onKeyDown={snapshotOnKey}
          onChange={(event) =>
            setAnimation(
              { duration: Number(event.target.value) },
              { history: false },
            )
          }
          className="w-full accent-cyan-400"
        />
      </label>
    </div>
  );
}

export default function Sidebar({
  assets,
  activeTab,
  setActiveTab,
  selectedClip,
  addToTimeline,
  addTextClip,
  addShapeClip,
  addEmojiClip,
  onPickFiles,
  removeAsset,
  updateClip,
  backgroundColor,
  backgroundAssetId,
  setProjectBackground,
  className = DEFAULT_ASIDE,
}) {
  const visibleAssets = assets.filter((asset) =>
    activeTab === "audio"
      ? asset.kind === "audio"
      : asset.kind === "image" || asset.kind === "video",
  );
  const activeLabel =
    tabs.find((tab) => tab.id === activeTab)?.title ||
    tabs.find((tab) => tab.id === activeTab)?.label;

  const startAssetDrag = (event, asset) => {
    event.dataTransfer.setData("application/x-aurora-asset", asset.id);
    event.dataTransfer.setData(
      `application/x-aurora-${getClipGroup({ kind: asset.kind })}`,
      asset.id,
    );
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className={className}>
      <nav
        aria-label="Editor panels"
        className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-white/[0.06] bg-[#090b0f] py-3"
      >
        {tabs.map(({ id, label, title, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={title || label}
            aria-label={title || label}
            onClick={() => setActiveTab(id)}
            aria-pressed={activeTab === id}
            className={`flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-xl transition ${activeTab === id ? "bg-cyan-400/10 text-cyan-300 shadow-[inset_2px_0_0_#22d3ee]" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}
          >
            <Icon size={17} />
            <span className="text-[9px]">{label}</span>
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
            {activeLabel}
          </span>
          {(activeTab === "media" || activeTab === "audio") && (
            <span className="text-[10px] text-slate-500">
              {visibleAssets.length} files
            </span>
          )}
        </div>

        {activeTab === "background" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <BackgroundPanel
              {...{
                assets,
                backgroundColor,
                backgroundAssetId,
                setProjectBackground,
              }}
            />
          </div>
        ) : activeTab === "transitions" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <TransitionPanel
              selectedClip={selectedClip}
              updateClip={updateClip}
            />
          </div>
        ) : activeTab === "animations" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AnimationPanel
              selectedClip={selectedClip}
              updateClip={updateClip}
            />
          </div>
        ) : activeTab === "text" ? (
          <div className="space-y-2">
            <button
              onClick={addTextClip}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#151a22] p-3 text-left transition hover:border-cyan-500/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                <Type size={17} />
              </span>
              <span>
                <span className="block text-xs font-semibold text-white">
                  Add text overlay
                </span>
                <span className="mt-1 block text-[10px] text-slate-500">
                  Editable title on the timeline
                </span>
              </span>
            </button>
          </div>
        ) : activeTab === "shapes" ? (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
            <section className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shapes</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["rectangle", "Rectangle"],
                  ["rounded", "Rounded"],
                  ["circle", "Circle"],
                  ["ellipse", "Ellipse"],
                  ["triangle", "Triangle"],
                  ["line", "Line"],
                  ["arrow", "Arrow"],
                ].map(([shapeType, label]) => (
                  <button
                    key={shapeType}
                    type="button"
                    onClick={() => addShapeClip(shapeType)}
                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-[#11151c] text-slate-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.06] hover:text-cyan-200"
                  >
                    <span className={`block bg-cyan-400/80 ${shapeType === "circle" ? "h-7 w-7 rounded-full" : shapeType === "rounded" ? "h-7 w-10 rounded-lg" : shapeType === "triangle" ? "h-0 w-0 border-x-[14px] border-b-[28px] border-x-transparent border-b-cyan-400/80 bg-transparent" : shapeType === "line" || shapeType === "arrow" ? "h-1 w-9 rounded-full" : "h-7 w-10"}`} />
                    <span className="text-[9px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Smile size={12} /> Emojis
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`Add ${emoji} emoji`}
                    title={`Add ${emoji} emoji`}
                    onClick={() => addEmojiClip(emoji)}
                    className="flex aspect-square items-center justify-center rounded-xl border border-white/[0.07] bg-[#11151c] text-2xl transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <button
              onClick={() =>
                onPickFiles(activeTab === "audio" ? "audio" : "media")
              }
              className="mb-3 flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/[0.04] py-4 transition hover:border-cyan-400 hover:bg-cyan-500/[0.08]"
            >
              <Upload size={17} className="text-cyan-300" />
              <span className="text-xs font-semibold text-white">
                {activeTab === "audio" ? "Import audio" : "Import media"}
              </span>
              <span className="text-[10px] text-slate-500">
                {activeTab === "audio"
                  ? "Audio files only"
                  : "Images and videos only"}
              </span>
            </button>

            {visibleAssets.length ? (
              <div className="space-y-2">
                {visibleAssets.map((asset) => {
                  const Icon =
                    asset.kind === "video"
                      ? Film
                      : asset.kind === "audio"
                        ? Music2
                        : ImageIcon;
                  return (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={(event) => startAssetDrag(event, asset)}
                      className="group flex w-full items-center gap-1 rounded-xl border border-white/[0.06] bg-[#11151c] p-1.5 transition hover:border-cyan-500/40 hover:bg-[#151b24]"
                    >
                      <button
                        type="button"
                        onClick={() => addToTimeline(asset.id)}
                        title="Click to add to timeline, or drag onto a track"
                        className="flex min-w-0 flex-1 items-center gap-2.5 p-0.5 text-left"
                      >
                        <span className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/50 text-cyan-300">
                          {asset.kind === "image" ? (
                            <img
                              src={asset.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Icon size={19} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-slate-200">
                            {asset.name}
                          </span>
                          <span className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock3 size={10} />{" "}
                            {asset.duration
                              ? formatDuration(asset.duration)
                              : asset.kind}
                            {asset.syncStatus && asset.syncStatus !== "synced" && (
                              <span className={asset.syncStatus === "failed" ? "ml-1 text-rose-400" : "ml-1 text-amber-400"}>
                                · {asset.syncStatus === "pending" ? "syncing" : asset.syncStatus}
                              </span>
                            )}
                          </span>
                        </span>
                        <Plus
                          size={14}
                          className="shrink-0 text-slate-600 group-hover:text-cyan-300"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove "${asset.name}" from this project and its timeline?`,
                            )
                          )
                            removeAsset(asset.id);
                        }}
                        aria-label={`Remove ${asset.name} from project`}
                        title="Remove from project"
                        className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Upload size={20} className="mx-auto text-slate-600" />
                <p className="mt-2 text-xs text-slate-400">
                  {activeTab === "audio"
                    ? "No audio files yet"
                    : "Your media library is empty"}
                </p>
                <p className="mt-1 text-[10px] text-slate-600">
                  Import files to get started
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
