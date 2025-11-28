# Advanced Sample 페이지용 v0.dev 프롬프트

## 🎯 개요

이 문서는 `http://localhost:3000/test/advanced-sample` 페이지에 직접 적용할 수 있는 구체적인 v0.dev 프롬프트들입니다. 현재 페이지의 각 섹션을 개선하기 위한 즉시 사용 가능한 프롬프트를 제공합니다.

---

## 📊 1. 통계 카드 개선 프롬프트

### 현재 문제: 통계 카드 디자인이 일관성 없음

```
Create modern statistics cards for a counseling management system with:

**Card Design:**
- Clean iOS-style cards with white background
- Border radius: 12px
- Subtle shadow: 0 2px 8px rgba(0, 0, 0, 0.1)
- Padding: 24px
- Hover effect: scale(1.02) with enhanced shadow

**Content Layout:**
1. Top row: Icon (left) + Trend indicator (right)
2. Middle: Large value (24px, bold)
3. Bottom: Title label (14px, gray)
4. Sparkline: Small chart at bottom (48px height)

**Color Scheme:**
- Olive Green (#6B7C32): Total Users, Main Metrics
- Sage Green (#9CAF88): Completed Consultations, Success
- Moss Green (#8FBC8F): Health Metrics, Growth
- Warm Beige (#C19A6B): Satisfaction Rating, Attention
- Cream (#F5F5DC): Background, Neutral Elements

**Icons:**
- Users: 👥
- Sessions: 💬
- Consultations: ✅
- Rating: ⭐

**Trend Indicators:**
- Positive: Green arrow up with percentage
- Negative: Red arrow down with percentage
- Neutral: Gray dash

**Sparkline Charts:**
- Simple line charts showing 7-day trend
- Color matches card theme
- Smooth curves with 2px stroke
- Opacity: 0.6

**Responsive:**
- 4 columns desktop, 2 tablet, 1 mobile
- Consistent spacing with CSS Grid
- Mobile: stacked layout with full width

**Interactive:**
- Click to show detailed view
- Smooth transitions (0.3s ease)
- Loading skeleton animation
- Hover states with subtle glow
```

---

## 🎨 2. 글래스모피즘 섹션 프롬프트

### 현재 문제: 글래스모피즘 효과가 부자연스러움

```
Create a sophisticated glassmorphism statistics section with:

**Background Design:**
- Watercolor-inspired gradient background
- Colors: Olive greens, sage greens, and creams
- Animated gradient flow (subtle movement)
- Darker, more intense olive tones for depth
- Multiple radial gradients for organic feel

**Glass Cards:**
- Semi-transparent cream background: rgba(245, 245, 220, 0.25)
- Backdrop filter: blur(12px)
- Border: rgba(107, 124, 50, 0.2) - olive border
- Border radius: 16px
- Subtle olive-tinted inner shadow

**Card Content:**
- Dark olive text (#4A5A1F) for contrast
- Icons with olive green watercolor-like backgrounds
- Trend indicators with sage and moss green colors
- Sparkline charts with olive green transparency
- Smooth hover animations with earth tones

**Icon Styling:**
- Circular backgrounds with rgba colors
- Olive: rgba(107, 124, 50, 0.2)
- Sage: rgba(156, 175, 136, 0.2)
- Moss: rgba(143, 188, 143, 0.2)
- Beige: rgba(210, 180, 140, 0.2)

**Animations:**
- Gentle floating animation (2s ease-in-out infinite)
- Background color flow animation
- Hover effects: enhanced glow and scale
- Smooth transitions for all interactions

**Layout:**
- 4-column responsive grid
- Consistent spacing: 24px gap
- Mobile: single column with full width
- Proper padding and margins
```

---

## 📋 3. 테이블 컴포넌트 프롬프트

### 현재 문제: 테이블 디자인이 현대적이지 않음

