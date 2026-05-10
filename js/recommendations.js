/* ============================================================
   recommendations.js — "You May Also Like" Section
   Uses category similarity to recommend products.
   No ML — just category + rating + cart state logic.
   ============================================================ */

var RecommendationsManager;
RecommendationsManager = (() => {
  const MAX_RECS = 5;

  /* ── Get recommended products ───────────────────────────── */
  function getRecommended() {
    const cartItems  = CartManager?.getItems() || [];
    const cartIds    = new Set(cartItems.map(i => i.product.id));

    if (cartItems.length > 0) {
      // Get categories from cart items
      const cartCategories = [...new Set(cartItems.map(i => i.product.category))];

      // Find products in same categories, not already in cart, sorted by rating
      const recs = PRODUCTS
        .filter(p => !cartIds.has(p.id) && cartCategories.includes(p.category))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, MAX_RECS);

      // If not enough, fill with top-rated products from any category
      if (recs.length < MAX_RECS) {
        const extra = PRODUCTS
          .filter(p => !cartIds.has(p.id) && !recs.find(r => r.id === p.id))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, MAX_RECS - recs.length);
        recs.push(...extra);
      }

      return recs;
    }

    // No cart items: show top-rated products overall
    return PRODUCTS
      .sort((a, b) => b.rating - a.rating)
      .slice(0, MAX_RECS);
  }

  /* ── Render ─────────────────────────────────────────────── */
  function render() {
    const container = document.getElementById('recommendations-grid');
    if (!container) return;

    const recs = getRecommended();
    const section = document.getElementById('recommendations-section');

    if (recs.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }

    if (section) section.style.display = 'block';

    container.innerHTML = recs
      .map(p => ProductsRenderer.renderProductCard(p))
      .join('');

    // Sync cart + wishlist states on the new cards
    if (typeof CartManager !== 'undefined') CartManager.render();
    if (typeof WishlistManager !== 'undefined') WishlistManager.updateButtonStates();
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    render();

    // Re-render whenever cart changes (CartManager calls render() globally)
  }

  return { init, render, getRecommended };
})();

document.addEventListener('DOMContentLoaded', () => RecommendationsManager.init());
