/**
 * Crash Detection & Remote Logging System
 * Detects memory leaks and crashes, enviando logs a un servicio remoto si es posible
 */

import { memoryMonitor } from './memoryMonitor';

export class CrashDetector {
  constructor() {
    this.crashThreshold = 150 * 1024 * 1024; // 150MB
    this.warningThreshold = 100 * 1024 * 1024; // 100MB
    this.isMonitoring = false;
    this.lastWarningTime = 0;
    this.consecutiveWarnings = 0;
    this.remoteLogEndpoint = null; // Puedes configurar tu endpoint aquí
    
    this.setupCrashDetection();
  }

  setupCrashDetection() {
    // Marcar que la app está ejecutándose
    this.markAppRunning();
    
    // Configurar callbacks del memory monitor
    memoryMonitor.setCallbacks({
      onWarning: (memInfo) => this.handleMemoryWarning(memInfo),
      onCritical: (memInfo) => this.handleMemoryCritical(memInfo),
      onCrash: (memInfo) => this.handleMemoryCrash(memInfo)
    });

    // Escuchar errores no capturados
    window.addEventListener('error', (event) => {
      this.logCrashEvent('UNCAUGHT_ERROR', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Escuchar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logCrashEvent('UNHANDLED_REJECTION', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Escuchar cuando la página se va a cerrar
    window.addEventListener('beforeunload', () => {
      this.markCleanExit();
    });

    // Detectar cuando la página se vuelve visible (para detectar crashes)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForCrashRecovery();
      }
    });

    // Monitoreo periódico agresivo
    this.startAgressiveMonitoring();
  }

  markAppRunning() {
    const runningState = {
      timestamp: Date.now(),
      sessionId: this.generateSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    };

    localStorage.setItem('touchbit-app-running', JSON.stringify(runningState));
    localStorage.setItem('touchbit-clean-exit', 'false');
  }

  markCleanExit() {
    localStorage.setItem('touchbit-clean-exit', 'true');
    localStorage.removeItem('touchbit-app-running');
    this.logCrashEvent('CLEAN_EXIT', { timestamp: Date.now() });
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  checkForCrashRecovery() {
    const runningState = localStorage.getItem('touchbit-app-running');
    const cleanExit = localStorage.getItem('touchbit-clean-exit');

    if (runningState && cleanExit !== 'true') {
      const state = JSON.parse(runningState);
      const crashDuration = Date.now() - state.timestamp;
      
      if (crashDuration > 5000) { // Si pasaron más de 5 segundos
        this.logCrashEvent('CRASH_RECOVERY', {
          previousSession: state,
          crashDuration,
          recoveryTimestamp: Date.now()
        });

        // Enviar logs de crash al servidor si es posible
        this.sendCrashReport();
        
        // Mostrar notificación al usuario
        this.showCrashRecoveryMessage();
      }
    }

    this.markAppRunning();
  }

  handleMemoryWarning(memInfo) {
    const now = Date.now();
    if (now - this.lastWarningTime < 10000) { // Menos de 10 segundos desde la última warning
      this.consecutiveWarnings++;
    } else {
      this.consecutiveWarnings = 1;
    }
    
    this.lastWarningTime = now;

    if (this.consecutiveWarnings >= 3) {
      this.logCrashEvent('MEMORY_LEAK_DETECTED', {
        memInfo,
        consecutiveWarnings: this.consecutiveWarnings,
        trend: this.calculateMemoryTrend()
      });
      
      // Intentar liberación de memoria
      this.attemptMemoryCleanup();
    }
  }

  handleMemoryCritical(memInfo) {
    this.logCrashEvent('MEMORY_CRITICAL', {
      memInfo,
      stack: new Error().stack,
      timestamp: Date.now()
    });

    // Crear backup de datos importantes antes del posible crash
    this.createEmergencyBackup();
    
    // Intentar liberación agresiva de memoria
    this.attemptAgressiveCleanup();
  }

  handleMemoryCrash(memInfo) {
    this.logCrashEvent('MEMORY_CRASH_IMMINENT', {
      memInfo,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });

    // Backup final
    this.createEmergencyBackup();
    
    // Enviar logs inmediatamente
    this.sendCrashReport();
  }

  logCrashEvent(type, data) {
    const crashEvent = {
      type,
      timestamp: Date.now(),
      sessionId: this.generateSessionId(),
      data,
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Guardar en localStorage
    const crashLogs = this.getCrashLogs();
    crashLogs.push(crashEvent);
    
    // Mantener solo los últimos 20 eventos de crash
    if (crashLogs.length > 20) {
      crashLogs.splice(0, crashLogs.length - 20);
    }
    
    localStorage.setItem('touchbit-crash-logs', JSON.stringify(crashLogs));
    
    // También loggear en el memory monitor
    memoryMonitor.log(type, JSON.stringify(data));
    
    console.error(`🚨 CRASH EVENT [${type}]:`, crashEvent);
  }

  getCrashLogs() {
    try {
      return JSON.parse(localStorage.getItem('touchbit-crash-logs') || '[]');
    } catch {
      return [];
    }
  }

  calculateMemoryTrend() {
    const memoryLogs = memoryMonitor.memoryLogs.slice(-10);
    if (memoryLogs.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < memoryLogs.length; i++) {
      changes.push(memoryLogs[i].used - memoryLogs[i-1].used);
    }
    
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  attemptMemoryCleanup() {
    try {
      // Forzar garbage collection si está disponible
      if (window.gc) {
        window.gc();
        memoryMonitor.log('CLEANUP', 'Forced garbage collection');
      }
      
      // Limpiar caches de audio si existen
      if (window.audioEngine && window.audioEngine.cleanup) {
        window.audioEngine.cleanup();
      }
      
      // Trigger event para que otros componentes limpien
      window.dispatchEvent(new CustomEvent('memory-cleanup-requested'));
      
    } catch (error) {
      this.logCrashEvent('CLEANUP_ERROR', { error: error.message });
    }
  }

  attemptAgressiveCleanup() {
    this.attemptMemoryCleanup();
    
    try {
      // Pausar audio para liberar buffers
      if (window.audioContext) {
        window.audioContext.suspend();
      }
      
      // Limpiar visualizadores
      window.dispatchEvent(new CustomEvent('aggressive-cleanup'));
      
      memoryMonitor.log('CLEANUP', 'Aggressive cleanup performed');
    } catch (error) {
      this.logCrashEvent('AGGRESSIVE_CLEANUP_ERROR', { error: error.message });
    }
  }

  createEmergencyBackup() {
    try {
      const backup = {
        timestamp: Date.now(),
        expressions: localStorage.getItem('touchbit-saved-expressions'),
        currentExpression: localStorage.getItem('touchbit-current-expression'),
        settings: localStorage.getItem('touchbit-ui-settings'),
        theme: localStorage.getItem('touchbit-theme')
      };
      
      localStorage.setItem('touchbit-emergency-backup', JSON.stringify(backup));
      memoryMonitor.log('BACKUP', 'Emergency backup created');
    } catch (error) {
      console.error('Failed to create emergency backup:', error);
    }
  }

  sendCrashReport() {
    if (!this.remoteLogEndpoint) return;
    
    try {
      const report = {
        crashLogs: this.getCrashLogs(),
        memoryLogs: memoryMonitor.exportLogs(),
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        sessionId: this.generateSessionId()
      };

      // Enviar usando fetch con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      fetch(this.remoteLogEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        signal: controller.signal
      }).then(() => {
        clearTimeout(timeoutId);
        console.log('Crash report sent successfully');
      }).catch((error) => {
        clearTimeout(timeoutId);
        console.warn('Failed to send crash report:', error);
      });
    } catch (error) {
      console.error('Error preparing crash report:', error);
    }
  }

  showCrashRecoveryMessage() {
    // Mostrar una notificación discreta al usuario
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10001;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.innerHTML = `
      🔄 App recovered from potential crash<br>
      <small>Debug logs preserved for analysis</small>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  startAgressiveMonitoring() {
    // Monitoreo cada 2 segundos cuando la memoria está alta
    setInterval(() => {
      if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const percentage = (used / performance.memory.jsHeapSizeLimit) * 100;
        
        if (percentage > 70) {
          memoryMonitor.checkMemory();
          
          if (percentage > 85) {
            this.logCrashEvent('HIGH_MEMORY_USAGE', {
              percentage,
              used,
              limit: performance.memory.jsHeapSizeLimit
            });
          }
        }
      }
    }, 2000);
  }

  // Método para exportar todos los logs de debugging
  exportAllDebugData() {
    return {
      memoryLogs: memoryMonitor.exportLogs(),
      crashLogs: this.getCrashLogs(),
      generalLogs: memoryMonitor.getGeneralLogs(),
      appState: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      }
    };
  }
}

// Exportar instancia singleton
export const crashDetector = new CrashDetector();
