<template>
    <div class="absolute top-0 left-0 w-full pointer-events-none">
        <WaveformVisualizer 
            :width="width" 
            :height="height" 
            :lineWidth="lineWidth"
            v-show="uiStore.visualizerType === 'waveform'" />
        <FrequencyVisualizer 
            :width="width" 
            :height="height" 
            v-show="uiStore.visualizerType === 'frequency'" />
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
    },
    lineWidth: {
        type: Number,
        default: 1
    }
});

const uiStore = useUIStore();
</script>
