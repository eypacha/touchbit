export function useBitOperations(binaryValue, saveToHistory, updateToken) {
  
  // Invertir un bit específico
  function toggleBit(index) {
    if (index >= 0 && index < binaryValue.value.length) {
      saveToHistory();

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
    saveToHistory();

    let inverted = '';
    for (let i = 0; i < binaryValue.value.length; i++) {
      inverted += binaryValue.value[i] === '0' ? '1' : '0';
    }
    binaryValue.value = inverted;
    updateToken();
  }

  // Desplazar a la izquierda
  function leftShift() {
    saveToHistory();

    const trimmedBinary = binaryValue.value.replace(/^0+/, '') || '0';
    const decimalValue = parseInt(trimmedBinary, 2);
    const shiftedValue = decimalValue << 1;
    
    let newBinary = shiftedValue.toString(2);
    const remainder = newBinary.length % 8;
    const padding = remainder === 0 ? 0 : 8 - remainder;
    binaryValue.value = newBinary.padStart(newBinary.length + padding, '0');
    
    updateToken();
  }

  // Otras operaciones (rightShift, circularShifts, etc.)
  // ...

  return {
    toggleBit,
    invertBits,
    leftShift,
    // Exportar las demás funciones
  };
}