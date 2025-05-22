<template>
    <div class="absolute top-0 left-0 w-full h-[calc(100dvh-393px)]">
        <WaveformVisualizer 
            :width="width" 
            :height="height" 
            v-if="uiStore.showVisualizer" />
        <FrequencyVisualizer 
            :width="width" 
            :height="height" 
            v-if="uiStore.showFrequencyVisualizer" />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUIStore } from '@/stores/uiStore';
import WaveformVisualizer from './visualizers/WaveformVisualizer.vue';
import FrequencyVisualizer from './visualizers/FrequencyVisualizer.vue';

const props = defineProps({
    width: {
        type: Number,
        default: 300
    },
    height: {
        type: Number,
        default: 256
    }
});

const uiStore = useUIStore();
</script>
