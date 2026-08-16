// Helper to get cart array from localStorage
function getCart() {
  try {
    const raw = localStorage.getItem('moodkCart');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading moodkCart:', e);
    return [];
  }
}

// Helper to save cart array to localStorage
function saveCart(cart) {
  try {
    localStorage.setItem('moodkCart', JSON.stringify(cart));
    updateCartBadge();
  } catch (e) {
    console.error('Error saving moodkCart:', e);
  }
}

// Calculate total item quantity in cart
function getCartTotalCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (parseInt(item.quantity, 10) || 1), 0);
}

// Update live cart badge in navbar across pages
function updateCartBadge() {
  const count = getCartTotalCount();
  const badges = document.querySelectorAll('.cart-badge, #nav-cart-count');
  badges.forEach(badge => {
    badge.textContent = count;
    if (count > 0) {
      badge.classList.add('has-items');
    } else {
      badge.classList.remove('has-items');
    }
  });
}

// Add item to cart (merging same product id, color, size if present)
function addToCart(newItem) {
  const cart = getCart();
  const existingIndex = cart.findIndex(item =>
    item.id === newItem.id &&
    (item.color || '') === (newItem.color || '') &&
    (item.size || '') === (newItem.size || '')
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity = (parseInt(cart[existingIndex].quantity, 10) || 1) + (parseInt(newItem.quantity, 10) || 1);
  } else {
    cart.push({
      id: newItem.id,
      name: newItem.name,
      price: newItem.price,
      currency: newItem.currency || 'EGP',
      image: newItem.image,
      color: newItem.color || '',
      colorName: newItem.colorName || '',
      size: newItem.size || '',
      quantity: parseInt(newItem.quantity, 10) || 1
    });
  }

  saveCart(cart);
}

// Remove item from cart by index
function removeFromCart(index) {
  const cart = getCart();
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    saveCart(cart);
  }
}

// Update quantity for item at index
function updateCartQuantity(index, quantity) {
  const cart = getCart();
  if (index >= 0 && index < cart.length) {
    const qty = parseInt(quantity, 10);
    if (qty <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = qty;
    }
    saveCart(cart);
  }
}

// Check and process pending cart item saved before login
function processPendingCartItem() {
  try {
    const pendingRaw = localStorage.getItem('moodkPendingCartItem');
    if (!pendingRaw) return false;

    const pending = JSON.parse(pendingRaw);
    if (!pending || !pending.id) return false;

    // Find product details from window.PRODUCTS if available
    let product = null;
    if (window.PRODUCTS && Array.isArray(window.PRODUCTS)) {
      product = window.PRODUCTS.find(p => p.id === pending.id);
    }

    const itemToAdd = {
      id: pending.id,
      name: pending.name || (product ? product.name : 'Product'),
      price: pending.price || (product ? product.price : 0),
      currency: pending.currency || (product ? product.currency : 'EGP'),
      image: pending.image || (product ? (product.image || product.frontImage) : ''),
      color: pending.color || '',
      colorName: pending.colorName || '',
      size: pending.size || '',
      quantity: parseInt(pending.quantity, 10) || 1
    };

    addToCart(itemToAdd);
    localStorage.removeItem('moodkPendingCartItem');
    return true;
  } catch (e) {
    console.error('Error processing pending cart item:', e);
    return false;
  }
}

// Initialize navbar cart links and badge on DOM load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  // Make cart icon clickable to navigate to cart page
  const cartIcons = document.querySelectorAll('.fa-cart-shopping');
  const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');
  const cartUrl = isInsidePages ? 'cart.html' : 'pages/cart.html';

  cartIcons.forEach(icon => {
    icon.style.cursor = 'pointer';
    const parentLink = icon.closest('a');
    if (parentLink) {
      parentLink.href = cartUrl;
    } else {
      icon.onclick = (e) => {
        e.preventDefault();
        window.location.href = cartUrl;
      };
    }
  });

  // If on cart page, initialize cart renderer
  if (document.getElementById('moodk-cart-page')) {
    initCartPage();
  }
});

// CART PAGE RENDERING & INTERACTIVITY
function initCartPage() {
  const container = document.getElementById('moodk-cart-page');
  if (!container) return;

  renderCartItems();
}

