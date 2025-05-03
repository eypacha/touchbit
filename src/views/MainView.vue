<template>
  <div v-if="loading" class="absolute top-0 left-0 z-50 flex flex-col items-center justify-center w-full h-full bg-background">
    <Logo class="mb-4"/>
    <div>
      <Button variant="outline" class="border-action text-foreground" @click="initialize()">Start</Button>
    </div>
  </div>

  <Toolbar />
  <main class="flex flex-col w-full h-full">
    <StackContainer />
    <BottomContainer />
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Button } from '@/components/ui/button'

import Logo from '@/components/Logo.vue';
import Toolbar from "@/components/Toolbar.vue";
import StackContainer from "@/components/StackContainer.vue";
import BottomContainer from "@/components/BottomContainer.vue";
import { useMainStore } from '@/stores/main';
import { useThemeStore } from '@/stores/themeStore'; 

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
