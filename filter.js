/* ============================================================
   filter.js — Product Filtering & Sorting
   Handles: category filter, sort by price/rating, combined state
   ============================================================ */

var FilterManager;
FilterManager = (() => {
  /* ── State ──────────────────────────────────────────────── */
  let state = {
    category: 'all',
    sort:     'default',   // 'price-asc' | 'price-desc' | 'rating' | 'default'
  };

  /* ── Get filtered + sorted products ────────────────────── */
  function getFilteredProducts() {
    let products = [...PRODUCTS];

    // 1. Category filter
    if (state.category !== 'all') {
      products = products.filter(p => p.category === state.category);
    }

    // 2. Search filter
    if (typeof SearchManager !== 'undefined') {
      products = SearchManager.filter(products);
    }

    // 3. Sort
    switch (state.sort) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        products.sort((a, b) => b.reviews - a.reviews);
        break;
      case 'discount':
        products.sort((a, b) => {
          const da = a.original ? (1 - a.price / a.original) : 0;
          const db = b.original ? (1 - b.price / b.original) : 0;
          return db - da;
        });
        break;
      default:
        // Keep original order (PRODUCTS array order)
        break;
    }

    return products;
  }

  /* ── Apply all filters & re-render ─────────────────────── */
  function applyAll() {
    const filtered = getFilteredProducts();

    // Update results count (was previously done inside ProductsRenderer.renderGrid)
    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;

    // Notify React ProductGridRoot to re-render with new product list
    window.dispatchEvent(new CustomEvent('products-filtered', {
      detail: { products: filtered },
    }));
  }

  /* ── Set category ───────────────────────────────────────── */
  function setCategory(cat) {
    state.category = cat;

    // Update filter button active states
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === cat);
    });

    // Also sync the search category dropdown if present
    const catSelect = document.querySelector('.search-category');
    if (catSelect) {
      // Map category id to option value
      const optVal = cat === 'all' ? 'All' : CATEGORIES.find(c => c.id === cat)?.label || cat;
      Array.from(catSelect.options).forEach(opt => {
        if (opt.value === optVal) catSelect.value = opt.value;
      });
    }

    applyAll();

    // Scroll to products section
    setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  /* ── Set sort ───────────────────────────────────────────── */
  function setSort(sortValue) {
    state.sort = sortValue;
    applyAll();
  }

  /* ── Reset all filters ──────────────────────────────────── */
  function reset() {
    state.category = 'all';
    state.sort = 'default';

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === 'all');
    });

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'default';

    if (typeof SearchManager !== 'undefined') SearchManager.clear();

    applyAll();
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => setSort(e.target.value));
    }

    // Search category select → filter
    const catSelect = document.querySelector('.search-category');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        const val = e.target.value.toLowerCase().replace(/\s+/g, '-');
        if (val === 'all' || val === 'all categories') {
          setCategory('all');
        } else {
          const match = CATEGORIES.find(c => c.label.toLowerCase() === e.target.value.toLowerCase());
          if (match) setCategory(match.id);
        }
      });
    }

    // Initial render
    applyAll();
  }

  return {
    init,
    setCategory,
    setSort,
    reset,
    applyAll,
    getFilteredProducts,
    getState: () => ({ ...state }),
  };
})();

document.addEventListener('DOMContentLoaded', () => FilterManager.init());
