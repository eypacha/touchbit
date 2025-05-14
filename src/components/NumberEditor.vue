<template>
  <div class="flex flex-col w-full h-full gap-2">
    <div class="flex flex-col items-center justify-center flex-1 overflow-auto text-center border border-number">
      <div 
        v-for="(byteGroup, byteIndex) in groupedBits" 
        :key="'byte-' + byteIndex" 
        class="flex mb-1 last:mb-0"
      >
        <button
          v-for="(bit, bitIndex) in byteGroup"
          :key="`bit-${byteIndex * 8 + bitIndex}-${bit}`"
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
          @click="undo">
          bin dec
        </Key>
        <Key 
          color="action"
          @click="undo">
          UNDO
        </Key>
        <Key 
          color="action"
          @click="randomizeBits">
          RND
        </Key>
        <Key 
          color="action"
          @click="maxBytes">
          MAX
        </Key>
        <Key 
          color="action"
          @click="minBytes">
          MIN
        </Key>

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
const binaryHistory = ref([]);

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
    // Save current state to history before changing
    binaryHistory.value.push(binaryValue.value);

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
  // Save current state to history before changing
  binaryHistory.value.push(binaryValue.value);

  let inverted = '';
  for (let i = 0; i < binaryValue.value.length; i++) {
    inverted += binaryValue.value[i] === '0' ? '1' : '0';
  }
  binaryValue.value = inverted;
  updateToken();
}

function leftShift() {
  // Save current state to history before changing
  binaryHistory.value.push(binaryValue.value);

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
  // Save current state to history before changing
  binaryHistory.value.push(binaryValue.value);

  const firstBit = binaryValue.value.charAt(0);
  binaryValue.value = binaryValue.value.slice(1) + firstBit;
  updateToken();
}

// Desplazar bits a la derecha
function rightShift() {
  // Save current state to history before changing
  binaryHistory.value.push(binaryValue.value);

  binaryValue.value = '0' + binaryValue.value.slice(0, -1);
  updateToken();
}

function circularRightShift() {
  // Save current state to history before changing
  binaryHistory.value.push(binaryValue.value);

  const lastBit = binaryValue.value.charAt(binaryValue.value.length - 1);
  binaryValue.value = lastBit + binaryValue.value.slice(0, -1);
  updateToken();
}

// Generate random bits while maintaining the same byte length
function randomizeBits() {
  // Save current state to history before changing
  binaryHistory.value.push(binaryValue.value);

  // Get the current length of the binary value (already a multiple of 8)
  const currentLength = binaryValue.value.length;
  
  // Generate a random binary string of the same length
  let randomBinary = '';
  for (let i = 0; i < currentLength; i++) {
    randomBinary += Math.random() < 0.5 ? '0' : '1';
  }
  
  // Update the binary value
  binaryValue.value = randomBinary;
  
  // Update the token
  updateToken();
}

// Set all bits to 1 (maximum value for the current byte length)
function maxBytes() {
  // Save current state to history before changing
  binaryHistory.value.push(binaryValue.value);

  // Get the current length of the binary value (already a multiple of 8)
  const currentLength = binaryValue.value.length;
  
  // Create a string of all '1's with the same length
  const maxBinary = '1'.repeat(currentLength);
  
  // Update the binary value
  binaryValue.value = maxBinary;
  
  // Update the token
  updateToken();
}

// Set the minimum value for the current byte range
function minBytes() {
  // Save current state to history before changing
  binaryHistory.value.push(binaryValue.value);

  // Get the current length of the binary value in bytes
  const currentByteLength = binaryValue.value.length / 8;
  
  // Use the pattern 2^(8*(n-1)) for n bytes
  const minValue = Math.pow(2, 8 * (currentByteLength - 1));
  
  // Convert to binary
  let binary = minValue.toString(2);
  
  // Ensure it's padded to the current multiple of 8
  const currentLength = binaryValue.value.length;
  binary = binary.padStart(currentLength, '0');
  
  // Update the binary value
  binaryValue.value = binary;
  
  // Update the token
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

// Implement the undo function
function undo() {
  if (binaryHistory.value.length > 0) {
    // Get the last saved state
    const previousValue = binaryHistory.value.pop();
    
    // Set the binary value to the previous state
    binaryValue.value = previousValue;
    
    // Update the token with the previous value
    updateToken();
  }
}
</script>