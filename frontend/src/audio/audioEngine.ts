import { AudioFrequencyData, Track } from '../types';

export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000] as const;
export const EQ_LABELS = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'] as const;

type DeckKey = 'A' | 'B';

interface Deck {
  key: DeckKey;
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

class AudioEngine {
  private static instance: AudioEngine;
  private audioCtx: AudioContext | null = null;
  private deckA: Deck | null = null;
  private deckB: Deck | null = null;
  private activeDeckKey: DeckKey = 'A';
  private eqFilters: BiquadFilterNode[] = [];
  private eqGains: number[] = [0, 0, 0, 0, 0];
  private analyserNode: AnalyserNode | null = null;
  private masterGainNode: GainNode | null = null;
  private sleepFadeNode: GainNode | null = null;

  private targetVolume: number = 0.85;
  private freqArray: Uint8Array<ArrayBuffer> = new Uint8Array(64);
  private isUnlocked: boolean = false;
  private updateCallbacks: Set<(freqs: AudioFrequencyData) => void> = new Set();
  private rafId: number | null = null;
  private crossfadeCleanupTimer: number | null = null;

  private onTimeUpdateCb: ((time: number, duration: number) => void) | null = null;
  private onEndedCb: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private createDeck(key: DeckKey, ctx: AudioContext, destinationNode: AudioNode): Deck {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.volume = 1.0;

    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = key === this.activeDeckKey ? 1.0 : 0.0;

    source.connect(gain);
    gain.connect(destinationNode);

    audio.addEventListener('timeupdate', () => {
      if (this.activeDeckKey === key && this.onTimeUpdateCb) {
        const dur = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) ? audio.duration : 30;
        this.onTimeUpdateCb(audio.currentTime, dur);
      }
    });

    audio.addEventListener('ended', () => {
      if (this.activeDeckKey === key && this.onEndedCb) {
        this.onEndedCb();
      }
    });

    return { key, audio, source, gain };
  }

  public async unlock(): Promise<boolean> {
    if (this.isUnlocked && this.audioCtx && this.audioCtx.state === 'running') {
      return true;
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      if (!this.deckA || !this.deckB) {
        const ctx = this.audioCtx;

        // Build 5-band Equalizer chain before Analyser & Master Gain
        const filterTypes: BiquadFilterType[] = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];
        this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
          const filter = ctx.createBiquadFilter();
          filter.type = filterTypes[idx];
          filter.frequency.value = freq;
          filter.Q.value = 1.4;
          filter.gain.value = this.eqGains[idx] ?? 0;
          return filter;
        });

        for (let i = 0; i < this.eqFilters.length - 1; i++) {
          this.eqFilters[i].connect(this.eqFilters[i + 1]);
        }

        this.analyserNode = ctx.createAnalyser();
        this.analyserNode.fftSize = 128; // 64 frequency bins
        this.analyserNode.smoothingTimeConstant = 0.82;

        this.masterGainNode = ctx.createGain();
        this.masterGainNode.gain.value = this.targetVolume;

        this.sleepFadeNode = ctx.createGain();
        this.sleepFadeNode.gain.value = 1.0;

        this.eqFilters[this.eqFilters.length - 1].connect(this.analyserNode);
        this.analyserNode.connect(this.masterGainNode);
        this.masterGainNode.connect(this.sleepFadeNode);
        this.sleepFadeNode.connect(ctx.destination);

        this.deckA = this.createDeck('A', ctx, this.eqFilters[0]);
        this.deckB = this.createDeck('B', ctx, this.eqFilters[0]);

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

  private getActiveDeck(): Deck | null {
    return this.activeDeckKey === 'A' ? this.deckA : this.deckB;
  }

  private getInactiveDeck(): Deck | null {
    return this.activeDeckKey === 'A' ? this.deckB : this.deckA;
  }

