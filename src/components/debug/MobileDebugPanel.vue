/**
 * Mobile Debug Panel
 * A floating debug panel for mobile devices to monitor memory and logs
 */

<template>
  <!-- Only render if debug system is enabled -->
  <div v-if="isDebugSystemEnabled">
    <div v-if="isVisible" class="debug-panel" :class="{ 'debug-panel--minimized': isMinimized }">
    <!-- Header -->
    <div class="debug-panel__header" @touchstart="startDrag" @mousedown="startDrag">
      <div class="debug-panel__title">
        🐛 Debug Panel
        <span class="debug-panel__memory" v-if="currentMemory">
          {{ formatBytes(currentMemory.used) }}
        </span>
      </div>
      <div class="debug-panel__controls">
        <button @click="toggleMinimize" class="debug-panel__btn">
          {{ isMinimized ? '🔼' : '🔽' }}
        </button>
        <button @click="close" class="debug-panel__btn">❌</button>
      </div>
    </div>

    <!-- Content (only visible when not minimized) -->
    <div v-if="!isMinimized" class="debug-panel__content">
      <!-- Memory Info -->
      <div class="debug-section">
        <div v-if="currentMemory" class="memory-info">
          <div class="memory-bar">
            <div 
              class="memory-bar__fill" 
              :style="{ width: currentMemory.percentage + '%' }"
              :class="getMemoryClass(currentMemory.used)"
            ></div>
          </div>
          <div class="memory-stats">
            <div>Used: {{ formatBytes(currentMemory.used) }}</div>
            <div>Total: {{ formatBytes(currentMemory.total) }}</div>
            <div>Limit: {{ formatBytes(currentMemory.limit) }}</div>
            <div>Percentage: {{ currentMemory.percentage.toFixed(1) }}%</div>
          </div>
          <div v-if="memoryStats" class="memory-trends">
            <div>Min: {{ memoryStats.min }}</div>
            <div>Max: {{ memoryStats.max }}</div>
            <div>Avg: {{ memoryStats.avg }}</div>
          </div>
        </div>
        <div v-else class="memory-unavailable">
          Memory API not available
        </div>
      </div>

      <!-- Controls -->
      <div class="debug-section">
        <div class="debug-controls">
          <button @click="forceGC" class="debug-btn">🗑️ Force GC</button>
          <button @click="exportLogs" class="debug-btn">📤 Export Logs</button>
          <button @click="exportCrashData" class="debug-btn">💥 Crash Data</button>
          <button @click="clearLogs" class="debug-btn">🧹 Clear Logs</button>
          <button @click="triggerCrashTest" class="debug-btn debug-btn--danger">💥 Crash Test</button>
          <button @click="testCleanup" class="debug-btn">🔧 Test Cleanup</button>
        </div>
      </div>

      <!-- Scale Controls -->
      <div class="debug-section">
        <div class="scale-controls">
          <button @click="decreaseScale" class="debug-btn scale-btn">🔍➖</button>
          <div class="scale-indicator">{{ Math.round(debugScale * 100) }}%</div>
          <button @click="increaseScale" class="debug-btn scale-btn">🔍➕</button>
          <button @click="resetScale" class="debug-btn scale-btn">↩️</button>
        </div>
      </div>

      <!-- Recent Logs -->
      <div class="debug-section">
        <div class="logs-container">
          <div 
            v-for="log in recentLogs.slice(-10)" 
            :key="log.timestamp" 
            class="log-entry"
            :class="'log-entry--' + log.type.toLowerCase()"
          >
            <div class="log-time">{{ formatTime(log.timestamp) }}</div>
            <div class="log-type">{{ log.type }}</div>
            <div class="log-message">{{ log.message }}</div>
          </div>
        </div>
      </div>

      <!-- Memory Chart (simple text-based) -->
      <div class="debug-section">
        <div class="memory-chart">
          <div 
            v-for="(log, index) in memoryHistory.slice(-20)" 
            :key="log.timestamp"
            class="memory-chart__bar"
            :style="{ height: (log.percentage * 2) + 'px' }"
            :class="getMemoryClass(log.used)"
            :title="`${formatTime(log.timestamp)}: ${formatBytes(log.used)}`"
          ></div>
        </div>
      </div>
    </div>
    </div>

    <!-- Debug Toggle Button (when panel is hidden) -->
    <button 
      v-if="!isVisible" 
      @click="show" 
      class="debug-toggle"
      :class="getToggleClasses()"
    >
      {{ memoryStatus.icon }}
      <span v-if="currentMemory" class="debug-toggle__memory">
        {{ formatBytes(currentMemory.used, true) }}
      </span>
      <span v-if="currentMemory" class="debug-toggle__percentage">
        {{ currentMemory.percentage.toFixed(0) }}%
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { memoryMonitor } from '@/utils/memoryMonitor';
import { crashDetector } from '@/utils/crashDetector';

