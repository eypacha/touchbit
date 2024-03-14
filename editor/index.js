/* eslint-disable */
/* global LZMA */

import { createElem as el } from './elem.min.js';

import ByteBeatNode from '../js/ByteBeatNode.js';

import{ Macro_GraphicEqNode } from '../js/MacroNodes.js';

import {
  convertBytesToHex,
  convertHexToBytes,
  splitBySections,
  s_beatTypes,
} from './utils.min.js';

const $ = id => document.getElementById(id);
const specials = ['drop', 'dup', 'swap', 'pick', 'put','log','exp','abs','sqrt','pow','floor','ceil','min','max','sin','cos','tan'];
let g_context;
let g_byteBeat;
let g_filter;
const freqtab = new Float32Array(256), magtab = new Float32Array(256), phasetab = new Float32Array(256);

const g_analyzers = [];
let g_splitter;
let g_merger;
let g_settingsDialogInitialized = false;
let g_ignoreHashChange;
let playing = false;
let timeElem;
let evalElem;
let playElem;
// let beatTypeElem;
const sampleRates = [8000, 11000, 22000, 32000, 44100, 48000];
let sampleRateElem;
let settingsElem;
let compileStatusElem;
let compressor;
let controls;
let doNotSetURL = true;
let selectedSlot = 0;
let numberMode = false;
let holdMode = false;
// let fnMode = false;
let insertMode = false;
let saveLogs = false;
let logs = "";
let stack = [''];
let undoStack = [];
let redoStack = [];
let debugMode = false;
const longClickTime = 1000;

let clickTimerDelete;

let deletingInterval = null;

let isDeleteLongClick = false;

let clickTimerSelectPrev;
let isLongClickSelectPrev = false;

let clickTimerSelectNext;
let isLongClickSelectNext = false;

let clickTimerInsert;
let isLongClickInsert = false;
let lastCompiled = '';

let clickTimerExpandable;
let editedNumber = null
let numberEditorActive = false

const touchable = 'ontouchstart' in window;
const keyDown = touchable ? 'touchstart' : 'mousedown';
const keyUp = touchable ? 'touchend' : 'mouseup';

//Peerjs
let lastPeerId = null;
let peer = null; // own peer object
let conn = null;
// const peerStatus = $('peerStatus')
function initializePeer() {
  // Create own peer object with connection to shared PeerJS server
  peer = new Peer(null, {
    debug: 2
  });

  peer.on('open', function (id) {
    // Workaround for peer.reconnect deleting previous id
    if (peer.id === null) {
      console.log('Received null id from peer open');
      peer.id = lastPeerId;
    } else {
      lastPeerId = peer.id;
    }

    console.log('ID: ' + peer.id);

    var url = new URL(window.location.href);
    var valorR = url.searchParams.get('r');

    if (valorR !== null) {
      console.log('El valor de la variable "r" es:', valorR);
      $('receiver-id').value = valorR;
      joinPeer();
    } else if (localStorage.getItem('peerId')) {
      $('receiver-id').value = localStorage.getItem('peerId');
      joinPeer();
    }

    localStorage.removeItem('peerId');


  });

  peer.on('connection', function (c) {
    // Disallow incoming connections
    c.on('open', function () {
      c.send("Sender does not accept incoming connections");
      setTimeout(function () { c.close(); }, 500);
    });
  });
  peer.on('disconnected', function () {
    console.log('Connection lost. Please reconnect');
    // Workaround for peer.reconnect deleting previous id
    peer.id = lastPeerId;
    peer._lastServerId = lastPeerId;
    peer.reconnect();
  });
  peer.on('close', function () {
    conn = null;
    // peerStatus.innerText = 'Connection destroyed Please refresh';
    console.log('Connection destroyed Please refresh');

  });
  peer.on('error', function (err) {
    console.log(err);
    // peerStatus.innerText = err;
  });
};

function joinPeer() {
  // Close old connection
  if (conn) conn.close();

  // Create connection to destination peer specified in the input field
  conn = peer.connect($('receiver-id').value, {
    reliable: true
  });

  conn.on('open', function () {
    // peerStatus.innerText = 'Conected to receiveer';
    console.log("Connected to: " + conn.peer);

    signal('hello')

    $('signalBtn').classList.remove('hide')
    $('connect-button').classList.add('hide')
    $('settingsdialog').classList.remove('active')
    $('disconnect-button').classList.remove('hide')
  });

  // Handle incoming data (messages only since this is the signal sender)
  conn.on('data', function (data) {
    console.log("DATA" + data);

    switch (data.sigName) {
      case 'restore':
        console.log('restore', data);

        stack = [...data.stack];
        g_byteBeat.setDesiredSampleRate(data.sampleRate);
        setSelectOption(sampleRateElem, sampleRates.indexOf(data.sampleRate));

        document.querySelectorAll('.slot')[0].click();
        break;
      case 'requestSetup':
        console.log('SampleRate requested');
        signal('sampleRate', g_byteBeat.getDesiredSampleRate());
        signal('mode', g_byteBeat.getType());
        break;
      default:
        console.log("data:", data);
        break;
    }
  });

  conn.on('close', function () {
    console.log("Connection closed")
    // peerStatus.innerText = 'Connection closed';
    $('receiver-id').value = ''
    $('signalBtn').classList.add('hide')
    $('connect-button').classList.remove('hide')
    $('disconnect-button').classList.add('hide')
  });

};

