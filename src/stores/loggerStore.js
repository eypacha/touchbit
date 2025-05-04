import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLoggerStore = defineStore('logger', () => {
  const logs = ref([]);
  const maxLogs = ref(100); // Limit number of logs to prevent memory issues

  // Emoji mapping for different log types
  const logEmojis = {
    COMPILE: "🚀",
    RESET: "🔄",
    INFO: "💡",
    ERROR: "❌",
    EDIT: "✏️",
    THEME: "🎨",
    HISTORY: "⏰",
    MATH: "🧮",
    AUDIO: "🔊",
    SETTINGS: "⚙️",
    HISTORY: "📜",
  };

  function log(type, message) {
    // Create log entry with timestamp
    const logEntry = {
      id: Date.now(),
      type,
      message,
      emoji: logEmojis[type] || '📌',
      timestamp: new Date().toISOString()
    };

    // Add to logs array
    logs.value.unshift(logEntry);
    
    // Keep logs within limit
    if (logs.value.length > maxLogs.value) {
      logs.value = logs.value.slice(0, maxLogs.value);
    }

    // Also log to console
    console.log(`${logEntry.emoji} [${type.toUpperCase()}]`, message);

    return logEntry;
  }

  function clearLogs() {
    logs.value = [];
  }

  function setMaxLogs(max) {
    maxLogs.value = max;
  }

  return {
    logs,
    maxLogs,
    log,
    clearLogs,
    setMaxLogs
  };
});