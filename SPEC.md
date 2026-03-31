# 捕虫大师 (Bug Catcher Master)

## Project Overview
- **Project Name**: 捕虫大师
- **Type**: 2D Top-down Pixel Art Game
- **Core Functionality**: A nostalgic pixel art bug catching game where players explore a meadow, interact with NPCs, and catch various bugs
- **Target Users**: Casual gamers who enjoy retro-style games

## Visual & Rendering Specification

### Scene Setup
- **View**: Top-down 2D perspective
- **Canvas Size**: 640x480 pixels (scaled 2x for crisp pixels)
- **Pixel Scale**: 4x upscaling for authentic pixel art look
- **Background**: Grass texture with subtle pattern variation

### Art Style
- **Pixel Art**: 16x16 base sprite size
- **Color Palette**: Limited 16-color palette inspired by Game Boy Color
  - Grass Green: #3b5a2c, #5a8a3c
  - Dirt Brown: #8b5a2b, #a06830
  - Water Blue: #306090, #5090c0
  - UI Brown: #5a3a1a, #8a5a2a
  - Text: #f8f8f0, #2a2a20

### Sprites (16x16 pixels each)
1. **Player**: Green cap character with 4-directional walk cycles (4 frames each)
2. **NPCs**: 
   - Old Man (blue outfit) - buggy enthusiast
   - Girl (pink outfit) - flower lover
   - Scientist (white coat) - bug researcher
3. **Bugs**:
   - Butterfly (yellow/orange wings)
   - Beetle (green shell)
   - Firefly (yellow glow)
4. **Bug Net**: Swing animation (3 frames)
5. **Trees**: Dark green circular canopy
6. **Rocks**: Gray/brown stones
7. **Flowers**: Red, yellow, purple small flowers

### UI Elements
- **Bug Counter**: Top-left, shows "🐛 X/20" with pixel font
- **Dialog Box**: Bottom of screen, 80% width, dark brown border, parchment background
- **Interaction Prompt**: "Press E" appears near NPCs
- **Catch Effect**: Star burst animation on successful catch

## Game World Specification

### Map Layout (40x30 tiles, 16x16 each = 640x480)
- **Grass Base**: Default ground
- **Trees**: 8-12 scattered, impassable
- **Rocks**: 6-8 scattered, impassable
- **Flowers**: 10-15 decorative, passable
- **Pond**: Small water feature in corner, impassable
- **Path**: Dirt path leading to different areas

### NPC Placement
1. Old Man: Center-right area
2. Girl: Bottom-left near flowers
3. Scientist: Top area near a tree

## Interaction Specification

### Player Controls
- **Arrow Keys / WASD**: Move in 4 directions
- **E Key**: Interact with NPCs (when nearby)
- **Space**: Swing bug net (when facing a bug)

### Movement System
- Grid-based movement with smooth interpolation
- Walk speed: 2 pixels per frame
- 4-directional facing (independent of movement direction for interaction)
- Walking animation: 4 frames, 150ms per frame

### NPC Interaction
- Proximity detection: 32 pixels radius
- Visual prompt appears when in range
- Each NPC has unique dialogue (3-4 lines each)
- Dialogue advances with E key press

### Bug Catching System
- **Spawn Rate**: New bug every 5-8 seconds
- **Max Bugs**: 5 on screen at once
- **Catch Range**: 24 pixels from player
- **Catch Direction**: Must be facing the bug
- **Success Rate**: 100% if facing correct direction, 0% otherwise
- **Catch Animation**: 500ms net swing, then bug disappears

## Audio Specification
- No audio (keeping it simple as per requirements)

## Acceptance Criteria

### Visual
- [ ] Canvas renders at 640x480, scaled 2x
- [ ] All sprites display as 16x16 pixel art
- [ ] Player walking animation plays in movement direction
- [ ] Grass background has subtle variation
- [ ] Trees and rocks block player movement

### Gameplay
- [ ] Player moves smoothly with arrow keys/WASD
- [ ] Player cannot walk through obstacles
- [ ] Player faces 4 directions (up/down/left/right)
- [ ] Three NPCs visible and positioned correctly
- [ ] "Press E" prompt appears near NPCs
- [ ] Dialogue box shows when interacting with NPC
- [ ] Space bar swings net (visual feedback)
- [ ] Bugs spawn randomly on grass areas
- [ ] Bugs can be caught when player faces them and presses Space
- [ ] Bug counter increments on successful catch
- [ ] Counter persists (e.g., "Caught: 5 bugs")

### Technical
- [ ] No console errors
- [ ] Smooth 60fps performance
- [ ] Game loop runs continuously