function signal(sigName, arg) {

  const data = {
    sigName: sigName,
    arg: arg
  }
  if (isPeerOpen()) {
    conn.send(data);
    console.log(data.sigName, data.arg + " signal sent");
  } else {
    console.log('Connection closed');
    // peerStatus.innerText = 'Connection closed';
    $('receiver-id').value = ''
    $('signalBtn').classList.add('hide')
  }
}

$('signalBtn').addEventListener('click', function () {
  if (!isPeerOpen()) return

  signal('process', stack)
})


$('connect-button').addEventListener('click', joinPeer);
$('disconnect-button').addEventListener('click', () => {
  conn.close()
});

function isPeerOpen() {
  return conn && conn.open;
}

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
  g_byteBeat.reset();
  if (saveLogs) saveLog(`PLAY`)

  if (isPeerOpen()) signal('play')
}

function pause() {
  if (!playing) return
  playing = false;

  g_byteBeat.disconnect();
  if (saveLogs) saveLog(`PAUSE`)

  if (isPeerOpen()) signal('pause')
}

function setSelected(element, selected) {
  if (element) element.selected = selected;
}

function setSelectOption(select, selectedIndex) {
  setSelected(select.options[select.selectedIndex], false);
  setSelected(select.options[selectedIndex], true);
}


