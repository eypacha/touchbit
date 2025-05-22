<template>
    <canvas 
        ref="waveformCanvas" 
        class="absolute top-0 left-0 w-full h-full opacity-50 pointer-events-none" 
        :width="width" 
        :height="height">
    </canvas>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/mainStore';
import { useUIStore } from '@/stores/uiStore';
import { useThemeColor } from '@/composables/useThemeColor';

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

const store = useMainStore();
const uiStore = useUIStore();
const waveformCanvas = ref(null);
let visualizationInterval = null;

// Use the theme color composable
const { numberColor, updateColors } = useThemeColor();

onUnmounted(() => {
    if (visualizationInterval) {
        clearInterval(visualizationInterval);
    }
});

onMounted(() => {
    console.log("Waveform visualizer mounted with dimensions:", props.width, "x", props.height);
    
    const waveCtx = waveformCanvas.value.getContext('2d');
    waveCtx.imageSmoothingEnabled = false;
    
    // Optional: set a listener for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateColors);
    
    // Watch for play/pause changes
    watch(
        () => store.isPlaying,
        (isPlaying) => {
            console.log("isPlaying changed in waveform visualizer:", isPlaying);
            
            if (isPlaying) {
                if (uiStore.showVisualizer) {
                    startWaveformVisualization(waveCtx);
                }
            } else {
                if (visualizationInterval) {
                    clearInterval(visualizationInterval);
                    visualizationInterval = null;
                }
            }
        }
    );
    
    // Watch for waveform visualizer visibility changes
    watch(
        () => uiStore.showVisualizer,
        (showVisualizer) => {
            console.log("showVisualizer changed:", showVisualizer);
            if (showVisualizer && store.isPlaying) {
                // If visualizer is shown and audio is playing, start visualization
                startWaveformVisualization(waveCtx);
            } else if (!showVisualizer && visualizationInterval) {
                // If visualizer is hidden, stop the visualization
                clearInterval(visualizationInterval);
                visualizationInterval = null;
            }
        }
    );
});

function startWaveformVisualization(ctx) {
    console.log("Starting waveform visualization with interval");
    
    if (visualizationInterval) {
        clearInterval(visualizationInterval);
    }
    
    const updateVisualization = async () => {
        // Check if we should be visualizing (both playing and visualizer visible)
        if (!store.isPlaying || !uiStore.showVisualizer) {
            console.log("Stopping waveform visualization interval - isPlaying:", store.isPlaying, "showVisualizer:", uiStore.showVisualizer);
            clearInterval(visualizationInterval);
            visualizationInterval = null;
            return;
        }
        
        // Force update visualization data
        const data = await store.updateVisualization(props.width);
        
        if (data && data.left && data.right) {
            ctx.clearRect(0, 0, props.width, props.height);
            
            // Use the reactive number color
            ctx.lineWidth = 1;
            ctx.strokeStyle = numberColor.value;
            ctx.beginPath();
            for (let x = 0; x < props.width; ++x) {
                const y = (data.right[x] * 0.5 + 0.5) * props.height;
                if (x === 0) {
                    ctx.moveTo(x, props.height - y);
                } else {
                    ctx.lineTo(x, props.height - y);
                }
            }
            ctx.stroke();
        }
    };
    
    // Set interval for continuous updates
    visualizationInterval = setInterval(updateVisualization, 100);
    
    // Immediate update without waiting for interval
    updateVisualization();
}
</script>

<style scoped>
canvas {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    image-rendering: -moz-crisp-edges;
}
</style>
