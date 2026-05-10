/* ============================================================
   products.js — Product Grid Renderer
   Renders product cards, category cards, handles add-to-cart.
   ============================================================ */

var ProductsRenderer;
ProductsRenderer = (() => {
  /* ── Render stars ───────────────────────────────────────── */
  function renderStars(rating) {
    let html = '<div class="stars">';
    for (let i = 1; i <= 5; i++) {
      const diff = rating - (i - 1);
      if (diff >= 1) {
        html += '<span class="star">★</span>';
      } else if (diff >= 0.5) {
        html += '<span class="star half">★</span>';
      } else {
        html += '<span class="star empty">★</span>';
      }
    }
    html += '</div>';
    return html;
  }

  /* ── Render single product card ─────────────────────────── */
  function renderProductCard(product) {
    const discount = product.original
      ? Math.round((1 - product.price / product.original) * 100)
      : 0;

    const badgeHTML = product.badge
      ? `<span class="product-badge badge-${product.badge}">${escHtml(product.badgeText)}</span>`
      : '';

    const inWishlist = WishlistManager ? WishlistManager.has(product.id) : false;

    return `
    <div class="product-card" data-id="${product.id}" data-category="${product.category}"
         data-price="${product.price}" data-rating="${product.rating}">
      ${badgeHTML}
      <button class="wishlist-btn ${inWishlist ? 'wishlisted' : ''}"
              data-id="${product.id}"
              aria-label="Add to wishlist"
              onclick="WishlistManager.toggle(${product.id})">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0
                   00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      </button>

      <div class="product-img-wrapper">
        <img class="product-img"
             src="${product.img}"
             alt="${escHtml(product.title)}"
             loading="lazy">
      </div>

      <div class="product-body">
        <div class="product-category-tag">${escHtml(getCategoryLabel(product.category))}</div>
        <div class="product-title">${escHtml(product.title)}</div>

        <div class="product-rating">
          ${renderStars(product.rating)}
          <span class="rating-count">(${product.reviews.toLocaleString()})</span>
        </div>

        <div class="product-price-row">
          <span class="price-current">
            <span class="price-currency">R</span>${product.price.toFixed(2)}
          </span>
          ${product.original
            ? `<span class="price-original">R${product.original.toFixed(2)}</span>
               <span class="price-discount">-${discount}%</span>`
            : ''}
        </div>

        ${product.prime
          ? '<div class="prime-badge">Prime</div>'
          : ''}

        <div class="product-delivery">${escHtml(product.delivery)}</div>

        <button class="btn-add-cart"
                data-id="${product.id}"
                onclick="handleAddToCart(${product.id})">
          🛒 Add to Cart
        </button>
      </div>
    </div>`;
  }

  /* ── Render product grid ────────────────────────────────── */
  function renderGrid(products, containerId = 'products-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Count display
    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = `${products.length} result${products.length !== 1 ? 's' : ''}`;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="products-empty">
          <svg viewBox="0 0 24 24"><path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          <p>No products found</p>
          <span>Try adjusting your search or filters</span>
        </div>`;
      return;
    }

    container.innerHTML = products.map(renderProductCard).join('');

    // Update wishlist button states
    if (typeof WishlistManager !== 'undefined') {
      WishlistManager.updateButtonStates();
    }
    // Update cart button states
    if (typeof CartManager !== 'undefined') {
      CartManager.render();
    }
  }

  /* ── Render category cards ──────────────────────────────── */
  function renderCategories(containerId = 'categories-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = CATEGORY_CARDS.map(cat => `
      <a class="category-card ${cat.badge ? 'highlight' : ''}"
         href="#products"
         data-badge="${cat.badge ? cat.badge.toUpperCase() : ''}"
         onclick="FilterManager && FilterManager.setCategory('${cat.id}')">
        <div class="category-card-img-wrapper">
          <img class="category-card-img"
               src="${cat.img}"
               alt="${escHtml(cat.name)}"
               loading="lazy">
        </div>
        <div class="category-card-body">
          <div class="category-card-name">${escHtml(cat.name)}</div>
          <div class="category-card-cta">${escHtml(cat.cta)}</div>
        </div>
      </a>
    `).join('');
  }

  /* ── Render filter buttons ──────────────────────────────── */
  function renderFilterButtons(containerId = 'category-filters') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = CATEGORIES.map(cat => `
      <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}"
              data-category="${cat.id}"
              onclick="FilterManager.setCategory('${cat.id}')">
        ${escHtml(cat.label)}
      </button>
    `).join('');
  }

  /* ── Utility ─────────────────────────────────────────────*/
  function getCategoryLabel(id) {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? cat.label : id;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    renderGrid,
    renderCategories,
    renderFilterButtons,
    renderProductCard,
    renderStars,
  };
})();

/* ── Global add-to-cart handler ────────────────────────────── */
function handleAddToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  CartManager.addItem(product);
}

/* ── Init on DOMContentLoaded ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  ProductsRenderer.renderCategories();
  ProductsRenderer.renderFilterButtons();
  // Initial full grid render (FilterManager will call renderGrid after)
});
