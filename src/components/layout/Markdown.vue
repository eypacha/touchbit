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
import { WELCOME_TEXT, TUTORIAL } from '@/constants/milkdown';

const store = useMainStore();

const editorRoot = ref(null);
const tutorialPage = ref(0);
let crepeInstance = null;

// Función para crear el editor con un valor específico
const createEditor = (content) => {
  // Si ya existe un editor, lo destruimos primero
  if (crepeInstance) {
    crepeInstance.destroy();
    console.log("Editor destroyed");
  }

  // Crear nuevo editor con el contenido especificado
  crepeInstance = new Crepe({
    root: editorRoot.value,
    defaultValue: content
  });

  return crepeInstance.create().then(() => {
    console.log("Editor created with content:", content.substring(0, 20) + "...");
    
    // Configurar el editor después de crearlo
    const editor = document.querySelector(".milkdown > div");
    if (editor) {
      editor.setAttribute("spellcheck", "false");
      
      editor.addEventListener("click", (event) => {
        let targetElement = event.target;
        while (targetElement && targetElement !== editor) {
          if (targetElement.tagName === 'CODE') {
            const content = targetElement.textContent;
            console.log("Code element clicked:", content);

            switch (content) {
              case 'tutorial':
                console.log('Recreating editor with tutorial content');
                createEditor(TUTORIAL[0]);
                break;
              case 'welcome':
                console.log('Recreating editor with welcome content');
                createEditor(WELCOME_TEXT);
                break;
              case 'next page':
                if (tutorialPage.value < TUTORIAL.length - 1) {
                  tutorialPage.value++;
                  createEditor(TUTORIAL[tutorialPage.value]);
                }
                break;
              case 'prev page':
                if (tutorialPage.value > 0) {
                  tutorialPage.value--;
                  createEditor(TUTORIAL[tutorialPage.value]);
                }
                break;
              default:
                store.setExpression(content);
                break;
            }
          }
          targetElement = targetElement.parentElement;
        }
      });
    }
  });
};

onMounted(() => {
  if (editorRoot.value) {
    createEditor(WELCOME_TEXT);
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