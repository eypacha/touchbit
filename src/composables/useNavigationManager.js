import { computed } from 'vue';

export function useNavigationManager(selectedToken, stack) {
  /**
   * Moves the cursor to the previous token
   */
  function movePrev() {
    selectedToken.value = selectedToken.value > 0 ? selectedToken.value - 1 : 0;
    return selectedToken.value;
  }

  /**
   * Moves the cursor to the first token
   */
  function moveFirst() {
    selectedToken.value = 0;
    return selectedToken.value;
  }

  /**
   * Moves the cursor to the next token, adding an empty token if at the end
   */
  function moveNext() {
    const isAtLastPosition = selectedToken.value === stack.value.length - 1;
    const isNotEmpty = stack.value[selectedToken.value]?.type !== 'empty';

    if (isAtLastPosition && isNotEmpty) {
      stack.value.push({ type: 'empty', data: '' });
    }

    selectedToken.value = Math.min(selectedToken.value + 1, stack.value.length - 1);
    return selectedToken.value;
  }

  /**
   * Moves the cursor to the last token
   */
  function moveLast() {
    selectedToken.value = stack.value.length - 1;
    return selectedToken.value;
  }

  /**
   * Moves the cursor to a specific index
   */
  function moveTo(index) {
    selectedToken.value = Math.min(Math.max(0, index), stack.value.length - 1);
    return selectedToken.value;
  }

  // Computed property for the current token
  const currentToken = computed(() => {
    if (selectedToken.value >= 0 && selectedToken.value < stack.value.length) {
      return stack.value[selectedToken.value];
    }
    return null;
  });

  return {
    // Navigation functions
    movePrev,
    moveFirst,
    moveNext,
    moveLast,
    moveTo,
    
    // Current token information
    currentToken
  };
}