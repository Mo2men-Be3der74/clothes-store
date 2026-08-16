(function () {
  'use strict';

  // DOM References
  const track = document.getElementById('explore-track');
  const viewport = document.querySelector('.explore__viewport');
  const prevBtn = document.querySelector('.explore__arrow--prev');
  const nextBtn = document.querySelector('.explore__arrow--next');
  const filterBtns = document.querySelectorAll('.explore__filter');

  if (!track || !viewport) return;

  // State
  let currentFilter = 'all';
  let currentProducts = [];
  let currentIndex = 0;

  // Responsive Visible Card Count
  function getVisibleCount() {
    const width = window.innerWidth;
    if (width <= 600) return 1;
    if (width <= 1024) return 2;
    return 4;
  }

  // Filter Products
  function getFilteredProducts(filter) {
    if (!window.PRODUCTS || window.PRODUCTS.length === 0) return [];
    if (filter === 'all') return window.PRODUCTS;
    if (filter === 'sale') return window.PRODUCTS.filter(p => p.onSale || p.oldPrice > p.price);
    return window.PRODUCTS.filter(p => p.type === filter);
  }

  // Generate Card HTML
  function createCardHTML(product) {
    if (!product) return '';
    const starsHTML = renderStars(product.rating || 5);
    const discountPercent = (product.oldPrice && product.oldPrice > product.price)
      ? `-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%`
      : 'SALE';
    const saleBadgeHTML = (product.onSale || (product.oldPrice && product.oldPrice > product.price))
      ? `<span class="explore__card-badge">${discountPercent}</span>`
      : '';
    const oldPriceHTML = product.oldPrice
      ? `<span class="explore__card-oldprice">${product.oldPrice} ${product.currency || 'EGP'}</span>`
      : '';

    const frontImg = product.image || product.frontImage || product.front;

    const isSaved = window.isInWishlist ? window.isInWishlist(product.id) : false;
    const heartIconClass = isSaved ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    const activeClass = isSaved ? 'active' : '';

    const detailUrl = `pages/product.html?id=${product.id}`;

    return `
      <div class="explore__card" data-id="${product.id}">
        <div class="explore__card-img-wrap">
          ${saleBadgeHTML}
          <button type="button" class="explore__card-wishlist ${activeClass}" aria-label="Add to wishlist" data-id="${product.id}" data-wishlist-id="${product.id}">
            <i class="${heartIconClass}"></i>
          </button>
          <div class="explore__card-img">
            <img src="${frontImg}" alt="${product.name}" class="explore__img-front" loading="lazy">
          </div>
        </div>
        <div class="explore__card-body">
          <span class="explore__card-category">${(product.category || '').toUpperCase()}</span>
          <h3 class="explore__card-name">${product.name}</h3>
          <div class="explore__card-pricing">
            ${oldPriceHTML}
            <span class="explore__card-price">${product.price} ${product.currency || 'EGP'}</span>
          </div>
          <div class="explore__card-rating">
            <div class="explore__card-stars">${starsHTML}</div>
            <span class="explore__card-rating-val">${product.rating || '5.0'}</span>
            <span class="explore__card-reviews">(${product.reviewsCount || 10})</span>
          </div>
          <a href="${detailUrl}" class="explore__card-cta">Shop Now <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </div>
    `;
  }

  function renderStars(rating) {
    let html = '';
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.3 && rating % 1 <= 0.8;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        html += `<i class="fa-solid fa-star"></i>`;
      } else if (i === fullStars && hasHalf) {
        html += `<i class="fa-solid fa-star-half-stroke"></i>`;
      } else {
        html += `<i class="fa-regular fa-star"></i>`;
      }
    }
    return html;
  }

  // Safe Circular Indexing
  function getProductAt(index) {
    const len = currentProducts.length;
    if (len === 0) return null;
    const wrappedIndex = ((index % len) + len) % len;
    return currentProducts[wrappedIndex];
  }

  // Render Track Statically (No Automatic Movement)
  function renderTrack() {
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    track.innerHTML = '';

    const visibleCount = getVisibleCount();

    for (let i = 0; i < visibleCount; i++) {
      const prod = getProductAt(currentIndex + i);
      if (prod) {
        track.insertAdjacentHTML('beforeend', createCardHTML(prod));
      }
    }

    attachCardHandlers();
  }

  // Next & Prev Manual Arrow Navigation
  function moveNext() {
    if (currentProducts.length === 0) return;
    currentIndex = (currentIndex + 1) % currentProducts.length;
    renderTrack();
  }

  function movePrev() {
    if (currentProducts.length === 0) return;
    currentIndex = (currentIndex - 1 + currentProducts.length) % currentProducts.length;
    renderTrack();
  }

  // Interactive Card Handlers (Wishlist & Navigation)
  function attachCardHandlers() {
    // Card Wishlist Heart Click
    track.querySelectorAll('.explore__card-wishlist').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest('.explore__card');
        const id = card ? card.dataset.id : btn.dataset.id;
        if (!id) return;

        if (window.toggleWishlist) {
          window.toggleWishlist(id);
        } else {
          btn.classList.toggle('active');
        }
      });
    });

    // Card Detail View Click
    track.querySelectorAll('.explore__card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.explore__card-wishlist') || e.target.closest('.explore__card-cta')) return;
        const id = card.dataset.id;
        if (id) {
          window.location.href = `pages/product.html?id=${id}`;
        }
      });
    });

    // Sync heart button states with global Wishlist
    if (window.syncHeartButtons) {
      window.syncHeartButtons();
    }
  }

  // Filter Category Switching
  function switchFilter(filter) {
    currentFilter = filter;
    currentProducts = getFilteredProducts(filter);
    currentIndex = 0;

    filterBtns.forEach(btn => {
      const btnFilter = btn.getAttribute('data-filter');
      if (btnFilter === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    renderTrack();
  }

  // Event Bindings
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      if (filter !== currentFilter) {
        switchFilter(filter);
      }
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      moveNext();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      movePrev();
    });
  }

  // Touch Swipe for Mobile / Tablet
  let touchStartX = 0;
  let touchEndX = 0;

  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) {
        moveNext();
      } else {
        movePrev();
      }
    }
  }, { passive: true });

  // Window Resize Debounced Re-render
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      renderTrack();
    }, 150);
  });

  // Init Carousel with 'all' filter
  document.addEventListener('DOMContentLoaded', () => {
    switchFilter('all');
  });

})();
