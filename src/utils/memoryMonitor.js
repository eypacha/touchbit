/**
 * Memory Monitor Utility
 * Tracks memory usage and detects potential memory leaks
 * Stores data in localStorage for persistent debugging
 */

export class MemoryMonitor {
  constructor() {
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.memoryLogs = [];
    this.maxLogs = 200; // Mantener solo los últimos 200 registros
    this.thresholds = {
      warning: 50 * 1024 * 1024, // 50MB
      critical: 100 * 1024 * 1024, // 100MB
      crash: 150 * 1024 * 1024  // 150MB
    };
    this.callbacks = {
      onWarning: null,
      onCritical: null,
      onCrash: null
    };
    
    // Cargar logs previos
    this.loadPreviousLogs();
    
    // Detectar crash anterior
    this.checkForPreviousCrash();
  }

  /**
   * Inicia el monitoreo de memoria
   */
  startMonitoring(interval = 5000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.log('MEMORY_MONITOR', 'Memory monitoring started');
    
    this.monitorInterval = setInterval(() => {
      this.checkMemory();
    }, interval);
    
    // También monitorear en eventos críticos
    this.setupEventListeners();
  }

  /**
   * Detiene el monitoreo
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.log('MEMORY_MONITOR', 'Memory monitoring stopped');
  }

  /**
   * Verifica el uso actual de memoria
   */
  checkMemory() {
    if (!performance.memory) {
      console.warn('Performance.memory API not available');
      return null;
    }

    const memInfo = {
      timestamp: Date.now(),
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
    };

    // Registrar información
    this.addMemoryLog(memInfo);

    // Verificar thresholds
    this.checkThresholds(memInfo);

    return memInfo;
  }

  /**
   * Añade un log de memoria
   */
  addMemoryLog(memInfo) {
    this.memoryLogs.push(memInfo);
    
    // Mantener solo los últimos logs
    if (this.memoryLogs.length > this.maxLogs) {
      this.memoryLogs = this.memoryLogs.slice(-this.maxLogs);
    }
    
    // Guardar en localStorage
    this.saveLogs();
  }

  /**
   * Verifica si se han superado los thresholds de memoria
   */
  checkThresholds(memInfo) {
    const used = memInfo.used;
    
    if (used > this.thresholds.crash && this.callbacks.onCrash) {
      this.log('MEMORY_CRITICAL', `CRASH THRESHOLD EXCEEDED: ${this.formatBytes(used)}`);
      this.callbacks.onCrash(memInfo);
    } else if (used > this.thresholds.critical && this.callbacks.onCritical) {
      this.log('MEMORY_WARNING', `CRITICAL THRESHOLD EXCEEDED: ${this.formatBytes(used)}`);
      this.callbacks.onCritical(memInfo);
    } else if (used > this.thresholds.warning && this.callbacks.onWarning) {
      this.log('MEMORY_INFO', `WARNING THRESHOLD EXCEEDED: ${this.formatBytes(used)}`);
      this.callbacks.onWarning(memInfo);
    }
  }

