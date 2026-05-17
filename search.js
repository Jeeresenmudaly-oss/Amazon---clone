/* ============================================================
   search.js — Product Search Feature (Manual Implementation)
   Searches products by title in real-time as user types.
   No AI, no external libs — pure JavaScript.
   ============================================================ */

var SearchManager;
SearchManager = (() => {
  let searchQuery = '';
  let debounceTimer = null;

  /* ── Normalize text for comparison ─────────────────────── */
  function normalize(str) {
    return str.toLowerCase().trim();
  }

  /* ── Check if product matches query ────────────────────── */
  function productMatchesQuery(product, query) {
    if (!query) return true;
    const norm = normalize(query);
    const titleMatch    = normalize(product.title).includes(norm);
    const categoryMatch = normalize(product.category).includes(norm);
    return titleMatch || categoryMatch;
  }

  /* ── Get current query ──────────────────────────────────── */
  function getQuery() {
    return searchQuery;
  }

  /* ── Set query and trigger re-render ────────────────────── */
  function setQuery(query) {
    searchQuery = query;
    FilterManager.applyAll();
  }

  /* ── Filter products by current query ──────────────────── */
  function filter(products) {
    if (!searchQuery.trim()) return products;
    return products.filter(p => productMatchesQuery(p, searchQuery));
  }

  /* ── Highlight matches in product title ─────────────────── */
  function highlightMatch(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark style="background:#fff3cd;padding:0 2px;border-radius:2px;">$1</mark>');
  }

  /* ── Show/hide search results banner ───────────────────── */
  function updateSearchBanner() {
    let banner = document.getElementById('search-banner');

    if (searchQuery.trim()) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'search-banner';
        banner.style.cssText = `
          background: #fff8dc;
          border: 1px solid #f0c14b;
          border-radius: 4px;
          padding: 10px 16px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: space-between;
        `;
        const grid = document.getElementById('products-react-root');
        grid?.parentNode?.insertBefore(banner, grid);
      }

      const count = FilterManager.getFilteredProducts().length;
      banner.innerHTML = `
        <span>🔍 Showing results for <strong>"${escHtml(searchQuery)}"</strong> — ${count} product${count !== 1 ? 's' : ''} found</span>
        <button onclick="SearchManager.clear()" style="
          background:none; border:none; cursor:pointer;
          color:#C45500; font-weight:600; font-size:13px;
        ">✕ Clear</button>
      `;
    } else if (banner) {
      banner.remove();
    }
  }

  /* ── Clear search ───────────────────────────────────────── */
  function clear() {
    searchQuery = '';
    const inputs = document.querySelectorAll('.search-input');
    inputs.forEach(inp => inp.value = '');
    FilterManager.applyAll();
    updateSearchBanner();
  }

  /* ── Utility ─────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Init: wire up search inputs ────────────────────────── */
  function init() {
    const searchInputs = document.querySelectorAll('.search-input');
    const searchBtns   = document.querySelectorAll('.search-btn');

    searchInputs.forEach(input => {
      // Live search with 300ms debounce
      input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setQuery(e.target.value);
          updateSearchBanner();
        }, 300);
      });

      // Search on Enter
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(debounceTimer);
          setQuery(e.target.value);
          updateSearchBanner();
          // Scroll to products
          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    searchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.nav-search')?.querySelector('.search-input');
        if (input) {
          clearTimeout(debounceTimer);
          setQuery(input.value);
          updateSearchBanner();
          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  return {
    init,
    filter,
    getQuery,
    setQuery,
    clear,
    highlightMatch,
    updateSearchBanner,
  };
})();

document.addEventListener('DOMContentLoaded', () => SearchManager.init());
