<template>
  <div v-if="loading" class="absolute top-0 left-0 z-50 flex flex-col items-center justify-center w-full h-full bg-background">
    <Logo class="mb-4"/>
    <div>
      <Button variant="outline" class="border-action text-foreground" @click="initialize()">Start</Button>
    </div>
  </div>

    <Toolbar />
    <main class="flex flex-col w-full h-[calc(100dvh-65px)]">
      <div class="relative h-full">

        <VisualizerCanvas/>
        <StackContainer class="h-full overflow-y-scroll"/> 
        <Logger/>
        <SampleDisplay />
      </div>
      <BottomContainer/>
    </main>
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
import Logger from "@/components/Logger.vue";
import SampleDisplay from "@/components/SampleDisplay.vue";

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

function initialize(){
  store.stack.value = [''];
  store.selectedToken = 0;
  loading.value = false;
}
</script>

<style lang="scss" module></style>
