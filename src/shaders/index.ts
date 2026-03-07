export interface ShaderEffect {
  id: string;
  label: string;
  description: string;
  fragmentShader: string;
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
const uniformHeader = `
  uniform sampler2D uTexCurrent;
  uniform sampler2D uTexNext;
  uniform float uProgress;
  uniform float uDirection;
  varying vec2 vUv;
`;

export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const shaderEffects: ShaderEffect[] = [
  {
    id: "noise-distort",
    label: "Noise Distort",
    description: "Organic noise-driven dissolve with wave displacement",
    fragmentShader: `${uniformHeader}${noiseLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float noise = snoise(vUv * 3.0 + uDirection * 0.5) * 0.5 + 0.5;
        float distort = smoothstep(0.0, 1.0, t * 1.4 - noise * 0.4);
        vec2 uvC = vUv + vec2(sin(vUv.y * 10.0) * 0.02 * t * uDirection, 0.0);
        vec2 uvN = vUv - vec2(sin(vUv.y * 10.0) * 0.02 * (1.0 - t) * uDirection, 0.0);
        gl_FragColor = mix(texture2D(uTexCurrent, uvC), texture2D(uTexNext, uvN), distort);
      }`,
  },
  {
    id: "pixelation",
    label: "Pixelation",
    description: "Mosaic blocks dissolve and reform into the next image",
    fragmentShader: `${uniformHeader}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float pixels = mix(1.0, 80.0, sin(t * 3.14159));
        vec2 pixUv = floor(vUv * pixels) / pixels;
        vec2 uv = mix(vUv, pixUv, sin(t * 3.14159));
        gl_FragColor = mix(texture2D(uTexCurrent, uv), texture2D(uTexNext, uv), t);
      }`,
  },
  {
    id: "zoom-blur",
    label: "Zoom Blur",
    description: "Radial blur rushing outward from center",
    fragmentShader: `${uniformHeader}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        vec2 center = vec2(0.5);
        vec2 dir = vUv - center;
        float strength = t * (1.0 - t) * 0.15;
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
    fragmentShader: `${uniformHeader}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float strips = 12.0;
        float stripPos = fract(vUv.x * strips);
        float stripIndex = floor(vUv.x * strips);
        float delay = stripIndex / strips * 0.4;
        float localT = clamp((t - delay) / (1.0 - delay * 0.8), 0.0, 1.0);
        float reveal = step(stripPos, localT);
        gl_FragColor = mix(texture2D(uTexCurrent, vUv), texture2D(uTexNext, vUv), reveal);
      }`,
  },
  {
    id: "glitch",
    label: "Glitch",
    description: "RGB split and scan-line distortion",
    fragmentShader: `${uniformHeader}${noiseLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float intensity = sin(t * 3.14159) * 0.06;
        float noise = snoise(vec2(vUv.y * 20.0, t * 10.0));
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
        float scanline = sin(vUv.y * 800.0) * 0.04 * sin(t * 3.14159);
        gl_FragColor = mix(colC, colN, t) + scanline;
      }`,
  },
  {
    id: "liquid-morph",
    label: "Liquid Morph",
    description: "Fluid, water-like warping between images",
    fragmentShader: `${uniformHeader}${noiseLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float n1 = snoise(vUv * 4.0 + t * 2.0) * 0.08;
        float n2 = snoise(vUv * 6.0 - t * 3.0) * 0.06;
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
    fragmentShader: `${uniformHeader}${noiseLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        float noise = snoise(vUv * 5.0) * 0.5 + 0.5;
        float edge = smoothstep(t - 0.08, t, noise) - smoothstep(t, t + 0.02, noise);
        float reveal = step(noise, t);
        vec3 ember = vec3(1.5, 0.5, 0.1) * edge * 3.0;
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
    fragmentShader: `${uniformHeader}${fbmLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        
        // Multi-layered turbulent smoke
        vec2 uv = vUv;
        float time = t * 4.0;
        
        // Domain warping for realistic smoke turbulence
        vec2 q = vec2(fbm(uv * 3.0 + vec2(0.0, time * 0.3)),
                      fbm(uv * 3.0 + vec2(5.2, time * 0.4)));
        vec2 r = vec2(fbm(uv * 3.0 + 4.0 * q + vec2(1.7, time * 0.2)),
                      fbm(uv * 3.0 + 4.0 * q + vec2(8.3, time * 0.5)));
        float f = fbm(uv * 3.0 + 2.0 * r);
        
        // Smoke distortion on UVs
        float smokeIntensity = sin(t * 3.14159) * 0.12;
        vec2 smokeOffset = vec2(q.x * r.y, q.y * r.x) * smokeIntensity;
        vec2 uvC = vUv + smokeOffset;
        vec2 uvN = vUv - smokeOffset * 0.6;
        
        // Smoke-shaped reveal mask
        float smokeMask = f * 0.6 + 0.2;
        float reveal = smoothstep(smokeMask - 0.15, smokeMask + 0.15, t * 1.3);
        
        // Wispy smoke edge glow
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
    fragmentShader: `${uniformHeader}${fbmLib}${noiseLib}
      void main() {
        float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        vec2 center = vec2(0.5);
        vec2 uv = vUv;
        vec2 delta = uv - center;
        float dist = length(delta);
        float angle = atan(delta.y, delta.x);
        
        // Expanding portal radius
        float portalRadius = t * 1.2;
        float portalEdge = 0.08;
        
        // Swirling vortex rotation — increases near center
        float swirl = sin(t * 3.14159) * 6.0 * (1.0 - dist);
        float swirlAngle = angle + swirl * smoothstep(portalRadius + 0.2, 0.0, dist);
        vec2 swirlUv = center + vec2(cos(swirlAngle), sin(swirlAngle)) * dist;
        
        // Liquid distortion via FBM
        float time = t * 3.0;
        float n1 = fbm(swirlUv * 5.0 + time);
        float n2 = fbm(swirlUv * 7.0 - time * 1.3 + 3.7);
        vec2 liquidWarp = vec2(n1 - 0.5, n2 - 0.5) * 0.08 * sin(t * 3.14159);
        
        vec2 uvC = swirlUv + liquidWarp;
        vec2 uvN = swirlUv - liquidWarp * 0.5;
        
        // Portal mask — circular reveal with noisy edges
        float noisyEdge = snoise(vec2(angle * 3.0, dist * 8.0 + time)) * 0.06;
        float portalMask = smoothstep(portalRadius + portalEdge + noisyEdge, portalRadius - portalEdge + noisyEdge, dist);
        
        // Glowing ring at portal edge
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
