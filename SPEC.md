# 商品秒杀模块规格文档

## 1. Project Overview

- **Project Name**: Flash Sale Module
- **Type**: Single-page interactive web component
- **Core Functionality**: Real-time countdown flash sale with stock management, purchase limits, and simulated purchase states
- **Target Users**: E-commerce shoppers

## 2. Visual & Rendering Specification

### Layout Structure
- Centered card container (max-width: 480px)
- Product image banner at top
- Countdown timer section
- Stock progress bar
- Purchase limit notice
- Buy button with state changes
- Toast notification system

### Color Palette
- Primary: `#ff3b3b` (urgent red for flash sale)
- Secondary: `#1a1a2e` (dark background)
- Accent: `#ffd700` (gold for highlights)
- Success: `#22c55e` (green)
- Disabled: `#4a4a4a` (gray)
- Background: `#0f0f1a` (deep dark)
- Text: `#ffffff` / `#a0a0a0`

### Typography
- Font: "Noto Sans SC" (Chinese support)
- Countdown numbers: Bold, large size (48px)
- Labels: Small, uppercase

### Visual Effects
- Pulsing animation on countdown when < 1 hour
- Progress bar with gradient fill
- Button hover glow effect
- Shake animation on purchase failure
- Confetti burst on purchase success

## 3. Functional Specification

### Core Features

#### 3.1 Countdown Timer
- Display: DD : HH : MM : SS format
- Updates every second
- When reaches zero: triggers "flash sale started" state
- Visual pulse animation when under 1 hour remaining

#### 3.2 Stock Progress Bar
- Shows current stock / total stock
- Animated fill on load
- Color changes based on percentage:
  - > 50%: Green gradient
  - 20-50%: Yellow gradient
  - < 20%: Red gradient with pulse

#### 3.3 Purchase Limit System
- Display "限购 X 件" notice
- Track user's attempted purchases
- Block purchases exceeding limit
- Show warning toast when limit exceeded

#### 3.4 Buy Button States
- **Before start**: Disabled (gray), shows "即将开始"
- **During sale**: Active (red), shows "立即抢购"
- **During purchase**: Loading spinner, shows "抢购中..."
- **After limit reached**: Disabled, shows "已达上限"

#### 3.5 Purchase Simulation
- 70% success rate
- Random stock decrement (1-3 units on success)
- Success: Green toast "恭喜，抢购成功！"
- Failure: Red toast "抱歉，已抢完！"

### Data Model
```javascript
{
  productName: "iPhone 16 Pro Max",
  originalPrice: 9999,
  salePrice: 7999,
  totalStock: 100,
  currentStock: 100,
  purchaseLimit: 2,
  userPurchased: 0,
  saleStartTime: Date, // Set to 30 seconds from now for demo
  saleEndTime: Date
}
```

### User Interactions
1. Page load → Show countdown to sale start
2. Countdown ends → Enable buy button
3. Click buy →
   - If under limit → Simulate purchase → Show result
   - If at limit → Show warning toast
4. Stock depleted → Disable button, show "已售罄"

## 4. Acceptance Criteria

- [ ] Countdown timer accurately counts down in DD:HH:MM:SS format
- [ ] Button is visually disabled before sale starts
- [ ] Stock bar reflects current stock percentage
- [ ] Purchase limit notice clearly visible
- [ ] Clicking buy when under limit triggers success/failure simulation
- [ ] Clicking buy when at limit shows warning toast
- [ ] Success toast appears on successful purchase
- [ ] Failure toast appears when stock depleted
- [ ] All animations play smoothly at 60fps
- [ ] Responsive layout works on mobile (375px+) and desktop
