<template>
  <div class="w-full max-w-[450px] h-[300px] keyboard p-2" @touchstart.stop.passive @mousedown.stop @keydown="handleKeyDown">
    <div v-if="!store.isBinaryEditor" class="grid grid-cols-12 gap-2 ">
      <Key v-for="(key, index) in layout"
        :key="index"
        :color="key.color ?? key.type"
        :class="getColSpan(key.width)"
        :disabled="key.disabled"
        :active="isKeyActive(key)"
        @touchstart.stop.passive="handleTouchStart(key.type, key.data, $event)"
        @mousedown.stop="handleTouchStart(key.type, key.data, $event)"
        @touchend="handleTouchEnd(key.type, key.data, $event)"
        @mouseup="handleTouchEnd(key.type, key.data, $event)"
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
    <BinaryEditor v-else/>
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useMainStore } from '@/stores/mainStore'
import Key from '@/components/common/Key.vue'
import BinaryEditor from '@/components/core/NumberEditor.vue'

import { layout } from  '@/constants/keyboard'

const store = useMainStore()
const pressTimer = ref(null);
const longPressThreshold = 600;
const isLongPress = ref(false);
const currentKey = ref(null); 

// Add space key functionality (not on the physical keyboard)
const spaceKey = { type: 'space', data: ' ', key: ' ' };

// Handle keyboard input
const handleKeyDown = (event) => {
  // Skip if user is typing in an input field or textarea
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }
  
  const key = event.key;
  
  // Handle space key separately (since it's not in the layout)
  if (key === ' ') {
    keyPressed(spaceKey.type, spaceKey.data);
    event.preventDefault();
    return;
  }
  
  // Find matching key in our layout
  const keyItem = layout.find(item => item.key === key);
  if (keyItem) {
    // Simulate the same behavior as if the key was clicked
    keyPressed(keyItem.type, keyItem.data);
    
    // Prevent default browser behavior for certain keys
    if (['ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'].includes(key)) {
      event.preventDefault();
    }
  }
};

const keyPressed = (type, data) => {
  store.keyPressed(type, data)

  // hackry for dot key. Bug unsolved: the first dot key press is not registered
  if(type !== 'dot') return
  setTimeout(() => {
    store.keyPressed('dot', data)
  }, 10)
  
}

const longPress = (type, data) => {
  store.keyLongPressed(type, data)
}

const handleTouchStart = (type, data, event) => {
  event.stopPropagation();
  
  const keyInfo = layout.find(key => key.type === type && key.data === data);
  currentKey.value = keyInfo;
  
  isLongPress.value = false;

  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
  }
  
  if (keyInfo && keyInfo.longPress) {
    pressTimer.value = setTimeout(() => {
      isLongPress.value = true;
      longPress(type, data);
    }, longPressThreshold);
  }
}

const handleTouchEnd = (type, data, event) => {
  event.preventDefault();
  
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
  
  const keyInfo = currentKey.value;
  
  if (!isLongPress.value || !keyInfo || !keyInfo.longPress) {
    keyPressed(type, data);
  }
  
  currentKey.value = null;
}

const handleTouchCancel = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
  currentKey.value = null;
}

const getColSpan = (width) => `col-span-${width ?? 2}`

const isKeyActive = (key) => {
  if (key.type === 'action' && key.data === 'HOLD') {
    return store.holdMode;
  }
  return false;
}
</script>