// State
const isVisible = ref(false);
const isMinimized = ref(false);
const currentMemory = ref(null);
const memoryHistory = ref([]);
const recentLogs = ref([]);
const memoryStats = ref(null);
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const position = ref({ x: 20, y: 20 });
const debugScale = ref(1); // Scale factor for the debug panel (0.8 to 1.5)

// Debug system state - self-contained
const isDebugSystemEnabled = ref(false);

// Computed
const hasWarnings = computed(() => {
  return recentLogs.value.some(log => 
    log.type.includes('ERROR') || 
    log.type.includes('MEMORY_WARNING') || 
    log.type.includes('MEMORY_CRITICAL')
  );
});

// Computed for memory status based on percentage
const memoryStatus = computed(() => {
  if (!currentMemory.value) return { level: 'normal', icon: '🐛', color: 'green' };
  
  const percentage = currentMemory.value.percentage;
  
  if (percentage >= 75) {
    return { 
      level: 'critical', 
      icon: '🚨', // Red siren
      color: 'red' 
    };
  } else if (percentage >= 50) {
    return { 
      level: 'warning', 
      icon: '⚠️', // Yellow triangle warning
      color: 'yellow' 
    };
  } else {
    return { 
      level: 'normal', 
      icon: '🐛', // Green worm
      color: 'green' 
    };
  }
});

// Method to get toggle button classes with proper priority
const getToggleClasses = () => {
  const classes = {};
  
  // Memory status takes priority over general warnings
  if (currentMemory.value) {
    const level = memoryStatus.value.level;
    if (level === 'critical') {
      classes['debug-toggle--memory-critical'] = true;
    } else if (level === 'warning') {
      classes['debug-toggle--memory-warning'] = true;
    } else {
      classes['debug-toggle--normal'] = true;
    }
  } else {
    // If no memory data, check for general warnings
    if (hasWarnings.value) {
      classes['debug-toggle--warning'] = true;
    } else {
      classes['debug-toggle--normal'] = true;
    }
  }
  
  return classes;
};

// Methods
function show() {
  isVisible.value = true;
  updateData();
}

function close() {
  isVisible.value = false;
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

function updateData() {
  // Update memory info
  currentMemory.value = memoryMonitor.checkMemory();
  
  // Update memory history
  if (currentMemory.value) {
    memoryHistory.value.push(currentMemory.value);
    if (memoryHistory.value.length > 50) {
      memoryHistory.value = memoryHistory.value.slice(-50);
    }
  }
  
  // Update logs
  recentLogs.value = memoryMonitor.getGeneralLogs();
  
  // Update stats
  memoryStats.value = memoryMonitor.getStats();
}

function formatBytes(bytes, short = false) {
  if (!bytes) return '0 B';
  
  const k = 1024;
  const sizes = short ? ['B', 'K', 'M', 'G'] : ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(short ? 0 : 2));
  return value + (short ? '' : ' ') + sizes[i];
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toTimeString().split(' ')[0].substring(0, 8);
}

function getMemoryClass(used) {
  const monitor = memoryMonitor;
  if (used > monitor.thresholds.critical) return 'memory--critical';
  if (used > monitor.thresholds.warning) return 'memory--warning';
  return 'memory--normal';
}

function forceGC() {
  memoryMonitor.forceGC();
  setTimeout(updateData, 200);
}

function exportLogs() {
  const logs = memoryMonitor.exportLogs();
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create download link
  const a = document.createElement('a');
  a.href = url;
  a.download = `touchbit-debug-${new Date().toISOString().slice(0, 19)}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  
  // Also copy to clipboard if available
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
    console.log('Debug logs copied to clipboard');
  }
}

function exportCrashData() {
  const allData = crashDetector.exportAllDebugData();
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `touchbit-crash-analysis-${new Date().toISOString().slice(0, 19)}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(allData, null, 2));
    console.log('Complete crash data copied to clipboard');
  }
}

