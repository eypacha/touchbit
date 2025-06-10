/**
 * Quick Debug Access - Gestos especiales para activar debugging en móvil
 */

export class QuickDebugAccess {
  constructor() {
    this.touchSequence = [];
    this.lastTouchTime = 0;
    this.secretTaps = 0;
    this.setupSecretGestures();
    this.setupConsoleCommands();
  }

  setupSecretGestures() {
    // Gesto secreto: 5 toques en la esquina superior derecha en 3 segundos
    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const now = Date.now();
      
      // Verificar si el toque está en la esquina superior derecha
      if (touch.clientX > window.innerWidth * 0.8 && touch.clientY < 100) {
        
        // Reset si han pasado más de 3 segundos
        if (now - this.lastTouchTime > 3000) {
          this.secretTaps = 0;
        }
        
        this.secretTaps++;
        this.lastTouchTime = now;
        
        console.log(`🐛 Debug tap ${this.secretTaps}/5`);
        
        // Si se completó la secuencia secreta
        if (this.secretTaps >= 5) {
          this.activateDebugMode();
          this.secretTaps = 0;
        }
      } else {
        // Reset si se toca en otro lugar
        this.secretTaps = 0;
      }
    });

    // Atajo de teclado: Ctrl+Shift+D
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.activateDebugMode();
      }
    });

    // Gesto alternativo: sacudir el dispositivo (si está disponible)
    if (window.DeviceMotionEvent) {
      let lastShake = 0;
      window.addEventListener('devicemotion', (e) => {
        const acceleration = e.accelerationIncludingGravity;
        const now = Date.now();
        
        if (acceleration && (now - lastShake > 1000)) {
          const totalAcceleration = Math.abs(acceleration.x) + 
                                   Math.abs(acceleration.y) + 
                                   Math.abs(acceleration.z);
          
          if (totalAcceleration > 40) { // Threshold para sacudida fuerte
            this.activateDebugMode();
            lastShake = now;
          }
        }
      });
    }

    // Triple toque en el logo
    const logo = document.querySelector('.logo');
    if (logo) {
      let logoTaps = 0;
      let logoLastTap = 0;
      
      logo.addEventListener('click', () => {
        const now = Date.now();
        if (now - logoLastTap < 500) {
          logoTaps++;
        } else {
          logoTaps = 1;
        }
        logoLastTap = now;
        
        if (logoTaps >= 3) {
          this.activateDebugMode();
          logoTaps = 0;
        }
      });
    }
  }

  activateDebugMode() {
    // Mostrar notificación de activación
    this.showDebugActivationNotice();
    
    // Buscar y activar el botón de debug
    const debugButton = document.querySelector('.debug-toggle');
    if (debugButton) {
      debugButton.click();
      console.log('🐛 Debug panel opened via secret gesture');
    } else {
      // Si no existe el botón, crear un evento personalizado
      window.dispatchEvent(new CustomEvent('show-debug-panel'));
      console.log('🐛 Debug panel event dispatched');
    }
    
    // Log del evento
    console.log('🐛 Debug mode activated via secret gesture');
    
    // Vibrar si está disponible (feedback táctil)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  setupConsoleCommands() {
    // Exponer funciones globales para debugging
    window.showDebug = () => {
      const debugButton = document.querySelector('.debug-toggle');
      if (debugButton) {
        debugButton.click();
      } else {
        this.activateDebugMode();
      }
    };
    
    window.hideDebug = () => {
      const closeButton = document.querySelector('.debug-panel .debug-panel__btn');
      if (closeButton && closeButton.textContent.includes('❌')) {
        closeButton.click();
      }
    };
    
    window.debugInfo = () => {
      console.log('🐛 Debug Access Methods:');
      console.log('  1. Triple tap on logo');
      console.log('  2. 5 taps in top-right corner within 3 seconds');
      console.log('  3. Shake device (if supported)');
      console.log('  4. Keyboard: Ctrl+Shift+D');
      console.log('  5. Console: showDebug()');
      console.log('  6. Look for 🐛 button in bottom-right corner');
    };

    // Mostrar info en la consola
    setTimeout(() => {
      console.log('🐛 Debug panel ready! Type debugInfo() for access methods');
    }, 1000);
  }

  showDebugActivationNotice() {
    const notice = document.createElement('div');
    notice.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #000;
      color: #0f0;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      z-index: 10002;
      border: 2px solid #0f0;
      text-align: center;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
    `;
    notice.innerHTML = `
      🐛 DEBUG MODE ACTIVATED<br>
      <small>Memory monitoring enabled</small>
    `;
    
    document.body.appendChild(notice);
    
    setTimeout(() => {
      if (notice.parentNode) {
        notice.style.transition = 'opacity 0.5s';
        notice.style.opacity = '0';
        setTimeout(() => {
          if (notice.parentNode) {
            notice.parentNode.removeChild(notice);
          }
        }, 500);
      }
    }, 2000);
  }
}

// Crear instancia automáticamente
export const quickDebugAccess = new QuickDebugAccess();
