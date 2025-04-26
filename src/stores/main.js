import { ref } from "vue";
import { defineStore } from "pinia";

import { useThemeStore } from "@/stores/themeStore";
import { useAudioStore } from "@/stores/audioStore";
import { useStackStore } from "@/stores/stackStore";
import { useTokenNavigation } from "@/composables/useTokenNavigation";
import { useTokenManipulation } from "@/composables/useTokenManipulation";

export const useMainStore = defineStore("main", () => {
  const themeStore = useThemeStore();
  const audioStore = useAudioStore();
  const stackStore = useStackStore();
  
  const currentNumber = ref("");

  // Token navigation
  const { 
    selectedToken, 
    movePrev, 
    moveFirst, 
    moveNext, 
    moveLast, 
    moveTo 
  } = useTokenNavigation(stackStore.stack);

  // Token manipulation
  const { 
    isEditingNumber, 
    newToken, 
    modToken, 
    insertToken, 
    delToken, 
    backspaceToken 
  } = useTokenManipulation(stackStore.stack, selectedToken, evalBytebeat);

  async function evalBytebeat() {
    await audioStore.updateBytebeat(stackStore.expression);
  }

  async function playPause() {
    await audioStore.playPause(stackStore.expression);
  }

  function keyPressed(type, data) {
    switch (type) {
      case 'number':
        if (stackStore.stack.value[selectedToken.value].type !== 'number') {
          newToken({ type: 'number', data: data });
        } else {
          stackStore.stack.value[selectedToken.value].data = 
            stackStore.stack.value[selectedToken.value].data + data.toString();
          evalBytebeat();
        }
        isEditingNumber.value = true;
        break;
      case 'operator':
        if (isEditingNumber.value) {
          isEditingNumber.value = false;
          moveNext(); 
        }
        newToken({ type: 'operator', data: data });
        moveNext(); 
        break;
      case 'time':
        isEditingNumber.value = false;
        newToken({ type: 'time', data: 't' });
        moveNext(); 
        break;
      case 'action':
        handleAction(data);
        break;
      default:
        break;
    }
  }

  function keyLongPressed(type, data) {
    if (type !== 'action') {
      keyPressed(type, data);
      return;
    }

    switch (data) {
      case 'LEFT':
        moveFirst();
        break;
      case 'RIGHT':
        moveLast();
        break;
    }
  }

  function handleAction(action) {
    switch (action) {
      case 'LEFT':
        movePrev();
        break;
      case 'RIGHT':
        moveNext();
        break;
      case 'INS':
        if (insertToken()) moveNext();
        break;
      case 'DEL':
        if (delToken()) movePrev();
        break; 
      case 'BCKS':
        if (backspaceToken()) movePrev();
        break;
      case 'UNDO':
        // Para implementar
        break;
      case 'REDO':
        // Para implementar
        break;
      default:
        break;
    }
  }

  // Inicializar
  evalBytebeat();

  return {
    // Re-exportar estados y funciones que necesitamos exponer
    stack: stackStore.stack,
    currentNumber,
    keyPressed,
    keyLongPressed,
    theme: themeStore.theme,
    updateTheme: themeStore.updateTheme,
    toggleTheme: themeStore.toggleTheme,
    selectedToken,
    evalBytebeat,
    playPause,
    setVolume: audioStore.setVolume,
    setSampleRate: audioStore.setSampleRate,
    stop: audioStore.stop,
    reset: audioStore.reset,
    getExpression: () => stackStore.expression,
    time: audioStore.time,
    sample: audioStore.sample,
    isPlaying: audioStore.isPlaying,
    modToken,
    moveTo
  };
});