<template>
  <div class="grid grid-cols-5 gap-2">
    <Key 
      color="action"
      class="text-xs"
      @click="$emit('toggleMode')">
      <span :class="{ 'opacity-40': mode !== NUMBER_MODE.BINARY }">bin</span>
      <span> </span>
      <span :class="{ 'opacity-40': mode !== NUMBER_MODE.DECIMAL }">dec</span>
    </Key>
    <Key color="action" @click="$emit('undo')">UNDO</Key>
    <Key color="action" @click="$emit('randomize')">
        <Shuffle/>
    </Key>
    <Key color="action" @click="$emit('max')">
        <MoveUp/>
    </Key>
    <Key color="action" @click="$emit('min')">
        <MoveDown/>
    </Key>

    <Key color="action" @click="$emit('invert')">~</Key>
    <Key color="action" @click="$emit('leftShift')">
        <ChevronsLeft/>
    </Key>
    <Key color="action" @click="$emit('rightShift')">
        <ChevronsRight/>
    </Key>
    <Key color="action" @click="$emit('circularLeftShift')">
        <div class="flex items-center justify-center">
            <div>c</div><ChevronsLeft/>
        </div>
    </Key>
    <Key color="action" @click="$emit('circularRightShift')">
        <div class="flex items-center justify-center">
            <div>c</div><ChevronsRight/>
        </div>
    </Key>
  </div>
</template>

<script setup>
import {
  MoveUp,
  MoveDown,
  ChevronsLeft,
  ChevronsRight,
  Shuffle,
} from 'lucide-vue-next';

import Key from '@/components/common/Key.vue';
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