async function main() {
  compressor = new LZMA('js/lzma_worker.js');
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


  g_filter = new Macro_GraphicEqNode(g_context, {eq:[0,0,0,0,0,0,0]});

  // g_filter = g_context.createBiquadFilter();
  // g_filter.type = "lowshelf";
	// g_filter.frequency.value = 1000;
	// g_filter.gain.value = 0;

  // const g_filter_0 = g_context.createBiquadFilter();
  // // g_filter_0.type = "lowshelf";
	// // g_filter_0.frequency.value = 320.0;
	// // g_filter_0.gain.value = 0.0;

  // g_filter.connect(g_filter_0)

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
  playElem = el('button', {
    className: 'play',
    ariaLabel: 'play/pause',
    onClick: playPause
  });

  function resetToZero() {
    g_byteBeat.reset();
    updateTimeDisplay();
    if (saveLogs && playing) saveLog(`RESET`)
  }

  controls.appendChild(playElem);

  timeElem = el('button', {
    onClick: resetToZero,
    className: 'timer',
    ariaLabel: 'reset to zero',
    innerHTML: '0',
  });

  controls.appendChild(timeElem);

  function addSelection(options, selectedIndex, props = {}) {
    const select = el('select', props, options.map((option, i) => {
      return addOption(option, i === selectedIndex);
    }));
    return select;
  }

  sampleRateElem = addSelection(['8kHz', '11kHz', '22kHz', '32kHz', '44kHz', '48kHz'], 0, {

    onChange(event) {
      const sampleData = sampleRates[event.target.selectedIndex]
      g_byteBeat.setDesiredSampleRate(sampleData);
      if (saveLogs && playing) saveLog(`SAMPLERATE ${sampleData}`)

      if (isPeerOpen()) signal('sampleRate', sampleData)

      setURL();
    },
  });
  sampleRateElem.classList.add('sample-rate')
  controls.appendChild(sampleRateElem);

  compileStatusElem = el('div', {
    className: 'status',
    textContent: '●',
  });
  controls.appendChild(compileStatusElem);

  settingsElem = el('button', {
    onClick: showSettingsDialog,
    className: 'settings',
    ariaLabel: 'settings'
  });

  controls.appendChild(settingsElem);

  g_byteBeat.setExpressionType(1);

  g_byteBeat.setType($('selectMode').selectedIndex);

  // Stack
  const stackContainer = $('stack');

  initializePeer();

  function renderStack() {
    stackContainer.innerHTML = ''

    if (!holdMode) compile(stack.join(' '))

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

        if (ndx === selectedSlot && numberMode) {
          const plusOneDiv = document.createElement('button')
          plusOneDiv.className = 'modifier plus-one'
          plusOneDiv.textContent = '+'
          const minusOneDiv = document.createElement('button')
          minusOneDiv.className = 'modifier minus-one'
          minusOneDiv.textContent = '-'

          plusOneDiv.addEventListener('click', (event) => {
            event.stopPropagation()
            modifySlotValue(selectedSlot, 1)
          })
          minusOneDiv.addEventListener('click', (event) => {
            event.stopPropagation()
            modifySlotValue(selectedSlot, -1)
            
          })
          slotDiv.appendChild(plusOneDiv)
          slotDiv.appendChild(minusOneDiv)
        }

      }

      if (s === "t") slotDiv.classList.add('t')
      if (s === "\n") slotDiv.classList.add('break')

      if (specials.includes(slotDiv.textContent.toLocaleLowerCase())) slotDiv.classList.add('special')

      if (s === "<<") slotDiv.textContent = "«"
      if (s === ">>") slotDiv.textContent = "»"
      if (s === "||") slotDiv.textContent = "‖"
      if (s === "!=") slotDiv.textContent = "≠"
      if (s === ">=") slotDiv.textContent = "≥"
      if (s === "<=") slotDiv.textContent = "≤"

      slotDiv.addEventListener('click', (event) => {

        event.preventDefault()

        const thisIsNumber = selectedSlot == ndx && slotDiv.classList.contains('number');
        if(numberMode && thisIsNumber) {

          window.seleccionado = slotDiv
          showNumberEditor()
        } else {
       
          changeNumberMode(selectedSlot == ndx && slotDiv.classList.contains('number'));
          selectedSlot = ndx
          renderStack()

        }

      })


      stackContainer.appendChild(slotDiv)
    })

    stackContainer.children[selectedSlot].classList.add(insertMode ? 'caret' : 'selected')
    
    if(numberEditorActive) renderNumberEditor()

    updateTimeDisplay()
  
  }

  renderStack();

  function selectSlot(index) {
    stackContainer.children[selectedSlot].classList.remove(insertMode ? 'caret' : 'selected');

    selectedSlot = index;
    const slot = stackContainer.children[index];
    slot.classList.add(insertMode ? 'caret' : 'selected');

  }

  selectSlot(0);

  const selectNextBtn = $('selectNext');

  function selectNext() {
    changeNumberMode(false)

    if (selectedSlot != (stack.length - 1)) {

      selectedSlot++

    } else {

      if (stack[selectedSlot] != '') {
        stack.push('')
        selectedSlot++
      }

    }

    renderStack()

  }

  selectNextBtn.addEventListener(keyDown, function (event) {


    selectNextBtn.classList.add('pressed')

    event.preventDefault()
    clickTimerSelectNext = setTimeout(function () {


      selectedSlot = stack.length - 1
      renderStack();

    }, longClickTime);
  });

  selectNextBtn.addEventListener(keyUp, function () {

    selectNextBtn.classList.remove('pressed')
    clearTimeout(clickTimerSelectNext);
    if (!isLongClickSelectNext) {

      selectNext();

    }
    isLongClickSelectNext = false;
  });

  const selectPrev = $('selectPrev');

  selectPrev.addEventListener(keyDown, function (event) {

    selectPrev.classList.add('pressed')

    event.preventDefault()
    clickTimerSelectPrev = setTimeout(function () {

      if (selectedSlot > 0) {
        selectedSlot = 0;
        renderStack();
      }
      isLongClickSelectPrev = true;
    }, longClickTime);
  });

  selectPrev.addEventListener(keyUp, function () {

    selectPrev.classList.remove('pressed')
    clearTimeout(clickTimerSelectPrev);

    if (!isLongClickSelectPrev) {
      changeNumberMode(false)

      if (selectedSlot > 0) {
        selectedSlot--;
        renderStack();
      }

    }

    isLongClickSelectPrev = false;
  });

  function changeNumberMode(toValue) {

    numberMode = toValue

    if(numberMode) {
      stackContainer.classList.add("number-mode-on")
    } else {
      stackContainer.classList.remove("number-mode-on")
      closeNumberEditor()
    }

  }

  const symbols = document.querySelectorAll('button.symbol[data-insert]');

  symbols.forEach(symbol => {

    symbol.addEventListener('click', function() {

      insertSymbol(this.getAttribute('data-insert'))

    })
  })

  const expandables = document.querySelectorAll('.expandable');

  function insertSymbol(newSymbol){

    if (numberMode) {
      changeNumberMode(false)
      selectNext()
    }

    if (insertMode) {
      // Modo de inserción: Agrega un nuevo elemento en la posición seleccionada
      stack.splice(selectedSlot, 0, newSymbol);
    } else {
      // Modo de reemplazo: Reemplaza el elemento en la posición seleccionada
      stack[selectedSlot] = newSymbol;
    }

    saveState()
    selectNext()

  }

  expandables.forEach(expandable => {
    
    const symbols = expandable.querySelectorAll('.expanded div')
    const button = expandable.querySelector('button')
    let selectedSymbol = null
    let isLongClickExpandable = false;
    let lastSelectedId = parseInt(expandable.dataset.default) || 0

    symbols.forEach((symbol,n) => symbol.dataset.id = n) 
    
    expandable.addEventListener(keyDown, function (event) {

      event.preventDefault()
      button.classList.add('pressed')

      isLongClickExpandable = false;
      selectedSymbol = symbols[lastSelectedId]
  
      clickTimerExpandable = setTimeout(() => {
  
        isLongClickExpandable = true;
        symbols.forEach((symbol) => symbol.classList.remove('active'))
        selectedSymbol.classList.add('active')
        expandable.classList.add('open')

      }, longClickTime);
    });


    expandable.addEventListener(touchable ? 'touchmove' : 'mousemove', function(event) {
      
      const x = touchable ? event.touches[0].clientX : event.clientX;
      const y = touchable? event.touches[0].clientY : event.clientY;
      let elem = document.elementFromPoint(x,y);
      
      if(expandable.contains(elem) && elem.dataset.insert) {

        if(elem == selectedSymbol) return
        selectedSymbol = elem
        symbols.forEach((symbol) => symbol.classList.remove('active'))
        selectedSymbol.classList.add('active');

      } else if(selectedSymbol && elem !== button) {
        
        if(expandable.classList.contains('open')) selectedSymbol = null
        closeExpandable()
      }

    });

    expandable.addEventListener(keyUp, closeExpandable)

    if(!touchable) expandable.addEventListener('mouseleave', ()=> {
      selectedSymbol = null
      closeExpandable()
    })

    function closeExpandable() {
      
      clearTimeout(clickTimerExpandable);
      isLongClickExpandable = false;
      expandable.classList.remove('open')
      button.classList.remove('pressed')

      if(selectedSymbol) {
        
        insertSymbol(selectedSymbol.dataset.insert)
        button.innerText = selectedSymbol.innerText
        lastSelectedId = selectedSymbol.dataset.id
        selectedSymbol = null
  
        
      }
      
    }

  })

  const numbers = document.querySelectorAll('.number');

  numbers.forEach(number => {
    number.addEventListener('click', function () {

      const newNumber = this.getAttribute('data-insert')

      if(stack[selectedSlot].length > 15) return
      // Verifica si el contenido del slot actual cumple con la condición numérica
      if (
        ((!isNaN(parseFloat(stack[selectedSlot])) && isFinite(stack[selectedSlot]) || stack[selectedSlot] == '.') && numberMode) &&
        !(stack[selectedSlot] === "0" && newNumber === "0")
      ) {
        // Si es un número, agrega el nuevo número a continuación del existente en el slot
        stack[selectedSlot] += newNumber
        editedNumber = floatToFraction(stack[selectedSlot])

      } else {


        if (insertMode) {
          // Modo de inserción: Agrega un nuevo elemento en la posición seleccionada
          stack.splice(selectedSlot, 0, newNumber);
        } else {
          // Modo de reemplazo: Reemplaza el elemento en la posición seleccionada
          // Si no es un número, reemplaza el contenido del slot con el nuevo número
          stack[selectedSlot] = newNumber
        }

      }

      saveState()
      changeNumberMode(true)

      renderStack()

    })

  })

  $('clear').addEventListener('click', ()=> {

    let evaluated = !isNaN(parseFloat(stack[selectedSlot])) && isFinite(stack[selectedSlot]) ? stack[selectedSlot].slice(0, -1) : "0";
    stack[selectedSlot] = evaluated === '' ? "0" : evaluated;
    saveState();
    editedNumber = floatToFraction(stack[selectedSlot]);
    
    changeNumberMode(true)
    renderStack();

  })

  function modifySlotValue(index, increment) {

    let fraction = floatToFraction(parseFloat(stack[index]))
    fraction.wholeNumber += increment
    stack[index] = fractionToFloat(fraction).toString()
    
    saveState()
    renderStack();

  }


