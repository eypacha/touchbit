<template>
  <div class="relative">
    <Logger v-if="logger.showLogs"/>
    <SampleDisplay />
    
    <!-- Tabs Navigation -->
    <div class="flex border-b border-border">
      <button 
        @click="activeTab = 'keyboard'" 
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'keyboard' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
        ]">
        Keyboard
      </button>
      <button 
        @click="activeTab = 'saves'" 
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'saves' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
        ]">
        Bytebeats
      </button>
      <button 
        @click="activeTab = 'audioSettings'" 
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'audioSettings' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
        ]">
        Audio
      </button>
      <button 
        @click="activeTab = 'visualSettings'" 
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'visualSettings' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
        ]">
        Visuals
      </button>
    </div>
    
    <!-- Tab Content -->
    <div>
      <Keyboard v-if="activeTab === 'keyboard'" />
      <AudioEffects v-else-if="activeTab === 'audioSettings'" />
      <Saves v-else-if="activeTab === 'saves'" />
      <VisualSettings v-else-if="activeTab === 'visualSettings'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useLoggerStore } from "@/stores/loggerStore";

import Logger from "@/components/common/Logger.vue";
import SampleDisplay from "@/components/audio/SampleDisplay.vue";
import Keyboard from '@/components/core/Keyboard.vue'
import AudioEffects from '@/components/audio/AudioSettings.vue';
import Saves from '@/components/core/Saves.vue'
import VisualSettings from '@/components/core/VisualSettings.vue'

const logger = useLoggerStore();
const activeTab = ref('keyboard'); // Default to keyboard tab
</script>
