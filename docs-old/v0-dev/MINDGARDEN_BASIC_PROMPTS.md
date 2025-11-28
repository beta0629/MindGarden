# MindGarden 기본 디자인 프롬프트 가이드

## 🎯 개요

이 문서는 `/test/advanced-sample` 페이지에 적용할 수 있는 MindGarden 디자인 시스템 기반의 기본 v0.dev 프롬프트들입니다. 현재 시스템의 디자인 토큰과 일관성을 유지하면서 개선된 UI 컴포넌트를 생성할 수 있습니다.

---

## 🎨 MindGarden 디자인 시스템 토큰

### 핵심 색상 (베이지/크림 메인 테마)
```css
/* 베이지/크림 계열 - 메인 색상 */
--beige-primary: #D2B48C;        /* 메인 베이지 */
--beige-light: #E6D3B7;          /* 밝은 베이지 */
--beige-dark: #C19A6B;           /* 어두운 베이지 */
--cream-primary: #F5F5DC;        /* 메인 크림 */
--cream-light: #FEFEF8;          /* 밝은 크림 */
--warm-sand: #F4E4BC;            /* 웜 샌드 */
--soft-beige: #DDD8C7;           /* 소프트 베이지 */

/* 올리브 그린 계열 - 서브 색상 */
--olive-primary: #6B7C32;        /* 메인 올리브 그린 */
--sage-green: #9CAF88;           /* 세이지 그린 */
--moss-green: #8FBC8F;           /* 모스 그린 */
--warm-gray: #8B8680;            /* 웜 그레이 */

/* 상담사별 색상 (베이지/크림 팔레트) */
--consultant-color-1: #D2B48C;   /* 베이지 */
--consultant-color-2: #F5F5DC;   /* 크림 */
--consultant-color-3: #DDD8C7;   /* 소프트 베이지 */
--consultant-color-4: #F4E4BC;   /* 웜 샌드 */
--consultant-color-5: #6B7C32;   /* 올리브 그린 */
```

### 간격 시스템
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;
```

### 타이포그래피
```css
--font-family-ios: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-size-xs: 10px;
--font-size-sm: 12px;
--font-size-base: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-xxl: 20px;
```

---

## 📱 기본 컴포넌트 프롬프트

### 1. 통계 카드 (MGStats)

```
Create a modern statistics card component with the following specifications:

**Design Requirements:**
- iOS-style design with clean, minimal aesthetic
- Card background: white with subtle shadow
- Border radius: 12px
- Padding: 24px
- Hover effect: gentle scale transform (1.02) with enhanced shadow

**Content Structure:**
1. Icon container (top-left): 48px circle with background color
2. Trend indicator (top-right): arrow with percentage change
3. Main value: large, bold number (24px font)
4. Title: descriptive label below value
5. Sparkline chart: small line chart at bottom

**Color Variations:**
- Beige: #D2B48C (primary metrics)
- Cream: #F5F5DC (positive metrics)
- Soft Beige: #DDD8C7 (health metrics)
- Warm Sand: #F4E4BC (warning metrics)
- Olive Green: #6B7C32 (accent metrics)

**Interactive Elements:**
- Smooth transitions (0.3s ease)
- Hover states with subtle animations
- Click handlers for detailed views
- Loading states with skeleton animation

**Technical Requirements:**
- Use CSS custom properties for theming
- Responsive design (mobile-first)
- Accessibility: proper ARIA labels
- TypeScript interfaces for props
- Sparkline data as array of numbers
```

### 2. 버튼 컴포넌트 (MGButton)

```
Create a comprehensive button component system with:

**Button Variants:**
1. Primary: beige (#D2B48C) background, white text
2. Secondary: transparent background, beige border and text
3. Success: sage green (#9CAF88) background, white text
4. Danger: soft red (#CD5C5C) background, white text
5. Warning: olive green (#6B7C32) background, white text
6. Ghost: transparent background, warm gray text

**Button Sizes:**
- Small: 32px height, 12px font, 12px padding
- Medium: 40px height, 14px font, 16px padding
- Large: 48px height, 16px font, 20px padding

**Design Features:**
- Border radius: 8px
- Font weight: 500 (medium)
- Smooth transitions (0.2s ease)
- Focus states with outline
- Disabled states with reduced opacity
- Loading states with spinner

**Interactive States:**
- Hover: slight background darkening
- Active: scale transform (0.98)
- Focus: 2px outline with primary color
- Disabled: 50% opacity, no interactions

**Technical Requirements:**
- CSS custom properties for theming
- Icon support (left/right positioning)
- Full width option
- Loading spinner integration
- Accessibility compliance
```

### 3. 카드 컴포넌트 (MGCard)

```
Create a versatile card component with:

**Card Variants:**
1. Default: white background, subtle shadow
2. Elevated: enhanced shadow for prominence
3. Outlined: border instead of shadow
4. Glassmorphism: semi-transparent with backdrop blur

**Design Specifications:**
- Background: white (#ffffff)
- Border radius: 12px
- Padding: 24px (default), 16px (compact), 32px (large)
- Shadow: 0 2px 8px rgba(0, 0, 0, 0.1)
- Border: 1px solid rgba(0, 0, 0, 0.08)

**Content Areas:**
1. Header: optional title and actions
2. Body: main content area
3. Footer: optional actions or metadata

**Interactive Features:**
- Hover: enhanced shadow and subtle scale
- Click handlers for card interactions
- Loading states with skeleton content
- Expandable sections with smooth animations

**Glassmorphism Variant:**
- Background: rgba(255, 255, 255, 0.25)
- Backdrop filter: blur(10px)
- Border: rgba(255, 255, 255, 0.18)
- Enhanced transparency effects

**Technical Requirements:**
- Flexible content areas
- Responsive padding adjustments
- CSS custom properties
- Accessibility features
- Animation performance optimization
```

### 4. 폼 컴포넌트 (MGForm)

```
Create a comprehensive form component system with:

**Input Types:**
1. Text input: standard text fields
2. Email input: email validation
3. Password input: show/hide toggle
4. Textarea: multi-line text input
5. Select: dropdown selection
6. Date picker: calendar input
7. Number input: numeric values

**Design Specifications:**
- Input height: 44px (iOS standard)
- Border radius: 8px
- Padding: 12px 16px
- Font size: 16px (prevents zoom on mobile)
- Border: 1px solid #d1d5db
- Focus border: 2px solid #007aff

**States:**
- Default: gray border
- Focus: blue border with subtle glow
- Error: red border with error message
- Success: green border
- Disabled: gray background, no interaction

**Label System:**
- Floating labels that animate up on focus
- Required field indicators (*)
- Helper text below inputs
- Error messages with red color

**Validation Features:**
- Real-time validation feedback
- Error message display
- Success state indicators
- Required field handling
- Custom validation rules

**Technical Requirements:**
- Form state management
- Validation integration
- Accessibility compliance
- Mobile-optimized interactions
- CSS custom properties for theming
```

### 5. 테이블 컴포넌트 (MGTable)

```
Create a modern data table component with:

**Table Features:**
- Sortable columns with indicators
- Row selection (single/multiple)
- Pagination controls
- Search and filtering
- Column resizing
- Responsive design

**Design Specifications:**
- Header background: #f8f9fa
- Row height: 56px
- Border: 1px solid #e5e7eb
- Hover: #f3f4f6 background
- Selected: #eff6ff background with blue border

**Interactive Elements:**
- Sort arrows in headers
- Checkboxes for row selection
- Action buttons in rows
- Expandable rows for details
- Context menus

**Pagination:**
- Page size selector
- Page navigation buttons
- Total count display
- Jump to page input

**Responsive Behavior:**
- Horizontal scroll on mobile
- Collapsible columns
- Card layout for small screens
- Touch-friendly interactions

**Technical Requirements:**
- Virtual scrolling for large datasets
- Keyboard navigation
- Screen reader compatibility
- Export functionality
- Loading states
```

### 6. 차트 컴포넌트 (MGChart)

```
Create a versatile chart component with:

**Chart Types:**
1. Line chart: trend visualization
2. Bar chart: comparison data
3. Pie chart: proportion data
4. Area chart: cumulative data
5. Sparkline: minimal trend lines

**Design Specifications:**
- Chart area: white background
- Grid lines: #f3f4f6
- Data colors: iOS system colors
- Font: system font, 12px
- Border radius: 8px
- Padding: 16px

**Interactive Features:**
- Hover tooltips with data details
- Click handlers for data points
- Zoom and pan capabilities
- Legend with toggle options
- Animation on load

**Data Visualization:**
- Responsive sizing
- Multiple data series support
- Custom color schemes
- Gradient fills for area charts
- Smooth animations

**Technical Requirements:**
- Chart.js or D3.js integration
- Responsive design
- Performance optimization
- Accessibility features
- Export capabilities
```

### 7. 모달 컴포넌트 (MGModal)

```
Create a modal dialog system with:

**Modal Types:**
1. Standard: centered dialog
2. Fullscreen: mobile-optimized
3. Bottom sheet: mobile-friendly
4. Confirmation: simple yes/no
5. Loading: progress indication

**Design Specifications:**
- Backdrop: rgba(0, 0, 0, 0.5) with blur
- Modal: white background, 16px border radius
- Shadow: 0 20px 25px rgba(0, 0, 0, 0.15)
- Max width: 500px (standard), 800px (large)
- Animation: scale and fade in

**Content Structure:**
1. Header: title and close button
2. Body: main content area
3. Footer: action buttons

**Interactive Features:**
- Click outside to close
- ESC key to close
- Focus trap for accessibility
- Smooth animations
- Loading states

**Mobile Optimization:**
- Bottom sheet variant
- Swipe to dismiss
- Touch-friendly sizing
- Safe area handling

**Technical Requirements:**
- Portal rendering
- Focus management
- Keyboard navigation
- Screen reader support
- Animation performance
```

### 8. 로딩 컴포넌트 (MGLoading)

```
Create a comprehensive loading system with:

**Loading Types:**
1. Spinner: rotating circle
2. Skeleton: content placeholders
3. Progress bar: completion indication
4. Pulse: breathing animation
5. Shimmer: sliding highlight

**Design Specifications:**
- Spinner: 32px diameter, 4px stroke
- Color: #007aff (iOS blue)
- Animation: 1s linear infinite
- Skeleton: #f3f4f6 background
- Shimmer: white highlight moving

**Usage Contexts:**
- Page loading: full screen overlay
- Component loading: inline spinner
- Button loading: small spinner
- List loading: skeleton items
- Chart loading: placeholder shapes

**Animation Details:**
- Smooth, natural motion
- Consistent timing functions
- Performance optimized
- Reduced motion support
- Pause on hover

**Technical Requirements:**
- CSS animations
- Accessibility compliance
- Customizable sizes
- Theme integration
- Performance optimization
```

---

## 🎯 샘플 페이지 적용 가이드

### 1. 통계 대시보드 섹션
```
Create a statistics dashboard section with:

**Layout:**
- 4-column grid on desktop
- 2-column grid on tablet
- 1-column grid on mobile
- 24px gap between cards

**Statistics Cards:**
1. 총 사용자: 12,847 (+12% ↗️)
2. 활성 세션: 3,429 (+8% ↗️)
3. 완료된 상담: 8,923 (+15% ↗️)
4. 만족도: 4.8/5 (+0.2 ↗️)

**Design Features:**
- Each card with unique color theme
- Sparkline charts showing trends
- Hover effects with subtle animations
- Loading states with skeleton animation
- Click handlers for detailed views

**Color Scheme:**
- Blue: 총 사용자
- Green: 활성 세션
- Orange: 완료된 상담
- Purple: 만족도
```

### 2. 글래스모피즘 섹션
```
Create a glassmorphism section with:

**Background:**
- Watercolor-inspired gradient
- Subtle animation with flowing colors
- Darker, more intense tones
- Smooth color transitions

**Glass Cards:**
- Semi-transparent white background
- Backdrop filter blur(10px)
- Subtle border with transparency
- Hover effects with enhanced glow

**Content:**
- Statistics cards with glass effect
- Icons with watercolor-like colors
- Trend indicators with soft backgrounds
- Sparkline charts with transparency

**Animation:**
- Gentle floating animation
- Color flow in background
- Smooth hover transitions
- Subtle scale effects
```

### 3. 인터랙티브 컴포넌트 섹션
```
Create an interactive components showcase with:

**Button Showcase:**
- All button variants and sizes
- Loading states demonstration
- Icon integration examples
- Hover and active states

**Form Demo:**
- Complete form with validation
- Different input types
- Error state examples
- Success state indicators

**Table Preview:**
- Sortable columns
- Row selection
- Pagination controls
- Search functionality

**Chart Gallery:**
- Multiple chart types
- Interactive tooltips
- Responsive sizing
- Animation demonstrations
```

---

## 🚀 v0.dev 사용 팁

### 1. 프롬프트 최적화
- 구체적인 색상 코드 제공
- 정확한 크기와 간격 명시
- 상호작용 상태 상세 설명
- 접근성 요구사항 포함

### 2. 통합 가이드
- CSS 변수 활용 강조
- 기존 컴포넌트와 일관성 유지
- 한국어 텍스트 적용
- 모바일 우선 반응형 설계

### 3. 품질 보장
- 모든 컴포넌트에 hover 상태
- 로딩 및 에러 상태 포함
- 접근성 속성 추가
- 성능 최적화 고려

이 가이드를 통해 MindGarden 디자인 시스템과 완벽하게 일치하는 고품질 UI 컴포넌트들을 v0.dev로 생성할 수 있습니다.