function floatToFraction(float) {

  const floatStr = float.toString();

  // Find the position of the decimal point
  const decimalPosition = floatStr.indexOf('.');

  // If there's no decimal point, the number is already an integer, return it directly
  if (decimalPosition === -1) {
    return {
      wholeNumber: parseInt(floatStr),
      decimalPlaces: 0, // Since it's an integer, there are no decimal places
    };
  }

  // Calculate the length of the decimal part to determine the decimal places
  const decimalPlaces = floatStr.length - decimalPosition - 1;

  // Multiply the number by 10 to the power of decimal places to get the whole number
  const wholeNumber = Math.round(float * Math.pow(10, decimalPlaces));


  return {
    wholeNumber: wholeNumber,
    decimalPlaces: decimalPlaces,
  };
}

function fractionToFloat(fract) {
  return fract.wholeNumber / Math.pow(10,fract.decimalPlaces)
}

function showNumberEditor() {
  const numberEditor = $('number-editor');
  editedNumber = floatToFraction(stack[selectedSlot])
  renderNumberEditor()
  numberEditorActive = true
  numberEditor.classList.add('active');
}

$('number-editor').addEventListener('click', closeNumberEditor)
$('number-container').addEventListener('click', (event)=>{
  event.stopPropagation()
})

function closeNumberEditor() { 
  editedNumber = null
  const numberEditor = $('number-editor');
  numberEditor.classList.remove('active');
  numberEditorActive = false
}


