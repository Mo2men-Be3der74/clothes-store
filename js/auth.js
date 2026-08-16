document.addEventListener('DOMContentLoaded', () => {
  initPasswordEyeToggles();
  initNavbarProfileLinks();
  initRegisterForm();
  initLoginForm();
  initProfilePage();
});

// 1. Password Visibility Eye Toggle Functionality
function initPasswordEyeToggles() {
  document.querySelectorAll('.auth-eye-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (!input || !icon) return;

      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-regular fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fa-regular fa-eye';
      }
    });
  });
}

// Helper: Check if user is logged in
function isUserLoggedIn() {
  try {
    const rawAuth = localStorage.getItem('moodkAuth');
    if (rawAuth) {
      const auth = JSON.parse(rawAuth);
      if (auth && auth.isLoggedIn === true) return true;
    }
    const rawUser = localStorage.getItem('moodkUser');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user && user.isLoggedIn === true) return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// 2. Connect Navbar Profile Icon on Main Pages
function initNavbarProfileLinks() {
  const profileIcons = document.querySelectorAll('.fa-circle-user');
  if (!profileIcons.length) return;

  const loggedIn = isUserLoggedIn();
  const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');
  const loginUrl = isInsidePages ? 'login.html' : 'pages/login.html';
  const profileUrl = isInsidePages ? 'profile.html' : 'pages/profile.html';

  profileIcons.forEach(icon => {
    icon.style.cursor = 'pointer';

    const parentLink = icon.closest('a');
    if (parentLink) {
      parentLink.href = loggedIn ? profileUrl : loginUrl;
    }

    icon.onclick = (e) => {
      e.preventDefault();
      window.location.href = loggedIn ? profileUrl : loginUrl;
    };
  });
}

// 3. Profile / My Account Page Rendering, Orders History & Modal Management
function initProfilePage() {
  const profileView = document.getElementById('moodk-profile-view');
  if (!profileView) return;

  const loggedIn = isUserLoggedIn();
  if (!loggedIn) {
    const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');
    window.location.href = isInsidePages ? 'login.html' : 'pages/login.html';
    return;
  }

  // Populate dynamic user data
  let user = null;
  try {
    const rawUser = localStorage.getItem('moodkUser');
    if (rawUser) user = JSON.parse(rawUser);
  } catch (e) {}

  const name = (user && user.name) ? user.name.trim() : 'Member';
  const email = (user && user.email) ? user.email.trim() : 'member@example.com';
  const firstInitial = name.charAt(0).toUpperCase() || 'M';

  const avatarEl = document.getElementById('profile-avatar');
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');

  if (avatarEl) avatarEl.textContent = firstInitial;
  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;

  // Initialize My Orders Section & View Transitions
  initMyOrdersSection(user);
}

// 4. MY ORDERS SECTION LOGIC
function initMyOrdersSection(currentUser) {
  const viewAccount = document.getElementById('profile-view-account');
  const viewOrders = document.getElementById('profile-view-orders');
  const btnMenuOrders = document.getElementById('menu-btn-orders');
  const btnBackToAccount = document.getElementById('orders-back-to-account');
  const ordersListContainer = document.getElementById('orders-cards-list');
  const emptyStateContainer = document.getElementById('orders-empty-state');

  // Modal elements
  const modalBackdrop = document.getElementById('order-modal-backdrop');
  const modalCloseBtn = document.getElementById('order-modal-close-btn');
  const modalCloseFooter = document.getElementById('order-modal-close-footer');
  const modalInvoiceBtn = document.getElementById('modal-view-invoice-btn');

  if (!viewAccount || !viewOrders) return;

  // Helper: Switch to Orders View
  function showOrdersView() {
    viewAccount.style.display = 'none';
    viewOrders.style.display = 'block';
    renderOrders();
    // Smooth scroll to top of section
    viewOrders.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Helper: Switch to Account View
  function showAccountView() {
    viewOrders.style.display = 'none';
    viewAccount.style.display = 'block';
    if (window.location.hash === '#orders') {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }

  // Bind Switch Events
  btnMenuOrders?.addEventListener('click', (e) => {
    e.preventDefault();
    showOrdersView();
  });

  btnBackToAccount?.addEventListener('click', (e) => {
    e.preventDefault();
    showAccountView();
  });

  // Check URL hash or query params on load (e.g. profile.html#orders or ?tab=orders)
  const urlParams = new URLSearchParams(window.location.search);
  if (window.location.hash === '#orders' || urlParams.get('tab') === 'orders') {
    showOrdersView();
  }

  // Helper: Retrieve all orders belonging to current user
  function getUserOrders() {
    let allOrders = [];
    try {
      const raw = localStorage.getItem('moodkOrders');
      if (raw) {
        allOrders = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading moodkOrders:', e);
    }

    // Also check moodkLatestOrder in case it was stored independently
    try {
      const rawLatest = localStorage.getItem('moodkLatestOrder');
      if (rawLatest) {
        const latestObj = JSON.parse(rawLatest);
        if (latestObj && latestObj.id && !allOrders.some(o => o.id === latestObj.id)) {
          allOrders.unshift(latestObj);
        }
      }
    } catch (e) {}

    // Filter by logged-in user email if available
    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    let filteredOrders = allOrders;

    if (userEmail) {
      filteredOrders = allOrders.filter(o => {
        if (!o) return false;
        const orderEmail = (o.userEmail || o.customer?.email || '').toLowerCase().trim();
        // If order has no tagged email, include it for the single demo user session
        if (!orderEmail) return true;
        return orderEmail === userEmail;
      });
    }

    // Sort by timestamp or date descending (newest first)
    filteredOrders.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.date).getTime() || 0;
      const timeB = new Date(b.timestamp || b.date).getTime() || 0;
      return timeB - timeA;
    });

    return filteredOrders;
  }

  const ONE_HOUR_MS = 60 * 60 * 1000;

  // Helper: Format milliseconds into MM:SS
  function formatCountdownTimer(ms) {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // Cancel Confirmation Modal State & Elements
  let orderIdPendingCancel = null;
  const cancelModal = document.getElementById('cancel-order-modal');
  const cancelModalIdEl = document.getElementById('cancel-dialog-order-id');
  const cancelConfirmBtn = document.getElementById('cancel-dialog-confirm-btn');
  const cancelKeepBtn = document.getElementById('cancel-dialog-keep-btn');

  function openCancelModal(orderId) {
    orderIdPendingCancel = orderId;
    if (cancelModalIdEl) cancelModalIdEl.textContent = `#${orderId}`;
    if (cancelModal) cancelModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeCancelModal() {
    orderIdPendingCancel = null;
    if (cancelModal) cancelModal.style.display = 'none';
    if (!modalBackdrop || modalBackdrop.style.display === 'none') {
      document.body.style.overflow = '';
    }
  }

  // Bind Cancel Modal Events
  cancelKeepBtn?.addEventListener('click', closeCancelModal);
  cancelConfirmBtn?.addEventListener('click', () => {
    if (orderIdPendingCancel) {
      cancelOrderById(orderIdPendingCancel);
    }
  });

  cancelModal?.addEventListener('click', (e) => {
    if (e.target === cancelModal) {
      closeCancelModal();
    }
  });

  // Execute Order Cancellation
  function cancelOrderById(orderId) {
    if (!orderId) return;
    try {
      // 1. Update in moodkOrders array
      let allOrders = [];
      const raw = localStorage.getItem('moodkOrders');
      if (raw) allOrders = JSON.parse(raw);

      const idx = allOrders.findIndex(o => o && o.id === orderId);
      if (idx !== -1) {
        allOrders[idx].orderStatus = 'CANCELLED';
        allOrders[idx].status = 'CANCELLED';
        allOrders[idx].cancelledAt = Date.now();
        localStorage.setItem('moodkOrders', JSON.stringify(allOrders));
      }

      // 2. Update in moodkLatestOrder if it matches
      const rawLatest = localStorage.getItem('moodkLatestOrder');
      if (rawLatest) {
        const latest = JSON.parse(rawLatest);
        if (latest && latest.id === orderId) {
          latest.orderStatus = 'CANCELLED';
          latest.status = 'CANCELLED';
          latest.cancelledAt = Date.now();
          localStorage.setItem('moodkLatestOrder', JSON.stringify(latest));
        }
      }

      // 3. Re-render UI list
      renderOrders();
      closeCancelModal();

      // 4. Update order details modal if currently open
      if (modalBackdrop && modalBackdrop.style.display !== 'none') {
        const updatedOrder = allOrders.find(o => o && o.id === orderId);
        if (updatedOrder) {
          openOrderDetailsModal(updatedOrder);
        }
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  }

  // Helper: Render Order Cards into Container
  function renderOrders() {
    const orders = getUserOrders();
    const countBadge = document.getElementById('orders-total-count');

    if (countBadge) {
      const count = orders ? orders.length : 0;
      countBadge.textContent = `${count} ORDER${count === 1 ? '' : 'S'}`;
    }

    if (!orders || orders.length === 0) {
      if (emptyStateContainer) emptyStateContainer.style.display = 'flex';
      if (ordersListContainer) {
        ordersListContainer.style.display = 'none';
        ordersListContainer.innerHTML = '';
      }
      return;
    }

    if (emptyStateContainer) emptyStateContainer.style.display = 'none';
    if (ordersListContainer) {
      ordersListContainer.style.display = 'flex';

      const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');

      ordersListContainer.innerHTML = orders.map(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        let totalItemsCount = 0;
        items.forEach(item => {
          totalItemsCount += (parseInt(item.quantity, 10) || 1);
        });

        const currency = order.currency || 'EGP';
        const totalAmount = order.total || order.subtotal || 0;
        const formattedTotal = `${currency} ${totalAmount.toLocaleString()}`;
        const paymentMethod = order.payment?.method || (order.payment?.cardLast4 ? `Visa •••• ${order.payment.cardLast4}` : 'Paid — Demo');

        // Check cancellation validity based on createdAt timestamp
        let orderCreatedAt = order.createdAt;
        if (!orderCreatedAt && order.timestamp) {
          const parsed = new Date(order.timestamp).getTime();
          if (!isNaN(parsed) && parsed > 0) {
            orderCreatedAt = parsed;
          }
        }
        orderCreatedAt = Number(orderCreatedAt) || 0;

        const isCancelled = (order.orderStatus || order.status || '').toUpperCase() === 'CANCELLED';
        const elapsedTime = Date.now() - orderCreatedAt;
        const timeRemaining = (orderCreatedAt + ONE_HOUR_MS) - Date.now();
        const canCancel = !isCancelled && orderCreatedAt > 0 && elapsedTime < ONE_HOUR_MS && timeRemaining > 0;

        // Render clean Header status pill & countdown
        let headerPillHtml = '';
        let footerStatusHtml = '';

        if (isCancelled) {
          headerPillHtml = `<span class="order-pill order-pill--cancelled">CANCELLED</span>`;
          footerStatusHtml = `<span class="order-meta-chip"><i class="fa-regular fa-circle-xmark" style="color: #DC2626;"></i>Status: <strong style="color: #DC2626;">CANCELLED</strong></span>`;
        } else {
          const countdownHtml = canCancel 
            ? `<span class="order-cancel-countdown" data-countdown-created="${orderCreatedAt}"><i class="fa-regular fa-clock"></i><span>Cancel available for <strong class="timer-countdown-val">${formatCountdownTimer(timeRemaining)}</strong></span></span>` 
            : '';
          headerPillHtml = `${countdownHtml}<span class="order-pill order-pill--status">CONFIRMED</span>`;
          footerStatusHtml = `<span class="order-meta-chip"><i class="fa-regular fa-circle-check"></i>Status: <strong>CONFIRMED</strong></span>`;
        }

        // Render product preview thumbnails (up to 3 items)
        const previewItems = items.slice(0, 3);
        const remainingCount = items.length - previewItems.length;

        const previewsHtml = previewItems.map(item => {
          let imgSrc = item.image || '';
          if (isInsidePages && imgSrc.startsWith('assets/')) {
            imgSrc = '../' + imgSrc;
          } else if (!isInsidePages && imgSrc.startsWith('../assets/')) {
            imgSrc = imgSrc.replace('../assets/', 'assets/');
          }

          const qty = parseInt(item.quantity, 10) || 1;

          return `
            <div class="order-preview__item">
              <img src="${imgSrc}" alt="${item.name || 'Product'}" class="order-preview__img">
              <div class="order-preview__info">
                <span class="order-preview__name">${item.name || 'Product'}</span>
                <span class="order-preview__qty">Qty: ${qty}</span>
              </div>
            </div>
          `;
        }).join('');

        const moreBadgeHtml = remainingCount > 0 
          ? `<span class="order-preview__more">+${remainingCount} more item${remainingCount > 1 ? 's' : ''}</span>` 
          : '';

        // Footer Action Buttons (Cancel Order + View Order)
        let actionsHtml = '';
        if (canCancel) {
          actionsHtml = `
            <div class="order-card__actions-group">
              <button type="button" class="order-card__cancel-btn" data-action="cancel-order" data-id="${order.id}">
                <i class="fa-regular fa-circle-xmark"></i>
                <span>CANCEL ORDER</span>
              </button>
              <button type="button" class="order-card__view-btn" data-action="view-order" data-id="${order.id}">
                <span>VIEW ORDER</span>
                <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          `;
        } else {
          actionsHtml = `
            <div class="order-card__actions-group">
              <button type="button" class="order-card__view-btn" data-action="view-order" data-id="${order.id}">
                <span>VIEW ORDER</span>
                <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          `;
        }

        return `
          <article class="order-card" data-order-id="${order.id}">
            
            <!-- Order Header -->
            <div class="order-card__header">
              <div class="order-card__id-group">
                <span class="order-card__id">#${order.id}</span>
                <span class="order-card__date">${order.date || 'Recent Order'}</span>
              </div>
              <div class="order-card__pills">
                ${headerPillHtml}
              </div>
            </div>

            <div class="order-card__divider"></div>

            <!-- Order Products Preview -->
            <div class="order-card__products-preview">
              <div class="order-preview__thumbnails">
                ${previewsHtml}
                ${moreBadgeHtml}
              </div>
            </div>

            <div class="order-card__divider"></div>

            <!-- Order Info & Action Buttons -->
            <div class="order-card__footer">
              <div class="order-card__meta-summary">
                <div class="order-meta-chip">
                  <i class="fa-solid fa-bag-shopping"></i>
                  <span>${totalItemsCount} Item${totalItemsCount === 1 ? '' : 's'}</span>
                </div>
                <div class="order-meta-chip">
                  <i class="fa-solid fa-receipt"></i>
                  <span>Total: <strong>${formattedTotal}</strong></span>
                </div>
                <div class="order-meta-chip">
                  <i class="fa-regular fa-credit-card"></i>
                  <span>${paymentMethod}</span>
                </div>
                ${footerStatusHtml}
              </div>

              ${actionsHtml}
            </div>

          </article>
        `;
      }).join('');

      // Attach event listeners to all VIEW ORDER buttons
      ordersListContainer.querySelectorAll('[data-action="view-order"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.getAttribute('data-id');
          const allOrders = getUserOrders();
          const targetOrder = allOrders.find(o => o.id === orderId);
          if (targetOrder) {
            openOrderDetailsModal(targetOrder);
          }
        });
      });

      // Attach event listeners to all CANCEL ORDER buttons
      ordersListContainer.querySelectorAll('[data-action="cancel-order"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.getAttribute('data-id');
          openCancelModal(orderId);
        });
      });
    }

    // Refresh live countdown ticker interval
    if (window.orderCountdownInterval) {
      clearInterval(window.orderCountdownInterval);
    }
    window.orderCountdownInterval = setInterval(() => {
      const countdownElements = document.querySelectorAll('.order-cancel-countdown');
      if (!countdownElements || countdownElements.length === 0) return;

      let hasExpired = false;
      countdownElements.forEach(el => {
        const createdAt = parseInt(el.getAttribute('data-countdown-created'), 10) || 0;
        const remaining = (createdAt + ONE_HOUR_MS) - Date.now();
        const timerTextEl = el.querySelector('.timer-countdown-val');
        if (timerTextEl) {
          if (remaining > 0) {
            timerTextEl.textContent = formatCountdownTimer(remaining);
          } else {
            hasExpired = true;
          }
        }
      });

      if (hasExpired) {
        renderOrders(); // Auto-locks expired orders & updates UI dynamically!
      }
    }, 1000);
  }

  // Helper: Open Order Details Modal
  function openOrderDetailsModal(order) {
    if (!modalBackdrop) return;

    const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');
    const currency = order.currency || 'EGP';

    // Populate Order Title & Dates
    const idEl = document.getElementById('modal-order-id-title');
    const dateEl = document.getElementById('modal-order-date');
    const payStatusEl = document.getElementById('modal-payment-status');
    const orderStatusEl = document.getElementById('modal-order-status');

    if (idEl) idEl.textContent = `#${order.id}`;
    if (dateEl) dateEl.textContent = order.date || 'Recent';
    if (payStatusEl) payStatusEl.textContent = (order.payment?.status || 'Paid — Demo');
    
    const isCancelled = (order.orderStatus || order.status || '').toUpperCase() === 'CANCELLED';
    if (orderStatusEl) {
      if (isCancelled) {
        orderStatusEl.textContent = 'CANCELLED';
        orderStatusEl.className = 'order-status-pill pill--cancelled';
      } else {
        orderStatusEl.textContent = 'CONFIRMED';
        orderStatusEl.className = 'order-status-pill pill--confirmed';
      }
    }

    // Customer Information
    const cust = order.customer || {};
    const custNameEl = document.getElementById('modal-cust-name');
    const custEmailEl = document.getElementById('modal-cust-email');
    const custPhoneEl = document.getElementById('modal-cust-phone');

    if (custNameEl) custNameEl.textContent = cust.name || 'Valued Customer';
    if (custEmailEl) custEmailEl.textContent = cust.email || '';
    if (custPhoneEl) custPhoneEl.textContent = cust.phone || '';

    // Shipping Address
    const addr = order.shippingAddress || {};
    const shipAddrEl = document.getElementById('modal-ship-address');
    const shipAptEl = document.getElementById('modal-ship-apt');
    const shipCityEl = document.getElementById('modal-ship-city');

    if (shipAddrEl) shipAddrEl.textContent = addr.address || 'Street Address';
    if (shipAptEl) {
      if (addr.apartment) {
        shipAptEl.textContent = addr.apartment;
        shipAptEl.style.display = 'block';
      } else {
        shipAptEl.style.display = 'none';
      }
    }
    if (shipCityEl) {
      shipCityEl.textContent = `${addr.city || ''}${addr.governorate ? ', ' + addr.governorate : ''}, Egypt`;
    }

    // Products List
    const productsListEl = document.getElementById('modal-products-list');
    if (productsListEl && Array.isArray(order.items)) {
      productsListEl.innerHTML = order.items.map(item => {
        let imgSrc = item.image || '';
        if (isInsidePages && imgSrc.startsWith('assets/')) {
          imgSrc = '../' + imgSrc;
        } else if (!isInsidePages && imgSrc.startsWith('../assets/')) {
          imgSrc = imgSrc.replace('../assets/', 'assets/');
        }

        const qty = parseInt(item.quantity, 10) || 1;
        const unitPrice = item.price || 0;
        const lineTotal = unitPrice * qty;

        const colorDot = item.color 
          ? `<span class="modal-color-dot" style="background-color: ${item.color};"></span>`
          : '';

        return `
          <div class="modal-product-row">
            <img src="${imgSrc}" alt="${item.name}" class="modal-product-img">
            <div class="modal-product-info">
              <h5>${item.name}</h5>
              <div class="modal-product-meta">
                ${item.size ? `<span>Size: <strong>${item.size}</strong></span>` : ''}
                ${(item.color || item.colorName) ? `<span>${colorDot} <strong>${item.colorName || item.color}</strong></span>` : ''}
              </div>
            </div>
            <div class="modal-product-qty">${qty} x ${currency} ${unitPrice.toLocaleString()}</div>
            <div class="modal-product-price">${currency} ${lineTotal.toLocaleString()}</div>
          </div>
        `;
      }).join('');
    }

    // Calculations
    const subtotal = order.subtotal || order.total || 0;
    const total = order.total || subtotal;
    const calcSubtotalEl = document.getElementById('modal-calc-subtotal');
    const calcTotalEl = document.getElementById('modal-calc-total');

    if (calcSubtotalEl) calcSubtotalEl.textContent = `${currency} ${subtotal.toLocaleString()}`;
    if (calcTotalEl) calcTotalEl.textContent = `${currency} ${total.toLocaleString()}`;

    // Payment Info
    const payMethodEl = document.getElementById('modal-payment-method');
    if (payMethodEl) {
      payMethodEl.textContent = order.payment?.method || (order.payment?.cardLast4 ? `Visa •••• ${order.payment.cardLast4}` : 'Credit / Debit Card');
    }

    // View Invoice Action Button Link
    if (modalInvoiceBtn) {
      const invoiceUrl = isInsidePages 
        ? `invoice.html?order=${encodeURIComponent(order.id)}` 
        : `pages/invoice.html?order=${encodeURIComponent(order.id)}`;
      modalInvoiceBtn.href = invoiceUrl;
    }

    // Show Modal
    modalBackdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // Helper: Close Modal
  function closeModal() {
    if (modalBackdrop) {
      modalBackdrop.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // Modal Close Handlers
  modalCloseBtn?.addEventListener('click', closeModal);
  modalCloseFooter?.addEventListener('click', closeModal);
  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (cancelModal && cancelModal.style.display !== 'none') {
        closeCancelModal();
      } else if (modalBackdrop && modalBackdrop.style.display !== 'none') {
        closeModal();
      }
    }
  });
}

