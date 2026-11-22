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
  uniform vec2 u_resolution;
  varying vec2 vUv;

  // Simplex 2D noise helpers
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
    
    // Scale and pulse with real-time bass
    float bassScale = 1.0 + (u_bass * 0.18);
    vec2 p = uv * (1.6 / bassScale);

    // Turbulence driven by energy
    float speed = 0.25 + (u_energy * 0.6);
    float t = u_time * speed;

    float n1 = snoise(p + vec2(t * 0.15, t * 0.1));
    float n2 = snoise(p * 2.1 - vec2(n1 * 0.8, t * 0.2));
    float n3 = snoise(p * 3.8 + vec2(n2 * 0.6, n1 * 0.5));

    float fluid = n1 * 0.5 + n2 * 0.35 + n3 * 0.15;

    // Palette shifts with valence
    // Low valence (0.0): Melancholic deep indigo, slate navy, midnight cyan
    // High valence (1.0): Warm golden sunset, magenta-crimson, amber radiance
    vec3 colDark = vec3(0.03, 0.03, 0.05);

    vec3 coolA = vec3(0.05, 0.15, 0.32);
    vec3 coolB = vec3(0.18, 0.06, 0.38);
    vec3 coolC = vec3(0.02, 0.45, 0.55);

    vec3 warmA = vec3(0.58, 0.08, 0.22); // Crimson
    vec3 warmB = vec3(0.55, 0.28, 0.08); // Amber
    vec3 warmC = vec3(0.68, 0.12, 0.42); // Magenta

    vec3 cA = mix(coolA, warmA, u_valence);
    vec3 cB = mix(coolB, warmB, u_valence);
    vec3 cC = mix(coolC, warmC, u_valence);

    vec3 color = colDark;
    color = mix(color, cA, smoothstep(-0.6, 0.6, fluid));
    color = mix(color, cB, smoothstep(0.0, 0.8, n2));
    color = mix(color, cC, smoothstep(0.3, 0.9, n3) * (0.6 + u_bass * 0.5));

    // Subtle vignette
    float dist = length(uv);
    color *= smoothstep(1.6, 0.3, dist);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const FluidShader: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  // Smooth target variables for 120Hz dampening
  const targets = useRef({
    valence: 0.5,
    energy: 0.5,
    bass: 0.0,
  });

  const currents = useRef({
    valence: 0.5,
    energy: 0.5,
    bass: 0.0,
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

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    container.appendChild(renderer.domElement);

    const uniforms = {
      u_time: { value: 0.0 },
      u_valence: { value: 0.5 },
      u_energy: { value: 0.5 },
      u_bass: { value: 0.0 },
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

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.u_resolution.value.set(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Delta-time exponential damping loop for 120Hz monitors
    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Exponential damping factor: 1 - exp(-lambda * dt)
      const dampValence = 1 - Math.exp(-3.5 * dt);
      const dampEnergy = 1 - Math.exp(-3.5 * dt);
      const dampBass = 1 - Math.exp(-12.0 * dt);

      currents.current.valence += (targets.current.valence - currents.current.valence) * dampValence;
      currents.current.energy += (targets.current.energy - currents.current.energy) * dampEnergy;
      currents.current.bass += (targets.current.bass - currents.current.bass) * dampBass;

      uniforms.u_time.value += dt;
      uniforms.u_valence.value = currents.current.valence;
      uniforms.u_energy.value = currents.current.energy;
      uniforms.u_bass.value = currents.current.bass;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
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
