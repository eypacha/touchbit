tdl.require('tdl.buffers');
tdl.require('tdl.fast');
tdl.require('tdl.models');
tdl.require('tdl.primitives');
tdl.require('tdl.programs');
tdl.require('tdl.textures');
tdl.require('tdl.webgl');

window.addEventListener('load', main);

function $(id) {
  return document.getElementById(id);
}

var g_byteBeat;
var g_visualizer;
var g_screenshot;
var g_saving = false;
var g_saveDialogInitialized = false;
var g_screenshotCanvas;
var g_screenshotContext;
var gl;
var playing = false;
var play;
var codeElem;
var helpElem;
var timeElem;
var playElem;
var byteBeatElem;
var beatTypeElem;
var expressionTypeElem;
var sampleRateElem;
var visualTypeElem;
var saveElem;
var compileStatusElem;
var canvas;
var requestId;
var compressor;
var controls;
var dontSet = true;
var g_slow = false;

function log(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
}

function main() {
  compressor = new LZMA( "js/lzma_worker.js" );
  canvas = $("visualization");
  controls = $("controls");

  g_byteBeat = new ByteBeat();
  if (!g_byteBeat.good) {
    alert("This page needs a browser the supports the Web Audio API or the Audio Data API: Chrome, Chromium, Firefox, or WebKit");
  }

  g_screenshotCanvas = document.createElement("canvas");
  g_screenshotCanvas.width = 400;
  g_screenshotCanvas.height = 100;
  g_screenshotContext = g_screenshotCanvas.getContext("2d");

  function resetToZero() {
    g_byteBeat.reset();
    g_visualizer.reset();
    g_visualizer.render();
    updateTimeDisplay();
  }

  helpElem = document.createElement('a');
  helpElem.href = "https://github.com/greggman/html5bytebeat";
  helpElem.innerHTML = "?";
  helpElem.className = "buttonstyle";
  controls.appendChild(helpElem);

  timeElem = document.createElement('button');
  controls.appendChild(timeElem);
  timeElem.addEventListener('click', resetToZero);

  function playPause() {
    playing = !playing;
    if (playing) {
      g_byteBeat.play();
      playElem.textContent = "pause ■";
    } else {
      g_byteBeat.pause();
      playElem.textContent = " play ▶";
      updateTimeDisplay();
    }
  }
  playElem = document.createElement('button');
  playElem.addEventListener('click', playPause);
  controls.appendChild(playElem);

  function addSelection(options, selectedIndex) {
    var select = document.createElement('select');
    for (var i = 0; i < options.length; ++i) {
      var option = document.createElement('option');
      option.textContent = options[i];
      if (i == selectedIndex) {
        option.selected = true;
      }
      select.appendChild(option);
    }
    return select;
  }

  beatTypeElem = addSelection(["bytebeat", "floatbeat", "signedbytebeat"], 0);
  beatTypeElem.addEventListener('change', function(event) {
    g_byteBeat.setType(event.target.selectedIndex);
    setURL();
  }, false);
  controls.appendChild(beatTypeElem);

  expressionTypeElem = addSelection(["infix", "postfix(rpn)", "glitch", "function"], 0);
  expressionTypeElem.addEventListener('change', function(event) {
    g_byteBeat.setExpressionType(event.target.selectedIndex);
    g_byteBeat.recompile();
  }, false);
  controls.appendChild(expressionTypeElem);

  var sampleRates = [8000, 11000, 22000, 32000, 44100, 48000];
  sampleRateElem = addSelection(["8kHz", "11kHz", "22kHz", "32kHz", "44kHz", "48kHz"], 0);
  sampleRateElem.addEventListener('change', function(event) {
    g_byteBeat.setDesiredSampleRate(sampleRates[event.target.selectedIndex]);
  }, false);
  controls.appendChild(sampleRateElem);

  visualTypeElem = addSelection(["none", "wave"], 1);
  visualTypeElem.addEventListener('change', function(event) {
    g_visualizer.setType(event.target.selectedIndex);
  }, false);
  controls.appendChild(visualTypeElem);

  saveElem = document.createElement("button");
  saveElem.textContent = "save";
  saveElem.addEventListener('click', startSave);
  controls.appendChild(saveElem);

  compileStatusElem = document.createElement('button');
  compileStatusElem.className = 'status';
  compileStatusElem.textContent = "---";
  controls.appendChild(compileStatusElem);

  if (g_slow) {
    g_visualizer = new NullVisualizer();
  } else {
    gl = tdl.webgl.setupWebGL(
      canvas,
      { alpha:false,
        antialias:false,
        preserveDrawingBuffer:true
      },
      function(){});

    g_visualizer = gl ? new WebGLVisualizer(canvas) : new CanvasVisualizer(canvas);
  }
  g_byteBeat.setVisualizer(g_visualizer);

  codeElem = $("code");
  codeElem.addEventListener('keyup', function(event) {
    if (event.keyCode == 37 ||
        event.keyCode == 38 ||
        event.keyCode == 39 ||
        event.keyCode == 40) {
      return;
    }

    compile(codeElem.value);
  }, false );

  codeElem.addEventListener('keydown', function(event) {
      if (event.keyCode == 9) {
          // Fake TAB
          event.preventDefault();

          var start = codeElem.selectionStart;
          var end = codeElem.selectionEnd;

          codeElem.value = codeElem.value.substring(0, start) + '\t' + codeElem.value.substring(end, codeElem.value.length);

          codeElem.selectionStart = codeElem.selectionEnd = start + 1;
          codeElem.focus();
      }
  }, false);

  window.addEventListener('keydown', function(event){
      if ((event.ctrlKey || event.metaKey) && event.keyCode == 83) {
          event.preventDefault();
          startSave();
      }
  });

  g_byteBeat.setOnCompile(handleCompileError);
  g_visualizer.setOnCompile(handleCompileError);

  if (window.location.hash) {
    var hash = window.location.hash.substr(1);
    readURL(hash);
  } else {
    readURL('t=0&e=0&s=8000&bb=5d000001001400000000000000001461cc403ebd1b3df4f78ee66fe76abfec87b7777fd27ffff85bd000');
  }

  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);
  {
    var s = $("startContainer");
    s.addEventListener('click', function() {
      s.style.display = "none";
      g_byteBeat.resume(playPause);
    }, false);
  }

  function render() {
    if (playing) {
      updateTimeDisplay();
      g_visualizer.render();
    }
    requestId = tdl.webgl.requestAnimationFrame(render, canvas);
  }
  render();

  function setSelectOption(select, selectedIndex) {
    select.options[select.selectedIndex].selected = false;
    select.options[selectedIndex].selected = true;
  }

  function readURL(hash) {
    var args = hash.split("&");
    var data = {};
    for (var i = 0; i < args.length; ++i) {
      var parts = args[i].split("=");
      data[parts[0]] = parts[1];
    }
    var t = data.t !== undefined ? data.t : 1
    var e = data.e !== undefined ? data.e : 0;
    var s = data.s !== undefined ? data.s : 8000;
    for (var i = 0; i < sampleRates.length; ++i) {
      if (s == sampleRates[i]) {
        setSelectOption(sampleRateElem, i);
        break;
      }
    }
    setSelectOption(beatTypeElem, t);
    setSelectOption(expressionTypeElem, e);
    g_byteBeat.setType(parseInt(t));
    g_byteBeat.setExpressionType(parseInt(e));
    g_byteBeat.setDesiredSampleRate(parseInt(s));
    var bytes = convertHexToBytes(data.bb);
    compressor.decompress(bytes, function(text) {
      codeElem.value = text;
      compile(text);
    },
    dummyFunction);
  }

  function onWindowResize(event) {
    g_byteBeat.resize(canvas.clientWidth, canvas.clientHeight);
    g_visualizer.resize(canvas.clientWidth, canvas.clientHeight);
  }
}
//  var dataURL = captureScreenshot(400, 100, firstLine);

