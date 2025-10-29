<template>
  <div
    class="h-svh flex flex-col dark:border-gray-800 "
    :style="hueRotationStyle"
  >
    <RouterView />
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from "vue-router";
import { useThemeStore } from './stores/themeStore';
import { computed } from 'vue';

const themeStore = useThemeStore();
const hueRotationStyle = computed(() => ({ filter: `hue-rotate(${themeStore.hueRotation}deg)` }));
</script>
