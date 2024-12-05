<template>
  <div v-if="loading" class="flex flex-col items-center justify-center absolute top-0 left-0 w-full h-full bg-background z-50">
    <Logo class="mb-4"/>
    <div>
      <Button variant="outline" class="border-action text-foreground" @click="initialize()">Start</Button>
    </div>
  </div>

  <Toolbar />
  <main class="w-full h-full flex flex-col">
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

const store = useMainStore();

const loading = ref(true);

const prefersDarkScheme = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches;

onMounted(() => {
  store.theme = prefersDarkScheme ? "dark" : "light";
  store.updateTheme();
});

function initialize(){
  store.stack.value = [''];
  store.selectedToken = 0;
  loading.value = false;
}
</script>

<style lang="scss" module></style>