function captureScreenshot(ctx, canvas, text) {
  var width = ctx.canvas.width;
  var height = ctx.canvas.height;
  ctx.fillStyle = "#008";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(canvas, 0, 0, width, height);
  ctx.font = "bold 20px monospace";
  var infos = [
    {x: 2, y: 2, color: "#000"},
    {x: 0, y: 1, color: "#000"},
    {x: 1, y: 0, color: "#000"},
    {x: 0, y: 0, color: "#FFF"}
  ];
  for (var i = 0; i < infos.length; ++i) {
    var info = infos[i];
    ctx.fillStyle = info.color;
    ctx.fillText(text, 20 + info.x, height - 20 + info.y, width - 40);
  }
  return g_screenshotCanvas.toDataURL();
}

function startSave() {
  if (!g_saving) {
    g_saving = true;
    var firstLine = strip(strip(codeElem.value.split("\n")[0]).replace(/^\/\//, ''));
    g_screenshot = captureScreenshot(g_screenshotContext, canvas, firstLine);
    showSaveDialog();
  }
}

function showSaveDialog() {
  function closeSave() {
    $("savedialog").style.display = "none";
    window.removeEventListener('keypress', handleKeyPress);
    g_saving = false;
    g_screenshot = "";  // just cuz.
  }
  function handleKeyPress(event) {
    log(event.keyCode);
    if (event.keyCode == 27) {
      closeSave()
    }
  }
  const saveData = (function() {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
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
          g_byteBeat.pause();
        }
        // there are issues where. The stack should be
        // reset if nothing else.
        const sampleRate = g_byteBeat.getDesiredSampleRate();
        const numSamplesNeeded = sampleRate * numSeconds | 0;
        const numChannels = 2;
        const wavMaker = new WavMaker(sampleRate, numChannels);
        const context = ByteBeat.makeContext();
        const stack = new WrappingStack();
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
        saveData(blob, "html5bytebeat.wav");
        if (wasPlaying) {
          g_byteBeat.play();
        }
      }
      closeSave();
    }
    realSave();
  }

  window.addEventListener('keypress', handleKeyPress);
  if (!g_saveDialogInitialized) {
    g_saveDialogInitialized = true;
    $("save").addEventListener('click', save);
    $("cancel").addEventListener('click', closeSave);
  }
  var saveDialogElem = $("savedialog");
  var screenshotElem = $("screenshot");
  saveDialogElem.style.display = "table";
  screenshotElem.src = g_screenshot;
}

function dummyFunction() {};

function updateTimeDisplay() {
  timeElem.innerHTML = g_byteBeat.getTime();
};

// Splits a string, looking for //:name
var g_splitRE = new RegExp(/\/\/\:([a-zA-Z0-9_-]+)(.*)/);
function splitBySections(str) {
  var sections = {};

  function getNextSection(str) {
    var pos = str.search(g_splitRE);
    if (pos < 0) {
      return str;
    }
    var m = str.match(g_splitRE);
    var sectionName = m[1];
    var newStr = getNextSection(str.substring(pos + 3 + sectionName.length));
    sections[sectionName] = newStr;
    return str.substring(0, pos);
  }
  str = getNextSection(str);
  if (str.length) {
    sections.default = str;
  }
  return sections;
}
function compile(text) {
  var sections = splitBySections(text);
  if (sections.default || sections.channel1) {
    var expressions = [sections.default || sections.channel1];
    if (sections.channel2) {
      expressions.push(sections.channel2);
    }
    g_byteBeat.setExpressions(expressions);
  }
  g_byteBeat.setOptions(sections);
  // comment in to allow live GLSL editing
  //g_visualizer.setEffects(sections);
}

function handleCompileError(error) {
  compileStatusElem.textContent = error ? error : "*";
  compileStatusElem.classList.toggle('error', error);
  if (error == null) {
    setURL();
  }
}

function convertHexToBytes(text) {
  var array = [];
  for (var i = 0; i < text.length; i += 2) {
    var tmpHex = text.substring(i, i + 2);
    array.push(parseInt(tmpHex, 16));
  }
  return array;
}

function convertBytesToHex(byteArray) {
  var hex = "";
  for (var i = 0, il = byteArray.length; i < il; i++) {
    if (byteArray[i] < 0) {
      byteArray[i] = byteArray[i] + 256;
    }
    var tmpHex = byteArray[i].toString(16);
    // add leading zero
    if (tmpHex.length == 1) {
      tmpHex = "0" + tmpHex;
    }
    hex += tmpHex;
  }
  return hex;
}

var nstrip = function(v) {
  return v;
}

var replaceRE = /\$\((\w+)\)/g;

/**
 * Replaces strings with property values.
 * Given a string like "hello $(first) $(last)" and an object
 * like {first:"John", last:"Smith"} will return
 * "hello John Smith".
 * @param {string} str String to do replacements in
 * @param {...} 1 or more objects conaining properties.
 */
var replaceParams = function(str) {
  var args = arguments;
  return str.replace(replaceRE, function(str, p1, offset, s) {
    for (var ii = 1; ii < args.length; ++ii) {
      if (args[ii][p1] !== undefined) {
        return args[ii][p1];
      }
    }
    throw "unknown string param '" + p1 + "'";
  });
};

