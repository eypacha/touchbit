<template>
  <div>
    <div class="flex mb-2">
      <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(-1)">← back</span>
    </div>
    <h1 class="mb-4 text-3xl font-bold">Tutorial</h1>
    
    <h2 class="mt-6 mb-2 text-2xl font-semibold">Notation</h2>
    <p>Touchbit uses <span class="italic">postfix notation</span> to write expressions. This means <span class="font-bold">the operator comes after the operands</span>. For example, instead of writing <span class="font-bold">3 + 4</span>, you write <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="loadExample('3 4 +')">3 4 +</span>. Click the previews to see the result in the bottom right corner. Then use the keyboard or double-click the tokens (once to select and again to edit) to change them and see the result.</p>
    
    <h2 class="mt-6 mb-2 text-2xl font-semibold">Bytebeat</h2>
    <p>But touchbit is not about lear notations, it's about <span class="font-bold">bytebeat</span>!, a form of algorithmic music, using bit to bit operations.</p>
    
    <div class="flex justify-between mt-8">
      <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(-1)">← prev</span>
      <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(1)">next →</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  navigateTo: {
    type: Function,
    required: true
  },
  loadExample: {
    type: Function,
    required: true
  }
});
</script>
