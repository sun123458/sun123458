# Particle Rain Background Effect

## Project Overview
- **Type**: Single HTML file with canvas-based animation
- **Core functionality**: A mesmerizing particle rain effect where colorful particles fall like rain, with scroll-controlled density
- **Target users**: Web developers wanting an impressive background effect

## Visual & Rendering Specification

### Scene Setup
- Full-screen canvas covering entire viewport
- Dark gradient background (deep navy to black) for contrast
- No external dependencies - pure vanilla JS + Canvas API

### Particle Properties
- **Shape**: Small circles (radius 1-3px)
- **Colors**: Randomly selected from a curated palette:
  - Cyan: `#00f5ff`
  - Magenta: `#ff00ff`
  - Yellow: `#ffff00`
  - Lime: `#00ff88`
  - Hot pink: `#ff3366`
  - Electric blue: `#3366ff`
- **Opacity**: 0.4 - 0.9 (randomized per particle)
- **Trail effect**: Slight motion blur via semi-transparent background clear

### Animation Parameters
- **Base falling speed**: 1-5 px/frame (adjustable via slider)
- **Wind effect**: Subtle horizontal drift (sine wave)
- **Particle count**: 150-400 based on scroll position

## Simulation Specification

### Physics
- **Gravity**: Particles accelerate downward (gravity factor 0.02)
- **Terminal velocity**: Capped at 8 px/frame
- **Horizontal drift**: `sin(time * 0.5 + particle.x) * 0.3`
- **Reset behavior**: Particle respawns at top when exiting bottom

### Scroll-based Density
- **Scroll range**: 0% to 100% of max scrollable height
- **Density mapping**:
  - 0 scroll: 150 particles (light rain)
  - 50% scroll: 275 particles
  - 100% scroll: 400 particles (heavy rain)

## Interaction Specification

### Controls
- **Speed slider**: Vertical slider on right side (1-10 range)
- **Visual feedback**: Current speed value displayed
- **Control panel**: Frosted glass style, semi-transparent

### Performance Optimizations
- RequestAnimationFrame for smooth 60fps
- Object pooling (no allocation during animation)
- Canvas composite operations for glow effect
- Delta time compensation for consistent speed

## UI Design
- **Control panel position**: Fixed, right side, vertically centered
- **Control style**: Dark frosted glass panel with subtle border
- **Font**: System UI stack for clean appearance
- **Colors**: White text, accent color for active elements

## Acceptance Criteria
1. Particles fall smoothly at 60fps without jank
2. Colors randomly switch between palette options
3. Speed slider visibly changes fall rate in real-time
4. Scrolling down increases particle density noticeably
5. No memory leaks (particle count stays stable)
6. Works on resize (canvas fills new dimensions)
