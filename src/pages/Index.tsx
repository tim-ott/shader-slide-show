import { useState, useCallback, useMemo } from "react";
import { Waves, Grid3X3, ZoomIn, Columns3, Zap, Droplets, Flame, CloudFog, Orbit, Code, Sliders, Download, Sparkles, type LucideIcon } from "lucide-react";
import ShaderCarousel from "@/components/ShaderCarousel";
import ShaderControls from "@/components/ShaderControls";
import CodeEditor from "@/components/CodeEditor";
import ExportPanel from "@/components/ExportPanel";
import { shaderEffects } from "@/shaders/index";

const effectIcons: Record<string, LucideIcon> = {
  "noise-distort": Waves,
  "pixelation": Grid3X3,
  "zoom-blur": ZoomIn,
  "curtain-wipe": Columns3,
  "glitch": Zap,
  "liquid-morph": Droplets,
  "burn-dissolve": Flame,
  "smoke": CloudFog,
  "liquid-portal": Orbit,
};

type SidebarTab = "controls" | "code" | "export";

const Index = () => {
  const [activeEffect, setActiveEffect] = useState(shaderEffects[0].id);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("controls");
  const [duration, setDuration] = useState(1200);
  const [paramValues, setParamValues] = useState<Record<string, Record<string, number>>>({});
  const [customCode, setCustomCode] = useState<Record<string, string>>({});
  const [shaderError, setShaderError] = useState<string | null>(null);

  const active = shaderEffects.find((e) => e.id === activeEffect)!;
  const currentParams = paramValues[activeEffect] || {};
  const currentCode = customCode[activeEffect] ?? null;

  const uniformValues = useMemo(() => {
    const vals: Record<string, number> = {};
    active.params.forEach((p) => {
      vals[p.key] = currentParams[p.key] ?? p.defaultValue;
    });
    return vals;
  }, [active, currentParams]);

  const handleParamChange = useCallback((key: string, value: number) => {
    setParamValues((prev) => ({
      ...prev,
      [activeEffect]: { ...prev[activeEffect], [key]: value },
    }));
  }, [activeEffect]);

  const handleResetParams = useCallback(() => {
    setParamValues((prev) => {
      const next = { ...prev };
      delete next[activeEffect];
      return next;
    });
    setDuration(1200);
  }, [activeEffect]);

  const handleCodeChange = useCallback((code: string) => {
    setShaderError(null);
    setCustomCode((prev) => ({ ...prev, [activeEffect]: code }));
  }, [activeEffect]);

  const handleCodeReset = useCallback(() => {
    setCustomCode((prev) => {
      const next = { ...prev };
      delete next[activeEffect];
      return next;
    });
    setShaderError(null);
  }, [activeEffect]);

  const handleEffectChange = useCallback((id: string) => {
    setActiveEffect(id);
    setShaderError(null);
  }, []);

  const sidebarTabs: { id: SidebarTab; label: string; icon: LucideIcon }[] = [
    { id: "controls", label: "Controls", icon: Sliders },
    { id: "code", label: "Code", icon: Code },
    { id: "export", label: "Export", icon: Download },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Nav */}
      <nav className="flex h-16 shrink-0 items-center justify-between px-9">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <Sparkles size={13} className="text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Shader Playground
          </span>
          <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            v1.0
          </span>
        </div>
        <p className="hidden text-xs text-muted-foreground md:block">
          Interactive GLSL Transition Explorer
        </p>
      </nav>

      {/* Main */}
      <div className="relative flex flex-1 overflow-hidden pb-6">
        {/* Floating sidebar */}
        <aside className="static z-20 ml-6 flex h-full w-80 flex-col overflow-hidden rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur-sm">
          {/* Effect selector */}
          <div className="border-b border-border p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Effects</p>
            <div className="grid grid-cols-2 gap-1.5">
              {shaderEffects.map((effect) => {
                const Icon = effectIcons[effect.id] || Waves;
                const isActive = activeEffect === effect.id;
                return (
                  <button
                    key={effect.id}
                    onClick={() => handleEffectChange(effect.id)}
                    className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={13} className={isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"} />
                    <span className="truncate">{effect.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-border">
            {sidebarTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors ${
                  sidebarTab === tab.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {sidebarTab === "controls" && (
              <ShaderControls
                params={active.params}
                values={currentParams}
                onChange={handleParamChange}
                duration={duration}
                onDurationChange={setDuration}
                onReset={handleResetParams}
              />
            )}
            {sidebarTab === "code" && (
              <CodeEditor
                code={currentCode ?? active.fragmentShader}
                onChange={handleCodeChange}
                onReset={handleCodeReset}
                error={shaderError}
              />
            )}
            {sidebarTab === "export" && (
              <ExportPanel
                effectLabel={active.label}
                fragmentShader={currentCode ?? active.fragmentShader}
                paramValues={uniformValues}
                duration={duration}
              />
            )}
          </div>
        </aside>

        {/* Canvas area - full width, sidebar floats over */}
        <main className="flex min-w-0 flex-1 flex-col justify-center gap-4 overflow-hidden px-6 py-0">
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border shadow-2xl shadow-primary/5">
            <ShaderCarousel
              activeEffect={activeEffect}
              customUniforms={uniformValues}
              overrideShader={currentCode}
              duration={duration}
            />
          </div>

          {/* Footer bar */}
          <div className="flex items-center gap-3">
            {/* Active effect */}
            <div className="flex flex-1 items-center gap-3 rounded-lg bg-[rgba(11,18,34,1)] px-4 py-3">
              {(() => { const Icon = effectIcons[active.id] || Waves; return (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Icon size={16} className="text-primary" />
                </div>
              ); })()}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{active.label}</p>
                <p className="truncate text-[11px] text-muted-foreground">{active.description}</p>
              </div>
            </div>

            {/* Keyboard hint */}
            <div className="flex h-full items-center gap-2.5 rounded-lg bg-[rgba(11,18,34,1)] px-4 py-3">
              <div className="flex gap-1">
                <kbd className="inline-flex h-6 w-6 items-center justify-center rounded border border-border bg-muted font-mono text-[10px] text-muted-foreground">←</kbd>
                <kbd className="inline-flex h-6 w-6 items-center justify-center rounded border border-border bg-muted font-mono text-[10px] text-muted-foreground">→</kbd>
              </div>
              <span className="text-[11px] text-muted-foreground">Navigate</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
