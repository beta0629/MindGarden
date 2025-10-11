# MindGarden 올리브 그린 색상 시스템 프롬프트

## 🎨 새로운 색상 시스템

### 메인 색상 팔레트
```css
/* 올리브 그린 계열 */
--olive-primary: #6B7C32;        /* 메인 올리브 그린 */
--olive-light: #8B9A4A;          /* 밝은 올리브 */
--olive-dark: #4A5A1F;           /* 어두운 올리브 */
--olive-muted: #7A8A42;          /* 중간 톤 올리브 */

/* 크림/베이지 계열 */
--cream-primary: #F5F5DC;        /* 메인 크림 */
--cream-light: #FEFEF8;          /* 밝은 크림 */
--cream-dark: #E8E8D0;           /* 어두운 크림 */
--beige-primary: #D2B48C;        /* 베이지 */
--beige-light: #E6D3B7;          /* 밝은 베이지 */
--beige-dark: #C19A6B;           /* 어두운 베이지 */

/* 보조 색상 */
--sage-green: #9CAF88;           /* 세이지 그린 */
--moss-green: #8FBC8F;           /* 모스 그린 */
--warm-gray: #8B8680;            /* 웜 그레이 */
--soft-brown: #A0522D;           /* 소프트 브라운 */
```

### 시맨틱 색상 매핑
```css
/* 기본 시스템 색상 */
--color-primary: var(--olive-primary);      /* #6B7C32 */
--color-secondary: var(--beige-primary);    /* #D2B48C */
--color-success: var(--sage-green);         /* #9CAF88 */
--color-warning: var(--beige-dark);         /* #C19A6B */
--color-danger: #CD5C5C;                    /* 인디안 레드 */
--color-info: var(--moss-green);            /* #8FBC8F */

/* 배경 색상 */
--bg-primary: var(--cream-light);           /* #FEFEF8 */
--bg-secondary: var(--cream-primary);       /* #F5F5DC */
--bg-tertiary: var(--beige-light);          /* #E6D3B7 */

/* 텍스트 색상 */
--text-primary: #2F2F2F;                    /* 다크 그레이 */
--text-secondary: var(--warm-gray);         /* #8B8680 */
--text-tertiary: #A0A0A0;                   /* 라이트 그레이 */
--text-on-primary: #FFFFFF;                 /* 화이트 */
```

---

## 📊 1. 올리브 그린 통계 카드 프롬프트

```
Create modern statistics cards with olive green color scheme:

**Card Design:**
- Background: cream white (#FEFEF8)
- Border: subtle olive border (#6B7C32, 20% opacity)
- Border radius: 12px
- Shadow: soft olive-tinted shadow
- Padding: 24px
- Hover effect: gentle scale(1.02) with enhanced olive shadow

**Color Variations:**
1. **Primary Olive**: #6B7C32 - Total Users, Main Metrics
2. **Sage Green**: #9CAF88 - Positive Growth, Success Metrics  
3. **Moss Green**: #8FBC8F - Environmental, Health Metrics
4. **Warm Beige**: #C19A6B - Warning, Attention Metrics

**Icon Styling:**
- Background: matching color with 20% opacity
- Icon color: full saturation version
- Size: 48px circle
- Smooth transitions

**Trend Indicators:**
- Positive: sage green arrow up (#9CAF88)
- Negative: soft red (#CD5C5C) arrow down
- Neutral: warm gray (#8B8680) dash

**Sparkline Charts:**
- Stroke color: matching card theme
- Background: cream with subtle olive tint
- Smooth curves with 2px stroke
- Opacity: 0.7 for subtle effect

**Typography:**
- Value: bold, dark gray (#2F2F2F)
- Label: medium gray (#8B8680)
- Font: system font stack
- Proper hierarchy and spacing
```

---

## 🎨 2. 올리브 그린 글래스모피즘 프롬프트

