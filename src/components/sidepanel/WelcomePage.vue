<template>
  <div>
    <h1 class="mb-4 text-3xl font-bold">Touchbit!</h1>
    <p>Touchbit is a <span class="italic">mobile-friendly</span> interface for composing and performing live bytebeat music using postfix expressions.</p>
    
    <h2 class="mt-6 mb-2 text-2xl font-semibold">Bytebeat</h2>
    <p>Bytebeat is a form of algorithmic <span class="font-bold">music that uses bitwise operations</span> to generate sound, with only one variable t representing time. The expression is evaluated for each sample of the 8bits audio output..</p>
    
    <h2 class="mt-6 mb-2 text-2xl font-semibold">Examples</h2>
    <p>Click the expression to load it.</p>
    <ul class="list-disc ml-6 space-y-1.5 mb-4">
      <li><span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="loadExample('t t 8 >> &')">t t 8 >> &</span>: <span class="font-bold">Minimal Sierpinski</span></li>
      <li><span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="loadExample('t 92 | .896 * 96 |')">t 92 | .896 * 96 |</span>: <span class="font-bold">hardcOR</span> by Gede</li>
      <li><span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="loadExample('t t 4 >> | 0.999 *')">t t 4 >> | 0.999 *</span>: <span class="font-bold">untaunta</span> by eypacha</li>
      <li><span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="loadExample('t 13 >> t ~ 12 >> | 7 % t * 96 &')">t 13 >> t ~ 12 >> | 7 % t * 96 &</span>: <span class="font-bold">this != copla</span> by eypacha</li>
      <li><span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="loadExample('t t 10 >> 42 & t *')">t t 10 >> 42 & t *</span>: <span class="font-bold">42 Melody</span></li>
      <li><span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="loadExample('t 255 % t 511 & ^ 3 *')">t 255 % t 511 & ^ 3 *</span>: <span class="font-bold">Starlost</span> from Glitch Machine</li>
    </ul>
    
    <h2 class="mt-6 mb-2 text-2xl font-semibold">Shortcuts</h2>
    <p>This interface is designed primarily for mobile, but... if you're using it on a computer, these shortcuts might come in handy. First, click any button on the keyboard to activate focus. Now you can press keys to enter tokens. Other keys:</p>
    <ul class="list-disc ml-6 space-y-1.5 mb-4">
      <li><span class="font-bold">&lt;</span>      Right Shift</li>
      <li><span class="font-bold">&gt;</span>       Left Shift</li>
      <li><span class="font-bold">Space</span>   Play/Pause</li>
      <li><span class="font-bold">U</span>       Undo</li>
      <li><span class="font-bold">R</span>       Redo</li>
      <li><span class="font-bold">I</span>       Insert</li>
      <li><span class="font-bold">H</span>       Hold</li>
    </ul>
    
    <div class="flex justify-end mt-8">
      <span class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(0)">tutorial →</span>
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
