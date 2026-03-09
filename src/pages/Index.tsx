import { useState, useCallback, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { IndexLayout, type SidebarTab } from "@/components/IndexLayout";
import { ThemeTransitionOverlay } from "@/components/ThemeTransitionOverlay";
import { CarouselTextureProvider } from "@/contexts/CarouselTextureContext";
import { shaderEffects } from "@/shaders/index";

type ThemeTransition = {
  active: boolean;
  /** Old theme on the overlay (hole reveals new theme underneath) */
  peelingTheme: "light" | "dark" | null;
  /** Center of theme switch button (viewport coords) – captured at click */
  origin: { x: number; y: number };
  /** Data URL of captured carousel frame (image replica for overlay) */
  capturedImage: string | null;
};

const RAPID_CLICK_MS = 200;

const Index = () => {
  const { theme, setTheme } = useTheme();
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const carouselCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastThemeClickTimeRef = useRef(0);
  const [themeTransition, setThemeTransition] = useState<ThemeTransition>({
    active: false,
    peelingTheme: null,
    origin: { x: 0, y: 0 },
    capturedImage: null,
  });
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

  const handleThemeClick = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    const now = Date.now();
    const timeSinceLastClick = now - lastThemeClickTimeRef.current;

    if (timeSinceLastClick < RAPID_CLICK_MS && timeSinceLastClick >= 0) {
      setTheme(next);
      setThemeTransition((prev) => ({ ...prev, active: false, peelingTheme: null, capturedImage: null }));
      lastThemeClickTimeRef.current = now;
      return;
    }

    lastThemeClickTimeRef.current = now;
    const rect = themeButtonRef.current?.getBoundingClientRect();
    const centerX = rect != null ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const centerY = rect != null ? rect.top + rect.height / 2 : 24;
    const capturedImage =
      carouselCanvasRef.current != null ? carouselCanvasRef.current.toDataURL("image/png") : null;
    setTheme(next);
    setThemeTransition({
      active: true,
      peelingTheme: theme === "light" ? "light" : "dark",
      origin: { x: centerX, y: centerY },
      capturedImage,
    });
  }, [theme, setTheme]);

  const handleOverlayComplete = useCallback(() => {
    setThemeTransition((prev) => ({
      ...prev,
      active: false,
      peelingTheme: null,
      capturedImage: null,
    }));
  }, []);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    carouselCanvasRef.current = canvas;
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

  const overlayCarouselOverride =
    themeTransition.capturedImage != null ? (
      <img
        src={themeTransition.capturedImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    ) : (
      <div className="absolute inset-0 bg-panel" aria-hidden />
    );

  return (
    <CarouselTextureProvider>
      {/* Bottom layer: real carousel (new theme); paused during transition */}
      <IndexLayout
        {...layoutProps}
        onCanvasReady={handleCanvasReady}
      />

      {/* Top layer: old theme with image replica of carousel; growing hole reveals new theme */}
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
              carouselOverride={overlayCarouselOverride}
            />
          </ThemeTransitionOverlay>
        )}
      </AnimatePresence>
    </CarouselTextureProvider>
  );
};

export default Index;
