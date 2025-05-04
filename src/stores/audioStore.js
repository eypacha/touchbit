import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useLoggerStore } from "@/stores/loggerStore";
import { audioEngine } from "@/services/audioEngine";

export const useAudioStore = defineStore("audio", () => {
  const logger = useLoggerStore();
  
  // Estado relacionado con audio
  const isPlaying = ref(false);
  const volume = ref(0.8);
  const sampleRate = ref(8000);
  const time = ref(0);
  const sample = ref(0);
  const visualizationData = ref(null);
  
  async function playPause(expression) {
    logger.log('AUDIO', isPlaying.value ? 'PAUSE' : 'PLAY');
    
    if (!isPlaying.value) {
      const result = await audioEngine.play();
      
      // Aquí recibimos la expresión como parámetro en lugar de acceder directamente
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

  return {
    isPlaying,
    volume,
    sampleRate,
    time,
    sample,
    visualizationData,
    playPause,
    setVolume,
    setSampleRate,
    stop,
    reset,
    setExpression,
    getSampleForTime,
    updateVisualization
  };
});