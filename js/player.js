// Audio player with Wavesurfer.js waveform visualization
import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7.8.4/dist/wavesurfer.esm.js';

window.MusicPlayer = (() => {
  // State
  let wavesurfer = null;
  let currentSong = null;
  let isPlaying = false;
  let isSeeking = false;
  let currentTime = 0;
  let duration = 0;
  let audioURL = null;

  // UI elements (set by init)
  let els = {};

  // Callbacks
  let onTimeUpdate = null;
  let onTrackEnd = null;
  let onPlayStateChange = null;

  function init(elements, callbacks) {
    els = elements;
    onTimeUpdate = callbacks?.onTimeUpdate || null;
    onTrackEnd = callbacks?.onTrackEnd || null;
    onPlayStateChange = callbacks?.onPlayStateChange || null;

    createWavesurfer();
    bindControls();
  }

  function createWavesurfer() {
    if (wavesurfer) {
      wavesurfer.destroy();
    }

    wavesurfer = WaveSurfer.create({
      container: els.waveformContainer,
      waveColor: 'rgba(255, 255, 255, 0.3)',
      progressColor: 'rgba(255, 255, 255, 0.85)',
      cursorColor: '#fff',
      cursorWidth: 2,
      height: 80,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      backend: 'WebAudio',
      interact: true,
      dragToSeek: true,
      hideScrollbar: true,
    });

    // Events
    wavesurfer.on('timeupdate', (time) => {
      if (!isSeeking) {
        currentTime = time;
        updateProgressBar();
        if (onTimeUpdate) onTimeUpdate(time);
      }
    });

    wavesurfer.on('seek', () => {
      isSeeking = true;
    });

    wavesurfer.on('interaction', () => {
      isSeeking = false;
    });

    wavesurfer.on('finish', () => {
      isPlaying = false;
      updatePlayButton();
      if (onTrackEnd) onTrackEnd();
    });

    wavesurfer.on('play', () => {
      isPlaying = true;
      updatePlayButton();
      if (onPlayStateChange) onPlayStateChange(true);
    });

    wavesurfer.on('pause', () => {
      isPlaying = false;
      updatePlayButton();
      if (onPlayStateChange) onPlayStateChange(false);
    });

    wavesurfer.on('ready', () => {
      duration = wavesurfer.getDuration();
      updateDurationDisplay();
    });

    wavesurfer.on('error', (err) => {
      console.warn('Wavesurfer error:', err);
    });
  }

  async function loadSong(song) {
    currentSong = song;
    isPlaying = false;
    isSeeking = false;
    currentTime = 0;
    duration = song.duration;

    updateNowPlaying(song);
    updateDurationDisplay();
    updateProgressBar();
    updatePlayButton();

    // Get audio source — try cache first, then generate
    let url = null;
    try {
      url = await OfflineCache.getCachedURL(song.id);
    } catch (e) { /* cache may not be available */ }

    if (!url) {
      try {
        const blob = await AudioGen.getAudioBlob(song);
        url = URL.createObjectURL(blob);
        // Cache it
        try {
          await OfflineCache.cacheSong(song, blob);
        } catch (e) { /* cache may fail in some contexts */ }
      } catch (e) {
        console.error('Failed to generate audio for', song.title, e);
        return;
      }
    }

    // Clean up old URL
    if (audioURL && audioURL.startsWith('blob:')) {
      // Don't revoke cached URLs
      const isCached = audioURL.includes('cached');
      if (!isCached) URL.revokeObjectURL(audioURL);
    }
    audioURL = url;

    wavesurfer.load(url);
  }

  function togglePlay() {
    if (!currentSong) return;
    wavesurfer.playPause();
  }

  function play() {
    if (!currentSong) return;
    wavesurfer.play();
  }

  function pause() {
    wavesurfer.pause();
  }

  function skipForward(seconds = 10) {
    if (!currentSong) return;
    const newTime = Math.min(currentTime + seconds, duration);
    wavesurfer.seekTo(newTime / duration);
    currentTime = newTime;
    updateProgressBar();
  }

  function skipBackward(seconds = 10) {
    if (!currentSong) return;
    const newTime = Math.max(currentTime - seconds, 0);
    wavesurfer.seekTo(newTime / duration);
    currentTime = newTime;
    updateProgressBar();
  }

  function seekTo(time) {
    if (!currentSong) return;
    wavesurfer.seekTo(time / duration);
    currentTime = time;
    updateProgressBar();
  }

  function setVolume(vol) {
    wavesurfer.setVolume(vol);
  }

  // UI Updates
  function updateNowPlaying(song) {
    if (els.nowPlayingTitle) els.nowPlayingTitle.textContent = song.title;
    if (els.nowPlayingArtist) els.nowPlayingArtist.textContent = song.artist;
    if (els.nowPlayingCover) {
      els.nowPlayingCover.style.background = song.coverColor;
      els.nowPlayingCover.style.borderColor = song.accentColor;
    }
    if (els.waveformContainer) {
      els.waveformContainer.style.setProperty('--accent', song.accentColor);
    }
    document.documentElement.style.setProperty('--player-accent', song.accentColor);
    document.documentElement.style.setProperty('--player-cover', song.coverColor);
  }

  function updateProgressBar() {
    if (els.progressBar) {
      const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
      els.progressBar.style.width = pct + '%';
    }
    if (els.currentTimeEl) {
      els.currentTimeEl.textContent = formatTime(currentTime);
    }
    if (els.totalTimeEl) {
      els.totalTimeEl.textContent = formatTime(duration);
    }
  }

  function updateDurationDisplay() {
    if (els.totalTimeEl) {
      els.totalTimeEl.textContent = formatTime(duration);
    }
  }

  function updatePlayButton() {
    if (els.playBtn) {
      els.playBtn.innerHTML = isPlaying ? '⏸' : '▶';
      els.playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    }
  }

  function formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function bindControls() {
    if (els.playBtn) els.playBtn.addEventListener('click', togglePlay);
    if (els.prevBtn) els.prevBtn.addEventListener('click', () => skipBackward(10));
    if (els.nextBtn) els.nextBtn.addEventListener('click', () => skipForward(10));

    // Progress bar click-to-seek
    if (els.progressContainer) {
      els.progressContainer.addEventListener('click', (e) => {
        if (!currentSong) return;
        const rect = els.progressContainer.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        seekTo(pct * duration);
      });
    }

    // Volume control
    if (els.volumeSlider) {
      els.volumeSlider.addEventListener('input', (e) => {
        setVolume(parseFloat(e.target.value));
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Don't capture when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward(5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward(5);
          break;
      }
    });
  }

  function destroy() {
    if (wavesurfer) {
      wavesurfer.destroy();
      wavesurfer = null;
    }
    if (audioURL && audioURL.startsWith('blob:')) {
      // Check if it's not a cached session URL
      if (!sessionStorage.getItem(`blob-url-${currentSong?.id}`)) {
        URL.revokeObjectURL(audioURL);
      }
    }
  }

  function getCurrentSong() { return currentSong; }
  function getIsPlaying() { return isPlaying; }
  function getCurrentTime() { return currentTime; }
  function getDuration() { return duration; }

  return {
    init, loadSong, togglePlay, play, pause,
    skipForward, skipBackward, seekTo, setVolume,
    getCurrentSong, getIsPlaying, getCurrentTime, getDuration,
    destroy
  };
})();
