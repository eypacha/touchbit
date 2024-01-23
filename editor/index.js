/* eslint-disable */
/* global LZMA */
/* global WavMaker */

import { createElem as el } from './elem.min.js';

import ByteBeatNode from '../js/ByteBeatNode.js';

import {
  convertBytesToHex,
  convertHexToBytes,
  splitBySections,
  s_beatTypes,
} from './utils.min.js';

const $ = id => document.getElementById(id);

let g_context;
let g_byteBeat;
let g_filter;
const g_analyzers = [];
let g_splitter;
let g_merger;
let g_saving = false;
let g_saveDialogInitialized = false;
let g_ignoreHashChange;
let playing = false;
let timeElem;
let playElem;
let beatTypeElem;
let sampleRateElem;
let saveElem;
let compileStatusElem;
let compressor;
let controls;
let doNotSetURL = true;
let selectedSlot = 0;
let numberMode = false;
let fnMode = false;
let stack = [''];

function connectFor2Channels() {
  g_byteBeat.disconnect();
  g_byteBeat.connect(g_splitter);
  g_splitter.connect(g_analyzers[0], 0);
  g_splitter.connect(g_analyzers[1], 1);
  g_analyzers[0].connect(g_merger, 0, 0);
  g_analyzers[1].connect(g_merger, 0, 1);
  return g_merger;
}

function reconnect() {
  const lastNode = connectFor2Channels();
  if (g_filter) {
    lastNode.connect(g_filter);
    g_filter.connect(g_context.destination);
  } else {
    lastNode.connect(g_context.destination);
  }
  g_context.resume();
}

function play() {
  if (playing) return

  playing = true
  reconnect()
}

function pause() {
  if (!playing) return

  playing = false;
  g_byteBeat.disconnect()

}

function setSelected(element, selected) {
  if (element) element.selected = selected;
}

function setSelectOption(select, selectedIndex) {
  setSelected(select.options[select.selectedIndex], false);
  setSelected(select.options[selectedIndex], true);
}