  /**
   * Configura listeners para eventos críticos
   */
  setupEventListeners() {
    // Escuchar errores no capturados
    window.addEventListener('error', (event) => {
      this.log('ERROR', `Uncaught error: ${event.message} at ${event.filename}:${event.lineno}`);
      this.checkMemory();
    });

    // Escuchar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.log('ERROR', `Unhandled promise rejection: ${event.reason}`);
      this.checkMemory();
    });

    // Escuchar cuando la página se va a cerrar
    window.addEventListener('beforeunload', () => {
      this.log('LIFECYCLE', 'Page is about to unload');
      this.markCleanExit();
    });

    // Escuchar cambios de visibilidad
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.log('LIFECYCLE', 'Page became hidden');
      } else {
        this.log('LIFECYCLE', 'Page became visible');
      }
      this.checkMemory();
    });
  }

  /**
   * Establece callbacks para diferentes niveles de memoria
   */
  setCallbacks({ onWarning, onCritical, onCrash }) {
    this.callbacks = { onWarning, onCritical, onCrash };
  }

  /**
   * Registra un evento en el log
   */
  log(type, message) {
    const logEntry = {
      timestamp: Date.now(),
      type,
      message,
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      } : null
    };

    // Guardar en array de logs generales
    const logs = this.getGeneralLogs();
    logs.push(logEntry);
    
    // Mantener solo los últimos 100 logs generales
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('touchbit-debug-logs', JSON.stringify(logs));
    
    // También loggear en consola
    console.log(`[${type}] ${message}`, logEntry.memory);
  }

  /**
   * Obtiene logs generales
   */
  getGeneralLogs() {
    try {
      return JSON.parse(localStorage.getItem('touchbit-debug-logs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Guarda logs de memoria en localStorage
   */
  saveLogs() {
    try {
      localStorage.setItem('touchbit-memory-logs', JSON.stringify(this.memoryLogs));
    } catch (error) {
      console.warn('Failed to save memory logs:', error);
    }
  }

  /**
   * Carga logs previos de localStorage
   */
  loadPreviousLogs() {
    try {
      const saved = localStorage.getItem('touchbit-memory-logs');
      if (saved) {
        this.memoryLogs = JSON.parse(saved);
        console.log(`Loaded ${this.memoryLogs.length} previous memory logs`);
      }
    } catch (error) {
      console.warn('Failed to load previous memory logs:', error);
      this.memoryLogs = [];
    }
  }

  /**
   * Verifica si hubo un crash en la sesión anterior
   */
  checkForPreviousCrash() {
    const cleanExit = localStorage.getItem('touchbit-clean-exit');
    
    if (cleanExit === null || cleanExit === 'false') {
      console.warn('⚠️ POTENTIAL CRASH DETECTED - Previous session did not exit cleanly');
      this.log('CRASH_DETECTION', 'Previous session may have crashed');
      
      // Analizar logs de memoria anteriores
      this.analyzePreviousCrash();
    }
    
    // Marcar que esta sesión acaba de empezar
    localStorage.setItem('touchbit-clean-exit', 'false');
  }

  /**
   * Analiza logs de una posible crash anterior
   */
  analyzePreviousCrash() {
    if (this.memoryLogs.length === 0) return;
    
    const lastLogs = this.memoryLogs.slice(-10); // Últimos 10 logs
    const memoryTrend = this.calculateMemoryTrend(lastLogs);
    
    if (memoryTrend > 0) {
      console.warn('📈 Memory was increasing before crash:', this.formatBytes(memoryTrend), 'per check');
    }
    
    const maxMemory = Math.max(...lastLogs.map(log => log.used));
    console.log('💾 Peak memory usage before crash:', this.formatBytes(maxMemory));
  }

  /**
   * Calcula la tendencia de memoria
   */
  calculateMemoryTrend(logs) {
    if (logs.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < logs.length; i++) {
      changes.push(logs[i].used - logs[i-1].used);
    }
    
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  /**
   * Marca una salida limpia de la aplicación
   */
  markCleanExit() {
    localStorage.setItem('touchbit-clean-exit', 'true');
  }

  /**
   * Obtiene estadísticas de memoria
   */
  getStats() {
    if (this.memoryLogs.length === 0) return null;
    
    const usedMemory = this.memoryLogs.map(log => log.used);
    const min = Math.min(...usedMemory);
    const max = Math.max(...usedMemory);
    const avg = usedMemory.reduce((sum, val) => sum + val, 0) / usedMemory.length;
    
    return {
      min: this.formatBytes(min),
      max: this.formatBytes(max),
      avg: this.formatBytes(avg),
      current: performance.memory ? this.formatBytes(performance.memory.usedJSHeapSize) : 'N/A',
      trend: this.calculateMemoryTrend(this.memoryLogs.slice(-10))
    };
  }

  /**
   * Formatea bytes a formato legible
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Fuerza una recolección de basura (solo para debugging)
   */
  forceGC() {
    if (window.gc) {
      window.gc();
      this.log('GC', 'Forced garbage collection');
      setTimeout(() => this.checkMemory(), 100);
    } else {
      console.warn('Garbage collection not available. Run Chrome with --js-flags="--expose-gc"');
    }
  }

  /**
   * Exporta todos los logs para análisis
   */
  exportLogs() {
    return {
      memoryLogs: this.memoryLogs,
      generalLogs: this.getGeneralLogs(),
      stats: this.getStats(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Limpia todos los logs
   */
  clearLogs() {
    this.memoryLogs = [];
    localStorage.removeItem('touchbit-memory-logs');
    localStorage.removeItem('touchbit-debug-logs');
    this.log('MEMORY_MONITOR', 'All logs cleared');
  }
}

// Exportar una instancia singleton
export const memoryMonitor = new MemoryMonitor();
