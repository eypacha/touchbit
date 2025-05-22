import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const showVisualizer = ref(true); // Control visibility of visualizer, true by default

  function toggleVisualizer() {
    showVisualizer.value = !showVisualizer.value;
  }

  // Load settings from localStorage on initialization
  function initUISettings() {
    const savedShowVisualizer = localStorage.getItem('touchbit-show-visualizer');
    
    if (savedShowVisualizer !== null) {
      showVisualizer.value = savedShowVisualizer === 'true';
    }
  }

  // Save settings to localStorage
  function saveUISettings() {
    localStorage.setItem('touchbit-show-visualizer', showVisualizer.value);
  }

  return {
    showVisualizer,
    toggleVisualizer,
    initUISettings,
    saveUISettings
  };
});
