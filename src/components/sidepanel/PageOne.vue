<template>
  <div>
    <div class="flex mb-2">
      <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(-1)">← back</span>
    </div>
    <h1 class="mb-4 text-3xl font-bold">Page 1</h1>
    
    <p>This is page 1 content. You can add more detailed information here about different aspects of the system.</p>
    
    <div class="flex justify-between mt-8">
      <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(0)">← prev</span>
      <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(2)">next →</span>
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