```
Create sophisticated glassmorphism with olive green theme:

**Background Design:**
- Gradient: olive green to sage green to cream
- Colors: #6B7C32 → #9CAF88 → #F5F5DC
- Organic, watercolor-like flow
- Subtle animation with natural movement
- Multiple radial gradients for depth

**Glass Cards:**
- Background: rgba(245, 245, 220, 0.25) - cream with transparency
- Backdrop filter: blur(12px)
- Border: rgba(107, 124, 50, 0.2) - olive border
- Border radius: 16px
- Inner shadow: subtle olive tint

**Content Styling:**
- Text: dark olive (#4A5A1F) for contrast
- Icons: olive green backgrounds with transparency
- Trend indicators: sage green and moss green
- Sparklines: olive green strokes

**Icon Colors:**
- Olive: rgba(107, 124, 50, 0.2)
- Sage: rgba(156, 175, 136, 0.2)
- Moss: rgba(143, 188, 143, 0.2)
- Beige: rgba(210, 180, 140, 0.2)

**Animations:**
- Gentle floating (3s ease-in-out infinite)
- Background color flow with olive tones
- Hover: enhanced olive glow
- Smooth transitions (0.4s ease)

**Natural Feel:**
- Organic color transitions
- Soft, rounded shapes
- Earth-tone inspired palette
- Calming, therapeutic aesthetic
```

---

## 📋 3. 올리브 그린 테이블 프롬프트

```
Create a modern data table with olive green theme:

**Table Design:**
- Header: cream background (#F5F5DC)
- Rows: alternating cream light (#FEFEF8) and beige light (#E6D3B7)
- Border: olive green (#6B7C32, 15% opacity)
- Border radius: 8px
- Subtle olive-tinted shadows

**Interactive States:**
- Hover: sage green background (#9CAF88, 20% opacity)
- Selected: olive green background (#6B7C32, 15% opacity)
- Active: moss green accent (#8FBC8F)

**Status Badges:**
- Active: sage green background (#9CAF88), white text
- Inactive: warm gray background (#8B8680), white text
- Pending: beige background (#C19A6B), white text
- Success: moss green background (#8FBC8F), white text

**Typography:**
- Headers: olive green text (#6B7C32), 600 weight
- Body text: dark gray (#2F2F2F)
- Secondary text: warm gray (#8B8680)

**Sort Indicators:**
- Active sort: olive green arrows
- Inactive sort: warm gray arrows
- Hover: sage green arrows

**Pagination:**
- Active page: olive green background
- Hover pages: sage green background
- Disabled: warm gray
- Borders: olive green theme
```

---

## 📝 4. 올리브 그린 폼 프롬프트

```
Create iOS-style forms with olive green theme:

**Form Container:**
- Background: cream white (#FEFEF8)
- Border: olive green (#6B7C32, 20% opacity)
- Border radius: 12px
- Shadow: soft olive-tinted shadow
- Padding: 32px

**Input Fields:**
- Background: cream white (#FEFEF8)
- Border: beige (#D2B48C, 40% opacity)
- Border radius: 8px
- Height: 44px
- Padding: 12px 16px

**Input States:**
- Default: beige border (#D2B48C)
- Focus: olive green border (#6B7C32) with subtle glow
- Error: soft red border (#CD5C5C)
- Success: sage green border (#9CAF88)
- Disabled: warm gray background (#F5F5F5)

**Labels:**
- Color: olive green (#6B7C32)
- Required indicator: sage green asterisk (#9CAF88)
- Helper text: warm gray (#8B8680)
- Error text: soft red (#CD5C5C)

**Buttons:**
- Primary: olive green background (#6B7C32), white text
- Secondary: transparent, olive green border and text
- Success: sage green background (#9CAF88), white text
- Danger: soft red background (#CD5C5C), white text

**Validation:**
- Real-time feedback with olive green theme
- Success indicators in sage green
- Error messages in soft red
- Smooth transitions between states
```

---

## 📈 5. 올리브 그린 차트 프롬프트

```
Create charts with olive green color palette:

**Chart Container:**
- Background: cream white (#FEFEF8)
- Border: olive green accent (#6B7C32, 15% opacity)
- Border radius: 12px
- Padding: 24px

**Data Series Colors:**
1. Primary: #6B7C32 (olive green)
2. Secondary: #9CAF88 (sage green)
3. Tertiary: #8FBC8F (moss green)
4. Quaternary: #C19A6B (warm beige)
5. Quinary: #D2B48C (beige)

**Chart Elements:**
- Grid lines: beige light (#E6D3B7, 30% opacity)
- Axis labels: warm gray (#8B8680)
- Data points: olive green with white centers
- Lines: 3px stroke with olive green
- Areas: olive green gradients to transparent

**Interactive Features:**
- Hover: enhanced olive green with glow
- Tooltips: cream background with olive border
- Legend: olive green theme
- Selection: sage green highlight

**Animations:**
- Smooth olive green transitions
- Natural, organic movement
- Loading animations with earth tones
- Hover effects with sage green accents

**Responsive Design:**
- Maintains olive green theme on all sizes
- Touch-friendly interactions
- Consistent color application
- Mobile-optimized tooltips
```

