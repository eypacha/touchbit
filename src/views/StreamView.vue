<template>
  <div v-if="loading" class="absolute top-0 left-0 z-50 flex flex-col items-center justify-center w-full h-full bg-background">
    <Logo class="mb-4"/>
    <div>
      <Button variant="outline" class="border-action text-foreground" @click="initialize()">Start</Button>
    </div>
  </div>
  <div class="flex">
    <div class="w-full">
    <main class="flex flex-col w-full h-[100dvh] relative">
      <Visualizers class="h-[100dvh]" width="1920" height="1080" :lineWidth="5"/>
      <StreamStackContainer/>
    </main>
    </div>
  </div>
  

</template>

<script setup>
import { ref, onMounted } from "vue";
import { Button } from '@/components/ui/button'

import { useMainStore } from '@/stores/mainStore';
import { useThemeStore } from '@/stores/themeStore'; 
import { useUIStore } from '@/stores/uiStore';

import Logo from '@/components/core/Logo.vue';
import StreamStackContainer from "@/components/layout/StreamStackContainer.vue";
import Visualizers from "@/components/core/Visualizers.vue";

const store = useMainStore();
const uiStore = useUIStore();

const loading = ref(true);

function initialize() {
  // Initialize UI settings
  uiStore.initUISettings();
  
  // Try to load from hash first, if none exists or fails, load default
  const loadedFromHash = store.loadExpressionFromHash();

  console.log("Loaded from hash:", loadedFromHash);
  
  if (!loadedFromHash) {
    // Only set default if nothing was loaded from hash
    store.setExpression("t 64 & t 4 >> |");
  }
  
  loading.value = false;
}
</script>