function setURL() {
  if (dontSet) {
    dontSet = false;
    return;
  }
  compressor.compress(codeElem.value, 1, function(bytes) {
    var hex = convertBytesToHex(bytes);
    window.location.replace(
      '#t=' + g_byteBeat.getType() +
      '&e=' + g_byteBeat.getExpressionType() +
      '&s=' + g_byteBeat.getDesiredSampleRate() +
      '&bb=' + hex);
  },
  dummyFunction);
}

function WrappingStack(opt_stackSize) {
  var stackSize = opt_stackSize || 256;
  var sp = 0;
  var stack = [];
  for (var ii = 0; ii < stackSize; ++ii) {
    stack.push(0);
  }

  var push = function(v) {
    stack[sp++] = v;
    sp = sp % stackSize;
  };

  var pop = function() {
    sp = (sp == 0) ? (stackSize - 1) : (sp - 1);
    return stack[sp];
  };

  var pick = function(index) {
    var i = sp - Math.floor(index) - 1;
    while (i < 0) {
      i += stackSize;
    }
    return stack[i % stackSize];
  };

  var put = function(index, value) {
    i = sp - Math.floor(index);
    while (i < 0) {
      i += stackSize;
    }
    stack[i % stackSize] = value;
  };

  var getSP = function() {
    return sp;
  };

  return {
    pop: pop,
    push: push,
    pick: pick,
    put: put,
    sp: getSP,
  };
};

function ByteBeat() {
  var that = this;
  this.buffer0 = new Float32Array(4096);
  this.buffer1 = new Float32Array(4096);
  this.desiredSampleRate = 8000;
  this.time = 0;
  this.expandMode = 0;
  this.type = 0;
  this.expressionType = 0;
  this.int8 = new Int8Array(1);
  this.functions = [{f: function(t) {
    return Math.sin(t) * 0.1;
  }, array: false}];
  this.contexts = [ByteBeat.makeContext(), ByteBeat.makeContext()];
  this.expressions = ["Math.sin(t) * 0.1"];
  this.extra = {
    mouseX: 0,
    mouseY: 0,
    width: 1,
    height: 1,
    tiltX: 0,
    tiltY: 0,
    compass: 0,
    sampleRate: 0,
  };
  this.postfixTemplate = $("postfix-template").text;
  this.stacks = [new WrappingStack(), new WrappingStack()];

  window.addEventListener('mousemove', function(event) {
    var extra = that.extra;
    extra.mouseX = event.clientX;
    extra.mouseY = event.clientY;
  }, true);

  if (window.DeviceOrientationEvent) {
    // Listen for the deviceorientation event and handle the raw data
    window.addEventListener('deviceorientation', function(eventData) {
      var extra = that.extra;
      // gamma is the left-to-right tilt in degrees, where right is positive
      extra.tiltX = eventData.gamma;

      // beta is the front-to-back tilt in degrees, where front is positive
      extra.tiltY = eventData.beta;

      // alpha is the compass direction the device is facing in degrees
      extra.compass = eventData.alpha;
    }, false);
  }

  var webAudioAPI = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;
  if (webAudioAPI) {
    this.context = new webAudioAPI();
    this.node = this.context.createScriptProcessor(4096, 2, 2);
    //this.context = { };
    //this.node = {
    //  connect: function() { },
    //  disconnect: function() { }
    //};
    this.actualSampleRate = this.context.sampleRate;
    this.node.onaudioprocess = function(e) {
      var data = e.outputBuffer.getChannelData(0);
      that.process(data.length, data,
                   e.outputBuffer.getChannelData(1));
    };
    this.good = true;
  } else {
    var audio = new Audio()
    this.audio = audio;
    if (!audio.mozSetup) {
      return;
    }
    this.good = true;

    function AudioDataDestination(sampleRate, readFn) {
      // Initialize the audio output.
      var audio = new Audio();
      var channels = 2
      audio.mozSetup(channels, sampleRate);

      var currentWritePosition = 0;
      var prebufferSize = sampleRate * channels / 2; // buffer 500ms
      var tail = null, tailPosition;

      // The function called with regular interval to populate
      // the audio output buffer.
      setInterval(function() {
        var written;
        // Check if some data was not written in previous attempts.
        if(tail) {
          written = audio.mozWriteAudio(tail.subarray(tailPosition));
          currentWritePosition += written;
          tailPosition += written;
          if(tailPosition < tail.length) {
            // Not all the data was written, saving the tail...
            return; // ... and exit the function.
          }
          tail = null;
        }

        // Check if we need add some data to the audio output.
        var currentPosition = audio.mozCurrentSampleOffset();
        var available = currentPosition + prebufferSize - currentWritePosition;
        if(available > 0) {
          // Request some sound data from the callback function.
          var soundData = new Float32Array(available);
          readFn(soundData);

          // Writting the data.
          written = audio.mozWriteAudio(soundData);
          if(written < soundData.length) {
            // Not all the data was written, saving the tail.
            tail = soundData;
            tailPosition = written;
          }
          currentWritePosition += written;
        }
      }, 100);
    }

    this.actualSampleRate = 44100;//this.desiredSampleRate;
    var audioDestination = new AudioDataDestination(this.actualSampleRate, function(buffer) {
      if (playing) {
        that.process(buffer.length >> 1, buffer);
      }
    });
  }
};

function strip(s) {
  return s.replace(/^\s+/,"").replace(/\s+$/,"");
}

ByteBeat.makeContext = function() {
  return {
    console: {
      Math: {
        // because`log` gets changed to Math.log
        log: console.log.bind(console),
      },
    },
  };
};

ByteBeat.prototype.resize = function(width, height) {
  this.extra.width = width;
  this.extra.height = height;
};

ByteBeat.prototype.setVisualizer = function(visualizer) {
  this.visualizer = visualizer;
};

ByteBeat.prototype.reset = function() {
  this.time = 0;
};

ByteBeat.prototype.resume = function(callback) {
  if (this.context.resume) {
    console.log("called resume");
    this.context.resume().then(callback);
  } else {
    callback();
  }
};

ByteBeat.prototype.getTime = function() {
  return this.convertToDesiredSampleRate(this.time);
};

