/**
 * AudioEngine - Sistema de Áudio Procedural com Web Audio API
 * Sem dependências de arquivos externos (100% autônomo e confiável).
 */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.sfxVolume = 0.8;
    this.rainVolume = 0.45;

    this.rainNode = null;
    this.rainGain = null;
    this.masterGain = null;
    this.sfxGain = null;

    this.trainWhistleOsc1 = null;
    this.trainWhistleOsc2 = null;
    this.trainGain = null;
    this.trainChugTimer = null;
    this.isTrainAudioActive = false;

    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Rain Gain
      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(this.rainVolume, this.ctx.currentTime);
      this.rainGain.connect(this.masterGain);

      this.createRainGenerator();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API não suportada ou bloqueada no momento:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Gerador procedural de chuva contínua (ruído rosa sintetizado com filtro passa-baixa)
   */
  createRainGenerator() {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2; // 2 segundos de buffer em loop
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filtro Passa-Baixa para simular o abafamento da chuva suave
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.rainGain);
    whiteNoise.start(0);
    this.rainNode = whiteNoise;
  }

  /**
   * Efeito sonoro do pulo
   */
  playJump() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Efeito sonoro do agachamento (deslize na grama molhada)
   */
  playDuck() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Efeito sonoro da flecha cortando o ar (whoosh veloz)
   */
  playArrowWhoosh() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);

    // Filtro para suavizar
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(2, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Efeito sonoro de impacto / colisão
   */
  playHit() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Inicia o áudio do trem a vapor: apito e chug cadenciado
   */
  startTrainAudio() {
    this.ensureContext();
    if (!this.ctx || this.isTrainAudioActive) return;
    this.isTrainAudioActive = true;

    // Toca o apito inicial clássico (dois tons harmônicos)
    this.playTrainWhistle();

    // Inicia o ritmo chug-chug
    let chugStep = 0;
    this.trainChugTimer = setInterval(() => {
      if (!this.isTrainAudioActive) return;
      this.playChugSound(chugStep % 2 === 0);
      chugStep++;
    }, 380);
  }

  playTrainWhistle() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(440, now); // Nota Lá
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(554.37, now); // Nota Dó sustenido

    // Filtro passa-baixo para dar sonoridade de vapor
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
    gain.gain.setValueAtTime(0.35, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);
  }

  playChugSound(isHeavy) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHeavy ? 110 : 85, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    gain.gain.setValueAtTime(isHeavy ? 0.25 : 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  stopTrainAudio() {
    this.isTrainAudioActive = false;
    if (this.trainChugTimer) {
      clearInterval(this.trainChugTimer);
      this.trainChugTimer = null;
    }
    // Apito de despedida suave
    this.playTrainWhistle();
  }

  /**
   * Fanfarra de vitória triunfante
   */
  playVictory() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C, E, G, C5, E5

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setRainVolume(val) {
    this.rainVolume = Math.max(0, Math.min(1, val));
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setValueAtTime(this.rainVolume, this.ctx.currentTime);
    }
  }
}

window.audioEngine = new AudioEngine();
