import { AudioFrequencyData, Track } from '../types';

class AudioEngine {
  private static instance: AudioEngine;
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private freqArray: Uint8Array = new Uint8Array(64);
  private isUnlocked: boolean = false;
  private updateCallbacks: Set<(freqs: AudioFrequencyData) => void> = new Set();
  private rafId: number | null = null;

  private constructor() {
    // Lazy initialize on user gesture
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async unlock(): Promise<boolean> {
    if (this.isUnlocked && this.audioCtx && this.audioCtx.state === 'running') {
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.audioElement.preload = 'auto';

        this.analyserNode = this.audioCtx.createAnalyser();
        this.analyserNode.fftSize = 128; // 64 frequency bins
        this.analyserNode.smoothingTimeConstant = 0.82;

        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = 0.85;

        this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
        this.sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);

        this.freqArray = new Uint8Array(this.analyserNode.frequencyBinCount);
      }

      this.isUnlocked = true;
      this.startAnalysisLoop();
      return true;
    } catch (err) {
      console.warn('[AudioEngine] Could not initialize Web Audio context:', err);
      return false;
    }
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioCtx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public async playUrl(streamUrl: string): Promise<void> {
    await this.unlock();
    if (!this.audioElement) return;

    if (this.audioElement.src !== streamUrl) {
      this.audioElement.src = streamUrl;
      this.audioElement.load();
    }
    try {
      await this.audioElement.play();
    } catch (err) {
      console.warn('[AudioEngine] Playback was prevented:', err);
    }
  }

  public pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public resume(): void {
    if (this.audioElement) {
      this.audioElement.play().catch(console.warn);
    }
  }

  public seek(seconds: number): void {
    if (this.audioElement && !isNaN(seconds)) {
      this.audioElement.currentTime = seconds;
    }
  }

  public updateMediaSession(track: Track, onNext?: () => void, onPrev?: () => void, onPlay?: () => void, onPause?: () => void) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: track.artists,
      album: `Nimbus Discovery (${track.decade}s)`,
      artwork: track.artworkUrl
        ? [
            { src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
            { src: track.artworkUrl, sizes: '600x600', type: 'image/jpeg' },
          ]
        : [],
    });

    if (onPlay) navigator.mediaSession.setActionHandler('play', onPlay);
    if (onPause) navigator.mediaSession.setActionHandler('pause', onPause);
    if (onNext) navigator.mediaSession.setActionHandler('nexttrack', onNext);
    if (onPrev) navigator.mediaSession.setActionHandler('previoustrack', onPrev);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.seek(details.seekTime);
      }
    });
  }

  public subscribeFrequency(cb: (freqs: AudioFrequencyData) => void): () => void {
    this.updateCallbacks.add(cb);
    return () => {
      this.updateCallbacks.delete(cb);
    };
  }

  private startAnalysisLoop = () => {
    if (this.rafId) return;

    let bassAcc = 0;
    let midAcc = 0;
    let trebleAcc = 0;
    let totalAcc = 0;

    const tick = () => {
      if (this.analyserNode) {
        this.analyserNode.getByteFrequencyData(this.freqArray);

        const count = this.freqArray.length;
        bassAcc = 0;
        midAcc = 0;
        trebleAcc = 0;
        totalAcc = 0;

        // Bins 0-6: Bass (approx 20Hz - 250Hz)
        for (let i = 0; i < 7 && i < count; i++) {
          bassAcc += this.freqArray[i];
        }
        // Bins 7-24: Mids (approx 250Hz - 2000Hz)
        for (let i = 7; i < 25 && i < count; i++) {
          midAcc += this.freqArray[i];
        }
        // Bins 25-63: Treble (approx 2kHz - 16kHz)
        for (let i = 25; i < count; i++) {
          trebleAcc += this.freqArray[i];
        }

        for (let i = 0; i < count; i++) {
          totalAcc += this.freqArray[i];
        }

        const bassNorm = bassAcc / (7 * 255);
        const midNorm = midAcc / (18 * 255);
        const trebleNorm = trebleAcc / ((count - 25) * 255 || 1);
        const overallNorm = totalAcc / (count * 255);

        const data: AudioFrequencyData = {
          bass: bassNorm,
          mid: midNorm,
          treble: trebleNorm,
          overall: overallNorm,
          rawFrequencies: this.freqArray,
        };

        this.updateCallbacks.forEach((cb) => cb(data));
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  };
}

export const audioEngine = AudioEngine.getInstance();
