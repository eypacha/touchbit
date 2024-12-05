<template>
    <div
      :class="[
      props.styled ? 'h-9 px-4 py-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground' : ''
    ]"
      @touchstart="startTouch"
      @touchmove="onTouchMove"
      @touchend="endTouch"
    >
      <span class="text-number">{{ formatedValue }}</span>
    </div>
</template>

  <script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';

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
    // Incrementa o decrementa el valor dependiendo de la dirección
    if (delta > 0) {
      value.value += props.step; // Aumenta el valor
    } else {
      value.value -= props.step; // Disminuye el valor
    }

    // Asegúrate de que el valor esté dentro del rango permitido
    value.value = clampValue(value.value);

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
</script>
