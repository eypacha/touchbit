<template>
  <div>
    <div 
      v-for="(byteGroup, byteIndex) in groupedBits" 
      :key="'byte-' + byteIndex" 
      class="flex mb-1 last:mb-0"
    >
      <button
        v-for="(bit, bitIndex) in byteGroup"
        :key="`bit-${byteIndex * 8 + bitIndex}-${bit}`"
        @click="onToggleBit(byteIndex * 8 + bitIndex)"
        class="flex items-center justify-center w-[35px] h-15 text-5xl font-bold bg-transparent text-number hover:bg-number/10"
      >
        {{ bit }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  groupedBits: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['toggleBit']);

function onToggleBit(index) {
  emit('toggleBit', index);
}
</script>