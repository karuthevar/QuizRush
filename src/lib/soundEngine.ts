// Web Audio API Synthesizer for Kahoot-style sound effects

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lobbyInterval: any = null;

  private initCtx() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopLobbyMusic();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play a single synthesized tone
  public playTone(freq: number, type: OscillatorType, duration: number, gainVal: number = 0.1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio might be restricted until user gesture
    }
  }

  // Countdown tick
  public playTick() {
    this.playTone(800, 'sine', 0.05, 0.05);
  }

  // Urgent final countdown tick
  public playUrgentTick() {
    this.playTone(1200, 'square', 0.08, 0.08);
  }

  // Button click / answer select
  public playPop() {
    this.playTone(600, 'sine', 0.08, 0.15);
  }

  // Correct answer triumphant chime
  public playCorrect() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.25, 0.18);
      }, idx * 70);
    });
  }

  // Wrong answer buzzer
  public playWrong() {
    if (this.isMuted) return;
    const notes = [280, 240, 200];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.18, 0.12);
      }, idx * 80);
    });
  }

  // Start game fanfare
  public playStartGame() {
    if (this.isMuted) return;
    const fanfare = [
      { f: 440, d: 0.12 },
      { f: 554, d: 0.12 },
      { f: 659, d: 0.12 },
      { f: 880, d: 0.35 },
    ];
    fanfare.forEach((n, idx) => {
      setTimeout(() => {
        this.playTone(n.f, 'triangle', n.d, 0.2);
      }, idx * 110);
    });
  }

  // Final podium victory fanfare
  public playPodium() {
    if (this.isMuted) return;
    const notes = [
      { f: 523.25, d: 0.15, delay: 0 },
      { f: 523.25, d: 0.15, delay: 150 },
      { f: 523.25, d: 0.15, delay: 300 },
      { f: 659.25, d: 0.4, delay: 450 },
      { f: 783.99, d: 0.25, delay: 750 },
      { f: 1046.5, d: 0.7, delay: 1000 },
    ];
    notes.forEach((n) => {
      setTimeout(() => {
        this.playTone(n.f, 'square', n.d, 0.15);
      }, n.delay);
    });
  }

  // Ambient rhythmic lobby synth beat
  public startLobbyMusic() {
    if (this.isMuted || this.lobbyInterval) return;
    this.initCtx();
    const chords = [
      [261.63, 329.63, 392.0], // C
      [293.66, 349.23, 440.0], // Dm
      [329.63, 392.0, 493.88], // Em
      [349.23, 440.0, 523.25], // F
    ];
    let chordIdx = 0;
    let step = 0;

    this.lobbyInterval = setInterval(() => {
      if (this.isMuted) return;
      const currentChord = chords[chordIdx];
      const note = currentChord[step % currentChord.length];
      this.playTone(note, 'sine', 0.2, 0.03);

      step++;
      if (step % 4 === 0) {
        chordIdx = (chordIdx + 1) % chords.length;
      }
    }, 280);
  }

  public stopLobbyMusic() {
    if (this.lobbyInterval) {
      clearInterval(this.lobbyInterval);
      this.lobbyInterval = null;
    }
  }
}

export const sounds = new SoundEngine();
