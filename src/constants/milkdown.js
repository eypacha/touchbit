export const WELCOME_TEXT = `
# Touchbit!
Touchbit is a _mobile-friendly_ interface for composing and performing live bytebeat music using postfix expressions.
## Bytebeat
Bytebeat is a form of algorithmic __music that uses bitwise operations__ to generate sound, with only one variable t representing time. The expression is evaluated for each sample of the 8bits audio output. You can lear more clicking on this ${'`tutorial`'}.
## Examples
Click the expression to load it.
- ${'`t t 8 >> &`'}: __Minimal Sierpinski__
- ${'`t 92 | .896 * 96 |`'}: __hardcOR__ by Gede
- ${'`t t 4 >> | 0.999 *`'}: __untaunta__ by eypacha
- ${'`t 13 >> t ~ 12 >> | 7 % t * 96 &`'}: __this != copla__ by eypacha
- ${'`t t 10 >> 42 & t *`'}: __42 Melody__
- ${'`t 255 % t 511 & ^ 3 *`'}: __Starlost__ from Glitch Machine
## Shortcuts
This interface is designed primarily for mobile, but... if you're using it on a computer, these shortcuts might come in handy. First, click any button on the keyboard to activate focus. Now you can press keys to enter tokens. Other keys:
- __<__      Right Shift
- __>__       Left Shift
- __Space__   Play/Pause
- __U__       Undo
- __R__       Redo
- __I__       Insert
- __H__       Hold




`

export const TUTORIAL = [
    `

# Tutorial

## Notation
Touchbit uses _postfix notation_ to write expressions. This means __the operator comes after the operands__. For example, instead of writing __3 + 4__, you write ${'`3 4 +`'}. Click the previews to see the result in the bottom right corner. Then use the keyboard or double-click the tokens (once to select and again to edit) to change them and see the result.

## Bytebeat
But touchbit is not about lear notations, it's about __bytebeat__!, a form of algorithmic music, using bit to bit operations. 

`
]