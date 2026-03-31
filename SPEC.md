# Scientific Calculator - SPEC.md

## 1. Concept & Vision

A sophisticated scientific calculator that combines retro-futuristic aesthetics with modern functionality. The calculator evokes the feel of a high-end scientific instrument from the 1980s—think HP-42S meets a space-age control panel. It should feel precise, powerful, and satisfying to use, with smooth animations and a responsive interface that makes complex calculations feel effortless.

## 2. Design Language

### Aesthetic Direction
Retro-futuristic scientific instrument aesthetic. Inspired by vintage oscilloscopes and professional measurement equipment—precise grid lines, monospace displays, glowing elements against dark backgrounds.

### Color Palette

**Dark Theme (Default)**
- Background: `#0d1117`
- Surface: `#161b22`
- Display: `#0a0f14`
- Primary: `#58a6ff`
- Accent: `#7ee787`
- Operator: `#ff7b72`
- Function: `#d2a8ff`
- Number: `#c9d1d9`
- Grid: `rgba(88, 166, 255, 0.1)`

**Light Theme**
- Background: `#f6f8fa`
- Surface: `#ffffff`
- Display: `#f0f3f6`
- Primary: `#0969da`
- Accent: `#1a7f37`
- Operator: `#cf222e`
- Function: `#8250df`
- Number: `#24292f`
- Grid: `rgba(9, 105, 218, 0.1)`

**Retro Theme**
- Background: `#2d2a24`
- Surface: `#3d3830`
- Display: `#1a1814`
- Primary: `#f0c040`
- Accent: `#80ff80`
- Operator: `#ff8080`
- Function: `#80c0ff`
- Number: `#e8d8b8`
- Grid: `rgba(240, 192, 64, 0.15)`

### Typography
- Display: `'IBM Plex Mono', 'Fira Code', monospace` - for all numeric displays
- Buttons: `'Space Grotesk', sans-serif` - for UI elements
- Font sizes: Display 2.5rem, History 0.9rem, Buttons 1.1rem

### Spatial System
- Button size: 60px × 50px (desktop), flexible on mobile
- Button gap: 6px
- Container padding: 20px
- Border radius: 8px for containers, 6px for buttons

### Motion Philosophy
- Button press: scale(0.95) with 100ms ease-out
- Result display: subtle pulse animation on new result
- Theme transition: 300ms smooth color transitions
- History items: slide-in from right, 200ms
- Graph drawing: animated point-by-point reveal

## 3. Layout & Structure

