// Time-synced lyrics display — parses LRC format and syncs with playback
const LyricsDisplay = (() => {
  let lyricsEl = null;
  let activeLines = [];
  let lastActiveIdx = -1;

  function init(container) {
    lyricsEl = container;
  }

  function parseLRC(lrcText) {
    if (!lrcText) return [];

    const lines = lrcText.trim().split('\n');
    const parsed = [];
    const tagRegex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = line.match(tagRegex);
      if (!match) continue;

      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let centis = parseInt(match[3], 10);
      if (centis < 100) centis *= 10; // normalize to milliseconds

      const timeMs = minutes * 60000 + seconds * 1000 + centis;
      let text = line.replace(tagRegex, '').trim();
      if (text === '') text = '♪';

      parsed.push({ timeMs, text });
    }

    return parsed.sort((a, b) => a.timeMs - b.timeMs);
  }

  function loadLyrics(lrcText) {
    activeLines = parseLRC(lrcText);
    lastActiveIdx = -1;
    if (lyricsEl) {
      if (activeLines.length === 0) {
        lyricsEl.innerHTML = `<div class="lyrics-empty"><span>🎵</span><p>No lyrics available</p><p class="lyrics-sub">Sit back and enjoy the music</p></div>`;
      } else {
        lyricsEl.innerHTML = activeLines.map((line, i) =>
          `<div class="lyric-line" data-idx="${i}">${line.text}</div>`
        ).join('');
        lyricsEl.scrollTop = 0;
      }
    }
  }

  function update(currentTimeMs) {
    if (!lyricsEl || activeLines.length === 0) return;

    // Find the current line (the last one whose time <= currentTime)
    let newIdx = -1;
    for (let i = 0; i < activeLines.length; i++) {
      if (activeLines[i].timeMs <= currentTimeMs) {
        newIdx = i;
      } else {
        break;
      }
    }

    if (newIdx !== lastActiveIdx) {
      // Remove old active
      const oldEl = lyricsEl.querySelector('.lyric-line.active');
      if (oldEl) oldEl.classList.remove('active');

      // Set new active
      if (newIdx >= 0) {
        const newEl = lyricsEl.querySelector(`.lyric-line[data-idx="${newIdx}"]`);
        if (newEl) {
          newEl.classList.add('active');
          // Smooth scroll to keep active line in center
          const containerHeight = lyricsEl.clientHeight;
          const lineTop = newEl.offsetTop;
          const scrollTarget = lineTop - containerHeight / 3;
          lyricsEl.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        }
      }

      lastActiveIdx = newIdx;
    }
  }

  function reset() {
    activeLines = [];
    lastActiveIdx = -1;
    if (lyricsEl) {
      lyricsEl.innerHTML = `<div class="lyrics-empty"><span>🎵</span><p>Select a track to see lyrics</p></div>`;
    }
  }

  return { init, loadLyrics, update, reset, parseLRC };
})();
