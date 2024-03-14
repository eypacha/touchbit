# Overview

**Touchbit** is a 'mobile-friendly' interface for live coding bytebeat music using postfix expressions, built on the [html5bytebeat](https://github.com/greggman/html5bytebeat) library by Greggman. This library provides a `ByteBeatNode` which is a WebAudio [`AudioNode`](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode). 

## 📜 Table of Contents

- [Usage](#📋-usage)
  - [Postfix](#➡️-postfix)
  - [Basic keys](#🔠-basic-keys)
  - [Operators](#🔣-operators)
  - [Numbers](#🔢-numbers)
- [Features](#🌟-features)
  - [Equalizer](#🎛️-equalizer)
  - [Styles](#🎨-styles)
  - [Sharing](#👥-sharing)
  - [Remote mode](#😎-remote-mode)
- [Some demos](#🎵-some-demos)
- [More info](#ℹ️-for-more-info)
- [Credits](#💜-credits)
- [Licence](#⚖️-license)


## 📋 Usage

You provide a function whose only input is time *t* and from that write some code to generate a sound. The output of your function is expected to be 0 to 255. 

If the output of your function exceeds 255, it will automatically undergo a modulo 255 operation anyway. Example:

[`t 10 >> 42 & t *`](https://dev.eypacha.com/touchbit/#t=0&s=8000&bb=5d000001001100000000000000003a08022320c71e600da2fd801a00aff0d5ef0fcd7fffe72aa000) 

Then, then touch the `▶`  button for listen your beat.

> [!IMPORTANT]
> Touchbit only performs with [postfix notation](#postfix) expressions.


### ➡️ Postfix
Postfix in this case I guess can be described as [forth](http://en.wikipedia.org/wiki/Forth_(programming_language)) like. It works with a stack. Each command either adds things to the stack or uses what's on the stack to do something. For example

    123       // pushes 123 on the stack               stack = 123
    456       // pushes 456 on the stack               stack = 123, 456
    +         // pop the stop 2 things on the stack
              // adds them, puts the result on the
              // stack                                 stack = 569

Note the stack is only 256 elements deep. If you push 257 elements it wraps around. Similarly if you use `pick` with a large value your pick will wrap around. The stack is neither cleared nor reset on each iteration of your function. Some postfix based bytebeat songs take advantage of this where each iteration leaves things on the stack for the next iteration.

### 🔠 Basic keys

#### `←` `→`  Arrow keys
You can navigate between the tokens of the expression. The selected token will be replaced by your next input key.

> [!TIP]
> Long press to navigate directly to the start or end.

#### `HOLD` Hold key
Presed once and you'll be able to edit the expression without be evaluated until you press the hold key again.

#### `INS` Insert key
Presed once and you will insert a empty token before your selected position.

Long press for enter to **Insert Mode**: every input key it will insert a empty token first (press again for exit insert mode). When in Insert Mode, the cursor indicator changes from a rectangle to a vertical line.

#### `DEL` Delete key
Deletes the selected token. (If in insert mode, deletes the character before the cursor.)

> [!CAUTION]
> Long press will erase the entire expression. There is no confirmation dialog box

#### `UNDO` `REDO`  keys
Reverse and reapply the most recent action or change.

## 🔢 Numbers

"When you press a number key for the first time, you will enter number mode. In this mode, you will see `+` and `-` buttons online, allowing you to increase or decrease the rightmost digit by 1.

You can also use `⌫`key to clear the rightmost digit.

> [!TIP]
> If you press the same number key again, a number editor window will open. Here, you can individually increase or decrease each digit.

## 🔣 Operators

The postfix operators are

* `=`, `≠`, `>`, `≥`, `<`, `≤`

  These take the top two things from the stack, do the comparision, then push 255 if the result is true or 0 if the result is false. 

* `drop`
Removes the top thing from the stack

* `dup`
Duplicates the top thing on the stack.

* `swap`
Swaps the top 2 things on the stack

* `pick`
Pops the top thing from the stack and duplicates one item that many items back. In other words if the stack is `1,2,3,4,5,6,7,3` then `pick` pops the top thing `3` and duplicates the 3rd thing back counting from 0, which is no `4`. The stack is then `1,2,3,4,5,6,7,4`.

* `put`

  Sets the n'th element from the top of the stack to the current top. In other words if the stack is `1,2,3,4,5,6,7,3,100` then put will pull the top `100` and then set the `3` element back. The stack will then be `1,2,3,4,100,6,7,3`.

* `abs`, `sqrt`, `tan`, `log`, `exp`, `sin`, `cos`, `tan`, `floor`, `ceil`, `min`, `max`, `pow`

  These operators all pop the top value from the stack, apply the operator, then push the result on the stack

* `/`, `+`, `-`, `*`, `%`, `>>`, `<<`, `|`, `&`, `^`, `&&`, `||` 

  These operators pop the top 2 values from the stack, apply the operator, then push the result. The order is as follows

      b = pop
      a = pop
      push(a op b)

  In other words `4 2 /` is 4 divided by 2.

* `~`
Pops the top of the stack, applies the binary negate to it, pushes the result.

> [!TIP]
> All operators in the top row display more options when long-pressed.

# 🌟 Features
Touchbit comes with a set of features tailored specifically to its interface, which is optimized for mobile devices.

## 🎛️ Equalizer 
Going to `Settings > Audio`, you can find a three-band equalizer for adjusting the **treble**, **middle**, and **bass** levels.

## 🎨 Styles
Going to `Settings > Styles`, you can choose between a few theme palettes or opt to randomize for going wild.

## 👥 Sharing
You can share your byte by copying the current URL or by going to `Settings > More`, where you can export the current expression to the [Greggman editor](https://bytebeat.demozoo.org/) or copy it to the clipboard.


## 😎 Remote mode

You can use your mobile device to remotely control another device. Open the [receiver](https://dev.eypacha.com/touchbit/receive/) in a web browser. Scan the QR code with your phone or paste the ID into the `Settings > More > Remote` input. Now you can use the key interface as a controller, and the expression will be evaluated on the secondary device.

A new `SEND` button will appear, which will be used to synchronize the expression between devices.

> [!TIP]
> The expression will be played back on both devices, with the mobile device serving as the monitor and the screen acting as the output master. Ideal for live performances.


## 🎵 Some demos

Click any expression for listen and edit:

[`t 10 >> 42 & t *`](https://dev.eypacha.com/touchbit/#t=0&s=8000&bb=5d000001001100000000000000003a08022320c71e600da2fd801a00aff0d5ef0fcd7fffe72aa000) 

*"the 42 melody", separately discovery by several people on irc etc*

[`t 5 * t 7 >> & t 3 * t 10 >> & |
`](https://dev.eypacha.com/touchbit/#t=0&s=8000&bb=5d000001002000000000000000003a0802a21110374e9e47df2702e314befe34e21e70386123d52ffffffd6bc000)

*from viznut [the 3rd iteration](http://youtu.be/tCRPUv8V22o) video*


[`t 34 ^ t 67 | t 5 >> & | t 15 >> 9 & 1 + * 2 * 0 t 19 >> 3 & 8 SWAP - t SWAP >> - 255 & + 2 / DUP`](https://dev.eypacha.com/touchbit/#t=0&s=8000&bb=5d000001006200000000000000003a0802636dade27e1a010d38eb504b71364ab686ec86e8789c78ea29c1b3e6c4c651b5b28f1c7ce0a3a02070358da719c86f64dda557d457e9d019ce0122a7b912b60b3da4920b255557ffe248e000)

*rhytimgrind from Glitch Machine*

[`t 10 >> 16 % 1 + / 10 % t * t 16 >> 3 % 1 + * DUP 9 PICK | t 5 >> t 7 >> - | + t 2 >> |
`](https://dev.eypacha.com/touchbit/#t=0&s=8000&bb=5d00000100630000000000000000188c2c6c3495df81c04a46ed1c57f4e6ddbed5682062f4663f9cbad77277ac9082192cd83e2434de4ec6717b4668b514b3e3a2dd9baba8b5c621fab79538faaa89791c117d3072a1d98cb73ffde4b300)

*quiddit from Glitch Machine*

## ℹ️ For more info

Check out <http://canonical.org/~kragen/bytebeat/> and be sure follow the many links.


## 💜 Credits

* [Gabriel Vinazza](https://github.com/gabochi) main user, tester, teacher and driving force of this project.
* [Greggman](https://github.com/greggman) for build the library and bring postfix to online bytebeat.
* [Macronodes](https://github.com/g200kg/webaudio-macronodes) library used as equalizer.
* [Peer.js](https://peerjs.com) WEBRTC peer-to-peer data library.

## ⚖️ License

[MIT](LICENSE.md)
