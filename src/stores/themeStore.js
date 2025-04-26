import { ref } from "vue";
import { defineStore } from "pinia";

export const useThemeStore = defineStore("theme", () => {
  const theme = ref('dark');

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

  return {
    theme,
    updateTheme,
    toggleTheme
  };
});