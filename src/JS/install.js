// ==========================================
// install.js – Installation PWA
// Version 2.1 – Corrections t() → I18n.t(), CSS complet
// ==========================================

let deferredPrompt = null;

/**
 * Vérifie si l'appareil est iOS
 */
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Vérifie si l'application est déjà installée
 */
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

/**
 * Affiche la bannière d'installation
 */
function showInstallBanner() {
    // Ne pas afficher si déjà installé
    if (isAppInstalled()) return;
    
    // Ne pas afficher si déjà présent
    if (document.getElementById('pwa-install-banner')) return;
    
    // Ne pas afficher si rejeté récemment (24h)
    const dismissedAt = localStorage.getItem('installBannerDismissedAt');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000) return;
    
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', I18n.t('install_app'));
    
    banner.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:2rem;" aria-hidden="true">📲</span>
                <div>
                    <strong>${I18n.t('install_app')}</strong>
                    <span style="display:block; font-size:0.85rem;">${I18n.t('install_app_desc')}</span>
                </div>
            </div>
            <div style="display:flex; gap:8px;">
                <button id="pwa-install-btn" class="btn btn-primary btn-sm">${I18n.t('install')}</button>
                <button id="pwa-dismiss-btn" class="btn btn-outline btn-sm">${I18n.t('later')}</button>
            </div>
        </div>`;
    
    // ✅ CSS COMPLET (plus de [ ... ] tronqué)
    banner.style.cssText = `
        position: fixed;
        bottom: 16px;
        left: 16px;
        right: 16px;
        background: var(--bg-secondary, #f8f9fa);
        border-radius: var(--radius, 12px);
        box-shadow: var(--shadow, 0 2px 10px rgba(0,0,0,0.1));
        padding: 16px;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
        border: 1px solid var(--border-color, #dee2e6);
    `;
    
    document.body.appendChild(banner);

    // ✅ Event listeners propres (pas de onclick inline)
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            console.log('📲 Résultat installation:', result.outcome);
            deferredPrompt = null;
        } else if (isIOS()) {
            showIOSInstructions();
        }
        if (banner.parentNode) banner.remove();
    });

    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        if (banner.parentNode) banner.remove();
        localStorage.setItem('installBannerDismissedAt', Date.now().toString());
    });
}

/**
 * Affiche les instructions d'installation pour iOS
 */
function showIOSInstructions() {
    const overlay = document.createElement('div');
    overlay.id = 'ios-install-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', I18n.t('install_app'));
    
    overlay.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,0.8);
            z-index:10000;
            display:flex;
            align-items:center;
            justify-content:center;
            padding: 20px;
        ">
            <div style="
                background: var(--bg-card, #ffffff);
                border-radius: 20px;
                padding: 24px;
                max-width: 320px;
                width: 100%;
                text-align: center;
                color: var(--text-primary, #1a1a2e);
            ">
                <p style="font-size: 2rem; margin-bottom: 16px;" aria-hidden="true">📲</p>
                <p><strong>${I18n.t('ios_install_step1')}</strong></p>
                <p style="font-size: 0.9rem; margin: 8px 0;">${I18n.t('ios_install_step2')}</p>
                <p style="font-size: 0.9rem; margin-bottom: 16px;">${I18n.t('ios_install_step3')}</p>
                <button id="ios-close-btn" class="btn btn-primary btn-block">${I18n.t('close')}</button>
            </div>
        </div>`;
    
    document.body.appendChild(overlay);
    
    // ✅ Event listener propre (pas de onclick inline)
    document.getElementById('ios-close-btn').addEventListener('click', () => {
        overlay.remove();
    });
    
    // Fermer aussi en cliquant sur le fond
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

/**
 * Initialise la bannière d'installation
 * Appelée par app.js
 */
function initInstallBanner() {
    // Vérifier si déjà installé
    if (isAppInstalled()) {
        console.log('📱 Application déjà installée');
        return;
    }
    
    // Écouter l'événement beforeinstallprompt (Android/Desktop)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallBanner();
        console.log('📲 beforeinstallprompt capturé');
    });
    
    // Écouter l'installation réussie
    window.addEventListener('appinstalled', () => {
        console.log('✅ Application installée avec succès');
        deferredPrompt = null;
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.remove();
        const overlay = document.getElementById('ios-install-overlay');
        if (overlay) overlay.remove();
    });
    
    // Pour iOS : afficher la bannière après un délai
    if (isIOS() && !isAppInstalled()) {
        setTimeout(() => {
            if (!deferredPrompt) {
                showInstallBanner();
            }
        }, 3000);
    }
}

// Auto-init au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInstallBanner);
} else {
    initInstallBanner();
}
