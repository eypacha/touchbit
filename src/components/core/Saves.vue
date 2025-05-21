<template>
  <div class="w-full h-[300px] p-2 flex flex-col gap-2">
    <!-- Save Expression Section -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <input
          class="flex-1 p-2 font-bold bg-transparent border rounded-md text-md h-30 text-primary border-muted focus:outline-none focus:border-primary"
          :placeholder="currentExpression ?? 'Enter a name for this expression'"
          v-model="expressionName"
        />
        <Key color="action" @click="saveCurrentExpression" class="h-full">Save</Key>
      </div>
    </div>
    
    <!-- Saved Expressions List -->
    <div class="flex-1 pr-2 mt-3 overflow-y-scroll">
      <div v-if="localStorageStore.savedExpressions.length === 0" class="flex flex-col items-center justify-center py-8 text-sm italic text-center text-muted-foreground">
        <span>No saved expressions yet</span>
      </div>
      
      <div 
        v-for="expression in localStorageStore.savedExpressions" 
        :key="expression.id" 
        class="flex items-center mb-2 overflow-hidden border rounded-md border-muted bg-card group"
      >
        <button 
          class="flex-1 p-2 text-sm text-left hover:bg-muted group-hover:bg-muted/50"
          @click="loadExpression(expression.expression)"
          :title="expression.expression"
        >
          <div class="font-bold truncate text-foreground">{{ expression.name || 'Untitled' }}</div>
          <div class="text-xs truncate text-muted-foreground">{{ expression.expression }}</div>
        </button>
        <button 
          class="p-2 text-muted-foreground hover:text-destructive"
          @click="confirmDelete(expression.id, expression.name)"
          title="Delete"
        >
          <span class="text-lg">×</span>
        </button>
      </div>
    </div>
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