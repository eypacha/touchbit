# 🐛 Guía de Debugging para Memory Leaks en Touchbit

## ¿Cómo activar el modo debug?

### Métodos para activar el panel de debugging:

1. **Gesto secreto**: Toca 5 veces rápidamente en la esquina superior derecha (dentro de 3 segundos)
2. **Sacudir dispositivo**: Si tu dispositivo tiene acelerómetro, sacúdelo fuertemente
3. **Triple clic en logo**: Haz triple clic rápido en el logo de Touchbit
4. **Memoria crítica**: El panel se activará automáticamente si la memoria supera el límite crítico

## Información que proporciona el panel de debug:

### 💾 Uso de Memoria
- **Used**: Memoria JavaScript utilizada actualmente
- **Total**: Memoria total asignada al heap de JavaScript
- **Limit**: Límite máximo de memoria disponible
- **Percentage**: Porcentaje de memoria utilizada

### 📊 Tendencias de Memoria
- **Min/Max/Avg**: Valores mínimos, máximos y promedio de uso de memoria
- **Gráfico de barras**: Visualización de la tendencia de memoria en tiempo real

### 🎛️ Controles Disponibles
- **🗑️ Force GC**: Fuerza recolección de basura (requiere Chrome con --js-flags="--expose-gc")
- **📤 Export Logs**: Descarga los logs de memoria en formato JSON
- **💥 Crash Data**: Descarga datos completos de crashes y análisis de memoria
- **🧹 Clear Logs**: Limpia todos los logs almacenados
- **💥 Crash Test**: Simula un consumo excesivo de memoria para probar la detección
- **🔧 Test Cleanup**: Ejecuta manualmente la limpieza de memoria

### 📋 Logs Recientes
Muestra los últimos eventos del sistema incluyendo:
- Errores de memoria
- Eventos de cleanup
- Cambios de configuración
- Crashes detectados

## ¿Qué hacer cuando detectas un memory leak?

### 1. **Inmediatamente**:
- Activa el panel de debug
- Haz clic en "📤 Export Logs" para guardar los datos
- Si es posible, haz clic en "💥 Crash Data" para obtener información completa

### 2. **Análisis**:
- Revisa los logs exportados en tu computadora
- Busca patrones en el incremento de memoria
- Identifica qué acciones provocan el aumento

### 3. **Información útil para reportar**:
- Archivo JSON con los logs completos
- Descripción de las acciones que realizaste antes del crash
- Modelo de dispositivo y navegador
- Tiempo aproximado de uso antes del problema

## Prevención automática:

El sistema incluye:
- **Detección proactiva**: Monitoreo continuo cada 2-3 segundos
- **Cleanup automático**: Liberación de memoria cuando se detectan problemas
- **Backup de emergencia**: Guarda tu trabajo antes de crashes
- **Detección de crashes**: Identifica cuando la app se cerró inesperadamente

## Archivos de logs:

Los logs se guardan en localStorage con estas claves:
- `touchbit-memory-logs`: Historial de uso de memoria
- `touchbit-debug-logs`: Logs generales del sistema
- `touchbit-crash-logs`: Eventos de crashes detectados
- `touchbit-emergency-backup`: Backup automático en caso de crash

## Contacto para debugging:

Si experimentas crashes frecuentes:
1. Exporta los datos usando "💥 Crash Data"
2. Incluye el archivo JSON en tu reporte
3. Describe las acciones específicas que causan el problema

¡El sistema está diseñado para ayudarte a identificar y resolver problemas de memoria de forma proactiva!
