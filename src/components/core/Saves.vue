<template>
  <div class="w-full h-[300px] p-2 flex flex-col gap-2">
    <!-- Save Expression Section -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <input
          class="flex-1 p-2 text-sm font-bold bg-transparent border rounded-md h-30 text-primary border-muted focus:outline-none focus:border-primary"
          :placeholder="currentExpression ?? 'Enter a name for this expression'"
          v-model="expressionName"
        />
        <Key color="action" @click="saveCurrentExpression" class="p-2 ">Save</Key>
         <Key color="secondary" @click="exportSavedExpressions" class="p-2 text-xs">Exp</Key>
          <Key color="secondary" @click="triggerFileInput" class="p-2 text-xs">Imp</Key>
          <input 
            type="file" 
            ref="fileInput" 
            accept=".json"
            class="hidden" 
            @change="importSavedExpressions" 
          />
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
        class="flex items-center px-1 mb-2 overflow-hidden border rounded-md border-muted bg-card group"
      >
        <button 
          class="flex-1 p-1 text-sm text-left hover:bg-muted group-hover:bg-muted/50 max-w-[calc(100%-1.5rem)]"
          @click="loadExpression(expression.expression, expression.id)"
          :title="expression.expression"
        >
          <div class="font-bold truncate text-foreground">{{ expression.name || expression.expression }}</div>
        </button>
        <button 
          class="p-1 text-muted-foreground hover:text-destructive"
          @click="deleteExpression(expression.id, expression.name || expression.expression)"
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
import { useUIStore } from '@/stores/uiStore';
import { useCurrentExpression } from '@/composables/useCurrentExpression';
import { useAudioStore } from '@/stores/audioStore';
import Key from '@/components/common/Key.vue';

const store = useMainStore();
const localStorageStore = useLocalStorageStore();
const logger = useLoggerStore();
const uiStore = useUIStore();
const audioStore = useAudioStore();
const expressionName = ref('');
const fileInput = ref(null);
const { currentExpression } = useCurrentExpression();

function saveCurrentExpression() {
  if (currentExpression.value) {
    const name = expressionName.value;
    const success = localStorageStore.saveExpression(name, currentExpression.value, audioStore.sampleRate);
    
    if (success) {
      expressionName.value = ''; // Clear input after save
      uiStore.saveUISettings();
      logger.log('SAVE', `Saved expression: ${name || currentExpression.value}`);
    }
  } else {
    logger.log('ERROR', 'Cannot save an empty expression');
  }
}

function loadExpression(expression, id) {
  // Find the expression by ID to get its sample rate
  const savedExpression = localStorageStore.savedExpressions.find(exp => exp.id === id || exp.expression === expression);
  
  // Set sample rate if available
  if (savedExpression && savedExpression.sampleRate) {
    audioStore.setSampleRate(savedExpression.sampleRate);
  }
  
  // Set the expression
  store.setExpression(expression);
  uiStore.saveUISettings();
  logger.log('LOAD', `Loaded expression: ${expression}`);
}
function deleteExpression(id, name) {
  const success = localStorageStore.deleteExpression(id);
  if (!success) logger.log('DELETE', `Deleted expression: ${name}`);
}

// Trigger file input for import
function triggerFileInput() {
  fileInput.value.click();
}

// Export saved expressions to JSON file
function exportSavedExpressions() {
  try {
    // Convert current format to expected output format
    const exportData = localStorageStore.savedExpressions.map(exp => ({
      exp: exp.expression,
      name: exp.name || '',
      rate: exp.sampleRate || audioStore.sampleRate
    }));
    
    // Create JSON data and download
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link and trigger it
    const link = document.createElement('a');
    link.href = url;
    link.download = 'touchbit-saves.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logger.log('SAVE', `Exported ${exportData.length} expressions to JSON`);
  } catch (error) {
    logger.log('ERROR', `Failed to export expressions: ${error.message}`);
  }
}

// Import saved expressions from JSON file
function importSavedExpressions(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importData = JSON.parse(e.target.result);
      
      if (!Array.isArray(importData)) {
        throw new Error('Invalid JSON format: expected an array');
      }
      
      let importCount = 0;
      
      // Process each expression in the imported data
      importData.forEach(item => {
        if (!item.exp) {
          logger.log('WARNING', 'Skipping import item without expression');
          return;
        }
        
        // Import each expression
        const success = localStorageStore.saveExpression(
          item.name || '', 
          item.exp,
          item.rate || audioStore.sampleRate
        );
        
        if (success) importCount++;
      });
      
      // Reset file input to allow importing the same file again
      event.target.value = '';
      
      logger.log('LOAD', `Imported ${importCount} expressions from JSON`);
    } catch (error) {
      logger.log('ERROR', `Failed to import expressions: ${error.message}`);
    }
  };
  
  reader.readAsText(file);
}
</script>