function renderNumberEditor() {

  const numberContainer = $('number-container');
  numberContainer.innerHTML = ''

  let digits = Math.abs(editedNumber.wholeNumber).toString().split('').map(Number);

  while (digits.length <= editedNumber.decimalPlaces) {
    digits.unshift(0); 
  }


  digits.forEach((digit, i) => {

    const digitElem = document.createElement('div')
    digitElem.className = 'digit'
    digitElem.textContent = digit
    
    const plus = document.createElement('div')
    plus.className = 'modifier'
    plus.classList.add('plus')

    plus.textContent = '^'

    plus.addEventListener('click', () => {
      editedNumber.wholeNumber += Math.pow(10,digits.length - i - 1)
      stack[selectedSlot] = fractionToFloat(editedNumber).toString()
      console.log('plus',editedNumber)
      renderStack()
    })
    
    if(editedNumber.decimalPlaces == digits.length - i) digitElem.classList.add('dot')
    digitElem.appendChild(plus)

    const minus = document.createElement('div')
    minus.className = 'modifier'
    minus.classList.add('minus')
    minus.textContent = '^'

    minus.addEventListener('click', () => {
      editedNumber.wholeNumber -= Math.pow(10,digits.length - i - 1)
      console.log('minus',editedNumber)
      console.log(fractionToFloat(editedNumber))
      stack[selectedSlot] = fractionToFloat(editedNumber).toString()
      renderStack()
    })

    digitElem.appendChild(minus)

    numberContainer.appendChild(digitElem)

  })

  if(stack[selectedSlot].charAt(stack[selectedSlot].length - 1) === '.') {
    numberContainer.lastChild.classList.add('finaldot')
  }

  if(editedNumber.wholeNumber < 0) {
    numberContainer.firstChild.classList.add('negative')
  }

  const chars = digits.length + (editedNumber.wholeNumber < 0 ? 1 : 0)

  let fontSize = 3;
  if(chars > 6) fontSize = 2.5
  if(chars > 10) fontSize = 2.2
  if(chars > 13) fontSize = 2

  numberContainer.style.setProperty('--font-size', `${fontSize}rem`);
  numberContainer.dataset.chars = chars;

}

  const deleteButton = $('deleteSlot');

  deleteButton.addEventListener(keyDown, function (event) {

    deleteButton.classList.add('pressed')

    event.preventDefault()

    clickTimerDelete = setTimeout(function () {

      if (insertMode) {

        deletingInterval = setInterval(() => {

          if (insertMode && selectedSlot > 0) {

            stack.splice(selectedSlot - 1, 1);
            selectedSlot--;  // Ajusta la posición seleccionada después del borrado
            saveState();
            changeNumberMode(false);
            renderStack();

          } else {
            clearInterval(deletingInterval)
          }

        }, 150)

      } else {
        stack = [''];
        selectedSlot = 0;

        if (!holdMode) compile('0')

        saveState();
        changeNumberMode(false);
        renderStack();
        isDeleteLongClick = true;
      }

    }, longClickTime);
  });

  deleteButton.addEventListener(keyUp, function () {

    deleteButton.classList.remove('pressed')
    clearTimeout(clickTimerDelete);
    clearInterval(deletingInterval)

    if (!isDeleteLongClick) {

      if (insertMode && selectedSlot > 0) {
        // Modo de inserción: Borra el elemento en la posición seleccionada - 1
        stack.splice(selectedSlot - 1, 1);
        selectedSlot--;  // Ajusta la posición seleccionada después del borrado
        saveState();
        changeNumberMode(false);
        renderStack();

      } else if (!insertMode && stack.length > 1) {
        // Modo de reemplazo: Borra el elemento en la posición seleccionada
        stack.splice(selectedSlot, 1);
        saveState();
        if (selectedSlot >= stack.length) selectedSlot = stack.length - 1;
        changeNumberMode(false);
        renderStack();
      }

    }

    isDeleteLongClick = false;
  });

  const insertButton = $('insertSlot');

  insertButton.addEventListener(keyDown, function (event) {

    insertButton.classList.add('pressed')
    isLongClickInsert = false;
    event.preventDefault()

    if(insertMode) return
    clickTimerInsert = setTimeout(function () {

      insertMode = true
      insertButton.classList.add('active')
      document.documentElement.dataset.editionMode = 'insert'
      $('stack').querySelectorAll('.slot')[selectedSlot].click()

      isLongClickInsert = true;

    }, longClickTime);
    
  });

  insertButton.addEventListener(keyUp, function () {

    insertButton.classList.remove('pressed')

    clearTimeout(clickTimerInsert);

    if(isLongClickInsert) return

    if(insertMode) {
      insertMode = false
      insertButton.classList.remove('active')
      document.documentElement.dataset.editionMode = 'replace'
      $('stack').querySelectorAll('.slot')[selectedSlot].click()
    } else {

      stack.splice(selectedSlot, 0, ''); // Inserta un elemento vacío en el slot seleccionado

      if (insertMode) selectNext()

      saveState();
      changeNumberMode(false);
      renderStack();
    }

    
  });

  // const fnModeButton = $('fnMode');
  // const keyboardElem = $('keyboard');

  // fnModeButton.addEventListener('click', function () {

  //   fnMode = !fnMode

  //   keyboardElem.classList.toggle('fn-mode')

  // })

  const holdModeButton = $('holdMode');

  holdModeButton.addEventListener('click', function () {

    holdMode = !holdMode

    holdModeButton.classList.toggle('active')
    if (!holdMode) {

      if (stack.length == 1 && stack[0] == '') compile('0')
      
      renderStack()
    }

  })

  const undoButton = $('undo');
  undoButton.addEventListener('click', function () {

    if (undoStack.length > 0) {
      redoStack.push({ stack: [...stack], selectedSlot });
      const prevState = undoStack.pop();
      stack = [...prevState.stack];
      selectedSlot = prevState.selectedSlot;
      renderStack();
    }

  })

  const redoButton = $('redo');
  redoButton.addEventListener('click', function () {
    if (redoStack.length > 0) {
      undoStack.push({ stack: [...stack], selectedSlot });
      const nextState = redoStack.pop();
      stack = [...nextState.stack];
      selectedSlot = nextState.selectedSlot;
      renderStack();
    }
  })

  function saveState() {

    if (holdMode) return
    redoStack = [];
    undoStack.push({ stack: [...stack], selectedSlot });

  }

  function addOption(textContent, selected) {
    return el('option', {
      textContent,
      ...(selected && { selected }),
    });
  }

  window.addEventListener('hashchange', function () {
    if (g_ignoreHashChange) {
      g_ignoreHashChange = false;
      return;
    }
    const hash = window.location.hash.substr(1);
    readURL(hash);
  });

  if (window.location.hash) {
    readURL(window.location.hash.substr(1))
  } else {
    saveState()
  }

  function render() {
    requestAnimationFrame(render)
    if (playing) updateTimeDisplay()
  }

  render()

  function readURL(hash) {

    const data = Object.fromEntries(new URLSearchParams(hash).entries());
    const t = data.t !== undefined ? parseFloat(data.t) : 0;
    const s = data.s !== undefined ? parseFloat(data.s) : 8000;

    let rateNdx = sampleRates.indexOf(s);
    if (rateNdx < 0) {
      rateNdx = sampleRates.length;
      sampleRateElem.appendChild(addOption(s));
      sampleRates.push(s);
    }
    setSelectOption(sampleRateElem, rateNdx);
    // setSelectOption(beatTypeElem, t);
    g_byteBeat.setType(parseInt(t));
    g_byteBeat.setDesiredSampleRate(parseInt(s));

    const bytes = convertHexToBytes(data.bb);

    compressor.decompress(bytes, function (text) {

      doNotSetURL = true;
      compile(text, true);

      stack = [...text.split(' ')]
      selectedSlot = stack.length - 1
      saveState()
      renderStack()

    },
      dummyFunction);

  }

  $('startTouchbitContainer').style.display = 'none';

}


