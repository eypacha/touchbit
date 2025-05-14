<template>
  <div class="flex flex-col w-full h-full gap-2">
    <div class="flex flex-col items-center justify-center flex-1 overflow-auto text-center border border-number">
      <div 
        v-for="(byteGroup, byteIndex) in groupedBits" 
        :key="byteIndex" 
        class="flex mb-1 last:mb-0"
      >
        <button
          v-for="(bit, bitIndex) in byteGroup"
          :key="bitIndex"
          @click="toggleBit(byteIndex * 8 + bitIndex)"
          class="flex items-center justify-center w-[35px] h-15 text-5xl font-bold bg-transparent text-number hover:bg-number/10"
        >
          {{ bit }}
        </button>
      </div>
    </div>
    
    <div class="mt-auto">
      <div class="grid grid-cols-5 gap-2">
        <Key 
          color="action"
          @click="invertBits">
          ~
        </Key>
        <Key
          color="action"
          @click="leftShift">
          &lt;&lt;
        </Key>
        <Key 
        color="action"
          @click="rightShift">
          &gt;&gt;
        </Key>
        <Key
          color="action"
          @click="circularLeftShift">
          c&lt;&lt;
        </Key>
        <Key 
          color="action"
          @click="circularRightShift">
          c&gt;&gt;
        </Key>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import Key from '@/components/Key.vue';

import { useMainStore } from '@/stores/mainStore';

const store = useMainStore();
const binaryValue = ref("");

// Función para actualizar el valor binario desde el token
function updateBinaryFromToken() {
  const selectedTokenIndex = store.selectedToken;
  if (selectedTokenIndex >= 0 && selectedTokenIndex < store.stack.length) {
    const token = store.stack[selectedTokenIndex];
    if (token && token.type === 'number') {
      // Convertir a binario y asegurar que es múltiplo de 8 bits
      let binary = Number(token.data).toString(2);
      
      // Calcular cuántos bits se necesitan añadir
      const remainder = binary.length % 8;
      const padding = remainder === 0 ? 0 : 8 - remainder;
      
      // Añadir los ceros necesarios al principio
      binary = binary.padStart(binary.length + padding, '0');
      
      binaryValue.value = binary;
    }
  }
}

// Inicializar al montar
onMounted(updateBinaryFromToken);

// Observar cambios en el token seleccionado o en cualquier token del stack
watch(
  () => [store.selectedToken, [...store.stack]],
  () => {
    updateBinaryFromToken();
  },
  { deep: true }
);

// Array con los bits individuales agrupados en bytes (múltiplos de 8)
const bitsArray = computed(() => {
  if (!binaryValue.value) return Array(8).fill('0');
  
  // Asegurar que siempre tenemos un múltiplo de 8 bits
  const binary = binaryValue.value.padStart(
    Math.ceil(binaryValue.value.length / 8) * 8,
    '0'
  );
  
  return binary.split('');
});

// Group bits into chunks of 8 for display
const groupedBits = computed(() => {
  const result = [];
  for (let i = 0; i < bitsArray.value.length; i += 8) {
    result.push(bitsArray.value.slice(i, i + 8));
  }
  return result;
});

// Invertir un bit específico
function toggleBit(index) {
  if (index >= 0 && index < bitsArray.value.length) {
    const bits = [...bitsArray.value];
    bits[index] = bits[index] === '0' ? '1' : '0';
    
    // Actualizar el valor binario preservando el formato
    binaryValue.value = bits.join('');
    
    // Remover ceros a la izquierda para el cálculo, pero preservar múltiplos de 8
    const trimmed = binaryValue.value.replace(/^0+/, '') || '0';
    const remainder = trimmed.length % 8;
    const padding = remainder === 0 ? 0 : 8 - remainder;
    binaryValue.value = trimmed.padStart(trimmed.length + padding, '0');
    
    updateToken();
  }
}

// Invertir todos los bits
function invertBits() {
  let inverted = '';
  for (let i = 0; i < binaryValue.value.length; i++) {
    inverted += binaryValue.value[i] === '0' ? '1' : '0';
  }
  binaryValue.value = inverted;
  updateToken();
}

function leftShift() {
  // Calculate the decimal value, shift it left by 1 bit, then convert back to binary
  const trimmedBinary = binaryValue.value.replace(/^0+/, '') || '0';
  const decimalValue = parseInt(trimmedBinary, 2);
  const shiftedValue = decimalValue << 1;
  
  let newBinary = shiftedValue.toString(2);
  const remainder = newBinary.length % 8;
  const padding = remainder === 0 ? 0 : 8 - remainder;
  binaryValue.value = newBinary.padStart(newBinary.length + padding, '0');
  
  updateToken();
}

function circularLeftShift() {
  const firstBit = binaryValue.value.charAt(0);
  binaryValue.value = binaryValue.value.slice(1) + firstBit;
  updateToken();
}

// Desplazar bits a la derecha
function rightShift() {
  binaryValue.value = '0' + binaryValue.value.slice(0, -1);
  updateToken();
}

function circularRightShift() {
  const lastBit = binaryValue.value.charAt(binaryValue.value.length - 1);
  binaryValue.value = lastBit + binaryValue.value.slice(0, -1);
  updateToken();
}

// Actualizar el token con el nuevo valor
function updateToken() {
  // Eliminar ceros a la izquierda para el cálculo del valor decimal
  const trimmedBinary = binaryValue.value.replace(/^0+/, '') || '0';
  const decimalValue = parseInt(trimmedBinary, 2);
  
  // Modificar el token seleccionado
  store.modToken({
    type: 'number',
    data: decimalValue.toString()
  });
}
</script>