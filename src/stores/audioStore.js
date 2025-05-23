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
      if (result) {
        isPlaying.value = false;
        renderLoop();
      }
    }
  }

  function setVolume(vol, rampTime) {
    volume.value = vol;
    audioEngine.setVolume(vol, rampTime);
  }

  function setSampleRate(rate) {
    sampleRate.value = rate;
    audioEngine.setSampleRate(sampleRate.value);
    logger.log('AUDIO', `Sample Rate: ${rate}`);
  }
  
  async function stop() {
    const result = await audioEngine.stop();
    time.value = 0;
    if (result) {
      isPlaying.value = false;
    }
  }

  async function reset() {
    await audioEngine.reset();
    time.value = 0;
  }

  function setExpression(expression) {
    audioEngine.setExpressions([expression]);
    logger.log('COMPILE', `COMPILE: ${expression}`);
  }

  async function getSampleForTime() {
    sample.value = await audioEngine.getSampleForTime();
    return sample.value;
  }

  function renderLoop() {
    const updateTime = async () => {
      if (isPlaying.value) {
        time.value = audioEngine.getTime();
        sample.value = await audioEngine.getSampleForTime();
        requestAnimationFrame(updateTime);
      }
    };
    
    requestAnimationFrame(updateTime);
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
    time,
    sample,
    visualizationData,
    frequencyData,
    playPause,
    setVolume,
    setSampleRate,
    stop,
    reset,
    setExpression,
    getSampleForTime,
    updateVisualization,
    getFrequencyData
  };
});