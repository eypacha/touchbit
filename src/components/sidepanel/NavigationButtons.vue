<template>
  <div class="flex" :class="[
    { 'justify-between': showNext && showPrev, 'justify-start': !showNext && showPrev, 'justify-end': showNext && !showPrev },
    customClass
  ]">
    <span v-if="showPrev" class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(prevPage)">← {{ prevLabel }}</span>
    <span v-if="showNext" class="font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20" @click="navigateTo(nextPage)">{{ nextLabel }} →</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  navigateTo: {
    type: Function,
    required: true
  },
  prevPage: {
    type: Number,
    default: null
  },
  nextPage: {
    type: Number,
    default: null
  },
  prevLabel: {
    type: String,
    default: 'prev'
  },
  nextLabel: {
    type: String,
    default: 'next'
  },
  customClass: {
    type: String,
    default: ''
  }
});

const showPrev = computed(() => props.prevPage !== null);
const showNext = computed(() => props.nextPage !== null);
</script>
