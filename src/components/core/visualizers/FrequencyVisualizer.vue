<template>
    <canvas 
        ref="frequencyCanvas" 
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
const frequencyCanvas = ref(null);
let analyzerInterval = null;
let audioContext = null;
let analyser = null;
let dataArray = null;

// Use the theme color composable
const { numberColor, updateColors } = useThemeColor();

// Memory cleanup handler
const handleMemoryCleanup = () => {
    if (analyzerInterval) {
        clearInterval(analyzerInterval);
        analyzerInterval = null;
    }
    
    if (frequencyCanvas.value) {
        const ctx = frequencyCanvas.value.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, frequencyCanvas.value.width, frequencyCanvas.value.height);
        }
    }
    
    // Clear audio data
    dataArray = null;
};

function startFrequencyVisualization(ctx) {
    console.log("Starting frequency visualization with interval");

    if (analyzerInterval) {
        clearInterval(analyzerInterval);
    }
    
    const updateFrequencyVisualization = async () => {
        // Check if we should be visualizing
        if (!store.isPlaying || !uiStore.showFrequencyVisualizer) {
            console.log("Stopping frequency analysis - isPlaying:", store.isPlaying, "showFrequencyVisualizer:", uiStore.showFrequencyVisualizer);
            clearInterval(analyzerInterval);
            analyzerInterval = null;
            return;
        }
        
        // Get frequency data from audio store
        const data = await store.getFrequencyData();
        
        if (data) {
            // Clear the canvas
            ctx.clearRect(0, 0, props.width, props.height);
            // Calculate bar width based on number of frequency bins
            const barWidth = (props.width / data.length) * 2.5;
            let barHeight;
            let x = 0;
            // Use the reactive number color
            ctx.fillStyle = numberColor.value;
            // Draw bars for each frequency
            for (let i = 0; i < data.length; i++) {
                barHeight = (data[i] / 255) * props.height;
                ctx.fillRect(x, props.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }
    };
    
    // Set interval for continuous updates
    analyzerInterval = setInterval(updateFrequencyVisualization, 100);
    
    // Immediate update without waiting for interval
    updateFrequencyVisualization();
}

onMounted(() => {
    console.log("Frequency visualizer mounted with dimensions:", props.width, "x", props.height);
    
    const freqCtx = frequencyCanvas.value.getContext('2d');
    freqCtx.imageSmoothingEnabled = false;
    
    // Optional: set a listener for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateColors);
    
    // Setup memory cleanup listeners
    // window.addEventListener('memory-cleanup-requested', handleMemoryCleanup);
    // window.addEventListener('aggressive-cleanup', handleMemoryCleanup);
    
    // Initialize audio context and analyzer for frequency visualization
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512; // Must be a power of 2
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    } catch (e) {
        console.error("Error initializing audio analyzer:", e);
    }
    
    // Watch for play/pause changes
    watch(
        () => store.isPlaying,
        (isPlaying) => {
            console.log("isPlaying changed in frequency visualizer:", isPlaying);
            
            if (isPlaying) {
                if (uiStore.showFrequencyVisualizer) {
                    startFrequencyVisualization(freqCtx);
                }
            } else {
                if (analyzerInterval) {
                    clearInterval(analyzerInterval);
                    analyzerInterval = null;
                }
            }
        }
    );
    
    // Watch for frequency visualizer visibility changes
    watch(
        () => uiStore.showFrequencyVisualizer,
        (showFrequencyVisualizer) => {
            console.log("showFrequencyVisualizer changed:", showFrequencyVisualizer);
            if (showFrequencyVisualizer && store.isPlaying) {
                // If visualizer is shown and audio is playing, start analysis
                startFrequencyVisualization(freqCtx);
            } else if (!showFrequencyVisualizer && analyzerInterval) {
                // If visualizer is hidden, stop the analysis
                clearInterval(analyzerInterval);
                analyzerInterval = null;
            }
        },
        { immediate: true } // Evaluar inmediatamente al montar el componente
    );
    
    // Watch for visualizer type changes directly
    watch(
        () => uiStore.visualizerType,
        (type) => {
            console.log("Visualizer type changed to:", type);
            if (type === 'frequency' && store.isPlaying) {
                startFrequencyVisualization(freqCtx);
            } else if (type !== 'frequency' && analyzerInterval) {
                clearInterval(analyzerInterval);
                analyzerInterval = null;
            }
        }
    );
});

onUnmounted(() => {
    if (analyzerInterval) {
        clearInterval(analyzerInterval);
        analyzerInterval = null;
    }
    
    // Remove memory cleanup listeners
    window.removeEventListener('memory-cleanup-requested', handleMemoryCleanup);
    window.removeEventListener('aggressive-cleanup', handleMemoryCleanup);
});
</script>

<style scoped>
canvas {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    image-rendering: -moz-crisp-edges;
}
</style>
