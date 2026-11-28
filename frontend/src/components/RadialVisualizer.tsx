import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { usePlayerStore } from '../store/usePlayerStore';

interface RadialVisualizerProps {
  radius: number;
}

export const RadialVisualizer: React.FC<RadialVisualizerProps> = ({ radius }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const smoothedBars = useRef<Float32Array>(new Float32Array(64));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const numBars = 64;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = radius * 2 + 160;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.scale(dpr, dpr);

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const baseRadius = radius + 8;

      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2 - Math.PI / 2;
        const barHeight = smoothedBars.current[i];

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

        // Symmetric crimson-rose (#fa405e) to violet (#8b5cf6) gradient around the disc
        const t = Math.abs((i / numBars) * 2 - 1);
        const r = Math.round(250 + (139 - 250) * t);
        const g = Math.round(64 + (92 - 64) * t);
        const b = Math.round(94 + (246 - 94) * t);
        const alpha = isPlaying ? 0.4 + Math.min(0.6, barHeight / 44) : 0.14;

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 2.6;
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
        const target = isPlaying ? (raw[i] / 255) * 48 : 3;
        smoothedBars.current[i] += (target - smoothedBars.current[i]) * 0.24;
      }
    });

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      unsub();
    };
  }, [radius, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    />
  );
};
