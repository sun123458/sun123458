// ===== UI Components =====
const Components = {

  // Star SVG for ratings
  starSvg: '<svg viewBox="0 0 24 24" width="14" height="14" fill="#f5c518" stroke="#f5c518" stroke-width="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',

  // Person placeholder SVG
  personPlaceholder: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',

  movieCard(movie) {
    const posterUrl = TMDB.getImageUrl(movie.poster_path, 'w342');
    const year = movie.release_date ? movie.release_date.substring(0, 4) : '';
    const inWatchlist = watchlistStorage.has(movie.id);

    return `
      <div class="movie-card" data-movie-id="${movie.id}">
        <div class="movie-card-poster">
          ${posterUrl
            ? `<img src="${posterUrl}" alt="${movie.title}" loading="lazy">`
            : `<div class="no-poster">🎬</div>`
          }
          ${movie.vote_average > 0 ? `
            <div class="movie-card-rating">
              ${this.starSvg}
              ${movie.vote_average.toFixed(1)}
            </div>
          ` : ''}
          ${inWatchlist ? '<div class="movie-card-watchlist-badge">✓</div>' : ''}
        </div>
        <div class="movie-card-info">
          <div class="movie-card-title" title="${movie.title}">${movie.title}</div>
          <div class="movie-card-year">${year}</div>
        </div>
      </div>
    `;
  },

  movieScrollList(movies) {
    return `
      <div class="movie-scroll">
        ${movies.map(m => this.movieCard(m)).join('')}
      </div>
    `;
  },

  movieGrid(movies) {
    return `
      <div class="movie-grid">
        ${movies.map(m => this.movieCard(m)).join('')}
      </div>
    `;
  },

  section(title, content, linkHref, linkText) {
    return `
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">${title}</h2>
          ${linkHref ? `<a href="${linkHref}" class="section-link">${linkText || '查看全部'} →</a>` : ''}
        </div>
        ${content}
      </div>
    `;
  },

  heroSection(movie) {
    const backdropUrl = TMDB.getBackdropUrl(movie.backdrop_path);
    const posterUrl = TMDB.getImageUrl(movie.poster_path, 'w342');
    const year = movie.release_date ? movie.release_date.substring(0, 4) : '';

    return `
      <div class="hero-section">
        ${backdropUrl ? `<img class="hero-backdrop" src="${backdropUrl}" alt="${movie.title}">` : ''}
        <div class="hero-overlay">
          <div class="hero-content">
            <h1>${movie.title}</h1>
            <div class="hero-rating">
              ${this.starSvg} ${movie.vote_average?.toFixed(1) || 'N/A'} · ${year}
            </div>
            <p>${movie.overview || '暂无简介'}</p>
            <div class="hero-actions">
              <button class="btn btn-primary" onclick="App.openMovieDetail(${movie.id})">查看详情</button>
              <button class="btn btn-secondary" onclick="App.toggleWatchlist(${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${movie.poster_path}', ${movie.vote_average}, '${movie.release_date || ''}', [${(movie.genre_ids || []).join(',')}])">
                ${watchlistStorage.has(movie.id) ? '✓ 已收藏' : '+ 收藏'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async movieDetail(movie, credits, videos) {
    const posterUrl = TMDB.getImageUrl(movie.poster_path, 'w342');
    const year = movie.release_date ? movie.release_date.substring(0, 4) : '';
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
    const inWatchlist = watchlistStorage.has(movie.id);

    // Find trailer
    const trailer = videos?.results?.find(
      v => v.type === 'Trailer' && v.site === 'YouTube'
    ) || videos?.results?.find(
      v => v.site === 'YouTube'
    );

    // Cast (first 15)
    const cast = credits?.cast?.slice(0, 15) || [];

    // Key crew
    const directors = credits?.crew?.filter(c => c.job === 'Director') || [];
    const writers = credits?.crew?.filter(c => c.job === 'Screenplay' || c.job === 'Writer') || [];

    const genres = movie.genres || [];

    return `
      <button class="modal-close-btn" onclick="App.closeMovieModal()">&times;</button>
      <div class="detail-backdrop">
        ${movie.backdrop_path ? `<img src="${TMDB.getBackdropUrl(movie.backdrop_path)}" alt="">` : ''}
      </div>
      <div class="detail-info">
        <div class="detail-header">
          ${posterUrl ? `
            <div class="detail-poster">
              <img src="${posterUrl}" alt="${movie.title}">
            </div>
          ` : ''}
          <div class="detail-meta">
            <h1 class="detail-title">${movie.title}</h1>
            ${movie.tagline ? `<div class="detail-tagline">"${movie.tagline}"</div>` : ''}
            <div class="detail-stats">
              <div class="detail-rating">${this.starSvg} ${movie.vote_average?.toFixed(1) || 'N/A'}</div>
              ${year ? `<span class="detail-year">${year}</span>` : ''}
              ${runtime ? `<span class="detail-runtime">${runtime}</span>` : ''}
            </div>
            <div class="detail-genres">
              ${genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('')}
            </div>
            <div class="detail-actions">
              <button class="watchlist-btn ${inWatchlist ? 'remove' : 'add'}" onclick="App.toggleWatchlistFromDetail(${movie.id})">
                ${inWatchlist ? '✓ 从列表移除' : '+ 加入观影列表'}
              </button>
            </div>
          </div>
        </div>

        <div class="detail-overview">
          <h3>剧情简介</h3>
          <p>${movie.overview || '暂无简介'}</p>
        </div>

        ${trailer ? `
          <div class="detail-trailer">
            <h3>预告片</h3>
            <div class="trailer-container">
              <iframe src="https://www.youtube.com/embed/${trailer.key}" allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
              </iframe>
            </div>
          </div>
        ` : `
          <div class="detail-trailer">
            <h3>预告片</h3>
            <div class="no-trailer">暂无预告片</div>
          </div>
        `}

        ${cast.length > 0 ? `
          <div class="detail-cast">
            <h3>演员</h3>
            <div class="cast-list">
              ${cast.map(c => {
                const profileUrl = TMDB.getImageUrl(c.profile_path, 'w185');
                return `
                  <div class="cast-card">
                    ${profileUrl
                      ? `<img src="${profileUrl}" alt="${c.name}" loading="lazy">`
                      : `<div class="cast-placeholder">${this.personPlaceholder}</div>`
                    }
                    <div class="cast-name" title="${c.name}">${c.name}</div>
                    <div class="cast-character" title="${c.character}">${c.character || ''}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        ${(directors.length > 0 || writers.length > 0) ? `
          <div class="detail-crew">
            <h3>主创人员</h3>
            <div class="crew-list">
              ${directors.map(d => `
                <div class="crew-item">
                  <div class="crew-name">${d.name}</div>
                  <div class="crew-job">导演</div>
                </div>
              `).join('')}
              ${writers.map(w => `
                <div class="crew-item">
                  <div class="crew-name">${w.name}</div>
                  <div class="crew-job">编剧</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  emptyState(icon, title, description, actionBtn) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <h3>${title}</h3>
        <p>${description}</p>
        ${actionBtn || ''}
      </div>
    `;
  },

  loadingMore() {
    return `
      <div class="loading-more">
        <div class="spinner"></div>
        <div>加载更多...</div>
      </div>
    `;
  },
};
