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
  
  let currentValue = parseInt(charArray[index]);
  
  if (currentValue < 9) {
    charArray[index] = (currentValue + 1).toString();
  } else { // currentValue es 9, así que se convierte en '0'
    charArray[index] = '0';
    // Intentar acarrear al dígito de la izquierda
    let currentIndexToCarry = index - 1;
    while (currentIndexToCarry >= 0) {
      if (charArray[currentIndexToCarry] === '.') {
        currentIndexToCarry--; // Saltar el punto decimal
        continue;
      }
      
      let digitToModify = parseInt(charArray[currentIndexToCarry]);
      if (digitToModify < 9) {
        charArray[currentIndexToCarry] = (digitToModify + 1).toString();
        break; // Acarreo exitoso, detener la propagación
      } else { // digitToModify es 9, se convierte en '0'
        charArray[currentIndexToCarry] = '0';
        // Continuar acarreando al siguiente dígito a la izquierda
        currentIndexToCarry--;
      }
    }
    // Si currentIndexToCarry < 0 y el primer dígito (o el único dígito si index era 0)
    // se convirtió en '0' debido al acarreo o porque era '9' originalmente.
    // Esto significa que necesitamos añadir un '1' al principio del número.
    // Ej: "9.9" -> "10.0", "99" -> "100", "9" -> "10"
    if (currentIndexToCarry < 0 && charArray[0] === '0') {
      // Si el acarreo se propagó hasta el inicio y el primer carácter es '0',
      // (o si el número original era '9' y se convirtió en '0'),
      // prependemos '1' al array.
      charArray.unshift('1');
    }
  }
  
  updateValue(charArray);
}

// Función para decrementar un dígito específico
function decrementDigit(index) {
  const charArray = [...characters.value];
  if (charArray[index] === '.') return; // No hacer nada si es un punto decimal
  
  let digitValue = parseInt(charArray[index]);
  
  if (digitValue > 0) {
    charArray[index] = (digitValue - 1).toString();
  } else { // digitValue es 0, así que se convierte en '9'
    charArray[index] = '9';
    // Intentar tomar prestado del dígito de la izquierda
    let currentIndexToBorrow = index - 1;
    while (currentIndexToBorrow >= 0) {
      if (charArray[currentIndexToBorrow] === '.') {
        currentIndexToBorrow--; // Saltar el punto decimal
        continue;
      }
      
      let digitToModify = parseInt(charArray[currentIndexToBorrow]);
      if (digitToModify > 0) {
        charArray[currentIndexToBorrow] = (digitToModify - 1).toString();
        break; // Préstamo exitoso, detener la propagación
      } else { // digitToModify es 0, se convierte en '9'
        charArray[currentIndexToBorrow] = '9';
        // Continuar tomando prestado del siguiente dígito a la izquierda
        currentIndexToBorrow--;
      }
    }
    // Si currentIndexToBorrow < 0, significa que el préstamo se propagó hasta el inicio
    // o no había más dígitos de los cuales tomar prestado.
    // Ej: "0.0" decrementado en el último "0" se convierte en "9.9" (parseFloat lo interpreta así)
    // Ej: "100" decrementado en el último "0" se convierte en "099" (parseFloat lo interpreta como 99)
  }
  
  updateValue(charArray);
}

// Función para actualizar el valor total y emitir el cambio
function updateValue(charArray) {
  const newValue = parseFloat(charArray.join(''));
  emit('update:value', newValue);
}
</script>