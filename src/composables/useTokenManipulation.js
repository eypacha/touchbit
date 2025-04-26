import { ref } from 'vue';

export function useTokenManipulation(stack, selectedToken, onUpdate) {
  const isEditingNumber = ref(false);

  function newToken(token, index = selectedToken.value) {
    stack.value.splice(index, 1, token);
    onUpdate();
  }

  function modToken(mod, index = selectedToken.value) {
    if (index < 0 || index >= stack.value.length) {
      console.error(`Índice ${index} fuera de rango. Stack actual:`, stack.value);
      return;
    }

    if (typeof mod !== 'object' || mod === null) {
      console.error(`El modToken debe ser un objeto. Valor recibido:`, mod);
      return;
    }

    const originalToken = stack.value[index];

    stack.value[index] = {
      ...originalToken,
      ...mod,
    };

    onUpdate();
  }

  function insertToken() {
    stack.value.splice(selectedToken.value + 1, 0, { type: 'empty', data: '' });
    return true; // Señal para moveNext
  }

  function delToken() {
    if (selectedToken.value < 0) return false;

    stack.value.splice(selectedToken.value, 1);
    onUpdate();

    if (stack.value.length === 0) {
      stack.value.push({ type: 'empty', data: '' });
      selectedToken.value = 0;
      return false;
    } else if (selectedToken.value === stack.value.length) {
      return true; // Señal para movePrev
    }
    return false;
  }

  function backspaceToken() {
    if (selectedToken.value <= 0) return false;
      
    stack.value.splice(selectedToken.value, 1);
    onUpdate();
    return true; // Señal para movePrev
  }

  return {
    isEditingNumber,
    newToken,
    modToken,
    insertToken,
    delToken,
    backspaceToken
  };
}