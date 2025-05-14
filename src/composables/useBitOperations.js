export function useBitOperations(binaryValue, saveToHistory, updateToken, ensureIntegerValue) {
  
  // Función auxiliar para asegurar que trabajamos con enteros antes de cada operación
  function prepareOperation() {
    saveToHistory();
    
    // Si se proporcionó la función para asegurar enteros, la ejecutamos
    if (ensureIntegerValue && typeof ensureIntegerValue === 'function') {
      ensureIntegerValue();
    }
  }
  
  // Invertir un bit específico
  function toggleBit(index) {
    if (index >= 0 && index < binaryValue.value.length) {
      prepareOperation();
      
      const bits = [...binaryValue.value.split('')];
      bits[index] = bits[index] === '0' ? '1' : '0';
      
      binaryValue.value = bits.join('');
      
      // Mantener formato de múltiplos de 8
      const trimmed = binaryValue.value.replace(/^0+/, '') || '0';
      const remainder = trimmed.length % 8;
      const padding = remainder === 0 ? 0 : 8 - remainder;
      binaryValue.value = trimmed.padStart(trimmed.length + padding, '0');
      
      updateToken();
    }
  }

  // Invertir todos los bits
  function invertBits() {
    prepareOperation();

    let inverted = '';
    for (let i = 0; i < binaryValue.value.length; i++) {
      inverted += binaryValue.value[i] === '0' ? '1' : '0';
    }
    binaryValue.value = inverted;
    updateToken();
  }

  // Desplazar a la izquierda
  function leftShift() {
    prepareOperation();

    const trimmedBinary = binaryValue.value.replace(/^0+/, '') || '0';
    const decimalValue = parseInt(trimmedBinary, 2);
    const shiftedValue = decimalValue << 1;
    
    let newBinary = shiftedValue.toString(2);
    const remainder = newBinary.length % 8;
    const padding = remainder === 0 ? 0 : 8 - remainder;
    binaryValue.value = newBinary.padStart(newBinary.length + padding, '0');
    
    updateToken();
  }

  // Desplazar bits a la derecha
  function rightShift() {
    prepareOperation();

    binaryValue.value = '0' + binaryValue.value.slice(0, -1);
    updateToken();
  }

  // Desplazamiento circular a la izquierda
  function circularLeftShift() {
    prepareOperation();

    const firstBit = binaryValue.value.charAt(0);
    binaryValue.value = binaryValue.value.slice(1) + firstBit;
    updateToken();
  }

  // Desplazamiento circular a la derecha
  function circularRightShift() {
    prepareOperation();

    const lastBit = binaryValue.value.charAt(binaryValue.value.length - 1);
    binaryValue.value = lastBit + binaryValue.value.slice(0, -1);
    updateToken();
  }

  // Generar un valor aleatorio
  function randomizeBits() {
    prepareOperation();

    let randomBinary = '';
    for (let i = 0; i < binaryValue.value.length; i++) {
      randomBinary += Math.random() < 0.5 ? '0' : '1';
    }
    
    binaryValue.value = randomBinary;
    updateToken();
  }

  // Establecer todos los bits al máximo (1)
  function maxBytes() {
    prepareOperation();

    // Get the current length of the binary value (already a multiple of 8)
    const currentLength = binaryValue.value.length;
    
    // Create a string of all '1's with the same length
    const maxBinary = '1'.repeat(currentLength);
    
    // Update the binary value
    binaryValue.value = maxBinary;
    
    updateToken();
  }

  // Establecer todos los bits al mínimo (0)
  function minBytes() {
    prepareOperation();

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
    
    updateToken();
  }

  return {
    toggleBit,
    invertBits,
    leftShift,
    rightShift,
    circularLeftShift,
    circularRightShift,
    randomizeBits,
    maxBytes,
    minBytes
  };
}