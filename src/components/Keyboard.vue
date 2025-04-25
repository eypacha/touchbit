<template>
  <div class="grid w-full h-full grid-cols-12 gap-2">
    <Key v-for="(key, index) in layout"
      :key="index"
      :color="key.color ?? key.type"
      :class="getColSpan(key.width)"
      :disabled="key.disabled"
      @touchstart="handleTouchStart(key.type, key.data, $event)"
      @touchend="handleTouchEnd(key.type, key.data, $event)"
      @touchcancel="handleTouchCancel()">
      <ChevronsLeft v-if="key.data === '<<'" />
      <ChevronsRight v-else-if="key.data === '>>'" />
      <Delete v-else-if="key.data === 'BCKS'"/>
      <BetweenHorizontalEnd v-else-if="key.data === 'STACK'" stroke="hsl(var(--number))"/>
      <Pi v-else-if="key.data === 'FUNC'" stroke="hsl(var(--number))"/>
      <Share v-else-if="key.data === 'SHARE'" stroke="hsl(var(--number))"/>
      <MoveLeft v-else-if="key.data === 'LEFT'" />
      <MoveRight v-else-if="key.data === 'RIGHT'"/>
      <Delete v-else-if="key.data === 'BCKS'" />
      <template v-else> {{ key.data }} </template>
    </Key>
  </div>
</template>

<script setup>
import {
  Delete,
  MoveLeft,
  MoveRight,
  ChevronsLeft,
  ChevronsRight,
  Share,
  Pi,
  BetweenHorizontalEnd
} from 'lucide-vue-next';
import { ref } from 'vue';
import { useMainStore } from '@/stores/main'
import Key from '@/components/Key.vue'

import { layout } from  '@/constants/keyboard'

const store = useMainStore()
const pressTimer = ref(null);
const longPressThreshold = 500; // 500ms threshold for long press
const isLongPress = ref(false);

const keyPressed = (type, data) => {
  store.keyPressed(type, data)
}

const longPress = (type, data) => {
  store.keyLongPressed(type, data)
}

const handleTouchStart = (type, data, event) => {

  isLongPress.value = false;

  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
  }
  
  pressTimer.value = setTimeout(() => {
    isLongPress.value = true;
    longPress(type, data);
  }, longPressThreshold);
}

const handleTouchEnd = (type, data, event) => {
  event.preventDefault();
  
  clearTimeout(pressTimer.value);
  
  if (!isLongPress.value) {
    keyPressed(type, data);
  }
  
  pressTimer.value = null;
}

const handleTouchCancel = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
}

const getColSpan = (width) => `col-span-${width ?? 2}`
</script>
