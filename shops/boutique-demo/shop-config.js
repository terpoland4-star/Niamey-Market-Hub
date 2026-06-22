// ==========================================
// Niamey Market Hub – Configuration boutique démo
// Version 2.0 – Avec validation intégrée
// ==========================================
// Copie ce fichier pour créer une nouvelle boutique
// Modifie uniquement les valeurs ci-dessous
// ==========================================

const SHOP_CONFIG = {
    // ---------- MÉTADONNÉES ----------
    version: '1.0.0',
    schemaVersion: '1.0',
    
    // ---------- IDENTITÉ ----------
    slug: 'boutique-demo',
    name: 'Ma Boutique Démo',
    tagline: 'Votre boutique en ligne de confiance',
    description: 'Découvrez notre sélection de produits de qualité à Niamey.',
    
    // ---------- MARQUE ----------
    logo: 'shops/boutique-demo/assets/logo.png',
    favicon: 'shops/boutique-demo/assets/favicon.png',
    primaryColor: '#E05206',
    secondaryColor: '#1B6B93',
    
    // ---------- CONTACT ----------
    whatsapp: '22700000000',
    whatsappMessage: 'Bonjour, je viens de visiter votre boutique !',
    email: 'contact@maboutique.com',
    phone: '+227 00 00 00 00',
    address: 'Votre adresse complète, Niamey (Niger)',
    googleMaps: 'https://maps.app.goo.gl/...',
    
    // ---------- RÉSEAUX SOCIAUX ----------
    facebook: 'https://facebook.com/maboutique',
    instagram: '',
    tiktok: '',
    
    // ---------- DÉVELOPPEUR ----------
    developerName: 'Hamadine AG MOCTAR',
    developerTitle: 'Développeur full‑stack & CEO de HAM Global Words',
    developerAddress: 'Tchangarey, Marché de Bétail, Niamey (Niger)',
    developerWhatsapp: '22786762903',
    developerEmail: 'contact@hamglobalwords.com',
    developerLogo: 'assets/images/logo/logoHAM.png',
    
    // ---------- CATÉGORIES ----------
    categories: [
        { key: 'electronique', label: 'Électronique' },
        { key: 'mode', label: 'Mode' },
        { key: 'maison', label: 'Maison' }
    ],
    
    // ---------- PRODUITS ----------
    products: [
        {
            id: 'demo-1',
            name: 'Smartphone Pro X',
            category: 'electronique',
            condition: 'new',
            price: 150000,
            oldPrice: 180000,
            thumbnail: 'https://placehold.co/600x400?text=Smartphone',
            description: 'Smartphone dernière génération avec 128Go de stockage.',
            rating: 4.5,
            stock: 15,
            available: true
        },
        {
            id: 'demo-2',
            name: 'Robe traditionnelle',
            category: 'mode',
            condition: 'new',
            price: 25000,
            oldPrice: null,
            thumbnail: 'https://placehold.co/600x400?text=Robe',
            description: 'Magnifique robe en wax authentique.',
            rating: 4.8,
            stock: 20,
            available: true
        },
        {
            id: 'demo-3',
            name: 'Table basse design',
            category: 'maison',
            condition: 'used',
            price: 35000,
            oldPrice: 50000,
            thumbnail: 'https://placehold.co/600x400?text=Table',
            description: 'Table basse en bon état, idéale pour votre salon.',
            rating: 4.0,
            stock: 1,
            available: true
        },
        {
            id: 'demo-4',
            name: 'Ordinateur portable',
            category: 'electronique',
            condition: 'refurbished',
            price: 200000,
            oldPrice: 300000,
            thumbnail: 'https://placehold.co/600x400?text=Ordinateur',
            description: 'PC portable reconditionné, garantie 6 mois.',
            rating: 4.3,
            stock: 5,
            available: true
        },
        {
            id: 'demo-5',
            name: 'Chaussures en cuir',
            category: 'mode',
            condition: 'new',
            price: 18000,
            oldPrice: 22000,
            thumbnail: 'https://placehold.co/600x400?text=Chaussures',
            description: 'Chaussures en cuir véritable, fabrication artisanale.',
            rating: 4.6,
            stock: 30,
            available: true
        },
        {
            id: 'demo-6',
            name: 'Canapé 3 places',
            category: 'maison',
            condition: 'new',
            price: 120000,
            oldPrice: null,
            thumbnail: 'https://placehold.co/600x400?text=Canape',
            description: 'Canapé confortable, tissu résistant, coloris au choix.',
            rating: 4.2,
            stock: 3,
            available: true
        }
    ],

    /**
     * Valide la configuration
     */
    validate() {
        const errors = [];
        
        // Slug
        if (!this.slug || !/^[a-z0-9-]+$/.test(this.slug)) {
            errors.push('Slug invalide');
        }
        
        // Champs requis
        if (!this.name) errors.push('Nom requis');
        if (!this.whatsapp) errors.push('WhatsApp requis');
        
        // Validation couleurs
        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (this.primaryColor && !colorRegex.test(this.primaryColor)) {
            errors.push('Couleur primaire invalide');
        }
        
        // Validation produits
        if (!Array.isArray(this.products) || this.products.length === 0) {
            errors.push('Au moins un produit requis');
        } else {
            this.products.forEach((p, i) => {
                if (!p.id) errors.push(`Produit #${i+1}: ID requis`);
                if (!p.name) errors.push(`Produit #${i+1}: Nom requis`);
                if (typeof p.price !== 'number' || p.price <= 0) {
                    errors.push(`Produit #${i+1}: Prix invalide`);
                }
            });
        }
        
        return { valid: errors.length === 0, errors };
    },

    /**
     * Retourne un produit par ID
     */
    getProduct(id) {
        return this.products.find(p => p.id === id) || null;
    }
};

// Ne pas modifier cette ligne
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SHOP_CONFIG };
}
