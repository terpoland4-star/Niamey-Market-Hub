// ==========================================
// app.js – Point d'entrée principal
// Version 3.1 – Corrigée
// ==========================================

(function() {
    console.log('🚀 Niamey Market Hub – Démarrage...');

    try {
        // 1. Charger la config boutique
        const config = loadShopConfig();
        window.SHOP_CONFIG = config;
        document.title = config.name || 'Niamey Market Hub';
        console.log('✅ Config chargée:', config.name);

        // 2. Initialiser i18n
        I18n.init();
        var langSelector = document.getElementById('lang-selector');
        if (langSelector) {
            langSelector.value = I18n.lang;
            langSelector.addEventListener('change', function() {
                I18n.setLang(this.value);
                UI.render();
                UI.renderFooter();
            });
        }

        // 3. Initialiser le thème
        Theme.init();
        document.getElementById('theme-btn').addEventListener('click', function() { Theme.toggle(); });
        document.getElementById('contrast-btn').addEventListener('click', function() { Theme.toggleContrast(); });
        document.getElementById('font-plus').addEventListener('click', function() { Theme.fontUp(); });
        document.getElementById('font-minus').addEventListener('click', function() { Theme.fontDown(); });

        // 4. Initialiser le panier
        Cart.init();

        // 5. Rendre l'interface
        UI.init();

        // 6. Bouton panier
        document.getElementById('cart-btn').addEventListener('click', function() { UI.openCart(); });

        // 7. Fermer les modales
        document.getElementById('modal-close').addEventListener('click', function() { UI.closeModal('product-modal'); });
        document.getElementById('cart-modal-close').addEventListener('click', function() { UI.closeModal('cart-modal'); });
        document.getElementById('product-modal').addEventListener('click', function(e) { if (e.target === this) UI.closeModal('product-modal'); });
        document.getElementById('cart-modal').addEventListener('click', function(e) { if (e.target === this) UI.closeModal('cart-modal'); });

        // 8. Échap
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                UI.closeModal('product-modal');
                UI.closeModal('cart-modal');
            }
        });

        console.log('✅ Application prête !');
        console.log('📦 ' + ((config.products || []).length) + ' produits');
        console.log('🏪 ' + config.name);

    } catch (error) {
        console.error('❌ Erreur:', error);
        document.getElementById('app').innerHTML = '<div style="text-align:center;padding:60px 20px;"><p style="font-size:3rem;">⚠️</p><h2>Erreur</h2><p>' + error.message + '</p><button class="btn btn-primary" onclick="location.reload()" style="margin-top:16px;">🔄 Réessayer</button></div>';
    }
})();
