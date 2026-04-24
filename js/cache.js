// Cache API integration for offline playback queue
const OfflineCache = (() => {
  const CACHE_NAME = 'music-stream-cache-v1';
  const QUEUE_KEY = 'offline-queue';
  const MAX_CACHED = 20;

  async function getCache() {
    return caches.open(CACHE_NAME);
  }

  async function cacheSong(song, blob) {
    const cache = await getCache();
    const url = cacheKeyForSong(song);
    const response = new Response(blob, {
      headers: {
        'Content-Type': 'audio/wav',
        'X-Song-Title': encodeURIComponent(song.title),
        'X-Song-Artist': encodeURIComponent(song.artist),
        'X-Song-Duration': song.duration.toString()
      }
    });
    await cache.put(url, response);

    // Track in queue
    const queue = getQueue();
    if (!queue.includes(song.id)) {
      queue.push(song.id);
      if (queue.length > MAX_CACHED) {
        const removed = queue.shift();
        await removeFromCache(removed);
      }
      saveQueue(queue);
    }

    return url;
  }

  async function removeFromCache(songId) {
    const cache = await getCache();
    const song = MOCK_SONGS.find(s => s.id === songId);
    if (song) {
      await cache.delete(cacheKeyForSong(song));
    }
    const queue = getQueue().filter(id => id !== songId);
    saveQueue(queue);
  }

  async function isCached(songId) {
    const cache = await getCache();
    const song = MOCK_SONGS.find(s => s.id === songId);
    if (!song) return false;
    return (await cache.match(cacheKeyForSong(song))) !== undefined;
  }

  async function getCachedBlob(songId) {
    const cache = await getCache();
    const song = MOCK_SONGS.find(s => s.id === songId);
    if (!song) return null;
    const response = await cache.match(cacheKeyForSong(song));
    if (!response) return null;
    return response.blob();
  }

  async function getCachedURL(songId) {
    const song = MOCK_SONGS.find(s => s.id === songId);
    if (!song) return null;

    // Check if we already have a stored blob URL for this session
    const storedKey = `blob-url-${songId}`;
    const stored = sessionStorage.getItem(storedKey);
    if (stored) {
      // Verify it's still valid by checking cache
      const cache = await getCache();
      const match = await cache.match(cacheKeyForSong(song));
      if (match) return stored;
    }

    const blob = await getCachedBlob(songId);
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    sessionStorage.setItem(storedKey, url);
    return url;
  }

  async function getCacheStats() {
    const cache = await getCache();
    const keys = await cache.keys();
    const queue = getQueue();
    return {
      cached: keys.length,
      queued: queue.length,
      max: MAX_CACHED
    };
  }

  async function clearAll() {
    await caches.delete(CACHE_NAME);
    saveQueue([]);
    // Clear session blob URLs
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('blob-url-')) {
        sessionStorage.removeItem(key);
      }
    }
  }

  function cacheKeyForSong(song) {
    return `/cached-audio/${song.id}.wav`;
  }

  function getQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveQueue(queue) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  return { cacheSong, isCached, getCachedBlob, getCachedURL, getCacheStats, clearAll };
})();