function renderCartItems() {
  const cartList = document.getElementById('cart-items-list');
  const summaryBox = document.getElementById('cart-summary-box');
  const emptyState = document.getElementById('cart-empty-state');
  const totalCountEl = document.getElementById('cart-total-count');
  const subtotalEl = document.getElementById('cart-subtotal');
  const grandTotalEl = document.getElementById('cart-grand-total');

  if (!cartList) return;

  const cart = getCart();
  const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');
  const menPageUrl = isInsidePages ? 'men.html' : 'pages/men.html';

  if (totalCountEl) {
    const totalQty = getCartTotalCount();
    totalCountEl.textContent = `${totalQty} ITEM${totalQty === 1 ? '' : 'S'}`;
  }

  if (cart.length === 0) {
    cartList.style.display = 'none';
    if (summaryBox) summaryBox.style.display = 'none';
    if (emptyState) {
      emptyState.style.display = 'flex';
      emptyState.innerHTML = `
        <div class="cart-empty__icon"><i class="fa-solid fa-bag-shopping"></i></div>
        <h2 class="cart-empty__title">YOUR BASKET IS EMPTY</h2>
              `;
    }
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  cartList.style.display = 'flex';
  if (summaryBox) summaryBox.style.display = 'block';

  let subtotal = 0;

  cartList.innerHTML = cart.map((item, index) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    const currency = item.currency || 'EGP';

    // Handle image path relative to current page location
    let imgSrc = item.image || '';
    if (isInsidePages && imgSrc.startsWith('assets/')) {
      imgSrc = '../' + imgSrc;
    } else if (!isInsidePages && imgSrc.startsWith('../assets/')) {
      imgSrc = imgSrc.replace('../assets/', 'assets/');
    }

    const colorDotHtml = item.color
      ? `<span class="cart-item__color-dot" style="background-color: ${item.color};"></span>`
      : '';

    return `
      <div class="cart-item" data-index="${index}">
        <div class="cart-item__img-wrap">
          <img src="${imgSrc}" alt="${item.name}" class="cart-item__img">
        </div>
        <div class="cart-item__details">
          <h3 class="cart-item__name">${item.name}</h3>
          <div class="cart-item__meta">
            ${item.size ? `<span class="cart-item__meta-badge">Size: <strong>${item.size}</strong></span>` : ''}
            ${item.color ? `<span class="cart-item__meta-badge">Color: ${colorDotHtml} <strong>${item.colorName || item.color}</strong></span>` : ''}
          </div>
          <div class="cart-item__price">${currency} ${item.price.toLocaleString()}</div>
        </div>
        <div class="cart-item__actions">
          <div class="cart-item__quantity">
            <button type="button" class="cart-qty-btn decrease-qty" data-index="${index}">-</button>
            <span class="cart-qty-val">${item.quantity}</span>
            <button type="button" class="cart-qty-btn increase-qty" data-index="${index}">+</button>
          </div>
          <div class="cart-item__total">${currency} ${itemTotal.toLocaleString()}</div>
          <button type="button" class="cart-item__remove-btn" data-index="${index}" title="Remove item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  const currency = cart[0]?.currency || 'EGP';
  if (subtotalEl) subtotalEl.textContent = `${currency} ${subtotal.toLocaleString()}`;
  if (grandTotalEl) grandTotalEl.textContent = `${currency} ${subtotal.toLocaleString()}`;

  // Enable and connect Proceed to Checkout button
  const checkoutBtn = document.getElementById('cart-checkout-btn') || document.querySelector('.cart-summary__checkout-btn');
  if (checkoutBtn) {
    if (cart.length > 0) {
      checkoutBtn.removeAttribute('disabled');
      checkoutBtn.onclick = (e) => {
        e.preventDefault();
        window.location.href = isInsidePages ? 'checkout.html' : 'pages/checkout.html';
      };
    } else {
      checkoutBtn.setAttribute('disabled', 'true');
      checkoutBtn.onclick = null;
    }
  }

  // Attach event listeners for quantity buttons & delete
  document.querySelectorAll('.increase-qty').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const cart = getCart();
      updateCartQuantity(idx, cart[idx].quantity + 1);
      renderCartItems();
    });
  });

  document.querySelectorAll('.decrease-qty').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const cart = getCart();
      if (cart[idx].quantity > 1) {
        updateCartQuantity(idx, cart[idx].quantity - 1);
      } else {
        removeFromCart(idx);
      }
      renderCartItems();
    });
  });

  document.querySelectorAll('.cart-item__remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      removeFromCart(idx);
      renderCartItems();
    });
  });
}

// Export functions to global scope
window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.getCartTotalCount = getCartTotalCount;
window.updateCartBadge = updateCartBadge;
window.processPendingCartItem = processPendingCartItem;
