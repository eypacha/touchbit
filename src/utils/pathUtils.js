/**
 * Utility functions for constructing correct paths to resources
 */

/**
 * Constructs a path to a resource relative to the base URL of the app
 * Works both in development and production environments
 * 
 * @param {string} path - The relative path from the base of the app
 * @returns {string} - The correctly constructed path
 */
export function getAssetPath(path) {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Get the base URL (origin + pathname up to the last /)
  const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  
  // Construct and return the full URL's pathname
  return new URL(cleanPath, baseUrl).pathname;
}
