// ===== Recommendation Engine =====
class Recommender {
  constructor() {
    this.genres = null;
  }

  async loadGenres() {
    if (this.genres) return this.genres;
    try {
      const data = await TMDB.getGenres();
      this.genres = {};
      data.genres.forEach(g => { this.genres[g.id] = g.name; });
      return this.genres;
    } catch {
      return {};
    }
  }

  getGenreName(id) {
    return this.genres?.[id] || '';
  }

  // Count genre frequency in watchlist
  _getGenreFrequency() {
    const freq = {};
    watchlistStorage.getAll().forEach(movie => {
      (movie.genre_ids || []).forEach(gid => {
        freq[gid] = (freq[gid] || 0) + 1;
      });
    });
    return freq;
  }

  // Get top genres from watchlist
  getTopGenres(limit = 3) {
    const freq = this._getGenreFrequency();
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, limit).map(([id]) => parseInt(id));
  }

  // Get recommendations based on watchlist genres
  async getRecommendations() {
    await this.loadGenres();

    const watchlist = watchlistStorage.getAll();
    if (watchlist.length === 0) return { movies: [], reason: '' };

    const topGenres = this.getTopGenres(3);
    if (topGenres.length === 0) return { movies: [], reason: '' };

    const genreNames = topGenres.map(id => this.getGenreName(id)).filter(Boolean);
    const reason = genreNames.length > 0
      ? `根据您观影列表中的 ${genreNames.join('、')} 类型推荐`
      : '';

    try {
      // Try with combined genres first
      const data = await TMDB.discoverByGenre(topGenres.join(','));
      const watchlistIds = new Set(watchlist.map(m => m.id));

      // Filter out movies already in watchlist
      let movies = (data.results || []).filter(m => !watchlistIds.has(m.id));

      // If not enough, try individual top genres
      if (movies.length < 10 && topGenres.length > 1) {
        for (const gid of topGenres) {
          const extra = await TMDB.discoverByGenre(gid.toString());
          const extraFiltered = (extra.results || []).filter(m => !watchlistIds.has(m.id));
          movies = [...movies, ...extraFiltered];
        }
        // Deduplicate
        const seen = new Set();
        movies = movies.filter(m => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      }

      return { movies: movies.slice(0, 20), reason };
    } catch (err) {
      console.error('Recommendation error:', err);
      return { movies: [], reason: '' };
    }
  }
}

const recommender = new Recommender();
