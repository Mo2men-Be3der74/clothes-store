document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();
});

function initCheckoutPage() {
  const checkoutContainer = document.getElementById('moodk-checkout-page');
  if (!checkoutContainer) return;

  // Render order items & financial summary
  renderCheckoutSummary();

  // Pre-fill user information if logged in
  prefillUserInfo();

  // Setup payment method switcher
  initPaymentMethodSelector();

  // Setup interactive card formatting and live preview
  initCardInputHandlers();

  // Setup live validation error clearers
  initValidationListeners();

  // Setup form submission handler
  initCheckoutSubmit();
}

/* Helper to get cart array from localStorage */
function getCheckoutCart() {
  try {
    const raw = localStorage.getItem('moodkCart');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading moodkCart:', e);
    return [];
  }
}

/* Render order items into the sticky order summary */
function renderCheckoutSummary() {
  const itemsListEl = document.getElementById('checkout-items-list');
  const itemsCountEl = document.getElementById('checkout-summary-count');
  const subtotalEl = document.getElementById('checkout-subtotal');
  const grandTotalEl = document.getElementById('checkout-grand-total');
  const layoutContainer = document.getElementById('checkout-layout-container');
  const emptyStateEl = document.getElementById('checkout-empty-state');

  if (!itemsListEl) return;

  const cart = getCheckoutCart();
  const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');

  if (cart.length === 0) {
    if (layoutContainer) layoutContainer.style.display = 'none';
    if (emptyStateEl) {
      emptyStateEl.style.display = 'flex';
      emptyStateEl.innerHTML = `
        <div class="checkout-empty__icon"><i class="fa-solid fa-bag-shopping"></i></div>
        <h2 class="checkout-empty__title">YOUR BASKET IS EMPTY</h2>
        <p class="checkout-empty__subtitle">You need at least one item in your basket before checking out.</p>
        <a href="${isInsidePages ? 'men.html' : 'pages/men.html'}" class="cart-empty__btn">EXPLORE COLLECTION</a>
      `;
    }
    return;
  }

  if (layoutContainer) layoutContainer.style.display = 'grid';
  if (emptyStateEl) emptyStateEl.style.display = 'none';

  let totalQty = 0;
  let subtotal = 0;
  const currency = cart[0]?.currency || 'EGP';

  itemsListEl.innerHTML = cart.map(item => {
    const qty = parseInt(item.quantity, 10) || 1;
    totalQty += qty;
    const itemTotal = (item.price || 0) * qty;
    subtotal += itemTotal;

    // Handle image path relative to current page location
    let imgSrc = item.image || '';
    if (isInsidePages && imgSrc.startsWith('assets/')) {
      imgSrc = '../' + imgSrc;
    } else if (!isInsidePages && imgSrc.startsWith('../assets/')) {
      imgSrc = imgSrc.replace('../assets/', 'assets/');
    }

    const colorDotHtml = item.color
      ? `<span class="checkout-item__color-dot" style="background-color: ${item.color};"></span>`
      : '';

    return `
      <div class="checkout-item">
        <div class="checkout-item__img-wrap">
          <img src="${imgSrc}" alt="${item.name}" class="checkout-item__img">
        </div>
        <div class="checkout-item__details">
          <h4 class="checkout-item__name">${item.name}</h4>
          <div class="checkout-item__meta">
            ${item.size ? `<span>Size: <strong>${item.size}</strong></span>` : ''}
            ${item.color ? `<span>${colorDotHtml} <strong>${item.colorName || item.color}</strong></span>` : ''}
            <span class="checkout-item__qty">Qty: ${qty}</span>
          </div>
        </div>
        <div class="checkout-item__price">${currency} ${itemTotal.toLocaleString()}</div>
      </div>
    `;
  }).join('');

  if (itemsCountEl) {
    itemsCountEl.textContent = `${totalQty} ITEM${totalQty === 1 ? '' : 'S'}`;
  }

  if (subtotalEl) {
    subtotalEl.textContent = `${currency} ${subtotal.toLocaleString()}`;
  }

  if (grandTotalEl) {
    grandTotalEl.textContent = `${currency} ${subtotal.toLocaleString()}`;
  }
}