async function main() {
  compressor = new LZMA( 'js/lzma_worker.js' );
  controls = $('controls');

  g_context = new AudioContext();
  g_context.resume();  // needed for safari
  await ByteBeatNode.setup(g_context);
  g_byteBeat = new ByteBeatNode(g_context);

  g_analyzers.push(g_context.createAnalyser(), g_context.createAnalyser());
  g_analyzers.forEach(a => {
    a.maxDecibels = -1;
  });

  g_splitter = g_context.createChannelSplitter(2);
  g_merger = g_context.createChannelMerger(2);

  function resetToZero() {
    g_byteBeat.reset();
    updateTimeDisplay();
  }

  timeElem = el('button', {
    onClick: resetToZero,
    className: 'timer',
    innerHTML: '0',
  });

  controls.appendChild(timeElem);

  function playPause() {
    if (!playing) {
      playElem.classList.remove('play');
      playElem.classList.add('pause');
      play();
    } else {
      playElem.classList.remove('pause');
      playElem.classList.add('play');
      pause();
      updateTimeDisplay();
    }
  }
  playElem = el('button', { className: 'play', onClick: playPause });
  controls.appendChild(playElem);
  g_byteBeat.setExpressionType(1);
  // Stack
  
  const stackContainer = $('stack');

  function renderStack() {
    stackContainer.innerHTML = ''

    compile(stack.join(' '))

    stack.forEach((s, ndx) => {

      const slotDiv = document.createElement('div')
      slotDiv.setAttribute('data-id', ndx)
      slotDiv.className = 'slot'

      slotDiv.textContent = s

      if (!isNaN(parseFloat(s)) && isFinite(s)) {
        slotDiv.classList.add('number')

        slotDiv.textContent = slotDiv.textContent.startsWith('-0.') 
                                ? '-' + slotDiv.textContent.slice(2) 
                                : slotDiv.textContent.startsWith('0.') 
                                  ? '.' + slotDiv.textContent.slice(2) 
                                  : slotDiv.textContent;

        if (ndx === selectedSlot) {
          const plusOneDiv = document.createElement('div')
          plusOneDiv.className = 'modifier plus-one'
          plusOneDiv.textContent = '+1'
  
          const minusOneDiv = document.createElement('div')
          minusOneDiv.className = 'modifier minus-one'
          minusOneDiv.textContent = '-1'

          plusOneDiv.addEventListener('click', () => {
            modifySlotValue(selectedSlot, 1)
          })
  
          minusOneDiv.addEventListener('click', () => {
            modifySlotValue(selectedSlot, -1)
          })
  
          slotDiv.appendChild(plusOneDiv)
          slotDiv.appendChild(minusOneDiv)
        }

      }
xº
      if (s === "t") slotDiv.classList.add('t')

      if (['drop','dup','swap','pick','put'].includes(s.toLowerCase())) slotDiv.classList.add('special')

      if(s === "<<") slotDiv.textContent = "«"
      if(s === ">>") slotDiv.textContent = "»"
      if(s === "||") slotDiv.textContent = "‖"

      slotDiv.addEventListener('click', () => {
        selectedSlot = ndx
        renderStack()
      })
      
      stackContainer.appendChild(slotDiv)
    })

    stackContainer.children[selectedSlot].classList.add('selected')
  }

  renderStack();

  function selectSlot(index) {
    stackContainer.children[selectedSlot].classList.remove('selected');

    selectedSlot = index;
    const slot = stackContainer.children[index];
    slot.classList.add('selected');
  }

  selectSlot(0);

  $('selectNext').addEventListener('click', selectNext);

  function selectNext() {

    changeNumberMode(false)

    if(selectedSlot != (stack.length - 1)){

      selectedSlot++ 
    
    } else {

      if(stack[selectedSlot] != '') {
        stack.push('')
        selectedSlot++
      }
      
    }

    renderStack()
  
  }

  $('selectPrev').addEventListener('click', selectPrev);

  function selectPrev() {

    changeNumberMode(false)

    if (selectedSlot > 0) selectedSlot--
    renderStack()
  }

  function changeNumberMode(toValue) {
    numberMode = toValue

    numberMode ? stackContainer.classList.add("number-mode-on"): stackContainer.classList.remove("number-mode-on")
    
  }

  const symbols = document.querySelectorAll('.symbol');

  symbols.forEach(symbol => {
    symbol.addEventListener('click', function() {

      if(numberMode) {
       changeNumberMode(false)
        selectNext()
      }

      const newSymbol = this.getAttribute('data-insert')
      stack[selectedSlot] = newSymbol
      selectNext()

    })
  })

  const numbers = document.querySelectorAll('.number');

  numbers.forEach(number => {
    number.addEventListener('click', function() {
      
      const newNumber = this.getAttribute('data-insert')

      // Verifica si el contenido del slot actual cumple con la condición numérica
      if (
        ((!isNaN(parseFloat(stack[selectedSlot])) && isFinite(stack[selectedSlot]) || stack[selectedSlot] == '.') && numberMode) &&
        !(stack[selectedSlot] === "0" && newNumber === "0")
      ) {
        // Si es un número, agrega el nuevo número a continuación del existente en el slot
        stack[selectedSlot] += newNumber
      } else {
        // Si no es un número, reemplaza el contenido del slot con el nuevo número
        stack[selectedSlot] = newNumber
      }

      changeNumberMode(true)
      
      renderStack()

    })

  })

  const modifiers = document.querySelectorAll('.modifier');

  modifiers.forEach(modifier => {
    modifier.addEventListener('click', function() {
      
      const newModifier = this.getAttribute('data-modifier')

      let evaluated = null
      // Verifica si el contenido del slot actual cumple con la condición numérica

      if (!isNaN(parseFloat(stack[selectedSlot])) && isFinite(stack[selectedSlot])) {
        // Si es un número, agrega el nuevo número a continuación del existente en el slot

        if(newModifier === "clear") {

          evaluated = stack[selectedSlot].slice(0, -1)
          if (evaluated === '') evaluated = "0"

        } else {

          evaluated = eval(stack[selectedSlot] + newModifier)
          evaluated =  Math.round(evaluated * 100000) / 100000

        }
        

      } else {
        // Si no es un número, reemplaza el contenido del slot con el nuevo número
        evaluated = eval(0 + newModifier)
        evaluated =  Math.round(evaluated * 100000) / 100000
      }
      
      stack[selectedSlot] = evaluated
      changeNumberMode(true)
      renderStack()

    })

  })

  function modifySlotValue(index, increment) {
    const currentValue = parseFloat(stack[index]);
    
    // Verifica si el valor actual es un número
    if (!isNaN(currentValue) && isFinite(currentValue)) {
      stack[index] = (currentValue + increment).toString();
      renderStack();
    }
  }

  const deleteButton = $('deleteSlot');

  deleteButton.addEventListener('click', function() {


    if (stack.length == 1) stack[0] = ''
    if (stack.length > 1) {
 
      stack.splice(selectedSlot, 1) 
      if (selectedSlot >= stack.length)  selectedSlot = stack.length - 1;
    
    }

    changeNumberMode(false)
    renderStack()
  })

  const insertButton = $('insertSlot');

  insertButton.addEventListener('click', function() {
    stack.splice(selectedSlot, 0, ''); // Inserta un elemento vacío en el slot seleccionado
    changeNumberMode(false)
    renderStack();
  });

  const fnModeButton = $('fnMode');
  const keyboardElem = $('keyboard');

  fnModeButton.addEventListener('click', function() {

    fnMode = !fnMode

    keyboardElem.classList.toggle('fn-mode')

  })

  function addOption(textContent, selected) {
      return el('option', {
        textContent,
        ...(selected && {selected}),
      });
  }

  function addSelection(options, selectedIndex, props = {}) {
    const select = el('select', props, options.map((option, i) => {
      return addOption(option, i === selectedIndex);
    }));
    return select;
  }

  beatTypeElem = addSelection(s_beatTypes, 0, {
    onChange(event) {
      g_byteBeat.setType(event.target.selectedIndex);
      setURL();
    },
  });
  beatTypeElem.classList.add('byte-type')
  controls.appendChild(beatTypeElem);

  const sampleRates = [8000, 11000, 22000, 32000, 44100, 48000];
  sampleRateElem = addSelection(['8kHz', '11kHz', '22kHz', '32kHz', '44kHz', '48kHz'], 0, {
    onChange(event) {
      g_byteBeat.setDesiredSampleRate(sampleRates[event.target.selectedIndex]);
      setURL();
    },
  });
  controls.appendChild(sampleRateElem);

  saveElem = el('button', {
    textContent: 'save',
    onClick: startSave,
  });
  controls.appendChild(saveElem);

  compileStatusElem = el('div', {
    className: 'status',
    textContent: '',
  });
  controls.appendChild(compileStatusElem);


  window.addEventListener('hashchange', function() {
    if (g_ignoreHashChange) {
      g_ignoreHashChange = false;
      return;
    }
    const hash = window.location.hash.substr(1);
    readURL(hash);
  });

  if (window.location.hash) readURL(window.location.hash.substr(1))

  function render() {
    requestAnimationFrame(render)
    if (playing) updateTimeDisplay()
  }
  
  render()

  function readURL(hash) {

    const data = Object.fromEntries(new URLSearchParams(hash).entries());
    const t = data.t !== undefined ? parseFloat(data.t) : 1;
    const s = data.s !== undefined ? parseFloat(data.s) : 8000;
    let rateNdx = sampleRates.indexOf(s);
    if (rateNdx < 0) {
      rateNdx = sampleRates.length;
      sampleRateElem.appendChild(addOption(s));
      sampleRates.push(s);
    }
    setSelectOption(sampleRateElem, rateNdx);
    setSelectOption(beatTypeElem, t);
    g_byteBeat.setType(parseInt(t));
    g_byteBeat.setDesiredSampleRate(parseInt(s));

    const bytes = convertHexToBytes(data.bb);

    compressor.decompress(bytes, function(text) {
      
        doNotSetURL = true;
        compile(text, true);

        stack = [...text.split(' ')]
        selectedSlot = stack.length - 1
        renderStack()
        
      },
      dummyFunction);

  }

}

