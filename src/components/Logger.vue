<template>
  <div class="absolute bottom-0 left-0 flex flex-col-reverse w-full h-24 p-2 overflow-auto text-xs">
      <div 
        v-for="logEntry in latestLogs" 
        :key="logEntry.id"
        class="log-entry"
      >
        <span>{{ logEntry.emoji }} {{ logEntry.message }}</span>
      </div>
  </div>
</template>

<script setup>
import { useLoggerStore } from '@/stores/logger';
import { computed } from 'vue';

const logger = useLoggerStore();

const latestLogs = computed(() => {
  return [...logger.logs.slice(0, 5)]
});
</script>

<style lang="scss" scoped>

  .log-entry {
    &:nth-child(1) {
      opacity: 1;
    }
    &:nth-child(2) {
      opacity: 0.8;
    }
    &:nth-child(3) {
      opacity: 0.6;
    }
    &:nth-child(4) {
      opacity: 0.4;
    }
    &:nth-child(5) {
      opacity: 0.2;
    }
  }
</style>