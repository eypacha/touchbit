import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const showVisualizer = ref(true); // Control visibility of waveform visualizer, true by default
  const showFrequencyVisualizer = ref(false); // Control visibility of frequency visualizer, false by default
  const visualizerType = ref('waveform'); // 'waveform' or 'frequency'

  function toggleVisualizer() {
    showVisualizer.value = !showVisualizer.value;
  }
  
  function toggleFrequencyVisualizer() {
    showFrequencyVisualizer.value = !showFrequencyVisualizer.value;
  }
  
  function setVisualizerType(type) {
    if (type === 'waveform') {
      showVisualizer.value = true;
      showFrequencyVisualizer.value = false;
    } else if (type === 'frequency') {
      showVisualizer.value = false;
      showFrequencyVisualizer.value = true;
    } else if (type === 'none') {
      showVisualizer.value = false;
      showFrequencyVisualizer.value = false;
    }
    visualizerType.value = type;
  }

  // Load settings from localStorage on initialization
  function initUISettings() {
    const savedShowVisualizer = localStorage.getItem('touchbit-show-visualizer');
    const savedShowFreqVisualizer = localStorage.getItem('touchbit-show-frequency-visualizer');
    const savedVisualizerType = localStorage.getItem('touchbit-visualizer-type');
    
    if (savedShowVisualizer !== null) {
      showVisualizer.value = savedShowVisualizer === 'true';
    }
    
    if (savedShowFreqVisualizer !== null) {
      showFrequencyVisualizer.value = savedShowFreqVisualizer === 'true';
    }
    
    if (savedVisualizerType !== null) {
      visualizerType.value = savedVisualizerType;
    }
  }

  // Save settings to localStorage
  function saveUISettings() {
    localStorage.setItem('touchbit-show-visualizer', showVisualizer.value);
    localStorage.setItem('touchbit-show-frequency-visualizer', showFrequencyVisualizer.value);
    localStorage.setItem('touchbit-visualizer-type', visualizerType.value);
  }

  return {
    showVisualizer,
    showFrequencyVisualizer,
    visualizerType,
    toggleVisualizer,
    toggleFrequencyVisualizer,
    setVisualizerType,
    initUISettings,
    saveUISettings
  };
});
