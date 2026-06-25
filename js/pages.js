// pages.js – Vues de l'application (Priorité 2 – Design amélioré)

// ---------- HOME (avec recherche et catégories) ----------
function renderHome(app) {
  const products = DB.getProducts();
  const searchQuery = Router.params.query?.get('search')?.toLowerCase() || '';
  const categoryFilter = Router.params.query?.get('category') || 'all';

  let filtered = products;
  if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));
  if (categoryFilter !== 'all') filtered = filtered.filter(p => p.category === categoryFilter);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  app.innerHTML = `
    <div class="page">
      <!-- Hero -->
      <div class="hero">
        <h1>Bienvenue sur Niamey Market Hub</h1>
        <p>Trouvez les meilleurs produits près de chez vous</p>
      </div>

      <!-- Catégories -->
      <div class="categories-section">
        <div class="category-chip ${categoryFilter==='all'?'active':''}" data-category="all">Tout</div>
        ${categories.map(cat => `
          <div class="category-chip ${categoryFilter===cat?'active':''}" data-category="${cat}">${cat}</div>
        `).join('')}
      </div>

      <!-- Barre de recherche -->
      <div class="search-bar">
        <input type="text" id="home-search" placeholder="Rechercher un produit..." value="${searchQuery.replace(/"/g,'&quot;')}">
        <button class="btn btn-primary" id="btn-search">🔍</button>
      </div>

      <h3>Produits disponibles</h3>
      <div class="product-grid">
        ${filtered.length === 0 ? '<p style="grid-column:1/-1;text-align:center;">Aucun produit trouvé.</p>' : filtered.map(p => `
          <div class="product-card" onclick="Router.navigate('product/${p.id}')">
            <img src="${p.thumbnail || 'https://placehold.co/300x200/ccc/666'}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p class="price-current">${Number(p.price).toLocaleString()} FCFA</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Gestion des clics sur les catégories
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.dataset.category;
      let hash = 'home';
      if (cat !== 'all') hash += `?category=${encodeURIComponent(cat)}`;
      Router.navigate(hash);
    });
  });

  // Recherche
  document.getElementById('btn-search').addEventListener('click', () => {
    const s = document.getElementById('home-search').value.trim();
    let hash = 'home';
    if (s) hash += `?search=${encodeURIComponent(s)}`;
    Router.navigate(hash);
  });
}

// ---------- DÉTAIL PRODUIT ----------
function renderProductDetail(app, params) {
  const product = DB.getProductById(params.id);
  if (!product) { app.innerHTML = '<p>Produit introuvable.</p>'; return; }
  app.innerHTML = `
    <div class="page">
      <img src="${product.thumbnail || 'https://placehold.co/600x400/ccc/666'}" style="width:100%; max-height:300px; object-fit:cover; border-radius:12px; margin-bottom:16px;">
      <h2>${product.name}</h2>
      <p class="price-current" style="font-size:1.5rem;">${Number(product.price).toLocaleString()} FCFA</p>
      <p><strong>Catégorie :</strong> ${product.category || 'Non spécifiée'}</p>
      <p>${product.description || 'Aucune description.'}</p>
      <button class="btn btn-primary btn-block" onclick="addToCart('${product.id}')">Commander</button>
      <button class="btn btn-outline btn-block" onclick="history.back()">Retour</button>
    </div>
  `;
}

// ---------- COMMANDES ----------
function renderOrders(app) {
  const session = DB.getSession();
  if (!session) { Router.navigate('login'); return; }
  const orders = DB.getOrdersByUser(session.id, session.role);
  app.innerHTML = `
    <div class="page">
      <h2>Mes commandes</h2>
      ${orders.length === 0 ? '<p>Aucune commande.</p>' : orders.map(o => {
        const p = DB.getProductById(o.productId);
        return `<div class="card" style="margin-bottom:12px;">
          <p><strong>Produit :</strong> ${p ? p.name : 'Produit supprimé'}</p>
          <p><strong>Total :</strong> ${Number(o.total).toLocaleString()} FCFA</p>
          <p><strong>Statut :</strong> ${o.status}</p>
          <p><strong>Date :</strong> ${new Date(o.createdAt).toLocaleString()}</p>
          ${o.status === 'pending' && session.role === 'seller' ? `<button class="btn btn-sm btn-primary" onclick="updateOrderStatus('${o.id}','confirmed')">Confirmer</button>` : ''}
          ${o.status === 'confirmed' && session.role === 'seller' ? `<button class="btn btn-sm btn-primary" onclick="updateOrderStatus('${o.id}','shipped')">Marquer expédiée</button>` : ''}
          ${o.status === 'shipped' && session.role === 'buyer' ? `<button class="btn btn-sm btn-success" onclick="updateOrderStatus('${o.id}','delivered')">Confirmer livraison</button>` : ''}
        </div>`;
      }).join('')}
    </div>
  `;
}

