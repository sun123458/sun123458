// ===== API Response Cache =====
class ApiCache {
  constructor(ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttl; // default 5 min
  }

  generateKey(url) {
    return url.toString();
  }

  get(url) {
    const key = this.generateKey(url);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(url, data, ttl) {
    const key = this.generateKey(url);
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
      ttl: ttl || this.ttl,
    });
  }

  clear() {
    this.cache.clear();
  }

  // Remove expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Run cleanup every 10 minutes
setInterval(() => apiCache?.cleanup(), 10 * 60 * 1000);

const apiCache = new ApiCache();
