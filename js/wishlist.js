(function () {
  'use strict';

  const WISHLIST_KEY = 'moodkWishlist';

  // Get array of saved product IDs
  window.getWishlist = function () {
    try {
      const data = localStorage.getItem(WISHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading wishlist from localStorage:', e);
      return [];
    }
  };

  // Save array of product IDs
  window.saveWishlist = function (list) {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
      window.updateWishlistBadges();
      window.syncHeartButtons();
    } catch (e) {
      console.error('Error saving wishlist to localStorage:', e);
    }
  };

  // Check if a product ID is in wishlist
  window.isInWishlist = function (id) {
    if (!id) return false;
    const list = window.getWishlist();
    return list.includes(id);
  };

  // Toggle a product ID in wishlist
  window.toggleWishlist = function (id) {
    if (!id) return false;
    let list = window.getWishlist();
    const index = list.indexOf(id);
    let added = false;

    if (index > -1) {
      list.splice(index, 1);
      added = false;
    } else {
      list.push(id);
      added = true;
    }

    window.saveWishlist(list);
    return added;
  };

  // Update live Navbar counter badge
  window.updateWishlistBadges = function () {
    const list = window.getWishlist();
    const count = list.length;
    const badgeEls = document.querySelectorAll('.wishlist-badge, #nav-wishlist-count');
    badgeEls.forEach(badge => {
      badge.textContent = count;
      if (count > 0) {
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'inline-flex';
      }
    });
  };

  // Sync heart button states on product cards across DOM
  window.syncHeartButtons = function () {
    const list = window.getWishlist();
    
    // Select all heart buttons (cards and product details)
    const heartBtns = document.querySelectorAll('.men-card__wishlist, .women-card__wishlist, .kids-card__wishlist, .sales-card__wishlist, .wishlist-card__wishlist, .explore__card-wishlist, [data-wishlist-id], [data-id], #pd-wishlist-btn');

    heartBtns.forEach(btn => {
      const id = btn.dataset.id || btn.dataset.wishlistId;
      if (!id) return;

      const icon = btn.querySelector('i');
      if (list.includes(id)) {
        btn.classList.add('active');
        if (icon) icon.className = 'fa-solid fa-heart';
      } else {
        btn.classList.remove('active');
        if (icon) icon.className = 'fa-regular fa-heart';
      }
    });
  };

  // On DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    window.updateWishlistBadges();
    window.syncHeartButtons();
  });

  // Listen for storage changes across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === WISHLIST_KEY) {
      window.updateWishlistBadges();
      window.syncHeartButtons();
    }
  });
})();