function clearLogs() {
  memoryMonitor.clearLogs();
  updateData();
}

function triggerCrashTest() {
  if (confirm('This will intentionally consume memory to test crash detection. Continue?')) {
    // Consume memory gradually
    const arrays = [];
    const interval = setInterval(() => {
      // Create large arrays
      arrays.push(new Array(1000000).fill('x'.repeat(100)));
      
      if (arrays.length > 50) {
        clearInterval(interval);
      }
    }, 100);
  }
}

function testCleanup() {
  // Trigger cleanup event
  window.dispatchEvent(new CustomEvent('memory-cleanup-requested'));
  memoryMonitor.log('TEST', 'Manual cleanup test triggered');
  setTimeout(updateData, 200);
}

// Dragging functionality
function startDrag(e) {
  isDragging.value = true;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  };
  
  // Add event listeners with passive: false for touch events to allow preventDefault
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchmove', handleDrag, { passive: false });
  document.addEventListener('touchend', stopDrag);
}

function handleDrag(e) {
  if (!isDragging.value) return;
  
  // Only call preventDefault if it's allowed
  if (e.cancelable) {
    e.preventDefault();
  }
  
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  position.value = {
    x: clientX - dragOffset.value.x,
    y: clientY - dragOffset.value.y
  };
}

function stopDrag() {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', handleDrag, { passive: false });
  document.removeEventListener('touchend', stopDrag);
}

// Scale controls
function increaseScale() {
  if (debugScale.value < 1.5) {
    debugScale.value = Math.min(1.5, debugScale.value + 0.1);
  }
}

function decreaseScale() {
  if (debugScale.value > 0.8) {
    debugScale.value = Math.max(0.8, debugScale.value - 0.1);
  }
}

function resetScale() {
  debugScale.value = 1;
}

// Lifecycle
onMounted(() => {
  // Initialize debug system state from localStorage
  const savedDebugState = localStorage.getItem('touchbit-debug-enabled');
  if (savedDebugState !== null) {
    isDebugSystemEnabled.value = savedDebugState === 'true';
  }
  
  // Listen for debug system toggle events
  window.addEventListener('debug-system-toggle', (event) => {
    isDebugSystemEnabled.value = event.detail.enabled;
    
    // If disabling debug system, hide panel
    if (!isDebugSystemEnabled.value) {
      isVisible.value = false;
    }
  });
  
  // Only initialize monitoring if debug system is enabled
  if (!isDebugSystemEnabled.value) {
    return;
  }
  
  // Setup memory monitor callbacks
  memoryMonitor.setCallbacks({
    onWarning: (memInfo) => {
      console.warn('Memory warning:', memInfo);
      updateData();
    },
    onCritical: (memInfo) => {
      console.error('Memory critical:', memInfo);
      updateData();
      if (!isVisible.value) {
        show(); // Auto-show panel on critical memory
      }
    },
    onCrash: (memInfo) => {
      console.error('Memory crash threshold:', memInfo);
      updateData();
    }
  });
  
  // Listen for debug activation via secret gestures
  window.addEventListener('activate-debug-panel', () => {
    if (isDebugSystemEnabled.value) {
      show();
    }
  });
  
  // Start monitoring
  memoryMonitor.startMonitoring(2000); // Check every 2 seconds
  
  // Listen for debug activation via secret gestures
  window.addEventListener('show-debug-panel', show);
  window.addEventListener('activate-debug-panel', show);
  
  // Update data immediately and then periodically
  updateData();
  const updateInterval = setInterval(updateData, 3000);
  
  // Cleanup
  onUnmounted(() => {
    clearInterval(updateInterval);
    memoryMonitor.stopMonitoring();
    window.removeEventListener('debug-system-toggle', () => {});
  });
});
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: v-bind('position.y + "px"');
  left: v-bind('position.x + "px"');
  width: 240px;
  max-height: 50vh;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border: 1px solid #333;
  border-radius: 6px;
  font-family: monospace;
  font-size: 10px;
  z-index: 10000;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  transform: scale(v-bind('debugScale'));
  transform-origin: top left;
}

.debug-panel--minimized {
  height: auto;
}

