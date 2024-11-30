<template>
  <Toolbar />
  <main class="w-full h-full flex flex-col">
    <StackContainer />
    <BottomContainer />
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";

import Toolbar from "../components/Toolbar.vue";
import StackContainer from "../components/StackContainer.vue";
import BottomContainer from "../components/BottomContainer.vue";

const theme = ref("dark");

const prefersDarkScheme = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches;

onMounted(() => {
  theme.value = prefersDarkScheme ? "dark" : "light";
  updateTheme();
});

// Función para actualizar la clase `dark` en el `html`
function updateTheme() {
  const html = document.documentElement;
  if (theme.value === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}
function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  updateTheme();
}
</script>

<style lang="scss" module></style>
