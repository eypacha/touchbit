<template>
  <span 
    class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20 whitespace-nowrap"
    @click="onClick"
  >
    {{ code }}
  </span>
</template>

<script setup>
defineProps({
  code: {
    type: String,
    required: true
  },
  onClick: {
    type: Function,
    required: true
  }
});
</script>
