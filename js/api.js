// ===== TMDB API Service =====
const TMDB = {
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE: 'https://image.tmdb.org/t/p',
  apiKey: null,

  init(key) {
    this.apiKey = key;
  },

  // Core fetch with caching
  async fetch(endpoint, params = {}, cacheTtl) {
    const url = new URL(`${this.BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('language', 'zh-CN');
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    // Check cache first
    const cached = apiCache.get(url);
    if (cached) return cached;

    const response = await fetch(url);
    if (!response.ok) {
      const err = new Error(`API Error: ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    apiCache.set(url, data, cacheTtl);
    return data;
  },

  // Image URLs
  getImageUrl(path, size = 'w500') {
    if (!path) return null;
    return `${this.IMAGE_BASE}/${size}${path}`;
  },

  getBackdropUrl(path) {
    if (!path) return null;
    return `${this.IMAGE_BASE}/original${path}`;
  },

  // ===== Movie Endpoints =====
  getPopular(page = 1) {
    return this.fetch('/movie/popular', { page }, 10 * 60 * 1000);
  },

  getTopRated(page = 1) {
    return this.fetch('/movie/top_rated', { page }, 10 * 60 * 1000);
  },

  getUpcoming(page = 1) {
    return this.fetch('/movie/upcoming', { page }, 5 * 60 * 1000);
  },

  getNowPlaying(page = 1) {
    return this.fetch('/movie/now_playing', { page }, 5 * 60 * 1000);
  },

  getMovieDetails(id) {
    return this.fetch(`/movie/${id}`, {}, 30 * 60 * 1000);
  },

  getMovieCredits(id) {
    return this.fetch(`/movie/${id}/credits`, {}, 30 * 60 * 1000);
  },

  getMovieVideos(id) {
    return this.fetch(`/movie/${id}/videos`, {}, 30 * 60 * 1000);
  },

  getMovieRecommendations(id, page = 1) {
    return this.fetch(`/movie/${id}/recommendations`, { page }, 15 * 60 * 1000);
  },

  searchMovies(query, page = 1) {
    return this.fetch('/search/movie', { query, page }, 2 * 60 * 1000);
  },

  getGenres() {
    return this.fetch('/genre/movie/list', {}, 60 * 60 * 1000); // 1 hour cache
  },

  discoverByGenre(genreIds, page = 1) {
    return this.fetch('/discover/movie', {
      with_genres: genreIds,
      sort_by: 'popularity.desc',
      page,
      'vote_count.gte': 100,
    }, 15 * 60 * 1000);
  },

  // Get a random featured movie for hero
  async getFeaturedMovie() {
    const data = await this.getPopular();
    const pool = data.results.filter(m => m.backdrop_path);
    const movie = pool[Math.floor(Math.random() * Math.min(5, pool.length))];
    return movie;
  },
};
