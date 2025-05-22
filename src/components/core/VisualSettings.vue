<template>
  <div class="w-full h-[450px] p-2 flex flex-col gap-4">
    <!-- Theme Section -->
    <div class="flex flex-col gap-2">
      <h3 class="text-sm font-bold text-primary">Theme</h3>
      
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <select 
            v-model="selectedTheme" 
            @change="changeTheme"
            class="flex-1 p-2 bg-transparent border rounded-md focus:outline-none focus:border-primary border-muted text-foreground"
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
      </div>
    </div>
    
    <!-- Logger Settings Section -->
    <div class="flex flex-col gap-2">
      <h3 class="text-sm font-bold text-primary">Debug</h3>
      
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
import { Switch } from '@/components/ui/switch';

const themeStore = useThemeStore();
const logger = useLoggerStore();
const selectedTheme = ref(themeStore.theme);

onMounted(() => {
  // Ensure the selected theme matches the current theme
  selectedTheme.value = themeStore.theme;
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

function toggleLogs(value) {
  logger.showLogs = value;
  logger.log('SETTINGS', value ? 'Logger enabled' : 'Logger disabled');
}
</script>