function removeCommentsAndLineBreaks(x) {
  // remove comments (hacky)
  x = x.replace(/\/\/.*/g, " ");
  x = x.replace(/\n/g, " ");
  x = x.replace(/\/\*.*?\*\//g, " ");
  return x;
}

var glitchToPostfix = (function() {
  var glitchToPostfixConversion = {
      'a': 't',
      'b': 'put',
      'c': 'drop',

      'd': '*',
      'e': '/',
      'f': '+',
      'g': '-',
      'h': '%',

      'j': '<<',
      'k': '>>',
      'l': '&',
      'm': '|',
      'n': '^',
      'o': '~',

      'p': 'dup',
      'q': 'pick',
      'r': 'swap',

      's': '<',
      't': '>',
      'u': '=',
      '/': '//',

      '!': '\n',
      '.': ' ',
  };

  var isCapitalHex = function(c) {
    return ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F'));
  };

  return function(x) {
    // Convert to postfix
    var postfix = [];

    x = x.replace("glitch://", ""); // remove "glitch:"
    x = removeCommentsAndLineBreaks(x);
    x = x.replace("glitch:", ""); // remove "glitch:"
    x = x.replace(/^[^!]*!/, ""); // remove label

    for (var i = 0; i < x.length; ++i) {
      var done = false;
      var imd = "";

      // NOTE: works by magic when number is at end. While gathering
      // imd if we're at the end of the string 'c' will be undefined
      // which will fail isCapitalHex and so the last imd will be put in
      // correctly.
      while (!done) {
        var c = x[i];
        if (isCapitalHex(c)) {
          imd = imd + c;
          ++i;
        } else {
          done = true;
          if (imd.length) {
            --i;
            c = "0x" + imd;
          }
        }
      }
      postfix.push(glitchToPostfixConversion[c] || c);
    }
    return postfix.join(" ");
  };

}());

ByteBeat.prototype.setOnCompile = function(callback) {
  this.onCompileCallback = callback;
};

ByteBeat.prototype.recompile = function() {
  this.setExpressions(this.getExpressions());
};

ByteBeat.prototype.setOptions = function(sections) {
  this.expandMode = (sections['linear'] !== undefined)
};

ByteBeat.prototype.setExpressions = function(expressions, extra) {
  var postfixTemplate = this.postfixTemplate;
  var evalExp;

  this.fnHeader = this.fnHeader || (function() {
    const keys = {};
    Object.getOwnPropertyNames(globalThis).forEach((key) => {
      keys[key] = true;
    });
    delete keys['Math'];
    delete keys['window'];
    return `
        var ${Object.keys(keys).sort().join(',\n')};
        var ${Object.getOwnPropertyNames(Math).map(key => {
          const value = Math[key];
          return (typeof value === 'function')
              ? `${key} = Math.${key}.bind(Math)`
              : `${key} = Math.${key}`
        }).join(',\n')};
    `;
  }());
  var fnHeader = this.fnHeader

  function is2NumberArray(v) {
    return Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number';
  }

  function expressionStringToFn(x, extra, expressionType) {
    x = removeCommentsAndLineBreaks(x);
    // Translate a few things.
    function replacer(str, obj, p1, name) {
      return obj.hasOwnProperty(p1) ? (name + p1) : str;
    }
    x = x.replace(/\bint\b/g, "floor");
    x = x.replace(/(?:extra\.)?(\w+)/g, function(substr, p1) {
      return replacer(substr, extra, p1, "extra.");
    });

    evalExp = `${fnHeader}${x}`;
    var fp = new Function('stack', 'window', 'extra', evalExp);
    var f = fp(undefined, undefined, undefined);
    var ctx = ByteBeat.makeContext();

    var stack = new WrappingStack();
    var tempExtra = Object.assign({}, extra);
    // check function
    var v = f(0, 0, stack, ctx, tempExtra);
    if (typeof v === 'function') {
      f = f();
      v = f(0, 0, stack, ctx, tempExtra);
    }
    var array = is2NumberArray(v);
    for (var i = 0; i < 1000; i += 100) {
      var s = f(i, i, stack, ctx, tempExtra);
      if (i == 0) {
        log("stack: " + stack.sp());
      }
      //log("" + i + ": " + s);
      if (typeof s === 'function') {
        f = f();
        s = 0;
      }
      if (is2NumberArray(s)) {
        continue;
      }
      if (typeof s != "number") {
        throw "NaN";
      }
    }

    return {f, array};
  }

  function postfixToInfix(x) {
    x = removeCommentsAndLineBreaks(x);
    // compress space
    x = x.replace(/(\r\n|\r|\n|\t| )+/gm, " ");
    var tokens = strip(x).split(" ");
    var steps = [];
    for (var i = 0; i < tokens.length; ++i) {
      var token = tokens[i];
      switch (token.toLowerCase()) {
      case '>':
        steps.push("var v1 = stack.pop();");
        steps.push("var v2 = stack.pop();");
        steps.push("stack.push((v1 < v2) ? 0xFFFFFFFF : 0);");
        break;
      case '<':
        steps.push("var v1 = stack.pop();");
        steps.push("var v2 = stack.pop();");
        steps.push("stack.push((v1 > v2) ? 0xFFFFFFFF : 0);");
        break;
      case '=':
        steps.push("var v1 = stack.pop();");
        steps.push("var v2 = stack.pop();");
        steps.push("stack.push((v2 == v1) ? 0xFFFFFFFF : 0);");
        break;
      case 'drop':
        steps.push("stack.pop();");
        break;
      case 'dup':
        steps.push("stack.push(stack.pick(0));");
        break;
      case 'swap':
        steps.push("var a1 = stack.pop();");
        steps.push("var a0 = stack.pop();");
        steps.push("stack.push(a1);");
        steps.push("stack.push(a0);");
        break;
      case 'pick':
        steps.push("var a0 = stack.pop();");
        steps.push("stack.push(stack.pick(a0));");
        break;
      case 'put':
        steps.push("var a0 = stack.pop();");
        steps.push("var a1 = stack.pick(0);");
        steps.push("stack.put(a0, a1);");
        break;
      case 'abs':
      case 'sqrt':
      case 'round':
      case 'tan':
      case 'log':
      case 'exp':
      case 'sin':
      case 'cos':
      case 'tan':
      case 'floor':
      case 'ceil':
      case 'int':
        steps.push("var a0 = stack.pop();");
        steps.push("stack.push(" + token + "(a0));");
        break;
      case 'max':
      case 'min':
      case 'pow':
        steps.push("var a0 = stack.pop();");
        steps.push("var a1 = stack.pop();");
        steps.push("stack.push(" + token + "(a1, a0));");
        break;
      case 'random':
        steps.push("stack.push(" + token + "());");
        break;
      case '/':
      case '+':
      case '-':
      case '*':
      case '%':
      case '>>':
      case '<<':
      case '|':
      case '&':
      case '^':
      case '&&':
      case '||':
        steps.push("var a1 = stack.pop();");
        steps.push("var a0 = stack.pop();");
        steps.push("stack.push((a0 " + token + " a1) | 0);");
        break;
      case '~':
        steps.push("var a0 = stack.pop();");
        steps.push("stack.push(~a0);");
        break;
      default:
        steps.push("stack.push(" + token + ");");
        break;
      }
    }

    steps.push("return stack.pop();");

    var exp = replaceParams(postfixTemplate, {
      exp: steps.join("\n")
    });
    return exp;
  }

  function compileExpression(x, expressionType, extra, window) {
    if (expressionType == 3) { // function
      x = `
          return function(t, i, stack, window, extra) { 
              ${strip(x)};
          }`;
    } else {
      if (expressionType == 2) { // glitch
        x = glitchToPostfix(x);
        expressionType = 1;
      }
      if (expressionType == 1) {  // postfix
        x = postfixToInfix(x);
      } else {  // infix
        x = `
            return function(t, i, stack, window, extra) { 
                return ${strip(x)};
            }`;
      }
    }
    const result = expressionStringToFn(x, extra, expressionType);
    return result;
  }

  var funcs = [];
  try {
    for (var i = 0; i < expressions.length; ++i) {
      var exp = expressions[i];
      if (exp != this.expressions[i]) {
        funcs.push(compileExpression(exp, this.expressionType, this.extra));
      } else {
        if (this.functions[i]) {
          funcs.push(this.functions[i]);
        }
      }
    }
  } catch(e) {
    if (this.onCompileCallback) {
      if (e.stack) {
        const m = /<anonymous>:1:(\d+)/.exec(e.stack);
        if (m) {
          const charNdx = parseInt(m[1]);
          console.error(e.stack);
          console.error(evalExp.substring(0, charNdx), '-----VVVVV-----\n', evalExp.substring(charNdx));
        }
      } else {
        console.error(e, e.stack);
      }
      this.onCompileCallback(e.toString());
    }
    return;
  }

  // copy the expressions
  this.expressions = expressions.slice(0);
  this.functions = funcs;
  if (this.onCompileCallback) {
    this.onCompileCallback(null);
  }
};

ByteBeat.prototype.convertToDesiredSampleRate = function(rate) {
  return Math.floor(rate * this.desiredSampleRate / this.actualSampleRate);
};

ByteBeat.prototype.setDesiredSampleRate = function(rate) {
  this.desiredSampleRate = rate;
  this.extra.sampleRate = rate;
};

ByteBeat.prototype.getDesiredSampleRate = function() {
  return this.desiredSampleRate;
};

ByteBeat.prototype.setExpressionType = function(type) {
  this.expressionType = type;
};

ByteBeat.prototype.getExpressions = function() {
  return this.expressions.slice(0);
};

ByteBeat.prototype.getExpressionType = function() {
  return this.expressionType;
};

ByteBeat.prototype.setType = function(type) {
  this.type = type;
};

ByteBeat.prototype.getType = function() {
  return this.type;
};

ByteBeat.prototype.process = function(dataLength, leftData, rightData) {
  var time = this.convertToDesiredSampleRate(this.time);
  var lastSample = this.convertToDesiredSampleRate(dataLength) + 2;
  if (this.buffer0.length < lastSample) {
    this.buffer0 = new Float32Array(lastSample);
    this.buffer1 = new Float32Array(lastSample);
  }
  var buffer0 = this.buffer0;
  var buffer1;
  //
  var fn0 = this.functions[0].f;
  var fn0Array = this.functions[0].array;
  var fn1 = (this.functions[1] || {}).f;
  var stack0 = this.stacks[0];
  var stack1 = this.stacks[1];
  var ctx0 = this.contexts[0];
  var ctx1 = this.contexts[1];
  var extra = this.extra;
  var int8 = this.int8;
  var divisor = 1;//this.expressionType === 3 ? this.getDesiredSampleRate() : 1;

  if (fn0Array) {
    buffer1 = this.buffer1;
    switch (this.type) {
      case 0: // bytebeat
        for (let i = 0; i < lastSample; ++i) {
          const s = fn0((time++) / divisor, undefined, stack0, ctx0, extra);
          buffer0[i] = (s[0] & 255) / 127 - 1;
          buffer1[i] = (s[1] & 255) / 127 - 1;
        }
        break;
      case 1:  // floatbeat
        for (let i = 0; i < lastSample; ++i) {
          const s = fn0((time++ / divisor), undefined, stack0, ctx0, extra);
          buffer0[i] = s[0];
          buffer1[i] = s[1];
        }
        break;
      case 2:  // signed bytebeat
        for (let i = 0; i < lastSample; ++i) {
          const s = fn0((time++) / divisor, undefined, stack0, ctx0, extra);
          int8[0] = s[0];
          buffer0[i] = int8[0] / 128;
          int8[0] = s[1];
          buffer1[i] = int8[0] / 128
        }
        break;
    }
  } else if (fn1) {
    buffer1 = this.buffer1;
    switch (this.type) {
      case 0: // bytebeat
        for (let i = 0; i < lastSample; ++i) {
          buffer0[i] = (fn0((time  ) / divisor, undefined, stack0, ctx0, extra) & 255) / 127 - 1;
          buffer1[i] = (fn1((time++) / divisor, undefined, stack1, ctx1, extra) & 255) / 127 - 1;
        }
        break;
      case 1:  // floatbeat
        for (let i = 0; i < lastSample; ++i) {
          buffer0[i] = fn0((time  ) / divisor, undefined, stack0, ctx0, extra);
          buffer1[i] = fn1((time++) / divisor, undefined, stack1, ctx1, extra);
        }
        break;
      case 2:  // signed bytebeat
        for (let i = 0; i < lastSample; ++i) {
          int8[0] = fn0((time  ) / divisor, undefined, stack0, ctx0, extra);
          buffer0[i] = int8[0] / 128;
          int8[0] = fn1((time++) / divisor, undefined, stack1, ctx1, extra);
          buffer1[i] = int8[0] / 128
        }
        break;
    }
  } else {
    buffer1 = this.buffer0;
    switch (this.type) {
      case 0: // bytebeat
        for (var i = 0; i < lastSample; ++i) {
          buffer0[i] = (fn0((time++) / divisor, undefined, stack0, ctx0, extra) & 255) / 127 - 1;
        }
        break;
      case 1: // floatbeat
        for (var i = 0; i < lastSample; ++i) {
          buffer0[i] = fn0((time++) / divisor, undefined, stack0, ctx0, extra);
        }
        break;
      case 2: // signed bytebeat
        for (var i = 0; i < lastSample; ++i) {
          int8[0] = fn0((time++) / divisor, undefined, stack0, ctx0, extra);
          buffer0[i] = int8[0] / 128;
        }
        break;
    }
  }
  if (dataLength) {
    var step = this.convertToDesiredSampleRate(dataLength) / dataLength;
    var ndx = 0;

    function interp(buf) {
      var n = ndx | 0;
      var f = ndx % 1;
      var v0 = buf[n];
      var v1 = buf[n + 1];
      return v0 + (v1 - v0) * f;
    }

    function trunc(buf) {
      return buf[ndx | 0];
    }

    var expandFn = this.expandMode ? interp : trunc;

    if (rightData) {
      for (var i = 0; i < dataLength; ++i) {
        leftData[i] = expandFn(buffer0);
        rightData[i] = expandFn(buffer1);
        ndx += step;
      }
    } else {
      for (var i = 0; i < dataLength; ++i) {
        leftData[i * 2] = expandFn(buffer0);
        leftData[i * 2 + 1] = expandFn(buffer1);
        ndx += step;
      }
    }
  }

  if (this.visualizer) {
    this.visualizer.update(buffer0, lastSample - 1);
  }

  this.time += dataLength;
};

ByteBeat.prototype.getSampleForTime = function(time, context, stack, channel = 0) {
  var divisor = this.expressionType === 3 ? this.getDesiredSampleRate() : 1;
  if (this.functions[0].array) {
    const s = this.functions[0].f(time / divisor, channel, stack, context, this.extra);
    return s[channel];
  }
  if (!this.functions[1]) {
    channel = 0;
  }
  const s = this.functions[channel].f(time / divisor, channel, stack, context, this.extra);
  switch (this.type) {
    case 0:
      return (s & 255) / 127 - 1;
    case 1:
      return s;
    case 2:
      this.int8[0] = s;
      return this.int8[0] / 128;
  }
};

ByteBeat.prototype.startOnUserGesture = function() {
  if (!this.startOnUserGestureCount || this.startOnUserGestureCount < 2) {
    this.startOnUserGestureCount = this.startOnUserGestureCount || 0;
    ++this.startOnUserGestureCount;
    if (this.startOnUserGestureCount == 2) {
      // iOS requires starting a sound during a user input event.
      var source = this.context.createOscillator();
      source.frequency.value = 440;
      source.connect(this.context.destination);
      if (source.start) {
        source.start(0);
      }
      setTimeout(function() {
        source.disconnect();
      }, 100);
    }
  }
};

ByteBeat.prototype.play = function() {
  if (this.node) {
    this.startOnUserGesture();
    this.node.connect(this.context.destination);
  }
};

ByteBeat.prototype.pause = function() {
  if (this.node) {
    this.node.disconnect();
  }
};

function Visualizer(canvas) {
  this.canvas = canvas;
  this.type = 1;
};

Visualizer.prototype.setType = function(type) {
  this.type = type;

};

Visualizer.prototype.setOnCompile = function(callback) {
  this.onCompileCallback = callback;
};

Visualizer.prototype.capture = function(callback) {
  this.captureCallback = callback;
};

Visualizer.prototype.handleCapture = function() {
  var fn = this.captureCallback;
  if (fn) {
    this.captureCallback = undefined;
    fn(this.canvas);
  }
};

function WebGLVisualizer(canvas) {
  Visualizer.call(this, canvas);
  this.type = 1;
  this.temp = new Float32Array(1);
  this.resolution = new Float32Array(2);
  this.effects = {
    wave: {
      uniforms: {
        position: 0,
        time: 0,
        resolution: this.resolution,
        color: new Float32Array([1, 0, 0, 1])
      }
    },
    sample: {
      uniforms: {
        offset: 0,
        time: 0,
        resolution: this.resolution,
        color: new Float32Array([0, 1, 0, 1])
      }
    },
    data: {
      uniforms: {
        offset: 0,
        time: 0,
        resolution: this.resolution,
        color: new Float32Array([0, 0, 1, 1])
      }
    }
  };

  this.effects.wave[gl.VERTEX_SHADER] = {
    defaultSource: $("waveVertexShader").text
  };
  this.effects.wave[gl.FRAGMENT_SHADER] = {
    defaultSource: $("waveFragmentShader").text
  };
  this.effects.sample[gl.VERTEX_SHADER] = {
    defaultSource: $("sampleVertexShader").text
  };
  this.effects.sample[gl.FRAGMENT_SHADER] = {
    defaultSource: $("sampleFragmentShader").text
  };
  this.effects.data[gl.VERTEX_SHADER] = {
    defaultSource: $("dataVertexShader").text
  };
  this.effects.data[gl.FRAGMENT_SHADER] = {
    defaultSource: $("dataFragmentShader").text
  };

  this.resize(512, 512);
};

tdl.base.inherit(WebGLVisualizer, Visualizer);

WebGLVisualizer.prototype.resize = function(width, height) {
  var canvas = this.canvas;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  var height = new tdl.primitives.AttribBuffer(1, width * 2);
  var column = new tdl.primitives.AttribBuffer(1, width * 2);
  for (var ii = 0; ii < width * 2; ++ii) {
    height.setElement(ii, [Math.sin(ii / width * Math.PI * 2)]);
    column.setElement(ii, [(ii >> 1) / width]);
  }
  var arrays = {
    height: height,
    column: column
  }
  var effects = this.effects;
  var wave = effects.wave;
  if (!wave.model) {
    var program = tdl.programs.loadProgram(
        wave[gl.VERTEX_SHADER].defaultSource,
        wave[gl.FRAGMENT_SHADER].defaultSource);
    wave.model = new tdl.models.Model(program, arrays, {}, gl.LINES/*gl.LINE_STRIP*/ /*gl.POINTS*/);
  } else {
    wave.model.setBuffers(arrays, true);
  }

  var data = effects.data;
  if (!data.model) {
    var tex = new tdl.textures.ExternalTexture(gl.TEXTURE_2D);
    var arrays = tdl.primitives.createPlane(2, 2, 1, 1);
    // Don't need the normals.
    delete arrays.normal;
    delete arrays.texCoord;
    // rotate from xz plane to xy plane
    tdl.primitives.reorient(arrays,
        [1, 0, 0, 0,
         0, 0, 1, 0,
         0, -1, 0, 0,
         0, 0, 0, 1]);
    var textures = {
        tex: tex,
    };
    var program = tdl.programs.loadProgram(
        data[gl.VERTEX_SHADER].defaultSource,
        data[gl.FRAGMENT_SHADER].defaultSource);
    data.model = new tdl.models.Model(program, arrays, textures);
    this.dataTex = tex;
  }

  this.dataContext = ByteBeat.makeContext();
  this.dataStack = new WrappingStack();
  this.sampleContext = ByteBeat.makeContext();
  this.sampleStack = new WrappingStack();

  this.dataWidth = 1024;
  var dataBuf = new Uint8Array(this.dataWidth);
  this.dataPos = 0;
  this.dataPixel = new Uint8Array(1);
  this.dataTex.setParameter(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  this.dataTex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.LUMINANCE, this.dataWidth, 1, 0,
      gl.LUMINANCE, gl.UNSIGNED_BYTE, dataBuf);
  this.dataBuf = dataBuf;
  this.dataTime = 0;

  var sample = effects.sample;
  if (!sample.model) {
    var tex = new tdl.textures.ExternalTexture(gl.TEXTURE_2D);
    var arrays = tdl.primitives.createPlane(2, 2, 1, 1);
    // Don't need the normals.
    delete arrays.normal;
    delete arrays.texCoord;
    // rotate from xz plane to xy plane
    tdl.primitives.reorient(arrays,
        [1, 0, 0, 0,
         0, 0, 1, 0,
         0, -1, 0, 0,
         0, 0, 0, 1]);
    var textures = {
        tex: tex,
    };
    var program = tdl.programs.loadProgram(
        sample[gl.VERTEX_SHADER].defaultSource,
        sample[gl.FRAGMENT_SHADER].defaultSource);
    sample.model = new tdl.models.Model(program, arrays, textures);
    this.sampleTex = tex;
  }

  this.sampleWidth = 1024;
  var sampleBuf = new Uint8Array(this.sampleWidth);
  this.samplePos = 0;
  this.samplePixel = new Uint8Array(1);
  this.sampleTex.setParameter(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  this.sampleTex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.LUMINANCE, this.sampleWidth, 1, 0,
      gl.LUMINANCE, gl.UNSIGNED_BYTE, sampleBuf);
  this.sampleBuf = sampleBuf;
  this.sampleTime = 0;

  this.oneVerticalPixel = 2 / canvas.height;
  this.width = width;
  this.height = height;
  this.position = 0;
  this.then = (new Date()).getTime() * 0.001;
  this.compiling = false;
};

WebGLVisualizer.prototype.reset = function() {
  this.then = (new Date()).getTime() * 0.001;
  for (var i = 0; i < this.height.numElements; ++i) {
    this.height.setElement(i, [0]);
  }
  this.position = 0;
  this.effects.wave.model.buffers.height.set(this.height);

  this.dataTime = 0;
  this.dataPos = 0;
  for (var i = 0; i < this.dataWidth; ++i) {
    this.dataBuf[i] = 0;
  }
  this.dataTex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.LUMINANCE, this.dataWidth, 1, 0,
      gl.LUMINANCE, gl.UNSIGNED_BYTE, this.dataBuf);

  this.sampleTime = 0;
  this.samplePos = 0;
  for (var i = 0; i < this.sampleWidth; ++i) {
    this.sampleBuf[i] = 0;
  }
  this.sampleTex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.LUMINANCE, this.sampleWidth, 1, 0,
      gl.LUMINANCE, gl.UNSIGNED_BYTE, this.sampleBuf);
};

