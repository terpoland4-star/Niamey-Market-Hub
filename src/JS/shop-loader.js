// ==========================================
// shop-loader.js – Détecte et charge la boutique active
// Version 2.0 – Sécurisée et scalable
// ==========================================

const ShopLoader = {
    // Cache de la configuration chargée
    cachedConfig: null,
    cacheTimestamp: null,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes

    /**
     * Détecte le slug de la boutique depuis le domaine
     * Supporte : sous-domaine, chemin, et domaines personnalisés
     */
    detectShop() {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        
        // 1. Détection par sous-domaine (ex: maboutique.niameymarkethub.com)
        const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.niameymarkethub\.com$/i);
        if (subdomainMatch && validateShopSlug(subdomainMatch[1])) {
            return subdomainMatch[1].toLowerCase();
        }
        
        // 2. Détection par chemin (ex: niameymarkethub.com/maboutique)
        const pathMatch = pathname.match(/^\/([a-z0-9-]+)/);
        if (pathMatch && validateShopSlug(pathMatch[1]) && pathMatch[1] !== 'admin') {
            return pathMatch[1].toLowerCase();
        }
        
        // 3. Mapping domaines personnalisés (chargé dynamiquement)
        const customDomain = this.getCustomDomainMapping(hostname);
        if (customDomain && validateShopSlug(customDomain)) {
            return customDomain;
        }
        
        // 4. Mode développement
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Vérifier si un slug est passé en paramètre
            const params = getUrlParams();
            if (params.shop && validateShopSlug(params.shop)) {
                return params.shop.toLowerCase();
            }
            return 'boutique-demo';
        }
        
        // 5. Fallback
        return 'boutique-demo';
    },

    /**
     * Récupère le mapping domaines personnalisés depuis le localStorage
     * ou une API externe
     */
    getCustomDomainMapping(hostname) {
        // Mapping statique (peut être chargé depuis API)
        const staticMapping = {
            'www.maboutique.com': 'ma-boutique',
            'www.autre-boutique.ne': 'autre-boutique'
        };
        
        // Vérifier le mapping statique
        if (staticMapping[hostname]) {
            return staticMapping[hostname];
        }
        
        // Vérifier le mapping dynamique dans localStorage
        const dynamicMapping = safeLocalStorage('domain_mapping');
        if (dynamicMapping && dynamicMapping[hostname]) {
            return dynamicMapping[hostname];
        }
        
        return null;
    },

    /**
     * Charge la configuration de la boutique
     * Avec validation, cache, et gestion d'erreur robuste
     */
    async loadShopConfig() {
        const shopSlug = this.detectShop();
        
        // VALIDATION DE SÉCURITÉ : Empêcher le path traversal
        if (!validateShopSlug(shopSlug)) {
            console.error('❌ Slug boutique invalide:', shopSlug);
            return this.loadFallbackConfig('Slug boutique invalide');
        }
        
        // Vérifier le cache
        if (this.cachedConfig && this.cacheTimestamp) {
            const age = Date.now() - this.cacheTimestamp;
            if (age < this.CACHE_TTL && this.cachedConfig.slug === shopSlug) {
                console.log('📦 Configuration chargée depuis le cache');
                window.SHOP_CONFIG = this.cachedConfig;
                this.applyTheme();
                return this.cachedConfig;
            }
        }
        
        try {
            // Tentative de chargement de la config
            let config;
            
            // Essayer de charger depuis le fichier local
            config = await this.loadFromFile(shopSlug);
            
            // Essayer de charger depuis l'API si disponible
            if (!config) {
                config = await this.loadFromAPI(shopSlug);
            }
            
            // Si toujours pas de config, fallback
            if (!config) {
                return this.loadFallbackConfig('Configuration introuvable');
            }
            
            // Valider la configuration
            const validation = this.validateConfig(config);
            if (!validation.valid) {
                console.error('❌ Configuration invalide:', validation.errors);
                return this.loadFallbackConfig('Configuration invalide');
            }
            
            // Appliquer la configuration
            window.SHOP_CONFIG = config;
            this.applyTheme();
            
            // Mettre en cache
            this.cachedConfig = config;
            this.cacheTimestamp = Date.now();
            
            console.log('✅ Boutique chargée:', config.name);
            return config;
            
        } catch (error) {
            console.error('❌ Erreur chargement boutique:', error);
            return this.loadFallbackConfig(error.message);
        }
    },

    /**
     * Charge la config depuis un fichier local
     */
    async loadFromFile(shopSlug) {
        try {
            // Le chemin est sécurisé car le slug a été validé
            const configModule = await import(`../../shops/${shopSlug}/shop-config.js`);
            if (configModule && configModule.SHOP_CONFIG) {
                return configModule.SHOP_CONFIG;
            }
        } catch (e) {
            console.warn('⚠️ Config fichier non trouvée pour:', shopSlug);
        }
        return null;
    },

    /**
     * Charge la config depuis l'API
     */
    async loadFromAPI(shopSlug) {
        try {
            const response = await API.call(`/shops/${shopSlug}/config`, {
                useAuth: false,
                timeout: 5000
            });
            return response.data;
        } catch (e) {
            console.warn('⚠️ Config API non disponible pour:', shopSlug);
        }
        return null;
    },

    /**
     * Charge la configuration par défaut (fallback)
     */
    async loadFallbackConfig(reason = 'Non spécifié') {
        console.warn('⚠️ Chargement config fallback. Raison:', reason);
        
        try {
            const defaultModule = await import('./shop-config.js');
            if (defaultModule && defaultModule.SHOP_CONFIG) {
                window.SHOP_CONFIG = defaultModule.SHOP_CONFIG;
                this.applyTheme();
                return defaultModule.SHOP_CONFIG;
            }
        } catch (e) {
            console.error('❌ Même la config fallback a échoué:', e);
        }
        
        // Config d'urgence minimale
        const emergencyConfig = {
            slug: 'emergency',
            name: 'Niamey Market Hub',
            tagline: 'Service temporairement indisponible',
            description: 'Veuillez réessayer plus tard.',
            logo: 'https://placehold.co/200x200?text=NMH',
            favicon: 'https://placehold.co/96x96?text=NMH',
            primaryColor: '#E05206',
            secondaryColor: '#1B6B93',
            whatsapp: '22786762903',
            whatsappMessage: 'Bonjour',
            email: 'contact@niameymarkethub.com',
            phone: '+227 00 00 00 00',
            address: 'Niamey, Niger',
            googleMaps: '#',
            facebook: '#',
            instagram: '',
            tiktok: '',
            developerName: 'HAM Global Words',
            developerTitle: 'Développement Web',
            developerAddress: 'Niamey, Niger',
            developerWhatsapp: '22786762903',
            developerEmail: 'contact@hamglobalwords.com',
            developerLogo: '',
            categories: [],
            products: []
        };
        
        window.SHOP_CONFIG = emergencyConfig;
        this.applyTheme();
        return emergencyConfig;
    },

    /**
     * Valide la configuration de la boutique
     */
    validateConfig(config) {
        const errors = [];
        
        // Champs requis
        if (!config.slug || typeof config.slug !== 'string') {
            errors.push('slug requis');
        }
        if (!config.name || typeof config.name !== 'string') {
            errors.push('name requis');
        }
        if (!Array.isArray(config.products)) {
            errors.push('products doit être un tableau');
        }
        
        // Validation des produits
        if (config.products && config.products.length > 0) {
            config.products.forEach((product, index) => {
                if (!product.id) errors.push(`produit[${index}].id requis`);
                if (!product.name) errors.push(`produit[${index}].name requis`);
                if (typeof product.price !== 'number' || product.price < 0) {
                    errors.push(`produit[${index}].price invalide`);
                }
            });
        }
        
        // Validation des couleurs
        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (config.primaryColor && !colorRegex.test(config.primaryColor)) {
            errors.push('primaryColor doit être un hex couleur valide');
        }
        if (config.secondaryColor && !colorRegex.test(config.secondaryColor)) {
            errors.push('secondaryColor doit être un hex couleur valide');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Applique le thème dynamiquement
     */
    applyTheme() {
        if (!window.SHOP_CONFIG) return;
        
        const config = window.SHOP_CONFIG;
        
        // Appliquer les couleurs CSS
        document.documentElement.style.setProperty('--orange', config.primaryColor || '#E05206');
        document.documentElement.style.setProperty('--secondary', config.secondaryColor || '#1B6B93');
        
        // Mettre à jour le favicon
        if (config.favicon) {
            const favicon = document.querySelector('link[rel="icon"]');
            if (favicon) {
                favicon.href = config.favicon;
            }
        }
        
        // Mettre à jour le titre
        if (config.name) {
            document.title = config.name;
        }
    },

    /**
     * Recharge la configuration (utile après changement de boutique)
     */
    async reload() {
        this.cachedConfig = null;
        this.cacheTimestamp = null;
        return this.loadShopConfig();
    }
};

// Fonction de compatibilité pour le code existant
function detectShop() {
    return ShopLoader.detectShop();
}

async function loadShopConfig() {
    return ShopLoader.loadShopConfig();
}
