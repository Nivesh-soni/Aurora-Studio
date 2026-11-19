import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  BringToFront,
  RotateCcw,
  CopyPlus,
  Image as ImageIcon,
  Move,
  Minus,
  Plus,
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
  Palette,
} from "lucide-react";
import { getClipFilter } from "./clipEffects";
import ColorSlider from "./ColorSlider";
import { findAvailableTrack, getClipGroup } from "./timelineTracks";

const DEFAULT_ASIDE = "hidden min-h-0 min-w-0 flex-col border-l border-white/[0.08] bg-[#0c0f14] xl:flex";
const MAX_TIMELINE_SECONDS = 60 * 60;
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

const numberField = (label, value, onChange, { min = 0, max, step = 1, suffix = "" } = {}) => {
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : min;
  // Fields without a natural upper bound still use a useful, adjustable slider range.
  const sliderMax = Number.isFinite(max) && max >= min
    ? max
    : Math.max(min + 1, Math.ceil(Math.max(numericValue + 30, numericValue * 2, 60)));
  const sliderValue = Math.max(min, Math.min(sliderMax, numericValue));

  return (
    <label className="aurora-control block min-w-0 space-y-2">
      <span className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-slate-300">{label}</span>
        <output className="aurora-control-value">
          {Number.isInteger(numericValue) ? numericValue : numericValue.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}
          {suffix && <span>{suffix}</span>}
        </output>
      </span>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={`${numericValue}${suffix}`}
        min={min}
        max={sliderMax}
        step={step}
        value={sliderValue}
        onChange={(event) => onChange(Number(event.target.value))}
        className="aurora-value-slider w-full"
      />
    </label>
  );
};

