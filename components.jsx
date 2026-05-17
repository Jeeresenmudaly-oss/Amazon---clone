/* ============================================================
   React Components — Amazon Clone
   Requires: React 18 + ReactDOM 18 + Babel Standalone (CDN)
   Must be loaded as <script type="text/babel" src="...">
   Note: file:// protocol will not work — use a local HTTP server
         (e.g. VS Code Live Server, npx serve, python -m http.server)
   ============================================================ */

/* ──────────────────────────────────────────────────────────────
   STAR RATING
   ────────────────────────────────────────────────────────────── */
function StarRating({ rating }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(i => {
        const diff = rating - (i - 1);
        const cls = diff >= 1 ? 'star' : diff >= 0.5 ? 'star half' : 'star empty';
        return <span key={i} className={cls}>★</span>;
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PRODUCT CARD  (pure/presentational — no hooks)
   Props: product, inCart, inWishlist
   ────────────────────────────────────────────────────────────── */
function ProductCard({ product, inCart, inWishlist }) {
  const discount = product.original
    ? Math.round((1 - product.price / product.original) * 100)
    : 0;

  const categoryLabel = (() => {
    const cats = typeof CATEGORIES !== 'undefined' ? CATEGORIES : [];
    const cat = cats.find(c => c.id === product.category);
    return cat ? cat.label : product.category;
  })();

  const handleWishlist = () => {
    if (typeof WishlistManager !== 'undefined') WishlistManager.toggle(product.id);
  };

  const handleAddToCart = () => {
    if (typeof CartManager !== 'undefined') CartManager.addItem(product);
  };

  return (
    <div
      className="product-card"
      data-id={product.id}
      data-category={product.category}
      data-price={product.price}
      data-rating={product.rating}
    >
      {product.badge && (
        <span className={`product-badge badge-${product.badge}`}>{product.badgeText}</span>
      )}

      <button
        className={`wishlist-btn${inWishlist ? ' wishlisted' : ''}`}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={handleWishlist}
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </button>

      <div className="product-img-wrapper">
        <img
          className="product-img"
          src={product.img}
          alt={product.title}
          loading="lazy"
        />
      </div>

      <div className="product-body">
        <div className="product-category-tag">{categoryLabel}</div>
        <div className="product-title">{product.title}</div>

        <div className="product-rating">
          <StarRating rating={product.rating} />
          <span className="rating-count">({product.reviews.toLocaleString()})</span>
        </div>

        <div className="product-price-row">
          <span className="price-current">
            <span className="price-currency">R</span>
            {product.price.toFixed(2)}
          </span>
          {product.original && (
            <>
              <span className="price-original">R{product.original.toFixed(2)}</span>
              <span className="price-discount">-{discount}%</span>
            </>
          )}
        </div>

        {product.prime && <div className="prime-badge">Prime</div>}
        <div className="product-delivery">{product.delivery}</div>

        <button
          className={`btn-add-cart${inCart ? ' added' : ''}`}
          data-id={product.id}
          onClick={handleAddToCart}
        >
          {inCart ? '✓ In Cart' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PRODUCT GRID ROOT
   One state object per root; passes props down — no per-card hooks.
   Subscribes to: products-filtered, cart-state-changed, wishlist-state-changed
   ────────────────────────────────────────────────────────────── */
function ProductGridRoot() {
  const [products, setProducts] = React.useState(() =>
    typeof FilterManager !== 'undefined'
      ? FilterManager.getFilteredProducts()
      : typeof PRODUCTS !== 'undefined' ? [...PRODUCTS] : []
  );
  const [cartItems, setCartItems] = React.useState(() =>
    typeof CartManager !== 'undefined' ? CartManager.getItems() : []
  );
  const [wishlistIds, setWishlistIds] = React.useState(() =>
    typeof WishlistManager !== 'undefined'
      ? new Set(WishlistManager.getAll().map(p => p.id))
      : new Set()
  );

  React.useEffect(() => {
    const onFilter   = (e) => setProducts([...e.detail.products]);
    const onCart     = (e) => setCartItems([...e.detail.items]);
    const onWishlist = (e) => setWishlistIds(new Set(e.detail.ids));

    window.addEventListener('products-filtered',      onFilter);
    window.addEventListener('cart-state-changed',     onCart);
    window.addEventListener('wishlist-state-changed', onWishlist);

    return () => {
      window.removeEventListener('products-filtered',      onFilter);
      window.removeEventListener('cart-state-changed',     onCart);
      window.removeEventListener('wishlist-state-changed', onWishlist);
    };
  }, []);

  if (products.length === 0) {
    return (
      <div className="products-empty">
        <svg viewBox="0 0 24 24">
          <path
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <p>No products found</p>
        <span>Try adjusting your search or filters</span>
      </div>
    );
  }

  return (
    <>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          inCart={cartItems.some(i => i.product.id === product.id)}
          inWishlist={wishlistIds.has(product.id)}
        />
      ))}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   CART DRAWER ROOT
   Subscribes to: cart-state-changed
   ────────────────────────────────────────────────────────────── */
function CartDrawerRoot() {
  const [cartState, setCartState] = React.useState(() => ({
    items:  typeof CartManager !== 'undefined' ? CartManager.getItems() : [],
    isOpen: typeof CartManager !== 'undefined' ? CartManager.getIsOpen() : false,
  }));

  React.useEffect(() => {
    const handler = (e) => setCartState({ items: e.detail.items, isOpen: e.detail.isOpen });
    window.addEventListener('cart-state-changed', handler);
    return () => window.removeEventListener('cart-state-changed', handler);
  }, []);

  const { items, isOpen } = cartState;
  const totalCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal   = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const origTotal  = items.reduce((s, i) => s + (i.product.original || i.product.price) * i.quantity, 0);
  const savingsAmt = origTotal - subtotal;

  const close = () => typeof CartManager !== 'undefined' && CartManager.close();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`cart-overlay${isOpen ? ' open' : ''}`}
        role="presentation"
        onClick={close}
      />

      {/* Drawer panel */}
      <aside
        id="cart-drawer"
        className={`cart-drawer${isOpen ? ' open' : ''}`}
        role="complementary"
        aria-label="Shopping cart"
      >
        <div className="cart-header">
          <div className="cart-header-title">
            🛒 Cart <span id="cart-header-count">{totalCount}</span>
          </div>
          <button
            id="cart-close-btn"
            className="cart-close"
            aria-label="Close cart"
            onClick={close}
          >✕</button>
        </div>

        <div id="cart-body" className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                      stroke="currentColor" strokeWidth="1.5" fill="none" />
                <line x1="3" y1="6" x2="21" y2="6"
                      stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 10a4 4 0 01-8 0"
                      stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <p>Your cart is empty</p>
              <span>Add items to get started</span>
              <button className="btn-continue-shopping" onClick={close}>
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className="cart-item" data-id={product.id}>
                <img
                  className="cart-item-img"
                  src={product.img}
                  alt={product.title}
                  loading="lazy"
                />
                <div className="cart-item-details">
                  <div className="cart-item-name">{product.title}</div>
                  <div className="cart-item-price">R{(product.price * quantity).toFixed(2)}</div>
                  <div className="cart-item-controls">
                    <button
                      className="qty-btn"
                      aria-label="Decrease quantity"
                      onClick={() => CartManager.updateQty(product.id, -1)}
                    >−</button>
                    <span className="qty-value">{quantity}</span>
                    <button
                      className="qty-btn"
                      aria-label="Increase quantity"
                      onClick={() => CartManager.updateQty(product.id, 1)}
                    >+</button>
                    <button
                      className="cart-item-remove"
                      onClick={() => CartManager.removeItem(product.id)}
                    >Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div id="cart-footer" className="cart-footer">
            <div className="cart-subtotal">
              <span className="cart-subtotal-label">
                Subtotal ({totalCount} item{totalCount !== 1 ? 's' : ''}):
              </span>
              <span className="cart-subtotal-value">R{subtotal.toFixed(2)}</span>
            </div>
            {savingsAmt > 0.01 && (
              <div className="cart-savings">You save: R{savingsAmt.toFixed(2)}</div>
            )}
            <a href="pages/checkout.html" className="btn-checkout">
              🔒 Proceed to Checkout
            </a>
            <div className="cart-disclaimer">🔒 Secure checkout</div>
          </div>
        )}
      </aside>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   RECOMMENDATIONS ROOT
   Category-similarity logic mirrors recommendations.js.
   Subscribes to: cart-state-changed, wishlist-state-changed
   ────────────────────────────────────────────────────────────── */
function RecommendationsRoot() {
  const MAX_RECS = 5;

  const [cartItems, setCartItems] = React.useState(() =>
    typeof CartManager !== 'undefined' ? CartManager.getItems() : []
  );
  const [wishlistIds, setWishlistIds] = React.useState(() =>
    typeof WishlistManager !== 'undefined'
      ? new Set(WishlistManager.getAll().map(p => p.id))
      : new Set()
  );

  React.useEffect(() => {
    const onCart     = (e) => setCartItems([...e.detail.items]);
    const onWishlist = (e) => setWishlistIds(new Set(e.detail.ids));

    window.addEventListener('cart-state-changed',     onCart);
    window.addEventListener('wishlist-state-changed', onWishlist);

    return () => {
      window.removeEventListener('cart-state-changed',     onCart);
      window.removeEventListener('wishlist-state-changed', onWishlist);
    };
  }, []);

  /* Show/hide parent section */
  const allProducts = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
  const cartIds = new Set(cartItems.map(i => i.product.id));

  let recs = [];
  if (cartItems.length > 0) {
    const categories = [...new Set(cartItems.map(i => i.product.category))];
    recs = allProducts
      .filter(p => !cartIds.has(p.id) && categories.includes(p.category))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, MAX_RECS);

    if (recs.length < MAX_RECS) {
      const extra = allProducts
        .filter(p => !cartIds.has(p.id) && !recs.find(r => r.id === p.id))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, MAX_RECS - recs.length);
      recs = [...recs, ...extra];
    }
  } else {
    recs = [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, MAX_RECS);
  }

  React.useEffect(() => {
    const section = document.getElementById('recommendations-section');
    if (section) section.style.display = recs.length > 0 ? 'block' : 'none';
  });

  if (recs.length === 0) return null;

  return (
    <>
      {recs.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          inCart={cartItems.some(i => i.product.id === product.id)}
          inWishlist={wishlistIds.has(product.id)}
        />
      ))}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   MOUNT ALL REACT ROOTS
   Safe against Babel async processing — handles both cases where
   DOMContentLoaded has already fired or hasn't yet.
   ────────────────────────────────────────────────────────────── */
function mountReactComponents() {
  const { createRoot } = ReactDOM;

  const cartEl = document.getElementById('cart-react-root');
  if (cartEl) createRoot(cartEl).render(<CartDrawerRoot />);

  const productsEl = document.getElementById('products-react-root');
  if (productsEl) createRoot(productsEl).render(<ProductGridRoot />);

  const recsEl = document.getElementById('recommendations-react-root');
  if (recsEl) createRoot(recsEl).render(<RecommendationsRoot />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountReactComponents);
} else {
  mountReactComponents();
}
