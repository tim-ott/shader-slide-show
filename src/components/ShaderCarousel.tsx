import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import slide1 from "@/assets/slide-1.jpg";
import slide2 from "@/assets/slide-2.jpg";
import slide3 from "@/assets/slide-3.jpg";
import slide4 from "@/assets/slide-4.jpg";

const slideSources = [slide1, slide2, slide3, slide4];
const slideLabels = ["Ocean", "Mountains", "Forest", "Desert"];

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexCurrent;
  uniform sampler2D uTexNext;
  uniform float uProgress;
  uniform float uDirection;
  varying vec2 vUv;

  // Simplex-ish noise for organic distortion
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    float p = uProgress;
    // Smooth easing
    float t = p * p * (3.0 - 2.0 * p);

    // Noise-based distortion
    float noise = snoise(vUv * 3.0 + uDirection * 0.5) * 0.5 + 0.5;
    float distort = smoothstep(0.0, 1.0, t * 1.4 - noise * 0.4);

    // Slight wave displacement
    vec2 uvCurrent = vUv + vec2(sin(vUv.y * 10.0) * 0.02 * t * uDirection, 0.0);
    vec2 uvNext = vUv - vec2(sin(vUv.y * 10.0) * 0.02 * (1.0 - t) * uDirection, 0.0);

    vec4 texCurrent = texture2D(uTexCurrent, uvCurrent);
    vec4 texNext = texture2D(uTexNext, uvNext);

    gl_FragColor = mix(texCurrent, texNext, distort);
  }
`;

interface TransitionPlaneProps {
  textures: THREE.Texture[];
  currentIndex: number;
  nextIndex: number;
  progress: number;
  direction: number;
}

function TransitionPlane({ textures, currentIndex, nextIndex, progress, direction }: TransitionPlaneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTexCurrent: { value: textures[0] },
      uTexNext: { value: textures[1] },
      uProgress: { value: 0 },
      uDirection: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTexCurrent.value = textures[currentIndex];
    materialRef.current.uniforms.uTexNext.value = textures[nextIndex];
    materialRef.current.uniforms.uProgress.value = progress;
    materialRef.current.uniforms.uDirection.value = direction;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function ShaderCarousel() {
  const [textures, setTextures] = useState<THREE.Texture[]>([]);
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(0);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const animRef = useRef<number>(0);
  const autoRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    Promise.all(slideSources.map((src) => loader.loadAsync(src))).then(setTextures);
  }, []);

  const goTo = useCallback(
    (idx: number, dir: number) => {
      if (isTransitioning || textures.length === 0) return;
      setIsTransitioning(true);
      setNext(idx);
      setDirection(dir);
      const start = performance.now();
      const duration = 1200;
      const animate = (now: number) => {
        const elapsed = now - start;
        const p = Math.min(elapsed / duration, 1);
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

  // Auto-advance
  useEffect(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    autoRef.current = setTimeout(goNext, 4000);
    return () => clearTimeout(autoRef.current);
  }, [current, isTransitioning, goNext]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  if (textures.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  const displayIndex = isTransitioning ? next : current;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{ antialias: false }}
      >
        <TransitionPlane
          textures={textures}
          currentIndex={current}
          nextIndex={next}
          progress={progress}
          direction={direction}
        />
      </Canvas>

      {/* Overlay gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />

      {/* Label */}
      <div className="absolute bottom-24 left-8 z-10 md:left-16">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-foreground/60">
          {String(displayIndex + 1).padStart(2, "0")} / {String(slideSources.length).padStart(2, "0")}
        </p>
        <h2 className="mt-2 font-serif text-5xl font-light tracking-tight text-foreground md:text-7xl">
          {slideLabels[displayIndex]}
        </h2>
      </div>

      {/* Nav dots */}
      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 gap-3">
        {slideSources.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 1 : -1)}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === displayIndex
                ? "w-8 bg-foreground"
                : "w-2 bg-foreground/30 hover:bg-foreground/60"
            }`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-foreground/20 p-3 text-foreground/60 backdrop-blur-sm transition hover:border-foreground/40 hover:text-foreground md:left-8"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-foreground/20 p-3 text-foreground/60 backdrop-blur-sm transition hover:border-foreground/40 hover:text-foreground md:right-8"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
