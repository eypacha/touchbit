<template>
  <div class="h-full p-4 border-l border-border bg-background">
    <div ref="editorRoot" class="h-[calc(100%-4rem)] overflow-y-scroll overflow-x-hidden"></div>
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
Bytebeat is a form of algorithmic music that uses bitwise operations to generate sound, with only one variable t representing time. The expression is evaluated for each sample of the audio output with an implicit mod 256 at the end.
## Postfix
Touchbit uses postfix notation, also known as Reverse Polish Notation (RPN), to write expressions. This means the operator follows the operands. For example, the expression ${'`t 4 >>`'} in postfix notation represents t right shifted 4 times. This notation doesn't need parenthesis to define the order of operations because it operates on a stack to dictate precedence.
## Examples
Click the expression to load it.
- ${'`t t 10 >> 42 & t *`'}: 42 Melody
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