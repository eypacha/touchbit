<template>
  <div class="h-[100dvh] p-4 border-l border-border bg-background">
    <div ref="editorRoot" class="h-full overflow-x-hidden overflow-y-scroll"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css"
import { useMainStore } from '@/stores/mainStore';
const store = useMainStore();

const editorRoot = ref(null);
let crepeInstance = null;

onMounted(() => {
  // Ahora el DOM está disponible
  if (editorRoot.value) {
    crepeInstance = new Crepe({
      root: editorRoot.value,
      defaultValue: `
# Touchbit!
Touchbit is a _mobile-friendly_ interface for composing and performing live bytebeat music using postfix expressions.
## Bytebeat
Bytebeat is a form of algorithmic __music that uses bitwise operations__ to generate sound, with only one variable t representing time. The expression is evaluated for each sample of the 8bits audio output.
## Postfix
Touchbit uses postfix notation, to write expressions. This means the operator follows the operands. For example, the expression ${'`t 4 >>`'} in postfix notation represents t right shifted 4 times. 
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
    });

    crepeInstance.create().then(() => {
      console.log("Editor created successfully");
      const editor = document.querySelector(".milkdown > div");
      if (editor) {
        editor.setAttribute("spellcheck", "false");
        
        // Add click event listener to the editor with event delegation
        editor.addEventListener("click", (event) => {
          // Check if the clicked element or any of its parents is a code element
          let targetElement = event.target;
          while (targetElement && targetElement !== editor) {
            if (targetElement.tagName === 'CODE') {
              console.log("Code element clicked:", targetElement.textContent);
              store.setExpression(targetElement.textContent);
              break;
            }
            targetElement = targetElement.parentElement;
          }
        });
      }
    });
  }
});

// Limpiar el editor cuando el componente se desmonte
onBeforeUnmount(() => {
  if (crepeInstance) {
    crepeInstance.destroy();
    console.log("Editor destroyed");
  }
});
</script>