function updateOrderStatus(orderId, status) {
  DB.updateOrderStatus(orderId, status);
  Router.navigate('orders');
}

// ---------- MODIFIER PRODUIT ----------
function renderEditProduct(app, params) {
  const session = DB.getSession();
  if (!session || session.role !== 'seller') { Router.navigate('login'); return; }
  const product = DB.getProductById(params.id);
  if (!product || product.sellerId !== session.id) {
    app.innerHTML = '<p>Accès refusé.</p>';
    return;
  }

  app.innerHTML = `
    <div class="page">
      <h2>Modifier le produit</h2>
      <form id="edit-product-form">
        <input type="text" id="edit-name" value="${product.name}" required>
        <input type="number" id="edit-price" value="${product.price}" required>
        <input type="text" id="edit-category" value="${product.category || ''}" placeholder="Catégorie">
        <textarea id="edit-description" rows="3">${product.description || ''}</textarea>
        <label>Image actuelle :</label>
        <img src="${product.thumbnail}" style="max-width:100px; display:block; margin-bottom:8px;">
        <label>Changer l'image :</label>
        <input type="file" id="edit-image" accept="image/*">
        <img id="edit-preview" style="max-width:200px; display:none; border-radius:8px;">
        <button type="submit" class="btn btn-primary">Enregistrer</button>
      </form>
      <button class="btn btn-outline" onclick="Router.navigate('dashboard')">Retour</button>
    </div>
  `;

  const imageInput = document.getElementById('edit-image');
  const preview = document.getElementById('edit-preview');
  imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('edit-product-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('edit-name').value.trim();
    const price = Number(document.getElementById('edit-price').value);
    const category = document.getElementById('edit-category').value.trim();
    const description = document.getElementById('edit-description').value.trim();
    const imageFile = imageInput.files[0];

    const updateData = { name, price, category, description };
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const maxW = 400;
          let w = img.width, h = img.height;
          if (w > maxW) { h = (maxW / w) * h; w = maxW; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          updateData.thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          DB.updateProduct(product.id, updateData);
          Router.navigate('dashboard');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(imageFile);
    } else {
      DB.updateProduct(product.id, updateData);
      Router.navigate('dashboard');
    }
  });
}

// ---------- DASHBOARD ----------
function renderDashboard(app) {
  const session = DB.getSession();
  if (!session) { Router.navigate('login'); return; }
  const products = session.role === 'seller' ? DB.getProductsBySeller(session.id) : [];
  const orders = DB.getOrdersByUser(session.id, session.role);

  app.innerHTML = `
    <div class="page">
      <h2>Tableau de bord</h2>
      <p>Connecté en tant que <strong>${session.email}</strong> (${session.role === 'seller' ? 'Vendeur' : 'Acheteur'})</p>
      <button class="btn btn-outline" onclick="logout()">Se déconnecter</button>
      ${session.role === 'seller' ? `
        <h3>Mes produits</h3>
        <button class="btn btn-primary" onclick="Router.navigate('add-product')">Ajouter un produit</button>
        <div class="my-products">
          ${products.length === 0 ? '<p>Aucun produit.</p>' : products.map(p => `
            <div class="my-product-item">
              <img src="${p.thumbnail || 'https://placehold.co/100x100/ccc/666'}" alt="${p.name}">
              <div class="info">
                <h4>${p.name}</h4>
                <p>${Number(p.price).toLocaleString()} FCFA</p>
              </div>
              <div class="actions">
                <button class="btn btn-sm btn-outline" onclick="Router.navigate('edit-product/${p.id}')">Modifier</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Supprimer</button>
              </div>
            </div>
          `).join('')}
        </div>
        <h3>Commandes reçues</h3>
        <div>${orders.length === 0 ? '<p>Aucune commande.</p>' : orders.map(o => `<p>#${o.id} - ${DB.getProductById(o.productId)?.name || 'Produit'} - ${o.status}</p>`).join('')}</div>
      ` : `
        <h3>Mes commandes</h3>
        <div>${orders.length === 0 ? '<p>Aucune commande.</p>' : orders.map(o => `<p>#${o.id} - ${DB.getProductById(o.productId)?.name || 'Produit'} - ${o.status}</p>`).join('')}</div>
      `}
    </div>
  `;
}

