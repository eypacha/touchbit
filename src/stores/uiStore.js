import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUIStore = defineStore('ui', () => {
  // Uso de un único ref para el tipo de visualizador
  const visualizerType = ref('waveform'); // Puede ser 'waveform', 'frequency' o 'none'
  const activeTab = ref('keyboard'); // Puede ser 'keyboard', 'saves', 'audioSettings', 'visualSettings'

  // Usando computed para que sean reactivos
  const showVisualizer = computed(() => visualizerType.value === 'waveform');
  const showFrequencyVisualizer = computed(() => visualizerType.value === 'frequency');

  function toggleVisualizer() {
    if (visualizerType.value === 'waveform') {
      visualizerType.value = 'none';
    } else {
      visualizerType.value = 'waveform';
    }
  }
  
  function toggleFrequencyVisualizer() {
    if (visualizerType.value === 'frequency') {
      visualizerType.value = 'none';
    } else {
      visualizerType.value = 'frequency';
    }
  }
  
  function setVisualizerType(type) {
    if (['waveform', 'frequency', 'none'].includes(type)) {
      visualizerType.value = type;
    }
  }

  // Función para cambiar la tab activa
  function setActiveTab(tabId) {
    if (['keyboard', 'saves', 'audioSettings', 'visualSettings'].includes(tabId)) {
      activeTab.value = tabId;
    }
  }

  // Load settings from localStorage on initialization
  function initUISettings() {
    const savedVisualizerType = localStorage.getItem('touchbit-visualizer-type');
  
    if (savedVisualizerType !== null) {
      visualizerType.value = savedVisualizerType;
    }
    
  }

  // Save settings to localStorage
  function saveUISettings() {
    localStorage.setItem('touchbit-visualizer-type', visualizerType.value);
  }

  return {
    visualizerType,
    showVisualizer,
    showFrequencyVisualizer,
    toggleVisualizer,
    toggleFrequencyVisualizer,
    setVisualizerType,
    activeTab,
    setActiveTab,
    initUISettings,
    saveUISettings
  };
});
