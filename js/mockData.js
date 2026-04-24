// Mock song database with lyrics for the music streaming UI
const MOCK_SONGS = [
  {
    id: 'song-001',
    title: 'Neon Lights',
    artist: 'Synthwave Collective',
    album: 'Digital Dreams',
    duration: 28,
    genre: 'electronic',
    coverColor: '#1a0033',
    accentColor: '#ff00ff',
    lrc: `[ti:Neon Lights]
[ar:Synthwave Collective]
[al:Digital Dreams]
[length:00:28]
[00:00.00] ♪ instrumental ♪
[00:02.50] Neon lights across the skyline
[00:06.20] Pulsing through the city grid
[00:09.80] Electric dreams in real time
[00:13.40] The future's what we always did
[00:17.00] Glowing rivers made of data
[00:20.60] Streaming down the boulevard
[00:24.20] We're living in the after
[00:27.80] A world we made from broken stars`
  },
  {
    id: 'song-002',
    title: 'Midnight Jazz',
    artist: 'Blue Note Revival',
    album: 'After Hours',
    duration: 30,
    genre: 'jazz',
    coverColor: '#0a0a2e',
    accentColor: '#gold',
    lrc: `[ti:Midnight Jazz]
[ar:Blue Note Revival]
[al:After Hours]
[length:00:30]
[00:00.00] ♪ piano intro ♪
[00:03.00] It's a quarter past midnight
[00:06.50] The club is filled with smoke and sound
[00:10.20] Saxophone crying in the dim light
[00:14.00] Lost souls are gathered all around
[00:18.00] Bass walks slow across the floorboards
[00:22.00] Each note a secret left untold
[00:26.00] This is where the heart restores
[00:29.50] Stories that can't be bought or sold`
  },
  {
    id: 'song-003',
    title: 'Summer Breeze',
    artist: 'Coastal Acoustic',
    album: 'Shoreline',
    duration: 26,
    genre: 'acoustic',
    coverColor: '#1b3a2d',
    accentColor: '#ffd700',
    lrc: `[ti:Summer Breeze]
[ar:Coastal Acoustic]
[al:Shoreline]
[length:00:26]
[00:00.00] ♪ guitar strumming ♪
[00:02.00] Salt in the air and sand on my feet
[00:05.80] The ocean hums a lullaby so sweet
[00:09.50] Palm trees swaying in the golden heat
[00:13.20] Every worry fades, life is complete
[00:17.00] Summer breeze carries our song
[00:20.80] To places where we all belong
[00:24.50] The shoreline's where I'm strong`
  },
  {
    id: 'song-004',
    title: 'Gravity',
    artist: 'Atlas Rising',
    album: 'Orbit',
    duration: 32,
    genre: 'rock',
    coverColor: '#1a1a1a',
    accentColor: '#ff4444',
    lrc: `[ti:Gravity]
[ar:Atlas Rising]
[al:Orbit]
[length:00:32]
[00:00.00] ♪ guitar riff ♪
[00:03.00] They said the world would pull us down
[00:06.60] But we learned to wear the crown
[00:10.20] Every force that tried to break us
[00:13.80] Only taught us how to shake the dust
[00:17.50] Gravity won't hold me tonight
[00:21.50] I'm breaking through the atmosphere
[00:25.50] Nothing's gonna ground this flight
[00:29.00] The weight just disappears`
  },
  {
    id: 'song-005',
    title: 'Lo-Fi Study Beats',
    artist: 'Chillhop Academy',
    album: 'Focus Sessions',
    duration: 35,
    genre: 'lofi',
    coverColor: '#2d1b4e',
    accentColor: '#9b59b6',
    lrc: `[ti:Lo-Fi Study Beats]
[ar:Chillhop Academy]
[al:Focus Sessions]
[length:00:35]
[00:00.00] ♪ lo-fi intro ♪
[00:03.00] Rain against the window pane
[00:07.00] Typewriter keys and coffee stains
[00:11.00] Lost inside a book so deep
[00:15.00] Promises the mind will keep
[00:19.00] Hours pass like gentle streams
[00:23.00] Building castles out of dreams
[00:27.00] Every page a stepping stone
[00:31.00] In this quiet world alone`
  },
  {
    id: 'song-006',
    title: 'Renaissance',
    artist: 'Vivaldi Reimagined',
    album: 'Classical Crossroads',
    duration: 30,
    genre: 'classical',
    coverColor: '#2c1810',
    accentColor: '#d4a574',
    lrc: `[ti:Renaissance]
[ar:Vivaldi Reimagined]
[al:Classical Crossroads]
[length:00:30]
[00:00.00] ♪ strings ensemble ♪
[00:04.00] Dawn breaks over marble halls
[00:08.00] Frescoed angels on the walls
[00:12.00] Centuries of art and sound
[00:16.00] Where beauty's echoes still resound
[00:20.00] Harpsichord and violin
[00:24.00] Weave through time and draw us in
[00:28.00] The past is present once again`
  },
  {
    id: 'song-007',
    title: 'Urban Flow',
    artist: 'Street Poetry',
    album: 'Concrete Jungle',
    duration: 27,
    genre: 'hiphop',
    coverColor: '#1c1c1c',
    accentColor: '#00ff88',
    lrc: `[ti:Urban Flow]
[ar:Street Poetry]
[al:Concrete Jungle]
[length:00:27]
[00:00.00] ♪ beat drops ♪
[00:02.00] Concrete jungle where the dreams are made of
[00:05.50] Every corner tells a story written in the pavement
[00:09.00] Rise above the noise, find your voice and raise it
[00:12.50] Hard work and hustle, that's the daily cadence
[00:16.00] From the underground to the skyline view
[00:19.50] Every step I take, I'm breaking through
[00:23.00] This city's heartbeat keeps me true`
  },
  {
    id: 'song-008',
    title: 'Desert Wind',
    artist: 'Nomad Souls',
    album: 'Wanderer',
    duration: 29,
    genre: 'world',
    coverColor: '#3d2b1f',
    accentColor: '#ff8c00',
    lrc: `[ti:Desert Wind]
[ar:Nomad Souls]
[al:Wanderer]
[length:00:29]
[00:00.00] ♪ oud intro ♪
[00:03.00] Across the dunes the caravans roll
[00:06.80] Ancient stories that the elders told
[00:10.50] Stars above like diamonds in the coal
[00:14.20] The desert wind it calls my soul
[00:18.00] Oasis waters shimmer in the night
[00:21.80] Following the moon's eternal light
[00:25.50] Every journey brings a new insight`
  },
  {
    id: 'song-009',
    title: 'Binary Sunset',
    artist: 'Code Republic',
    album: 'Startup Culture',
    duration: 25,
    genre: 'indie',
    coverColor: '#33001a',
    accentColor: '#ff6699',
    lrc: null
  },
  {
    id: 'song-010',
    title: 'Thunder Road',
    artist: 'Highway Kings',
    album: 'Open Highway',
    duration: 31,
    genre: 'rock',
    coverColor: '#1a0a00',
    accentColor: '#ff6600',
    lrc: null
  },
  {
    id: 'song-011',
    title: 'Ocean Depths',
    artist: 'Aquatica',
    album: 'Abyss',
    duration: 33,
    genre: 'ambient',
    coverColor: '#001a2e',
    accentColor: '#00ccff',
    lrc: null
  },
  {
    id: 'song-012',
    title: 'Golden Hour',
    artist: 'Sunset Collective',
    album: 'Horizons',
    duration: 24,
    genre: 'indie',
    coverColor: '#332200',
    accentColor: '#ffaa00',
    lrc: null
  }
];

// Full playlist with all songs
const INITIAL_PLAYLIST = MOCK_SONGS.map((song, index) => ({
  ...song,
  addedAt: Date.now() - index * 60000,
  addedBy: index < 8 ? 'You' : ['Alice', 'Bob', 'Charlie'][index % 3]
}));

// Collaborative user pool
const COLLAB_USERS = [
  { name: 'Alice', avatar: '👩', color: '#ff6b6b' },
  { name: 'Bob', avatar: '👨', color: '#4ecdc4' },
  { name: 'Charlie', avatar: '🧑', color: '#45b7d1' },
  { name: 'Diana', avatar: '👩‍🎤', color: '#f9ca24' },
  { name: 'Eve', avatar: '👩‍💻', color: '#a29bfe' }
];

// Search index: precompute lowercase tokens for fast matching
const SEARCH_INDEX = MOCK_SONGS.map(song => ({
  id: song.id,
  tokens: [
    song.title.toLowerCase(),
    song.artist.toLowerCase(),
    song.album.toLowerCase(),
    song.genre.toLowerCase()
  ].join(' ')
}));
