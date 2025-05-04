import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useThemeStore } from "./themeStore";
import { useLoggerStore } from "@/stores/loggerStore";
import { useAudioStore } from "./audioStore"; // Importar el nuevo AudioStore

export const useMainStore = defineStore("main", () => {
  const logger = useLoggerStore();
  const audioStore = useAudioStore(); // Instanciar el AudioStore

  const selectedToken = ref(0);
  const currentNumber = ref("");
  const isEditingNumber = ref(false);
  const holdMode = ref(false);

  const stack = ref([
    { type: 'time', data: 't' },
    { type: 'number', data: 64 },
    { type: 'operator', data: '&' },
    { type: 'time', data: 't' },
    { type: 'number', data: '4' },
    { type: 'operator', data: '>>' },
    { type: 'operator', data: '|' },
  ]);

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

  async function evalBytebeat() {
    if(holdMode.value) return;
    
    audioStore.setExpression(getExpression.value);
    
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
        moveFirst()
        break;
      case 'RIGHT':
        moveLast()
        break;
      case 'DEL':
        delAllTokens() 
        break;
      default:
    }
  }

  function newToken(token, index = selectedToken.value) {
    stack.value.splice(index, 1, token);
    evalBytebeat();
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

    evalBytebeat();
  }

  function insertToken() {
    stack.value.splice(selectedToken.value, 0, { type: 'empty', data: '' });
  }

  function delToken(){
    if (selectedToken.value < 0) return

    stack.value.splice(selectedToken.value, 1);
    evalBytebeat();

    if (stack.value.length === 0) {
      stack.value.push({ type: 'empty', data: '' });
      selectedToken.value = 0; 
    } else if (selectedToken.value === stack.value.length) {
      movePrev();
    }
  }

  function delAllTokens() {
    stack.value = [];
    stack.value.push({ type: 'empty', data: '' });
    selectedToken.value = 0;
    logger.log('EDIT', 'All tokens deleted');
    evalBytebeat();
  }

  function backspaceToken() {
    if (selectedToken.value <= 0) return
    
    stack.value.splice(selectedToken.value, 1);
    evalBytebeat();
    movePrev();
  } 

  function movePrev(){
    selectedToken.value = selectedToken.value > 0 ? selectedToken.value - 1 : 0;
  }

  function moveFirst(){
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

  function toggleHoldMode() {
    logger.log('INFO', `HOLD MODE ${holdMode.value ? 'OFF' : 'ON'}`);
    
    holdMode.value = !holdMode.value;
    
    if (!holdMode.value) {
      evalBytebeat();
    }
  }

  function handleAction(action) {
    switch (action) {
      case 'LEFT':
        console.log('LEFT pressed');
        movePrev()
       break;
       
      case 'RIGHT':
        console.log('RIGHT pressed');
        moveNext()
        break;

      case 'INS':
        console.log('INSERT pressed');
        insertToken()
        break;

      case 'DEL':
        console.log('delete',selectedToken.value)
        delToken()
        break;
        
      case 'BCKS':
        backspaceToken()
        break;

      case 'HOLD':
        toggleHoldMode();
        break;

      case 'UNDO':
        console.log('Undo pressed');
        break;

      case 'REDO':
        console.log('Redo pressed');
        break;
        
      default:
        break;
    }
  }

  return {
    stack,
    currentNumber,
    isEditingNumber,
    keyPressed,
    keyLongPressed,
    selectedToken,
    evalBytebeat,
    holdMode,
    // Delegamos al audioStore pero mantenemos la misma interfaz
    playPause,
    setVolume,
    setSampleRate,
    stop,
    reset,
    getExpression,
    isPlaying,
    time,
    sample,
    modToken,
    moveTo,
    updateVisualization,
    visualizationData
  }
});