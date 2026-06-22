// ==========================================
// theme.js – Gestion du thème
// Version 2.0 – Sans fuite mémoire, respecte les préférences système
// ==========================================

const Theme = {
    // État actuel
    currentTheme: 'light',
    contrastMode: false,
    fontSize: 'normal',
    
    // Références pour le cleanup
    autoThemeInterval: null,
    mediaQueryListener: null,

    /**
     * Initialise le thème
     */
    init() {
        // Restaurer les préférences sauvegardées
        this.restorePreferences();
        
        // Appliquer le thème
        this.apply();
        
        // Configurer les listeners
        this.setupListeners();
        
        // Démarrer le thème automatique si activé
        if (!this.isAutoThemeDisabled()) {
            this.startAutoTheme();
        }
        
        console.log('🎨 Thème initialisé:', this.currentTheme);
    },

    /**
     * Restaure les préférences depuis le localStorage
     */
    restorePreferences() {
        const saved = safeLocalStorage('theme_preferences');
        if (saved) {
            this.currentTheme = saved.theme || this.getSystemPreference();
            this.contrastMode = saved.contrast || false;
            this.fontSize = saved.fontSize || 'normal';
        } else {
            // Première visite : utiliser les préférences système
            this.currentTheme = this.getSystemPreference();
        }
    },

    /**
     * Détecte la préférence système (clair/sombre)
     */
    getSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    },

    /**
     * Sauvegarde les préférences
     */
    savePreferences() {
        safeLocalStorage('theme_preferences', {
            theme: this.currentTheme,
            contrast: this.contrastMode,
            fontSize: this.fontSize
        });
    },

    /**
     * Applique le thème au DOM
     */
    apply() {
        const html = document.documentElement;
        
        // Thème clair/sombre
        html.setAttribute('data-theme', this.currentTheme);
        
        // Contraste élevé
        if (this.contrastMode) {
            html.setAttribute('data-contrast', 'high');
        } else {
            html.removeAttribute('data-contrast');
        }
        
        // Taille de police
        if (this.fontSize !== 'normal') {
            html.setAttribute('data-font', this.fontSize);
        } else {
            html.removeAttribute('data-font');
        }
        
        // Mettre à jour l'icône du bouton
        this.updateToggleButton();
        
        // Sauvegarder
        this.savePreferences();
    },

    /**
     * Bascule entre thème clair et sombre
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        
        // Désactiver le thème automatique si l'utilisateur change manuellement
        this.disableAutoTheme();
        
        this.apply();
        
        console.log('🌓 Thème changé:', this.currentTheme);
    },

    /**
     * Bascule le mode contraste élevé
     */
    toggleContrast() {
        this.contrastMode = !this.contrastMode;
        this.apply();
        
        console.log('👁️ Contraste:', this.contrastMode ? 'élevé' : 'normal');
    },

    /**
     * Change la taille de police
     */
    increaseFont() {
        const sizes = ['normal', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(this.fontSize);
        if (currentIndex < sizes.length - 1) {
            this.fontSize = sizes[currentIndex + 1];
            this.apply();
        }
    },

    decreaseFont() {
        const sizes = ['normal', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(this.fontSize);
        if (currentIndex > 0) {
            this.fontSize = sizes[currentIndex - 1];
            this.apply();
        }
    },

    resetFont() {
        this.fontSize = 'normal';
        this.apply();
    },

    /**
     * Thème automatique basé sur l'heure
     */
    startAutoTheme() {
        // Nettoyer l'intervalle existant
        this.stopAutoTheme();
        
        this.autoThemeInterval = setInterval(() => {
            this.applyAutoTheme();
        }, 60000); // Vérifier toutes les minutes
        
        // Appliquer immédiatement
        this.applyAutoTheme();
        
        console.log('🕐 Thème automatique activé');
    },

    stopAutoTheme() {
        if (this.autoThemeInterval) {
            clearInterval(this.autoThemeInterval);
            this.autoThemeInterval = null;
        }
    },

    applyAutoTheme() {
        const hour = new Date().getHours();
        // Sombre entre 19h et 7h
        const autoTheme = (hour >= 19 || hour < 7) ? 'dark' : 'light';
        
        if (autoTheme !== this.currentTheme) {
            this.currentTheme = autoTheme;
            this.apply();
        }
    },

    disableAutoTheme() {
        safeLocalStorage('autoThemeDisabled', 'true');
        this.stopAutoTheme();
    },

    enableAutoTheme() {
        localStorage.removeItem('autoThemeDisabled');
        this.startAutoTheme();
    },

    isAutoThemeDisabled() {
        return safeLocalStorage('autoThemeDisabled') === 'true';
    },

    /**
     * Configure les event listeners
     */
    setupListeners() {
        // Bouton thème
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Bouton contraste
        const contrastToggle = document.getElementById('high-contrast-toggle');
        if (contrastToggle) {
            contrastToggle.addEventListener('click', () => this.toggleContrast());
        }
        
        // Boutons taille police
        const fontIncrease = document.getElementById('font-increase');
        const fontDecrease = document.getElementById('font-decrease');
        const fontReset = document.getElementById('font-reset');
        
        if (fontIncrease) fontIncrease.addEventListener('click', () => this.increaseFont());
        if (fontDecrease) fontDecrease.addEventListener('click', () => this.decreaseFont());
        if (fontReset) fontReset.addEventListener('click', () => this.resetFont());
        
        // Écouter les changements système
        if (window.matchMedia) {
            this.mediaQueryListener = (e) => {
                if (!this.isAutoThemeDisabled()) {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.apply();
                }
            };
            
            window.matchMedia('(prefers-color-scheme: dark)')
                .addEventListener('change', this.mediaQueryListener);
        }
    },

    /**
     * Met à jour l'icône du bouton thème
     */
    updateToggleButton() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        if (!icon) return;
        
        if (this.currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
            themeToggle.setAttribute('title', I18n.t('light_mode'));
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.setAttribute('title', I18n.t('dark_mode'));
        }
    },

    /**
     * Nettoie les ressources (à appeler avant de quitter)
     */
    destroy() {
        this.stopAutoTheme();
        
        if (this.mediaQueryListener && window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)')
                .removeEventListener('change', this.mediaQueryListener);
            this.mediaQueryListener = null;
        }
    }
};

// Fonction de compatibilité
function initTheme() {
    Theme.init();
}

// Initialiser au chargement si appelé directement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Theme.init());
} else {
    Theme.init();
}
