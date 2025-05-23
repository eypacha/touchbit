import { computed } from 'vue';
import { convertBytesToHex, convertHexToBytes } from "@/utils/convertUtils";
import { getAssetPath } from "@/utils/pathUtils";

export function useExpressionManager(stack, holdMode, audioStore, logger) {
  // Expresión calculada desde el stack
  const expressionValue = computed(() => {
    return stack.value
      .filter(item => item.type !== 'empty' && !item.disabled)
      .map(item => item.data)
      .join(' ');
  });

  // Función independiente para compresión LZMA
  function expressionToHash(expression) {
    if (!window.LZMA) return;
    
    try {
      // Get correct path for the worker
      const workerPath = getAssetPath('vendors/lzma_worker.js');
      const lzmaInstance = new window.LZMA(workerPath);
      lzmaInstance.compress(expression, 1, (result) => {
        const compressedStr = convertBytesToHex(result);
        
        // Get current sample rate and add it to the hash
        const sampleRate = audioStore.sampleRate;
        window.location.hash = `s=${sampleRate}&bb=${compressedStr}`;
        
        console.log('Expression compressed, sample rate:', sampleRate);
      });
    } catch (e) {
      console.error('Error compressing with LZMA:', e);
    }
  }

  async function evalBytebeat() {
    if(holdMode.value) return;
    
    const expression = expressionValue.value;
    audioStore.setExpression(expression);
    
    expressionToHash(expression);
    
    if(!audioStore.isPlaying) {
      await audioStore.getSampleForTime();
    }
  }

  // Token manipulation functions
  function newToken(token, index, saveToHistory) {
    saveToHistory();
    stack.value.splice(index, 1, token);
    evalBytebeat();
  }

  function modToken(mod, index, saveToHistory) {
    if (index < 0 || index >= stack.value.length) {
      console.error(`Índice ${index} fuera de rango. Stack actual:`, stack.value);
      return;
    }

    if (typeof mod !== 'object' || mod === null) {
      console.error(`El modToken debe ser un objeto. Valor recibido:`, mod);
      return;
    }

    saveToHistory();
    const originalToken = stack.value[index];

    stack.value[index] = {
      ...originalToken,
      ...mod,
    };

    evalBytebeat();
  }

  function insertToken(index, saveToHistory) {
    saveToHistory();
    stack.value.splice(index, 0, { type: 'empty', data: '' });
  }

  function delToken(index, saveToHistory) {
    if (index < 0) return false;

    saveToHistory();
    stack.value.splice(index, 1);
    evalBytebeat();

    // Return true if token was deleted
    return true;
  }

  function delAllTokens(saveToHistory) {
    saveToHistory();
    stack.value = [{ type: 'empty', data: '' }];
    logger.log('EDIT', 'All tokens deleted');
    evalBytebeat();
    return 0; // Return index of first token
  }

  // Función para establecer la expresión desde un string
  function setExpression(expressionString, saveToHistory) {
    if (!expressionString) return 0;
    
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

  // Function to load expression from URL hash
  function loadExpressionFromHash() {
    try {
      const hash = window.location.hash.substring(1); // Remove #

      
      // Parse hash parameters
      const params = {};
      hash.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) params[key] = value;
      });

      
      let expressionLoaded = false;
      
      // Handle sample rate parameter
      if (params.s && !isNaN(params.s)) {
        const sampleRate = parseInt(params.s, 10);
        if (sampleRate >= 1000 && sampleRate <= 48000) {
          audioStore.setSampleRate(sampleRate);

        }
      } 
      
      // Handle bytebeat expression parameter
      if (params.bb) {
        const compressedHex = params.bb;
        const compressedData = convertHexToBytes(compressedHex);
        
        if (!window.LZMA) {
          logger.log('ERROR', 'LZMA library not loaded');
          return false;
        }
        
        // Get correct path for the worker
        const workerPath = getAssetPath('vendors/lzma_worker.js');
        const lzmaInstance = new window.LZMA(workerPath);
        lzmaInstance.decompress(compressedData, (result, error) => {
          if (error) {
            logger.log('ERROR', `Failed to decompress expression: ${error}`);
            return;
          }
          
          console.log('INFO', 'Expression loaded from URL!',result);
          setExpression(result, () => {}); // No history save for initial load
        });
        
        expressionLoaded = true;
      }
      
      return expressionLoaded;
    } catch (e) {
      logger.log('ERROR', `Error loading from hash: ${e.message}`);
    }
    
    return false;
  }

  return {
    // Core expression functions
    expressionValue,
    evalBytebeat,
    expressionToHash,
    setExpression,
    loadExpressionFromHash, // Add this to the returned object
    
    // Token manipulation functions
    newToken,
    modToken,
    insertToken,
    delToken,
    delAllTokens
  };
}