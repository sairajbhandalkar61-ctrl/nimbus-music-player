import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { usePlayerStore } from '../store/usePlayerStore';

interface RadialVisualizerProps {
  radius: number;
}

export const RadialVisualizer: React.FC<RadialVisualizerProps> = ({ radius }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const smoothedBars = useRef<Float32Array>(new Float32Array(64));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const numBars = 64;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = (radius * 2 + 160);

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.scale(dpr, dpr);

    let lastTime = performance.now();
    let animId: number;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const baseRadius = radius + 6;

      const damp = 1 - Math.exp(-18.0 * dt);

      for (let i = 0; i < numBars; i++) {
        // Draw radial bar
        const angle = (i / numBars) * Math.PI * 2 - Math.PI / 2;
        const barHeight = smoothedBars.current[i];

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

        // Dynamic color based on angle and track energy
        const hue = (i / numBars) * 60 + (currentTrack?.valence ? currentTrack.valence * 280 : 330);
        ctx.strokeStyle = isPlaying
          ? `hsla(${hue}, 85%, 65%, ${0.35 + (barHeight / 50) * 0.65})`
          : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    const unsub = audioEngine.subscribeFrequency((data) => {
      const raw = data.rawFrequencies;
      for (let i = 0; i < 64; i++) {
        const target = isPlaying ? (raw[i] / 255) * 48 : 2;
        smoothedBars.current[i] += (target - smoothedBars.current[i]) * 0.22;
      }
    });

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      unsub();
    };
  }, [radius, isPlaying, currentTrack]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    />
  );
};
