<template>
  <div class="w-full h-[450px] p-2 flex flex-col gap-2">
   Theme
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMainStore } from '@/stores/mainStore';
import { useLocalStorageStore } from '@/stores/localStorageStore';
import { useLoggerStore } from '@/stores/loggerStore';
import { useCurrentExpression } from '@/composables/useCurrentExpression';
import Key from '@/components/common/Key.vue';

const store = useMainStore();
const localStorageStore = useLocalStorageStore();
const logger = useLoggerStore();
const expressionName = ref('');
const { currentExpression } = useCurrentExpression();

function saveCurrentExpression() {
  if (currentExpression.value) {
    const name = expressionName.value || 'Untitled';
    const success = localStorageStore.saveExpression(name, currentExpression.value);
    
    if (success) {
      expressionName.value = ''; // Clear input after save
      logger.log('SAVE', `Saved expression: ${name}`);
    }
  } else {
    logger.log('ERROR', 'Cannot save an empty expression');
  }
}

function loadExpression(expression) {
  store.setExpression(expression);
  logger.log('LOAD', `Loaded expression: ${expression}`);
}

function confirmDelete(id, name) {
  // In a more complex app, you might want to use a modal or dialog
  // For this simple implementation, we'll just use a confirm dialog
  if (confirm(`Delete expression "${name}"?`)) {
    deleteExpression(id, name);
  }
}

function deleteExpression(id, name) {
  const success = localStorageStore.deleteExpression(id);
  if (success) {
    logger.log('DELETE', `Deleted expression: ${name}`);
  }
}
</script>