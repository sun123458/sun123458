// Main application controller
const App = (() => {
  // DOM references
  let playlistEl, searchInput, searchResults;

  // Current state
  let playlist = [];
  let activeSongId = null;

  async function init() {
    // Cache DOM elements
    playlistEl = document.querySelector('#playlist-list');
    searchInput = document.querySelector('#search-input');
    searchResults = document.querySelector('#search-results');

    // Initialize subsystems
    LyricsDisplay.init(document.querySelector('#lyrics-container'));

    // Initialize player
    const playerEls = {
      waveformContainer: document.querySelector('#waveform'),
      playBtn: document.querySelector('#btn-play'),
      prevBtn: document.querySelector('#btn-prev'),
      nextBtn: document.querySelector('#btn-next'),
      progressContainer: document.querySelector('#progress-bar-container'),
      progressBar: document.querySelector('#progress-bar-fill'),
      currentTimeEl: document.querySelector('#time-current'),
      totalTimeEl: document.querySelector('#time-total'),
      volumeSlider: document.querySelector('#volume-slider'),
      nowPlayingTitle: document.querySelector('#np-title'),
      nowPlayingArtist: document.querySelector('#np-artist'),
      nowPlayingCover: document.querySelector('#np-cover'),
    };

    MusicPlayer.init(playerEls, {
      onTimeUpdate: (time) => {
        LyricsDisplay.update(time * 1000);
      },
      onTrackEnd: () => {
        playNextTrack();
      },
      onPlayStateChange: (playing) => {
        updatePlaylistActiveState();
      }
    });

    // Setup search
    SearchEngine.setupSearchInput(searchInput, searchResults, (song) => {
      CollaborativePlaylist.addSong(song);
      if (!activeSongId) {
        playSong(song);
      }
    });

    // Init collaborative playlist
    CollaborativePlaylist.init(INITIAL_PLAYLIST, (updatedPlaylist) => {
      playlist = updatedPlaylist;
      renderPlaylist();
    });

    // Initial playlist
    playlist = CollaborativePlaylist.getPlaylist();
    renderPlaylist();

    // Auto-load first song
    if (playlist.length > 0) {
      playSong(playlist[0]);
    }

    // Handle device rotation — nothing special needed since
    // we use CSS media queries and the audio element persists.
    // But we do need to handle orientation changes for the waveform.
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        // Re-create wavesurfer to fit new container width
        if (MusicPlayer.getCurrentSong()) {
          const song = MusicPlayer.getCurrentSong();
          const wasPlaying = MusicPlayer.getIsPlaying();
          const currentTime = MusicPlayer.getCurrentTime();
          // Reload the song (wavesurfer auto-fits new container)
          MusicPlayer.loadSong(song).then(() => {
            if (wasPlaying) {
              MusicPlayer.seekTo(currentTime);
              MusicPlayer.play();
            }
          });
        }
      }, 300); // Wait for CSS layout to settle after rotation
    });

    // Update rotation indicator
    updateOrientationBadge();
    window.addEventListener('orientationchange', () => {
      setTimeout(updateOrientationBadge, 100);
    });

    // Initialize cache status display
    updateCacheStatus();
  }

  function renderPlaylist() {
    if (!playlistEl) return;

    // Update playlist count badge
    const countEl = document.querySelector('#playlist-count');
    if (countEl) countEl.textContent = `${playlist.length} track${playlist.length !== 1 ? 's' : ''}`;

    playlistEl.innerHTML = playlist.map((song, idx) => {
      const isActive = song.id === activeSongId;
      const isPlaying = isActive && MusicPlayer.getIsPlaying();
      return `
        <div class="playlist-item ${isActive ? 'active' : ''}" data-song-id="${song.id}" data-idx="${idx}">
          <div class="pli-cover" style="background:${song.coverColor};border:2px solid ${song.accentColor}">
            ${isActive && isPlaying ? '<span class="pli-eq">▮▮▮</span>' : `<span>🎵</span>`}
          </div>
          <div class="pli-info">
            <div class="pli-title">${song.title}</div>
            <div class="pli-artist">${song.artist} · ${formatDuration(song.duration)}</div>
            <div class="pli-added">
              Added by ${song.addedBy || 'You'}
              ${song.addedAt ? '· ' + timeAgo(song.addedAt) : ''}
            </div>
          </div>
          <div class="pli-actions">
            <button class="pli-btn-remove" data-song-id="${song.id}" title="Remove">✕</button>
          </div>
        </div>`;
    }).join('');

    // Bind click to play
    playlistEl.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger on remove button
        if (e.target.closest('.pli-btn-remove')) return;

        const songId = item.dataset.songId;
        const song = playlist.find(s => s.id === songId);
        if (song) playSong(song);
      });
    });

    // Bind remove buttons
    playlistEl.querySelectorAll('.pli-btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const songId = btn.dataset.songId;
        const song = playlist.find(s => s.id === songId);

        // If removing the currently playing song, skip to next first
        if (songId === activeSongId) {
          const currentIdx = playlist.findIndex(s => s.id === songId);
          const nextSong = playlist[currentIdx + 1] || playlist[currentIdx - 1] || null;
          if (nextSong) {
            playSong(nextSong);
          }
        }

        CollaborativePlaylist.removeSong(songId);
      });
    });
  }

  function playSong(song) {
    activeSongId = song.id;
    LyricsDisplay.loadLyrics(song.lrc);
    MusicPlayer.loadSong(song).then(() => {
      MusicPlayer.play();
    });
    renderPlaylist();
  }

  function playNextTrack() {
    const currentIdx = playlist.findIndex(s => s.id === activeSongId);
    const nextIdx = currentIdx + 1;
    if (nextIdx < playlist.length) {
      playSong(playlist[nextIdx]);
    } else {
      // Loop back to start
      if (playlist.length > 0) {
        playSong(playlist[0]);
      }
    }
  }

  function updatePlaylistActiveState() {
    const items = playlistEl.querySelectorAll('.playlist-item');
    const isPlaying = MusicPlayer.getIsPlaying();
    items.forEach(item => {
      const isActive = item.dataset.songId === activeSongId;
      item.classList.toggle('active', isActive);
      const coverSpan = item.querySelector('.pli-cover span');
      if (coverSpan && isActive && isPlaying) {
        coverSpan.className = 'pli-eq';
        coverSpan.textContent = '▮▮▮';
      } else if (coverSpan && isActive && !isPlaying) {
        coverSpan.className = '';
        coverSpan.textContent = '🎵';
      } else if (coverSpan && !isActive) {
        coverSpan.className = '';
        coverSpan.textContent = '🎵';
      }
    });
  }

  function updateOrientationBadge() {
    const badge = document.querySelector('#orientation-badge');
    if (!badge) return;
    const type = screen.orientation?.type || (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    badge.textContent = type.includes('landscape') ? '↔ Landscape' : '↕ Portrait';
  }

  async function updateCacheStatus() {
    const badge = document.querySelector('#cache-status');
    if (!badge) return;
    try {
      const stats = await OfflineCache.getCacheStats();
      badge.textContent = `💾 ${stats.cached} cached`;
      badge.title = `${stats.cached} tracks cached for offline play`;
    } catch (e) {
      badge.textContent = '';
    }
  }

  function updateCacheCount(count) {
    const badge = document.querySelector('#cache-status');
    if (badge) {
      badge.textContent = count > 0 ? `💾 ${count} cached` : '';
    }
  }

  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  // Refresh cache status periodically
  setInterval(updateCacheStatus, 30000);

  return { init };
})();

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
