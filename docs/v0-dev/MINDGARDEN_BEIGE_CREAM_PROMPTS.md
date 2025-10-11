# MindGarden 베이지/크림 메인 색상 시스템 프롬프트

## 🎨 새로운 색상 시스템

### 메인 색상 팔레트 (베이지/크림 중심)
```css
/* 베이지/크림 계열 - 메인 색상 */
--cream-primary: #F5F5DC;        /* 메인 크림 */
--cream-light: #FEFEF8;          /* 밝은 크림 */
--cream-dark: #E8E8D0;           /* 어두운 크림 */
--beige-primary: #D2B48C;        /* 메인 베이지 */
--beige-light: #E6D3B7;          /* 밝은 베이지 */
--beige-dark: #C19A6B;           /* 어두운 베이지 */
--warm-sand: #F4E4BC;            /* 웜 샌드 */
--soft-beige: #DDD8C7;           /* 소프트 베이지 */

/* 올리브 그린 계열 - 서브 색상 */
--olive-primary: #6B7C32;        /* 메인 올리브 그린 */
--olive-light: #8B9A4A;          /* 밝은 올리브 */
--olive-dark: #4A5A1F;           /* 어두운 올리브 */
--olive-muted: #7A8A42;          /* 중간 톤 올리브 */
--sage-green: #9CAF88;           /* 세이지 그린 */
--moss-green: #8FBC8F;           /* 모스 그린 */

/* 보조 색상 */
--warm-gray: #8B8680;            /* 웜 그레이 */
--soft-brown: #A0522D;           /* 소프트 브라운 */
--muted-taupe: #B8A082;          /* 뮤트 타우프 */
--dusty-rose: #D4A5A5;           /* 더스티 로즈 */
```

### 시맨틱 색상 매핑
```css
/* 기본 시스템 색상 */
--color-primary: var(--beige-primary);      /* #D2B48C */
--color-secondary: var(--cream-primary);    /* #F5F5DC */
--color-success: var(--sage-green);         /* #9CAF88 */
--color-warning: var(--olive-primary);      /* #6B7C32 */
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

## 📊 1. 베이지/크림 통계 카드 프롬프트

```
Create modern statistics cards with beige/cream main color scheme:

**Card Design:**
- Clean iOS-style cards with warm cream background (#FEFEF8)
- Border: subtle beige border (#D2B48C, 20% opacity)
- Border radius: 12px
- Shadow: soft beige-tinted shadow
- Padding: 24px
- Hover effect: gentle scale(1.02) with enhanced beige shadow

**Color Variations:**
1. **Primary Beige**: #D2B48C - Total Users, Main Metrics
2. **Warm Cream**: #F5F5DC - Positive Growth, Success Metrics  
3. **Soft Beige**: #DDD8C7 - Environmental, Health Metrics
4. **Warm Sand**: #F4E4BC - Warning, Attention Metrics
5. **Olive Green**: #6B7C32 - Accent, Highlight Metrics

**Icon Styling:**
- Background: matching color with 20% opacity
- Icon color: full saturation version
- Size: 48px circle
- Smooth transitions

**Trend Indicators:**
- Positive: warm beige arrow up (#DDD8C7)
- Negative: soft red (#CD5C5C) arrow down
- Neutral: warm gray (#8B8680) dash

**Sparkline Charts:**
- Stroke color: matching card theme
- Background: cream with subtle beige tint
- Smooth curves with 2px stroke
- Opacity: 0.7 for subtle effect

**Typography:**
- Value: bold, dark gray (#2F2F2F)
- Label: medium gray (#8B8680)
- Font: system font stack
- Proper hierarchy and spacing
```

---

## 🎨 2. 베이지/크림 글래스모피즘 프롬프트

```
Create sophisticated glassmorphism with beige/cream theme:

**Background Design:**
- Gradient: cream to warm sand to soft beige
- Colors: #F5F5DC → #F4E4BC → #DDD8C7
- Organic, watercolor-like flow
- Subtle animation with natural movement
- Multiple radial gradients for depth

**Glass Cards:**
- Background: rgba(245, 245, 220, 0.25) - cream with transparency
- Backdrop filter: blur(12px)
- Border: rgba(210, 180, 140, 0.2) - beige border
- Border radius: 16px
- Inner shadow: subtle beige tint

**Content Styling:**
- Text: dark brown (#2F2F2F) for contrast
- Icons with beige watercolor-like backgrounds
- Trend indicators with warm sand and soft beige
- Sparklines with beige transparency

**Icon Colors:**
- Beige: rgba(210, 180, 140, 0.2)
- Cream: rgba(245, 245, 220, 0.2)
- Sand: rgba(244, 228, 188, 0.2)
- Soft Beige: rgba(221, 216, 199, 0.2)
- Olive Accent: rgba(107, 124, 50, 0.2)

**Animations:**
- Gentle floating (3s ease-in-out infinite)
- Background color flow with warm tones
- Hover: enhanced beige glow
- Smooth transitions (0.4s ease)

**Natural Feel:**
- Organic color transitions
- Soft, rounded shapes
- Earth-tone inspired palette
- Calming, therapeutic aesthetic
```

---

## 📋 3. 베이지/크림 테이블 프롬프트

```
Create a modern data table with beige/cream theme:

**Table Design:**
- Header: warm cream background (#F5F5DC)
- Rows: alternating cream light (#FEFEF8) and beige light (#E6D3B7)
- Border: beige (#D2B48C, 15% opacity)
- Border radius: 8px
- Subtle beige-tinted shadows

**Interactive States:**
- Hover: warm sand background (#F4E4BC, 20% opacity)
- Selected: beige background (#D2B48C, 15% opacity)
- Active: olive green accent (#6B7C32)

**Status Badges:**
- Active: warm beige background (#DDD8C7), dark text
- Inactive: warm gray background (#8B8680), white text
- Pending: soft beige background (#DDD8C7), dark text
- Success: sage green background (#9CAF88), white text

**Typography:**
- Headers: beige text (#D2B48C), 600 weight
- Body text: dark gray (#2F2F2F)
- Secondary text: warm gray (#8B8680)

**Sort Indicators:**
- Active sort: beige arrows
- Inactive sort: warm gray arrows
- Hover: warm sand arrows

**Pagination:**
- Active page: beige background
- Hover pages: warm sand background
- Disabled: warm gray
- Borders: beige theme
```

---

## 📝 4. 베이지/크림 폼 프롬프트

```
Create iOS-style forms with beige/cream theme:

**Form Container:**
- Background: cream white (#FEFEF8)
- Border: beige (#D2B48C, 20% opacity)
- Border radius: 12px
- Shadow: soft beige-tinted shadow
- Padding: 32px

**Input Fields:**
- Background: cream white (#FEFEF8)
- Border: beige (#D2B48C, 40% opacity)
- Border radius: 8px
- Height: 44px
- Padding: 12px 16px

**Input States:**
- Default: beige border (#D2B48C)
- Focus: warm beige border (#DDD8C7) with subtle glow
- Error: soft red border (#CD5C5C)
- Success: sage green border (#9CAF88)
- Disabled: warm gray background (#F5F5F5)

**Labels:**
- Color: beige (#D2B48C)
- Required indicator: olive green asterisk (#6B7C32)
- Helper text: warm gray (#8B8680)
- Error text: soft red (#CD5C5C)

**Buttons:**
- Primary: beige background (#D2B48C), white text
- Secondary: transparent, beige border and text
- Success: sage green background (#9CAF88), white text
- Danger: soft red background (#CD5C5C), white text

**Validation:**
- Real-time feedback with beige theme
- Success indicators in sage green
- Error messages in soft red
- Smooth transitions between states
```

---

## 📈 5. 베이지/크림 차트 프롬프트

```
Create charts with beige/cream color palette:

**Chart Container:**
- Background: cream white (#FEFEF8)
- Border: beige accent (#D2B48C, 15% opacity)
- Border radius: 12px
- Padding: 24px

**Data Series Colors:**
1. Primary: #D2B48C (beige)
2. Secondary: #F5F5DC (cream)
3. Tertiary: #DDD8C7 (soft beige)
4. Quaternary: #F4E4BC (warm sand)
5. Quinary: #6B7C32 (olive green accent)

**Chart Elements:**
- Grid lines: beige light (#E6D3B7, 30% opacity)
- Axis labels: warm gray (#8B8680)
- Data points: beige with white centers
- Lines: 3px stroke with beige
- Areas: beige gradients to transparent

**Interactive Features:**
- Hover: enhanced beige with glow
- Tooltips: cream background with beige border
- Legend: beige theme
- Selection: warm sand highlight

**Animations:**
- Smooth beige transitions
- Natural, organic movement
- Loading animations with warm tones
- Hover effects with beige accents

**Responsive Design:**
- Maintains beige theme on all sizes
- Touch-friendly interactions
- Consistent color application
- Mobile-optimized tooltips
```

---

## 🎛️ 6. 베이지/크림 인터랙티브 컴포넌트 프롬프트

```
Create interactive components with beige/cream theme:

**Button Variants:**
- Primary: beige (#D2B48C) background, white text
- Secondary: transparent, beige border and text
- Success: sage green (#9CAF88) background, white text
- Warning: olive green (#6B7C32) background, white text
- Danger: soft red (#CD5C5C) background, white text
- Ghost: transparent, warm gray text

**Button States:**
- Default: clean beige
- Hover: darker beige (#C19A6B) with subtle glow
- Active: pressed beige with scale effect
- Disabled: warm gray with reduced opacity
- Loading: beige with cream spinner

**Form Interactions:**
- Focus rings: beige (#D2B48C)
- Validation success: sage green (#9CAF88)
- Validation error: soft red (#CD5C5C)
- Placeholder text: warm gray (#8B8680)

**Table Interactions:**
- Row hover: warm sand background (20% opacity)
- Row selection: beige background (15% opacity)
- Sort indicators: beige arrows
- Pagination: beige active states

**Chart Interactions:**
- Data point hover: enhanced beige
- Legend hover: warm sand background
- Tooltip: cream background with beige border
- Selection: olive green highlight

**Animation Themes:**
- Smooth beige transitions
- Natural, organic movements
- Earth-tone inspired effects
- Calming, therapeutic feel
```

---

## 🎨 7. 베이지/크림 전체 페이지 레이아웃 프롬프트

```
Create cohesive page layout with beige/cream theme:

**Page Structure:**
- Background: cream white (#FEFEF8)
- Header: cream light (#F5F5DC) with beige accents
- Content: cream white with beige borders
- Consistent beige theme throughout

**Header Design:**
- Background: cream light (#F5F5DC)
- Logo: beige (#D2B48C)
- Navigation: beige active states
- Border: subtle beige bottom border

**Tab Navigation:**
- Active tab: beige background (#D2B48C)
- Inactive tabs: warm gray text (#8B8680)
- Hover: warm sand background (#F4E4BC, 20% opacity)
- Icons: beige theme

**Section Dividers:**
- Beige borders (#D2B48C, 20% opacity)
- Cream backgrounds with beige accents
- Consistent spacing with warm-tone theme

**Color Hierarchy:**
- Primary actions: beige (#D2B48C)
- Secondary actions: warm sand (#F4E4BC)
- Accent elements: olive green (#6B7C32)
- Neutral elements: soft beige (#DDD8C7)
- Backgrounds: cream variations (#F5F5DC, #FEFEF8)

**Typography:**
- Headers: beige (#D2B48C)
- Body text: dark gray (#2F2F2F)
- Secondary text: warm gray (#8B8680)
- Links: sage green (#9CAF88)

**Responsive Design:**
- Maintains beige theme on all devices
- Touch-friendly beige interactions
- Consistent warm-tone palette
- Natural, calming aesthetic
```

---

## 🌿 베이지/크림 색상 팔레트 참조

### 메인 색상 (베이지/크림)
- **크림**: #F5F5DC (Primary Background)
- **밝은 크림**: #FEFEF8 (Light Background)
- **어두운 크림**: #E8E8D0 (Dark Background)
- **베이지**: #D2B48C (Primary)
- **밝은 베이지**: #E6D3B7 (Light)
- **어두운 베이지**: #C19A6B (Dark)

### 보조 색상 (올리브 그린)
- **올리브 그린**: #6B7C32 (Accent)
- **세이지 그린**: #9CAF88 (Success)
- **모스 그린**: #8FBC8F (Info)

### 중성 색상
- **웜 샌드**: #F4E4BC (Interactive)
- **소프트 베이지**: #DDD8C7 (Secondary)
- **웜 그레이**: #8B8680 (Text Secondary)
- **뮤트 타우프**: #B8A082 (Border)

이 색상 시스템을 사용하면 따뜻하고 편안한 베이지/크림 기반의 상담 센터에 적합한 디자인을 만들 수 있습니다.
