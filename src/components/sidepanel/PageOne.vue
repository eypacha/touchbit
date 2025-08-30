<template>
  <div class="pr-5 h-full flex flex-col">
    <BackButton :navigateTo="navigateTo" :homePage="0" />
    <div class="flex-1">
      <h1 class="mb-4 text-3xl font-bold">Tutorial</h1>
    
      <h2 class="mt-6 mb-2 text-2xl font-semibold">Notation</h2>
      <p>Touchbit uses <span class="italic">postfix notation</span>. This means <span class="font-bold">the operator comes after the operands</span>. For example, instead of writing <span class="font-bold">3 + 4</span>, you write <CodeExample code="3 4 +" :onClick="() => loadExample('3 4 +')" />. Click play to see the result in the bottom right corner. Then use the keyboard or double-click the tokens (once to select and again to edit) to change them and see the result.</p>
      
      <h2 class="mt-6 mb-2 text-2xl font-semibold">Bytebeat</h2>
      <p>But touchbit is not about learning notations, it's about <span class="font-bold">bytebeat</span>! Byteeat is a form of algorithmic music using expressions built from bit or bit operations.</p>
      <p class="mt-4">
        The simplest expression is <CodeExample code="t" :onClick="() => loadExample('t')" />, where t stands for time. At the end of every expression, there is always an implicit <span class="font-mono">modulo 256</span> operation (you don't need to write <CodeExample code="t 256 %" :onClick="() => loadExample('t 256 %')" />). This makes the output sound like a triangle wave.
      </p>
      
      <h2 class="mt-6 mb-2 text-2xl font-semibold">Modifying t</h2>
      <p>
        We can modify <span class="font-mono">t</span> by multiplying it with a value, for example <CodeExample code="t 4 *" :onClick="() => loadExample('t 4 *')" />. Try changing the number to higher and lower values to hear how the frequency changes. Now try <CodeExample code="t 2 /" :onClick="() => loadExample('t 2 /')" /> and change the number to higher values. What's happening? The frequency now starts to sound like a rhythm instead of a note.
      </p>
    </div>
    <NavigationButtons 
      :navigateTo="navigateTo" 
      :prevPage="0" 
      :nextPage="2" 
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
