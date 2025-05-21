import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useLoggerStore } from './loggerStore';

export const useLocalStorageStore = defineStore('localStorage', () => {
  const logger = useLoggerStore();
  
  // List to store saved expressions
  const savedExpressions = ref([]);
  
  // Storage key for localStorage
  const STORAGE_KEY = 'touchbit-saved-expressions';
  
  // Initialize store from localStorage
  function initializeStore() {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        savedExpressions.value = JSON.parse(storedData);
        logger.log('INFO', `Loaded ${savedExpressions.value.length} saved expressions from localStorage`);
      }
    } catch (error) {
      logger.log('ERROR', `Failed to load saved expressions from localStorage: ${error.message}`);
    }
  }
  
  // Save current state to localStorage
  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedExpressions.value));
    } catch (error) {
      logger.log('ERROR', `Failed to save expressions to localStorage: ${error.message}`);
    }
  }
  
  // Watch for changes in savedExpressions and update localStorage
  watch(savedExpressions, () => {
    saveToLocalStorage();
  }, { deep: true });
  
  // Save a new expression
  function saveExpression(name, expression) {
    if (!expression) {
      logger.log('ERROR', 'Cannot save empty expression');
      return false;
    }
    
    // Check if we already have this expression saved
    const existingIndex = savedExpressions.value.findIndex(exp => exp.expression === expression);
    
    if (existingIndex !== -1) {
      // Update the existing expression with new name and timestamp
      const existing = savedExpressions.value[existingIndex];
      
      // Remove it from current position
      savedExpressions.value.splice(existingIndex, 1);
      
      // Update it and add to the beginning (most recent)
      existing.name = name || existing.name;
      existing.timestamp = new Date().toISOString();
      savedExpressions.value.unshift(existing);
      
      return true;
    }
    
    // Create a new expression object with timestamp as ID
    const newExpression = {
      id: Date.now(),
      name: name || `Untitled ${savedExpressions.value.length + 1}`,
      expression: expression,
      timestamp: new Date().toISOString()
    };
    
    // Add to the beginning (most recent)
    savedExpressions.value.unshift(newExpression);
    return true;
  }
  
  // Delete a saved expression
  function deleteExpression(id) {
    const index = savedExpressions.value.findIndex(exp => exp.id === id);
    if (index !== -1) {
      const deleted = savedExpressions.value.splice(index, 1)[0];
      logger.log('INFO', `Deleted expression: ${deleted.name}`);
      return true;
    }
    return false;
  }
  
  // Initialize the store when it's created
  initializeStore();
  
  return {
    savedExpressions,
    saveExpression,
    deleteExpression
  };
});
