import { ref, computed } from "vue";
import { defineStore } from "pinia";

import { audioEngine } from "@/services/audioEngine";

export const useMainStore = defineStore("main", () => {

  const selectedToken = ref(0);
  const currentNumber = ref("");
  const isPlaying = ref(false)
  const isEditingNumber = ref(false);
  const visualizationInterval = ref(null);
  const time = ref(0);
  const volume = ref(0.8)
  const sample = ref(0);
  const sampleRate = ref(8000);
  const holdMode = ref(false);

  const theme = ref('dark');

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

  function updateTheme() {

    console.log('updateTheme')
    const html = document.documentElement;
    if (theme.value === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }
  function toggleTheme() {
    theme.value = theme.value === "dark" ? "light" : "dark";
    updateTheme();
  }

  async function playPause() {

    console.log('play/pause', isPlaying.value)
    if (!isPlaying.value) {
      const result = await audioEngine.play();
      
      console.log(getExpression.value)
      evalBytebeat();

      if (result) {
        isPlaying.value = true;
        renderLoop()
      }
    } else {
      const result = audioEngine.pause();
      if (result) {
        isPlaying.value= false;
        renderLoop()
      }
    }
  }

  function setVolume(vol, rampTime){
    volume.value = vol
    audioEngine.setVolume(vol, rampTime)
  }

  function setSampleRate(rate){
    sampleRate.value = rate
    audioEngine.setSampleRate(sampleRate.value)
  }
  
  async function stop() {
    const result = await audioEngine.stop();
    time.value = 0
    if (result) {
      isPlaying.value = false;
      // isualizationData = null;
    }
  }

  async function reset() {
    await audioEngine.reset();
    time.value = 0
    // visualizationData.value = null;
  }

  async function evalBytebeat() {
    console.log('eval')
    if(holdMode.value) return

    audioEngine.setExpressions([getExpression.value]);

    if(isPlaying.value) return

    time.value = audioEngine.getTime();
    sample.value = await audioEngine.getSampleForTime()
  }

  function renderLoop() {

    const updateTime = async () => {
    
      if(isPlaying.value) {
        time.value = audioEngine.getTime();
        sample.value = await audioEngine.getSampleForTime()

        console.log()
        requestAnimationFrame(updateTime)
      }
    }
  
    requestAnimationFrame(updateTime)
  }

  function keyPressed(type, data) {
    console.log('keyPressed', type, data);
    switch (type) {
        case 'number':
            if (stack.value[selectedToken.value].type !== 'number') {
                console.log('no es numero');
                newToken({ type: 'number', data: data });
            } else {
                console.log('lo que sea');
                stack.value[selectedToken.value].data = stack.value[selectedToken.value].data + data.toString();
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

  console.log(data,'long pressed');

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
  console.log('newToken',token)
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
    console.log('Toggle HOLD mode from', holdMode.value, 'to', !holdMode.value);
    
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
    keyPressed,
    keyLongPressed,
    theme,
    updateTheme,
    toggleTheme,
    selectedToken,
    evalBytebeat,
    holdMode,
    playPause,
    setVolume,
    setSampleRate,
    stop,
    reset,
    getExpression,
    time,
    sample,
    isPlaying,
    modToken,
    moveTo}
});