function startSave() {
  if (!g_saving) {
    g_saving = true;
    showSaveDialog();
  }
}

async function showSaveDialog() {
  function closeSave() {
    $('savedialog').style.display = 'none';
    g_saving = false;
  }

  const saveData = (function() {
    const a = el('a', {style: {display: 'none'}});
    document.body.appendChild(a);
    return function saveData(blob, fileName) {
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      a.click();
    };
  }());

  function wait(ms = 0) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  function save() {
    async function realSave() {
      const numSeconds = parseFloat($('seconds').value);
      if (numSeconds > 0) {
        const wasPlaying = playing;
        if (playing) {
          pause();
        }
        // there are issues where. The stack should be
        // reset if nothing else.
        const sampleRate = g_byteBeat.getDesiredSampleRate();
        const numSamplesNeeded = sampleRate * numSeconds | 0;
        const numChannels = 2;
        const wavMaker = new WavMaker(sampleRate, numChannels);
        const context = ByteBeatNode.createContext();
        const stack = ByteBeatNode.createStack();
        for (let i = 0; i < numSamplesNeeded; i += sampleRate) {
          const start = i;
          const end = Math.min(i + sampleRate, numSamplesNeeded);
          const output = [
            new Float32Array(end - start),
            new Float32Array(end - start),
          ];
          for (let j = start; j < end; ++j) {
            for (let ch = 0; ch < numChannels; ++ch) {
              const s = g_byteBeat.getSampleForTime(j, context, stack, ch);
              output[ch][j - i] = s;
            }
          }
          wavMaker.addData(output);
          await wait();
        }
        const blob = wavMaker.getWavBlob();
        saveData(blob, 'touchbit.wav');

        if (wasPlaying) play();
      }
      closeSave();
    }
    realSave();
  }

  if (!g_saveDialogInitialized) {
    g_saveDialogInitialized = true;
    $('save').addEventListener('click', save);
    $('cancel').addEventListener('click', closeSave);
  }
  const saveDialogElem = $('savedialog');
  saveDialogElem.style.display = 'table';
}

