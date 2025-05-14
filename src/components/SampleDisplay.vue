<template>
  <div class="absolute flex gap-1 px-2 text-2xl font-bold right-3 -top-9 drop-shadow">
    <span classs="text-foreground"">=</span>
    <span class="text-number">{{ formattedSample }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useMainStore } from '@/stores/mainStore';

const store = useMainStore();

// Formatea el valor de sample con padding de ceros
const formattedSample = computed(() => {
  return store.sample.toString().padStart(3, "0");
});
</script>