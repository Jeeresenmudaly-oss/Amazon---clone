/* ============================================================
   nav.js — Navigation Interactions
   Hamburger menu, mobile drawer, back-to-top, scroll effects.
   ============================================================ */

var NavManager;
NavManager = (() => {

  /* ── Mobile menu ────────────────────────────────────────── */
  function initMobileMenu() {
    const hamburger = document.getElementById('nav-hamburger');
    const menu      = document.getElementById('mobile-menu');
    const overlay   = document.getElementById('mobile-overlay');
    const close_btn = document.getElementById('mobile-close');

    function openMenu() {
      menu?.classList.add('open');
      overlay?.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      menu?.classList.remove('open');
      overlay?.classList.remove('open');
      document.body.style.overflow = '';
    }

    hamburger?.addEventListener('click', openMenu);
    overlay?.addEventListener('click', closeMenu);
    close_btn?.addEventListener('click', closeMenu);

    // Close on nav link click (mobile)
    menu?.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ── Navbar scroll effect ───────────────────────────────── */
  function initScrollEffect() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 3px 12px rgba(0,0,0,.4)';
      } else {
        navbar.style.boxShadow = '';
      }
    }, { passive: true });
  }

  /* ── Back to top ────────────────────────────────────────── */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Smooth scroll for anchor links ─────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    initMobileMenu();
    initScrollEffect();
    initBackToTop();
    initSmoothScroll();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => NavManager.init());
