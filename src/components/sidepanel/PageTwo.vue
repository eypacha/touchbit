<template>
  <div>
    <div class="flex mb-2">
      <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(-1)">← back</span>
    </div>
    <h1 class="mb-4 text-3xl font-bold">Page 2</h1>
    
    <p>This is page 2 content. You can continue adding more information about advanced features here.</p>
    
    <div class="flex justify-between mt-8">
      <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(1)">← prev</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  navigateTo: {
    type: Function,
    required: true
  }
});
</script>
