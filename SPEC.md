# 黄金矿工 - Golden Miner Game Specification

## Project Overview
- **Project Name**: 黄金矿工 (Golden Miner)
- **Type**: 2D Canvas Game
- **Core Functionality**: A fishing-hook mining game where players timing-based mechanics to grab treasures underground
- **Target Users**: Casual gamers, 1-2 players

## Game Modes
- **Single Player**: One player with hook on left side
- **Two Player**: Two players - Player A (left side, 'S' key) and Player B (right side, Down Arrow key)

## Visual & Rendering Specification

### Scene Setup
- **Canvas Size**: 800x600 pixels
- **Background**:
  - Top 100px: Sky (gradient blue)
  - 100-150px: Ground surface (brown earth with grass)
  - 150-600px: Underground (darker earth tones, layered soil)

### Visual Elements
- **Hook/Rope**:
  - Rope: Brown/tan line from anchor point
  - Hook: Metallic gray hook shape
  - Swing arc: ±60 degrees from vertical

- **Color Palette**:
  - Sky: #87CEEB to #E0F4FF gradient
  - Ground: #8B4513 (surface), #654321 (underground)
  - Gold: #FFD700 with #DAA520 highlight
  - Diamond: #B9F2FF with sparkle effect
  - Rock: #808080 to #696969
  - Pig: #FFB6C1 with #FF69B4 accents
  - Bomb: #2F2F2F with red fuse glow

### UI Elements
- **Score Display**: Top-left corner, large bold font
- **Target Score**: "目标: 800" indicator
- **Player Labels**: "玩家A" / "玩家B"
- **Win Screen**: Celebratory animation with particles

## Game Mechanics Specification

### Hook Behavior
- **Swing Speed**: ~1.5 radians/second oscillation
- **Swing Range**: 120 degrees total (±60° from vertical)
- **Hook Speed (going down)**: 5 pixels/frame base
- **Pull Speed Formula**: `baseSpeed / weight`
  - Light (diamond, pig): 8 pixels/frame
  - Medium (small gold): 5 pixels/frame
  - Heavy (large gold): 3 pixels/frame
  - Very Heavy (rock): 2 pixels/frame

### Underground Items

| Item | Weight | Value | Behavior |
|------|--------|-------|----------|
| Diamond (钻石) | 1 | 800 | Sparkle effect, at least 3 per level |
| Pig (小猪) | 1 | 3 | Moves horizontally left/right slowly |
| Large Gold | 5 | 500 | Static |
| Medium Gold | 3 | 200 | Static |
| Small Gold | 2 | 50 | Static |
| Rock (石头) | 6 | 10 | Static |
| Bomb (炸弹) | 1 | 2 | Explosion animation, quick pull |

### Collision Detection
- Circle-based collision for all items
- Hook tip is the collision point
- Items pulled at their center point

### Win Condition
- Player reaches **800 points** to win
- Victory screen with particle effects and "胜利!" message

## Interaction Specification

### Controls
- **Player A (Single/Dual)**:
  - 'S' key: Release hook
  - Position: Left side of screen

- **Player B (Dual only)**:
  - Down Arrow key: Release hook
  - Position: Right side of screen

### Game Flow
1. Title screen with mode selection
2. Game starts with hooks swinging
3. Player presses key to release hook
4. Hook travels in current angle until:
   - Hits an item → pulls it up
   - Goes off screen → returns empty
   - Player presses key again (in single mode)
5. Score updates when item reaches top
6. Repeat until 800 points reached

## Audio (Optional - Visual feedback primary)
- Hook release: whoosh sound
- Item grab: different tones based on value
- Bomb: explosion sound
- Win: celebration fanfare

## Acceptance Criteria

1. ✅ Title screen with Single/Dual player buttons
2. ✅ Hooks swing smoothly in opposite directions
3. ✅ 'S' key (Player A) and Down Arrow (Player B) release hooks
4. ✅ At least 3 diamonds visible underground
5. ✅ All items have correct values and weights
6. ✅ Pigs move horizontally
7. ✅ Bombs cause explosion effect
8. ✅ Score updates correctly on item retrieval
9. ✅ Victory screen at 800 points
10. ✅ Heavier items pull up slower
11. ✅ Hooks return if nothing is caught
