// pages.js – Vues de l'application

function renderHome(app) {
  const products = DB.getProducts();
  app.innerHTML = `
    <div class="page">
      <h2>Produits disponibles</h2>
      <div class="product-grid" id="product-grid">
        ${products.length === 0 ? '<p>Aucun produit pour le moment.</p>' : products.map(p => `
          <div class="product-card">
            <img src="${p.thumbnail || 'https://placehold.co/300x200/ccc/666?text=Pas+d\'image'}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p class="price-current">${Number(p.price).toLocaleString()} FCFA</p>
            <button class="btn btn-primary btn-sm" onclick="addToCart('${p.id}')">Commander</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

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
    if (user) {
      DB.setSession(user);
      Router.navigate('dashboard');
    } else {
      alert('Email ou mot de passe incorrect.');
    }
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
    if (DB.findUserByEmail(email)) {
      alert('Cet email est déjà utilisé.');
      return;
    }
    const newUser = DB.createUser(email, password, role);
    DB.setSession(newUser);
    Router.navigate('dashboard');
  });
}

function renderDashboard(app) {
  const session = DB.getSession();
  if (!session) {
    Router.navigate('login');
    return;
  }
  const products = session.role === 'seller' ? DB.getProductsBySeller(session.id) : [];
  app.innerHTML = `
    <div class="page">
      <h2>Tableau de bord</h2>
      <p>Connecté en tant que <strong>${session.email}</strong> (${session.role === 'seller' ? 'Vendeur' : 'Acheteur'})</p>
      <button class="btn btn-outline" onclick="logout()">Se déconnecter</button>
      ${session.role === 'seller' ? `
        <h3>Mes produits</h3>
        <button class="btn btn-primary" onclick="Router.navigate('add-product')">Ajouter un produit</button>
        <div class="my-products">
          ${products.length === 0 ? '<p>Vous n\'avez pas encore de produit.</p>' : products.map(p => `
            <div class="my-product-item">
              <img src="${p.thumbnail || 'https://placehold.co/100x100/ccc/666'}" alt="${p.name}">
              <div class="info">
                <h4>${p.name}</h4>
                <p>${Number(p.price).toLocaleString()} FCFA</p>
              </div>
              <div class="actions">
                <button class="btn btn-sm btn-outline" onclick="editProduct('${p.id}')">Modifier</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Supprimer</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<p>Bienvenue, acheteur !</p>'}
    </div>
  `;
}

function renderAddProduct(app) {
  const session = DB.getSession();
  if (!session || session.role !== 'seller') {
    Router.navigate('login');
    return;
  }

  app.innerHTML = `
    <div class="page">
      <h2>Ajouter un produit</h2>
      <form id="add-product-form">
        <input type="text" id="prod-name" placeholder="Nom du produit" required>
        <input type="number" id="prod-price" placeholder="Prix (FCFA)" required>
        
        <label for="prod-image" style="display:block; margin-top:8px;">Image du produit</label>
        <input type="file" id="prod-image" accept="image/*" style="margin-bottom:8px;">
        <img id="image-preview" style="max-width:200px; display:none; border-radius:8px; margin-bottom:8px;">
        
        <button type="submit" class="btn btn-primary">Ajouter</button>
      </form>
      <button class="btn btn-outline" onclick="Router.navigate('dashboard')">Retour</button>
    </div>
  `;

  // Prévisualisation
  const imageInput = document.getElementById('prod-image');
  const preview = document.getElementById('image-preview');
  imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      preview.style.display = 'none';
    }
  });

  // Soumission avec compression
  document.getElementById('add-product-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('prod-name').value.trim();
    const price = Number(document.getElementById('prod-price').value);
    const imageFile = imageInput.files[0];

    if (!name || !price) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    function saveProduct(thumbnail) {
      const product = {
        name,
        price,
        thumbnail,
        sellerId: session.id
      };
      DB.addProduct(product);
      Router.navigate('dashboard');
    }

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        // Compression
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const maxWidth = 400; // largeur max
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // qualité 70%
          saveProduct(compressedBase64);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(imageFile);
    } else {
      saveProduct('https://placehold.co/300x200/ccc/666?text=Pas+d%27image');
    }
  });
}

function logout() {
  DB.clearSession();
  Router.navigate('home');
}

function addToCart(productId) {
  const product = DB.getProducts().find(p => p.id === productId);
  if (product) {
    const message = `Bonjour, je suis intéressé par ${product.name} à ${product.price} FCFA.`;
    window.open(`https://wa.me/22786762903?text=${encodeURIComponent(message)}`, '_blank');
  }
}

function editProduct(productId) {
  // À venir
  alert('Modification à venir');
}

function deleteProduct(productId) {
  if (confirm('Supprimer ce produit ?')) {
    DB.deleteProduct(productId);
    Router.navigate('dashboard');
  }
}
