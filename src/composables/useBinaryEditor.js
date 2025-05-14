import { ref, computed, watch } from 'vue';
import { NUMBER_MODE } from '@/constants/index.js';

export function useBinaryEditor(store, initialMode) {
  const binaryValue = ref("");
  const binaryHistory = ref([]);
  const numberMode = ref(initialMode);

  // Actualizar valor binario desde un token
  function updateBinaryFromToken() {
    const selectedTokenIndex = store.selectedToken;
    if (selectedTokenIndex >= 0 && selectedTokenIndex < store.stack.length) {
      const token = store.stack[selectedTokenIndex];
      if (token && token.type === 'number') {
        let binary = Number(token.data).toString(2);
        const remainder = binary.length % 8;
        const padding = remainder === 0 ? 0 : 8 - remainder;
        binary = binary.padStart(binary.length + padding, '0');
        binaryValue.value = binary;
      }
    }
  }

  // Guardar estado actual en historial
  function saveToHistory() {
    binaryHistory.value.push(binaryValue.value);
  }

  // Actualizar token con nuevo valor
  function updateToken() {
    const trimmedBinary = binaryValue.value.replace(/^0+/, '') || '0';
    const decimalValue = parseInt(trimmedBinary, 2);
    
    store.modToken({
      type: 'number',
      data: decimalValue.toString()
    });
  }

  // Array de bits y grupos
  const bitsArray = computed(() => {
    if (!binaryValue.value) return Array(8).fill('0');
    
    const binary = binaryValue.value.padStart(
      Math.ceil(binaryValue.value.length / 8) * 8,
      '0'
    );
    
    return binary.split('');
  });

  const groupedBits = computed(() => {
    const result = [];
    for (let i = 0; i < bitsArray.value.length; i += 8) {
      result.push(bitsArray.value.slice(i, i + 8));
    }
    return result;
  });

  // Cambiar modo de visualización
  function toggleNumberMode() {
    numberMode.value = numberMode.value === NUMBER_MODE.BINARY 
      ? NUMBER_MODE.DECIMAL 
      : NUMBER_MODE.BINARY;
  }

  // Deshacer último cambio
  function undo() {
    if (binaryHistory.value.length > 0) {
      binaryValue.value = binaryHistory.value.pop();
      updateToken();
    }
  }

  return {
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
  };
}