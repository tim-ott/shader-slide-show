import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface ThemeTransitionOverlayProps {
  /** Center of the theme switch button (viewport coordinates) – hole grows from here */
  origin: { x: number; y: number };
  /** Old theme to cover the page; hole reveals new theme (already applied underneath) */
  peelingTheme: "light" | "dark";
  onComplete: () => void;
  children: React.ReactNode;
}

const DURATION = 0.6;
const EASE = [0.7, 0, 0.3, 1] as const;

export function ThemeTransitionOverlay({
  origin,
  peelingTheme,
  onComplete,
  children,
}: ThemeTransitionOverlayProps) {
  const radius =
    typeof window !== "undefined"
      ? Math.hypot(window.innerWidth, window.innerHeight) * 1.15
      : 2000;

  const r = useMotionValue(0);
  const maskImage = useTransform(
    r,
    (v) =>
      `radial-gradient(circle at ${origin.x}px ${origin.y}px, transparent 0, transparent ${v}px, black ${v}px)`
  );

  useEffect(() => {
    const controls = animate(r, radius, {
      duration: DURATION,
      ease: EASE,
      onComplete: () => {
        onComplete();
      },
    });
    return () => controls.stop();
  }, [radius, onComplete, r]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ isolation: "isolate" }}
      aria-hidden
    >
      <motion.div
        className="h-full w-full will-change-[mask-image]"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          maskSize: "100% 100%",
          maskPosition: "0 0",
        }}
      >
        <div
          className={peelingTheme === "dark" ? "dark h-full w-full" : "theme-light h-full w-full"}
          style={{ minHeight: "100vh", minWidth: "100vw" }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
