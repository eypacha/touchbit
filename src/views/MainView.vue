<template>
  <div v-if="loading" class="absolute top-0 left-0 z-50 flex flex-col items-center justify-center w-full h-full bg-background">
    <Logo class="mb-4"/>
    <div>
      <Button variant="outline" class="border-action text-foreground" @click="initialize()">Start</Button>
    </div>
  </div>
  <div class="flex">
    <div class="w-full md:max-w-[450px]">
      <Toolbar />
      <main class="flex flex-col w-full h-[calc(100dvh-65px)] relative">
          <VisualizerCanvas/>
          <StackContainer/>
        <BottomContainer class="flex-0 h-[328px]"/>
      </main>
    </div>
    <div class="hidden md:block md:flex-1">
      <Sidepanel />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Button } from '@/components/ui/button'

import { useMainStore } from '@/stores/mainStore';
import { useThemeStore } from '@/stores/themeStore'; 

import Logo from '@/components/Logo.vue';
import Toolbar from "@/components/Toolbar.vue";
import StackContainer from "@/components/StackContainer.vue";
import BottomContainer from "@/components/BottomContainer.vue";
import VisualizerCanvas from "@/components/VisualizerCanvas.vue";
import Sidepanel from "@/components/Sidepanel.vue";

const store = useMainStore();
const themeStore = useThemeStore();

const loading = ref(true);

const prefersDarkScheme = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches;

onMounted(() => {
  themeStore.theme = prefersDarkScheme ? "dark" : "light";
  themeStore.updateTheme();
});

function initialize() {
  // Try to load from hash first, if none exists or fails, load default
  const loadedFromHash = store.loadExpressionFromHash();
  
  if (!loadedFromHash) {
    // Only set default if nothing was loaded from hash
    store.setExpression("t 64 & t 4 >> |");
  }
  
  loading.value = false;
}
</script>
