import { useState } from "react";
import ShaderCarousel from "@/components/ShaderCarousel";
import { shaderEffects } from "@/shaders/index";

const Index = () => {
  const [activeEffect, setActiveEffect] = useState(shaderEffects[0].id);
  const active = shaderEffects.find((e) => e.id === activeEffect)!;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-border px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-foreground" />
          <span className="text-base font-semibold tracking-tight text-foreground">
            Shader Lab
          </span>
        </div>
        <p className="hidden text-sm text-muted-foreground md:block">
          Interactive GLSL Transition Explorer
        </p>
      </nav>

      {/* Main content — sidebar + canvas */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 border-b border-border p-6 md:w-72 md:border-b-0 md:border-r md:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Explore shader transitions.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select an effect and watch it come to life.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 md:flex-col">
            {shaderEffects.map((effect) => (
              <button
                key={effect.id}
                onClick={() => setActiveEffect(effect.id)}
                className={`rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  activeEffect === effect.id
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                {effect.label}
              </button>
            ))}
          </div>

        </aside>

        {/* Canvas + info */}
        <main className="flex flex-1 flex-col p-4 md:p-8">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border shadow-lg">
            <ShaderCarousel activeEffect={activeEffect} />
          </div>

          {/* Active effect + keyboard hint — inline bar */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">{active.label}</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">— {active.description}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-background px-1.5 font-mono text-[10px]">←</kbd>
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-background px-1.5 font-mono text-[10px]">→</kbd>
              <span className="hidden sm:inline">Navigate</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