function showSettingsDialog() {

  const themeSelector = $('selectTheme');
  const modeSelector = $('selectMode');
  const settingseDialogElem = $('settingsdialog');
  const keyHeight = $('keyHeight');
  const expFontSize = $('expFontSize');
  const debugModeSwitch = $('debugMode');
  const saveLogsSwitch = $('saveLogs');
  const viewLogs = $('viewLogs');
  const clearLogs = $('clearLogs');
  const eqGrph = $('eqGraph').getContext('2d');
    
  if (!g_settingsDialogInitialized) {
    g_settingsDialogInitialized = true;
    $('cancelSettings').addEventListener('click', close);
    themeSelector.addEventListener('change', save);
    debugModeSwitch.addEventListener('change', save);
    saveLogsSwitch.addEventListener('change', save);
    settingseDialogElem.addEventListener('click', close)
    settingseDialogElem.querySelector('.dialog').addEventListener('click', (e) => {
      e.stopPropagation()
    })

    viewLogs.addEventListener('click', () => {
      $('logs').innerHTML = logs
      $('logsDialog').classList.add('active')
    })

    clearLogs.addEventListener('click', () => {
      logs = ""
    })

    $('cancelLogs').addEventListener('click', () => {
      $('logsDialog').classList.remove('active')
    })


    $('randomizeBtn').addEventListener('click', setRandomTheme)
    keyHeight.addEventListener('change', save);
    expFontSize.addEventListener('change', save);
    $('restoreSettings').addEventListener('click', restoreSettings)

    $("eqSwitch").addEventListener("change", (ev) => {
      g_filter.effect = ev.target.checked
      if(ev.target.checked) {
        $('eqOptions').removeAttribute('disabled');
      } else {
        $('eqOptions').setAttribute('disabled', 'disabled');
      }


    });

    for(let i=0;i<256;++i) {

      freqtab[i] = 20 * Math.pow(1000,i/256);
    }

    modeSelector.addEventListener('change', save)

    for(let i=0;i<7;++i){
      
      setEq(i)

      $(`eq${i}`).addEventListener('input',()=>{
        setEq(i)
      })
    }

    function setEq(i) {
      const v = $(`eq${i}`).value;
      g_filter.eq[i].value = v;

      $(`eq${i}-value`).innerHTML = v;


      DrawEq();
    }

    function getColor(varName) {
      const rootStyles = getComputedStyle(document.documentElement);
      return rootStyles.getPropertyValue(`--${varName}`).trim();
    }

    function DrawEq() {

      g_filter.getFrequencyResponse(freqtab, magtab, phasetab);
      for (let i = 0; i < 256; ++i) {
        const db = Math.log10(magtab[i]) * 20;
        eqGrph.fillStyle = getColor('graph-background')
        eqGrph.fillRect(i * 2, 0, 2, 300);
        eqGrph.fillStyle = getColor('graph-fill');
        eqGrph.fillRect(i * 2, 300, 2, -150 - db * 4);
      }
      eqGrph.fillStyle = getColor('graph-lines');
      for (let i = 10, d = 10; i; i += d) {
        if (i >= 100) d = 100;
        if (i >= 1000) d = 1000;
        if (i >= 10000)
          break;
        const x = Math.log10(i / 20) / 3 * 256;
        eqGrph.fillRect(x * 2 | 0, 0, 1, 300);
      }
      eqGrph.fillText("100", 123, 296);
      eqGrph.fillText("1k", 292, 296);
      eqGrph.fillText("10k", 456, 296);
      for (let i = -160; i <= 160; i += 40) {
        eqGrph.fillRect(0, 150 - i, 512, 1);
        eqGrph.fillText((i / 4) + "dB", 0, 150 - i);
      }
    }

  }

  settingseDialogElem.classList.add('active')


  function save() {
    document.documentElement.dataset.theme = themeSelector.value

    localStorage.setItem('theme', themeSelector.value);

    localStorage.setItem('mode', modeSelector.selectedIndex);

    g_byteBeat.setType(modeSelector.selectedIndex);

    if (isPeerOpen()) signal('mode', modeSelector.selectedIndex)
    setURL()

    $('main').style.setProperty('--key-height', `${keyHeight.value}px`);
    $('main').style.setProperty('--key-active-height', `${keyHeight.value - 2}px`);
    localStorage.setItem('key-height', keyHeight.value);

    $('main').style.setProperty('--exp-font-size', `${expFontSize.value}px`);
    localStorage.setItem('expFontSize', expFontSize.value);

    debugMode = debugModeSwitch.checked;
    localStorage.setItem('debugMode', debugMode);

    saveLogs = saveLogsSwitch.checked;
    localStorage.setItem('saveLogs', saveLogs);

    viewLogs.disabled = !saveLogs
    clearLogs.disabled = !saveLogs

    $('main').style.setProperty('--key-active-height', `${keyHeight.value - 2}px`);

    if (themeSelector.value == 'randomize') {
      setRandomTheme()
    } else {
      document.documentElement.style = ''
    }

  }

  function restoreSettings() {
    document.documentElement.style = ''
    $('main').style = ''
    themeSelector.value = 'default'
    modeSelector.selectedIndex = 0
    g_byteBeat.setType(0);

    document.documentElement.dataset.theme = 'default'
    expFontSize.value = 22
    keyHeight.value = 45
    debugModeSwitch.checked = false
    document.documentElement.dataset.editionMode = 'replace';
    localStorage.clear()
  }
  function close() {
    settingseDialogElem.classList.remove('active')
  }

}
const dummyFunction = () => { }

