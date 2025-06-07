<template>
  <div>
    <BackButton :navigateTo="navigateTo" :homePage="0" />
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
    <NavigationButtons 
      :navigateTo="navigateTo" 
      :prevPage="2" 
      :nextPage="null" 
      customClass="mt-8" 
    />
  </div>
</template>

<script setup>
import { NavigationButtons, BackButton } from '@/components/sidepanel';

defineProps({
  navigateTo: {
    type: Function,
    required: true
  }
});
</script>
