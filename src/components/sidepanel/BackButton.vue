<template>
  <div class="flex mb-2">
    <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(homePage)">{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({
  navigateTo: {
    type: Function,
    required: true
  },
  homePage: {
    type: Number,
    default: 0
  },
  label: {
    type: String,
    default: '← back'
  }
});
</script>