const pad = (num,pos) => String(num).slice(-pos).padStart(pos, '0')

const updateTimeDisplay = () => {

  const g_time = g_byteBeat.getTime();
  const g_type = g_byteBeat.getType();

  const stack = ByteBeatNode.createStack();
  let sample = g_byteBeat.getSampleForTime(g_time, g_context, stack);

  if(g_type == 0) {
    sample = pad(sample & 255,3)
  } else {
    sample = sample.toFixed(2)
    if(sample >= 0) sample = ` ${sample}`
  }

  timeElem.innerHTML = `<span class="t">${g_time}</span> → <span class="s">${sample}</span>`

}

async function setExpressions(expressions, resetToZero) {

  compileStatusElem.classList.remove('error');
  $('debugger').classList.remove('error');
  $('debugger').textContent = ''

  let error;
  try {

    await g_byteBeat.setExpressions(expressions, resetToZero)
  } catch (e) {
    error = e;

  }

  if (error) {
    compileStatusElem.classList.add('error');


    if (debugMode) {
      $('debugger').classList.add('error');
      $('debugger').textContent = error
    }

  } else {

    if (saveLogs) saveLog(`COMPILE ${expressions}`)

  }


  setURL();
}

function compile(text, resetToZero) {

  text = text.trim()
  if (text == '') text = "0"

  if (lastCompiled == text) return
  lastCompiled = text;

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
  compressor.compress(stack.join(' '), 1, function (bytes) {
    const hex = convertBytesToHex(bytes);
    g_ignoreHashChange = true;
    const params = new URLSearchParams({
      t: g_byteBeat.getType(),
      s: g_byteBeat.getDesiredSampleRate(),
      e: g_byteBeat.getExpressionType(),
      bb: hex,
    });
    window.location.replace(`#${params.toString()}`);
    $('toGreggman').href = `https://bytebeat.demozoo.org#${params.toString()}`
  },
    dummyFunction);
}

