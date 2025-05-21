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
        @click="activeTab = 'effects'" 
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'effects' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
        ]">
        Audio
      </button>
      <button 
        @click="activeTab = 'saves'" 
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'saves' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
        ]">
        Bytebeats
      </button>
    </div>
    
    <!-- Tab Content -->
    <div class="h-[450px]">
      <Keyboard v-if="activeTab === 'keyboard'" />
      <AudioEffects v-else-if="activeTab === 'effects'" />
      <Saves/>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useLoggerStore } from "@/stores/loggerStore";

import Logger from "@/components/Logger.vue";
import SampleDisplay from "@/components/SampleDisplay.vue";
import Keyboard from '@/components/Keyboard.vue'
import Saves from '@/components/Saves.vue'
import AudioEffects from '@/components/AudioSettings.vue';

const logger = useLoggerStore();
const activeTab = ref('keyboard'); // Default to keyboard tab
</script>