### Main Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Theme Toggle: ☀/🌙/🎲]           SCIENTIFIC CALC      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │  Expression: sin(45) + log(100)                │   │
│  │  Result:   1.69897                              │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  [sin] [cos] [tan] [log] [ln]  │  [x²] [xʸ] [√] [π] [e] │
│  [7 ] [8 ] [9 ] [÷ ] [← ]     │  [C ] [AC] [( ] [) ]   │
│  [4 ] [5 ] [6 ] [× ] [^ ]     │  [hist] [graph] [= ]   │
│  [1 ] [2 ] [3 ] [- ] [% ]     │                        │
│  [0 ] [.] [±] [+]             │                        │
├─────────────────────────────────────────────────────────┤
│  HISTORY                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ sin(45) + log(100) = 1.69897                   │   │
│  │ 2^10 = 1024                                    │   │
│  │ sqrt(2) = 1.41421                             │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  FUNCTION PLOTTER                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ y = [________________] [Plot]                  │   │
│  │                                              ┐  │   │
│  │                                              │  │   │
│  │              Canvas Plot Area               │  │   │
│  │                                              │  │   │
│  └──────────────────────────────────────────────┘  │   │
└─────────────────────────────────────────────────────────┘
```

### Responsive Strategy
- Desktop (>768px): Two-column layout with history panel
- Tablet (768px): Stacked layout, full-width buttons
- Mobile (<480px): Compact buttons, collapsible history/graph sections

## 4. Features & Interactions

### Core Calculator
- **Basic operations**: +, -, ×, ÷, ^, %
- **Scientific functions**: sin, cos, tan, asin, acos, atan, log (base 10), ln (natural log)
- **Constants**: π (pi), e (Euler's number)
- **Functions**: sqrt, abs, factorial (!), 10^x (10 power), 2^x, nCr, nPr
- **Parentheses**: Full support for nested expressions
- **Degree/Radian toggle**: Toggle between deg and rad for trig functions

### Shunting-yard Algorithm Implementation
- Tokenizes input into: numbers, operators, functions, parentheses
- Handles implicit multiplication: `2π` → `2×π`
- Supports operator precedence: parentheses > functions > ^ > ×÷ > +-
- Outputs: Reverse Polish Notation (RPN) for evaluation
- Handles unary minus: `-5+3` correctly interpreted

### Error Handling
- Division by zero: Display "Cannot divide by zero"
- Invalid expression: Display "Invalid expression"
- Overflow (>1e15): Display in scientific notation
- Underflow (<1e-10): Display as 0 or scientific notation
- Unmatched parentheses: "Missing parenthesis"

### Keyboard Support
- `0-9`, `.`: Number input
- `+`, `-`, `*`, `/`, `^`: Operators
- `Enter` or `=`: Calculate
- `Backspace`: Delete last character
- `Escape` or `c`: Clear current input
- `(` and `)`: Parentheses
- `s`: sin, `c`: cos, `t`: tan, `l`: log, `n`: ln
- `q`: sqrt, `p`: pi
- `h`: Toggle history panel
- `g`: Toggle graph panel

### History Log
- Stores last 20 calculations
- Click to reuse any previous expression
- Clear history button
- Persists in localStorage

### Function Plotter
- Input field for function (e.g., `x^2`, `sin(x)`, `log(x)`)
- Canvas rendering with coordinate grid
- Auto-scaling based on function values
- Plot bounds: x ∈ [-10, 10] by default
- Multiple functions can be overlaid (different colors)
- Clear plot button

## 5. Component Inventory

### Display Component
- Shows current expression (editable)
- Shows calculated result
- States: empty, typing, result, error
- Error state: red text with shake animation

### Button Component
- States: default, hover, active, disabled
- Categories: number (white/gray), operator (orange/red), function (purple), special (blue)
- Hover: slight brightness increase, subtle glow
- Active: scale down, color darken
- Disabled: 50% opacity

### History Item Component
- Shows expression and result
- Click: loads expression into display
- Delete: removes from history
- Hover: highlight background

### Graph Canvas Component
- Coordinate grid with labels
- Axis lines with tick marks
- Function curve with glow effect
- Zoom controls (+/- buttons)

### Theme Toggle Component
- Three-state toggle: light → dark → retro
- Animated icon transition
- Persists choice in localStorage

## 6. Technical Approach

### Architecture
- Single HTML file with embedded CSS and JavaScript
- Vanilla JavaScript with ES6+ features
- Modular code structure:
  - `CalculatorEngine`: Shunting-yard and evaluation logic
  - `Plotter`: Canvas-based graph rendering
  - `UIController`: DOM manipulation and event handling
  - `ThemeManager`: Theme switching and persistence
  - `HistoryManager`: Calculation history

### Key Algorithms
- **Shunting-yard**: Convert infix to RPN using Dijkstra's algorithm
- **RPN evaluation**: Stack-based evaluation of RPN tokens
- **Graph rendering**: Canvas 2D context with path drawing
- **Expression parsing**: Regex-based tokenizer for numbers, operators, functions

### Data Model
```javascript
{
  expression: string,
  result: number | null,
  isError: boolean,
  timestamp: Date
}
```

### Storage
- Theme preference: localStorage `calc_theme`
- History: localStorage `calc_history` (JSON array, max 20)
