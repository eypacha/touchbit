import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useThemeStore } from "./themeStore";
import { useLoggerStore } from "@/stores/loggerStore";
import { useAudioStore } from "./audioStore";
import { useExpressionManager } from "@/composables/useExpressionManager";
import { useNavigationManager } from "@/composables/useNavigationManager";
import { useHistoryManager } from "@/composables/useHistoryManager";

export const useMainStore = defineStore("main", () => {
  const logger = useLoggerStore();
  const audioStore = useAudioStore();

  const selectedToken = ref(0);
  const currentNumber = ref("");
  const isEditingNumber = ref(false);
  const isBinaryEditor = ref(false);
  const holdMode = ref(false);

  const stack = ref([]);

  const historyManager = useHistoryManager(stack, audioStore, logger);
  const expressionManager = useExpressionManager(stack, holdMode, audioStore, logger);
  const navigationManager = useNavigationManager(selectedToken, stack);

  historyManager.initHistory();

  const { saveToHistory, undo, redo } = historyManager;

  async function playPause() {
    await audioStore.playPause(getExpression.value);
  }

  function setVolume(vol, rampTime) {
    audioStore.setVolume(vol, rampTime);
  }

  function setSampleRate(rate) {
    audioStore.setSampleRate(rate);
  }

  function setReverbWet(wet) {
    // forward to audioStore
    if (audioStore && typeof audioStore.setReverbWet === 'function') {
      audioStore.setReverbWet(wet);
    }
  }

  function setGraphicEQ(values) {
    if (audioStore && typeof audioStore.setGraphicEQ === 'function') {
      audioStore.setGraphicEQ(values);
    }
  }

  function setEQBypass(enabled) {
    if (audioStore && typeof audioStore.setEQBypass === 'function') {
      audioStore.setEQBypass(enabled);
    }
  }

  async function stop() {
    await audioStore.stop();
  }

  async function reset() {
    await audioStore.reset();
  }

  async function updateVisualization(width) {
    return await audioStore.updateVisualization(width);
  }

  async function getFrequencyData() {
    return await audioStore.getFrequencyData();
  }

  // Propiedades computadas para mantener compatibilidad
  const isPlaying = computed(() => audioStore.isPlaying);
  const time = computed(() => audioStore.time);
  const sample = computed(() => audioStore.sample);
  const sampleRate = computed(() => audioStore.sampleRate); // <-- Añade esta línea
  const visualizationData = computed(() => audioStore.visualizationData);
  const frequencyData = computed(() => audioStore.frequencyData);
  const graphicEQ = computed(() => audioStore.graphicEQ);
  const eqEnabled = computed(() => audioStore.eqEnabled);

  const getExpression = computed(() => {
    return stack.value
      .filter(item => item.type !== 'empty' && !item.disabled)
      .map(item => item.data)
      .join(' ');
  });

  // Resto del código existente sin cambios
  function keyPressed(type, data) {
    switch (type) {
      case 'number':
        console.log('number', data);
        const currentToken = stack.value[selectedToken.value];
        const dataStr = data.toString();

        // Si ya estamos editando un número y el token actual es de tipo 'number'
        if (isEditingNumber.value === true && currentToken && currentToken.type === 'number') {
          // Si es un dígito, lo agregamos al final del número actual
          currentToken.data += dataStr;
        } else {
          // Si no estamos editando un número, creamos un nuevo token de número
          newToken({ type: 'number', data: dataStr });
          // Indicamos que ahora estamos editando un número
          isEditingNumber.value = true;
        }
        break;

      case 'dot':
        console.log('dot pressed');
        const currentNumberToken = stack.value[selectedToken.value];

        // Si ya estamos editando un número y el token actual es de tipo 'number'
        if (isEditingNumber.value === true && currentNumberToken && currentNumberToken.type === 'number') {
          // Solo agregamos el punto si no existe ya un punto decimal
          console.log('currentToken for dot', currentNumberToken.data);
          if (!currentNumberToken.data.includes('.')) {
            currentNumberToken.data += '.';
          }
        } else {
          // Si no estamos editando un número, creamos un nuevo token con '0.'
          newToken({ type: 'number', data: '0.' });
          isEditingNumber.value = true;
        }
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
    switch (data) {
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
      expressionManager.evalBytebeat();  // Changed from evalBytebeat()
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
        console.log('delete', selectedToken.value);
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
    getExpression, // Exportamos nuestra propia computed property
    setExpression,
    evalBytebeat: expressionManager.evalBytebeat,
    loadExpressionFromHash,

    // Editing Functions
    keyPressed,
    keyLongPressed,
    toggleBinaryEditor,
    modToken,

    // History Management
    saveToHistory,
    undo,
    redo,

    // Audio Control
    playPause,
    setVolume,
    setSampleRate,
    sampleRate,
    // Reverb wet passthrough (read-only state)
    reverbWet: computed(() => audioStore.reverbWet),
    stop,
    reset,
    isPlaying,
    time,
    sample,

    // Visualization
    updateVisualization,
    setReverbWet,
    setGraphicEQ,
    setEQBypass,
    dumpEQ: () => audioStore.dumpEQ && audioStore.dumpEQ(),
    getFrequencyData,
    visualizationData,
    frequencyData,
    graphicEQ,
    eqEnabled,
  }
});