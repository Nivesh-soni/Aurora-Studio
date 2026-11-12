import { useState } from "react";
import {
  Check,
  BringToFront,
  RotateCcw,
  CopyPlus,
  Image as ImageIcon,
  Move,
  Scissors,
  SlidersHorizontal,
  SendToBack,
  Sparkles,
  Timer,
  Type,
  Video,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { getClipFilter } from "./clipEffects";

const DEFAULT_ASIDE = "hidden min-h-0 min-w-0 flex-col border-l border-white/[0.08] bg-[#0c0f14] xl:flex";
const RESETS = {
  transform: { x: 50, y: 50, scale: 100, rotation: 0 },
  filters: { effects: { brightness: 100, contrast: 100, saturation: 100, blur: 0 } },
  effects: { opacity: 100, effects: { brightness: 100, contrast: 100, saturation: 100, blur: 0 } },
  speed: { speed: 1 },
};
const filterPresets = [
  { id: "natural", label: "Natural", values: { brightness: 100, contrast: 100, saturation: 100, blur: 0 } },
  { id: "vivid", label: "Vivid", values: { brightness: 105, contrast: 115, saturation: 140, blur: 0 } },
  { id: "muted", label: "Muted", values: { brightness: 102, contrast: 92, saturation: 70, blur: 0 } },
  { id: "mono", label: "Mono", values: { brightness: 100, contrast: 110, saturation: 0, blur: 0 } },
  { id: "soft", label: "Soft", values: { brightness: 108, contrast: 90, saturation: 110, blur: 0 } },
  { id: "dramatic", label: "Dramatic", values: { brightness: 93, contrast: 135, saturation: 110, blur: 0 } },
];
const fieldClass = "w-full rounded-md border border-white/[0.08] bg-[#0b0e13] px-2 py-1.5 text-[11px] text-white outline-none focus:border-cyan-500/60";

const numberField = (label, value, onChange, { min, max, step = 1, suffix = "" } = {}) => (
  <label className="block min-w-0 space-y-1">
    <span className="text-[9px] text-slate-400">{label}</span>
    <div className="flex items-center rounded-md border border-white/[0.08] bg-[#0b0e13] pr-2 focus-within:border-cyan-500/60">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full bg-transparent px-2 py-1.5 font-mono text-[11px] text-white outline-none"
      />
      {suffix && <span className="text-[10px] text-slate-500">{suffix}</span>}
    </div>
  </label>
);

const selectField = (label, value, options, onChange) => (
  <label className="block space-y-1.5">
    <span className="text-[10px] text-slate-400">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
      {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
    </select>
  </label>
);

const panelOptions = (clip) => {
  const options = clip.kind === "audio" ? [] : [{ id: "transform", icon: Move, label: "Transform" }];
  if (clip.kind === "image" || clip.kind === "video") {
    options.push({ id: "filters", icon: Sparkles, label: "Filters" });
    options.push({ id: "effects", icon: SlidersHorizontal, label: "Effects" });
  }
  if (clip.kind === "text") {
    options.push({ id: "text", icon: Type, label: "Text style" });
  }
  if (clip.kind === "video") {
    options.push({ id: "speed", icon: Zap, label: "Speed" });
  }
  if (clip.kind === "audio" || clip.kind === "video") {
    options.push({ id: "audio", icon: Volume2, label: "Audio" });
  }
  options.push({ id: "timing", icon: Timer, label: "Timing" });
  return options;
};

export default function Inspector({
  selected,
  selectedAsset,
  currentTime,
  updateClip,
  duplicateClip,
  splitClip,
  setClipLayer,
  onDraftChange,
  className = DEFAULT_ASIDE,
}) {
  const [activePanel, setActivePanel] = useState(null);
  const [draftState, setDraftState] = useState(null);
  const isDraftCurrent = Boolean(selected && draftState?.clipId === selected.id);
  const draft = isDraftCurrent ? draftState.draft : selected;
  const sourceDuration = selectedAsset?.duration || 0;
  const maxDuration = sourceDuration
    ? Math.max(0.1, (sourceDuration - (selected.sourceStart || 0)) / (selected.speed || 1))
    : undefined;
  const options = selected ? panelOptions(selected) : [];
  const currentPanel = isDraftCurrent ? activePanel : null;
  const activeOption = options.find((option) => option.id === currentPanel);
  const selectedFilterPreset = filterPresets.find((preset) =>
    Object.entries(preset.values).every(
      ([key, value]) => Number(draft?.effects?.[key] ?? (key === "blur" ? 0 : 100)) === value,
    ),
  )?.id;

  const updateDraft = (patch) => {
    if (!selected) return;
    const nextDraft = { ...draft, ...patch };
    setDraftState({ clipId: selected.id, draft: nextDraft });
    onDraftChange(nextDraft);
  };
  const updateEffect = (key, value) =>
    updateDraft({
      effects: { ...(draft.effects || {}), [key]: value },
    });
  const openPanel = (id) => {
    const nextDraft = isDraftCurrent
      ? draft
      : { ...selected, effects: { ...(selected.effects || {}) } };
    setDraftState({
      clipId: selected.id,
      draft: nextDraft,
    });
    onDraftChange(nextDraft);
    setActivePanel(id);
  };
  const applyPanel = () => {
    const changes = { ...draft };
    delete changes.id;
    updateClip(selected.id, changes);
    setActivePanel(null);
    setDraftState(null);
    onDraftChange(null);
  };

  return (
    <aside className={className}>
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.08] px-3">
        <SlidersHorizontal size={15} className="text-cyan-300" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Inspector</span>
      </div>
      {selected ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-1.5 border-b border-white/[0.06] px-2 py-2">
              {selected.kind === "text" ? <Type size={15} className="text-fuchsia-300" /> : selected.kind === "audio" ? <Volume2 size={15} className="text-amber-300" /> : selected.kind === "image" ? <ImageIcon size={15} className="text-violet-300" /> : <Video size={15} className="text-cyan-300" />}
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-200">{selected.name}</span>
              <button
                type="button"
                aria-label="Split selected clip at playhead"
                title="Split at playhead"
                onClick={() => splitClip(selected.id, currentTime)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
              >
                <Scissors size={14} />
              </button>
              {(selected.kind === "video" || selected.kind === "image" || selected.kind === "text") && (
                <>
                  <button
                    type="button"
                    aria-label="Send to back"
                    title="Send to back"
                    onClick={() => setClipLayer(selected.id, "back")}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
                  >
                    <SendToBack size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Bring to front"
                    title="Bring to front"
                    onClick={() => setClipLayer(selected.id, "front")}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
                  >
                    <BringToFront size={14} />
                  </button>
                </>
              )}
              <button
                type="button"
                aria-label={`Duplicate ${selected.name}`}
                title="Duplicate clip"
                onClick={() => duplicateClip(selected.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
              >
                <CopyPlus size={15} />
              </button>
            </div>
            <nav aria-label="Inspector properties" className="flex shrink-0 items-center justify-around gap-1 border-b border-white/[0.08] bg-[#090b0f] px-2 py-1.5">
              {options.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={currentPanel === id}
                  onClick={() => openPanel(id)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition ${currentPanel === id ? "bg-cyan-400/15 text-cyan-200" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </nav>

            {activeOption && draft ? (
              <section className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{activeOption.label}</h3>
                    {RESETS[activePanel] && (
                      <button type="button" onClick={() => updateDraft(RESETS[activePanel])} title="Reset to defaults" className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-slate-400 transition hover:bg-white/5 hover:text-cyan-200"><RotateCcw size={11} />Reset</button>
                    )}
                  </div>
                  {activePanel === "transform" && (
                    <div className="grid grid-cols-2 gap-2">
                      {numberField("Position X", draft.x ?? 50, (x) => updateDraft({ x }), { min: 0, max: 100, suffix: "%" })}
                      {numberField("Position Y", draft.y ?? 50, (y) => updateDraft({ y }), { min: 0, max: 100, suffix: "%" })}
                      {numberField("Size", draft.scale ?? 100, (scale) => updateDraft({ scale: Math.max(10, Math.min(300, scale)) }), { min: 10, max: 300, suffix: "%" })}
                      {numberField("Rotation", draft.rotation ?? 0, (rotation) => updateDraft({ rotation: Math.max(-180, Math.min(180, rotation)) }), { min: -180, max: 180, suffix: "°" })}
                    </div>
                  )}
                  {activePanel === "filters" && (
                    <>
                      <p className="text-[10px] leading-4 text-slate-500">
                        Ready-made looks for the selected image or video.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {filterPresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            aria-pressed={selectedFilterPreset === preset.id}
                            onClick={() =>
                              updateDraft({
                                effects: { ...(draft.effects || {}), ...preset.values },
                              })
                            }
                            className={`rounded-xl border p-2 text-left transition ${selectedFilterPreset === preset.id ? "border-cyan-400/60 bg-cyan-400/[0.08]" : "border-white/[0.07] bg-[#11151c] hover:border-white/20"}`}
                          >
                            <span
                              className="mb-1.5 block h-10 rounded-md"
                              style={{
                                background: "linear-gradient(135deg, #f8b86b 0%, #d45e70 48%, #426bb4 100%)",
                                filter: getClipFilter({ effects: preset.values }),
                              }}
                            />
                            <span className="block text-[10px] font-medium text-slate-200">
                              {preset.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {activePanel === "effects" && (
                    <>
                      <p className="text-[10px] leading-4 text-slate-500">
                        Fine-tune the selected image or video.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {numberField("Opacity", draft.opacity ?? 100, (opacity) => updateDraft({ opacity: Math.max(0, Math.min(100, opacity)) }), { min: 0, max: 100, suffix: "%" })}
                        {numberField("Brightness", draft.effects?.brightness ?? 100, (value) => updateEffect("brightness", value), { min: 0, max: 200, suffix: "%" })}
                        {numberField("Contrast", draft.effects?.contrast ?? 100, (value) => updateEffect("contrast", value), { min: 0, max: 200, suffix: "%" })}
                        {numberField("Saturation", draft.effects?.saturation ?? 100, (value) => updateEffect("saturation", value), { min: 0, max: 200, suffix: "%" })}
                        {numberField("Blur", draft.effects?.blur ?? 0, (value) => updateEffect("blur", value), { min: 0, max: 20, suffix: "px" })}
                      </div>
                    </>
                  )}
                  {activePanel === "text" && (
                    <>
                      <label className="block space-y-1">
                        <span className="text-[9px] text-slate-400">Text</span>
                        <textarea value={draft.text || ""} onChange={(event) => updateDraft({ text: event.target.value })} rows={3} maxLength={300} className={`${fieldClass} resize-y`} />
                      </label>
                      {selectField("Typography", draft.fontFamily || "Arial", [
                        ["Arial", "Arial"], ["Georgia", "Georgia"], ["Times New Roman", "Times New Roman"],
                        ["Verdana", "Verdana"], ["Courier New", "Courier New"], ["Impact", "Impact"],
                      ], (fontFamily) => updateDraft({ fontFamily }))}
                      {selectField("Position", draft.textPosition || "center", [
                        ["top", "Top"], ["center", "Center"], ["bottom", "Bottom"],
                      ], (textPosition) => updateDraft({ textPosition, y: { top: 15, center: 50, bottom: 85 }[textPosition] }))}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block space-y-1">
                          <span className="text-[9px] text-slate-400">Background color</span>
                          <input type="color" value={draft.textBackgroundColor || "#000000"} onChange={(event) => updateDraft({ textBackgroundColor: event.target.value })} className="h-8 w-full cursor-pointer rounded-md border border-white/[0.08] bg-[#0b0e13] p-1" />
                        </label>
                        {numberField("Background opacity", draft.textBackgroundOpacity ?? 0, (textBackgroundOpacity) => updateDraft({ textBackgroundOpacity: Math.max(0, Math.min(100, textBackgroundOpacity)) }), { min: 0, max: 100, suffix: "%" })}
                        <label className="block space-y-1">
                          <span className="text-[9px] text-slate-400">Text color</span>
                          <input type="color" value={draft.textColor || "#ffffff"} onChange={(event) => updateDraft({ textColor: event.target.value })} className="h-8 w-full cursor-pointer rounded-md border border-white/[0.08] bg-[#0b0e13] p-1" />
                        </label>
                        {numberField("Font size", draft.fontSize ?? 48, (fontSize) => updateDraft({ fontSize: Math.max(12, Math.min(160, fontSize)) }), { min: 12, max: 160, suffix: "px" })}
                      </div>
                    </>
                  )}
                  {activePanel === "speed" && numberField("Playback speed", draft.speed ?? 1, (speed) => updateDraft({ speed: Math.max(0.25, Math.min(4, speed)) }), { min: 0.25, max: 4, step: 0.05, suffix: "×" })}
                  {activePanel === "audio" && (
                    <>
                      {numberField("Volume", draft.volume ?? 100, (volume) => updateDraft({ volume: Math.max(0, Math.min(200, volume)) }), { min: 0, max: 200, suffix: "%" })}
                      {selected.kind === "audio" && numberField("Playback speed", draft.speed ?? 1, (speed) => updateDraft({ speed: Math.max(0.25, Math.min(4, speed)) }), { min: 0.25, max: 4, step: 0.05, suffix: "×" })}
                      {selected.kind === "audio" && (
                        <div className="grid grid-cols-2 gap-2">
                          {numberField("Fade in", draft.fadeIn ?? (["in", "both"].includes(draft.transition?.placement || "in") && draft.transition?.type === "fade" ? draft.transition.duration : 0), (fadeIn) => updateDraft({ fadeIn: Math.max(0, Math.min(selected.duration / 2, fadeIn)) }), { min: 0, max: selected.duration / 2, step: 0.1, suffix: "s" })}
                          {numberField("Fade out", draft.fadeOut ?? (["out", "both"].includes(draft.transition?.placement) && draft.transition?.type === "fade" ? draft.transition.duration : 0), (fadeOut) => updateDraft({ fadeOut: Math.max(0, Math.min(selected.duration / 2, fadeOut)) }), { min: 0, max: selected.duration / 2, step: 0.1, suffix: "s" })}
                        </div>
                      )}
                      <button
                        type="button"
                        aria-pressed={Boolean(draft.muted)}
                        onClick={() => updateDraft({ muted: !draft.muted })}
                        className={`flex h-8 items-center gap-2 rounded-md border px-2 text-[10px] transition ${draft.muted ? "border-rose-400/30 bg-rose-400/10 text-rose-200" : "border-white/[0.08] bg-[#0b0e13] text-slate-300 hover:border-cyan-400/30"}`}
                      >
                        {draft.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        <span>Mute</span>
                      </button>
                    </>
                  )}
                  {activePanel === "timing" && (
                    <div className="grid grid-cols-2 gap-2">
                      {numberField("Start", draft.start, (start) => updateDraft({ start: Math.max(0, start) }), { min: 0, step: 0.1, suffix: "s" })}
                      {numberField("Duration", draft.duration, (duration) => updateDraft({ duration: Math.max(0.1, Math.min(maxDuration ?? Infinity, duration)) }), { min: 0.1, max: maxDuration, step: 0.1, suffix: "s" })}
                      {selected.kind !== "text" && numberField("Source in", draft.sourceStart ?? 0, (sourceStart) => updateDraft({ sourceStart: Math.max(0, sourceStart) }), { min: 0, step: 0.1, suffix: "s" })}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 justify-end gap-1.5 border-t border-white/[0.08] bg-[#090b0f] p-2">
                  <button type="button" aria-label="Cancel changes" title="Cancel" onClick={() => { setActivePanel(null); setDraftState(null); onDraftChange(null); }} className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-slate-300 hover:bg-white/10"><X size={14} /></button>
                  <button type="button" aria-label="Apply changes" title="Apply" onClick={applyPanel} className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-400 text-slate-950 hover:bg-cyan-300"><Check size={14} /></button>
                </div>
              </section>
            ) : (
              <div className="flex flex-1 items-center justify-center px-5 text-center text-[10px] leading-5 text-slate-500">
                Select a property icon to edit. Preview changes are applied after confirmation.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <SlidersHorizontal size={25} className="mb-3 text-slate-700" />
          <p className="text-xs font-medium text-slate-300">Clip properties</p>
          <p className="mt-1 text-[10px] leading-5 text-slate-500">Select a clip to edit its properties.</p>
        </div>
      )}
    </aside>
  );
}
