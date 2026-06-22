// ==========================================
// Niamey Market Hub – Configuration boutique démo
// ==========================================
// Copie ce fichier pour créer une nouvelle boutique
// Modifie uniquement les valeurs ci-dessous
// ==========================================

const SHOP_CONFIG = {
    // ---------- IDENTITÉ ----------
    slug: 'boutique-demo',
    name: 'Ma Boutique Démo',
    tagline: 'Votre boutique en ligne de confiance',
    description: 'Découvrez notre sélection de produits de qualité.',
    
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
    developerEmail: 'moctarhamadine54@gmail.com',
    developerLogo: 'assets/images/logo/logoHAM.png',
    
    // ---------- CATÉGORIES ----------
    categories: [
        { key: 'categorie-1', label: 'Catégorie 1' },
        { key: 'categorie-2', label: 'Catégorie 2' },
        { key: 'categorie-3', label: 'Catégorie 3' }
    ],
    
    // ---------- PRODUITS ----------
    products: [
        {
            id: 'demo-1',
            name: 'Produit démo 1',
            category: 'categorie-1',
            condition: 'new',
            price: 15000,
            oldPrice: 20000,
            thumbnail: 'https://placehold.co/600x400?text=Produit+1',
            description: 'Description du produit démo 1.',
            rating: 4.5
        },
        {
            id: 'demo-2',
            name: 'Produit démo 2',
            category: 'categorie-2',
            condition: 'used',
            price: 8500,
            oldPrice: null,
            thumbnail: 'https://placehold.co/600x400?text=Produit+2',
            description: 'Description du produit démo 2.',
            rating: 4.0
        },
        {
            id: 'demo-3',
            name: 'Produit démo 3',
            category: 'categorie-1',
            condition: 'new',
            price: 32000,
            oldPrice: 38000,
            thumbnail: 'https://placehold.co/600x400?text=Produit+3',
            description: 'Description du produit démo 3.',
            rating: 4.8
        }
    ]
};

// Ne pas modifier cette ligne
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SHOP_CONFIG };
}
