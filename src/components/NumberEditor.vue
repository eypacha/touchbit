<template>
  <div class="flex flex-col w-full h-full gap-2">
    <div class="flex flex-col items-center justify-center flex-1 overflow-auto text-center border border-number">
      <!-- Usar el visualizador binario o decimal según el modo -->
      <BinaryDisplay 
        v-if="numberMode === NUMBER_MODE.BINARY" 
        :grouped-bits="groupedBits" 
        @toggle-bit="toggleBit" 
      />
      <DecimalDisplay 
        v-else 
        :value="getDecimalValue()"
        @update:value="updateDecimalValue" 
      />
    </div>
    
    <div class="mt-auto">
      <EditorControls 
        :mode="numberMode"
        @toggle-mode="toggleNumberMode"
        @undo="undo"
        @randomize="randomizeBits"
        @max="maxBytes"
        @min="minBytes"
        @invert="invertBits"
        @left-shift="leftShift"
        @right-shift="rightShift"
        @circular-left-shift="circularLeftShift"
        @circular-right-shift="circularRightShift"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { NUMBER_MODE } from '@/constants/index.js';
import { useMainStore } from '@/stores/mainStore';
import { useBinaryEditor } from '@/composables/useBinaryEditor';
import { useBitOperations } from '@/composables/useBitOperations';

// Importar componentes
import BinaryDisplay from '@/components/number-editor/BinaryDisplay.vue';
import DecimalDisplay from '@/components/number-editor/DecimalDisplay.vue';
import EditorControls from '@/components/number-editor/EditorControls.vue';

const store = useMainStore();

// Usar composables
const {
  binaryValue,
  binaryHistory,
  numberMode,
  updateBinaryFromToken,
  saveToHistory,
  updateToken,
  bitsArray,
  groupedBits,
  toggleNumberMode,
  undo
} = useBinaryEditor(store, NUMBER_MODE.BINARY);

// Usar operaciones de bits
const {
  toggleBit,
  invertBits,
  leftShift,
  rightShift,
  circularLeftShift,
  circularRightShift,
  randomizeBits,
  maxBytes,
  minBytes
} = useBitOperations(binaryValue, saveToHistory, updateToken);


// Función para obtener el valor decimal (determina si es float o int)
function getDecimalValue() {
  const binValue = binaryValue.value;
  const decValue = parseInt(binValue, 2);
  
  // Verificar si el token original es un float
  const selectedTokenIndex = store.selectedToken;
  if (selectedTokenIndex >= 0 && selectedTokenIndex < store.stack.length) {
    const token = store.stack[selectedTokenIndex];
    if (token && token.type === 'number' && String(token.data).includes('.')) {
      // Si es un float, convertir manteniendo la parte decimal
      return parseFloat(token.data);
    }
  }
  
  return decValue;
}

// Función para manejar cambios en el valor decimal
function updateDecimalValue(newValue) {
  saveToHistory();
  
  // Determinar si es un float o un int
  const isFloat = newValue.toString().includes('.');
  
  let binary;
  if (isFloat) {
    // Para floats, convertir a int para representación binaria
    // (aquí puedes implementar una lógica más compleja para manejar floats en binario si es necesario)
    binary = Math.floor(newValue).toString(2);
  } else {
    // Para ints, conversión directa
    binary = newValue.toString(2);
  }
  
  // Asegurar que sea múltiplo de 8 bits
  const remainder = binary.length % 8;
  const padding = remainder === 0 ? 0 : 8 - remainder;
  binary = binary.padStart(binary.length + padding, '0');
  
  // Actualizar el valor binario
  binaryValue.value = binary;
  
  // Actualizar el token
  store.modToken({
    type: 'number',
    data: newValue.toString() // Mantiene el punto decimal para floats
  });
}

// Inicializar y observar cambios
onMounted(updateBinaryFromToken);

watch(
  () => [store.selectedToken, [...store.stack]],
  updateBinaryFromToken,
  { deep: true }
);
</script>