WebGLVisualizer.prototype.setShaderGLSL = function(effect, vertexShaderSource, fragmentShaderSource) {
  if (!vertexShaderSource) {
    vertexShaderSource = effect[gl.VERTEX_SHADER].defaultSource;
  }
  if (!fragmentShaderSource) {
    fragmentShaderSource = effect[gl.FRAGMENT_SHADER].defaultSource;
  }

  effect[gl.VERTEX_SHADER].pending = vertexShaderSource;
  effect[gl.FRAGMENT_SHADER].pending = fragmentShaderSource;
}

WebGLVisualizer.prototype.compileIfPending = function() {
  if (this.compiling) {
    return;
  }

  if (this.compileShaderIfPending(this.effects.wave)) {
    return;
  }

  if (this.compileShaderIfPending(this.effects.sample)) {
    return;
  }

  if (this.compileShaderIfPending(this.effects.data)) {
    return;
  }
};

WebGLVisualizer.prototype.compileShaderIfPending = function(effect) {
  var pendingVertexShader = effect[gl.VERTEX_SHADER].pending;
  var pendingFragmentShader = effect[gl.FRAGMENT_SHADER].pending;

  // If there was nothing pending exit
  if (pendingVertexShader === undefined && pendingFragmentShader === undefined) {
    return false;
  }

  // clear pending
  effect[gl.VERTEX_SHADER].pending = undefined;
  effect[gl.FRAGMENT_SHADER].pending = undefined;

  // If there was no change exit.
  if (pendingVertexShader == effect[gl.VERTEX_SHADER].source &&
      pendingFragmentShader == effect[gl.FRAGMENT_SHADER].source) {
    //this.onCompileCallback(null);
    return false;
  }

  this.compiling = true;
  var that = this;
  this.programBeingCompiled = tdl.programs.loadProgram(pendingVertexShader, pendingFragmentShader, function(error) {
    that.handleCompile(error, effect, pendingVertexShader, pendingFragmentShader);
  });
  return true;
};

