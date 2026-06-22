// ==========================================
// shop-loader.js – Détecte et charge la boutique active
// ==========================================

function detectShop() {
    const hostname = window.location.hostname;
    
    const domainMap = {
        'localhost': 'boutique-demo',
        '127.0.0.1': 'boutique-demo'
        // Ajouter les domaines de production ici, exemple :
        // 'www.maboutique.com': 'ma-boutique',
    };

    return domainMap[hostname] || 'boutique-demo';
}

async function loadShopConfig() {
    const shopSlug = detectShop();
    
    try {
        const configModule = await import(`../../shops/${shopSlug}/shop-config.js`);
        window.SHOP_CONFIG = configModule.SHOP_CONFIG;
    } catch (e) {
        console.warn('⚠️ Configuration boutique non trouvée, utilisation de la config par défaut.');
        const defaultModule = await import('./shop-config.js');
        window.SHOP_CONFIG = defaultModule.SHOP_CONFIG;
    }

    // Appliquer les couleurs dynamiquement
    document.documentElement.style.setProperty('--orange', window.SHOP_CONFIG.primaryColor);
    document.documentElement.style.setProperty('--secondary', window.SHOP_CONFIG.secondaryColor);

    console.log('✅ Boutique chargée:', window.SHOP_CONFIG.name);
    return window.SHOP_CONFIG;
}
