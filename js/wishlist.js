/* ============================================================
   wishlist.js — Wishlist / Save for Later Feature
   Stores wishlist in localStorage. Updates heart icons.
   ============================================================ */

var WishlistManager;
WishlistManager = (() => {
  const STORAGE_KEY = 'amazon_clone_wishlist';
  let wishlist = new Set();

  /* ── Persistence ────────────────────────────────────────── */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) wishlist = new Set(JSON.parse(raw));
    } catch {
      wishlist = new Set();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...wishlist]));
    } catch {}
  }

  /* ── Operations ─────────────────────────────────────────── */
  function toggle(productId) {
    const id = parseInt(productId);
    if (wishlist.has(id)) {
      wishlist.delete(id);
      if (typeof CartManager !== 'undefined') CartManager.showToast('💔 Removed from wishlist');
    } else {
      wishlist.add(id);
      const product = PRODUCTS.find(p => p.id === id);
      if (typeof CartManager !== 'undefined') CartManager.showToast(`❤️ "${(product?.title || '').slice(0, 35)}…" saved to wishlist`);
    }
    save();
    updateButtonStates();
    updateWishlistCount();
  }

  function has(productId) {
    return wishlist.has(parseInt(productId));
  }

  function getAll() {
    return PRODUCTS.filter(p => wishlist.has(p.id));
  }

  /* ── Update all wishlist button states on page ──────────── */
  function updateButtonStates() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      const id = parseInt(btn.dataset.id);
      btn.classList.toggle('wishlisted', wishlist.has(id));
    });
  }

  /* ── Update wishlist count badge if present ─────────────── */
  function updateWishlistCount() {
    const countEl = document.getElementById('wishlist-count');
    if (countEl) countEl.textContent = wishlist.size;
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    load();
    updateButtonStates();
    updateWishlistCount();
  }

  return {
    init,
    toggle,
    has,
    getAll,
    updateButtonStates,
    size: () => wishlist.size,
  };
})();

document.addEventListener('DOMContentLoaded', () => WishlistManager.init());
