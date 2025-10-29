<template>
  <div class="w-full h-[450px] p-2 flex flex-col gap-4">
    <!-- Theme Section -->
    <div class="flex flex-col gap-2">
      <div class="flex flex-row gap-4">
        <!-- Columna izquierda: selector de theme -->
        <div class="flex-1 flex flex-col gap-1">
          <label class="text-xs text-muted-foreground mb-1">Theme</label>
          <select 
            v-model="selectedTheme" 
            @change="changeTheme"
            class="w-full p-2 bg-transparent border rounded-md focus:outline-none focus:border-primary border-muted text-foreground"
          >
            <option 
              v-for="theme in themeStore.availableThemes" 
              :key="theme" 
              :value="theme"
            >
              {{ formatThemeName(theme) }}
            </option>
          </select>
        </div>
        <!-- Columna derecha: slider de hueRotation -->
        <div class="flex flex-col gap-1 min-w-[180px]">
          <label class="text-xs text-muted-foreground mb-1">Hue Rotation</label>
          <div class="flex items-center gap-2 mt-2">
            <Slider
              :min="0"
              :max="360"
              :step="1"
              :model-value="[themeStore.hueRotation]"
              @update:modelValue="onHueRotationChange"
              class="w-32"
            />
            <span class="text-xs text-muted-foreground">{{ themeStore.hueRotation }}°</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Visualizer Settings Section -->
    <div class="flex flex-col gap-2">
      <h3 class="text-sm font-bold text-primary">Visualizer</h3>

      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <select 
            v-model="selectedVisualizerType" 
            @change="changeVisualizerType"
            class="flex-1 p-2 bg-transparent border rounded-md focus:outline-none focus:border-primary border-muted text-foreground"
          >
            <option value="waveform">Waveform</option>
            <option value="frequency">Frequency Spectrum</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Font Size Section -->
    <div class="flex flex-col gap-2">
      <h3 class="text-sm font-bold text-primary">Stack Font Size</h3>
      <div class="flex items-center gap-4">
        <Slider
          :min="1.2"
          :max="4"
          :step="0.05"
          :model-value="[themeStore.fontSize]"
          @update:modelValue="onFontSizeChange"
          class="w-40"
        />
        <span class="text-xs text-muted-foreground">{{ themeStore.fontSize.toFixed(2) }} rem</span>
      </div>
    </div>

    <!-- Logger Settings Section -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-foreground">Show Logger</span>
        <Switch 
          :checked="logger.showLogs"
          @update:checked="toggleLogs"
        />
      </div>
    </div>
    
    <!-- Additional settings sections can be added here -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useThemeStore } from '@/stores/themeStore';
import { useLoggerStore } from '@/stores/loggerStore';
import { useUIStore } from '@/stores/uiStore';
import { useMainStore } from '@/stores/mainStore';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

const themeStore = useThemeStore();
const logger = useLoggerStore();
const uiStore = useUIStore();
const selectedTheme = ref(themeStore.theme);
const selectedVisualizerType = ref('waveform');

function onFontSizeChange(valArr) {
  const newSize = valArr[0];
  themeStore.setFontSize(newSize);
  logger.log('FONT', `Font size = ${newSize} rem`);
}
// Cambiar hueRotation global
function onHueRotationChange(valArr) {
  const newHue = valArr[0];
  themeStore.setHueRotation(newHue);
  logger.log('TIPOGRAFIA', `Hue rotation = ${newHue}°`);
}

// Debug system state - self-contained
const isDebugEnabled = ref(false);

onMounted(() => {
  // Ensure the selected theme matches the current theme
  selectedTheme.value = themeStore.theme;
  
  // Ensure the selected visualizer type matches the current state
  selectedVisualizerType.value = uiStore.visualizerType;
  
  // Load debug system state from localStorage
  const savedDebugState = localStorage.getItem('touchbit-debug-enabled');
  if (savedDebugState !== null) {
    isDebugEnabled.value = savedDebugState === 'true';
  }
});

function changeTheme() {
  themeStore.setTheme(selectedTheme.value);
  themeStore.saveThemePreference();
  logger.log('THEME', `Changed theme to: ${formatThemeName(selectedTheme.value)}`);
}

function formatThemeName(name) {
  // Capitalize the first letter and format names
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function changeVisualizerType() {
  const isPlaying = useMainStore().isPlaying;
  const previousType = uiStore.visualizerType;
  
  // Establecer el nuevo tipo de visualizador
  uiStore.setVisualizerType(selectedVisualizerType.value);
  uiStore.saveUISettings();
  
  // Registrar el cambio en el logger
  let logMessage;
  switch (selectedVisualizerType.value) {
    case 'waveform':
      logMessage = 'Waveform visualizer enabled';
      break;
    case 'frequency':
      logMessage = 'Frequency spectrum visualizer enabled';
      break;
    case 'none':
      logMessage = 'Visualizer disabled';
      break;
  }
  
  logger.log('SETTINGS', logMessage);
}

function toggleVisualizer(value) {
  uiStore.showVisualizer = value;
  uiStore.saveUISettings();
  logger.log('SETTINGS', value ? 'Visualizer enabled' : 'Visualizer disabled');
}

function toggleLogs(value) {
  logger.showLogs = value;
  logger.log('SETTINGS', value ? 'Logger enabled' : 'Logger disabled');
}

function toggleDebugSystem(value) {
  isDebugEnabled.value = value;
  
  // Save to localStorage
  localStorage.setItem('touchbit-debug-enabled', value.toString());
  
  // Emit event to notify debug system components
  window.dispatchEvent(new CustomEvent('debug-system-toggle', { 
    detail: { enabled: value } 
  }));
  
  // Log the change
  logger.log('SETTINGS', value ? 'Debug system enabled' : 'Debug system disabled');
}
</script>