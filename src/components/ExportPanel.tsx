import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { uniformHeader, vertexShader } from "@/shaders/index";

interface ExportPanelProps {
  effectLabel: string;
  fragmentShader: string;
  paramValues: Record<string, number>;
  duration: number;
}

export default function ExportPanel({ effectLabel, fragmentShader, paramValues, duration }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);

  const componentCode = `import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = \`${vertexShader}\`;

const fragmentShader = \`${fragmentShader}\`;

function TransitionPlane({ texCurrent, texNext, progress, direction }) {
  const ref = useRef();
  const { viewport } = useThree();
  const uniforms = useMemo(() => ({
    uTexCurrent: { value: texCurrent },
    uTexNext: { value: texNext },
    uProgress: { value: 0 },
    uDirection: { value: 1 },
    uIntensity: { value: ${paramValues.uIntensity ?? 1} },
    uScale: { value: ${paramValues.uScale ?? 1} },
    uSpeed: { value: ${paramValues.uSpeed ?? 1} },
  }), []);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.uniforms.uProgress.value = progress;
    ref.current.uniforms.uDirection.value = direction;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={ref} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
    </mesh>
  );
}

// ${effectLabel} Transition — Duration: ${duration}ms
export default function ShaderTransition({ texCurrent, texNext, progress, direction }) {
  return (
    <Canvas camera={{ position: [0, 0, 1], fov: 75 }} gl={{ antialias: false }}>
      <TransitionPlane texCurrent={texCurrent} texNext={texNext} progress={progress} direction={direction} />
    </Canvas>
  );
}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(componentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [componentCode]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">React Component</span>
        <button
          onClick={handleCopy}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground transition hover:text-foreground"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? "Copied!" : "Copy Component"}</span>
        </button>
      </div>
      <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
        {componentCode}
      </pre>
    </div>
  );
}
