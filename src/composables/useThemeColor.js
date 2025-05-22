import { ref } from 'vue';

/**
 * Composable for reactively getting CSS custom property colors from the current theme
 * @returns {Object} Functions and reactive references for theme colors
 */
export function useThemeColor() {
  // Reactive colors that update when the theme changes
  const numberColor = ref(getNumberColor());
  
  /**
   * Gets the CSS number color from the current theme
   * @returns {string} CSS color in hsl() format
   */
  function getNumberColor() {
    const numberHsl = getComputedStyle(document.documentElement).getPropertyValue('--number').trim();
    return `hsl(${numberHsl})`;
  }
  
  /**
   * Gets any CSS color from custom properties in the current theme
   * @param {string} propertyName - The name of the CSS custom property (without --)
   * @returns {string} CSS color in hsl() format
   */
  function getCssColor(propertyName) {
    const colorHsl = getComputedStyle(document.documentElement).getPropertyValue(`--${propertyName}`).trim();
    return `hsl(${colorHsl})`;
  }
  
  /**
   * Updates the reactive color references when the theme changes
   */
  function updateColors() {
    numberColor.value = getNumberColor();
  }
  
  // Return the functions and reactive references
  return {
    numberColor,
    getNumberColor,
    getCssColor,
    updateColors
  };
}
