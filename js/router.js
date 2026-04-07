// ===== Simple Hash Router =====
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    window.addEventListener('hashchange', () => this.resolve());
  }

  on(pattern, handler) {
    this.routes[pattern] = handler;
    return this;
  }

  navigate(hash) {
    window.location.hash = hash;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = {};
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, val] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(val || '');
      });
    }

    // Check exact match first
    if (this.routes[path]) {
      this.currentRoute = path;
      this.routes[path](params);
      return;
    }

    // Pattern matching (e.g., /category/:type)
    for (const [pattern, handler] of Object.entries(this.routes)) {
      const patternParts = pattern.split('/');
      const pathParts = path.split('/');
      if (patternParts.length !== pathParts.length) continue;

      let match = true;
      const routeParams = { ...params };
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
          routeParams[patternParts[i].slice(1)] = pathParts[i];
        } else if (patternParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        this.currentRoute = pattern;
        handler(routeParams);
        return;
      }
    }

    // 404 - redirect to home
    this.navigate('/');
  }

  start() {
    this.resolve();
  }
}

const router = new Router();
