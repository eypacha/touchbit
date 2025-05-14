<template>
  <div class="flex flex-col items-center">
    <div class="flex justify-center">
      <div v-for="(char, index) in characters" :key="index" class="flex flex-col items-center">
        <!-- Botón para incrementar (solo si es un dígito, no para el punto decimal) -->
        <button 
          v-if="char !== '.'"
          @click="incrementDigit(index)"
          class="px-2 py-1 text-lg transition-colors bg-transparent border-0 rounded cursor-pointer text-number hover:bg-number/10">
          <ChevronUp/>
        </button>
        <div v-else class="h-9"></div>
        
        <!-- Dígito o punto decimal -->
        <div
            class="flex items-center justify-center h-16 text-5xl font-bold text-number"
            :class="char === '.' ? 'w-4' : 'w-7'">
          {{ char }}
        </div>
        
        <!-- Botón para decrementar (solo si es un dígito, no para el punto decimal) -->
        <button 
          v-if="char !== '.'"
          @click="decrementDigit(index)"
          class="px-2 py-1 text-lg transition-colors bg-transparent border-0 rounded cursor-pointer text-number hover:bg-number/10">
          <ChevronDown/>
        </button>
        <div v-else class="h-9"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import {
  ChevronUp,
  ChevronDown,
} from 'lucide-vue-next';


const props = defineProps({
  value: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['update:value']);

// Convertir el número a un array de caracteres (incluyendo punto decimal)
const characters = computed(() => {
  return props.value.toString().split('');
});

// Función para incrementar un dígito específico
function incrementDigit(index) {
  const charArray = [...characters.value];
  if (charArray[index] === '.') return; // No hacer nada si es un punto decimal
  
  const currentValue = parseInt(charArray[index]);
  // Incrementar el dígito (volver a 0 después de 9)
  charArray[index] = (currentValue + 1) % 10;
  updateValue(charArray);
}

// Función para decrementar un dígito específico
function decrementDigit(index) {
  const charArray = [...characters.value];
  if (charArray[index] === '.') return; // No hacer nada si es un punto decimal
  
  const currentValue = parseInt(charArray[index]);
  // Decrementar el dígito (volver a 9 después de 0)
  charArray[index] = (currentValue - 1 + 10) % 10;
  updateValue(charArray);
}

// Función para actualizar el valor total y emitir el cambio
function updateValue(charArray) {
  const newValue = parseFloat(charArray.join(''));
  emit('update:value', newValue);
}
</script>