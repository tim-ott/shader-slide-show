import { useState, useCallback, useMemo } from "react";
import { Waves, Grid3X3, ZoomIn, Columns3, Zap, Droplets, Flame, CloudFog, Orbit, Code, Sliders, Download, type LucideIcon } from "lucide-react";
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

  // Build uniform values from params
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-border px-6 py-3 md:px-10">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-foreground" />
          <span className="text-base font-semibold tracking-tight text-foreground">
            Shader Playground
          </span>
        </div>
        <p className="hidden text-sm text-muted-foreground md:block">
          Interactive GLSL Transition Explorer
        </p>
      </nav>

      {/* Main */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="flex w-full shrink-0 flex-col border-b border-border md:w-80 md:border-b-0 md:border-r">
          {/* Effect selector */}
          <div className="border-b border-border p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Effects</p>
            <div className="flex flex-wrap gap-1.5">
              {shaderEffects.map((effect) => {
                const Icon = effectIcons[effect.id] || Waves;
                return (
                  <button
                    key={effect.id}
                    onClick={() => handleEffectChange(effect.id)}
                    title={effect.label}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      activeEffect === effect.id
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    }`}
                  >
                    <Icon size={12} />
                    <span className="hidden sm:inline md:inline">{effect.label}</span>
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
                className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                  sidebarTab === tab.id
                    ? "border-b-2 border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon size={13} />
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

        {/* Canvas + info */}
        <main className="flex flex-1 flex-col justify-center gap-4 p-4 md:p-8">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border shadow-lg">
            <ShaderCarousel
              activeEffect={activeEffect}
              customUniforms={uniformValues}
              overrideShader={currentCode}
              duration={duration}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="flex flex-1 items-center gap-4 rounded-xl border border-border bg-secondary/40 px-5 py-4">
              {(() => { const Icon = effectIcons[active.id] || Waves; return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                  <Icon size={18} />
                </div>
              ); })()}
              <div>
                <p className="text-sm font-semibold text-foreground">{active.label}</p>
                <p className="text-xs text-muted-foreground">{active.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-5 py-4">
              <div className="flex gap-1.5">
                <kbd className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background font-mono text-xs text-muted-foreground shadow-sm">←</kbd>
                <kbd className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background font-mono text-xs text-muted-foreground shadow-sm">→</kbd>
              </div>
              <span className="text-xs text-muted-foreground">Navigate<br />slides</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
