export interface ShaderParam {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface ShaderEffect {
  id: string;
  label: string;
  description: string;
  fragmentShader: string;
  params: ShaderParam[];
}

const noiseLib = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
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
`;

const fbmLib = `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 6; i++) {
      val += amp * vnoise(p * freq);
      freq *= 2.0;
      amp *= 0.5;
    }
    return val;
  }
`;

export const uniformHeader = `
  uniform sampler2D uTexCurrent;
  uniform sampler2D uTexNext;
  uniform float uProgress;
  uniform float uDirection;
  uniform float uIntensity;
  uniform float uScale;
  uniform float uSpeed;
  varying vec2 vUv;
`;

export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const noiseLibSource = noiseLib;
export const fbmLibSource = fbmLib;

export const shaderEffects: ShaderEffect[] = [
  {
    id: "noise-distort",
    label: "Noise Distort",
    description: "Organic noise-driven dissolve with wave displacement",
    params: [
      { key: "uIntensity", label: "Distortion", min: 0, max: 0.1, step: 0.002, defaultValue: 0.02 },
      { key: "uScale", label: "Noise Scale", min: 1, max: 10, step: 0.5, defaultValue: 3 },
      { key: "uSpeed", label: "Wave Freq", min: 2, max: 30, step: 1, defaultValue: 10 },
    ],
    fragmentShader: `${uniformHeader}${noiseLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float noise = snoise(vUv * uScale + uDirection * 0.5) * 0.5 + 0.5;
        float distort = smoothstep(0.0, 1.0, t * 1.4 - noise * 0.4);
        vec2 uvC = vUv + vec2(sin(vUv.y * uSpeed) * uIntensity * t * uDirection, 0.0);
        vec2 uvN = vUv - vec2(sin(vUv.y * uSpeed) * uIntensity * (1.0 - t) * uDirection, 0.0);
        gl_FragColor = mix(texture2D(uTexCurrent, uvC), texture2D(uTexNext, uvN), distort);
      }`,
  },
  {
    id: "pixelation",
    label: "Pixelation",
    description: "Mosaic blocks dissolve and reform into the next image",
    params: [
      { key: "uScale", label: "Max Pixels", min: 20, max: 200, step: 5, defaultValue: 80 },
    ],
    fragmentShader: `${uniformHeader}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float pixels = mix(1.0, uScale, sin(t * 3.14159));
        vec2 pixUv = floor(vUv * pixels) / pixels;
        vec2 uv = mix(vUv, pixUv, sin(t * 3.14159));
        gl_FragColor = mix(texture2D(uTexCurrent, uv), texture2D(uTexNext, uv), t);
      }`,
  },
  {
    id: "zoom-blur",
    label: "Zoom Blur",
    description: "Radial blur rushing outward from center",
    params: [
      { key: "uIntensity", label: "Blur Strength", min: 0.02, max: 0.5, step: 0.02, defaultValue: 0.15 },
    ],
    fragmentShader: `${uniformHeader}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        vec2 center = vec2(0.5);
        vec2 dir = vUv - center;
        float strength = t * (1.0 - t) * uIntensity;
        vec4 colA = vec4(0.0);
        vec4 colB = vec4(0.0);
        const int samples = 12;
        for (int i = 0; i < samples; i++) {
          float offset = float(i) / float(samples) - 0.5;
          vec2 uv = vUv + dir * offset * strength;
          colA += texture2D(uTexCurrent, uv);
          colB += texture2D(uTexNext, uv);
        }
        colA /= float(samples);
        colB /= float(samples);
        gl_FragColor = mix(colA, colB, t);
      }`,
  },
  {
    id: "curtain-wipe",
    label: "Curtain Wipe",
    description: "Vertical strips peel away like window blinds",
    params: [
      { key: "uScale", label: "Strip Count", min: 4, max: 30, step: 1, defaultValue: 12 },
      { key: "uIntensity", label: "Stagger", min: 0.1, max: 0.8, step: 0.05, defaultValue: 0.4 },
    ],
    fragmentShader: `${uniformHeader}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float strips = uScale;
        float stripPos = fract(vUv.x * strips);
        float stripIndex = floor(vUv.x * strips);
        float delay = stripIndex / strips * uIntensity;
        float localT = clamp((t - delay) / (1.0 - delay * 0.8), 0.0, 1.0);
        float reveal = step(stripPos, localT);
        gl_FragColor = mix(texture2D(uTexCurrent, vUv), texture2D(uTexNext, vUv), reveal);
      }`,
  },
  {
    id: "glitch",
    label: "Glitch",
    description: "RGB split and scan-line distortion",
    params: [
      { key: "uIntensity", label: "RGB Split", min: 0.01, max: 0.2, step: 0.005, defaultValue: 0.06 },
      { key: "uScale", label: "Noise Freq", min: 5, max: 50, step: 1, defaultValue: 20 },
      { key: "uSpeed", label: "Scanlines", min: 200, max: 1500, step: 50, defaultValue: 800 },
    ],
    fragmentShader: `${uniformHeader}${noiseLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float intensity = sin(t * 3.14159) * uIntensity;
        float noise = snoise(vec2(vUv.y * uScale, t * 10.0));
        float shift = noise * intensity;
        vec4 colC = vec4(
          texture2D(uTexCurrent, vUv + vec2(shift, 0.0)).r,
          texture2D(uTexCurrent, vUv).g,
          texture2D(uTexCurrent, vUv - vec2(shift, 0.0)).b,
          1.0
        );
        vec4 colN = vec4(
          texture2D(uTexNext, vUv + vec2(shift, 0.0)).r,
          texture2D(uTexNext, vUv).g,
          texture2D(uTexNext, vUv - vec2(shift, 0.0)).b,
          1.0
        );
        float scanline = sin(vUv.y * uSpeed) * 0.04 * sin(t * 3.14159);
        gl_FragColor = mix(colC, colN, t) + scanline;
      }`,
  },
  {
    id: "liquid-morph",
    label: "Liquid Morph",
    description: "Fluid, water-like warping between images",
    params: [
      { key: "uIntensity", label: "Warp Amount", min: 0.02, max: 0.2, step: 0.01, defaultValue: 0.08 },
      { key: "uScale", label: "Frequency", min: 2, max: 10, step: 0.5, defaultValue: 4 },
    ],
    fragmentShader: `${uniformHeader}${noiseLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float n1 = snoise(vUv * uScale + t * 2.0) * uIntensity;
        float n2 = snoise(vUv * (uScale * 1.5) - t * 3.0) * (uIntensity * 0.75);
        vec2 warp = vec2(n1, n2) * sin(t * 3.14159);
        vec2 uvC = vUv + warp;
        vec2 uvN = vUv - warp * 0.5;
        float mask = snoise(vUv * 3.0 + t) * 0.5 + 0.5;
        float reveal = smoothstep(0.0, 1.0, t * 1.5 - mask * 0.5);
        gl_FragColor = mix(texture2D(uTexCurrent, uvC), texture2D(uTexNext, uvN), reveal);
      }`,
  },
  {
    id: "burn-dissolve",
    label: "Burn Dissolve",
    description: "Edges burn away with a glowing ember line",
    params: [
      { key: "uScale", label: "Noise Scale", min: 2, max: 12, step: 0.5, defaultValue: 5 },
      { key: "uIntensity", label: "Ember Glow", min: 0.5, max: 5, step: 0.25, defaultValue: 3 },
    ],
    fragmentShader: `${uniformHeader}${noiseLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float noise = snoise(vUv * uScale) * 0.5 + 0.5;
        float edge = smoothstep(t - 0.08, t, noise) - smoothstep(t, t + 0.02, noise);
        float reveal = step(noise, t);
        vec3 ember = vec3(1.5, 0.5, 0.1) * edge * uIntensity;
        vec4 colC = texture2D(uTexCurrent, vUv);
        vec4 colN = texture2D(uTexNext, vUv);
        vec4 result = mix(colC, colN, reveal);
        result.rgb += ember;
        gl_FragColor = result;
      }`,
  },
  {
    id: "smoke",
    label: "Smoke",
    description: "Turbulent smoke billows and reveals the next image",
    params: [
      { key: "uIntensity", label: "Smoke Density", min: 0.04, max: 0.3, step: 0.02, defaultValue: 0.12 },
      { key: "uScale", label: "Turbulence", min: 1, max: 8, step: 0.5, defaultValue: 3 },
      { key: "uSpeed", label: "Speed", min: 1, max: 10, step: 0.5, defaultValue: 4 },
    ],
    fragmentShader: `${uniformHeader}${fbmLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        vec2 uv = vUv;
        float time = t * uSpeed;
        vec2 q = vec2(fbm(uv * uScale + vec2(0.0, time * 0.3)),
                      fbm(uv * uScale + vec2(5.2, time * 0.4)));
        vec2 r = vec2(fbm(uv * uScale + 4.0 * q + vec2(1.7, time * 0.2)),
                      fbm(uv * uScale + 4.0 * q + vec2(8.3, time * 0.5)));
        float f = fbm(uv * uScale + 2.0 * r);
        float smokeIntensity = sin(t * 3.14159) * uIntensity;
        vec2 smokeOffset = vec2(q.x * r.y, q.y * r.x) * smokeIntensity;
        vec2 uvC = vUv + smokeOffset;
        vec2 uvN = vUv - smokeOffset * 0.6;
        float smokeMask = f * 0.6 + 0.2;
        float reveal = smoothstep(smokeMask - 0.15, smokeMask + 0.15, t * 1.3);
        float edge = smoothstep(t - 0.12, t - 0.02, smokeMask) - smoothstep(t + 0.02, t + 0.12, smokeMask);
        vec3 smokeColor = vec3(0.85, 0.85, 0.9) * edge * sin(t * 3.14159) * 1.5;
        vec4 result = mix(texture2D(uTexCurrent, uvC), texture2D(uTexNext, uvN), reveal);
        result.rgb += smokeColor;
        gl_FragColor = result;
      }`,
  },
  {
    id: "liquid-portal",
    label: "Liquid Portal",
    description: "A swirling vortex portal warps space between images",
    params: [
      { key: "uIntensity", label: "Swirl Force", min: 1, max: 12, step: 0.5, defaultValue: 6 },
      { key: "uScale", label: "Warp Detail", min: 2, max: 10, step: 0.5, defaultValue: 5 },
      { key: "uSpeed", label: "Speed", min: 1, max: 8, step: 0.5, defaultValue: 3 },
    ],
    fragmentShader: `${uniformHeader}${fbmLib}${noiseLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        vec2 center = vec2(0.5);
        vec2 uv = vUv;
        vec2 delta = uv - center;
        float dist = length(delta);
        float angle = atan(delta.y, delta.x);
        float portalRadius = t * 1.2;
        float portalEdge = 0.08;
        float swirl = sin(t * 3.14159) * uIntensity * (1.0 - dist);
        float swirlAngle = angle + swirl * smoothstep(portalRadius + 0.2, 0.0, dist);
        vec2 swirlUv = center + vec2(cos(swirlAngle), sin(swirlAngle)) * dist;
        float time = t * uSpeed;
        float n1 = fbm(swirlUv * uScale + time);
        float n2 = fbm(swirlUv * (uScale * 1.4) - time * 1.3 + 3.7);
        vec2 liquidWarp = vec2(n1 - 0.5, n2 - 0.5) * 0.08 * sin(t * 3.14159);
        vec2 uvC = swirlUv + liquidWarp;
        vec2 uvN = swirlUv - liquidWarp * 0.5;
        float noisyEdge = snoise(vec2(angle * 3.0, dist * 8.0 + time)) * 0.06;
        float portalMask = smoothstep(portalRadius + portalEdge + noisyEdge, portalRadius - portalEdge + noisyEdge, dist);
        float ring = smoothstep(portalRadius - portalEdge * 3.0, portalRadius, dist)
                   * smoothstep(portalRadius + portalEdge * 3.0, portalRadius, dist);
        float ringPulse = ring * (1.0 + 0.5 * sin(angle * 8.0 + time * 5.0));
        vec3 portalGlow = mix(
          vec3(0.2, 0.5, 1.0),
          vec3(0.6, 0.2, 1.0),
          0.5 + 0.5 * sin(angle * 2.0 + time * 2.0)
        ) * ringPulse * 2.5 * sin(t * 3.14159);
        vec4 colC = texture2D(uTexCurrent, uvC);
        vec4 colN = texture2D(uTexNext, uvN);
        vec4 result = mix(colC, colN, portalMask);
        result.rgb += portalGlow;
        gl_FragColor = result;
      }`,
  },
];