/* Auto-fill user info if logged in */
function prefillUserInfo() {
  try {
    const rawUser = localStorage.getItem('moodkUser');
    if (!rawUser) return;
    const user = JSON.parse(rawUser);

    const nameInput = document.getElementById('checkout-fullname');
    const emailInput = document.getElementById('checkout-email');

    if (nameInput && user.name && !nameInput.value) {
      nameInput.value = user.name;
    }
    if (emailInput && user.email && !emailInput.value) {
      emailInput.value = user.email;
    }
  } catch (e) {
    console.error('Error pre-filling user info:', e);
  }
}

/* Switch between Credit Card and Cash on Delivery */
function initPaymentMethodSelector() {
  const cardOption = document.getElementById('payment-option-card');
  const codOption = document.getElementById('payment-option-cod');
  const cardForm = document.getElementById('card-payment-form');
  const codNotice = document.getElementById('cod-notice-card');
  const submitBtn = document.getElementById('checkout-submit-btn');

  if (!cardOption || !codOption) return;

  function setPaymentMethod(method) {
    if (method === 'card') {
      cardOption.classList.add('active');
      codOption.classList.remove('active');
      if (cardForm) cardForm.style.display = 'flex';
      if (codNotice) codNotice.style.display = 'none';
      if (submitBtn) {
        submitBtn.innerHTML = `<span>PAY NOW</span> <i class="fa-solid fa-lock" style="font-size: 11px;"></i>`;
      }
    } else {
      codOption.classList.add('active');
      cardOption.classList.remove('active');
      if (cardForm) cardForm.style.display = 'none';
      if (codNotice) codNotice.style.display = 'flex';
      if (submitBtn) {
        submitBtn.innerHTML = `<span>PLACE ORDER</span> <i class="fa-solid fa-arrow-right" style="font-size: 11px;"></i>`;
      }
    }
  }

  cardOption.addEventListener('click', () => setPaymentMethod('card'));
  codOption.addEventListener('click', () => setPaymentMethod('cod'));

}

/* Card input formatters and live preview synchronization */
function initCardInputHandlers() {
  const numberInput = document.getElementById('card-number');
  const holderInput = document.getElementById('card-holder');
  const expiryInput = document.getElementById('card-expiry');
  const cvvInput = document.getElementById('card-cvv');

  const previewNumber = document.getElementById('preview-card-number');
  const previewHolder = document.getElementById('preview-card-holder');
  const previewExpiry = document.getElementById('preview-card-expiry');
  const previewBrand = document.getElementById('preview-card-brand');

  // Format Card Number (adds spaces every 4 digits)
  if (numberInput) {
    numberInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
      e.target.value = formatted;

      if (previewNumber) {
        previewNumber.textContent = formatted || '•••• •••• •••• ••••';
      }

      // Detect card brand
      if (previewBrand) {
        if (val.startsWith('4')) {
          previewBrand.textContent = 'VISA';
        } else if (val.startsWith('51') || val.startsWith('52') || val.startsWith('53') || val.startsWith('54') || val.startsWith('55')) {
          previewBrand.textContent = 'MC';
        } else if (val.startsWith('34') || val.startsWith('37')) {
          previewBrand.textContent = 'AMEX';
        } else {
          previewBrand.textContent = 'MOODk';
        }
      }
    });
  }

  // Format Cardholder Name
  if (holderInput) {
    holderInput.addEventListener('input', (e) => {
      let val = e.target.value.toUpperCase();
      if (previewHolder) {
        previewHolder.textContent = val.trim() || 'YOUR NAME';
      }
    });
  }

  // Format Expiry Date (MM/YY)
  if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 3) {
        val = val.substring(0, 2) + '/' + val.substring(2);
      }
      e.target.value = val;

      if (previewExpiry) {
        previewExpiry.textContent = val || 'MM/YY';
      }
    });
  }

  // Format CVV (3-4 digits only)
  if (cvvInput) {
    cvvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });
  }
}

