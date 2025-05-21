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

app.mount("#app");
