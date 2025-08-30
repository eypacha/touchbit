import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";
import { useLoggerStore } from "@/stores/loggerStore";
import { audioEngine } from "@/services/audioEngine";
import { SAMPLE_RATE_KEY } from "@/constants/index";

export const useAudioStore = defineStore("audio", () => {
  const logger = useLoggerStore();
  
  const isPlaying = ref(false);
  const volume = ref(0.8);
  const sampleRate = ref(getSavedSampleRate());
  const reverbWet = ref(0.0);
  const time = ref(0);
  const sample = ref(0);
  const visualizationData = ref(null);
  const frequencyData = ref(null);
  
  function getSavedSampleRate() {
    try {
      const savedRate = localStorage.getItem(SAMPLE_RATE_KEY);
      return savedRate ? parseInt(savedRate, 10) : 8000;
    } catch (error) {
      logger.log('ERROR', `Failed to load sample rate from localStorage: ${error.message}`);
      return 8000;
    }
  }
  
  watch(sampleRate, (newRate) => {
    try {
      localStorage.setItem(SAMPLE_RATE_KEY, newRate.toString());
    } catch (error) {
      logger.log('ERROR', `Failed to save sample rate to localStorage: ${error.message}`);
    }
  });
  
  async function playPause(expression) {
    logger.log('AUDIO', isPlaying.value ? 'PAUSE' : 'PLAY');
    
    if (!isPlaying.value) {
      const result = await audioEngine.play();
      
      setExpression(expression);

      if (result) {
        isPlaying.value = true;
        renderLoop();
      }
    } else {
      const result = audioEngine.pause();
      stopRenderLoop(); // Stop the render loop when pausing
      if (result) {
        isPlaying.value = false;
        renderLoop(); // Call once more to update final state
      }
    }
  }

  function setVolume(vol, rampTime) {
    volume.value = vol;
    audioEngine.setVolume(vol, rampTime);
  }

  function setReverbWet(wet) {
    const v = Math.max(0, Math.min(1, Number(wet) || 0));
    reverbWet.value = v;
    try {
      audioEngine.setReverbWet(v);
    } catch (e) {
      logger.log('ERROR', `Failed to set reverb wet: ${e.message}`);
    }
  }

  function setSampleRate(rate) {
    sampleRate.value = rate;
    audioEngine.setSampleRate(sampleRate.value);
    logger.log('AUDIO', `Sample Rate: ${rate}`);
  }
  
  async function stop() {
    const result = await audioEngine.stop();
    time.value = 0;
    stopRenderLoop(); // Stop the render loop
    if (result) {
      isPlaying.value = false;
    }
  }

  async function reset() {
    await audioEngine.reset();
    time.value = 0;
    stopRenderLoop(); // Stop the render loop
  }

  function setExpression(expression) {
    audioEngine.setExpressions([expression]);
    logger.log('COMPILE', `COMPILE: ${expression}`);
  }

  async function getSampleForTime() {
    sample.value = await audioEngine.getSampleForTime();
    return sample.value;
  }

  // Variable para controlar el render loop
  let renderAnimationId = null;
  let lastSampleUpdateTime = 0;
  const SAMPLE_UPDATE_INTERVAL = 50; // Update sample every 50ms instead of every frame

  function renderLoop() {
    const updateTime = async () => {
      if (isPlaying.value) {
        const now = performance.now();
        time.value = audioEngine.getTime();
        
        // Throttle sample updates to reduce computation
        if (now - lastSampleUpdateTime > SAMPLE_UPDATE_INTERVAL) {
          sample.value = await audioEngine.getSampleForTime();
          lastSampleUpdateTime = now;
        }
        
        renderAnimationId = requestAnimationFrame(updateTime);
      } else {
        // Cleanup when not playing
        if (renderAnimationId) {
          cancelAnimationFrame(renderAnimationId);
          renderAnimationId = null;
        }
        lastSampleUpdateTime = 0;
      }
    };
    
    // Cancel any existing animation frame before starting new one
    if (renderAnimationId) {
      cancelAnimationFrame(renderAnimationId);
    }
    
    renderAnimationId = requestAnimationFrame(updateTime);
  }

  // Function to stop render loop
  function stopRenderLoop() {
    if (renderAnimationId) {
      cancelAnimationFrame(renderAnimationId);
      renderAnimationId = null;
    }
  }

  async function updateVisualization(width) {
    visualizationData.value = await audioEngine.getSamplesForVisualization(width);
    return visualizationData.value;
  }
  
  async function getFrequencyData() {
    frequencyData.value = await audioEngine.getFrequencyData();
    return frequencyData.value;
  }

  return {
    isPlaying,
    volume,
    sampleRate,
  reverbWet,
    time,
    sample,
    visualizationData,
    frequencyData,
    playPause,
    setVolume,
  setReverbWet,
    setSampleRate,
    stop,
    reset,
    setExpression,
    getSampleForTime,
    updateVisualization,
    getFrequencyData
  };
});