// ---------- AJOUT PRODUIT (inchangé, déjà avec upload) ----------
function renderAddProduct(app) {
  const session = DB.getSession();
  if (!session || session.role !== 'seller') { Router.navigate('login'); return; }

  app.innerHTML = `
    <div class="page">
      <h2>Ajouter un produit</h2>
      <form id="add-product-form">
        <input type="text" id="prod-name" placeholder="Nom du produit" required>
        <input type="number" id="prod-price" placeholder="Prix (FCFA)" required>
        <input type="text" id="prod-category" placeholder="Catégorie (ex: Électronique)">
        <textarea id="prod-description" rows="3" placeholder="Description"></textarea>
        <label>Image du produit</label>
        <input type="file" id="prod-image" accept="image/*">
        <img id="image-preview" style="max-width:200px; display:none; border-radius:8px; margin-bottom:8px;">
        <button type="submit" class="btn btn-primary">Ajouter</button>
      </form>
      <button class="btn btn-outline" onclick="Router.navigate('dashboard')">Retour</button>
    </div>
  `;

  const imageInput = document.getElementById('prod-image');
  const preview = document.getElementById('image-preview');
  imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('add-product-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('prod-name').value.trim();
    const price = Number(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value.trim();
    const description = document.getElementById('prod-description').value.trim();
    const imageFile = imageInput.files[0];

    if (!name || !price) return alert('Nom et prix requis');

    function saveProduct(thumbnail) {
      const product = { name, price, category, description, thumbnail, sellerId: session.id };
      DB.addProduct(product);
      Router.navigate('dashboard');
    }

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const maxW = 400;
          let w = img.width, h = img.height;
          if (w > maxW) { h = (maxW / w) * h; w = maxW; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          saveProduct(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(imageFile);
    } else {
      saveProduct('https://placehold.co/300x200/ccc/666?text=Pas+d%27image');
    }
  });
}

// ---------- LOGIN / REGISTER (inchangés) ----------
function renderLogin(app) {
  app.innerHTML = `
    <div class="page">
      <h2>Connexion</h2>
      <form id="login-form">
        <input type="email" id="login-email" placeholder="Email" required>
        <input type="password" id="login-password" placeholder="Mot de passe" required>
        <button type="submit" class="btn btn-primary">Se connecter</button>
      </form>
      <p>Pas encore de compte ? <a href="#register">S'inscrire</a></p>
    </div>
  `;
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const user = DB.authenticate(email, password);
    if (user) { DB.setSession(user); Router.navigate('dashboard'); }
    else alert('Email ou mot de passe incorrect.');
  });
}

function renderRegister(app) {
  app.innerHTML = `
    <div class="page">
      <h2>Inscription</h2>
      <form id="register-form">
        <input type="email" id="reg-email" placeholder="Email" required>
        <input type="password" id="reg-password" placeholder="Mot de passe" required>
        <select id="reg-role">
          <option value="buyer">Acheteur</option>
          <option value="seller">Vendeur</option>
        </select>
        <button type="submit" class="btn btn-primary">S'inscrire</button>
      </form>
      <p>Déjà un compte ? <a href="#login">Se connecter</a></p>
    </div>
  `;
  document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    if (DB.findUserByEmail(email)) return alert('Email déjà utilisé.');
    const newUser = DB.createUser(email, password, role);
    DB.setSession(newUser);
    Router.navigate('dashboard');
  });
}

// ---------- FONCTIONS GLOBALES ----------
function logout() { DB.clearSession(); Router.navigate('home'); }
function deleteProduct(id) { if (confirm('Supprimer ?')) { DB.deleteProduct(id); Router.navigate('dashboard'); } }

function addToCart(productId) {
  const session = DB.getSession();
  if (!session) { alert('Connectez-vous pour commander.'); Router.navigate('login'); return; }
  const product = DB.getProductById(productId);
  if (!product) return;
  const order = {
    productId: product.id,
    buyerId: session.id,
    sellerId: product.sellerId,
    quantity: 1,
    total: product.price,
    status: 'pending'
  };
  DB.addOrder(order);
  const message = `Bonjour, je viens de passer une commande (#${order.id}) : ${product.name} à ${product.price} FCFA.`;
  window.open(`https://wa.me/22786762903?text=${encodeURIComponent(message)}`, '_blank');
  Router.navigate('orders');
}
