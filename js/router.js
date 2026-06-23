// router.js – Routeur minimaliste

const Router = {
  routes: {},
  currentRoute: 'home',

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  addRoute(hash, handler) {
    this.routes[hash] = handler;
  },

  resolve() {
    const hash = location.hash.slice(1) || 'home';
    const handler = this.routes[hash];
    const app = document.getElementById('app');
    if (handler) {
      this.currentRoute = hash;
      handler(app);
    } else {
      app.innerHTML = '<p>Page introuvable</p>';
    }
  },

  navigate(hash) {
    location.hash = hash;
  }
};
