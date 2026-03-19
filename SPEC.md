# 电子鱼缸游戏 - Specification

## Project Overview
- **Project Name**: 电子鱼缸 (Electronic Fish Tank)
- **Type**: Interactive SVG Game
- **Core Functionality**: A virtual fish tank with two golden carp that swim around and can be fed by clicking
- **Target Users**: All ages

## Visual Specification

### Fish Tank
- Large transparent container (80% viewport width, 70% viewport height)
- Glass reflection effect using gradient overlays and subtle highlights
- Light blue water fill with slight transparency
- Rounded corners for realistic tank appearance

### Decorative Elements
**Water Plants (6-8 pieces)**
- Green color (#2E8B57, #3CB371)
- Varying heights and leaf shapes
- Slight swaying animation

**Stones (5-7 pieces)**
- Brown/tan colors (#8B7355, #A0522D)
- Various sizes (ellipses)
- Clustered at bottom

### Fish (Golden Carp)
**Both fish have:**
- Body: Golden/orange gradient (#FFD700, #FFA500, #FF8C00)
- Eye: White with black pupil
- Tail: Forked shape with wagging animation
- Tail fin: Animated wagging motion
- Pectoral fins: Subtle animation

**Large Carp**
- Body length: ~120px
- Smooth horizontal swimming motion

**Small Carp**
- Body length: ~80px
- Slightly faster movement, more erratic

### Fish Movement
- Smooth bezier curve animations
- Random direction changes every 3-6 seconds
- Boundary detection (stay within tank)
- Fish face direction of movement

### Tail Fin Animation
- Continuous wagging motion using CSS/SVG animation
- Frequency: ~2-3 waggles per second
- Amplitude: ±15 degrees rotation

## Food/Feed Specification

### Food Pellets
- Small circles (~6px diameter)
- Brown/tan color (#CD853F)
- Fall animation: gentle sinking (2-4 seconds to reach bottom)
- Slight wobble during fall
- Maximum 10 pellets at once

### Feeding Behavior
- Fish detect nearest food pellet
- Swim toward food with acceleration
- Eating animation (mouth opens/closes)
- Food disappears when fish reaches it
- Small "eating" particle effect

## Interaction Specification

### Click to Feed
- Click anywhere in tank
- 3-5 food pellets spawn at click position
- Staggered drop timing (50ms between each)
- Food falls with gravity simulation

### Fish AI
- Idle: Random swimming
- Hungry (food present): Swim toward nearest food
- Eating: Brief pause and mouth animation
- Full: Return to idle swimming

## Technical Implementation

### Structure
- Single HTML file with embedded SVG and JavaScript
- SVG for all graphics (no canvas)
- CSS animations for tail wagging
- JavaScript for game logic, movement, collision

### Animation System
- requestAnimationFrame for smooth updates
- SVG transform for fish positioning
- CSS keyframes for tail animation

## Acceptance Criteria

1. ✅ Fish tank displays with glass reflection effect
2. ✅ Water plants and stones visible at bottom
3. ✅ Two carp with visible body parts (eye, body, tail, fins)
4. ✅ Tail fins wag continuously
5. ✅ Fish swim in random patterns within boundaries
6. ✅ Clicking spawns food pellets that fall
7. ✅ Fish detect and swim toward food
8. ✅ Food disappears when eaten by fish
9. ✅ Smooth 60fps animation
10. ✅ Responsive to different viewport sizes
