import { getHexHue, setHexHue } from "./colorUtils";

export default function ColorSlider({ label, value, onChange, className = "" }) {
  const color = /^#[\\da-f]{6}$/i.test(value || "") ? value : "#000000";

  return (
    <div className={`aurora-color-control min-w-0 space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-slate-300">{label}</span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{color}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <label
          className="aurora-color-swatch"
          style={{ "--swatch-color": color }}
          title={`Choose ${label.toLowerCase()}`}
        >
          <input
            type="color"
            aria-label={`${label} color`}
            value={color}
            onChange={(event) => onChange(event.target.value)}
          />
          <span aria-hidden="true" />
        </label>
        <input
          type="range"
          aria-label={`${label} hue`}
          min="0"
          max="359"
          step="1"
          value={getHexHue(color)}
          onChange={(event) => onChange(setHexHue(color, Number(event.target.value)))}
          className="hue-spectrum-slider min-w-0 flex-1"
        />
      </div>
    </div>
  );
}
