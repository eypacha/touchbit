import { createImpulseResponse } from '@/utils/reverbUtils';
import { Macro_GraphicEqNode } from '@/lib/macroNodes';

class AudioEngine {
  constructor() {
    this.context = null;
    this.byteByteContext = null;
    this.byteBeatNode = null;
    this.sampleRate = 8000;
    this.isPlaying = false;
    this.position = 0;
    this.lastUpdateTime = 0;
    this.time = 0;
    this.stack = null;
    this.volume = 0.8;
    this.gainNode = null;
    this.analyser = null;
    this.frequencyArray = null;
    this.visualizationContext = null; // Reuse visualization context
    this.lastSample = 0; // Cache last sample to avogid excessive computation
    this.sampleUpdateThrottle = 0; // Throttle sample updates
    // Reverb nodes
    this.convolverNode = null;
    this.wetGainNode = null;
    this.dryGainNode = null;
    this.outputGainNode = null; // combines wet + dry
    this.reverbWet = 0.0; // default wet mix starts at 0 (no reverb)
  this.eqNode = null;
  this.pendingEQ = null;
  this.pendingEQBypass = null;
  }
  /**
   * Initializes the audio context and sets up the ByteBeatNode.
   * Automatically called on first play().
   * @throws {Error} If there's an issue initializing the audio context.
   */
  async initialize() {
    if (!this.byteBeatNode) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      await this.context.resume();

      await ByteBeatNode.setup(this.context);
      this.byteBeatNode = new ByteBeatNode(this.context);

      this.byteByteContext = await this.byteBeatNode.createContext()
      this.stack = await this.byteBeatNode.createStack();

      this.byteBeatNode.setType(ByteBeatNode.Type.byteBeat);
      this.byteBeatNode.setExpressionType(ByteBeatNode.ExpressionType.postfix);
      this.byteBeatNode.setDesiredSampleRate(this.sampleRate);
      this.stack = await this.byteBeatNode.createStack();

      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = this.volume;

      // Configurar el analizador de frecuencia
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512; // Debe ser una potencia de 2
      this.frequencyArray = new Uint8Array(this.analyser.frequencyBinCount);

      // --- Reverb (Convolver) setup ---
      this.convolverNode = this.context.createConvolver();
      this.wetGainNode = this.context.createGain();
      this.dryGainNode = this.context.createGain();
      this.outputGainNode = this.context.createGain();

      // Set initial wet/dry gains
      this.wetGainNode.gain.value = this.reverbWet;
      this.dryGainNode.gain.value = 1 - this.reverbWet;

      // Create impulse response using util (short reverb)
      this.convolverNode.buffer = createImpulseResponse(this.context, 2.0, 2.0, 2);

      // Insert EQ node (7-band graphic) between gainNode and dry/wet path if available
      try {
        // create with neutral gains
        this.eqNode = new Macro_GraphicEqNode(this.context, { eq: [0,0,0,0,0,0,0], effect: true });
        console.debug('[AudioEngine] eqNode (Graphic) created', this.eqNode);
        // route: gainNode -> eqNode -> (dry, convolver)
        this.gainNode.connect(this.eqNode);
        this.eqNode.connect(this.dryGainNode);
        this.eqNode.connect(this.convolverNode);

        // apply pending EQ if any (map bass->eq[0], mid->eq[3], treble->eq[6])
        if (this.pendingEQ) {
          const { bass = 0, mid = 0, treble = 0 } = this.pendingEQ;
          try { this.eqNode.eq[0].setValueAtTime(bass, this.context.currentTime); } catch (e) {}
          try { this.eqNode.eq[3].setValueAtTime(mid, this.context.currentTime); } catch (e) {}
          try { this.eqNode.eq[6].setValueAtTime(treble, this.context.currentTime); } catch (e) {}
          this.pendingEQ = null;
        }
        if (this.pendingEQBypass !== null) {
          try { this.setEQBypass(this.pendingEQBypass); } catch (e) {}
          this.pendingEQBypass = null;
        }
      } catch (e) {
        // Fallback: connect gainNode directly to dry and convolver
        console.debug('[AudioEngine] eqNode creation failed, using fallback connection', e);
        this.gainNode.connect(this.dryGainNode);
        this.gainNode.connect(this.convolverNode);
      }
      this.convolverNode.connect(this.wetGainNode);
      this.dryGainNode.connect(this.outputGainNode);
      this.wetGainNode.connect(this.outputGainNode);

      // Output goes to analyser and destination
      this.outputGainNode.connect(this.analyser);
      this.outputGainNode.connect(this.context.destination);

      return true;
    }
  }


  /**
 * Set audio volume 
 */
  setVolume(value, rampTime = 0) {
    if (this.gainNode) {
      const now = this.context.currentTime;

      // Si rampTime es 0 o no se especifica, el cambio es instantáneo
      if (rampTime === 0) {
        this.gainNode.gain.setValueAtTime(value, now);
      }
      // Si se especifica rampTime, crear una rampa linear
      else {
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(value, now + rampTime);
      }
    } else {
      this.volume = value;
    }
  }

  /**
   * Sets the desired sample rate for the ByteBeat.
   * @param {number} sampleRate - The desired sample rate in seconds.
   * @throws {Error} If an error occurs during setting the sample rate.
   * */
  setSampleRate(sampleRate = 8000) {

    try {
      this.sampleRate = sampleRate;

      if (this.byteBeatNode) {
        this.byteBeatNode.setDesiredSampleRate(sampleRate);
      }
    } catch (error) {
      console.error("Error setting sample rate:", error);
      throw error;
    }
  }

  /**
   * Set reverb wet/dry mix (0..1). Keeps values clamped.
   * We'll expose this so the UI can integrate later. Default is 0.3.
   */
  setReverbWet(wet = 0.0) {
    const v = Math.max(0, Math.min(1, Number(wet) || 0));
    this.reverbWet = v;
    if (this.wetGainNode && this.dryGainNode) {
      this.wetGainNode.gain.setValueAtTime(v, this.context.currentTime);
      this.dryGainNode.gain.setValueAtTime(1 - v, this.context.currentTime);
    }
  }

  /**
   * Set graphic EQ values. Accepts either { eq: [v0..v6] } or { bass, mid, treble }
   * bass -> eq[0], mid -> eq[3], treble -> eq[6]
   */
  setGraphicEQ(values = {}) {
    if (!this.context) {
      // store pending until initialize
      if (values.eq) this.pendingEQ = { eq: values.eq.slice(0,7) };
      else this.pendingEQ = { bass: values.bass || 0, mid: values.mid || 0, treble: values.treble || 0 };
      return;
    }

    if (this.eqNode && this.eqNode.eq) {
      try {
        if (values.eq && Array.isArray(values.eq)) {
          const arr = values.eq.slice(0,7);
          for (let i = 0; i < arr.length; i++) {
            try {
              this.eqNode.eq[i].setValueAtTime(arr[i], this.context.currentTime);
              // also set .value to reflect immediately for dumps/reads
              try { this.eqNode.eq[i].value = arr[i]; } catch (e) {}
            } catch (e) {
              console.debug('[AudioEngine] error applying eq[%d] = %o', i, arr[i], e);
            }
          }
        } else {
          // map bass/mid/treble
          if (typeof values.bass !== 'undefined') {
            try { this.eqNode.eq[0].setValueAtTime(values.bass, this.context.currentTime); this.eqNode.eq[0].value = values.bass; } catch (e) { console.debug('[AudioEngine] error setting bass', e); }
          }
          if (typeof values.mid !== 'undefined') {
            try { this.eqNode.eq[3].setValueAtTime(values.mid, this.context.currentTime); this.eqNode.eq[3].value = values.mid; } catch (e) { console.debug('[AudioEngine] error setting mid', e); }
          }
          if (typeof values.treble !== 'undefined') {
            try { this.eqNode.eq[6].setValueAtTime(values.treble, this.context.currentTime); this.eqNode.eq[6].value = values.treble; } catch (e) { console.debug('[AudioEngine] error setting treble', e); }
          }
          
        }
      } catch (e) {
        console.debug('[AudioEngine] setGraphicEQ error', e);
      }
    } else {
      // store pending
      if (values.eq) this.pendingEQ = { eq: values.eq.slice(0,7) };
      else this.pendingEQ = { bass: values.bass || 0, mid: values.mid || 0, treble: values.treble || 0 };
    }
  }

  setEQBypass(bypass) {
    // bypass: true => route around EQ; false => route through EQ if available
    const isBypass = !!bypass;

    // If not initialized or no gain node yet, store pending
    if (!this.gainNode) {
      this.pendingEQBypass = isBypass;
      return;
    }

    // Safe disconnect current connections
    try {
      if (this.eqNode) {
        try { this.gainNode.disconnect(this.eqNode); } catch (e) {}
        try { this.eqNode.disconnect(this.dryGainNode); } catch (e) {}
        try { this.eqNode.disconnect(this.convolverNode); } catch (e) {}
      }
      try { this.gainNode.disconnect(this.dryGainNode); } catch (e) {}
      try { this.gainNode.disconnect(this.convolverNode); } catch (e) {}
    } catch (e) {}

    if (isBypass) {
      // connect gain directly to dry and convolver
      try { this.gainNode.connect(this.dryGainNode); } catch (e) {}
      try { this.gainNode.connect(this.convolverNode); } catch (e) {}
    } else {
      // route through EQ if exists, otherwise direct
      if (this.eqNode) {
        try { this.gainNode.connect(this.eqNode); } catch (e) {}
        try { this.eqNode.connect(this.dryGainNode); } catch (e) {}
        try { this.eqNode.connect(this.convolverNode); } catch (e) {}
      } else {
        try { this.gainNode.connect(this.dryGainNode); } catch (e) {}
        try { this.gainNode.connect(this.convolverNode); } catch (e) {}
      }
    }

    // update macro internal flag if available
    if (this.eqNode) {
      try { this.eqNode.effect = !isBypass; } catch (e) {}
    }

    this.pendingEQBypass = isBypass;
  }

  isEQEnabled() {
    return !!(this.eqNode && this.eqNode.effect) || !!this.pendingEQBypass;
  }

  // Diagnostic: return current eq values and effect state (safe)
  dumpEQ() {
    try {
      if (!this.eqNode) return { exists: false };
      const eqVals = Array.isArray(this.eqNode.eq)
        ? this.eqNode.eq.map((p) => (p && typeof p.value !== 'undefined' ? p.value : null))
        : null;
      return { exists: true, effect: !!this.eqNode.effect, eq: eqVals };
    } catch (e) {
      console.debug('[AudioEngine] dumpEQ error', e);
      return { exists: false, error: String(e) };
    }
  }
  /**
   * Starts playing the ByteBeat.
   * Initializes the audio context if not done already.
   * @throws {Error} If an error occurs during playback.
   */
  async play() {
    if (this.isPlaying) return false;

    if (!this.byteBeatNode) {
      await this.initialize();
    }

    try {
      await this.context.resume();

      // Reconectar los nodos de audio
      // Ensure byteBeatNode feeds our gain node; routing from gainNode was wired in initialize
      this.byteBeatNode.connect(this.gainNode);

      this.isPlaying = true;
      return true;
    } catch (error) {
      console.error("Error starting ByteBeat:", error);
      throw error;
    }
  }


  /**
   * Pauses the currently playing ByteBeat audio.
   * If audio is not playing, this method has no effect.
   */
  async pause() {
    if (!this.byteBeatNode) {
      await this.initialize();
    }
    if (!this.isPlaying) return false;

    // Disconnect the source so sound stops; keep node graph intact for fast resume
    try {
      this.byteBeatNode.disconnect();
    } catch (e) { }
    this.isPlaying = false;
    return true;
  }


  /**
   * Stop the currently playing ByteBeat audio.
   * If audio is not playing, just reset the timer
   */
  async stop() {
    if (!this.byteBeatNode) return true;
    this.byteBeatNode.reset();
    if (!this.isPlaying) return;
    this.byteBeatNode.disconnect();
    this.isPlaying = false;
    return true;
  }

  async getSampleForTime() {
    if (!this.byteBeatNode) {
      await this.initialize();
    }

    // Cache sample calculation to avoid excessive computation
    if (!this.isPlaying) {
      return this.lastSample || 0;
    }

    // Throttle sample updates to reduce memory pressure
    const now = performance.now();
    if (now - this.sampleUpdateThrottle < 16) { // ~60fps limit
      return this.lastSample || 0;
    }
    this.sampleUpdateThrottle = now;

    let sample = await this.byteBeatNode.getSampleForTime(this.time, this.byteByteContext, this.stack);
    sample = Math.round((sample + 1) * 127.5);
    this.lastSample = sample;

    return sample;
  }

  async getSamplesForVisualization(width) {
    if (!this.byteBeatNode) {
      await this.initialize();
    }

    const now = performance.now();
    const elapsedTimeMS = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    if (this.isPlaying) {
      const startTime = this.position;
      const endTime =
        (startTime +
          elapsedTimeMS * 0.001 * this.byteBeatNode.getDesiredSampleRate()) |
        0;
      const duration = endTime - startTime;
      this.position = endTime;

      // Reuse context instead of creating new one every time
      if (!this.visualizationContext) {
        this.visualizationContext = await this.byteBeatNode.createContext();
      }

      const monoAudio = await this.byteBeatNode.getSamplesForTimeRange(
        startTime,
        endTime,
        width,
        this.visualizationContext,
        this.stack,
        0
      );

      return { left: monoAudio, right: monoAudio };
    }

    return null;
  }    /**
     * Reset the timer
     */
  async reset() {
    this.position = 0;
    this.lastUpdateTime = 0;
    this.lastSample = 0;
    this.sampleUpdateThrottle = 0;

    if (this.byteBeatNode) {
      this.byteBeatNode.reset();
    }

    // Clear visualization context to free memory
    this.visualizationContext = null;
  }

  /**
   * Memory cleanup method for crash prevention
   */
  cleanup() {
    try {
      // Disconnect all audio nodes
      if (this.byteBeatNode) {
        this.byteBeatNode.disconnect();
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
      }
      if (this.analyser) {
        this.analyser.disconnect();
      }
      if (this.convolverNode) {
        try { this.convolverNode.disconnect(); } catch (e) { }
      }
      if (this.wetGainNode) {
        try { this.wetGainNode.disconnect(); } catch (e) { }
      }
      if (this.dryGainNode) {
        try { this.dryGainNode.disconnect(); } catch (e) { }
      }
      if (this.outputGainNode) {
        try { this.outputGainNode.disconnect(); } catch (e) { }
      }

      // Clear arrays and cached values
      this.frequencyArray = null;
      this.visualizationContext = null;
      this.lastSample = 0;
      this.sampleUpdateThrottle = 0;

      // Reset position and timing
      this.position = 0;
      this.lastUpdateTime = 0;
      this.time = 0;

      // Suspend audio context temporarily
      if (this.context && this.context.state === 'running') {
        this.context.suspend();
      }

      console.log('AudioEngine cleanup completed');
    } catch (error) {
      console.error('AudioEngine cleanup error:', error);
    }
  }

  /**
   *
   * @returns the current time in seconds
   */
  getTime() {
    if (!this.byteBeatNode) return 0;
    this.time = this.byteBeatNode.getTime() ?? 0;
    return this.time;
  }

  /**
   * Sets new expressions for the ByteBeat audio.
   * @param {string[]} expressions - An array of two strings representing
   *                                 the expressions for left and right channels.
   * @throws {Error} If the ByteBeatNode is not initialized.
   * @example
   * audioService.setExpressions(['t >> 4', 't >> 5']);
   */
  setExpressions(expressions) {
    if (this.byteBeatNode) {

      if (expressions[0] === '') expressions[0] = '0'
      this.byteBeatNode.setExpressions(expressions);
    }
  }

  /**
   * Gets frequency data from the audio analyser
   * @returns {Uint8Array} - Array of frequency data values (0-255)
   */
  async getFrequencyData() {
    if (!this.analyser || !this.isPlaying) {
      return null;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.frequencyArray);
    return this.frequencyArray;
  }
}

export const audioEngine = new AudioEngine();