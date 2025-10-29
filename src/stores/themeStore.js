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


    // Tamaño de tipografía global para StackContainer
    const fontSize = ref(2.5); // valor inicial en rem

    // Estado reactivo para hue-rotation global
    const hueRotation = ref(0); // valor inicial en grados

    function setHueRotation(newHue) {
        hueRotation.value = newHue;
        localStorage.setItem('touchbit-hue-rotation', newHue);
    }

    function setTheme(newTheme) {
        // Update the data-theme attribute on the html element
        const html = document.documentElement;
        html.setAttribute('data-theme', newTheme);
        // Update the theme state
        theme.value = newTheme;
    }

    function setFontSize(newSize) {
        fontSize.value = newSize;
        localStorage.setItem('touchbit-font-size', newSize);
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('touchbit-theme');
        if (savedTheme && availableThemes.includes(savedTheme)) {
            setTheme(savedTheme);
        } else {
            setTheme('classic');
        }
        // Inicializar fontSize desde localStorage
        const savedFontSize = localStorage.getItem('touchbit-font-size');
        if (savedFontSize) {
            fontSize.value = parseFloat(savedFontSize);
        }
        // Inicializar hueRotation desde localStorage
        const savedHue = localStorage.getItem('touchbit-hue-rotation');
        if (savedHue !== null) {
            hueRotation.value = parseInt(savedHue, 10);
        }
    }

    function saveThemePreference() {
        localStorage.setItem('touchbit-theme', theme.value);
    }

    return {
        theme,
        availableThemes,
        fontSize,
        hueRotation,
        setTheme,
        setFontSize,
        setHueRotation,
        initTheme,
        saveThemePreference
    };
});
