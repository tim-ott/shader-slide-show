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
    <div className="space-y-4">
      {/* Transition speed */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Duration</label>
          <span className="text-xs tabular-nums text-foreground">{duration}ms</span>
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

      {/* Separator */}
      {params.length > 0 && (
        <div className="border-t border-border" />
      )}

      {/* Per-effect params */}
      {params.map((p) => (
        <div key={p.key}>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">{p.label}</label>
            <span className="text-xs tabular-nums text-foreground">
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

      <button
        onClick={onReset}
        className="w-full rounded-lg bg-secondary py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground"
      >
        Reset to defaults
      </button>
    </div>
  );
}