function NumericField({ label, value, onChange, min = 0, max, step = 1, suffix = "" }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : min;
  const maximum = Number.isFinite(max) ? max : MAX_TIMELINE_SECONDS;
  const clamp = (number) => Math.max(min, Math.min(maximum, number));

  useEffect(() => {
    if (inputRef.current && !inputRef.current.matches(":focus")) {
      inputRef.current.value = String(Number.isInteger(numericValue) ? numericValue : Number(numericValue.toFixed(3)));
    }
  }, [numericValue]);

  const commitValue = (input) => {
    const parsed = Number(input.value);
    const nextValue = input.value.trim() && Number.isFinite(parsed)
      ? clamp(parsed)
      : numericValue;
    onChange(nextValue);
    input.value = String(Number.isInteger(nextValue) ? nextValue : Number(nextValue.toFixed(3)));
  };
  const stepValue = (direction) => {
    const input = inputRef.current;
    if (!input) return;
    const currentValue = Number(input.value);
    const baseValue = input.value.trim() && Number.isFinite(currentValue)
      ? currentValue
      : numericValue;
    const precision = (String(step).split(".")[1] || "").length;
    const nextValue = clamp(Number((baseValue + direction * step).toFixed(precision)));
    onChange(nextValue);
    input.value = String(Number.isInteger(nextValue) ? nextValue : Number(nextValue.toFixed(3)));
  };

  return (
    <div className="aurora-control aurora-numeric-control block min-w-0 space-y-2">
      <label htmlFor={inputId} className="block text-[10px] font-medium text-slate-300">{label}</label>
      <span className="aurora-number-field">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={numericValue <= min}
          onClick={() => stepValue(-1)}
        >
          <Minus size={12} />
        </button>
        <input
          id={inputId}
          ref={inputRef}
          type="number"
          aria-label={label}
          defaultValue={String(Number.isInteger(numericValue) ? numericValue : Number(numericValue.toFixed(3)))}
          min={min}
          max={maximum}
          step={step}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            if (event.target.value !== "" && Number.isFinite(parsed)) {
              onChange(clamp(parsed));
            }
          }}
          onBlur={(event) => commitValue(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="aurora-number-input"
        />
        {suffix && <span className="aurora-number-suffix">{suffix}</span>}
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={numericValue >= maximum}
          onClick={() => stepValue(1)}
        >
          <Plus size={12} />
        </button>
      </span>
    </div>
  );
}

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
  if (clip.kind === "shape") options.push({ id: "shape", icon: Palette, label: "Shape style" });
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
  clips,
  currentTime,
  setCurrentTime,
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
  const speed = Math.max(0.25, Number(draft?.speed) || 1);
  const sourceDuration = Number(selectedAsset?.duration);
  const hasSourceDuration = ["video", "audio"].includes(selected?.kind)
    && Number.isFinite(sourceDuration)
    && sourceDuration > 0;
  const sourceStart = Math.max(0, Number(draft?.sourceStart) || 0);
  const maxDuration = Math.min(
    MAX_TIMELINE_SECONDS,
    hasSourceDuration
      ? Math.max(0.1, (sourceDuration - sourceStart) / speed)
      : MAX_TIMELINE_SECONDS,
  );
  const maxSourceStart = hasSourceDuration
    ? Math.max(0, sourceDuration - 0.1 * speed)
    : MAX_TIMELINE_SECONDS;
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
    let nextDraft = { ...draft, ...patch };
    if (activePanel === "timing" && (
      patch.start !== undefined || patch.duration !== undefined || patch.sourceStart !== undefined
    )) {
      nextDraft = {
        ...nextDraft,
        track: findAvailableTrack(
          clips,
          getClipGroup(selected),
          nextDraft.start,
          nextDraft.duration,
          selected.id,
          selected.track,
        ),
      };
    }
    setDraftState({ clipId: selected.id, draft: nextDraft });
    onDraftChange(nextDraft);
    setCurrentTime(nextDraft.start);
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
                      <NumericField label="Position X" value={draft.x ?? 50} onChange={(x) => updateDraft({ x })} min={0} max={100} suffix="%" />
                      <NumericField label="Position Y" value={draft.y ?? 50} onChange={(y) => updateDraft({ y })} min={0} max={100} suffix="%" />
                      <NumericField label="Size" value={draft.scale ?? 100} onChange={(scale) => updateDraft({ scale })} min={10} max={300} suffix="%" />
                      <NumericField label="Rotation" value={draft.rotation ?? 0} onChange={(rotation) => updateDraft({ rotation })} min={-180} max={180} suffix="°" />
                    </div>
                  )}
                  {activePanel === "shape" && (
                    <div className="grid grid-cols-2 gap-2">
                      {numberField("Width", draft.width ?? 30, (width) => updateDraft({ width: Math.max(2, Math.min(100, width)) }), { min: 2, max: 100, suffix: "%" })}
                      {numberField("Height", draft.height ?? 30, (height) => updateDraft({ height: Math.max(2, Math.min(100, height)) }), { min: 2, max: 100, suffix: "%" })}
                      {numberField("Border width", draft.strokeWidth ?? 3, (strokeWidth) => updateDraft({ strokeWidth: Math.max(0, Math.min(40, strokeWidth)) }), { min: 0, max: 40, suffix: "px" })}
                      {numberField("Corner radius", draft.cornerRadius ?? 12, (cornerRadius) => updateDraft({ cornerRadius: Math.max(0, Math.min(50, cornerRadius)) }), { min: 0, max: 50, suffix: "%" })}
                      <div className="min-w-0 space-y-2">
                        <ColorSlider
                          label="Fill color"
                          value={draft.fillColor || "#38bdf8"}
                          onChange={(fillColor) => updateDraft({ fillColor, fillEnabled: true })}
                        />
                        <button type="button" aria-pressed={draft.fillEnabled !== false} onClick={() => updateDraft({ fillEnabled: draft.fillEnabled === false })} className={`w-full rounded-md border px-2 py-1.5 text-[9px] ${draft.fillEnabled === false ? "border-cyan-400/40 text-cyan-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{draft.fillEnabled === false ? "Add fill" : "No fill"}</button>
                      </div>
                      <ColorSlider
                        label="Border color"
                        value={draft.strokeColor || "#000000"}
                        onChange={(strokeColor) => updateDraft({ strokeColor })}
                      />
                      {numberField("Opacity", draft.opacity ?? 100, (opacity) => updateDraft({ opacity: Math.max(0, Math.min(100, opacity)) }), { min: 0, max: 100, suffix: "%" })}
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
                        {numberField("Opacity", draft.opacity ?? 100, (opacity) => updateDraft({ opacity: Math.max(0, Math.min(100, opacity)) }), { min: 0, max: 100, suffix: "%" })}
                        <ColorSlider
                          label="Background color"
                          value={draft.textBackgroundColor || "#000000"}
                          onChange={(textBackgroundColor) => updateDraft({ textBackgroundColor })}
                        />
                        {numberField("Background opacity", draft.textBackgroundOpacity ?? 0, (textBackgroundOpacity) => updateDraft({ textBackgroundOpacity: Math.max(0, Math.min(100, textBackgroundOpacity)) }), { min: 0, max: 100, suffix: "%" })}
                        <ColorSlider
                          label="Text color"
                          value={draft.textColor || "#ffffff"}
                          onChange={(textColor) => updateDraft({ textColor })}
                        />
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
                      <NumericField label="Start" value={draft.start} onChange={(start) => updateDraft({ start })} min={0} max={MAX_TIMELINE_SECONDS} step={0.1} suffix="s" />
                      <NumericField label="Duration" value={draft.duration} onChange={(duration) => updateDraft({ duration: Math.max(0.1, Math.min(maxDuration, duration)) })} min={0.1} max={maxDuration} step={0.1} suffix="s" />
                      {hasSourceDuration && <NumericField label="Source in" value={sourceStart} onChange={(value) => {
                        const nextSourceStart = Math.max(0, Math.min(maxSourceStart, value));
                        const availableDuration = hasSourceDuration
                          ? Math.max(0.1, (sourceDuration - nextSourceStart) / speed)
                          : draft.duration;
                        updateDraft({
                          sourceStart: nextSourceStart,
                          duration: Math.min(draft.duration, availableDuration),
                        });
                      }} min={0} max={maxSourceStart} step={0.1} suffix="s" />}
                      {hasSourceDuration && (
                        <p className="col-span-2 text-[9px] leading-4 text-slate-500">
                          Source in skips this much of the original media before playback starts.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 justify-end gap-1.5 border-t border-white/[0.08] bg-[#090b0f] p-2">
                  <button type="button" aria-label="Cancel changes" title="Cancel" onClick={() => { setActivePanel(null); setDraftState(null); onDraftChange(null); setCurrentTime(selected.start); }} className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-slate-300 hover:bg-white/10"><X size={14} /></button>
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
