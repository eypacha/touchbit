import { computed } from 'vue';
import { useMainStore } from '@/stores/mainStore';

/**
 * Composable para obtener la expresión actual de ByteBeat
 * @returns {Object} Objeto con la expresión actual como computed property
 */
export function useCurrentExpression() {
  const store = useMainStore();
  
  // Obtener la expresión actual del stack
  const currentExpression = computed(() => {
    // Verificar que el stack existe y es un array
    if (store.stack && Array.isArray(store.stack)) {
      // Filtrar elementos que no son 'empty' y no están deshabilitados
      // Extraer solo los datos de cada token
      // Unir todo con espacios
      const expression = store.stack
        .filter(item => item.type !== 'empty' && !item.disabled)
        .map(item => item.data)
        .join(' ');
      
      return expression;
    }
    return '';
  });
  
  return {
    currentExpression
  };
}
