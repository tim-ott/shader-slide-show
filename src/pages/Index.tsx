import { useState } from "react";
import ShaderCarousel from "@/components/ShaderCarousel";
import { shaderEffects } from "@/shaders/index";

const Index = () => {
  const [activeEffect, setActiveEffect] = useState(shaderEffects[0].id);
  const active = shaderEffects.find((e) => e.id === activeEffect)!;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-10">
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

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-4 md:px-10">
        {/* Hero text */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Explore shader transitions.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-lg text-muted-foreground">
            Select an effect below and watch it come to life. Use arrows or auto-play to cycle through images.
          </p>
        </div>

        {/* Effect pills */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {shaderEffects.map((effect) => (
            <button
              key={effect.id}
              onClick={() => setActiveEffect(effect.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeEffect === effect.id
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              {effect.label}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <div className="relative mx-auto aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border shadow-lg">
          <ShaderCarousel activeEffect={activeEffect} />
        </div>

        {/* Effect info */}
        <div className="mx-auto mt-6 max-w-md text-center">
          <p className="text-sm font-medium text-foreground">{active.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>
        </div>

        {/* Keyboard hint */}
        <div className="mt-10 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-secondary px-1.5 font-mono text-[10px]">←</kbd>
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-secondary px-1.5 font-mono text-[10px]">→</kbd>
            Navigate slides
          </span>
        </div>
      </div>
    </div>
  );
};

export default Index;
