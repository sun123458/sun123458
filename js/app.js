// ===== Main Application =====
const App = {
  infiniteScrollers: [],
  currentDetailMovie: null,
  searchDebounceTimer: null,

  async init() {
    this.loadDarkMode();
    this.loadApiKey();
    this.updateWatchlistCount();
    this.setupNavScroll();
    this.setupSearch();
    this.setupDarkModeToggle();

    this.setupRouter();
    router.start();
  },

  // ===== API Key =====
  loadApiKey() {
    const key = localStorage.getItem('cinevault_api_key');
    if (key) {
      TMDB.init(key);
      this.hideApiKeyModal();
    } else {
      this.showApiKeyModal();
    }
  },

  showApiKeyModal() {
    document.getElementById('api-key-modal').classList.remove('hidden');
    document.getElementById('api-key-input').focus();
  },

  hideApiKeyModal() {
    document.getElementById('api-key-modal').classList.add('hidden');
  },

  saveApiKey() {
    const input = document.getElementById('api-key-input');
    const key = input.value.trim();
    if (!key) {
      this.toast('请输入有效的 API Key', 'error');
      return;
    }
    localStorage.setItem('cinevault_api_key', key);
    TMDB.init(key);
    this.hideApiKeyModal();
    router.resolve();
    this.toast('API Key 已保存，开始探索吧！', 'success');
  },

  // ===== Dark Mode =====
  loadDarkMode() {
    const saved = localStorage.getItem('cinevault_dark_mode');
    if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  },

  toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('cinevault_dark_mode', String(newTheme === 'dark'));
  },

  setupDarkModeToggle() {
    document.getElementById('dark-mode-toggle').addEventListener('click', () => this.toggleDarkMode());
  },

  // ===== Navigation =====
  setupNavScroll() {
    window.addEventListener('scroll', () => {
      document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
    });
  },

  // ===== Search with Debounce =====
  setupSearch() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');

    input.addEventListener('input', () => {
      const q = input.value.trim();
      clearBtn.classList.toggle('hidden', !q);

      clearTimeout(this.searchDebounceTimer);
      if (!q) {
        this.hideSearchSuggestions();
        return;
      }

      this.searchDebounceTimer = setTimeout(async () => {
        try {
          const data = await TMDB.searchMovies(q);
          this.showSearchSuggestions(data.results.slice(0, 6));
        } catch {
          // silently fail
        }
      }, 400); // 400ms debounce
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(this.searchDebounceTimer);
        const q = input.value.trim();
        if (q) {
          this.hideSearchSuggestions();
          router.navigate(`/search?q=${encodeURIComponent(q)}`);
        }
      }
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.add('hidden');
      this.hideSearchSuggestions();
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-search')) {
        this.hideSearchSuggestions();
      }
    });
  },

  showSearchSuggestions(movies) {
    const container = document.getElementById('search-suggestions');
    if (!movies.length) {
      container.innerHTML = '<div class="search-suggestion-item"><span>未找到相关电影</span></div>';
      container.classList.remove('hidden');
      return;
    }

    container.innerHTML = movies.map(m => {
      const posterUrl = TMDB.getImageUrl(m.poster_path, 'w92');
      const year = m.release_date ? m.release_date.substring(0, 4) : '';
      return `
        <div class="search-suggestion-item" data-movie-id="${m.id}">
          ${posterUrl ? `<img src="${posterUrl}" alt="">` : '<div style="width:40px;height:60px;background:var(--bg-tertiary);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center">🎬</div>'}
          <div class="search-suggestion-info">
            <div class="search-suggestion-title">${m.title}</div>
            <div class="search-suggestion-year">${year} · ${this.starSvg} ${m.vote_average?.toFixed(1) || 'N/A'}</div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.search-suggestion-item[data-movie-id]').forEach(item => {
      item.addEventListener('click', () => {
        this.hideSearchSuggestions();
        this.openMovieDetail(parseInt(item.dataset.movieId));
      });
    });

    container.classList.remove('hidden');
  },

  hideSearchSuggestions() {
    document.getElementById('search-suggestions').classList.add('hidden');
  },

  // ===== Router =====
  setupRouter() {
    router
      .on('/', () => this.renderHome())
      .on('/search', (params) => this.renderSearch(params.q || ''))
      .on('/watchlist', () => this.renderWatchlist())
      .on('/category/:type', (params) => this.renderCategory(params.type));
  },

  // ===== Render Pages =====
  async renderHome() {
    this.destroyInfiniteScrollers();
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
      const [popular, topRated, upcoming, featured] = await Promise.all([
        TMDB.getPopular(),
        TMDB.getTopRated(),
        TMDB.getUpcoming(),
        TMDB.getFeaturedMovie(),
      ]);

      let recommendationSection = '';
      if (watchlistStorage.count > 0) {
        try {
          const rec = await recommender.getRecommendations();
          if (rec.movies.length > 0) {
            recommendationSection = Components.section(
              '🎯 为您推荐',
              Components.movieScrollList(rec.movies),
              '', ''
            );
            if (rec.reason) {
              recommendationSection = recommendationSection.replace(
                '<h2 class="section-title">🎯 为您推荐</h2>',
                `<h2 class="section-title">🎯 为您推荐</h2><div class="recommendation-reason">${rec.reason}</div>`
              );
            }
            // Wrap in recommendation-section div
            recommendationSection = `<div class="recommendation-section">${recommendationSection}</div>`;
          }
        } catch {
          // recommendations are optional
        }
      }

      app.innerHTML = `
        <div class="app-container">
          ${Components.heroSection(featured)}
          ${recommendationSection}
          ${Components.section('🔥 热门电影', Components.movieScrollList(popular.results), '#/category/popular', '查看更多')}
          ${Components.section('⭐ 评分最高', Components.movieScrollList(topRated.results), '#/category/top_rated', '查看更多')}
          ${Components.section('🎬 即将上映', Components.movieScrollList(upcoming.results), '#/category/upcoming', '查看更多')}
        </div>
      `;

      this.bindMovieCards();
    } catch (err) {
      console.error(err);
      app.innerHTML = `
        <div class="app-container">
          ${Components.emptyState('⚠️', '加载失败', '请检查您的 API Key 和网络连接', '<button class="btn btn-primary" onclick="App.showApiKeyModal()">重新设置 API Key</button>')}
        </div>
      `;
    }
  },

  async renderSearch(query) {
    this.destroyInfiniteScrollers();
    const app = document.getElementById('app');

    if (!query) {
      app.innerHTML = `<div class="app-container">${Components.emptyState('🔍', '搜索电影', '在上方搜索框中输入关键词')}</div>`;
      return;
    }

    app.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
      const data = await TMDB.searchMovies(query);
      app.innerHTML = `
        <div class="app-container">
          <div class="search-results-header">
            <h2>"${query}" 的搜索结果</h2>
            <p>找到 ${data.total_results} 部电影</p>
          </div>
          ${data.results.length > 0
            ? `<div class="movie-grid" id="infinite-grid">${data.results.map(m => Components.movieCard(m)).join('')}</div>
               <div id="scroll-sentinel" class="scroll-sentinel"></div>
               <div id="loading-more" class="hidden">${Components.loadingMore()}</div>`
            : Components.emptyState('🔍', '未找到结果', `未找到与 "${query}" 相关的电影`)
          }
        </div>
      `;

      this.bindMovieCards();

      // Infinite scroll for search results
      this.setupInfiniteScroll(async (page) => {
        const moreData = await TMDB.searchMovies(query, page);
        return moreData;
      }, data.total_pages);
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="app-container">${Components.emptyState('⚠️', '搜索失败', '请稍后重试')}</div>`;
    }
  },

  async renderCategory(type) {
    this.destroyInfiniteScrollers();
    const app = document.getElementById('app');
    const titles = {
      popular: '🔥 热门电影',
      top_rated: '⭐ 评分最高',
      upcoming: '🎬 即将上映',
      now_playing: '🎟️ 正在上映',
    };
    const title = titles[type] || type;

    app.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
      let data;
      switch (type) {
        case 'top_rated': data = await TMDB.getTopRated(); break;
        case 'upcoming': data = await TMDB.getUpcoming(); break;
        case 'now_playing': data = await TMDB.getNowPlaying(); break;
        default: data = await TMDB.getPopular();
      }

      app.innerHTML = `
        <div class="app-container">
          <div class="category-page-header">
            <h2>${title}</h2>
            <p>共 ${data.total_results} 部电影</p>
          </div>
          <div class="movie-grid" id="infinite-grid">${data.results.map(m => Components.movieCard(m)).join('')}</div>
          <div id="scroll-sentinel" class="scroll-sentinel"></div>
          <div id="loading-more" class="hidden">${Components.loadingMore()}</div>
        </div>
      `;

      this.bindMovieCards();

      this.setupInfiniteScroll(async (page) => {
        switch (type) {
          case 'top_rated': return await TMDB.getTopRated(page);
          case 'upcoming': return await TMDB.getUpcoming(page);
          case 'now_playing': return await TMDB.getNowPlaying(page);
          default: return await TMDB.getPopular(page);
        }
      }, data.total_pages);
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="app-container">${Components.emptyState('⚠️', '加载失败', '请稍后重试')}</div>`;
    }
  },

  renderWatchlist() {
    this.destroyInfiniteScrollers();
    const app = document.getElementById('app');
    const movies = watchlistStorage.getAll();

    if (movies.length === 0) {
      app.innerHTML = `
        <div class="app-container">
          <div class="watchlist-header">
            <h2>📭 我的观影列表</h2>
          </div>
          ${Components.emptyState('🎬', '观影列表为空', '浏览电影并添加到您的列表', '<a href="#/" class="btn btn-primary">探索电影</a>')}
        </div>
      `;
      return;
    }

    app.innerHTML = `
      <div class="app-container">
        <div class="watchlist-header">
          <h2>📭 我的观影列表 (${movies.length})</h2>
          <button class="btn btn-outline btn-small" onclick="App.clearWatchlist()">清空列表</button>
        </div>
        <div class="movie-grid">
          ${movies.map(m => Components.movieCard(m)).join('')}
        </div>
      </div>
    `;

    this.bindMovieCards();
  },

  // ===== Movie Detail Modal =====
  async openMovieDetail(movieId) {
    const modal = document.getElementById('movie-modal');
    const content = document.getElementById('movie-detail-content');
    modal.classList.remove('hidden');
    content.innerHTML = '<div class="loading-spinner" style="min-height:300px"><div class="spinner"></div></div>';
    document.body.style.overflow = 'hidden';

    try {
      const [movie, credits, videos] = await Promise.all([
        TMDB.getMovieDetails(movieId),
        TMDB.getMovieCredits(movieId),
        TMDB.getMovieVideos(movieId),
      ]);

      this.currentDetailMovie = movie;
      content.innerHTML = await Components.movieDetail(movie, credits, videos);
    } catch (err) {
      console.error(err);
      content.innerHTML = `<div style="padding:40px;text-align:center"><h3>加载失败</h3><p>请稍后重试</p></div>`;
    }
  },

  closeMovieModal() {
    document.getElementById('movie-modal').classList.add('hidden');
    document.body.style.overflow = '';
    this.currentDetailMovie = null;
  },

  // ===== Watchlist =====
  toggleWatchlist(id, title, posterPath, voteAverage, releaseDate, genreIds) {
    const movie = { id, title, poster_path: posterPath, vote_average: voteAverage, release_date: releaseDate, genre_ids: genreIds };
    const added = watchlistStorage.toggle(movie);
    this.updateWatchlistCount();
    this.toast(added ? `"${title}" 已加入观影列表` : `"${title}" 已从观影列表移除`, added ? 'success' : 'info');
  },

  toggleWatchlistFromDetail(movieId) {
    if (!this.currentDetailMovie) return;
    const movie = this.currentDetailMovie;
    const added = watchlistStorage.toggle({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      genre_ids: (movie.genres || []).map(g => g.id),
    });
    this.updateWatchlistCount();

    // Update button in modal
    const btn = document.querySelector('.watchlist-btn');
    if (btn) {
      btn.className = `watchlist-btn ${added ? 'remove' : 'add'}`;
      btn.textContent = added ? '✓ 从列表移除' : '+ 加入观影列表';
    }

    this.toast(added ? `"${movie.title}" 已加入观影列表` : `"${movie.title}" 已从观影列表移除`, added ? 'success' : 'info');
  },

  clearWatchlist() {
    if (watchlistStorage.count === 0) return;
    if (confirm('确定要清空观影列表吗？')) {
      watchlistStorage.watchlist = [];
      localStorage.removeItem('cinevault_watchlist');
      this.updateWatchlistCount();
      this.renderWatchlist();
      this.toast('观影列表已清空', 'info');
    }
  },

  updateWatchlistCount() {
    document.getElementById('watchlist-count').textContent = watchlistStorage.count;
  },

  // ===== Infinite Scroll =====
  setupInfiniteScroll(fetchFn, totalPages) {
    this.destroyInfiniteScrollers();
    let currentPage = 1;
    let loading = false;

    const observer = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !loading && currentPage < totalPages) {
        loading = true;
        currentPage++;
        const loader = document.getElementById('loading-more');
        if (loader) loader.classList.remove('hidden');

        try {
          const data = await fetchFn(currentPage);
          const grid = document.getElementById('infinite-grid');
          if (grid && data.results) {
            grid.insertAdjacentHTML('beforeend', data.results.map(m => Components.movieCard(m)).join(''));
            this.bindMovieCards();
          }
        } catch (err) {
          console.error('Infinite scroll error:', err);
          currentPage--;
        }

        loading = false;
        if (loader) loader.classList.add('hidden');
      }
    }, { rootMargin: '200px' });

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
      this.infiniteScrollers.push(observer);
    }
  },

  destroyInfiniteScrollers() {
    this.infiniteScrollers.forEach(o => o.disconnect());
    this.infiniteScrollers = [];
  },

  // ===== Event Binding =====
  bindMovieCards() {
    document.querySelectorAll('.movie-card[data-movie-id]').forEach(card => {
      if (card._bound) return;
      card._bound = true;
      card.addEventListener('click', () => {
        this.openMovieDetail(parseInt(card.dataset.movieId));
      });
    });
  },

  // ===== Toast =====
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(80px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  // API Key submit
  document.getElementById('api-key-submit').addEventListener('click', () => App.saveApiKey());
  document.getElementById('api-key-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') App.saveApiKey();
  });

  // Close modal on overlay click
  document.getElementById('movie-modal').addEventListener('click', (e) => {
    if (e.target.id === 'movie-modal') App.closeMovieModal();
  });

  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') App.closeMovieModal();
  });

  App.init();
});
