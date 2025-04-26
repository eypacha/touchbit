import { ref } from "vue";
import { defineStore } from "pinia";
import { audioEngine } from "@/services/audioEngine";

export const useAudioStore = defineStore("audio", () => {
  const isPlaying = ref(false);
  const time = ref(0);
  const volume = ref(0.8);
  const sample = ref(0);
  const sampleRate = ref(8000);

  async function playPause(expression) {
    if (!isPlaying.value) {
      const result = await audioEngine.play();
      
      audioEngine.setExpressions([expression]);

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

  async function updateBytebeat(expression) {
    audioEngine.setExpressions([expression]);

    if (!isPlaying.value) {
      time.value = audioEngine.getTime();
      sample.value = await audioEngine.getSampleForTime();
    }
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

  return {
    isPlaying,
    time,
    volume,
    sample,
    sampleRate,
    playPause,
    setVolume,
    setSampleRate,
    stop,
    reset,
    updateBytebeat
  };
});