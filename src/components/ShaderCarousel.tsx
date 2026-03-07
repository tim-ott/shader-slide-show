import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader, shaderEffects } from "@/shaders/index";
import slide1 from "@/assets/slide-1.jpg";
import slide2 from "@/assets/slide-2.jpg";
import slide3 from "@/assets/slide-3.jpg";
import slide4 from "@/assets/slide-4.jpg";

const slideSources = [slide1, slide2, slide3, slide4];

interface TransitionPlaneProps {
  textures: THREE.Texture[];
  currentIndex: number;
  nextIndex: number;
  progress: number;
  direction: number;
  fragmentShader: string;
  customUniforms: Record<string, number>;
}

function TransitionPlane({ textures, currentIndex, nextIndex, progress, direction, fragmentShader, customUniforms }: TransitionPlaneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTexCurrent: { value: textures[0] },
      uTexNext: { value: textures[1] },
      uProgress: { value: 0 },
      uDirection: { value: 1 },
      uIntensity: { value: 1.0 },
      uScale: { value: 1.0 },
      uSpeed: { value: 1.0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uTexCurrent.value = textures[currentIndex];
    u.uTexNext.value = textures[nextIndex];
    u.uProgress.value = progress;
    u.uDirection.value = direction;
    if (u.uIntensity) u.uIntensity.value = customUniforms.uIntensity ?? 1;
    if (u.uScale) u.uScale.value = customUniforms.uScale ?? 1;
    if (u.uSpeed) u.uSpeed.value = customUniforms.uSpeed ?? 1;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        key={fragmentShader}
      />
    </mesh>
  );
}

export type CarouselSnapshot = {
  current: number;
  next: number;
  progress: number;
  direction: number;
  isTransitioning: boolean;
};

interface ShaderCanvasProps {
  activeEffect: string;
  customUniforms?: Record<string, number>;
  overrideShader?: string | null;
  duration?: number;
  /** When true, freeze carousel (no auto-advance, no progress update) so theme transition layers stay in sync */
  pause?: boolean;
  /** When set, render only this frame (no animation/auto-advance). Used for overlay to match main. */
  snapshot?: CarouselSnapshot | null;
  /** Report state so parent can sync overlay */
  onStateChange?: (state: CarouselSnapshot) => void;
}

export default function ShaderCarousel({ activeEffect, customUniforms = {}, overrideShader, duration = 1200, pause = false, snapshot = null, onStateChange }: ShaderCanvasProps) {
  const [textures, setTextures] = useState<THREE.Texture[]>([]);
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(0);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const animRef = useRef<number>(0);
  const autoRef = useRef<ReturnType<typeof setTimeout>>();
  const durationRef = useRef(duration);
  const pauseRef = useRef(pause);
  durationRef.current = duration;
  pauseRef.current = pause;

  const isStatic = snapshot != null;
  const displayCurrent = isStatic ? snapshot.current : current;
  const displayNext = isStatic ? snapshot.next : next;
  const displayProgress = isStatic ? snapshot.progress : progress;
  const displayDirection = isStatic ? snapshot.direction : direction;
  const displayTransitioning = isStatic ? snapshot.isTransitioning : isTransitioning;

  const effect = shaderEffects.find((e) => e.id === activeEffect) || shaderEffects[0];
  const fragmentShader = overrideShader || effect.fragmentShader;

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    Promise.all(slideSources.map((src) => loader.loadAsync(src))).then(setTextures);
  }, []);

  useEffect(() => {
    if (!onStateChange || isStatic) return;
    onStateChange({ current, next, progress, direction, isTransitioning });
  }, [onStateChange, isStatic, current, next, progress, direction, isTransitioning]);

  const goTo = useCallback(
    (idx: number, dir: number) => {
      if (isStatic || isTransitioning || textures.length === 0 || pauseRef.current) return;
      setIsTransitioning(true);
      setNext(idx);
      setDirection(dir);
      const start = performance.now();
      const animate = (now: number) => {
        if (pauseRef.current) {
          animRef.current = requestAnimationFrame(animate);
          return;
        }
        const elapsed = now - start;
        const p = Math.min(elapsed / durationRef.current, 1);
        setProgress(p);
        if (p < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          setCurrent(idx);
          setNext(idx);
          setProgress(0);
          setIsTransitioning(false);
        }
      };
      animRef.current = requestAnimationFrame(animate);
    },
    [isTransitioning, textures.length]
  );

  const goNext = useCallback(() => {
    goTo((current + 1) % slideSources.length, 1);
  }, [current, goTo]);

  const goPrev = useCallback(() => {
    goTo((current - 1 + slideSources.length) % slideSources.length, -1);
  }, [current, goTo]);

  useEffect(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    if (pause || isStatic) return;
    autoRef.current = setTimeout(goNext, 5000);
    return () => clearTimeout(autoRef.current);
  }, [pause, isStatic, current, isTransitioning, goNext]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (pause || isStatic) return;
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pause, isStatic, goNext, goPrev]);

  if (textures.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  const displayIndex = displayTransitioning ? displayNext : displayCurrent;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-foreground/5">
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{ antialias: false }}
      >
        <TransitionPlane
          textures={textures}
          currentIndex={displayCurrent}
          nextIndex={displayNext}
          progress={displayProgress}
          direction={displayDirection}
          fragmentShader={fragmentShader}
          customUniforms={customUniforms}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slideSources.map((_, i) => (
          <button
            key={i}
            onClick={() => !isStatic && goTo(i, i > displayCurrent ? 1 : -1)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === displayIndex
                ? "w-6 bg-white"
                : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => !isStatic && goPrev()}
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={() => !isStatic && goNext()}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
