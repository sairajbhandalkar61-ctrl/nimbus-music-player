import { audioEngine } from './audioEngine';
import { Track } from '../types';

class SynthEngine {
  private static instance: SynthEngine;
  private oscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];
  private filterNode: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;
  private timer: number | null = null;

  private constructor() {}

  public static getInstance(): SynthEngine {
    if (!SynthEngine.instance) {
      SynthEngine.instance = new SynthEngine();
    }
    return SynthEngine.instance;
  }

  // Frequency mapping for keys (0 = C, 1 = C#, 2 = D ... 11 = B)
  private getRootFreq(key: number): number {
    const baseFreqs = [
      130.81, 138.59, 146.83, 155.56, 164.81, 174.61,
      185.00, 196.00, 207.65, 220.00, 233.08, 246.94
    ];
    const k = Math.abs(key) % 12;
    return baseFreqs[k];
  }

  public start(track: Track) {
    this.stop();

    const ctx = audioEngine.getAudioContext();
    const analyser = audioEngine.getAnalyser();
    if (!ctx || !analyser) return;

    this.isRunning = true;
    const root = this.getRootFreq(track.key || 0);
    const isMinor = track.mode === 0;

    // Chord intervals: Root, 3rd (minor or major), 5th, Octave
    const thirdMult = isMinor ? 1.1892 : 1.2599; // Minor 3rd vs Major 3rd
    const fifthMult = 1.4983;
    const octaveMult = 2.0;

    const frequencies = [
      root * 0.5,             // Deep sub bass
      root,                   // Root
      root * thirdMult,       // 3rd
      root * fifthMult,       // 5th
      root * octaveMult * 1.5 // Gentle high chime
    ];

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 1.5);

    this.filterNode = ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(450 + track.energy * 1200, ctx.currentTime);
    this.filterNode.Q.setValueAtTime(2.0, ctx.currentTime);

    this.masterGain.connect(this.filterNode);
    this.filterNode.connect(analyser);

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : idx === 4 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Subtle organic detuning
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, ctx.currentTime);

      gain.gain.value = idx === 0 ? 0.4 : 0.2;

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();

      this.oscillators.push(osc);
      this.gainNodes.push(gain);
    });

    // LFO modulation for breathing ambient effect
    const bpm = Math.max(60, Math.min(180, track.tempo || 120));
    const beatIntervalMs = (60 / bpm) * 1000 * 2;

    this.timer = window.setInterval(() => {
      if (!this.isRunning || !this.filterNode || !ctx) return;
      const targetFreq = 400 + Math.random() * 800 + (track.energy * 600);
      this.filterNode.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 1.2);
    }, beatIntervalMs);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const ctx = audioEngine.getAudioContext();
    if (this.masterGain && ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
      } catch {}
    }
    setTimeout(() => {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.oscillators = [];
      this.gainNodes = [];
      this.masterGain = null;
      this.filterNode = null;
      this.isRunning = false;
    }, 450);
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const synthEngine = SynthEngine.getInstance();
