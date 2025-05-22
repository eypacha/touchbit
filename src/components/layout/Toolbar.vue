<template>
  <header class="flex w-full gap-1 p-3 border-b bg-card">
    <Key @click="store.playPause()" class="border-input">
      <Play v-if="!store.isPlaying"/>
      <Square v-else/>
    </Key>
    <Key @click="store.reset()" class="border-input">
      <RotateCcw/>
    </Key>
    <Key @click="toggleTimeFormat" class="flex justify-end flex-1 border-input">
      <span class="text-time">
        {{ displayTime }}
      </span>
    </Key>
    <Key @click="shareFeature.shareContent" class="border-input">
      <Share/>
    </Key>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'; // Import ref and computed

import Key from '@/components/common/Key.vue'

import { Play, RotateCcw, Square, Share } from 'lucide-vue-next';
import { useMainStore } from '@/stores/mainStore'
import { useThemeStore } from '@/stores/themeStore'; 
import { useShare } from '@/composables/useShare';

const store = useMainStore()
const shareFeature = useShare()

const showFormattedTime = ref(false); 

const formattedTime = computed(() => {
  const totalSeconds = Math.floor(store.time / store.sampleRate);
  const totalMinutes = Math.floor(totalSeconds / 60);
  
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    const minutes = totalMinutes;
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
});

const displayTime = computed(() => {
  return showFormattedTime.value ? formattedTime.value : store.time;
});

function toggleTimeFormat() {
  console.log('time', store.time)
  console.log('sampleRate', store.sampleRate)
  showFormattedTime.value = !showFormattedTime.value;
}

</script>