  public setPlaybackCallbacks(
    onTimeUpdate: (time: number, duration: number) => void,
    onEnded: () => void
  ): void {
    this.onTimeUpdateCb = onTimeUpdate;
    this.onEndedCb = onEnded;
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.getActiveDeck()?.audio ?? null;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public getVolume(): number {
    return this.targetVolume;
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.targetVolume = clamped;
    if (this.masterGainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.masterGainNode.gain.cancelScheduledValues(now);
      this.masterGainNode.gain.setTargetAtTime(clamped, now, 0.015);
    }
  }

  /** Smoothly ramp sleep fade gain (0..1) over durationSec */
  public setSleepFade(multiplier: number, durationSec: number = 0.2): void {
    if (this.sleepFadeNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.sleepFadeNode.gain.cancelScheduledValues(now);
      this.sleepFadeNode.gain.setValueAtTime(this.sleepFadeNode.gain.value, now);
      this.sleepFadeNode.gain.linearRampToValueAtTime(
        Math.max(0.0001, Math.min(1, multiplier)),
        now + Math.max(0.02, durationSec)
      );
    }
  }

  public resetSleepFade(): void {
    if (this.sleepFadeNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.sleepFadeNode.gain.cancelScheduledValues(now);
      this.sleepFadeNode.gain.setValueAtTime(1.0, now);
    }
  }

  public setEqBands(gains: number[]): void {
    this.eqGains = gains.slice(0, 5).map((g) => Math.max(-12, Math.min(12, g)));
    if (this.audioCtx && this.eqFilters.length === 5) {
      const now = this.audioCtx.currentTime;
      this.eqFilters.forEach((filter, idx) => {
        filter.gain.setTargetAtTime(this.eqGains[idx] ?? 0, now, 0.02);
      });
    }
  }

  public getEqBands(): number[] {
    return [...this.eqGains];
  }

  public async playUrl(streamUrl: string, crossfadeSeconds: number = 0, forceRestart: boolean = false): Promise<void> {
    await this.unlock();
    const ctx = this.audioCtx;
    const currentDeck = this.getActiveDeck();
    const nextDeck = this.getInactiveDeck();
    if (!ctx || !currentDeck || !nextDeck) return;

    this.resetSleepFade();

    const absoluteUrl = new URL(streamUrl, window.location.href).href;
    const isSameTrack = currentDeck.audio.src === absoluteUrl;

    // Resuming the same paused track cleanly without restarting
    if (isSameTrack && !forceRestart && currentDeck.audio.paused) {
      try {
        currentDeck.gain.gain.cancelScheduledValues(ctx.currentTime);
        currentDeck.gain.gain.setValueAtTime(1.0, ctx.currentTime);
        await currentDeck.audio.play();
      } catch (err) {
        console.warn('[AudioEngine] Resume prevented:', err);
      }
      return;
    }

    const shouldCrossfade = crossfadeSeconds > 0 && !currentDeck.audio.paused && !!currentDeck.audio.src;

    if (this.crossfadeCleanupTimer) {
      window.clearTimeout(this.crossfadeCleanupTimer);
      this.crossfadeCleanupTimer = null;
    }

    if (shouldCrossfade) {
      // Crossfade from currentDeck -> nextDeck
      this.activeDeckKey = nextDeck.key;
      const now = ctx.currentTime;

      nextDeck.audio.src = absoluteUrl;
      nextDeck.audio.currentTime = 0;
      nextDeck.audio.load();

      nextDeck.gain.gain.cancelScheduledValues(now);
      nextDeck.gain.gain.setValueAtTime(0.0001, now);
      nextDeck.gain.gain.linearRampToValueAtTime(1.0, now + crossfadeSeconds);

      currentDeck.gain.gain.cancelScheduledValues(now);
      currentDeck.gain.gain.setValueAtTime(currentDeck.gain.gain.value, now);
      currentDeck.gain.gain.linearRampToValueAtTime(0.0001, now + crossfadeSeconds);

      try {
        await nextDeck.audio.play();
      } catch (err) {
        console.warn('[AudioEngine] Crossfade playback prevented:', err);
      }

      this.crossfadeCleanupTimer = window.setTimeout(() => {
        currentDeck.audio.pause();
        currentDeck.gain.gain.setValueAtTime(0.0, ctx.currentTime);
        this.crossfadeCleanupTimer = null;
      }, crossfadeSeconds * 1000 + 100);
    } else {
      // Direct cutover on active deck
      nextDeck.audio.pause();
      nextDeck.gain.gain.cancelScheduledValues(ctx.currentTime);
      nextDeck.gain.gain.setValueAtTime(0.0, ctx.currentTime);

      currentDeck.gain.gain.cancelScheduledValues(ctx.currentTime);
      currentDeck.gain.gain.setValueAtTime(1.0, ctx.currentTime);

      if (!isSameTrack || forceRestart) {
        if (!isSameTrack) {
          currentDeck.audio.src = absoluteUrl;
          currentDeck.audio.load();
        }
        currentDeck.audio.currentTime = 0;
      }

      try {
        await currentDeck.audio.play();
      } catch (err) {
        console.warn('[AudioEngine] Playback was prevented:', err);
      }
    }
  }

  public pause(): void {
    if (this.crossfadeCleanupTimer) {
      window.clearTimeout(this.crossfadeCleanupTimer);
      this.crossfadeCleanupTimer = null;
    }
    this.deckA?.audio.pause();
    this.deckB?.audio.pause();
  }

  public resume(): void {
    const deck = this.getActiveDeck();
    if (deck) {
      deck.audio.play().catch(console.warn);
    }
  }

  public seek(seconds: number): void {
    const deck = this.getActiveDeck();
    if (deck && !isNaN(seconds)) {
      const maxDur = deck.audio.duration && isFinite(deck.audio.duration) ? deck.audio.duration : seconds;
      deck.audio.currentTime = Math.max(0, Math.min(seconds, maxDur));
    }
  }

  public updateMediaSession(
    track: Track,
    isPlaying: boolean,
    handlers: {
      onNext: () => void;
      onPrev: () => void;
      onPlay: () => void;
      onPause: () => void;
      onSeek?: (time: number) => void;
    }
  ): void {
    if (!('mediaSession' in navigator)) return;

    const artSrc = track.artworkUrl || '/icon-512.png';
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: track.artists,
      album: track.isLocal ? 'Nimbus Local Library' : `Nimbus Discovery (${track.decade}s)`,
      artwork: [
        { src: artSrc, sizes: '512x512', type: track.artworkUrl ? 'image/jpeg' : 'image/png' },
      ],
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', handlers.onPlay);
    navigator.mediaSession.setActionHandler('pause', handlers.onPause);
    navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
    navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        if (handlers.onSeek) {
          handlers.onSeek(details.seekTime);
        } else {
          this.seek(details.seekTime);
        }
      }
    });
  }

  public updateMediaSessionPosition(position: number, duration: number): void {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    if (!duration || isNaN(duration) || !isFinite(duration) || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.max(0, Math.min(position, duration)),
      });
    } catch {
      // Ignore browsers that reject transient position updates
    }
  }

  public subscribeFrequency(cb: (freqs: AudioFrequencyData) => void): () => void {
    this.updateCallbacks.add(cb);
    return () => {
      this.updateCallbacks.delete(cb);
    };
  }

  private startAnalysisLoop = () => {
    if (this.rafId) return;

    const tick = () => {
      if (this.analyserNode) {
        this.analyserNode.getByteFrequencyData(this.freqArray);

        const count = this.freqArray.length;
        let bassAcc = 0;
        let midAcc = 0;
        let trebleAcc = 0;
        let totalAcc = 0;

        for (let i = 0; i < 7 && i < count; i++) bassAcc += this.freqArray[i];
        for (let i = 7; i < 25 && i < count; i++) midAcc += this.freqArray[i];
        for (let i = 25; i < count; i++) trebleAcc += this.freqArray[i];
        for (let i = 0; i < count; i++) totalAcc += this.freqArray[i];

        const data: AudioFrequencyData = {
          bass: bassAcc / (7 * 255),
          mid: midAcc / (18 * 255),
          treble: trebleAcc / ((count - 25) * 255 || 1),
          overall: totalAcc / (count * 255),
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