```
Create a modern data table for user management with:

**Table Design:**
- Clean, minimal design with iOS aesthetic
- Header background: #f8f9fa
- Row height: 56px
- Border: 1px solid #e5e7eb
- Border radius: 8px
- Subtle shadows for depth

**Interactive Features:**
- Sortable columns with arrow indicators
- Row selection with checkboxes
- Hover effects: #f3f4f6 background
- Selected rows: #eff6ff background with blue border
- Smooth transitions (0.2s ease)

**Column Headers:**
- Font weight: 600
- Text color: #374151
- Sort icons: up/down arrows
- Click to sort functionality
- Visual feedback on hover

**Data Rows:**
- Alternating row colors for readability
- Consistent padding: 16px
- Text color: #111827
- Status badges with color coding
- Action buttons in last column

**Status Badges:**
- Active: Green background (#10b981), white text
- Inactive: Gray background (#6b7280), white text
- Pending: Yellow background (#f59e0b), white text
- Border radius: 12px
- Padding: 4px 8px
- Font size: 12px

**Pagination:**
- Clean pagination controls
- Page size selector
- Page numbers with ellipsis
- Previous/Next buttons
- Total count display

**Mobile Responsive:**
- Horizontal scroll on small screens
- Card layout for mobile
- Touch-friendly interactions
- Collapsible columns
```

---

## 📝 4. 폼 컴포넌트 프롬프트

### 현재 문제: 폼 디자인이 일관성 없음

```
Create a comprehensive form component with iOS-style design:

**Form Container:**
- White background with subtle shadow
- Border radius: 12px
- Padding: 32px
- Max width: 500px
- Centered layout

**Input Fields:**
- Height: 44px (iOS standard)
- Border radius: 8px
- Padding: 12px 16px
- Font size: 16px (prevents mobile zoom)
- Border: 1px solid #d1d5db
- Background: white

**Input States:**
- Default: Gray border (#d1d5db)
- Focus: Blue border (#007aff) with subtle glow
- Error: Red border (#ff3b30) with error message
- Success: Green border (#34c759)
- Disabled: Gray background (#f9fafb)

**Labels:**
- Floating label animation
- Required field indicator (*)
- Helper text below inputs
- Error messages in red
- Font weight: 500

**Form Groups:**
- Consistent spacing: 24px between fields
- Proper label-input association
- Error state handling
- Success state indicators

**Buttons:**
- Primary: iOS blue (#007aff)
- Secondary: Transparent with border
- Full width option
- Loading states with spinner
- Proper spacing and alignment

**Validation:**
- Real-time validation feedback
- Error message display
- Success indicators
- Form submission handling
- Accessibility compliance
```

---

## 📈 5. 차트 컴포넌트 프롬프트

### 현재 문제: 차트 디자인이 단조로움

```
Create modern chart components with:

**Chart Container:**
- White background with subtle shadow
- Border radius: 12px
- Padding: 24px
- Responsive sizing
- Clean, minimal design

**Line Chart:**
- Smooth curves with 3px stroke
- iOS system colors for data series
- Grid lines: #f3f4f6
- Axis labels: #6b7280
- Interactive tooltips on hover
- Animation on load

**Bar Chart:**
- Rounded corners (4px)
- Gradient fills
- Consistent spacing
- Hover effects with enhanced colors
- Value labels on bars

**Area Chart:**
- Gradient fills from color to transparent
- Smooth area curves
- Multiple data series support
- Interactive legend
- Responsive design

**Chart Features:**
- Responsive design for all screen sizes
- Interactive tooltips with data details
- Click handlers for data points
- Legend with toggle functionality
- Export capabilities
- Loading states with skeleton

**Color Palette:**
- Primary: #007aff (iOS blue)
- Success: #34c759 (iOS green)
- Warning: #ff9500 (iOS orange)
- Danger: #ff3b30 (iOS red)
- Purple: #5856d6 (iOS purple)

**Animations:**
- Smooth entrance animations
- Hover effects
- Loading transitions
- Data update animations
- Performance optimized
```

---

## 🎛️ 6. 인터랙티브 컴포넌트 프롬프트

### 현재 문제: 상호작용이 부족함