.debug-panel__header {
  background: #222;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  user-select: none;
  border-bottom: 1px solid #333;
}

.debug-panel__title {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
}

.debug-panel__memory {
  background: #333;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 8px;
}

.debug-panel__controls {
  display: flex;
  gap: 4px;
}

.debug-panel__btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  font-size: 10px;
}

.debug-panel__btn:hover {
  background: #444;
}

.debug-panel__content {
  max-height: calc(50vh - 30px);
  overflow-y: auto;
  padding: 6px;
}

.debug-section {
  margin-bottom: 8px;
}

.debug-section h4 {
  margin: 0 0 4px 0;
  color: #ccc;
  font-size: 9px;
  text-transform: uppercase;
}

.memory-info {
  background: #111;
  padding: 4px;
  border-radius: 3px;
}

.memory-bar {
  width: 100%;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.memory-bar__fill {
  height: 100%;
  transition: width 0.3s ease;
}

.memory--normal { background: #4ade80; }
.memory--warning { background: #f59e0b; }
.memory--critical { background: #ef4444; }

.memory-stats, .memory-trends {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  font-size: 8px;
  color: #ccc;
}

.memory-unavailable {
  color: #666;
  font-style: italic;
  font-size: 8px;
}

.debug-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2px;
}

.debug-btn {
  background: #333;
  border: none;
  color: white;
  padding: 3px 4px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 8px;
}

.debug-btn:hover {
  background: #444;
}

.debug-btn--danger {
  background: #dc2626;
}

.debug-btn--danger:hover {
  background: #b91c1c;
}

.scale-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #111;
  padding: 4px;
  border-radius: 3px;
}

.scale-btn {
  flex: none;
  min-width: 24px;
  padding: 2px 4px;
  font-size: 10px;
}

.scale-indicator {
  flex: 1;
  text-align: center;
  font-size: 8px;
  color: #ccc;
  background: #222;
  padding: 2px 4px;
  border-radius: 2px;
}

.logs-container {
  background: #111;
  border-radius: 3px;
  max-height: 80px;
  overflow-y: auto;
}

.log-entry {
  padding: 2px 4px;
  border-bottom: 1px solid #222;
  font-size: 8px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry--error, .log-entry--memory_critical {
  background: #4c1d1d;
  color: #fca5a5;
}

.log-entry--memory_warning {
  background: #451a03;
  color: #fbbf24;
}

.log-entry--memory_info {
  background: #1e3a8a;
  color: #93c5fd;
}

.log-time {
  color: #666;
}

.log-type {
  color: #888;
  font-weight: bold;
}

.log-message {
  color: #ccc;
  word-break: break-word;
}

.memory-chart {
  display: flex;
  align-items: end;
  height: 50px;
  gap: 1px;
  background: #111;
  padding: 4px;
  border-radius: 4px;
}

.memory-chart__bar {
  flex: 1;
  min-height: 2px;
  border-radius: 1px;
  transition: height 0.3s ease;
}

.debug-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: 2px solid #333;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  transform: scale(v-bind('debugScale'));
  transform-origin: center;
}

.debug-toggle--normal {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.2);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
}

.debug-toggle--memory-warning {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
  animation: pulse 2s infinite;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
}

.debug-toggle--memory-critical {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
  animation: criticalPulse 1s infinite;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5);
}

.debug-toggle--warning {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
  animation: pulse 2s infinite;
}

.debug-toggle:hover {
  transform: scale(1.05);
}

.debug-toggle--normal:hover {
  border-color: #16a34a;
  background: rgba(34, 197, 94, 0.3);
}

.debug-toggle--memory-warning:hover {
  border-color: #d97706;
  background: rgba(245, 158, 11, 0.3);
}

.debug-toggle--memory-critical:hover {
  border-color: #dc2626;
  background: rgba(239, 68, 68, 0.3);
}

.debug-toggle__memory {
  font-size: 8px;
  margin-top: 2px;
}

.debug-toggle__percentage {
  font-size: 7px;
  margin-top: 1px;
  font-weight: bold;
  opacity: 0.9;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes criticalPulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5);
  }
  50% { 
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.8);
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .debug-panel {
    width: 280px;
    font-size: 11px;
  }
  
  .debug-toggle {
    width: 50px;
    height: 50px;
    font-size: 14px;
  }
}
</style>