WebGLVisualizer.prototype.handleCompile = function(error, effect, vertexShaderSource, fragmentShaderSource) {
  this.compiling = false;
  if (error !== undefined) {
    if (this.onCompileCallback) {
      this.onCompileCallback(tdl.programs.lastError);
    }
  } else {
    effect.model.setProgram(this.programBeingCompiled);
    effect[gl.VERTEX_SHADER].source = vertexShaderSource;
    effect[gl.FRAGMENT_SHADER].source = fragmentShaderSource;
    if (this.onCompileCallback) {
      this.onCompileCallback(null);
    }
  }
  this.compileIfPending();
};

WebGLVisualizer.prototype.setEffects = function(sections) {
  this.setShaderGLSL(this.effects.wave, sections['glsl-wave-vs'], sections['glsl-wave-fs']);
  this.setShaderGLSL(this.effects.data, this.effects.data[gl.VERTEX_SHADER].defaultSource, sections['glsl-data-fs']);
  this.setShaderGLSL(this.effects.sample, this.effects.data[gl.VERTEX_SHADER].defaultSource, sections['glsl-sample-fs']);
  this.compileIfPending();
};

WebGLVisualizer.prototype.update = function(buffer, length) {
  if (!this.type) {
    return;
  }
  // Yes I know this is dumb. I should just do the last 2 at most.
  var dest = this.height.buffer;
  var offset = 0;
  var v = this.oneVerticalPixel;
  var v2 = v * 2;
  while (length) {
    var max = Math.min(length, this.width - this.position);
    var d = this.position * 2;
    var h1 = buffer[offset];
    for (let i = 0; i < max; ++i) {
      var h2 = buffer[++offset];
      var dy = h1 - h2;
      dest[d++] = h1;
      dest[d++] = Math.abs(dy) > v ? h2 : (h2 + (dy > 0 ? v2 : -v2));
      h1 = h2;
    }
    var view = new Float32Array(dest.buffer, this.position * 4 * 2, max * 2);
    this.effects.wave.model.buffers.height.setRange(view, this.position * 4 * 2);
    this.position = (this.position + max) % this.width;
    length -= max;
  }
};

