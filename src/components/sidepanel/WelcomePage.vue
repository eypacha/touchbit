<template>
  <div class="h-full flex flex-col">
    <div class="flex-1">
      <h1 class="mb-4 text-3xl font-bold">Touchbit!</h1>
      <p>Touchbit is a <span class="italic">mobile-friendly</span> interface for composing and performing live bytebeat music using postfix expressions.</p>
      
      <h2 class="mt-6 mb-2 text-2xl font-semibold">Bytebeat</h2>
      <p>Bytebeat is a form of algorithmic <span class="font-bold">music that uses bitwise operations</span> to generate sound, with only one variable t representing time. The expression is evaluated for each sample of the 8bits audio output.</p>
      
      <h2 class="mt-6 mb-2 text-2xl font-semibold">Examples</h2>
      <p>Click the expression to load it.</p>
      <ul class="list-disc ml-6 space-y-1.5 mb-4">
        <li><CodeExample code="t t 8 >> &" :onClick="() => loadExample('t t 8 >> &')" />: <span class="font-bold">Minimal Sierpinski</span></li>
        <li><CodeExample code="t 92 | .896 * 96 |" :onClick="() => loadExample('t 92 | .896 * 96 |')" />: <span class="font-bold">hardcOR</span> by Gede</li>
        <li><CodeExample code="t t 4 >> | 0.999 *" :onClick="() => loadExample('t t 4 >> | 0.999 *')" />: <span class="font-bold">untaunta</span> by eypacha</li>
        <li><CodeExample code="t 13 >> t ~ 12 >> | 7 % t * 96 &" :onClick="() => loadExample('t 13 >> t ~ 12 >> | 7 % t * 96 &')" />: <span class="font-bold">this != copla</span> by eypacha</li>
        <li><CodeExample code="t t 10 >> 42 & t *" :onClick="() => loadExample('t t 10 >> 42 & t *')" />: <span class="font-bold">42 Melody</span></li>
        <li><CodeExample code="t 255 % t 511 & ^ 3 *" :onClick="() => loadExample('t 255 % t 511 & ^ 3 *')" />: <span class="font-bold">Starlost</span> from Glitch Machine</li>
      </ul>
    </div>
    
    <NavigationButtons 
      :navigateTo="navigateTo" 
      :prevPage="null" 
      :nextPage="1" 
      :nextLabel="'tutorial'" 
      customClass="mt-8" 
    />
  </div>
</template>

<script setup>
import { NavigationButtons, CodeExample } from '@/components/sidepanel';

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
