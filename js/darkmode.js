/* ============================================================
   darkmode.js — Dark Mode Toggle
   Persists preference in localStorage. Applies instantly on load.
   ============================================================ */

var DarkModeManager;
DarkModeManager = (() => {
  const STORAGE_KEY = 'amazon_clone_theme';
  let isDark = false;

  /* ── Apply theme ────────────────────────────────────────── */
  function apply(dark) {
    isDark = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    // Update toggle button aria
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    // Update label text
    const label = document.querySelector('.dark-mode-label');
    if (label) {
      label.textContent = dark ? 'Light' : 'Dark';
    }
  }

  /* ── Toggle ─────────────────────────────────────────────── */
  function toggle() {
    apply(!isDark);
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {}
  }

  /* ── Load saved preference ───────────────────────────────── */
  function loadPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved === 'dark';
    } catch {}

    // Fall back to OS preference
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    const savedDark = loadPreference();
    apply(savedDark);

    // Wire up toggle button
    const toggle_btn = document.getElementById('dark-mode-toggle');
    if (toggle_btn) {
      toggle_btn.addEventListener('click', toggle);
    }

    // Listen to OS preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-follow if user hasn't manually set a preference
        try {
          if (!localStorage.getItem(STORAGE_KEY)) apply(e.matches);
        } catch {
          apply(e.matches);
        }
      });
    }
  }

  return {
    init,
    toggle,
    apply,
    isDark: () => isDark,
  };
})();

// Apply theme BEFORE DOM is fully loaded to prevent flash
(function() {
  try {
    const saved = localStorage.getItem('amazon_clone_theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch {}
})();

document.addEventListener('DOMContentLoaded', () => DarkModeManager.init());
