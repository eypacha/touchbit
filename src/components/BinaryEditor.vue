<template>
  <div class="flex flex-col w-full h-full gap-2 p-2">
    <div class="mb-2 overflow-x-auto text-center whitespace-nowrap">
      <div class="inline-flex">
        <button
          v-for="(bit, index) in bitsArray"
          :key="index"
          @click="toggleBit(index)"
          class="flex items-center justify-center w-[35px] h-20 text-5xl font-bold bg-transparent  text-number hover:bg-number/10"
        >
          {{ bit }}
        </button>
      </div>
    </div>
    
    <div class="mt-auto">
      <div class="grid grid-cols-5 gap-2">
        <button 
          class="py-2 bg-transparent border rounded-md border-action text-action"
          @click="invertBits">
          ~
        </button>
        <button 
          class="py-2 bg-transparent border rounded-md border-action text-action"
          @click="leftShift">
          &lt;&lt;
        </button>
        <button 
          class="py-2 bg-transparent border rounded-md border-action text-action"
          @click="rightShift">
          &gt;&gt;
        </button>
        <button 
          class="py-2 bg-transparent border rounded-md border-action text-action"
          @click="circularLeftShift">
          c&lt;&lt;
        </button>
        <button 
          class="py-2 bg-transparent border rounded-md border-action text-action"
          @click="circularRightShift">
          c&gt;&gt;
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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

// Desplazar bits a la izquierda
function leftShift() {
  binaryValue.value = binaryValue.value.slice(1) + '0';
  updateToken();
}
function circularLeftShift() {
    //
}

// Desplazar bits a la derecha
function rightShift() {
  binaryValue.value = '0' + binaryValue.value.slice(0, -1);
  updateToken();
}

function circularRightShift() {
    //
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