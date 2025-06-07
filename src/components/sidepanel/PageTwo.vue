<template>
  <div class="pr-5">
    <BackButton :navigateTo="navigateTo" :homePage="0" />
    <h1 class="mb-4 text-3xl font-bold">Bitwise Operations</h1>
    
    <h2 class="mt-6 mb-2 text-2xl font-semibold">Bit by Bit</h2>
    <p>Unlike arithmetic operations that work on entire numbers, <span class="font-bold">bitwise operations</span> work <span class="italic">bit by bit</span>. This means each corresponding bit position in the operands is evaluated independently.</p>

    <h2 class="mt-6 mb-2 text-2xl font-semibold">Binary Shifts</h2>
    <p>Binary shifts move bits left or right: Left Shift <<  multiplies by 2, and Right Shift >> divides by 2.</p>

    <h3 class="mt-5 mb-2 text-xl font-medium">Rhythmic Effects</h3>
    <p>Shifts create interesting rhythmic effects. Try: <CodeExample code="t 9 >> t 8 >> &" :onClick="() => loadExample('t 9 >> t 8 >> &')" />. The <span class="font-mono">&</span> operator performs a bitwise AND, creating patterns based on bit matches.</p>

    <p class="mt-3">Experiment with these operators to discover new sounds and patterns. Remember that in postfix notation, order matters a lot.</p>
    
    <NavigationButtons 
      :navigateTo="navigateTo" 
      :prevPage="1" 
      :nextPage="3" 
      customClass="mt-8" 
    />
  </div>
</template>

<script setup>
import { NavigationButtons, BackButton, CodeExample } from '@/components/sidepanel';

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
