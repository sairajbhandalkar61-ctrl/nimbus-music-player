import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { usePlayerStore } from '../store/usePlayerStore';
import { audioEngine } from '../audio/audioEngine';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  uniform float u_valence;
  uniform float u_energy;
  uniform float u_bass;
  uniform float u_mid;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);

    // Gentle pulse with real-time bass & mid shimmer
    float bassScale = 1.0 + (u_bass * 0.16);
    vec2 p = uv * (1.55 / bassScale);

    float speed = 0.18 + (u_energy * 0.42);
    float t = u_time * speed;

    float n1 = snoise(p + vec2(t * 0.12, t * 0.08));
    float n2 = snoise(p * 1.85 - vec2(n1 * 0.65, t * 0.14 + u_mid * 0.25));
    float fluid = n1 * 0.58 + n2 * 0.42;

    // Obsidian base (#08080a) with crimson-rose (#fa405e) to violet (#8b5cf6) aurora palette
    vec3 colDark = vec3(0.031, 0.031, 0.039);

    vec3 coolA = vec3(0.09, 0.07, 0.28);   // Deep midnight indigo
    vec3 coolB = vec3(0.32, 0.16, 0.60);   // Violet (#8b5cf6 range)
    vec3 coolC = vec3(0.10, 0.30, 0.45);   // Teal shimmer

    vec3 warmA = vec3(0.56, 0.09, 0.22);   // Crimson-rose (#fa405e range)
    vec3 warmB = vec3(0.45, 0.18, 0.58);   // Violet-magenta
    vec3 warmC = vec3(0.70, 0.16, 0.32);   // Rose highlight

    vec3 cA = mix(coolA, warmA, u_valence);
    vec3 cB = mix(coolB, warmB, u_valence);
    vec3 cC = mix(coolC, warmC, u_valence);

    vec3 color = colDark;
    color = mix(color, cA, smoothstep(-0.55, 0.6, fluid) * (0.75 + u_energy * 0.25));
    color = mix(color, cB, smoothstep(0.05, 0.85, n2) * (0.65 + u_mid * 0.45));
    color = mix(color, cC, smoothstep(0.25, 0.92, fluid) * (0.45 + u_bass * 0.55));

    // Soft radial vignette
    float dist = length(uv);
    color *= smoothstep(1.65, 0.28, dist);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const FluidShader: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const activeView = usePlayerStore((s) => s.activeView);
  const activeViewRef = useRef(activeView);

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  const targets = useRef({
    valence: 0.5,
    energy: 0.5,
    bass: 0.0,
    mid: 0.0,
  });

  const currents = useRef({
    valence: 0.5,
    energy: 0.5,
    bass: 0.0,
    mid: 0.0,
  });

  useEffect(() => {
    if (currentTrack) {
      targets.current.valence = currentTrack.valence ?? 0.5;
      targets.current.energy = currentTrack.energy ?? 0.5;
    }
  }, [currentTrack]);

  useEffect(() => {
    const unsub = audioEngine.subscribeFrequency((data) => {
      targets.current.bass = isPlaying ? data.bass : 0.0;
      targets.current.mid = isPlaying ? data.mid : 0.0;
    });
    return unsub;
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
    container.appendChild(renderer.domElement);

    const uniforms = {
      u_time: { value: 0.0 },
      u_valence: { value: 0.5 },
      u_energy: { value: 0.5 },
      u_bass: { value: 0.0 },
      u_mid: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let lastTime = performance.now();
    let animationId: number;
    let frameCount = 0;

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.u_resolution.value.set(w, h);
    };

    window.addEventListener('resize', handleResize);

    const animate = (now: number) => {
      animationId = requestAnimationFrame(animate);
      if (document.hidden) return;

      frameCount++;
      if ((activeViewRef.current === 'gallery' || activeViewRef.current === 'library') && frameCount % 2 !== 0) {
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const dampValence = 1 - Math.exp(-3.5 * dt);
      const dampEnergy = 1 - Math.exp(-3.5 * dt);
      const dampFreq = 1 - Math.exp(-12.0 * dt);

      currents.current.valence += (targets.current.valence - currents.current.valence) * dampValence;
      currents.current.energy += (targets.current.energy - currents.current.energy) * dampEnergy;
      currents.current.bass += (targets.current.bass - currents.current.bass) * dampFreq;
      currents.current.mid += (targets.current.mid - currents.current.mid) * dampFreq;

      uniforms.u_time.value += dt;
      uniforms.u_valence.value = currents.current.valence;
      uniforms.u_energy.value = currents.current.energy;
      uniforms.u_bass.value = currents.current.bass;
      uniforms.u_mid.value = currents.current.mid;

      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
    />
  );
};
