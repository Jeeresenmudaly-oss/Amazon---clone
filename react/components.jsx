/* ============================================================
   React Components — Amazon Clone
   React 18 + ReactDOM 18  |  No JSX / No Babel required
   Loaded as a plain <script src="..."> in index.html
   ============================================================ */

/* shorthand */
const _R = React.createElement;

/* ──────────────────────────────────────────────────────────────
   STAR RATING
   ────────────────────────────────────────────────────────────── */
function StarRating({ rating }) {
  return _R('div', { className: 'stars' },
    [1, 2, 3, 4, 5].map(i => {
      const diff = rating - (i - 1);
      const cls  = diff >= 1 ? 'star' : diff >= 0.5 ? 'star half' : 'star empty';
      return _R('span', { key: i, className: cls }, '★');
    })
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
    const cat  = cats.find(c => c.id === product.category);
    return cat ? cat.label : product.category;
  })();

  const handleWishlist    = () => { if (typeof WishlistManager !== 'undefined') WishlistManager.toggle(product.id); };
  const handleAddToCart   = () => { if (typeof CartManager     !== 'undefined') CartManager.addItem(product); };

  return _R('div', {
    className: 'product-card',
    'data-id':       product.id,
    'data-category': product.category,
    'data-price':    product.price,
    'data-rating':   product.rating,
  },

    product.badge && _R('span', { className: `product-badge badge-${product.badge}` }, product.badgeText),

    _R('button', {
      className:   `wishlist-btn${inWishlist ? ' wishlisted' : ''}`,
      'aria-label': inWishlist ? 'Remove from wishlist' : 'Add to wishlist',
      onClick:     handleWishlist,
    },
      _R('svg', { viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' },
        _R('path', { d: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z' })
      )
    ),

    _R('div', { className: 'product-img-wrapper' },
      _R('img', { className: 'product-img', src: product.img, alt: product.title, loading: 'lazy' })
    ),

    _R('div', { className: 'product-body' },
      _R('div', { className: 'product-category-tag' }, categoryLabel),
      _R('div', { className: 'product-title' }, product.title),

      _R('div', { className: 'product-rating' },
        _R(StarRating, { rating: product.rating }),
        _R('span', { className: 'rating-count' }, `(${product.reviews.toLocaleString()})`)
      ),

      _R('div', { className: 'product-price-row' },
        _R('span', { className: 'price-current' },
          _R('span', { className: 'price-currency' }, 'R'),
          product.price.toFixed(2)
        ),
        product.original && _R(React.Fragment, null,
          _R('span', { className: 'price-original' }, `R${product.original.toFixed(2)}`),
          _R('span', { className: 'price-discount' }, `-${discount}%`)
        )
      ),

      product.prime && _R('div', { className: 'prime-badge' }, 'Prime'),
      _R('div', { className: 'product-delivery' }, product.delivery),

      _R('button', {
        className: `btn-add-cart${inCart ? ' added' : ''}`,
        'data-id':  product.id,
        onClick:    handleAddToCart,
      }, inCart ? '✓ In Cart' : '🛒 Add to Cart')
    )
  );
}

/* ──────────────────────────────────────────────────────────────
   PRODUCT GRID ROOT
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
    const onFilter   = (ev) => setProducts([...ev.detail.products]);
    const onCart     = (ev) => setCartItems([...ev.detail.items]);
    const onWishlist = (ev) => setWishlistIds(new Set(ev.detail.ids));

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
    return _R('div', { className: 'products-empty' },
      _R('svg', { viewBox: '0 0 24 24' },
        _R('path', {
          d: 'M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          stroke: 'currentColor', strokeWidth: '2', fill: 'none',
        })
      ),
      _R('p',    null, 'No products found'),
      _R('span', null, 'Try adjusting your search or filters')
    );
  }

  return _R(React.Fragment, null,
    products.map(product =>
      _R(ProductCard, {
        key:        product.id,
        product,
        inCart:     cartItems.some(i => i.product.id === product.id),
        inWishlist: wishlistIds.has(product.id),
      })
    )
  );
}

/* ──────────────────────────────────────────────────────────────
   CART DRAWER ROOT
   Subscribes to: cart-state-changed
   ────────────────────────────────────────────────────────────── */
function CartDrawerRoot() {
  const [cartState, setCartState] = React.useState(() => ({
    items:  typeof CartManager !== 'undefined' ? CartManager.getItems()  : [],
    isOpen: typeof CartManager !== 'undefined' ? CartManager.getIsOpen() : false,
  }));

  React.useEffect(() => {
    const handler = (ev) => setCartState({ items: ev.detail.items, isOpen: ev.detail.isOpen });
    window.addEventListener('cart-state-changed', handler);
    return () => window.removeEventListener('cart-state-changed', handler);
  }, []);

  const { items, isOpen } = cartState;
  const totalCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal   = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const origTotal  = items.reduce((s, i) => s + (i.product.original || i.product.price) * i.quantity, 0);
  const savingsAmt = origTotal - subtotal;

  const close = () => typeof CartManager !== 'undefined' && CartManager.close();

  return _R(React.Fragment, null,

    /* Backdrop */
    _R('div', {
      className: `cart-overlay${isOpen ? ' open' : ''}`,
      role: 'presentation',
      onClick: close,
    }),

    /* Drawer panel */
    _R('aside', {
      id: 'cart-drawer',
      className: `cart-drawer${isOpen ? ' open' : ''}`,
      role: 'complementary',
      'aria-label': 'Shopping cart',
    },
      _R('div', { className: 'cart-header' },
        _R('div', { className: 'cart-header-title' }, '🛒 Cart ',
          _R('span', { id: 'cart-header-count' }, totalCount)
        ),
        _R('button', {
          id: 'cart-close-btn', className: 'cart-close',
          'aria-label': 'Close cart', onClick: close,
        }, '✕')
      ),

      _R('div', { id: 'cart-body', className: 'cart-body' },
        items.length === 0
          ? _R('div', { className: 'cart-empty' },
              _R('svg', { viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' },
                _R('path', { d: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z', stroke: 'currentColor', strokeWidth: '1.5', fill: 'none' }),
                _R('line', { x1: '3', y1: '6', x2: '21', y2: '6', stroke: 'currentColor', strokeWidth: '1.5' }),
                _R('path', { d: 'M16 10a4 4 0 01-8 0', stroke: 'currentColor', strokeWidth: '1.5', fill: 'none' })
              ),
              _R('p',      null, 'Your cart is empty'),
              _R('span',   null, 'Add items to get started'),
              _R('button', { className: 'btn-continue-shopping', onClick: close }, 'Continue Shopping')
            )
          : items.map(({ product, quantity }) =>
              _R('div', { key: product.id, className: 'cart-item', 'data-id': product.id },
                _R('img', { className: 'cart-item-img', src: product.img, alt: product.title, loading: 'lazy' }),
                _R('div', { className: 'cart-item-details' },
                  _R('div', { className: 'cart-item-name' },  product.title),
                  _R('div', { className: 'cart-item-price' }, `R${(product.price * quantity).toFixed(2)}`),
                  _R('div', { className: 'cart-item-controls' },
                    _R('button', { className: 'qty-btn', 'aria-label': 'Decrease quantity', onClick: () => CartManager.updateQty(product.id, -1) }, '−'),
                    _R('span',   { className: 'qty-value' }, quantity),
                    _R('button', { className: 'qty-btn', 'aria-label': 'Increase quantity', onClick: () => CartManager.updateQty(product.id,  1) }, '+'),
                    _R('button', { className: 'cart-item-remove', onClick: () => CartManager.removeItem(product.id) }, 'Remove')
                  )
                )
              )
            )
      ),

      items.length > 0 && _R('div', { id: 'cart-footer', className: 'cart-footer' },
        _R('div', { className: 'cart-subtotal' },
          _R('span', { className: 'cart-subtotal-label' }, `Subtotal (${totalCount} item${totalCount !== 1 ? 's' : ''}):`),
          _R('span', { className: 'cart-subtotal-value' }, `R${subtotal.toFixed(2)}`)
        ),
        savingsAmt > 0.01 && _R('div', { className: 'cart-savings' }, `You save: R${savingsAmt.toFixed(2)}`),
        _R('a',   { href: 'pages/checkout.html', className: 'btn-checkout' }, '🔒 Proceed to Checkout'),
        _R('div', { className: 'cart-disclaimer' }, '🔒 Secure checkout')
      )
    )
  );
}

/* ──────────────────────────────────────────────────────────────
   RECOMMENDATIONS ROOT
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
    const onCart     = (ev) => setCartItems([...ev.detail.items]);
    const onWishlist = (ev) => setWishlistIds(new Set(ev.detail.ids));

    window.addEventListener('cart-state-changed',     onCart);
    window.addEventListener('wishlist-state-changed', onWishlist);

    return () => {
      window.removeEventListener('cart-state-changed',     onCart);
      window.removeEventListener('wishlist-state-changed', onWishlist);
    };
  }, []);

  const allProducts = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
  const cartIds     = new Set(cartItems.map(i => i.product.id));

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

  return _R(React.Fragment, null,
    recs.map(product =>
      _R(ProductCard, {
        key:        product.id,
        product,
        inCart:     cartItems.some(i => i.product.id === product.id),
        inWishlist: wishlistIds.has(product.id),
      })
    )
  );
}

/* ──────────────────────────────────────────────────────────────
   MOUNT ALL REACT ROOTS
   ────────────────────────────────────────────────────────────── */
function mountReactComponents() {
  const { createRoot } = ReactDOM;

  const cartEl = document.getElementById('cart-react-root');
  if (cartEl) createRoot(cartEl).render(_R(CartDrawerRoot, null));

  const productsEl = document.getElementById('products-react-root');
  if (productsEl) createRoot(productsEl).render(_R(ProductGridRoot, null));

  const recsEl = document.getElementById('recommendations-react-root');
  if (recsEl) createRoot(recsEl).render(_R(RecommendationsRoot, null));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountReactComponents);
} else {
  mountReactComponents();
}
