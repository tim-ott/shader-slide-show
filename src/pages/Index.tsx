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

          {/* Active effect info */}
          <div className="mt-6 rounded-xl bg-secondary p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Effect</p>
            <p className="mt-1 text-sm font-medium text-foreground">{active.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{active.description}</p>
          </div>

          {/* Keyboard hint */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-secondary px-1.5 font-mono text-[10px]">←</kbd>
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-secondary px-1.5 font-mono text-[10px]">→</kbd>
            <span>Navigate slides</span>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex flex-1 items-center justify-center p-4 md:p-8">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border shadow-lg">
            <ShaderCarousel activeEffect={activeEffect} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
