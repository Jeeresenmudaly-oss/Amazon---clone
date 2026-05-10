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
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    state.isOpen = false;
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
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
  function render() {
    renderCartCount();
    renderCartDrawer();
    renderAddedStates();
  }

  function renderCartCount() {
    const count = totalCount();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'flex';
    });
  }

  function renderAddedStates() {
    // Update "Add to Cart" button text for items already in cart
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      const pid = parseInt(btn.dataset.id);
      const inCart = state.items.some(i => i.product.id === pid);
      if (inCart) {
        btn.textContent = '✓ In Cart';
        btn.classList.add('added');
      } else {
        btn.textContent = '🛒 Add to Cart';
        btn.classList.remove('added');
      }
    });
  }

  function renderCartDrawer() {
    const body   = document.getElementById('cart-body');
    const footer = document.getElementById('cart-footer');
    if (!body) return;

    if (state.items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p>Your cart is empty</p>
          <span>Add items to get started</span>
          <button class="btn-continue-shopping" onclick="CartManager.close()">Continue Shopping</button>
        </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    body.innerHTML = state.items.map(({ product, quantity }) => `
      <div class="cart-item" data-id="${product.id}">
        <img class="cart-item-img"
             src="${product.img}"
             alt="${escHtml(product.title)}"
             loading="lazy">
        <div class="cart-item-details">
          <div class="cart-item-name">${escHtml(product.title)}</div>
          <div class="cart-item-price">R${(product.price * quantity).toFixed(2)}</div>
          <div class="cart-item-controls">
            <button class="qty-btn"
                    onclick="CartManager.updateQty(${product.id}, -1)"
                    aria-label="Decrease quantity">−</button>
            <span class="qty-value">${quantity}</span>
            <button class="qty-btn"
                    onclick="CartManager.updateQty(${product.id}, 1)"
                    aria-label="Increase quantity">+</button>
            <button class="cart-item-remove"
                    onclick="CartManager.removeItem(${product.id})">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    // Render footer
    if (footer) {
      const savingsAmt = savings();
      footer.innerHTML = `
        <div class="cart-subtotal">
          <span class="cart-subtotal-label">Subtotal (${totalCount()} items):</span>
          <span class="cart-subtotal-value">R${subtotal().toFixed(2)}</span>
        </div>
        ${savingsAmt > 0 ? `<div class="cart-savings">You save: R${savingsAmt.toFixed(2)}</div>` : ''}
        <a href="pages/checkout.html" class="btn-checkout">
          🔒 Proceed to Checkout
        </a>
        <div class="cart-disclaimer">🔒 Secure checkout</div>
      `;
    }
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

  /* ── Utility ────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    load();

    // Overlay / close
    document.getElementById('cart-overlay')?.addEventListener('click', close);
    document.getElementById('cart-close-btn')?.addEventListener('click', close);

    // Cart icon(s) open the drawer
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
    getItems:    () => state.items,
    showToast,
    render,
  };
})();

// Auto-init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => CartManager.init());