// 5. Global Logout Handler
function logoutUser() {
  // Update moodkAuth & moodkUser logged-in state without deleting user account data
  try {
    const rawAuth = localStorage.getItem('moodkAuth');
    if (rawAuth) {
      const auth = JSON.parse(rawAuth);
      auth.isLoggedIn = false;
      localStorage.setItem('moodkAuth', JSON.stringify(auth));
    }
  } catch (e) {}

  try {
    const rawUser = localStorage.getItem('moodkUser');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      user.isLoggedIn = false;
      localStorage.setItem('moodkUser', JSON.stringify(user));
    }
  } catch (e) {}

  const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');
  window.location.href = isInsidePages ? '../index.html' : 'index.html';
}

window.logoutUser = logoutUser;

// Helper: Email Format Validator
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Field & Form Alert Helpers
function showFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const errBox = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (errBox) {
    errBox.textContent = message;
    errBox.classList.add('active');
  }
}

function clearFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const errBox = document.getElementById(errorId);
  if (input) input.classList.remove('error');
  if (errBox) {
    errBox.textContent = '';
    errBox.classList.remove('active');
  }
}

function showFormAlert(alertId, htmlContent) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.innerHTML = htmlContent;
    alert.classList.add('active');
  }
}

function clearFormAlert(alertId) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.innerHTML = '';
    alert.classList.remove('active');
  }
}

