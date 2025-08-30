import { createImpulseResponse } from '@/utils/reverbUtils';

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

      // Wire the wet/dry routing: gainNode -> (dryGain -> output) and (convolver -> wetGain -> output)
      this.gainNode.connect(this.dryGainNode);
      this.gainNode.connect(this.convolverNode);
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