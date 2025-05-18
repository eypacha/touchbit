import { ref } from 'vue';

export function useHistoryManager(stack, audioStore, logger) {
  const history = ref([]);
  const historyIndex = ref(-1);
  const maxHistorySize = 50;

  function initHistory() {
    history.value = [JSON.stringify(stack.value)];
    historyIndex.value = 0;
  }

  function saveToHistory() {
    // If we're in the middle of history, remove future states
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    
    // Add current state to history
    history.value.push(JSON.stringify(stack.value));
    historyIndex.value = history.value.length - 1;
    
    // Limit history size
    if (history.value.length > maxHistorySize) {
      history.value = history.value.slice(history.value.length - maxHistorySize);
      historyIndex.value = history.value.length - 1;
    }
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      stack.value = JSON.parse(history.value[historyIndex.value]);
      logger.log('EDIT', 'Undo');
      audioStore.setExpression(getStackExpression());
      return true;
    } else {
      logger.log('INFO', 'Nothing to undo');
      return false;
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      stack.value = JSON.parse(history.value[historyIndex.value]);
      logger.log('EDIT', 'Redo');
      audioStore.setExpression(getStackExpression());
      return true;
    } else {
      logger.log('INFO', 'Nothing to redo');
      return false;
    }
  }

  function getStackExpression() {
    return stack.value
      .filter(item => item.type !== 'empty' && !item.disabled)
      .map(item => item.data)
      .join(' ');
  }

  return {
    initHistory,
    saveToHistory,
    undo,
    redo
  };
}