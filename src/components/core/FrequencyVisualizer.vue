<template>
<canvas ref="canvas" class="absolute top-0 left-0 w-full h-[calc(100dvh-400px)] opacity-50 pointer-events-none" :width="width" :height="height"></canvas>
</template>
<script setup>

import {
ref, onMounted, watch, onUnmounted }
from 'vue';

import {
useMainStore }
from '@/stores/mainStore';

import {
useUIStore }
from '@/stores/uiStore';

import {
useThemeColor }
from '@/composables/useThemeColor';

const props = defineProps({
width: {
type: Number,
default: 300
}
,

height: {
type: Number,
default: 256
}
}
);
const store = useMainStore();
const uiStore = useUIStore();
const canvas = ref(null);
let analyzerInterval = null;
let audioContext = null;
let analyser = null;
let dataArray = null;
// Use the theme color composable

const {
numberColor, updateColors }
= useThemeColor();

onUnmounted(() => {
if (analyzerInterval) {
clearInterval(analyzerInterval);
analyzerInterval = null;
}
}
);

onMounted(() => {
console.log("Frequency Visualizer mounted with dimensions:", props.width, "x", props.height);
const ctx = canvas.value.getContext('2d');
ctx.imageSmoothingEnabled = false;
// Optional: set a listener for theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateColors);

// Don't create separate audio context - use the main audio engine instead
// Remove duplicate audio context initialization that causes memory leaks

// Watch for play/pause changes
watch(
() => store.isPlaying,

(isPlaying) => {
console.log("isPlaying changed in frequency visualizer:", isPlaying);

if (isPlaying) {
startFrequencyAnalysis(ctx);
}

else if (analyzerInterval) {
clearInterval(analyzerInterval);
analyzerInterval = null;
}
}
);
// Watch for visualizer visibility changes
watch(
() => uiStore.showFrequencyVisualizer,

(showFrequencyVisualizer) => {
console.log("showFrequencyVisualizer changed:", showFrequencyVisualizer);

if (showFrequencyVisualizer && store.isPlaying) {
// If visualizer is shown and audio is playing, start analysis
startFrequencyAnalysis(ctx);
}

else if (!showFrequencyVisualizer && analyzerInterval) {
// If visualizer is hidden, stop the analysis
clearInterval(analyzerInterval);
analyzerInterval = null;
}
}
);
}
);

function startFrequencyAnalysis(ctx) {
console.log("Starting frequency analysis with interval");

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
// Get frequency data from audio store (this uses the main audio engine)
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
for (let i = 0;
i < data.length;

i++) {
barHeight = (data[i] / 255) * props.height;
ctx.fillRect(x, props.height - barHeight, barWidth, barHeight);
x += barWidth + 1;
}
}
}
;
// Increase interval to reduce CPU usage (from 100ms to 150ms)
analyzerInterval = setInterval(updateFrequencyVisualization, 150);
// Immediate update without waiting for interval
updateFrequencyVisualization();
}
</script>
<style scoped>

canvas {
image-rendering: pixelated;
image-rendering: crisp-edges;
image-rendering: -moz-crisp-edges;
}
</style>
