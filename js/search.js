(function () {
    'use strict';

    function getCatalog() {
        if (window.PRODUCTS && Array.isArray(window.PRODUCTS)) {
            return window.PRODUCTS;
        }
        return [];
    }

    // Image path resolver for subfolders vs root
    function getImagePath(path) {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
        const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');
        if (isInsidePages && path.startsWith('assets/')) {
            return '../' + path;
        }
        return path;
    }

    const overlay = document.getElementById('search-overlay');
    const panel = overlay ? overlay.querySelector('.search-panel') : null;
    const input = document.getElementById('search-panel-input');
    const closeBtn = document.getElementById('search-panel-close');
    const resultsWrap = document.getElementById('search-panel-results');

    const triggers = document.querySelectorAll('[data-search-trigger]');

    function openSearch() {
        if (!overlay) return;
        overlay.classList.add('active');
        document.body.classList.add('search-open');

        // Auto-focus with slight delay so CSS animation can begin
        setTimeout(() => input && input.focus(), 80);

        // Show initial hint or current search
        if (input && input.value.trim() !== '') {
            handleInput();
        } else {
            renderHint();
        }
    }

    function closeSearch() {
        if (!overlay) return;
        overlay.classList.remove('active');
        document.body.classList.remove('search-open');

        // Clear after the fade-out animation finishes
        setTimeout(() => {
            if (input) input.value = '';
            if (resultsWrap) resultsWrap.innerHTML = '';
        }, 420);
    }


    function renderHint() {
        if (!resultsWrap) return;
        resultsWrap.innerHTML = `
            <div class="search-panel__hint">
                <span class="search-panel__hint-text">Type to search clothes, shoes & accessories…</span>
            </div>`;
    }

    function renderEmpty(query) {
        if (!resultsWrap) return;
        const escapedQuery = (query || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        resultsWrap.innerHTML = `
            <div class="search-panel__empty">
                <div class="search-panel__empty-title">NO RESULTS FOUND</div>
                <div class="search-panel__empty-text">We couldn't find any products matching "${escapedQuery}".</div>
                <div class="search-suggestions-label">Try searching for:</div>
                <div class="search-suggestion-pills">
                    <button type="button" class="search-pill-btn" data-search="T-Shirts">T-Shirts</button>
                    <button type="button" class="search-pill-btn" data-search="Hoodies">Hoodies</button>
                    <button type="button" class="search-pill-btn" data-search="Jeans">Jeans</button>
                    <button type="button" class="search-pill-btn" data-search="Sneakers">Sneakers</button>
                    <button type="button" class="search-pill-btn" data-search="Jacket">Jackets</button>
                </div>
            </div>`;

        // Attach suggestion pill click handlers
        resultsWrap.querySelectorAll('.search-pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const term = btn.dataset.search;
                if (input) {
                    input.value = term;
                    handleInput();
                }
            });
        });
    }

    function renderResults(items) {
        if (!resultsWrap) return;
        resultsWrap.innerHTML = '';

        items.forEach((product, i) => {
            const el = document.createElement('div');
            el.className = 'search-result';

            const frontImg = getImagePath(product.image || product.frontImage || product.front);
            const currency = product.currency || 'EGP';
            const formattedPrice = `${currency} ${product.price.toLocaleString()}`;
            
            const isSale = product.oldPrice && product.oldPrice > product.price;
            const oldPriceHtml = isSale
                ? `<span class="search-result__old-price">${currency} ${product.oldPrice.toLocaleString()}</span>`
                : '';

            const discountBadgeHtml = isSale
                ? `<span class="search-result__badge">-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%</span>`
                : '';

            const categoryTag = `${(product.type || 'FASHION').toUpperCase()} • ${(product.category || 'COLLECTION').toUpperCase()}`;

            el.innerHTML = `
                <div class="search-result__left">
                    <div class="search-result__img-wrap">
                        <img src="${frontImg}" alt="${product.name}" class="search-result__img" loading="lazy">
                    </div>
                    <div class="search-result__info">
                        <span class="search-result__name">${product.name}</span>
                        <span class="search-result__category">${categoryTag}</span>
                    </div>
                </div>

                <div class="search-result__right">
                    <div class="search-result__price-wrap">
                        ${discountBadgeHtml}
                        <span class="search-result__price">${formattedPrice}</span>
                        ${oldPriceHtml}
                    </div>
                    <i class="fa-solid fa-arrow-right search-result__arrow"></i>
                </div>
            `;

            // Click listener: Navigate directly to product.html?id=${product.id}
            el.addEventListener('click', () => {
                const isInsidePages = window.location.pathname.toLowerCase().includes('/pages/');
                const targetUrl = isInsidePages ? `product.html?id=${product.id}` : `pages/product.html?id=${product.id}`;
                window.location.href = targetUrl;
            });

            resultsWrap.appendChild(el);

            // Staggered entrance animation
            setTimeout(() => el.classList.add('visible'), 30 * (i + 1));
        });
    }

    function handleInput() {
        if (!input) return;
        const query = input.value.trim().toLowerCase();

        if (query === '') {
            renderHint();
            return;
        }

        const catalog = getCatalog();
        const filtered = catalog.filter(p => {
            const nameMatch = p.name && p.name.toLowerCase().includes(query);
            const categoryMatch = p.category && p.category.toLowerCase().includes(query);
            const typeMatch = p.type && p.type.toLowerCase().includes(query);
            const descMatch = p.description && p.description.toLowerCase().includes(query);
            const saleMatch = (query === 'sale' || query === 'sales' || query === 'discount' || query === 'on sale' || query === 'خصم' || query === 'تخفيضات' || query === 'عروض') && (p.onSale === true || (p.oldPrice && p.oldPrice > p.price));
            const shoesMatch = (query.includes('shoe') || query.includes('sneaker') || query.includes('boot') || query.includes('loafer') || query.includes('mule') || query.includes('حذاء') || query.includes('أحذية')) && (p.category === 'shoes-accessories' || (p.name && /shoe|sneaker|boot|loafer|mule|sandal/i.test(p.name)));
            const accMatch = (query.includes('access') || query.includes('bag') || query.includes('cap') || query.includes('belt') || query.includes('حقيبة') || query.includes('قبعة') || query.includes('حزام')) && (p.category === 'shoes-accessories' || (p.name && /bag|cap|belt|tote|satchel/i.test(p.name)));
            return nameMatch || categoryMatch || typeMatch || descMatch || saleMatch || shoesMatch || accMatch;
        });

        if (filtered.length === 0) {
            renderEmpty(query);
        } else {
            renderResults(filtered);
        }
    }


    // Open triggers (search icons in navbar)
    triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openSearch();
        });
    });

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSearch();
        });
    }

    // Click on overlay backdrop (outside panel) closes
    if (overlay && panel) {
        overlay.addEventListener('click', (e) => {
            if (!panel.contains(e.target)) {
                closeSearch();
            }
        });
    }

    // ESC key closes
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
            closeSearch();
        }
    });

    // Live search on input
    if (input) {
        input.addEventListener('input', handleInput);
    }

})();
