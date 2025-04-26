import { ref } from 'vue';

export function useTokenNavigation(stack) {
  const selectedToken = ref(0);

  function movePrev() {
    selectedToken.value = selectedToken.value > 0 ? selectedToken.value - 1 : 0;
  }

  function moveFirst() {
    selectedToken.value = 0;
  }

  function moveNext() {
    const isAtLastPosition = selectedToken.value === stack.value.length - 1;
    const isNotEmpty = stack.value[selectedToken.value]?.type !== 'empty';

    if (isAtLastPosition && isNotEmpty) {
      stack.value.push({ type: 'empty', data: '' });
    }

    selectedToken.value = Math.min(selectedToken.value + 1, stack.value.length - 1);
  }
    
  function moveLast() {
    selectedToken.value = stack.value.length - 1;
  }

  function moveTo(index) {
    selectedToken.value = index;
  }

  return {
    selectedToken,
    movePrev,
    moveFirst,
    moveNext,
    moveLast,
    moveTo
  };
}