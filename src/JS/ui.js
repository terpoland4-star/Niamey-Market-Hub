// ==========================================
// ui.js – Interface utilisateur dynamique
// Version 2.0 – Sécurisée et sans fuites mémoire
// ==========================================

const UI = {
    config: null,
    escHandler: null, // Stocker la référence du handler pour le cleanup

    /**
     * Initialise l'interface utilisateur
     */
    init(config) {
        this.config = config;
        this.cleanup(); // Nettoyer les anciens listeners
        this.renderApp();
        this.renderFooter();
        this.updateMetaTags();
        this.updateWhatsApp();
        this.updateBanner();
    },

    /**
     * Nettoie les event listeners pour éviter les fuites mémoire
     */
    cleanup() {
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
    },

    // ---------- MÉTADONNÉES DYNAMIQUES ----------
    updateMetaTags() {
        if (!this.config) return;
        
        const config = this.config;
        
        // Titre
        document.title = escapeHtml(config.name || 'Niamey Market Hub');
        
        // Favicon
        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        favicon.href = config.favicon || 'assets/favicon-96x96.png';
        
        // Theme color
        const themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) {
            themeMeta.content = config.primaryColor || '#E05206';
        }
        
        // Description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = escapeHtml(config.description || '');
        
        // Open Graph
        this.setMetaProperty('og:title', config.name);
        this.setMetaProperty('og:description', config.description);
        this.setMetaProperty('og:image', config.logo);
        this.setMetaProperty('og:type', 'website');
        this.setMetaProperty('og:locale', I18n.currentLang || 'fr');
    },

    setMetaProperty(property, content) {
        if (!content) return;
        
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = escapeHtml(String(content));
    },

    // ---------- APPLICATION PRINCIPALE ----------
    renderApp() {
        const app = document.getElementById('app');
        if (!app || !this.config) return;

        const config = this.config;
        
        app.innerHTML = `
            <!-- En-tête de la boutique -->
            <header class="shop-header fade-in">
                <img src="${escapeHtml(config.logo || '')}" 
                     alt="${escapeHtml(config.name)}" 
                     class="shop-header__logo"
                     id="shop-logo-img"
                     loading="lazy">
                <h1 class="shop-header__name">${escapeHtml(config.name)}</h1>
                <p class="shop-header__tagline">${escapeHtml(config.tagline || '')}</p>
            </header>

            <!-- Barre de filtres -->
            <div class="filters-bar fade-in">
                <div class="filters-bar__left">
                    <select id="category-filter" class="toolbar-select" aria-label="${I18n.t('filter_by_category')}">
                        <option value="all">${I18n.t('all_categories')}</option>
                        ${(config.categories || []).map(cat => 
                            `<option value="${escapeHtml(cat.key)}">${escapeHtml(cat.label)}</option>`
                        ).join('')}
                    </select>
                    <select id="sort-filter" class="toolbar-select" aria-label="${I18n.t('sort_by')}">
                        <option value="default">${I18n.t('sort_default')}</option>
                        <option value="price-asc">${I18n.t('sort_price_asc')}</option>
                        <option value="price-desc">${I18n.t('sort_price_desc')}</option>
                        <option value="rating">${I18n.t('sort_rating')}</option>
                    </select>
                </div>
                <div class="filters-bar__right">
                    <span id="products-count" class="products-count"></span>
                </div>
            </div>

            <!-- Grille produits -->
            <div id="products-grid" class="products-grid fade-in">
                ${this.renderProducts(config.products || [])}
            </div>

            <!-- Modal produit -->
            <div id="product-modal" class="modal-overlay" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal">
                    <button class="modal__close" id="modal-close-btn" aria-label="${I18n.t('close')}">
                        <i class="fas fa-times"></i>
                    </button>
                    <div id="modal-content"></div>
                </div>
            </div>
        `;

        // Ajouter les event listeners APRÈS le rendu
        this.attachEventListeners();
        
        // Gérer l'erreur de chargement du logo
        const logoImg = document.getElementById('shop-logo-img');
        if (logoImg) {
            logoImg.addEventListener('error', function() {
                this.src = `https://placehold.co/200x200?text=${encodeURIComponent(config.name.charAt(0) || 'N')}`;
            });
        }
        
        // Compteur produits
        this.updateProductsCount((config.products || []).length);
    },

    /**
     * Attache les event listeners après le rendu (évite XSS dans onerror)
     */
    attachEventListeners() {
        // Filtres
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterProducts());
        }
        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.filterProducts());
        }
        
        // Modal close button
        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Modal overlay click
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
        
        // Product cards click (délégation d'événement)
        const productsGrid = document.getElementById('products-grid');
        if (productsGrid) {
            productsGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.product-card');
                if (card && card.dataset.productId) {
                    this.openProductModal(card.dataset.productId);
                }
            });
        }
    },

    // ---------- RENDU DES PRODUITS ----------
    renderProducts(products) {
        if (!products || products.length === 0) {
            return `
                <div class="error-state">
                    <i class="fas fa-box-open" style="font-size: 3rem; opacity: 0.3;" aria-hidden="true"></i>
                    <p>${I18n.t('no_results')}</p>
                </div>
            `;
        }

        return products.map(product => {
            const productName = escapeHtml(product.name || 'Sans nom');
            const price = formatPrice(product.price);
            const oldPrice = product.oldPrice ? formatPrice(product.oldPrice) : null;
            const discount = product.oldPrice ? getDiscountPercentage(product.oldPrice, product.price) : 0;
            const conditionLabel = getConditionLabel(product.condition);
            const stars = renderStars(product.rating || 0);
            const thumbnail = escapeHtml(product.thumbnail || '');
            const fallbackUrl = `https://placehold.co/600x400?text=${encodeURIComponent(product.name || 'Produit')}`;
            
            return `
                <article class="product-card fade-in" data-product-id="${escapeHtml(product.id)}" role="button" tabindex="0" aria-label="${productName} - ${price}">
                    <div style="position: relative;">
                        <img src="${thumbnail}" 
                             alt="${productName}" 
                             class="product-card__image"
                             loading="lazy"
                             data-fallback="${fallbackUrl}">
                        <span class="product-card__badge product-card__badge--${escapeHtml(product.condition || 'new')}">
                            ${conditionLabel}
                        </span>
                    </div>
                    <div class="product-card__info">
                        <h3 class="product-card__name">${productName}</h3>
                        <div class="product-card__price">
                            <span class="product-card__price-current">${price}</span>
                            ${oldPrice ? 
                                `<span class="product-card__price-old">${oldPrice}</span>
                                 <span style="color: #28a745; font-size: var(--font-size-sm); font-weight: 600;">
                                    -${discount}%
                                 </span>` 
                                : ''}
                        </div>
                        <div class="product-card__rating">
                            ${stars}
                            <span style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                                ${product.rating || 0}
                            </span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    },

    // ---------- GESTION DES IMAGES (AJOUTÉ - remplace onerror inline) ----------
    setupImageFallbacks() {
        const images = document.querySelectorAll('img[data-fallback]');
        images.forEach(img => {
            img.addEventListener('error', function() {
                if (this.dataset.fallback) {
                    this.src = this.dataset.fallback;
                    this.removeAttribute('data-fallback'); // Éviter boucle infinie
                }
            });
        });
    },

    // ---------- FILTRAGE ----------
    filterProducts() {
        if (!this.config) return;
        
        const categoryFilter = document.getElementById('category-filter')?.value || 'all';
        const sortFilter = document.getElementById('sort-filter')?.value || 'default';
        
        let products = [...(this.config.products || [])];
        
        // Filtre catégorie
        if (categoryFilter !== 'all') {
            products = products.filter(p => p.category === categoryFilter);
        }
        
        // Tri
        switch (sortFilter) {
            case 'price-asc':
                products.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case 'price-desc':
                products.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case 'rating':
                products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
        }
        
        // Mise à jour de l'affichage
        const grid = document.getElementById('products-grid');
        if (grid) {
            grid.innerHTML = this.renderProducts(products);
            this.setupImageFallbacks(); // Réattacher les fallbacks
        }
        
        this.updateProductsCount(products.length);
    },

    updateProductsCount(count) {
        const countEl = document.getElementById('products-count');
        if (countEl) {
            countEl.textContent = I18n.tp('product', count);
        }
    },

    // ---------- MODAL PRODUIT ----------
    openProductModal(productId) {
        if (!this.config) return;
        
        const product = (this.config.products || []).find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('product-modal');
        const content = document.getElementById('modal-content');
        
        if (!modal || !content) return;

        const productName = escapeHtml(product.name || 'Produit');
        const price = formatPrice(product.price);
        const oldPrice = product.oldPrice ? formatPrice(product.oldPrice) : null;
        const conditionLabel = getConditionLabel(product.condition);
        const stars = renderStars(product.rating || 0);
        const thumbnail = escapeHtml(product.thumbnail || '');
        const fallbackUrl = `https://placehold.co/600x400?text=${encodeURIComponent(product.name || 'Produit')}`;
        const description = escapeHtml(product.description || '');
        
        const whatsappMessage = encodeURIComponent(
            `${I18n.t('order_message')}\n\n*${product.name}*\n${I18n.t('price')} : ${formatPrice(product.price)}\n\n${this.config.whatsappMessage || ''}`
        );
        const whatsappLink = `https://wa.me/${this.config.whatsapp}?text=${whatsappMessage}`;

        content.innerHTML = `
            <img src="${thumbnail}" 
                 alt="${productName}" 
                 style="width: 100%; border-radius: var(--radius-sm); margin-bottom: 20px;"
                 loading="lazy"
                 data-fallback="${fallbackUrl}"
                 id="modal-product-img">
            
            <span class="product-card__badge product-card__badge--${escapeHtml(product.condition || 'new')}" style="position: static; display: inline-block;">
                ${conditionLabel}
            </span>
            
            <h2 id="modal-title" style="margin: 15px 0 10px; font-size: var(--font-size-2xl);">${productName}</h2>
            
            <div class="product-card__price" style="margin-bottom: 15px;">
                <span class="product-card__price-current">${price}</span>
                ${oldPrice ? `<span class="product-card__price-old">${oldPrice}</span>` : ''}
            </div>
            
            <div class="product-card__rating" style="margin-bottom: 15px;">
                ${stars}
                <span>${product.rating || 0}</span>
            </div>
            
            ${description ? `
                <div style="margin-bottom: 20px;">
                    <h4>${I18n.t('description')}</h4>
                    <p style="color: var(--text-secondary);">${description}</p>
                </div>
            ` : ''}
            
            <a href="${whatsappLink}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="btn btn-whatsapp" 
               style="width: 100%;">
                <i class="fab fa-whatsapp" aria-hidden="true"></i>
                ${I18n.t('order_whatsapp')}
            </a>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Setup image fallback
        const modalImg = document.getElementById('modal-product-img');
        if (modalImg) {
            modalImg.addEventListener('error', function() {
                if (this.dataset.fallback) {
                    this.src = this.dataset.fallback;
                    this.removeAttribute('data-fallback');
                }
            });
        }
        
        // Gestionnaire Escape (avec cleanup)
        this.escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', this.escHandler);
        
        // Focus sur le bouton fermer
        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn) {
            setTimeout(() => closeBtn.focus(), 100);
        }
    },

    closeModal() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        // CLEANUP: Retirer le listener Escape
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
        
        // Vider le contenu de la modale après fermeture
        const content = document.getElementById('modal-content');
        if (content) {
            // Petit délai pour l'animation
            setTimeout(() => {
                content.innerHTML = '';
            }, 300);
        }
    },

    // ---------- FOOTER ----------
    renderFooter() {
        const footer = document.getElementById('footer-app');
        if (!footer || !this.config) return;

        const config = this.config;
        const socialLinks = [];
        
        if (config.facebook) {
            socialLinks.push(`<a href="${escapeHtml(config.facebook)}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fab fa-facebook fa-lg" aria-hidden="true"></i></a>`);
        }
        if (config.instagram) {
            socialLinks.push(`<a href="${escapeHtml(config.instagram)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram fa-lg" aria-hidden="true"></i></a>`);
        }
        if (config.tiktok) {
            socialLinks.push(`<a href="${escapeHtml(config.tiktok)}" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i class="fab fa-tiktok fa-lg" aria-hidden="true"></i></a>`);
        }

        footer.innerHTML = `
            <footer class="shop-footer fade-in">
                <div style="margin-bottom: 20px;">
                    <h3 style="color: var(--orange);">${escapeHtml(config.name)}</h3>
                    ${config.address ? `<p style="color: var(--text-secondary);"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${escapeHtml(config.address)}</p>` : ''}
                    ${config.phone ? `<p style="color: var(--text-secondary);"><i class="fas fa-phone" aria-hidden="true"></i> ${escapeHtml(config.phone)}</p>` : ''}
                    ${config.email ? `<p style="color: var(--text-secondary);"><i class="fas fa-envelope" aria-hidden="true"></i> ${escapeHtml(config.email)}</p>` : ''}
                </div>
                
                ${socialLinks.length ? `
                    <div style="margin-bottom: 20px; display: flex; gap: 15px; justify-content: center;">
                        ${socialLinks.join('')}
                    </div>
                ` : ''}
                
                <div class="shop-footer__dev">
                    <p>${I18n.t('developed_by')} 
                        <strong>${escapeHtml(config.developerName || 'HAM Global Words')}</strong> – ${escapeHtml(config.developerTitle || '')}
                    </p>
                    <p style="font-size: var(--font-size-xs);">
                        <i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${escapeHtml(config.developerAddress || '')} | 
                        <i class="fab fa-whatsapp" aria-hidden="true"></i> ${escapeHtml(config.developerWhatsapp || '')} | 
                        <i class="fas fa-envelope" aria-hidden="true"></i> ${escapeHtml(config.developerEmail || '')}
                    </p>
                    ${config.developerLogo ? 
                        `<img src="${escapeHtml(config.developerLogo)}" alt="Logo développeur" class="shop-footer__dev-logo" loading="lazy">` 
                        : ''}
                </div>
            </footer>
        `;
    },

    // ---------- WHATSAPP ----------
    updateWhatsApp() {
        if (!this.config) return;
        
        const link = document.getElementById('whatsappLink');
        const bubble = document.getElementById('whatsappBubble');
        
        if (link) {
            const message = encodeURIComponent(this.config.whatsappMessage || 'Bonjour');
            link.href = `https://wa.me/${this.config.whatsapp}?text=${message}`;
        }
        
        if (bubble) {
            bubble.textContent = `💬 ${escapeHtml(this.config.name || 'Contact')}`;
        }
    },

    // ---------- BANNIÈRE ----------
    updateBanner() {
        const banner = document.getElementById('banner-text');
        if (banner) {
            banner.textContent = I18n.t('banner_text');
        }
    }
};
