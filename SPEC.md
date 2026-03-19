# Activity Booking System Prototype - Specification

## 1. Project Overview

- **Project Name**: 活动预订系统原型 (Activity Booking System Prototype)
- **Type**: Single HTML file web application
- **Core Functionality**: A complete event booking system with calendar view, interactive seat selection, QR code tickets, and admin dashboard
- **Target Users**: Event attendees and event organizers

## 2. Visual & Rendering Specification

### Layout Structure
- **Header**: Logo, navigation (Events, My Bookings, Admin Dashboard), user info
- **Main Content**: Three main views - Events Calendar, Event Details/Seat Selection, My Bookings
- **Sidebar**: Filters (date range, venue, category)
- **Footer**: Contact info, links

### Color Palette
- Primary: `#6366f1` (Indigo)
- Secondary: `#8b5cf6` (Purple)
- Accent: `#f59e0b` (Amber)
- Background: `#0f172a` (Dark slate)
- Surface: `#1e293b` (Slate)
- Text Primary: `#f8fafc`
- Text Secondary: `#94a3b8`
- Success: `#10b981`
- Error: `#ef4444`
- Selected Seat: `#22c55e` (Green)
- Occupied Seat: `#ef4444` (Red)
- Available Seat: `#6366f1` (Indigo)

### Typography
- Font Family: "SF Pro Display", "PingFang SC", -apple-system, sans-serif
- Headings: Bold, gradient text effect
- Body: Regular weight, high contrast

### Visual Effects
- Glassmorphism cards with backdrop blur
- Subtle box shadows
- Smooth transitions (0.3s ease)
- Gradient backgrounds on interactive elements

## 3. Feature Specification

### 3.1 Calendar View
- Monthly calendar grid display
- Days with events highlighted with colored dots
- Click on day to see events for that date
- Navigation arrows to change months
- Today indicator

### 3.2 Activity/Event Display
- Event cards showing: title, date/time, venue, category, available seats
- Event categories: 音乐会 (Concert), 戏剧 (Theater), 体育 (Sports), 展览 (Exhibition), 喜剧 (Comedy)
- Venues: 国家大剧院, 工人体育场, 梅赛德斯奔驰中心, 上海体育馆

### 3.3 Interactive Seat Selection
- SVG-based venue layout showing seats
- Different sections: VIP, A, B, C (with different pricing)
- Hover effect on seats showing section, row, seat number, price
- Click to select/deselect seats
- Selected seats highlighted in green
- Occupied seats shown in red (disabled)
- Running total display
- Legend for seat status

### 3.4 Booking Flow
1. User selects event from calendar/list
2. User selects seats on SVG map
3. User fills in booking form (name, email, phone)
4. On "Book" - generate QR code ticket
5. Display ticket with QR code and booking details
6. mailto: link to send reminder email

### 3.5 QR Code Ticket
- Generated using qrcode.js library
- Contains: booking reference, event name, date, venue, seat info
- Styled ticket card with event details

### 3.6 Filtering System
- Date filter: Date picker for start/end date
- Venue filter: Dropdown with all venues
- Category filter: Dropdown with all categories
- Clear filters button
- Real-time filter updates

### 3.7 Admin Dashboard
- Statistics cards: Total Bookings, Total Revenue, Popular Events, Occupancy Rate
- Charts: Bookings by category (bar chart), Revenue by venue (horizontal bar)
- Recent bookings table
- Event management: View all events with booking counts

### 3.8 Timezone Handling
- All times displayed with local timezone
- Timezone selector in header
- Events stored in UTC, converted for display
- Shows timezone indicator next to times

### 3.9 My Bookings
- List of user's booked tickets
- QR code display for each booking
- Cancel booking option
- Send reminder email button

## 4. Technical Specification

### Libraries
- QRCode.js for QR code generation (CDN)
- No framework - Vanilla JavaScript
- CSS Grid and Flexbox for layout
- CSS Custom Properties for theming

### Data Structure
```javascript
Event: {
  id, title, description, date, time, venue, category,
  duration, timezone, seatMap: { sections: [...] }
}

Section: {
  id, name, price, rows: [{ seats: [...] }]
}

Seat: {
  id, row, number, status: 'available' | 'occupied' | 'selected'
}

Booking: {
  id, eventId, seats: [...], customerName, email, phone,
  bookingRef, createdAt, qrCodeData
}
```

### State Management
- LocalStorage for persisting bookings
- JavaScript Map/Set for runtime state
- Event-driven updates

## 5. Responsive Breakpoints
- Mobile: < 640px (single column, simplified seat map)
- Tablet: 640px - 1024px (two columns)
- Desktop: > 1024px (full layout with sidebar)

## 6. Acceptance Criteria

1. Calendar displays current month with event indicators
2. Clicking a date shows events for that day
3. Events can be filtered by date, venue, category
4. Seat selection SVG is interactive and shows seat info on hover
5. Selected seats update total price in real-time
6. Booking form validates all fields
7. QR code generates on successful booking
8. Ticket displays with all booking details
9. mailto: link opens email client with pre-filled content
10. Admin dashboard shows accurate statistics
11. All times display with correct timezone
12. Layout is fully responsive
13. No console errors on any interaction
