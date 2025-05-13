<template>
    <div
      ref="numberRef"
      class="relative"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <span class="text-number">{{ formatedValue }}</span>
      <div v-if="selected && store.isEditingNumber">
        <button 
          class="absolute w-8 h-8 text-white transform -translate-x-1/2 -top-7 bg-number left-1/2"
          @click="incrementValue">
          <span>+</span>
        </button>
        <button 
          class="absolute w-8 h-8 text-white transform -translate-x-1/2 -bottom-7 bg-number left-1/2"
          @click="decrementValue">
          <span>-</span>
        </button>
      </div>
    </div>
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
    type: Number,
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
  // Si showDecimals es mayor que 0, redondeamos el valor
  if (props.showDecimals > 0) {
    return parseFloat(props.modelValue).toFixed(props.showDecimals);
  } else {
    // Si showDecimals es 0, devolvemos el valor entero
    return parseInt(props.modelValue);
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
  // Aquí puedes realizar acciones adicionales si es necesario
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
  const isModuloNumber = Number.isInteger(props.modelValue) && 
                        props.modelValue >= 0 && 
                        props.modelValue <= 255;
  
  if (isModuloNumber) {
    // Apply modulo 256 arithmetic
    value.value = (value.value + props.step) % 256;
  } else {
    // Regular increment with clamping
    value.value += props.step;
    value.value = clampValue(value.value);
  }
  
  // Emit the updated value
  emit('update:modelValue', value.value);
};

const decrementValue = () => {
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
</script>
