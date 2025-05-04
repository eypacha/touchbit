<template>
    <canvas ref="canvas" class="absolute top-0 left-0 w-full h-full pointer-events-none" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/main';

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

onUnmounted(() => {
    if (visualizationInterval) {
        clearInterval(visualizationInterval);
    }
});

onMounted(() => {
    console.log("Canvas mounted with dimensions:", props.width, "x", props.height);
    const ctx = canvas.value.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
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
            

            ctx.lineWidth = 1;
            ctx.strokeStyle = 'yellow';
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
    box-shadow: black 0px 2px 8px inset;
    background-color: rgba(0, 0, 0, 0.1);
}
</style>