```
Create interactive component showcases with:

**Button Showcase:**
- All button variants and sizes
- Loading states with spinners
- Icon integration examples
- Hover and active states
- Disabled state examples
- Success/error state buttons

**Button Variants:**
- Primary: iOS blue background
- Secondary: Transparent with border
- Success: Green background
- Danger: Red background
- Warning: Orange background
- Ghost: Transparent with text only

**Button Sizes:**
- Small: 32px height
- Medium: 40px height
- Large: 48px height
- Consistent padding and font sizes

**Interactive Features:**
- Smooth hover animations
- Active state feedback
- Loading spinners
- Icon animations
- Click ripple effects
- Focus states for accessibility

**Form Interactions:**
- Real-time validation
- Input focus states
- Error message animations
- Success state indicators
- Form submission feedback
- Auto-save functionality

**Table Interactions:**
- Row selection animations
- Sort indicator animations
- Pagination transitions
- Search highlighting
- Filter animations
- Export progress indicators

**Chart Interactions:**
- Hover tooltip animations
- Data point selection
- Legend toggle effects
- Zoom and pan controls
- Animation controls
- Responsive interactions
```

---

## 🎨 7. 전체 페이지 레이아웃 프롬프트

### 현재 문제: 전체적인 레이아웃이 일관성 없음

```
Create a cohesive advanced sample page layout with:

**Page Structure:**
- Sticky header with navigation tabs
- Main content area with sections
- Consistent spacing throughout
- Responsive grid system
- Smooth transitions between sections

**Header Design:**
- Clean, minimal header
- Logo with MindGarden branding
- Tab navigation with icons
- Mobile hamburger menu
- Sticky positioning with backdrop blur

**Tab Navigation:**
- Overview, Table, Form, Chart tabs
- Active state indicators
- Smooth transitions
- Icon + text labels
- Mobile-friendly design

**Content Sections:**
1. Statistics Dashboard
2. Glassmorphism Section
3. Interactive Components
4. Form Demonstrations
5. Chart Gallery
6. Table Examples

**Section Spacing:**
- Consistent 48px between sections
- Proper padding for content
- Visual separators where needed
- Responsive spacing adjustments

**Grid System:**
- 12-column grid on desktop
- 8-column grid on tablet
- 4-column grid on mobile
- Consistent gap spacing
- Flexible item sizing

**Color Consistency:**
- Primary: #007aff (iOS blue)
- Success: #34c759 (iOS green)
- Warning: #ff9500 (iOS orange)
- Danger: #ff3b30 (iOS red)
- Neutral: #6b7280 (gray)
- Background: #f8f9fa (light gray)

**Typography:**
- Font family: -apple-system, BlinkMacSystemFont
- Headings: 600 weight
- Body text: 400 weight
- Consistent line heights
- Proper text hierarchy

**Responsive Design:**
- Mobile-first approach
- Breakpoints: 768px, 1024px
- Flexible layouts
- Touch-friendly interactions
- Optimized for all devices
```

---

## 🚀 사용 가이드

### 1. 프롬프트 적용 순서
1. **통계 카드** → 전체적인 디자인 일관성 확보
2. **글래스모피즘 섹션** → 특별한 효과 구현
3. **테이블 컴포넌트** → 데이터 표시 개선
4. **폼 컴포넌트** → 사용자 입력 경험 향상
5. **차트 컴포넌트** → 데이터 시각화 개선
6. **전체 레이아웃** → 페이지 전체 통합

### 2. v0.dev 사용 팁
- 각 프롬프트를 개별적으로 실행
- 생성된 코드를 기존 컴포넌트와 비교
- CSS 변수 활용 확인
- 반응형 디자인 테스트
- 접근성 속성 확인

### 3. 통합 체크리스트
- [ ] 색상 일관성 확인
- [ ] 간격 시스템 적용
- [ ] 반응형 디자인 테스트
- [ ] 접근성 요구사항 충족
- [ ] 애니메이션 성능 확인
- [ ] 한국어 텍스트 적용
- [ ] 기존 시스템과 호환성 확인

이 프롬프트들을 순차적으로 적용하면 `/test/advanced-sample` 페이지가 현대적이고 일관성 있는 디자인으로 개선됩니다.
