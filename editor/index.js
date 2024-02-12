/* eslint-disable */
/* global LZMA */

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
let g_settingsDialogInitialized = false;
let g_ignoreHashChange;
let playing = false;
let timeElem;
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
let fnMode = false;
let stack = [''];
let undoStack = [];
let redoStack = [];
let debugMode = false;
const longClickTime = 1000;

let clickTimerDelete;
let isDeleteLongClick = false;

let clickTimerSelectPrev;
let isLongClickSelectPrev = false;

let clickTimerSelectNext;
let isLongClickSelectNext = false;

let clickTimerInsert;
let isLongClickInsert = false;

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
      } else if(localStorage.getItem('peerId')) {
        $('receiver-id').value = localStorage.getItem('peerId');
        joinPeer();
      }

      localStorage.removeItem('peerId');
     
      
  });

  peer.on('connection', function (c) {
      // Disallow incoming connections
      c.on('open', function() {
          c.send("Sender does not accept incoming connections");
          setTimeout(function() { c.close(); }, 500);
      });
  });
  peer.on('disconnected', function () {
      console.log('Connection lost. Please reconnect');
      // Workaround for peer.reconnect deleting previous id
      peer.id = lastPeerId;
      peer._lastServerId = lastPeerId;
      peer.reconnect();
  });
  peer.on('close', function() {
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
      $('disconnect-button').classList.remove('hide')
  });

  // Handle incoming data (messages only since this is the signal sender)
  conn.on('data', function (data) {
      console.log("DATA" + data);

      switch (data.sigName) {
        case 'restore':
          console.log('restore',data);

          stack = [...data.stack];
          g_byteBeat.setDesiredSampleRate(data.sampleRate);
          setSelectOption(sampleRateElem, sampleRates.indexOf(data.sampleRate));

          document.querySelectorAll('.slot')[0].click();
          break;
        case 'requestSampleRate':
          console.log('SampleRate requested');
          signal('sampleRate', g_byteBeat.getDesiredSampleRate());
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

function signal(sigName,arg) {

  const data = {
    sigName: sigName,
    arg: arg
  }
  if (isPeerOpen()) {
      conn.send(data);
      console.log(data.sigName,data.arg + " signal sent");
  } else {
      console.log('Connection closed');
      // peerStatus.innerText = 'Connection closed';
      $('receiver-id').value = ''
      $('signalBtn').classList.add('hide')
  }
}

$('signalBtn').addEventListener('click', function () {
  if(!isPeerOpen()) return

  signal('process', stack)
})


$('connect-button').addEventListener('click', joinPeer);
$('disconnect-button').addEventListener('click',  () => {
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

  if(isPeerOpen()) signal('play')

  playing = true
  reconnect()
}

function pause() {
  if (!playing) return

  if(isPeerOpen()) signal('pause')

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

  // beatTypeElem = addSelection(s_beatTypes, 0, {
  //   onChange(event) {
  //     g_byteBeat.setType(event.target.selectedIndex);
  //     setURL();
  //   },
  // });
  // beatTypeElem.classList.add('byte-type')
  
  // controls.appendChild(beatTypeElem);

  sampleRateElem = addSelection(['8kHz', '11kHz', '22kHz', '32kHz', '44kHz', '48kHz'], 0, {

    onChange(event) {
      const sampleData = sampleRates[event.target.selectedIndex]
      g_byteBeat.setDesiredSampleRate(sampleData);
      if(isPeerOpen()) signal('sampleRate', sampleData)

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

        if (ndx === selectedSlot) {
          const plusOneDiv = document.createElement('button')
          plusOneDiv.className = 'modifier plus-one'
          plusOneDiv.textContent = '+'
          const minusOneDiv = document.createElement('button')
          minusOneDiv.className = 'modifier minus-one'
          minusOneDiv.textContent = '-'

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

      if (s === "t") slotDiv.classList.add('t')
      if (s === "\n") slotDiv.classList.add('break')

      if (['drop', 'dup', 'swap', 'pick', 'put'].includes(slotDiv.textContent.toLocaleLowerCase())) slotDiv.classList.add('special')

      if (s === "<<") slotDiv.textContent = "«"
      if (s === ">>") slotDiv.textContent = "»"
      if (s === "||") slotDiv.textContent = "‖"

      slotDiv.addEventListener('click', () => {

        changeNumberMode(selectedSlot == ndx && slotDiv.classList.contains('number'));
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
    numberMode ? stackContainer.classList.add("number-mode-on") : stackContainer.classList.remove("number-mode-on")

  }

  const symbols = document.querySelectorAll('.symbol');

  symbols.forEach(symbol => {
    symbol.addEventListener('click', function () {

      if (numberMode) {
        changeNumberMode(false)
        selectNext()
      }

      const newSymbol = this.getAttribute('data-insert')
      stack[selectedSlot] = newSymbol
      saveState()
      selectNext()

    })
  })

  const numbers = document.querySelectorAll('.number');

  numbers.forEach(number => {
    number.addEventListener('click', function () {

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

      saveState()
      changeNumberMode(true)

      renderStack()

    })

  })

  const modifiers = document.querySelectorAll('.modifier');

  modifiers.forEach(modifier => {
    modifier.addEventListener('click', function () {

      const newModifier = this.getAttribute('data-modifier')

      let evaluated = null
      // Verifica si el contenido del slot actual cumple con la condición numérica

      if (!isNaN(parseFloat(stack[selectedSlot])) && isFinite(stack[selectedSlot])) {
        // Si es un número, agrega el nuevo número a continuación del existente en el slot

        if (newModifier === "clear") {

          evaluated = stack[selectedSlot].slice(0, -1)
          if (evaluated === '') evaluated = "0"

        } else {

          evaluated = eval(stack[selectedSlot] + newModifier)
          evaluated = Math.round(evaluated * 100000) / 100000

        }


      } else {
        // Si no es un número, reemplaza el contenido del slot con el nuevo número
        if (newModifier === "clear") {
          evaluated = "0"
        } else {
          evaluated = eval(0 + newModifier)
          evaluated = Math.round(evaluated * 100000) / 100000
        }

      }

      stack[selectedSlot] = evaluated
      saveState()
      changeNumberMode(true)
      renderStack()

    })

  })

  function modifySlotValue(index, increment) {
    const currentValue = parseFloat(stack[index]);

    // Verifica si el valor actual es un número
    if (!isNaN(currentValue) && isFinite(currentValue)) {
      stack[index] = (currentValue + increment).toString();
      saveState()
      renderStack();
    }
  }

  const deleteButton = $('deleteSlot');

  deleteButton.addEventListener(keyDown, function (event) {

    deleteButton.classList.add('pressed')

    event.preventDefault()
    clickTimerDelete = setTimeout(function () {

      stack = [''];
      selectedSlot = 0;

      if (!holdMode) compile('0')

      saveState();
      changeNumberMode(false);
      renderStack();
      isDeleteLongClick = true;
    }, longClickTime);
  });

  deleteButton.addEventListener(keyUp, function () {

    deleteButton.classList.remove('pressed')
    clearTimeout(clickTimerDelete);

    if (!isDeleteLongClick) {
      if (stack.length == 1) {
        stack[0] = '';
        saveState();
      }
      if (stack.length > 1) {
        stack.splice(selectedSlot, 1);
        if (selectedSlot >= stack.length) selectedSlot = stack.length - 1;
      }

      changeNumberMode(false);
      renderStack();
    }

    isDeleteLongClick = false;
  });

  const insertButton = $('insertSlot');

  insertButton.addEventListener(keyDown, function (event) {

    insertButton.classList.add('pressed')

    event.preventDefault()
    clickTimerInsert = setTimeout(function () {

      stack.splice(selectedSlot, 0, '\n'); // Inserta un elemento vacío en el slot seleccionado
      saveState()
      selectNext();
      renderStack();
      isLongClickInsert = true;

    }, longClickTime);
  });

  insertButton.addEventListener(keyUp, function () {

    insertButton.classList.remove('pressed')
    clearTimeout(clickTimerInsert);

    if (!isLongClickInsert) {
      stack.splice(selectedSlot, 0, ''); // Inserta un elemento vacío en el slot seleccionado
      saveState();
      changeNumberMode(false);
      renderStack();
    }

    isLongClickInsert = false;
  });

  const fnModeButton = $('fnMode');
  const keyboardElem = $('keyboard');

  fnModeButton.addEventListener('click', function () {

    fnMode = !fnMode

    keyboardElem.classList.toggle('fn-mode')

  })

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
    // const t = data.t !== undefined ? parseFloat(data.t) : 1;
    const s = data.s !== undefined ? parseFloat(data.s) : 8000;

    let rateNdx = sampleRates.indexOf(s);
    if (rateNdx < 0) {
      rateNdx = sampleRates.length;
      sampleRateElem.appendChild(addOption(s));
      sampleRates.push(s);
    }
    setSelectOption(sampleRateElem, rateNdx);
    // setSelectOption(beatTypeElem, t);
    // g_byteBeat.setType(parseInt(t));
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
  const settingseDialogElem = $('settingsdialog');
  const keyHeight = $('keyHeight');
  const expFontSize = $('expFontSize');
  const debugModeSwitch = $('debugMode'); 

  if (!g_settingsDialogInitialized) {
    g_settingsDialogInitialized = true;
    $('cancelSettings').addEventListener('click', close);
    themeSelector.addEventListener('change', save);
    debugModeSwitch.addEventListener('change', save);
    settingseDialogElem.addEventListener('click', close)
    settingseDialogElem.querySelector('.dialog').addEventListener('click', (e) => {
      e.stopPropagation()
    })

    $('randomizeBtn').addEventListener('click', setRandomTheme)
    keyHeight.addEventListener('change', save);
    expFontSize.addEventListener('change', save);
    $('restoreSettings').addEventListener('click', restoreSettings)
  }

  settingseDialogElem.classList.add('active')


  function save() {
    document.documentElement.dataset.theme = themeSelector.value
    localStorage.setItem('theme', themeSelector.value);

    $('main').style.setProperty('--key-height', `${keyHeight.value}px`);
    $('main').style.setProperty('--key-active-height', `${keyHeight.value-2}px`);
    localStorage.setItem('key-height', keyHeight.value);

    $('main').style.setProperty('--exp-font-size', `${expFontSize.value}px`);
    localStorage.setItem('expFontSize', expFontSize.value);

    debugMode = debugModeSwitch.checked;
    localStorage.setItem('debugMode', debugMode);

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
    document.documentElement.dataset.theme = 'default'
    expFontSize.value = 22
    keyHeight.value = 40
    $('keyHeight').value = keyHeight;
    debugModeSwitch.checked = false
    localStorage.clear()
  }
  function close() {
    settingseDialogElem.classList.remove('active')
  }

}
const dummyFunction = () => { }

const updateTimeDisplay = () => timeElem.innerHTML = g_byteBeat.getTime()

async function setExpressions(expressions, resetToZero) {

  compileStatusElem.classList.remove('error');

  if(debugMode) {
    $('debugger').classList.remove('error');
    $('debugger').textContent = ''
  }

  let error;
  try {
    await g_byteBeat.setExpressions(expressions, resetToZero)
  } catch (e) {
    error = e;
    compileStatusElem.classList.add('error');

    if(debugMode) {
      $('debugger').classList.add('error');
      $('debugger').textContent = error
    }
  }


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
    $('toGreggman').href= `https://greggman.com/downloads/examples/html5bytebeat/html5bytebeat.html#${params.toString()}`
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

  const keyHeight = localStorage.getItem('key-height');

  if (keyHeight !== null) {
    $('main').style.setProperty('--key-height', `${keyHeight}px`);
    $('main').style.setProperty('--key-active-height', `${parseInt(keyHeight)-2}px`);
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

  $('loadingContainer').style.display = 'none';

  $('startTouchbit').addEventListener('click',main)

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

  if(isPeerOpen()) {
    localStorage.setItem('peerId', conn.peer);
    conn.close();
  }

})