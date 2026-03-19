# Pixel Art Bug Catching Game - Specification

## Project Overview
- **Project Name**: Bug Catcher (捕虫)
- **Type**: 2D top-down pixel art game
- **Core Functionality**: Player explores a world, interacts with NPCs via dialogue, and catches bugs with a net
- **Target Users**: Casual gamers, retro game enthusiasts

## Visual & Rendering Specification

### Canvas Setup
- **Resolution**: 640x480 pixels
- **Pixel Scale**: 2x (each game pixel = 2x2 screen pixels)
- **Target FPS**: 60

### Color Palette (Limited Retro)
- Background grass: #3d5a3d (dark green)
- Grass highlights: #5a7a5a
- Player: #e8c170 (warm tan)
- NPCs: #707070, #909090, #606060 (grays)
- Bugs: #ff6b6b (coral red)
- Net: #8b4513 (brown handle), #c0c0c0 (silver mesh)
- Obstacles (rocks): #5a5a6a, #4a4a5a
- Trees: #2d4a2d (dark green foliage), #5a3a2a (brown trunk)
- UI Background: #1a1a2e (dark blue)
- UI Text: #ffffff

### Scene Elements
- **World Size**: 1280x960 pixels (2x2 screens)
- **Tile Size**: 32x32 pixels (16x16 game pixels)
- **Camera**: Follows player, clamped to world bounds

### Player Character
- Size: 16x16 game pixels (32x32 on screen)
- 4-directional movement (Up, Down, Left, Right)
- Walking animation: 4 frames per direction
- Appearance: Simple humanoid shape with head, body, legs

### NPCs (3 minimum)
- Size: 16x16 game pixels
- Stationary positions
- Simple appearance distinguishing each
- Interaction indicator when player is near

### Obstacles
- Rocks: 32x32 pixels, irregular shapes
- Trees: 48x48 pixels with trunk and canopy
- Fence posts: 16x32 pixels
- Ponds: 64x64 pixels (dark blue, impassable)

### Bugs
- Size: 8x8 game pixels
- Random movement patterns
- Spawn every 3-5 seconds
- Max 10 bugs on screen
- Disappear after 10 seconds if not caught

###捕虫网 (Bug Net)
- Appears when Space is pressed
- Swinging animation
- Catches bug if within range

## Interaction Specification

### Controls
- **Arrow Keys / WASD**: Move player (4 directions)
- **E Key**: Interact with NPC (when in range)
- **Space**: Swing bug net

### NPC Interaction
- Interaction range: 48 pixels
- Visual indicator (floating "E" icon) when in range
- Dialogue box appears centered on screen
- Press E or Space to dismiss dialogue

### Bug Catching
- Net swing range: 32 pixels
- Net swing duration: 300ms
- Successful catch: bug disappears, counter increments, particle effect
- Miss: net swings with whoosh sound

## UI Specification

### HUD Elements
- **Bug Counter**: Top-left corner
  - Format: "🐛 x [count]"
  - Font: Pixel style, 16px
- **Mini-map**: Top-right corner
  - Size: 120x90 pixels
  - Shows player position, NPCs, bugs

### Dialogue Box
- Centered, 400x120 pixels
- Dark semi-transparent background
- NPC name at top
- Dialogue text below
- "Press E to close" hint

## Audio (Optional - Placeholder)
- Step sounds (simple beeps)
- Net swing sound
- Catch success sound

## Game World Layout
```
[Trees and rocks scattered across the map]
[3 NPCs placed at different locations]
[Pond in the center-right area]
[Fence border around edges]
[Spawn points for bugs - random grass areas]
```

## Acceptance Criteria
1. Player moves smoothly in 4 directions with visible walking animation
2. Player cannot walk through obstacles
3. All 3 NPCs can be interacted with via E key
4. Dialogue displays correctly and can be dismissed
5. Bugs spawn randomly and move
6. Space key swings net
7. Catching a bug increments counter
8. Bug counter persists in UI at all times
9. Game runs at stable 60 FPS
10. Camera follows player within world bounds
