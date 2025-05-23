import {
    ref }
from "vue";

import {
    defineStore }
from "pinia";

export const useThemeStore = defineStore("theme", () => {
    const theme = ref('classic');
    const availableThemes = [
        'classic',
        'solarized-dark',
        'solarized-light',
        'autumn',
        'tokyo-night',
        'tokyo-night-light',
        'tokyo-night-storm',
        'matcha'
    ];

    function setTheme(newTheme) {
        // Update the data-theme attribute on the html element
        const html = document.documentElement;
        html.setAttribute('data-theme', newTheme);
        // Update the theme state
        theme.value = newTheme;
    }
    // Initialize theme from localStorage or default

    function initTheme() {
        const savedTheme = localStorage.getItem('touchbit-theme');

        if (savedTheme && availableThemes.includes(savedTheme)) {
            setTheme(savedTheme);
        }

        else {
            setTheme('classic');
            // Default theme
        }
    }
    // Save theme to localStorage whenever it changes

    function saveThemePreference() {
        localStorage.setItem('touchbit-theme', theme.value);
    }

    return {
        theme,
        availableThemes,
        setTheme,
        initTheme,
        saveThemePreference
}
;
}
);
