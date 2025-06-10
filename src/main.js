import "./styles/style.scss";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize theme after pinia is set up
import { useThemeStore } from "./stores/themeStore";
const themeStore = useThemeStore();
themeStore.initTheme();

// Check if debug system should be enabled from localStorage
const isDebugEnabled = localStorage.getItem('touchbit-debug-enabled') === 'true';

// Only initialize debug components if enabled
if (isDebugEnabled) {
  // Use dynamic imports to avoid loading debug modules when not needed
  Promise.all([
    import("./utils/memoryMonitor"),
    import("./utils/crashDetector"),
    import("./utils/quickDebugAccess")
  ]).then(([memoryMonitorModule, crashDetectorModule, quickDebugAccessModule]) => {
    const { memoryMonitor } = memoryMonitorModule;
    const { crashDetector } = crashDetectorModule;
    const { quickDebugAccess } = quickDebugAccessModule;
    
    // Start memory monitoring as soon as possible
    memoryMonitor.startMonitoring(3000); // Check every 3 seconds
    memoryMonitor.log('APP_INIT', 'Touchbit application started');

    // Initialize crash detection
    crashDetector; // This will start the crash detection automatically

    // Initialize quick debug access  
    quickDebugAccess; // This will setup debug gesture shortcuts
  });
}

app.mount("#app");
