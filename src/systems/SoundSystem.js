/**
 * SoundSystem - Audio management
 * Responsibility: Play sound effects and manage audio
 */

export class SoundSystem {
  constructor() {
    this.sounds = {};
    this.audioContext = null;
    this.masterVolume = 0.5;
    this.enabled = true;

    this._initAudio();
  }

  /**
   * Initialize Web Audio API
   */
  _initAudio() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
      this.enabled = false;
    }
  }

  /**
   * Create a simple collision sound
   */
  playCollisionSound(intensity = 1.0) {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Bang sound
    oscillator.frequency.setValueAtTime(200 * intensity, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      50,
      ctx.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(
      0.3 * this.masterVolume * intensity,
      ctx.currentTime
    );
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }

  /**
   * Play engine/acceleration sound
   */
  playEngineSound(speed) {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sawtooth";
    const frequency = 80 + speed * 10;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.05 * this.masterVolume, ctx.currentTime);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  /**
   * Play boost sound
   */
  playBoostSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      800,
      ctx.currentTime + 0.3
    );

    gainNode.gain.setValueAtTime(0.2 * this.masterVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }

  /**
   * Play siren sound (for police)
   */
  playSirenSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Wee-woo pattern
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.15 * this.masterVolume, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }

  /**
   * Play explosion sound
   */
  playExplosionSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;

    // Low boom
    const oscillator1 = ctx.createOscillator();
    const gainNode1 = ctx.createGain();
    oscillator1.connect(gainNode1);
    gainNode1.connect(ctx.destination);

    oscillator1.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(
      30,
      ctx.currentTime + 0.3
    );
    gainNode1.gain.setValueAtTime(0.4 * this.masterVolume, ctx.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator1.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + 0.3);

    // High crack
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);

    oscillator2.type = "square";
    oscillator2.frequency.setValueAtTime(400, ctx.currentTime);
    gainNode2.gain.setValueAtTime(0.2 * this.masterVolume, ctx.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator2.start(ctx.currentTime);
    oscillator2.stop(ctx.currentTime + 0.1);
  }

  /**
   * Set master volume
   */
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Toggle sound on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