// 3. CREATE ACCOUNT (REGISTRATION) FORM
function initRegisterForm() {
  const form = document.getElementById('moodk-register-form');
  if (!form) return;

  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const confirmInput = document.getElementById('reg-confirm');

  nameInput?.addEventListener('input', () => clearFieldError('reg-name', 'reg-name-error'));
  emailInput?.addEventListener('input', () => clearFieldError('reg-email', 'reg-email-error'));
  passwordInput?.addEventListener('input', () => clearFieldError('reg-password', 'reg-password-error'));
  confirmInput?.addEventListener('input', () => clearFieldError('reg-confirm', 'reg-confirm-error'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFormAlert('register-alert');

    let hasError = false;
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    const confirm = confirmInput ? confirmInput.value.trim() : '';

    if (!name) {
      showFieldError('reg-name', 'reg-name-error', 'Full name is required.');
      hasError = true;
    }

    if (!email) {
      showFieldError('reg-email', 'reg-email-error', 'Email is required.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError('reg-email', 'reg-email-error', 'Please enter a valid email address.');
      hasError = true;
    }

    if (!password) {
      showFieldError('reg-password', 'reg-password-error', 'Password is required.');
      hasError = true;
    } else if (password.length < 6) {
      showFieldError('reg-password', 'reg-password-error', 'Password must be at least 6 characters.');
      hasError = true;
    }

    if (!confirm) {
      showFieldError('reg-confirm', 'reg-confirm-error', 'Please confirm your password.');
      hasError = true;
    } else if (confirm !== password) {
      showFieldError('reg-confirm', 'reg-confirm-error', 'Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    // Save account information to localStorage
    const moodkUser = {
      name: name,
      email: email,
      password: password
    };

    localStorage.setItem('moodkUser', JSON.stringify(moodkUser));
    localStorage.setItem('moodkAuth', JSON.stringify({ isLoggedIn: false }));

    // Redirect to LOGIN page
    window.location.href = 'login.html';
  });
}

// 4. LOGIN FORM
function initLoginForm() {
  const form = document.getElementById('moodk-login-form');
  if (!form) return;

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  emailInput?.addEventListener('input', () => clearFieldError('login-email', 'login-email-error'));
  passwordInput?.addEventListener('input', () => clearFieldError('login-password', 'login-password-error'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFormAlert('login-alert');

    let hasError = false;
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (!email) {
      showFieldError('login-email', 'login-email-error', 'Email is required.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError('login-email', 'login-email-error', 'Please enter a valid email address.');
      hasError = true;
    }

    if (!password) {
      showFieldError('login-password', 'login-password-error', 'Password is required.');
      hasError = true;
    }

    if (hasError) return;

    // Read stored user from localStorage
    const rawUser = localStorage.getItem('moodkUser');
    if (!rawUser) {
      showFormAlert(
        'login-alert',
        'No account found. Please create an account first. <a href="register.html">Create an account →</a>'
      );
      return;
    }

    let storedUser;
    try {
      storedUser = JSON.parse(rawUser);
    } catch (err) {
      storedUser = null;
    }

    if (!storedUser || storedUser.email.toLowerCase() !== email.toLowerCase()) {
      showFormAlert(
        'login-alert',
        'No account found with this email. <a href="register.html">Create an account →</a>'
      );
      return;
    }

    if (storedUser.password !== password) {
      showFormAlert('login-alert', 'Invalid email or password.');
      return;
    }

    // Success Login: Save logged-in state
    localStorage.setItem('moodkAuth', JSON.stringify({ isLoggedIn: true }));

    // Process any pending cart item saved before login
    let hasPendingItem = false;
    if (typeof processPendingCartItem === 'function') {
      hasPendingItem = processPendingCartItem();
    } else {
      const pendingRaw = localStorage.getItem('moodkPendingCartItem');
      if (pendingRaw) {
        try {
          const item = JSON.parse(pendingRaw);
          let cart = JSON.parse(localStorage.getItem('moodkCart')) || [];
          cart.push(item);
          localStorage.setItem('moodkCart', JSON.stringify(cart));
          localStorage.removeItem('moodkPendingCartItem');
          hasPendingItem = true;
        } catch (e) {}
      }
    }

    if (hasPendingItem) {
      window.location.href = 'cart.html';
    } else {
      window.location.href = '../index.html';
    }
  });
}
