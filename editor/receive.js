/* eslint-disable */

import { createElem as el } from './elem.min.js';

import ByteBeatNode from '../js/ByteBeatNode.js';

import {
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
let playing = false;
let timeElem;
let playElem;
let beatTypeElem;
let settingsElem;
let compileStatusElem;
let controls;
let holdMode = false;
let debugMode = false;
let stack = [''];

//Peerjs
let lastPeerId = null;
let peer = null; // own peer object
let conn = null;

function connectFor2Channels() {
  console.log('connect',g_analyzers[0])

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
}

function pause() {
  if (!playing) return

  playing = false;
  g_byteBeat.disconnect()

}

async function main() {
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

  controls.appendChild(playElem);

  function resetToZero() {
    g_byteBeat.reset();
    updateTimeDisplay();
  }

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

  beatTypeElem = addSelection(s_beatTypes, 0, {
    onChange(event) {
      g_byteBeat.setType(event.target.selectedIndex);
    },
  });

  beatTypeElem.classList.add('byte-type')
  controls.appendChild(beatTypeElem);

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
      }

      if (s === "t") slotDiv.classList.add('t')
      if (s === "\n") slotDiv.classList.add('break')

      if (['drop', 'dup', 'swap', 'pick', 'put'].includes(slotDiv.textContent.toLocaleLowerCase())) slotDiv.classList.add('special')

      if (s === "<<") slotDiv.textContent = "«"
      if (s === ">>") slotDiv.textContent = "»"
      if (s === "||") slotDiv.textContent = "‖"


      stackContainer.appendChild(slotDiv)
    })

  }

  renderStack();


  function addOption(textContent, selected) {
    return el('option', {
      textContent,
      ...(selected && { selected }),
    });
  }

  function render() {
    requestAnimationFrame(render)
    if (playing) updateTimeDisplay()
  }

  render()


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

      const path = window.location.origin + window.location.pathname.slice(0,-9);

      new QRCode($('qrcode'), {
        text: `${path}?r=${peer.id}`,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.L
    });

      $('receiver-id').innerHTML = peer.id;
      console.log("Awaiting connection...");
    });

    peer.on('connection', function (c) {
      // Allow only a single connection
      if (conn && conn.open) {
        c.on('open', function () {
          c.send("Already connected to another client");
          setTimeout(function () { c.close(); }, 500);
        });
        return;
      }

      conn = c;
      console.log("Connected to: " + conn.peer);

      $('receiverDialog').classList.remove('active')
      ready();
      
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
      console.log('Connection destroyed');
      $('receiverDialog').classList.add('active')
    });
    peer.on('error', function (err) {
      console.log(err);
    });
  };

  function ready() {

    conn.on('data', function (data) {
      console.log("Data recieved");
      console.log(data);

      switch (data.sigName) {
        case 'hello':
          if (stack.length > 1 || stack[0] != '') {
            console.log('restoring expression data...')

            const data = {
              sigName: 'restore',
              stack: stack,
              sampleRate: g_byteBeat.getDesiredSampleRate()
            }

            conn.send(data)
          } else {
            console.log('no expression. requesting SampleRate...')
            conn.send({
              sigName: 'requestSampleRate'
            })
          }
          break;
        case 'play':
          play();
          break;
        case 'pause':
            pause();
            updateTimeDisplay();
            break;
        case 'process':
          stack = [...data.arg];
          renderStack();
          break;
        case 'sampleRate':
          g_byteBeat.setDesiredSampleRate(data.arg);
          break;
        default:
          console.log("data:", data);
          break;
      };
    });
    conn.on('close', function () {
      console.log("Connection reset");
      $('receiverDialog').classList.add('active')
      conn = null;
    });
  }
  initializePeer();

  $('receiver-id').addEventListener('click', function() {
    var elemento = this;

    if (document.selection) { // Para navegadores antiguos como IE
      var range = document.body.createTextRange();
      range.moveToElementText(elemento);
      range.select();
    } else if (window.getSelection) {
      var range = document.createRange();
      range.selectNodeContents(elemento);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });

  $('startTouchbitContainer').style.display = 'none';
}

function showSettingsDialog() {

  const themeSelector = $('selectTheme');
  const settingseDialogElem = $('settingsdialog');
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
    expFontSize.addEventListener('change', save);
    $('restoreSettings').addEventListener('click', restoreSettings)
  }

  settingseDialogElem.classList.add('active')


  function save() {
    document.documentElement.dataset.theme = themeSelector.value
    localStorage.setItem('theme', themeSelector.value);

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
    expFontSize.value = 50
    debugModeSwitch.checked = false
    localStorage.clear()
  }
  function close() {
    settingseDialogElem.classList.remove('active')
  }

}

const updateTimeDisplay = () => timeElem.innerHTML = g_byteBeat.getTime()

async function setExpressions(expressions, resetToZero) {

  compileStatusElem.classList.remove('error');

  if (debugMode) {
    $('debugger').classList.remove('error');
    $('debugger').textContent = ''
  }

  let error;
  try {
    await g_byteBeat.setExpressions(expressions, resetToZero)
  } catch (e) {
    error = e;
    compileStatusElem.classList.add('error');

    if (debugMode) {
      $('debugger').classList.add('error');
      $('debugger').textContent = error
    }
  }

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

{

  let theme = localStorage.getItem('theme');

  if (theme !== null) {
    document.documentElement.dataset.theme = theme;
    $('selectTheme').value = theme;

    if (theme == 'randomize') setRandomTheme()
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

window.addEventListener('beforeunload', function (event) {
  if (conn) { 
    conn.close();
  }
});
