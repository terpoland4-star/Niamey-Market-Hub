// ==========================================
// cart.js – Gestion du panier
// Version 2.0 – Validation, observer pattern, expiration
// ==========================================

const Cart = {
    // État du panier
    items: [],
    listeners: [],
    
    // Configuration
    config: {
        maxQuantityPerItem: 100,
        minQuantity: 1,
        expirationDays: 30,
        storageKey: 'cart_items'
    },

    /**
     * Initialise le panier
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };
        this.load();
        this.cleanExpired();
        
        console.log('🛒 Panier initialisé:', this.items.length, 'articles');
        return this;
    },

    /**
     * Charge le panier depuis le localStorage
     */
    load() {
        const saved = safeLocalStorage(this.config.storageKey);
        if (saved && Array.isArray(saved)) {
            this.items = saved;
        } else {
            this.items = [];
        }
    },

    /**
     * Sauvegarde le panier
     */
    save() {
        safeLocalStorage(this.config.storageKey, this.items);
        this.notifyListeners();
    },

    /**
     * Ajoute un produit au panier
     */
    addItem(product, quantity = 1) {
        // Validation du produit
        if (!product || !product.id) {
            throw new Error('Produit invalide');
        }
        
        // Validation de la quantité
        const qty = this.validateQuantity(quantity);
        
        // Vérifier si le produit existe déjà
        const existingIndex = this.items.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
            // Mettre à jour la quantité
            const newQuantity = this.items[existingIndex].quantity + qty;
            if (newQuantity > this.config.maxQuantityPerItem) {
                throw new Error(`Quantité maximum: ${this.config.maxQuantityPerItem}`);
            }
            this.items[existingIndex].quantity = newQuantity;
            this.items[existingIndex].updatedAt = new Date().toISOString();
        } else {
            // Ajouter nouveau produit
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                thumbnail: product.thumbnail,
                quantity: qty,
                addedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                condition: product.condition,
                category: product.category
            });
        }
        
        this.save();
        console.log('✅ Produit ajouté au panier:', product.name);
    },

    /**
     * Met à jour la quantité d'un produit
     */
    updateQuantity(productId, quantity) {
        const index = this.items.findIndex(item => item.id === productId);
        if (index === -1) {
            throw new Error('Produit non trouvé dans le panier');
        }
        
        const qty = this.validateQuantity(quantity);
        
        if (qty === 0) {
            this.removeItem(productId);
            return;
        }
        
        if (qty > this.config.maxQuantityPerItem) {
            throw new Error(`Quantité maximum: ${this.config.maxQuantityPerItem}`);
        }
        
        this.items[index].quantity = qty;
        this.items[index].updatedAt = new Date().toISOString();
        
        this.save();
    },

    /**
     * Retire un produit du panier
     */
    removeItem(productId) {
        const index = this.items.findIndex(item => item.id === productId);
        if (index > -1) {
            const removed = this.items.splice(index, 1)[0];
            this.save();
            console.log('🗑️ Produit retiré du panier:', removed.name);
            return removed;
        }
        return null;
    },

    /**
     * Vide le panier
     */
    clear() {
        this.items = [];
        this.save();
        console.log('🧹 Panier vidé');
    },

    /**
     * Récupère un article du panier
     */
    getItem(productId) {
        return this.items.find(item => item.id === productId) || null;
    },

    /**
     * Vérifie si un produit est dans le panier
     */
    hasItem(productId) {
        return this.items.some(item => item.id === productId);
    },

    /**
     * Calcule le total du panier
     */
    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    },

    /**
     * Calcule le nombre total d'articles
     */
    getItemCount() {
        return this.items.reduce((count, item) => {
            return count + item.quantity;
        }, 0);
    },

    /**
     * Calcule le nombre de produits uniques
     */
    getUniqueItemCount() {
        return this.items.length;
    },

    /**
     * Génère un résumé pour WhatsApp
     */
    getWhatsAppSummary(shopConfig) {
        if (this.items.length === 0) return '';
        
        let message = shopConfig?.whatsappMessage || 'Bonjour, je souhaite commander :';
        message += '\n\n';
        
        this.items.forEach((item, index) => {
            message += `${index + 1}. *${item.name}*\n`;
            message += `   Quantité: ${item.quantity}\n`;
            message += `   Prix unitaire: ${formatPrice(item.price)}\n`;
            message += `   Sous-total: ${formatPrice(item.price * item.quantity)}\n\n`;
        });
        
        message += `*Total: ${formatPrice(this.getTotal())}*`;
        
        return encodeURIComponent(message);
    },

    /**
     * Valide une quantité
     */
    validateQuantity(quantity) {
        const qty = parseInt(quantity, 10);
        
        if (isNaN(qty) || qty < 0) {
            throw new Error('Quantité invalide');
        }
        
        if (qty > this.config.maxQuantityPerItem) {
            throw new Error(`Quantité maximum: ${this.config.maxQuantityPerItem}`);
        }
        
        return qty;
    },

    /**
     * Nettoie les articles expirés
     */
    cleanExpired() {
        const now = new Date();
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - this.config.expirationDays);
        
        const before = this.items.length;
        
        this.items = this.items.filter(item => {
            const addedDate = new Date(item.addedAt);
            return addedDate > expirationDate;
        });
        
        const removed = before - this.items.length;
        if (removed > 0) {
            console.log(`🧹 ${removed} article(s) expiré(s) retiré(s) du panier`);
            this.save();
        }
    },

    // ---------- OBSERVER PATTERN ----------
    
    /**
     * Ajoute un listener pour les changements du panier
     */
    onChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    },

    /**
     * Retire un listener
     */
    offChange(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    },

    /**
     * Notifie tous les listeners
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.items, this.getTotal(), this.getItemCount());
            } catch (e) {
                console.error('Erreur listener panier:', e);
            }
        });
    }
};

// Initialiser
Cart.init();

// Fonctions de compatibilité
function addToCart(product, quantity) {
    return Cart.addItem(product, quantity);
}

function removeFromCart(productId) {
    return Cart.removeItem(productId);
}

function updateCartQuantity(productId, quantity) {
    return Cart.updateQuantity(productId, quantity);
}

function clearCart() {
    return Cart.clear();
}

function getCartTotal() {
    return Cart.getTotal();
}

function getCartItems() {
    return Cart.items;
}

function getCartItemCount() {
    return Cart.getItemCount();
}
