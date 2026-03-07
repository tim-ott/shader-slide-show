import { useState, useCallback, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { IndexLayout, type SidebarTab } from "@/components/IndexLayout";
import { ThemeTransitionOverlay } from "@/components/ThemeTransitionOverlay";
import type { CarouselSnapshot } from "@/components/ShaderCarousel";
import { shaderEffects } from "@/shaders/index";

const INITIAL_CAROUSEL_SNAPSHOT: CarouselSnapshot = {
  current: 0,
  next: 0,
  progress: 0,
  direction: 1,
  isTransitioning: false,
};

type ThemeTransition = {
  active: boolean;
  /** Old theme on the overlay (hole reveals new theme underneath) */
  peelingTheme: "light" | "dark" | null;
  /** Center of theme switch button (viewport coords) – captured at click */
  origin: { x: number; y: number };
};

const Index = () => {
  const { theme, setTheme } = useTheme();
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const [themeTransition, setThemeTransition] = useState<ThemeTransition>({
    active: false,
    peelingTheme: null,
    origin: { x: 0, y: 0 },
  });
  const [activeEffect, setActiveEffect] = useState(shaderEffects[0].id);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("controls");
  const [duration, setDuration] = useState(1200);
  const [paramValues, setParamValues] = useState<Record<string, Record<string, number>>>({});
  const [customCode, setCustomCode] = useState<Record<string, string>>({});
  const [shaderError, setShaderError] = useState<string | null>(null);
  const [carouselSnapshot, setCarouselSnapshot] = useState<CarouselSnapshot>(INITIAL_CAROUSEL_SNAPSHOT);

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

  const handleThemeClick = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    const rect = themeButtonRef.current?.getBoundingClientRect();
    const centerX = rect != null ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const centerY = rect != null ? rect.top + rect.height / 2 : 24;
    setTheme(next);
    setThemeTransition({
      active: true,
      peelingTheme: theme ?? "dark",
      origin: { x: centerX, y: centerY },
    });
  }, [theme, setTheme]);

  const handleOverlayComplete = useCallback(() => {
    setThemeTransition((prev) => ({
      ...prev,
      active: false,
      peelingTheme: null,
    }));
  }, []);

  const layoutProps = {
    theme: theme ?? "dark",
    themeButtonRef,
    onThemeClick: handleThemeClick,
    activeEffect,
    onEffectChange: handleEffectChange,
    sidebarTab,
    onSidebarTabChange: setSidebarTab,
    active,
    duration,
    onDurationChange: setDuration,
    currentParams,
    onParamChange: handleParamChange,
    onResetParams: handleResetParams,
    currentCode,
    onCodeChange: handleCodeChange,
    onCodeReset: handleCodeReset,
    shaderError,
    uniformValues,
    pauseCarousel: themeTransition.active,
  };

  return (
    <>
      {/* Bottom layer: real page (theme already new from click); paused so frame matches overlay */}
      <IndexLayout
        {...layoutProps}
        onCarouselStateChange={setCarouselSnapshot}
      />

      {/* Top layer: old theme; growing hole in mask reveals new theme underneath */}
      <AnimatePresence>
        {themeTransition.active && themeTransition.peelingTheme && (
          <ThemeTransitionOverlay
            key="theme-reveal"
            origin={themeTransition.origin}
            peelingTheme={themeTransition.peelingTheme}
            onComplete={handleOverlayComplete}
          >
            <IndexLayout
              {...layoutProps}
              themeButtonRef={undefined}
              carouselSnapshot={carouselSnapshot}
            />
          </ThemeTransitionOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default Index;
