<template>
  <div class="relative">
    <Logger v-if="logger.showLogs"/>
    <SampleDisplay />

    <div class="flex border-b border-border">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="uiStore.setActiveTab(tab.id)" 
        :class="[
          'touch-manipulation p-2 text-sm font-medium',
          uiStore.activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
        ]">
        {{ tab.name }}
      </button>
    </div>
    <div>
      <Keyboard v-if="uiStore.activeTab === 'keyboard'" />
      <AudioEffects v-else-if="uiStore.activeTab === 'audioSettings'" />
      <Saves v-else-if="uiStore.activeTab === 'saves'" />
      <VisualSettings v-else-if="uiStore.activeTab === 'visualSettings'" />
    </div>
  </div>
</template>

<script setup>
import { useLoggerStore } from "@/stores/loggerStore";
import { useUIStore } from "@/stores/uiStore";

import Logger from "@/components/common/Logger.vue";
import SampleDisplay from "@/components/audio/SampleDisplay.vue";
import Keyboard from '@/components/core/Keyboard.vue'
import AudioEffects from '@/components/audio/AudioSettings.vue';
import Saves from '@/components/core/Saves.vue'
import VisualSettings from '@/components/core/VisualSettings.vue'

const logger = useLoggerStore();
const uiStore = useUIStore();

// Define the tabs array
const tabs = [
  { id: 'keyboard', name: 'Keyboard' },
  { id: 'saves', name: 'ByteBeats' },
  { id: 'audioSettings', name: 'Audio' },
  { id: 'visualSettings', name: 'Visual' },
];
</script>
