// Simulated collaborative playlist — periodic updates from mock "other users"
const CollaborativePlaylist = (() => {
  const UPDATE_INTERVAL = 15000; // 15 seconds between simulated updates
  let playlist = [];
  let updateCallback = null;
  let timerId = null;
  let eventLog = [];

  function init(initialPlaylist, onUpdate) {
    playlist = initialPlaylist.map(t => ({ ...t }));
    updateCallback = onUpdate;
    startSimulation();
  }

  function startSimulation() {
    timerId = setInterval(simulateUpdate, UPDATE_INTERVAL);
  }

  function stopSimulation() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function simulateUpdate() {
    const action = pickAction();
    switch (action.type) {
      case 'add':
        simulateAdd();
        break;
      case 'remove':
        simulateRemove();
        break;
      case 'reorder':
        simulateReorder();
        break;
      default:
        simulateAdd();
    }
  }

  function pickAction() {
    const rand = Math.random();
    if (rand < 0.5) return { type: 'add' };
    if (rand < 0.8) return { type: 'remove' };
    return { type: 'reorder' };
  }

  function simulateAdd() {
    const user = pickRandomUser();
    // Pick a song not already in the playlist
    const existingIds = new Set(playlist.map(s => s.id));
    const available = MOCK_SONGS.filter(s => !existingIds.has(s.id));
    if (available.length === 0) return;

    const song = available[Math.floor(Math.random() * available.length)];
    const entry = {
      ...song,
      addedAt: Date.now(),
      addedBy: user.name
    };

    const insertPos = Math.floor(Math.random() * (playlist.length + 1));
    playlist.splice(insertPos, 0, entry);

    logEvent({ type: 'add', song, user, position: insertPos });
    notifyUpdate();
  }

  function simulateRemove() {
    // Don't remove the currently playing song (assume it's at index 0 or check)
    const removableIndexes = playlist
      .map((s, i) => ({ song: s, idx: i }))
      .filter(({ song }) => song.addedBy !== 'You')
      .map(({ idx }) => idx);

    if (removableIndexes.length === 0) return;

    const idx = removableIndexes[Math.floor(Math.random() * removableIndexes.length)];
    const removed = playlist[idx];
    playlist.splice(idx, 1);
    logEvent({ type: 'remove', song: removed, position: idx });
    notifyUpdate();
  }

  function simulateReorder() {
    if (playlist.length < 3) return;
    const user = pickRandomUser();
    const from = Math.floor(Math.random() * playlist.length);
    let to = Math.floor(Math.random() * playlist.length);
    if (from === to) to = (to + 1) % playlist.length;

    const [item] = playlist.splice(from, 1);
    playlist.splice(to, 0, item);
    logEvent({ type: 'reorder', from, to, user });
    notifyUpdate();
  }

  function pickRandomUser() {
    return COLLAB_USERS[Math.floor(Math.random() * COLLAB_USERS.length)];
  }

  function logEvent(event) {
    eventLog.unshift({ ...event, timestamp: Date.now() });
    if (eventLog.length > 20) eventLog.pop();
    renderEventToast(event);
  }

  function renderEventToast(event) {
    const container = document.querySelector('#collab-toasts');
    if (!container) return;

    let msg = '';
    if (event.type === 'add') {
      msg = `<strong>${event.user.avatar} ${event.user.name}</strong> added <em>${event.song.title}</em>`;
    } else if (event.type === 'remove') {
      msg = `<strong>${event.user?.avatar || '👤'} ${event.user?.name || 'Someone'}</strong> removed a track`;
    } else if (event.type === 'reorder') {
      msg = `<strong>${event.user.avatar} ${event.user.name}</strong> reordered the playlist`;
    }

    const toast = document.createElement('div');
    toast.className = 'collab-toast';
    toast.innerHTML = msg;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('show'));

    // Remove after a few seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function notifyUpdate() {
    if (updateCallback) {
      updateCallback([...playlist]);
    }
  }

  function getPlaylist() {
    return [...playlist];
  }

  function addSong(song) {
    const existingIds = new Set(playlist.map(s => s.id));
    if (existingIds.has(song.id)) return false;

    playlist.push({
      ...song,
      addedAt: Date.now(),
      addedBy: 'You'
    });
    notifyUpdate();
    return true;
  }

  function removeSong(songId) {
    const idx = playlist.findIndex(s => s.id === songId);
    if (idx === -1) return false;
    playlist.splice(idx, 1);
    notifyUpdate();
    return true;
  }

  return { init, getPlaylist, addSong, removeSong, stopSimulation };
})();
