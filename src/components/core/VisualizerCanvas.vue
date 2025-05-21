<template>
    <canvas ref="canvas" class="absolute top-0 left-0 w-full h-[calc(100dvh-393px)] opacity-50 pointer-events-none" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/mainStore';

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
const canvas = ref(null);
let visualizationInterval = null;

// Function to get the CSS number color
const getNumberColor = () => {
    const numberHsl = getComputedStyle(document.documentElement).getPropertyValue('--number').trim();
    return `hsl(${numberHsl})`;
};

// Reactive color that updates when the theme changes
const numberColor = ref(getNumberColor());

// Update the color when the theme changes
const updateColor = () => {
    numberColor.value = getNumberColor();
};

onUnmounted(() => {
    if (visualizationInterval) {
        clearInterval(visualizationInterval);
    }
});

onMounted(() => {
    console.log("Canvas mounted with dimensions:", props.width, "x", props.height);
    const ctx = canvas.value.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Initialize the color on mount
    numberColor.value = getNumberColor();
    
    // Optional: set a listener for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateColor);
    
    watch(
        () => store.isPlaying,
        (isPlaying) => {
            console.log("isPlaying changed:", isPlaying);
            if (isPlaying) {
                startVisualization(ctx);
            } else if (visualizationInterval) {
                clearInterval(visualizationInterval);
                visualizationInterval = null;
            }
        }
    );
});

function startVisualization(ctx) {
    console.log("Starting visualization with interval");
    
    if (visualizationInterval) {
        clearInterval(visualizationInterval);
    }
    
    const updateVisualization = async () => {
        if (!store.isPlaying) {
            console.log("Stopping visualization interval");
            clearInterval(visualizationInterval);
            visualizationInterval = null;
            return;
        }
        
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
    
    visualizationInterval = setInterval(updateVisualization, 100);
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
