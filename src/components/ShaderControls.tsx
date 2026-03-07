import { Slider } from "@/components/ui/slider";
import type { ShaderParam } from "@/shaders/index";

interface ShaderControlsProps {
  params: ShaderParam[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  duration: number;
  onDurationChange: (v: number) => void;
  onReset: () => void;
}

export default function ShaderControls({
  params,
  values,
  onChange,
  duration,
  onDurationChange,
  onReset,
}: ShaderControlsProps) {
  return (
    <div className="space-y-5">
      {/* Duration */}
      <div className="rounded-lg bg-[rgba(11,18,34,1)] p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Duration</label>
          <span className="rounded-md bg-background px-2 py-0.5 font-mono text-[11px] text-foreground">{duration}ms</span>
        </div>
        <Slider
          min={300}
          max={4000}
          step={100}
          value={[duration]}
          onValueChange={([v]) => onDurationChange(v)}
          className="w-full"
        />
      </div>

      {/* Per-effect params */}
      {params.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Parameters</p>
          {params.map((p) => (
            <div key={p.key} className="rounded-lg bg-[rgba(11,18,34,1)] p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <label className="text-xs font-medium text-secondary-foreground">{p.label}</label>
                <span className="rounded-md bg-background px-2 py-0.5 font-mono text-[11px] text-foreground">
                  {Number(values[p.key] ?? p.defaultValue).toFixed(
                    p.step < 0.01 ? 3 : p.step < 1 ? 2 : 0
                  )}
                </span>
              </div>
              <Slider
                min={p.min}
                max={p.max}
                step={p.step}
                value={[values[p.key] ?? p.defaultValue]}
                onValueChange={([v]) => onChange(p.key, v)}
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full rounded-lg border border-border bg-card py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Reset to defaults
      </button>
    </div>
  );
}
