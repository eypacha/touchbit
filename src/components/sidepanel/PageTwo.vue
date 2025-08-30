<template>
  <div class="pr-5 h-full flex flex-col">
    <BackButton :navigateTo="navigateTo" :homePage="0" />
    <div class="flex-1">
      <h1 class="mb-4 text-3xl font-bold">Bitwise Operations</h1>
    
      <h2 class="mt-6 mb-2 text-2xl font-semibold">Bit by Bit</h2>
  <p>Unlike arithmetic operations that work on entire numbers, <span class="font-bold">bitwise operations</span> work <span class="italic">bit by bit</span>. This means each corresponding bit position in the operands is evaluated independently. Each operator has different uses depending on the context. Below, we will explore some examples of how these some of this operators can be applied musically:</p>


      <h2 class="mt-6 mb-2 text-2xl font-semibold">Binary Shifts: &lt;&lt; and &gt;&gt;</h2>
      <p>
        Binary shifts move bits left or right: Left Shift <span class="font-mono">&lt;&lt;</span> multiplies by 2, and Right Shift <span class="font-mono">&gt;&gt;</span> divides by 2.
        If the result sounds like a note <CodeExample code="t 2 <<" :onClick="() => loadExample('t 2 <<')" />, increasing the number will raise the pitch by one octave each step.
        If it sounds like a rhythm <CodeExample code="t 4 >>" :onClick="() => loadExample('t 4 >>')" />, increasing the number will halve the tempo.
      </p>

      <h3 class="mt-5 mb-2 text-xl font-semibold">AND Operator: &amp;</h3>
      <p>
        The <span class="font-mono">&amp;</span> operator can shape the sound by putting a ceiling on the amplitude. Sometimes it can make the wave square <CodeExample code="t 64 &" :onClick="() => loadExample('t 64 &')" /> (using powers of two), or shape the wave with harmonics <CodeExample code="t 92 &" :onClick="() => loadExample('t 92 &')" />.
        Try changing the numbers and discover different sounds. In other cases can be uses to "add" patters <CodeExample code="t 5 >> t 3 >> &" :onClick="() => loadExample('t 5 >> t 3 >> &')" /> or sounds making chords. 
      </p>
      <h3 class="mt-5 mb-2 text-xl font-semibold">OR Operator: &vert;</h3>
      <p>
        The <span class="font-mono">&vert;</span> operator also can shape the sound by putting a floor on the amplitude: <CodeExample code="t 220 |" :onClick="() => loadExample('t 220 |')" />. In other cases also like the & can be uses to make sounds sound "together" making new patterns or chords:  <CodeExample code="t 5 * t 3 * &" :onClick="() => loadExample('t 5 * t 3 * &')" /> 
      </p>

      

    </div>
    <NavigationButtons 
      :navigateTo="navigateTo" 
      :prevPage="1" 
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