/* Clear validation errors on user input */
function initValidationListeners() {
  const fields = [
    { inputId: 'checkout-fullname', errorId: 'error-fullname' },
    { inputId: 'checkout-email', errorId: 'error-email' },
    { inputId: 'checkout-phone', errorId: 'error-phone' },
    { inputId: 'checkout-gov', errorId: 'error-gov' },
    { inputId: 'checkout-city', errorId: 'error-city' },
    { inputId: 'checkout-address', errorId: 'error-address' },
    { inputId: 'card-holder', errorId: 'error-card-holder' },
    { inputId: 'card-number', errorId: 'error-card-number' },
    { inputId: 'card-expiry', errorId: 'error-card-expiry' },
    { inputId: 'card-cvv', errorId: 'error-card-cvv' },
  ];

  fields.forEach(({ inputId, errorId }) => {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', () => {
      clearFieldError(inputId, errorId);
    });

    if (input.tagName === 'SELECT') {
      input.addEventListener('change', () => {
        clearFieldError(inputId, errorId);
      });
    }
  });
}

function showFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);

  if (input) input.classList.add('is-invalid');
  if (errorEl) {
    errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
    errorEl.classList.add('active');
  }
}

function clearFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);

  if (input) input.classList.remove('is-invalid');
  if (errorEl) {
    errorEl.innerHTML = '';
    errorEl.classList.remove('active');
  }
}

/* Email validator */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim().toLowerCase());
}

