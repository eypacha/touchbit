<template>
  <div class="absolute left-0 flex flex-col-reverse w-full h-24 p-2 overflow-hidden text-xs -top-24">
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
import { useLoggerStore } from '@/stores/loggerStore';
import { computed } from 'vue';

const logger = useLoggerStore();
const MAX_LOGS = 5;

const latestLogs = computed(() => {
  return logger.logs.slice(0,MAX_LOGS)
});
</script>

<style lang="scss" scoped>

  .log-entry {
    &:nth-child(1) {
      opacity: 1;
    }
    &:nth-child(2) {
      opacity: 0.65;
    }
    &:nth-child(3) {
      opacity: 0.50;
    }
    &:nth-child(4) {
      opacity: 0.25;
    }
    &:nth-child(5) {
      opacity: 0.10;
    }
  }
</style>