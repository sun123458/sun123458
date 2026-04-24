// Search with autocomplete suggestions
const SearchEngine = (() => {
  const DEBOUNCE_MS = 150;
  const MAX_RESULTS = 6;
  let debounceTimer = null;

  function fuzzyMatch(query, text) {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t.includes(q)) return { score: q.length / t.length, type: 'contains' };

    // Fuzzy character matching
    let qi = 0;
    let gaps = 0;
    let firstMatch = -1;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
      if (t[ti] === q[qi]) {
        if (firstMatch === -1) firstMatch = ti;
        qi++;
      } else if (qi > 0) {
        gaps++;
      }
    }
    if (qi === q.length) {
      const matchLen = t.length - gaps;
      return { score: (q.length / matchLen) - (firstMatch * 0.0001), type: 'fuzzy' };
    }
    return null;
  }

  function search(query) {
    if (!query || query.trim().length < 1) return [];

    const results = [];
    for (const song of MOCK_SONGS) {
      const fields = [song.title, song.artist, song.album, song.genre];
      let bestScore = -1;
      let matchedField = '';

      for (let fi = 0; fi < fields.length; fi++) {
        const match = fuzzyMatch(query, fields[fi]);
        if (match && match.score > bestScore) {
          bestScore = match.score;
          matchedField = ['title', 'artist', 'album', 'genre'][fi];
        }
      }

      if (bestScore >= 0) {
        results.push({
          ...song,
          searchScore: bestScore,
          searchField: matchedField
        });
      }
    }

    results.sort((a, b) => b.searchScore - a.searchScore);
    return results.slice(0, MAX_RESULTS);
  }

  function setupSearchInput(inputEl, resultsEl, onSelect) {
    let selectedIdx = -1;

    inputEl.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        selectedIdx = -1;
        const results = search(inputEl.value);
        renderResults(results, resultsEl, inputEl.value, onSelect);
      }, DEBOUNCE_MS);
    });

    // Keyboard navigation
    inputEl.addEventListener('keydown', (e) => {
      const items = resultsEl.querySelectorAll('.search-result-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
        updateSelection(items, selectedIdx);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx = Math.max(selectedIdx - 1, 0);
        updateSelection(items, selectedIdx);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIdx >= 0 && items[selectedIdx]) {
          const songId = items[selectedIdx].dataset.songId;
          const song = MOCK_SONGS.find(s => s.id === songId);
          if (song) {
            onSelect(song);
            resultsEl.innerHTML = '';
            inputEl.value = '';
          }
        }
      } else if (e.key === 'Escape') {
        resultsEl.innerHTML = '';
        selectedIdx = -1;
      }
    });

    // Close results on outside click
    document.addEventListener('click', (e) => {
      if (!inputEl.contains(e.target) && !resultsEl.contains(e.target)) {
        resultsEl.innerHTML = '';
        selectedIdx = -1;
      }
    });

    // Reopen if input focused and has value
    inputEl.addEventListener('focus', () => {
      if (inputEl.value.trim().length > 0) {
        const results = search(inputEl.value);
        renderResults(results, resultsEl, inputEl.value, onSelect);
      }
    });
  }

  function renderResults(results, container, query, onSelect) {
    if (results.length === 0) {
      container.innerHTML = `<div class="search-no-results">No results for "${query}"</div>`;
      return;
    }
    container.innerHTML = results.map((song, idx) => {
      const highlightedTitle = highlightMatch(song.title, query);
      const highlightedArtist = highlightMatch(song.artist, query);
      return `
        <div class="search-result-item" data-song-id="${song.id}" data-idx="${idx}">
          <div class="sri-cover" style="background:${song.coverColor};border:2px solid ${song.accentColor}">
            <span>🎵</span>
          </div>
          <div class="sri-info">
            <div class="sri-title">${highlightedTitle}</div>
            <div class="sri-artist">${highlightedArtist}</div>
            <div class="sri-meta">${song.album} · ${song.genre} · ${formatDuration(song.duration)}</div>
          </div>
        </div>`;
    }).join('');

    // Click handler on results
    container.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const songId = item.dataset.songId;
        const song = MOCK_SONGS.find(s => s.id === songId);
        if (song) {
          onSelect(song);
          container.innerHTML = '';
          if (document.querySelector('#search-input')) {
            document.querySelector('#search-input').value = '';
          }
        }
      });
    });
  }

  function updateSelection(items, idx) {
    items.forEach(i => i.classList.remove('selected'));
    if (idx >= 0 && items[idx]) {
      items[idx].classList.add('selected');
      items[idx].scrollIntoView({ block: 'nearest' });
    }
  }

  function highlightMatch(text, query) {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    const idx = t.indexOf(q);
    if (idx === -1) {
      // Try character-by-character highlighting for fuzzy
      let result = '';
      let qi = 0;
      for (let ti = 0; ti < text.length; ti++) {
        if (qi < q.length && t[ti] === q[qi]) {
          result += `<mark>${text[ti]}</mark>`;
          qi++;
        } else {
          result += text[ti];
        }
      }
      return result;
    }
    return text.slice(0, idx) + `<mark>${text.slice(idx, idx + q.length)}</mark>` + text.slice(idx + q.length);
  }

  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return { search, setupSearchInput };
})();
