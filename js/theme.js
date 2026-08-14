/**
 * Theme Engine for NetOps Command Center
 * Manages Dark/Light theme toggling, data-theme attribute binding, and localStorage persistence.
 */

(function () {
  'use strict';

  const THEME_KEY = 'netops_theme';
  const THEMES = {
    DARK: 'dark',
    LIGHT: 'light'
  };

  /**
   * Determine preferred initial theme
   */
  function getInitialTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === THEMES.DARK || saved === THEMES.LIGHT) {
      return saved;
    }
    // Check user system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return THEMES.LIGHT;
    }
    return THEMES.DARK;
  }

  let currentTheme = getInitialTheme();

  /**
   * Apply theme attribute to DOM elements and update toggle button icon
   */
  function applyTheme(theme) {
    currentTheme = theme === THEMES.LIGHT ? THEMES.LIGHT : THEMES.DARK;

    document.documentElement.setAttribute('data-theme', currentTheme);
    if (document.body) {
      document.body.setAttribute('data-theme', currentTheme);
    }

    // Update Theme Toggle Button Icons & Labels
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const toggleIcon = document.getElementById('theme-toggle-icon');

    if (toggleIcon) {
      toggleIcon.textContent = currentTheme === THEMES.DARK ? '☀️' : '🌙';
    }

    if (toggleBtn) {
      const nextTheme = currentTheme === THEMES.DARK ? 'Light' : 'Dark';
      toggleBtn.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
      toggleBtn.setAttribute('title', `Switch to ${nextTheme} theme`);
    }
  }

  /**
   * Set and save theme preference
   */
  function setTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, currentTheme);
    } catch (err) {
      console.warn('[NetOpsTheme] Could not save theme preference to localStorage:', err);
    }
  }

  /**
   * Toggle between Dark and Light theme
   */
  function toggleTheme() {
    const next = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(next);
  }

  /**
   * Module initialization
   */
  function initTheme() {
    applyTheme(currentTheme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }
  }

  // Apply immediately to avoid FOUT (Flash of Unstyled Text/Theme)
  applyTheme(currentTheme);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  window.NetOpsTheme = {
    getTheme: () => currentTheme,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    init: initTheme
  };
})();
