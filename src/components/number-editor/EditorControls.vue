<template>
  <div class="grid grid-cols-5 gap-2">
    <Key 
      color="action"
      class="text-xs"
      @click="$emit('toggleMode')">
      <span :class="{ 'opacity-50': mode !== NUMBER_MODE.BINARY }">bin</span>
      <span> </span>
      <span :class="{ 'opacity-50': mode !== NUMBER_MODE.DECIMAL }">dec</span>
    </Key>
    <Key color="action" @click="$emit('undo')">UNDO</Key>
    <Key color="action" @click="$emit('randomize')">RND</Key>
    <Key color="action" @click="$emit('max')">MAX</Key>
    <Key color="action" @click="$emit('min')">MIN</Key>

    <Key color="action" @click="$emit('invert')">~</Key>
    <Key color="action" @click="$emit('leftShift')">&lt;&lt;</Key>
    <Key color="action" @click="$emit('rightShift')">&gt;&gt;</Key>
    <Key color="action" @click="$emit('circularLeftShift')">c&lt;&lt;</Key>
    <Key color="action" @click="$emit('circularRightShift')">c&gt;&gt;</Key>
  </div>
</template>

<script setup>
import Key from '@/components/Key.vue';
import { NUMBER_MODE } from '@/constants/index.js';

defineProps({
  mode: {
    type: String,
    required: true
  }
});

defineEmits([
  'toggleMode', 
  'undo', 
  'randomize', 
  'max', 
  'min', 
  'invert', 
  'leftShift', 
  'rightShift', 
  'circularLeftShift', 
  'circularRightShift'
]);
</script>