// app.js – Routeur configuré avec navigation inférieure et menu latéral
(function() {
  Router.addRoute('home', renderHome);
  Router.addRoute('login', renderLogin);
  Router.addRoute('register', renderRegister);
  Router.addRoute('dashboard', renderDashboard);
  Router.addRoute('add-product', renderAddProduct);
  Router.addRoute('product', renderProductDetail);
  Router.addRoute('edit-product', renderEditProduct);
  Router.addRoute('orders', renderOrders);

  Router.init();

  function updateNav() {
    const session = DB.getSession();

    // Anciens liens dans le menu "Plus"
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const dashboardLink = document.getElementById('dashboard-link');
    const ordersLink = document.getElementById('orders-link');

    if (loginLink) loginLink.style.display = session ? 'none' : 'block';
    if (registerLink) registerLink.style.display = session ? 'none' : 'block';
    if (dashboardLink) dashboardLink.style.display = session ? 'block' : 'none';
    if (ordersLink) ordersLink.style.display = session ? 'block' : 'none';

    // Barre inférieure
    const navOrders = document.getElementById('nav-orders');
    const navAdd = document.getElementById('nav-add');
    if (navOrders) navOrders.style.display = session ? 'flex' : 'none';
    if (navAdd) navAdd.style.display = (session && session.role === 'seller') ? 'flex' : 'none';

    // Badge panier
    const cartItems = DB.getCart();
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) {
      badge.textContent = cartCount;
      badge.style.display = cartCount > 0 ? 'inline' : 'none';
    }

    // Élément actif dans la barre inférieure
    const currentHash = location.hash.slice(1) || 'home';
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (currentHash === 'home') document.getElementById('nav-home')?.classList.add('active');
    else if (currentHash === 'orders') document.getElementById('nav-orders')?.classList.add('active');
    else if (currentHash === 'add-product') document.getElementById('nav-add')?.classList.add('active');
  }

  window.addEventListener('hashchange', updateNav);
  updateNav();

  // Gestion du menu "Plus"
  window.toggleMenu = function() {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    if (!menu || !overlay) return;
    menu.classList.toggle('open');
    overlay.style.display = menu.classList.contains('open') ? 'block' : 'none';
  };

  // Fermer le menu si on clique en dehors
  document.addEventListener('click', function(e) {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    const toggleBtn = document.getElementById('nav-menu');
    if (menu && menu.classList.contains('open') && !menu.contains(e.target) && e.target !== toggleBtn) {
      menu.classList.remove('open');
      if (overlay) overlay.style.display = 'none';
    }
  });

  // Mettre à jour le badge panier après chaque ajout
  const originalAddToCart = window.addToCart;
  if (typeof originalAddToCart === 'function') {
    window.addToCart = function() {
      originalAddToCart.apply(this, arguments);
      updateNav();
    };
  }
})();