WebGLVisualizer.prototype.render = function() {
  if (!this.type && !this.captureCallback) {
    return;
  }

  gl.clearColor(0,0,0.3,1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  var effects = this.effects;
  var wave = this.effects.wave;
  var data = this.effects.data;
  var sample = this.effects.sample;

  var canvas = this.canvas;
  this.resolution[0] = canvas.width;
  this.resolution[1] = canvas.height;

  this.dataTex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  this.dataPixel[0] = Math.round(g_byteBeat.getSampleForTime(this.dataTime++, this.dataContext, this.dataStack) * 127) + 127;
  gl.texSubImage2D(gl.TEXTURE_2D, 0, this.dataPos, 0, 1, 1, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.dataPixel);
  this.dataPos = (this.dataPos + 1) % this.dataWidth;

  this.sampleTex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  for (var ii = 0; ii < 2; ++ii) {
    this.samplePixel[0] = Math.round(g_byteBeat.getSampleForTime(this.sampleTime++, this.sampleContext, this.sampleStack) * 127) + 127;
    gl.texSubImage2D(gl.TEXTURE_2D, 0, this.samplePos, 0, 1, 1, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.samplePixel);
    this.samplePos = (this.samplePos + 1) % this.sampleWidth;
  }

  var now = (new Date()).getTime() * 0.001;

  data.uniforms.offset = this.dataPos / this.dataWidth;
  data.uniforms.time = now - this.then;
  data.model.drawPrep(data.uniforms);
  data.model.draw();

  if (false) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    sample.uniforms.offset = this.samplePos / this.sampleWidth;
    sample.uniforms.time = now - this.then;
    sample.model.drawPrep(sample.uniforms);
    sample.model.draw();
    gl.disable(gl.BLEND);
  }

  wave.uniforms.position = this.position / this.width;
  wave.uniforms.time = now - this.then;
  wave.model.drawPrep(wave.uniforms);
  wave.model.draw();

  this.handleCapture();
};

