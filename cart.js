/* ============================================================
   cart.js — Cart State Management & UI
   Handles: add, remove, update qty, open/close drawer, localStorage
   ============================================================ */

var CartManager; // declared with var so it's truly global
CartManager = (() => {
  /* ── State ──────────────────────────────────────────────── */
  const STORAGE_KEY = 'amazon_clone_cart';

  let state = {
    items:    [],   // [{ product, quantity }]
    isOpen:   false,
  };

  /* ── Persistence ────────────────────────────────────────── */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state.items = JSON.parse(raw);
      }
    } catch {
      state.items = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      console.warn('localStorage unavailable');
    }
    _dispatchState();
  }

  function _dispatchState() {
    window.dispatchEvent(new CustomEvent('cart-state-changed', {
      detail: { isOpen: state.isOpen, items: state.items.slice() },
    }));
  }

  /* ── Core Operations ────────────────────────────────────── */
  function addItem(product) {
    const existing = state.items.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.items.push({ product, quantity: 1 });
    }
    save();
    render();
    bumpCartIcon();
    showToast(`✅ "${product.title.slice(0, 40)}…" added to cart`);
  }

  function removeItem(productId) {
    state.items = state.items.filter(i => i.product.id !== productId);
    save();
    render();
  }

  function updateQty(productId, delta) {
    const item = state.items.find(i => i.product.id === productId);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    save();
    render();
  }

  function setQty(productId, qty) {
    const item = state.items.find(i => i.product.id === productId);
    if (!item) return;
    if (qty < 1) { removeItem(productId); return; }
    item.quantity = qty;
    save();
    render();
  }

  function clear() {
    state.items = [];
    save();
    render();
  }

  /* ── Computed ───────────────────────────────────────────── */
  function totalCount() {
    return state.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  function subtotal() {
    return state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  function originalTotal() {
    return state.items.reduce((sum, i) => {
      const orig = i.product.original || i.product.price;
      return sum + orig * i.quantity;
    }, 0);
  }

  function savings() {
    return originalTotal() - subtotal();
  }

  /* ── Drawer open/close ──────────────────────────────────── */
  function open() {
    state.isOpen = true;
    document.body.style.overflow = 'hidden';
    _dispatchState();
  }

  function close() {
    state.isOpen = false;
    document.body.style.overflow = '';
    _dispatchState();
  }

  function toggle() {
    state.isOpen ? close() : open();
  }

  /* ── Icon animation ─────────────────────────────────────── */
  function bumpCartIcon() {
    const badge = document.querySelector('.cart-count');
    if (!badge) return;
    badge.classList.remove('bump');
    void badge.offsetWidth; // reflow
    badge.classList.add('bump');
    setTimeout(() => badge.classList.remove('bump'), 400);
  }

  /* ── Render ─────────────────────────────────────────────── */
  /* Cart drawer and product-card states are handled by React.
     render() keeps the nav badge in sync and fires the event
     so React components re-render. */
  function render() {
    renderCartCount();
    _dispatchState();
  }

  function renderCartCount() {
    const count = totalCount();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
    });
  }

  /* ── Toast ──────────────────────────────────────────────── */
  let toastTimer = null;

  function showToast(message) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    load();

    // Cart icon(s) open the drawer (nav is plain HTML, not React)
    document.querySelectorAll('.nav-cart').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        toggle();
      });
    });

    // Keyboard ESC closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isOpen) close();
    });

    render();
  }

  /* ── Public API ─────────────────────────────────────────── */
  return {
    init,
    addItem,
    removeItem,
    updateQty,
    setQty,
    clear,
    open,
    close,
    toggle,
    totalCount,
    subtotal,
    savings,
    getItems:   () => state.items,
    getIsOpen:  () => state.isOpen,
    showToast,
    render,
  };
})();

// Auto-init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => CartManager.init());