{

  let theme = localStorage.getItem('theme');

  if (theme !== null) {
    document.documentElement.dataset.theme = theme;
    $('selectTheme').value = theme;

    if (theme == 'randomize') setRandomTheme()
  }


  let mode = localStorage.getItem('mode');

  if(mode !== null){
    $('selectMode').selectedIndex = mode
  }


  const keyHeight = localStorage.getItem('key-height');

  if (keyHeight !== null) {
    $('main').style.setProperty('--key-height', `${keyHeight}px`);
    $('main').style.setProperty('--key-active-height', `${parseInt(keyHeight) - 2}px`);
    $('keyHeight').value = keyHeight;
  }

  const expFontSize = localStorage.getItem('expFontSize');
  if (expFontSize !== null) {
    $('main').style.setProperty('--exp-font-size', `${expFontSize}px`);
    $('expFontSize').value = expFontSize;
  }

  const debugM = localStorage.getItem('debugMode');
  if (debugM !== null) {
    debugMode = JSON.parse(debugM)
    $('debugMode').checked = debugMode;
  }

  const saveL = localStorage.getItem('saveLogs');
  if (saveL !== null) {
    saveLogs = JSON.parse(saveL)
    $('saveLogs').checked = saveLogs;
    $('viewLogs').disabled = !saveLogs;
    $('clearLogs').disabled = !saveLogs;
  }

  $('loadingContainer').style.display = 'none';

  $('startTouchbit').addEventListener('click', main)

  $('copyToClipboard').addEventListener('click', (event) => {
    event.preventDefault();
    navigator.clipboard.writeText(stack.join(' '))
      .then(() => {
        $('clipStatus').innerText = "✓"

        setTimeout(() => {
          $('clipStatus').innerText = ""
        }, 1000)
      })
      .catch(() => {
        $('clipStatus').innerText = "𐄂"

        setTimeout(() => {
          $('clipStatus').innerText = ""
        }, 1000)

      })
  })

  const isSafari = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1

  if (isSafari) {

    let drags = new Set() //set of all active drags
    document.addEventListener("touchmove", function (event) {
      if (!event.isTrusted) return //don't react to fake touches
      Array.from(event.changedTouches).forEach(function (touch) {
        drags.add(touch.identifier) //mark this touch as a drag
      })
    })
    document.addEventListener("touchend", function (event) {
      if (!event.isTrusted) return
      let isDrag = false
      Array.from(event.changedTouches).forEach(function (touch) {
        if (drags.has(touch.identifier)) {
          isDrag = true
        }
        drags.delete(touch.identifier) //touch ended, so delete it
      })
      if (!isDrag && document.activeElement == document.body) {
        //note that double-tap only happens when the body is active
        event.preventDefault() //don't zoom
        event.stopPropagation() //don't relay event
        event.target.focus() //in case it's an input element
        event.target.click() //in case it has a click handler
        event.target.dispatchEvent(new TouchEvent("touchend", event))
        //dispatch a copy of this event (for other touch handlers)
      }
    })

  }
}


function setRandomTheme() {

  document.documentElement.dataset.theme = "randomize"
  $('selectTheme').value = "randomize"

  function randomColor() {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return '#' + '0'.repeat(6 - randomColor.length) + randomColor;
  }

  function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  document.documentElement.style.setProperty('--background', randomColor());
  document.documentElement.style.setProperty('--text', randomColor());
  document.documentElement.style.setProperty('--t', randomColor());
  document.documentElement.style.setProperty('--command', randomColor());
  document.documentElement.style.setProperty('--number', randomColor());
  document.documentElement.style.setProperty('--symbol', randomColor());
  document.documentElement.style.setProperty('--border-radius', randomNumber(0, 10) + 'px');

}

window.addEventListener('beforeunload', () => {

  if (isPeerOpen()) {
    localStorage.setItem('peerId', conn.peer);
    conn.close();
  }

})

function saveLog(event) {

  const time = new Date().toLocaleString('en-us', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    }
  ).replace(/\//g, '-').replace(/,/g, '');


  if(event == "PLAY") {
    logs += `${time} SAMPLERATE ${g_byteBeat.getDesiredSampleRate()}` + '\n'
    console.log('✍🏻',time, `SAMPLERATE ${g_byteBeat.getDesiredSampleRate()}`)
    logs += `${time} COMPILE ${lastCompiled}` + '\n'
    console.log('✍🏻',time, `COMPILE ${lastCompiled}`)
  }

  logs += `${time} ${event}` + '\n'
  console.log('✍🏻',time, event)
}