import { Waves, Grid3X3, ZoomIn, Columns3, Zap, Droplets, Flame, CloudFog, Orbit, Code, Sliders, Download, Sparkles, SunMedium, MoonStar, type LucideIcon } from "lucide-react";
import ShaderCarousel, { type CarouselSnapshot } from "@/components/ShaderCarousel";
import ShaderControls from "@/components/ShaderControls";
import CodeEditor from "@/components/CodeEditor";
import ExportPanel from "@/components/ExportPanel";
import { shaderEffects } from "@/shaders/index";
import type { ShaderEffect } from "@/shaders/index";

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

export type SidebarTab = "controls" | "code" | "export";

export interface IndexLayoutProps {
  theme: string | undefined;
  /** Ref for theme button (main layout only – used for mask origin). Omit for overlay. */
  themeButtonRef?: React.RefObject<HTMLButtonElement | null>;
  onThemeClick: () => void;
  activeEffect: string;
  onEffectChange: (id: string) => void;
  sidebarTab: SidebarTab;
  onSidebarTabChange: (tab: SidebarTab) => void;
  active: ShaderEffect;
  duration: number;
  onDurationChange: (v: number) => void;
  currentParams: Record<string, number>;
  onParamChange: (key: string, value: number) => void;
  onResetParams: () => void;
  currentCode: string | null;
  onCodeChange: (code: string) => void;
  onCodeReset: () => void;
  shaderError: string | null;
  uniformValues: Record<string, number>;
  /** Pause carousel so theme transition layers show the same frame */
  pauseCarousel?: boolean;
  /** When set (e.g. overlay), render carousel at this exact frame so old/new theme match */
  carouselSnapshot?: CarouselSnapshot | null;
  /** Main carousel reports state so we can freeze overlay to same frame */
  onCarouselStateChange?: (state: CarouselSnapshot) => void;
}

const sidebarTabs: { id: SidebarTab; label: string; icon: LucideIcon }[] = [
  { id: "controls", label: "Controls", icon: Sliders },
  { id: "code", label: "Code", icon: Code },
  { id: "export", label: "Export", icon: Download },
];

export function IndexLayout({
  theme,
  themeButtonRef,
  onThemeClick,
  activeEffect,
  onEffectChange,
  sidebarTab,
  onSidebarTabChange,
  active,
  duration,
  onDurationChange,
  currentParams,
  onParamChange,
  onResetParams,
  currentCode,
  onCodeChange,
  onCodeReset,
  shaderError,
  uniformValues,
  pauseCarousel = false,
  carouselSnapshot = null,
  onCarouselStateChange,
}: IndexLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
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
        <div className="flex items-center gap-4">
          <p className="hidden text-xs text-muted-foreground md:block">
            Interactive GLSL Transition Explorer
          </p>
          <button
            ref={themeButtonRef}
            type="button"
            aria-label="Toggle theme"
            onClick={onThemeClick}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
          >
            {theme === "dark" ? (
              <SunMedium className="h-4 w-4" />
            ) : (
              <MoonStar className="h-4 w-4" />
            )}
          </button>
        </div>
      </nav>

      <div className="relative flex flex-1 overflow-hidden pb-6">
        <aside className="static z-20 ml-6 flex h-full w-80 flex-col overflow-hidden rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur-sm">
          <div className="border-b border-border p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Effects</p>
            <div className="grid grid-cols-2 gap-1.5">
              {shaderEffects.map((effect) => {
                const Icon = effectIcons[effect.id] || Waves;
                const isActive = activeEffect === effect.id;
                return (
                  <button
                    key={effect.id}
                    onClick={() => onEffectChange(effect.id)}
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

          <div className="flex border-b border-border">
            {sidebarTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSidebarTabChange(tab.id)}
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

          <div className="flex-1 overflow-y-auto p-4">
            {sidebarTab === "controls" && (
              <ShaderControls
                params={active.params}
                values={currentParams}
                onChange={onParamChange}
                duration={duration}
                onDurationChange={onDurationChange}
                onReset={onResetParams}
              />
            )}
            {sidebarTab === "code" && (
              <CodeEditor
                code={currentCode ?? active.fragmentShader}
                onChange={onCodeChange}
                onReset={onCodeReset}
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

        <main className="flex min-w-0 flex-1 flex-col justify-center gap-4 overflow-hidden px-6 py-0">
          <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-2xl shadow-primary/5">
            <ShaderCarousel
              activeEffect={activeEffect}
              customUniforms={uniformValues}
              overrideShader={currentCode}
              duration={duration}
              pause={pauseCarousel}
              snapshot={carouselSnapshot}
              onStateChange={onCarouselStateChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-panel-border bg-panel px-4 py-3">
              {(() => {
                const Icon = effectIcons[active.id] || Waves;
                return (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                    <Icon size={16} className="text-primary" />
                  </div>
                );
              })()}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{active.label}</p>
                <p className="truncate text-[11px] text-muted-foreground">{active.description}</p>
              </div>
            </div>

            <div className="flex h-full items-center gap-2.5 rounded-lg border border-panel-border bg-panel px-4 py-3">
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
}