---

## 🎛️ 6. 올리브 그린 인터랙티브 컴포넌트 프롬프트

```
Create interactive components with olive green theme:

**Button Variants:**
- Primary: olive green (#6B7C32) background, white text
- Secondary: transparent, olive green border and text
- Success: sage green (#9CAF88) background, white text
- Warning: warm beige (#C19A6B) background, white text
- Danger: soft red (#CD5C5C) background, white text
- Ghost: transparent, warm gray text

**Button States:**
- Default: clean olive green
- Hover: darker olive (#4A5A1F) with subtle glow
- Active: pressed olive with scale effect
- Disabled: warm gray with reduced opacity
- Loading: olive green with cream spinner

**Form Interactions:**
- Focus rings: olive green (#6B7C32)
- Validation success: sage green (#9CAF88)
- Validation error: soft red (#CD5C5C)
- Placeholder text: warm gray (#8B8680)

**Table Interactions:**
- Row hover: sage green background (20% opacity)
- Row selection: olive green background (15% opacity)
- Sort indicators: olive green arrows
- Pagination: olive green active states

**Chart Interactions:**
- Data point hover: enhanced olive green
- Legend hover: sage green background
- Tooltip: cream background with olive border
- Selection: moss green highlight

**Animation Themes:**
- Smooth olive green transitions
- Natural, organic movements
- Earth-tone inspired effects
- Calming, therapeutic feel
```

---

## 🎨 7. 올리브 그린 전체 페이지 레이아웃 프롬프트

```
Create cohesive page layout with olive green theme:

**Page Structure:**
- Background: cream white (#FEFEF8)
- Header: cream light (#F5F5DC) with olive accents
- Content: cream white with olive green borders
- Consistent olive green theming throughout

**Header Design:**
- Background: cream light (#F5F5DC)
- Logo: olive green (#6B7C32)
- Navigation: olive green active states
- Border: subtle olive green bottom border

**Tab Navigation:**
- Active tab: olive green background (#6B7C32)
- Inactive tabs: warm gray text (#8B8680)
- Hover: sage green background (#9CAF88, 20% opacity)
- Icons: olive green theme

**Section Dividers:**
- Olive green borders (#6B7C32, 20% opacity)
- Cream backgrounds with olive accents
- Consistent spacing with earth-tone theme

**Color Hierarchy:**
- Primary actions: olive green (#6B7C32)
- Secondary actions: sage green (#9CAF88)
- Accent elements: moss green (#8FBC8F)
- Neutral elements: warm beige (#C19A6B)
- Backgrounds: cream variations (#F5F5DC, #FEFEF8)

**Typography:**
- Headers: olive green (#6B7C32)
- Body text: dark gray (#2F2F2F)
- Secondary text: warm gray (#8B8680)
- Links: sage green (#9CAF88)

**Responsive Design:**
- Maintains olive green theme on all devices
- Touch-friendly olive green interactions
- Consistent earth-tone palette
- Natural, calming aesthetic
```

---

## 🌿 올리브 그린 색상 팔레트 참조

### 메인 색상
- **올리브 그린**: #6B7C32 (Primary)
- **밝은 올리브**: #8B9A4A
- **어두운 올리브**: #4A5A1F

### 보조 색상
- **세이지 그린**: #9CAF88 (Success)
- **모스 그린**: #8FBC8F (Info)
- **웜 베이지**: #C19A6B (Warning)

### 중성 색상
- **크림 라이트**: #FEFEF8 (Background)
- **크림**: #F5F5DC (Secondary Background)
- **베이지 라이트**: #E6D3B7
- **베이지**: #D2B48C
- **웜 그레이**: #8B8680 (Text Secondary)

이 색상 시스템을 사용하면 자연스럽고 차분한 올리브 그린 기반의 상담 센터에 적합한 디자인을 만들 수 있습니다.
