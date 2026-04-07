// ===== Watchlist Storage (localStorage) =====
class WatchlistStorage {
  constructor() {
    this.STORAGE_KEY = 'cinevault_watchlist';
    this.watchlist = this._load();
  }

  _load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  _save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.watchlist));
  }

  getAll() {
    return [...this.watchlist];
  }

  has(movieId) {
    return this.watchlist.some(m => m.id === movieId);
  }

  add(movie) {
    if (this.has(movie.id)) return false;
    this.watchlist.unshift({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      genre_ids: movie.genre_ids || [],
      added_at: Date.now(),
    });
    this._save();
    return true;
  }

  remove(movieId) {
    const index = this.watchlist.findIndex(m => m.id === movieId);
    if (index === -1) return false;
    this.watchlist.splice(index, 1);
    this._save();
    return true;
  }

  toggle(movie) {
    if (this.has(movie.id)) {
      this.remove(movie.id);
      return false;
    }
    this.add(movie);
    return true;
  }

  // Get all genre IDs from watchlist
  getGenreIds() {
    const genreSet = new Set();
    this.watchlist.forEach(m => {
      (m.genre_ids || []).forEach(gid => genreSet.add(gid));
    });
    return [...genreSet];
  }

  get count() {
    return this.watchlist.length;
  }
}

const watchlistStorage = new WatchlistStorage();
