<template>
    <span
      ref="numberRef"
      class="relative"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @click="handleClick"
    >
      <span class="text-number">{{ formatedValue }}</span>
      <div v-if="selected && store.isEditingNumber">
        <button 
          class="absolute w-6 h-6 text-sm font-bold transform -translate-x-1/2 text-background -top-6 bg-number left-1/2"
          @click.stop="incrementValue">
          <span>+</span>
        </button>
        <button 
          class="absolute w-6 h-6 text-sm font-bold transform -translate-x-1/2 text-background -bottom-6 bg-number left-1/2"
          @click.stop="decrementValue">
          <span>-</span>
        </button>
      </div>
    </span>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import { useMainStore } from '@/stores/mainStore';

// Get store instance
const store = useMainStore();

// Referencia para el elemento root
const numberRef = ref(null);

// Definir las props del componente
const props = defineProps({
  modelValue: {
    type: [Number, String], // Permitir Number o String
    default: 0
  },
  min: {
    type: Number,
    default: -Infinity
  },
  max: {
    type: Number,
    default: Infinity
  },
  step: {
    type: Number,
    default: 1
  },
  showDecimals: {
    type: Number,
    default: 0
  },
  styled: {
    type: Boolean,
    default: true
  },
  selected: {
    type: Boolean,
    default: false
  }
});

const formatedValue = computed(() => {
  const rawValue = props.modelValue;

  // Si el valor es una cadena que termina en punto (ej. "4."), mostrarla tal cual.
  if (typeof rawValue === 'string' && rawValue.endsWith('.')) {
    return rawValue;
  }

  // Si showDecimals es mayor que 0, redondear y formatear el valor numérico.
  if (props.showDecimals > 0) {
    const numericValue = parseFloat(String(rawValue));
    // Si no es un número válido (ej. después de un parseo fallido), 
    // podríamos devolver el rawValue o un string vacío/predeterminado.
    // Por ahora, si es NaN, se devuelve como está para no perder la entrada del usuario.
    return isNaN(numericValue) ? String(rawValue) : numericValue.toFixed(props.showDecimals);
  } else {
    // Si no se especifican decimales (showDecimals === 0)
    const stringValue = String(rawValue);
    
    // Si el valor original (como string) ya incluye un punto, mostrarlo tal cual.
    // Esto cubre casos como "12.3" cuando showDecimals es 0, o "4."
    if (stringValue.includes('.')) {
      return stringValue;
    }
    // Caso especial del store: si el token en el store termina en punto y estamos editando.
    // Esto es para mostrar el punto tan pronto como se presiona, antes de que modelValue se actualice completamente.
    else if (props.selected && store.isEditingNumber &&
               store.stack[store.selectedToken]?.type === 'number' &&
               String(store.stack[store.selectedToken].data).endsWith('.')) {
      // Asegurarse de que no añadimos un segundo punto si modelValue ya lo tiene (aunque el if anterior debería cubrirlo)
      return stringValue.endsWith('.') ? stringValue : `${stringValue}.`;
    } else {
      // Si no tiene parte decimal y no es el caso especial del store, convertir a entero.
      const numericValue = parseInt(stringValue, 10);
      // Devolver el string original si no se puede parsear como entero, o el número parseado.
      return isNaN(numericValue) ? stringValue : String(numericValue);
    }
  }
});

// Emisión del evento
const emit = defineEmits(['update:modelValue']);

// Definir la referencia para el valor y el toque
const value = ref(props.modelValue);

// Variables para el toque
let startTouchY = ref(0);
let currentTouchY = ref(0);

// Función para limitar el valor dentro del rango
const clampValue = (newValue) => {
  return Math.min(Math.max(newValue, props.min), props.max);
};

// Maneja el inicio del toque
const startTouch = (event) => {
  startTouchY.value = event.touches[0].clientY;
};

// Maneja el movimiento del toque
const onTouchMove = (event) => {
  currentTouchY.value = event.touches[0].clientY;
  const delta = startTouchY.value - currentTouchY.value;

  if (Math.abs(delta) > 10) {

    store.saveToHistory();
    // Check if initial value is an integer between 0 and 255
    const isModuloNumber = Number.isInteger(props.modelValue) && 
                          props.modelValue >= 0 && 
                          props.modelValue <= 255;
    
    if (isModuloNumber) {
      // Apply modulo 256 arithmetic
      if (delta > 0) {
        value.value = (value.value + props.step) % 256; // Wrap around at 256
      } else {
        value.value = (value.value - props.step + 256) % 256; // Add 256 before modulo to handle negative numbers
      }
    } else {
      // Original behavior for other numbers
      if (delta > 0) {
        value.value += props.step; // Aumenta el valor
      } else {
        value.value -= props.step; // Disminuye el valor
      }
      
      // Asegúrate de que el valor esté dentro del rango permitido
      value.value = clampValue(value.value);
    }

    // Emitir el valor actualizado
    emit('update:modelValue', value.value);

    // Reinicia la posición del toque
    startTouchY.value = currentTouchY.value;
  }
};

// Maneja el fin del toque
const endTouch = () => {
  //store.toggleBinaryEditor();
};

// Observa los cambios en modelValue para ajustar el valor
watch(() => props.modelValue, (newVal) => {
  value.value = clampValue(newVal);
});

// Observa los cambios en value para emitir actualizaciones
watch(value, (newVal) => {
  emit('update:modelValue', newVal);
});

// Update touch handlers to only work when selected
const handleTouchStart = (event) => {
  if (!props.selected) return;
  startTouch(event);
};

const handleTouchMove = (event) => {
  if (!props.selected) return;
  onTouchMove(event);
};

const handleTouchEnd = (event) => {
  if (!props.selected) return;
  endTouch(event);
};

// Add these new functions for button clicks
const incrementValue = () => {
  // Check if number should use modulo 256 behavior
  store.saveToHistory();
  value.value += props.step;
  value.value = clampValue(value.value);
  
  // Emit the updated value
  emit('update:modelValue', value.value);
};

const decrementValue = () => {
  store.saveToHistory();

  // Check if number should use modulo 256 behavior
  const isModuloNumber = Number.isInteger(props.modelValue) && 
                        props.modelValue >= 0 && 
                        props.modelValue <= 255;
  
  if (isModuloNumber) {
    // Apply modulo 256 arithmetic (add 256 before modulo to handle negative numbers)
    value.value = (value.value - props.step + 256) % 256;
  } else {
    // Regular decrement with clamping
    value.value -= props.step;
    value.value = clampValue(value.value);
  }
  
  // Emit the updated value
  emit('update:modelValue', value.value);
};

// Add new handler for click to toggle binary editor
const handleClick = () => {

  if(store.isEditingNumber) {
    store.toggleBinaryEditor();
  } 

};
</script>
