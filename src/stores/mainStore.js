import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useThemeStore } from "./themeStore";
import { useLoggerStore } from "@/stores/loggerStore";
import { useAudioStore } from "./audioStore"; 
import { useExpressionManager } from "@/composables/useExpressionManager";
import { useNavigationManager } from "@/composables/useNavigationManager";

export const useMainStore = defineStore("main", () => {
  const logger = useLoggerStore();
  const audioStore = useAudioStore();

  const selectedToken = ref(0);
  const currentNumber = ref("");
  const isEditingNumber = ref(false);
  const isBinaryEditor = ref(false); 
  const holdMode = ref(false);

  const history = ref([]);
  const historyIndex = ref(-1);
  const maxHistorySize = 50;

  const stack = ref([]);

  // Usar el composable de gestión de expresiones
  const expressionManager = useExpressionManager(stack, holdMode, audioStore, logger);
  
  // Usar el composable de navegación
  const navigationManager = useNavigationManager(selectedToken, stack);

  function initHistory() {
    history.value = [JSON.stringify(stack.value)];
    historyIndex.value = 0;
  }

  // Llamar a initHistory al inicio
  initHistory();

  function saveToHistory() {
    // Si estamos en medio del historial, eliminar los estados futuros
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    
    // Agregar el estado actual al historial
    history.value.push(JSON.stringify(stack.value));
    historyIndex.value = history.value.length - 1;
    
    // Limitar el tamaño del historial
    if (history.value.length > maxHistorySize) {
      history.value = history.value.slice(history.value.length - maxHistorySize);
      historyIndex.value = history.value.length - 1;
    }
  }

  // Función para deshacer (undo)
  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      stack.value = JSON.parse(history.value[historyIndex.value]);
      logger.log('EDIT', 'Undo');
      evalBytebeat();
    } else {
      logger.log('INFO', 'Nothing to undo');
    }
  }

  // Función para rehacer (redo)
  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      stack.value = JSON.parse(history.value[historyIndex.value]);
      logger.log('EDIT', 'Redo');
      evalBytebeat();
    } else {
      logger.log('INFO', 'Nothing to redo');
    }
  }
  const getExpression = computed(() => {
    return stack.value
      .filter(item => item.type !== 'empty' && !item.disabled)
      .map(item => item.data)
      .join(' ');
  });

  // Delegamos funciones de audio al AudioStore
  async function playPause() {
    await audioStore.playPause(getExpression.value);
  }

  function setVolume(vol, rampTime) {
    audioStore.setVolume(vol, rampTime);
  }

  function setSampleRate(rate) {
    audioStore.setSampleRate(rate);
  }
  
  async function stop() {
    await audioStore.stop();
  }

  async function reset() {
    await audioStore.reset();
  }

  // Función independiente para compresión LZMA
  function expressionToHash(expression) {
    if (!window.LZMA) return;
    
    try {
      const lzmaInstance = new window.LZMA("/vendors/lzma_worker.js");
      lzmaInstance.compress(expression, 1, (result) => {
        // Usar la función de utilidad para convertir bytes a hex
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
    
    // Llamar a la función de compresión separada
    expressionToHash(expression);
    
    if(!audioStore.isPlaying) {
      await audioStore.getSampleForTime();
    }
  }

  async function updateVisualization(width) {
    return await audioStore.updateVisualization(width);
  }

  // Propiedades computadas para mantener compatibilidad
  const isPlaying = computed(() => audioStore.isPlaying);
  const time = computed(() => audioStore.time);
  const sample = computed(() => audioStore.sample);
  const visualizationData = computed(() => audioStore.visualizationData);

  // Resto del código existente sin cambios
  function keyPressed(type, data) {
    switch (type) {
        case 'number':
          console.log('number',data)
            // Special case for decimal point
            if (data === '.') {
                if (stack.value[selectedToken.value].type === 'number' && isEditingNumber.value) {
                    // Only add the decimal point if it doesn't already have one
                    const currentData = stack.value[selectedToken.value].data.toString();
                    if (!currentData.includes('.')) {
                        stack.value[selectedToken.value].data = currentData + '.';
                    }
                } else if (stack.value[selectedToken.value].type !== 'number') {
                    // If not a number yet, create a new number starting with "0."
                    newToken({ type: 'number', data: '0.' });
                    isEditingNumber.value = true;
                }
                return;
            }

            // Normal number handling
            if (stack.value[selectedToken.value].type !== 'number') {
                newToken({ type: 'number', data: data });
                isEditingNumber.value = true;
            } else {
                if(isEditingNumber.value){
                    stack.value[selectedToken.value].data = stack.value[selectedToken.value].data + data.toString();
                } else {
                    newToken({ type: 'number', data: data });
                    isEditingNumber.value = true;
                }
            }
            isEditingNumber.value = true;
            break;
        case 'operator':
            if (isEditingNumber.value) {
                isEditingNumber.value = false;
                navigationManager.moveNext(); 
            }
            newToken({ type: 'operator', data: data });
            navigationManager.moveNext(); 
            break;
        case 'time':
            isEditingNumber.value = false;
            newToken({ type: 'time', data: 't' });
            navigationManager.moveNext(); 
            break;
        case 'action':
            isEditingNumber.value = false;
            handleAction(data);
            break;
        default:
            break;
    }
}

  function keyLongPressed(type, data) {
    switch (data){
      case 'LEFT':
        navigationManager.moveFirst();
        break;
      case 'RIGHT':
        navigationManager.moveLast();
        break;
      case 'DEL':
        delAllTokens();
        break;
      default:
    }
  }

  function newToken(token, index = selectedToken.value) {
    expressionManager.newToken(token, index, saveToHistory);
  }

  function modToken(mod, index = selectedToken.value) {
    expressionManager.modToken(mod, index, saveToHistory);
  }

  function insertToken() {
    expressionManager.insertToken(selectedToken.value, saveToHistory);
  }

  function delToken() {
    if (expressionManager.delToken(selectedToken.value, saveToHistory)) {
      if (stack.value.length === 0) {
        stack.value.push({ type: 'empty', data: '' });
        selectedToken.value = 0; 
      } else if (selectedToken.value === stack.value.length) {
        navigationManager.movePrev();
      }
    }
  }

  function delAllTokens() {
    selectedToken.value = expressionManager.delAllTokens(saveToHistory);
  }

  function backspaceToken() {
    if (selectedToken.value <= 0) return;
    
    expressionManager.delToken(selectedToken.value, saveToHistory);
    navigationManager.movePrev();
  } 

  function toggleHoldMode() {
    logger.log('INFO', `HOLD MODE ${holdMode.value ? 'OFF' : 'ON'}`);
    
    holdMode.value = !holdMode.value;
    
    if (!holdMode.value) {
      evalBytebeat();
    }
  }

  function toggleBinaryEditor() {
    if (isEditingNumber.value) {
      isBinaryEditor.value = !isBinaryEditor.value;
    }
  }

  function handleAction(action) {
    switch (action) {
      case 'LEFT':
        console.log('LEFT pressed');
        navigationManager.movePrev();
        break;
       
      case 'RIGHT':
        console.log('RIGHT pressed');
        navigationManager.moveNext();
        break;

      case 'INS':
        console.log('INSERT pressed');
        insertToken();
        break;

      case 'DEL':
        console.log('delete',selectedToken.value);
        delToken();
        break;
        
      case 'BCKS':
        backspaceToken();
        break;

      case 'HOLD':
        toggleHoldMode();
        break;

      case 'UNDO':
        undo();
        console.log('Undo pressed');
        break;

      case 'REDO':
        redo();
        console.log('Redo pressed');
        break;
        
      default:
        break;
    }
  }

  const { moveTo, movePrev, moveNext, moveFirst, moveLast } = navigationManager;

  function setExpression(expr) {
    selectedToken.value = expressionManager.setExpression(expr, saveToHistory);
  }

  function loadExpressionFromHash() {
    return expressionManager.loadExpressionFromHash();
  }

  // Then in your return statement
  return {
    // Core State
    stack,
    selectedToken,
    currentNumber,
    isEditingNumber,
    isBinaryEditor,
    holdMode,
    
    // Navigation
    moveTo,
    movePrev,
    moveNext,
    moveFirst,
    moveLast,
    
    // Expression Management
    getExpression: expressionManager.getExpression,
    setExpression,
    evalBytebeat: expressionManager.evalBytebeat,
    loadExpressionFromHash,
    
    // Editing Functions
    keyPressed,
    keyLongPressed,
    toggleBinaryEditor,
    
    // History Management
    saveToHistory,
    undo,
    redo,
    
    // Audio Control
    playPause,
    setVolume,
    setSampleRate,
    stop,
    reset,
    isPlaying,
    time,
    sample,
    
    // Visualization
    updateVisualization,
    visualizationData,
  }
});