function initCheckoutSubmit() {
  const form = document.getElementById('moodk-checkout-form');
  const submitBtn = document.getElementById('checkout-submit-btn');
  const processingOverlay = document.getElementById('payment-processing-overlay');
  const processingTitle = document.getElementById('processing-title');
  const processingDesc = document.getElementById('processing-desc');

  if (!form || !submitBtn) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const cart = getCheckoutCart();
    if (cart.length === 0) {
      alert('Your basket is empty. Please add items before checking out.');
      return;
    }

    // Determine selected payment method
    const isCardSelected = document.getElementById('payment-option-card')?.classList.contains('active');

    // Read form values
    const fullname = document.getElementById('checkout-fullname')?.value.trim() || '';
    const email = document.getElementById('checkout-email')?.value.trim() || '';
    const phone = document.getElementById('checkout-phone')?.value.trim() || '';
    const gov = document.getElementById('checkout-gov')?.value.trim() || '';
    const city = document.getElementById('checkout-city')?.value.trim() || '';
    const address = document.getElementById('checkout-address')?.value.trim() || '';
    const apartment = document.getElementById('checkout-apartment')?.value.trim() || '';

    let hasError = false;
    let firstErrorInput = null;

    // Validate Customer Info
    if (!fullname || fullname.length < 2) {
      showFieldError('checkout-fullname', 'error-fullname', 'Please enter your full name.');
      hasError = true;
      if (!firstErrorInput) firstErrorInput = document.getElementById('checkout-fullname');
    }

    if (!email) {
      showFieldError('checkout-email', 'error-email', 'Please enter your email address.');
      hasError = true;
      if (!firstErrorInput) firstErrorInput = document.getElementById('checkout-email');
    } else if (!isValidEmail(email)) {
      showFieldError('checkout-email', 'error-email', 'Please enter a valid email address.');
      hasError = true;
      if (!firstErrorInput) firstErrorInput = document.getElementById('checkout-email');
    }

    if (!phone) {
      showFieldError('checkout-phone', 'error-phone', 'Please enter your phone number.');
      hasError = true;
      if (!firstErrorInput) firstErrorInput = document.getElementById('checkout-phone');
    } else if (phone.replace(/\D/g, '').length < 10) {
      showFieldError('checkout-phone', 'error-phone', 'Please enter a valid phone number (at least 10 digits).');
      hasError = true;
      if (!firstErrorInput) firstErrorInput = document.getElementById('checkout-phone');
    }

    // Validate Shipping Address
    if (!gov) {
      showFieldError('checkout-gov', 'error-gov', 'Please select your governorate.');
      hasError = true;
      if (!firstErrorInput) firstErrorInput = document.getElementById('checkout-gov');
    }

    if (!city || city.length < 2) {
      showFieldError('checkout-city', 'error-city', 'Please enter your city/area.');
      hasError = true;
      if (!firstErrorInput) firstErrorInput = document.getElementById('checkout-city');
    }

    if (!address || address.length < 5) {
      showFieldError('checkout-address', 'error-address', 'Please enter your detailed street address.');
      hasError = true;
      if (!firstErrorInput) firstErrorInput = document.getElementById('checkout-address');
    }

    // Validate Card Payment details if selected
    let cardHolder = '';
    let cardNumber = '';
    let cardExpiry = '';
    let cardCvv = '';

    if (isCardSelected) {
      cardHolder = document.getElementById('card-holder')?.value.trim() || '';
      cardNumber = document.getElementById('card-number')?.value.replace(/\s+/g, '') || '';
      cardExpiry = document.getElementById('card-expiry')?.value.trim() || '';
      cardCvv = document.getElementById('card-cvv')?.value.trim() || '';

      if (!cardHolder || cardHolder.length < 2) {
        showFieldError('card-holder', 'error-card-holder', 'Cardholder name is required.');
        hasError = true;
        if (!firstErrorInput) firstErrorInput = document.getElementById('card-holder');
      }

      if (!cardNumber || cardNumber.length < 16) {
        showFieldError('card-number', 'error-card-number', 'Please enter a valid 16-digit card number.');
        hasError = true;
        if (!firstErrorInput) firstErrorInput = document.getElementById('card-number');
      }

      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        showFieldError('card-expiry', 'error-card-expiry', 'Enter date as MM/YY.');
        hasError = true;
        if (!firstErrorInput) firstErrorInput = document.getElementById('card-expiry');
      } else {
        const [expMonth, expYear] = cardExpiry.split('/').map(n => parseInt(n, 10));
        if (expMonth < 1 || expMonth > 12) {
          showFieldError('card-expiry', 'error-card-expiry', 'Invalid month.');
          hasError = true;
          if (!firstErrorInput) firstErrorInput = document.getElementById('card-expiry');
        }
      }

      if (!cardCvv || cardCvv.length < 3) {
        showFieldError('card-cvv', 'error-card-cvv', 'CVV must be 3 or 4 digits.');
        hasError = true;
        if (!firstErrorInput) firstErrorInput = document.getElementById('card-cvv');
      }
    }

    // If validation failed, scroll smoothly to the first error input
    if (hasError) {
      if (firstErrorInput) {
        firstErrorInput.focus();
        firstErrorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Disable submit button during processing
    submitBtn.disabled = true;

    // Elements for animated overlay
    const spinnerEl = document.getElementById('processing-spinner');
    const successIconEl = document.getElementById('processing-success-icon');

    // Show stage 1: PROCESSING PAYMENT...
    if (processingOverlay) {
      if (spinnerEl) spinnerEl.style.display = 'block';
      if (successIconEl) successIconEl.style.display = 'none';
      if (processingTitle) {
        processingTitle.textContent = isCardSelected ? 'PROCESSING PAYMENT...' : 'PROCESSING ORDER...';
      }
      if (processingDesc) {
        processingDesc.textContent = isCardSelected
          ? 'Securely verifying demo transaction with MOODk digital payment gateway...'
          : 'Finalizing order details and scheduling delivery...';
      }
      processingOverlay.classList.add('active');
    }

    // After 1400ms, transition to Stage 2: PAYMENT SUCCESSFUL
    setTimeout(() => {
      // Trigger pleasant payment confirmation chime
      playPaymentSuccessSound();

      if (spinnerEl) spinnerEl.style.display = 'none';
      if (successIconEl) successIconEl.style.display = 'flex';
      if (processingTitle) {
        processingTitle.textContent = isCardSelected ? 'PAYMENT SUCCESSFUL' : 'ORDER CONFIRMED';
      }
      if (processingDesc) {
        processingDesc.textContent = 'Demo payment confirmed! Generating your official invoice...';
      }

      // After an additional 900ms, create order & redirect to invoice
      setTimeout(() => {
        // Calculate order totals
        const currency = cart[0]?.currency || 'EGP';
        let subtotal = 0;
        cart.forEach(item => {
          subtotal += (item.price || 0) * (parseInt(item.quantity, 10) || 1);
        });

        // Determine Card Brand & Masking (never save full card number)
        let cardBrand = 'Visa';
        if (cardNumber.startsWith('5')) {
          cardBrand = 'Mastercard';
        } else if (cardNumber.startsWith('3')) {
          cardBrand = 'American Express';
        }

        const last4 = isCardSelected ? (cardNumber.slice(-4) || '4242') : null;
        const paymentMethodFormatted = isCardSelected
          ? `${cardBrand} •••• ${last4}`
          : 'Cash on Delivery';

        // Generate random unique Order ID (e.g. MOODK-48291)
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        const orderId = `MOODK-${randomDigits}`;

        // Format Date (e.g. August 14, 2026)
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Check if there is a logged in user email
        let loggedInEmail = '';
        try {
          const rawUser = localStorage.getItem('moodkUser');
          if (rawUser) {
            const u = JSON.parse(rawUser);
            if (u && u.email) loggedInEmail = u.email;
          }
        } catch (e) { }

        // Build Complete Order Object
        const orderData = {
          id: orderId,
          createdAt: Date.now(),
          date: formattedDate,
          timestamp: now.toISOString(),
          userEmail: loggedInEmail || email,
          customer: {
            name: fullname,
            email: email,
            phone: phone
          },
          shippingAddress: {
            governorate: gov,
            city: city,
            address: address,
            apartment: apartment || ''
          },
          payment: {
            method: paymentMethodFormatted,
            cardBrand: cardBrand,
            cardLast4: last4,
            status: 'Paid — Demo'
          },
          items: cart,
          subtotal: subtotal,
          shippingFee: 0,
          total: subtotal,
          currency: currency,
          estimatedDelivery: '2–4 Business Days',
          orderStatus: 'CONFIRMED',
          status: 'CONFIRMED'
        };

        // Save order to localStorage
        try {
          localStorage.setItem('moodkLatestOrder', JSON.stringify(orderData));

          // Append to order history array
          const rawHistory = localStorage.getItem('moodkOrders');
          const orderHistory = rawHistory ? JSON.parse(rawHistory) : [];
          orderHistory.unshift(orderData);
          localStorage.setItem('moodkOrders', JSON.stringify(orderHistory));

          // Empty Cart
          localStorage.setItem('moodkCart', JSON.stringify([]));
          if (typeof updateCartBadge === 'function') {
            updateCartBadge();
          }
        } catch (err) {
          console.error('Error saving order to localStorage:', err);
        }

        // Redirect to Invoice Page with order query param
        const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');
        const invoiceUrl = isInsidePages ? `invoice.html?order=${orderId}` : `pages/invoice.html?order=${orderId}`;
        window.location.href = invoiceUrl;
      }, 900);

    }, 1400);
  });
}

function playPaymentSuccessSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Master volume control (soft & comfortable)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, now);
    masterGain.connect(ctx.destination);

    // Warm Lowpass Filter for soft luxury tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.connect(masterGain);

    // Harmonic Chord / Chime Sequence: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.5Hz)
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.35, gain: 0.6 },  // C5
      { freq: 659.25, time: 0.09, dur: 0.40, gain: 0.7 },  // E5
      { freq: 783.99, time: 0.18, dur: 0.50, gain: 0.8 },  // G5
      { freq: 1046.50, time: 0.28, dur: 0.90, gain: 0.9 }  // C6 (high confirmation chime)
    ];

    notes.forEach(({ freq, time, dur, gain }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Add gentle pitch envelope for bell-like sparkle
      osc.frequency.exponentialRampToValueAtTime(freq * 1.008, now + time + 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq, now + time + 0.1);

      // ADSR Envelope: Fast attack, soft exponential decay
      noteGain.gain.setValueAtTime(0.0001, now + time);
      noteGain.gain.exponentialRampToValueAtTime(gain, now + time + 0.025);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(noteGain);
      noteGain.connect(filter);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });

    // Cleanup AudioContext after playback completes
    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') ctx.close();
      } catch (e) { }
    }, 1800);

  } catch (err) {
    console.warn('Payment success sound notification error:', err);
  }
}
