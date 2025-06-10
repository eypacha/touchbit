<template>
  <div class="w-full max-w-[450px] h-[300px] keyboard p-2 mx-auto" @touchstart.stop.passive @mousedown.stop @keydown="handleKeyDown">
    <div v-if="!store.isBinaryEditor" class="grid grid-cols-12 gap-2">
      <div v-for="(key, index) in layout" :key="index" 
          :class="getColSpan(key.width)" class="relative">
          <div v-if="key.submenu && !key.disabled && openSubmenu === key.data"
            class="absolute flex submenu-container -top-9 bg-background outline-1 outline outline-time z-2"
            :style="{ left: key.position + 'px' }">
              <button v-for="button in key.submenu"
                :key="button.data"
                class="h-8 w-[50px] font-bold"
                :class="[
                  `text-${button.color || button.type}`,
                  `border-${button.color || button.type}`
                ]"
                @touchstart.stop.passive="handleTouchStart(button.type, button.data, $event)"
                @mousedown.stop="handleTouchStart(button.type, button.data, $event)"
                @touchend="handleTouchEnd(button.type, button.data, $event)"
                @mouseup="handleTouchEnd(button.type, button.data, $event)"
                @touchcancel="handleTouchCancel()">
              {{ button.data }}
            </button>
          </div>
        <Key 
          class="w-full"
          :color="key.color ?? key.type"
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
          <Pi v-else-if="key.data === 'MATH'" stroke="hsl(var(--number))"/>
          <div v-else-if="key.data === 'LOGIC'" stroke="hsl(var(--number))">=</div>
          <MoveLeft v-else-if="key.data === 'LEFT'" />
          <MoveRight v-else-if="key.data === 'RIGHT'"/>
          <Delete v-else-if="key.data === 'BCKS'" />
          <template v-else> {{ key.data }} </template>
        </Key>
      </div>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/mainStore'
import Key from '@/components/common/Key.vue'
import BinaryEditor from '@/components/core/NumberEditor.vue'

import { layout } from  '@/constants/keyboard'

const store = useMainStore()
const pressTimer = ref(null);
const longPressThreshold = 600;
const isLongPress = ref(false);
const currentKey = ref(null);
const openSubmenu = ref(null); // Para controlar qué submenú está abierto

// Handle click outside to close submenu
const handleClickOutside = (event) => {
  if (openSubmenu.value) {
    const submenuElement = document.querySelector('.submenu-container');
    if (submenuElement && !submenuElement.contains(event.target)) {
      openSubmenu.value = null;
    }
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
}); 

// Add space key functionality (not on the physical keyboard)
const spaceKey = { type: 'space', data: ' ', key: ' ' };

// Handle keyboard input
const handleKeyDown = (event) => {
  const key = event.key;
  
  // Check for spacebar to toggle play/pause
  if (key === ' ' || key === 'Spacebar') {
    store.playPause();
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
  // Primero verificar si es una tecla con submenú
  const keyWithSubmenu = layout.find(key => key.data === data && key.submenu);
  
  if (keyWithSubmenu) {
    // Toggle del submenú
    if (openSubmenu.value === data) {
      openSubmenu.value = null; // Cerrar si ya está abierto
    } else {
      openSubmenu.value = data; // Abrir el submenú
    }
    return; // No ejecutar la acción normal
  }
  
  // Si es un elemento del submenú, cerrar el submenú después de ejecutar
  const isSubmenuItem = layout.some(key => 
    key.submenu && key.submenu.some(subItem => subItem.data === data)
  );
  
  if (isSubmenuItem) {
    openSubmenu.value = null; // Cerrar submenú después de seleccionar
  }
  
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