function CanvasVisualizer(canvas) {
  Visualizer.call(this, canvas);
  this.ctx = canvas.getContext("2d");
  this.temp = new Float32Array(1);
  this.resize(512, 512);
  this.type = 1;
};

tdl.base.inherit(CanvasVisualizer, Visualizer);

CanvasVisualizer.prototype.resize = function(width, height) {
  var canvas = this.canvas;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  this.positions = new Float32Array(width);
  this.oldPositions = new Float32Array(width);
  this.width = width;
  this.height = height;
  this.position = 0;
  this.drawPosition = 0;
  this.drawCount = 0;
};

CanvasVisualizer.prototype.reset = function() {
  this.position = 0;
  this.drawPosition = 0;
  this.drawCount = 0;
  var canvas = this.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

CanvasVisualizer.prototype.setEffects = function(sections) {
};

CanvasVisualizer.prototype.update = function(buffer, length) {
  if (!this.type && !this.captureCallback) {
    return;
  }
  // Yes I know this is dumb. I should just do the last 2 at most.
  var s = 0;
  var p = this.position;
  var ps = this.positions;
  while (length) {
    var max = Math.min(length, this.width - p);
    for (var i = 0; i < max; ++i) {
      ps[p++] = buffer[s++];
    }
    p = p % this.width;
    this.drawCount += max;
    length -= max;
  }
  this.position = p;
  this.handleCapture();
};

CanvasVisualizer.prototype.render = function() {
  if (!this.type) {
    return;
  }
  var count = Math.min(this.drawCount, this.width);
  var dp = this.drawPosition;
  var ctx = this.ctx;
  var old = this.oldPositions;
  var ps = this.positions;
  var halfHeight = this.height / 2;
  ctx.fillStyle = "rgb(255,0,0)";
  /* horizontal */
  while (count) {
    ctx.clearRect(dp, old[dp], 1, 1);
    var newPos = Math.floor(-ps[dp] * halfHeight + halfHeight);
    ctx.fillRect(dp, newPos, 1, 1);
    old[dp] = newPos;
    dp = (dp + 1) % this.width;
    --count;
  }

  /* vertical hack (drawing the wave vertically should be faster */
  /*
  var w = this.width;
  var h = this.height;
  var hw = Math.floor(w * 0.5);
  while (count) {
    var y = Math.floor(dp * h / w);
    var oldX = Math.floor(old[dp] * w / h * 0.3);
    ctx.clearRect(hw - oldX, y, oldX * 2, 1);
    var newPos = Math.floor(-ps[dp] * halfHeight + halfHeight);
    var x = Math.floor(newPos * w / h * 0.3);
    ctx.fillRect(hw - x, y, x * 2, 1, 1);
    old[dp] = newPos;
    dp = (dp + 1) % this.width;
    --count;
  }
  */
  this.drawCount = 0;
  this.drawPosition = dp;
};

function NullVisualizer(canvas) {
  Visualizer.call(this, canvas);
};

tdl.base.inherit(NullVisualizer, Visualizer);

NullVisualizer.prototype.resize = function(width, height) {
};

NullVisualizer.prototype.reset = function() {
};

NullVisualizer.prototype.setEffects = function(sections) {
};

NullVisualizer.prototype.update = function(buffer, length) {
};

NullVisualizer.prototype.render = function() {
};
