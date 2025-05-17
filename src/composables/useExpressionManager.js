import { computed } from 'vue';
import { convertBytesToHex } from "@/utils/convertUtils";

export function useExpressionManager(stack, holdMode, audioStore, logger) {
  // Expresión calculada desde el stack
  const getExpression = computed(() => {
    return stack.value
      .filter(item => item.type !== 'empty' && !item.disabled)
      .map(item => item.data)
      .join(' ');
  });

  // Función independiente para compresión LZMA
  function expressionToHash(expression) {
    if (!window.LZMA) return;
    
    try {
      const lzmaInstance = new window.LZMA("/vendors/lzma_worker.js");
      lzmaInstance.compress(expression, 1, (result) => {
        const compressedStr = convertBytesToHex(result);
        window.location.hash = `bb=${compressedStr}`;

        console.log('Expresión original:', expression);
        console.log('Expresión comprimida (LZMA):', compressedStr);
        console.log('Tamaño original:', expression.length, 'bytes');
        console.log('Tamaño comprimido:', result.length, 'bytes');
        console.log('Ratio de compresión:', (result.length / expression.length * 100).toFixed(2) + '%');
      });
    } catch (e) {
      console.error('Error al comprimir con LZMA:', e);
    }
  }

  async function evalBytebeat() {
    if(holdMode.value) return;
    
    const expression = getExpression.value;
    audioStore.setExpression(expression);
    
    expressionToHash(expression);
    
    if(!audioStore.isPlaying) {
      await audioStore.getSampleForTime();
    }
  }

  // Función para establecer la expresión desde un string
  function setExpression(expressionString, saveToHistory) {
    if (!expressionString) return;
    
    // Guardar el estado actual antes de la modificación
    saveToHistory();
    
    // Dividir la expresión en tokens individuales
    const tokens = expressionString.trim().split(/\s+/);
    
    // Crear un nuevo stack
    const newStack = [];
    
    // Procesar cada token
    for (const token of tokens) {
      if (token === 't') {
        newStack.push({ type: 'time', data: 't' });
      } else if (['+', '-', '*', '~', '/', '%', '&', '|', '^', '<<', '>>'].includes(token)) {
        newStack.push({ type: 'operator', data: token });
      } else if (!isNaN(token) || (token.includes('.') && !isNaN(parseFloat(token)))) {
        newStack.push({ type: 'number', data: token });
      } else {
        console.warn(`Token no reconocido: ${token}`);
        newStack.push({ type: 'operator', data: token });
      }
    }
    
    // Asegurarse de que hay al menos un token en el stack
    if (newStack.length === 0) {
      newStack.push({ type: 'empty', data: '' });
    }
    
    // Agregar un token vacío al final si no hay ninguno
    if (newStack[newStack.length - 1].type !== 'empty') {
      newStack.push({ type: 'empty', data: '' });
    }
    
    // Actualizar el stack
    stack.value = newStack;
    
    // Evaluar la expresión
    evalBytebeat();
    
    logger.log('EDIT', 'Expression loaded');
    
    return 0; // Devuelve la posición del token seleccionado
  }

  return {
    getExpression,
    setExpression,
    evalBytebeat,
    expressionToHash
  };
}