const dummyFunction = () => {}

const updateTimeDisplay = () => timeElem.innerHTML = g_byteBeat.getTime()

async function setExpressions(expressions, resetToZero) {

  let error;
  try {
    await g_byteBeat.setExpressions(expressions, resetToZero);
  } catch (e) {
    error = e;
  }

  compileStatusElem.textContent = error ? error : '●';
  compileStatusElem.classList.toggle('error', error);
  setURL();
}

function compile(text, resetToZero) {

  const sections = splitBySections(text);
  if (sections.default || sections.channel1) {
    const expressions = [sections.default?.body || sections.channel1?.body];
    if (sections.channel2) {
      expressions.push(sections.channel2.body);
    }

    setExpressions(expressions, resetToZero);
  }

}

function setURL() {
  if (doNotSetURL) {
    doNotSetURL = false;
    return;
  }
  compressor.compress(stack.join(' '), 1, function(bytes) {
    const hex = convertBytesToHex(bytes);
    g_ignoreHashChange = true;
    const params = new URLSearchParams({
      t: g_byteBeat.getType(),
      s: g_byteBeat.getDesiredSampleRate(),
      bb: hex,
    });
    window.location.replace(`#${params.toString()}`);
  },
  dummyFunction);
}

{
  $('loadingContainer').style.display = 'none';
  main();

  const isSafari = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1

  if (isSafari) {

    let drags = new Set() //set of all active drags
    document.addEventListener("touchmove", function(event){
      if(!event.isTrusted)return //don't react to fake touches
      Array.from(event.changedTouches).forEach(function(touch){
        drags.add(touch.identifier) //mark this touch as a drag
      })
    })
    document.addEventListener("touchend", function(event){
      if(!event.isTrusted)return
      let isDrag = false
      Array.from(event.changedTouches).forEach(function(touch){
        if(drags.has(touch.identifier)){
          isDrag = true
        }
        drags.delete(touch.identifier) //touch ended, so delete it
      })
      if(!isDrag && document.activeElement == document.body){
        //note that double-tap only happens when the body is active
        event.preventDefault() //don't zoom
        event.stopPropagation() //don't relay event
        event.target.focus() //in case it's an input element
        event.target.click() //in case it has a click handler
        event.target.dispatchEvent(new TouchEvent("touchend",event))
        //dispatch a copy of this event (for other touch handlers)
      }
    })

}
}
