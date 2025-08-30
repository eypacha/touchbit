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
        this.byteBeatNode.connect(this.gainNode);
        this.gainNode.connect(this.context.destination);
        
        // Conectar el analizador de frecuencia
        this.gainNode.connect(this.analyser);
    
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
    
      this.byteBeatNode.disconnect();
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
      if(!this.byteBeatNode){
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

        if(expressions[0] === '') expressions[0] = '0'
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
  
  // Setup memory qui listeners
  // window.addEventListener('memory-cleanup-requested', () => {
  //   audioEngine.cleanup();
  // });
  
  // window.addEventListener('aggressive-cleanup', () => {
  //   audioEngine.cleanup();
  //   // Force more aggressive cleanup
  //   if (audioEngine.context) {
  //     audioEngine.context.suspend();
  //   }
  // });
  
  // Auto cleanup when page loses focus (important for mobile)
  // document.addEventListener('visibilitychange', () => {
  //   if (document.hidden) {
  //     // Page is hidden, perform cleanup
  //     audioEngine.cleanup();
  //   }
  // });
  
  // Auto cleanup on page unload
  // window.addEventListener('beforeunload', () => {
  //   audioEngine.cleanup();
  // });
  
  // Auto cleanup on memory pressure (mobile browsers)
  // if ('memory' in performance) {
  //   setInterval(() => {
  //     const memInfo = performance.memory;
  //     const memoryUsage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;
      
  //     if (memoryUsage > 0.85) { // If using more than 85% of available memory
  //       console.warn('High memory usage detected, performing cleanup');
  //       audioEngine.cleanup();
  //       // Trigger garbage collection if available
  //       if (window.gc) {
  //         window.gc();
  //       }
  //     }
  //   }, 5000); // Check every 5 seconds
  // }
  
  // Expose for debugging
  window.audioEngine = audioEngine;
