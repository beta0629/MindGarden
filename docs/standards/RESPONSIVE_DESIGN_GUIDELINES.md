# MindGarden 반응형 디자인 가이드라인

> Multi-tenant 상담 관리 시스템을 위한 반응형 레이아웃 시스템 가이드

## 📋 목차

1. [그리드 시스템](#1-그리드-시스템)
2. [브레이크포인트](#2-브레이크포인트)
3. [사이드바 동작](#3-사이드바-동작)
4. [컴포넌트 리플로우](#4-컴포넌트-리플로우)
5. [스페이싱 시스템](#5-스페이싱-시스템)
6. [타이포그래피](#6-타이포그래피)
7. [구현 예제](#7-구현-예제)

---

## 1. 그리드 시스템 (Grid System)

MindGarden은 디바이스별로 다른 컬럼 수를 사용하는 유연한 그리드 시스템을 제공합니다.

### 1.1 컬럼 구조

| 디바이스 | 컬럼 수 | 최소 너비 | 최대 너비 |
|---------|--------|----------|----------|
| **Mobile** | 4 컬럼 | 320px | 767px |
| **Tablet** | 8 컬럼 | 768px | 1023px |
| **Desktop** | 12 컬럼 | 1024px | 1439px |
| **Large Desktop** | 12 컬럼 | 1440px | ~ |

### 1.2 그리드 간격 (Gutter)

```css
/* CSS 변수 사용 (표준화 원칙 준수) */
--grid-gutter-mobile: 16px;
--grid-gutter-tablet: 20px;
--grid-gutter-desktop: 24px;
```

| 디바이스 | 그리드 간격 |
|---------|------------|
| Mobile | 16px (1rem) |
| Tablet | 20px (1.25rem) |
| Desktop | 24px (1.5rem) |

### 1.3 컨테이너 최대 너비

```css
/* 컨테이너 최대 너비 제한 */
.layout-content-container {
  max-width: 960px; /* Desktop 이상에서 적용 */
  margin: 0 auto;
  padding: 0 var(--container-padding);
}
```

---

## 2. 브레이크포인트 (Breakpoints)

### 2.1 브레이크포인트 정의

```javascript
// frontend/src/constants/breakpoints.js
export const BREAKPOINTS = {
  MOBILE: 0,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE: 1440,
  XLARGE: 1920
};
```

### 2.2 CSS 변수

```css
/* frontend/src/styles/mindgarden-design-system.css */
:root {
  --mg-breakpoint-xs: 320px;
  --mg-breakpoint-sm: 640px;
  --mg-breakpoint-md: 768px;   /* Tablet 시작 */
  --mg-breakpoint-lg: 1024px;  /* Desktop 시작 */
  --mg-breakpoint-xl: 1280px;
  --mg-breakpoint-2xl: 1536px; /* Large Desktop */
}
```

### 2.3 브레이크포인트 전환 지점

#### Mobile Start (320px)
- **4컬럼 그리드** 시작
- 좌우 마진: 16px
- 사이드바는 **하단 탭바**로 변환
- 터치 타겟 최소 크기: 44px

#### Tablet Transition (768px)
- **8컬럼 그리드** 확장
- 사이드바는 **햄버거 메뉴(Hidden)**로 변경
- 컨테이너 패딩: 20px

#### Desktop Expanded (1024px)
- **12컬럼 그리드** 시작
- **고정 사이드바(Fixed Sidebar)** 노출
- 컨테이너 패딩: 24px

#### Large Desktop (1440px)
- **12컬럼 그리드** 유지
- 컨텐츠 영역 **최대 너비 제한** (960px)
- 여유로운 공간감 확보

---

## 3. 사이드바 동작 (Sidebar Behavior)

### 3.1 디바이스별 사이드바 상태

| 디바이스 | 사이드바 상태 | 동작 방식 |
|---------|-------------|----------|
| **Desktop** (≥1024px) | Fixed Sidebar | 항상 노출, 고정 너비 |
| **Tablet** (768px~1023px) | Hamburger Menu | 클릭 시 드로어로 표시 |
| **Mobile** (<768px) | Bottom Tab Bar | 하단 고정 탭바로 변환 |

### 3.2 구현 예제

#### Desktop - Fixed Sidebar
```css
@media (min-width: 1024px) {
  .simple-layout {
    display: grid;
    grid-template-columns: 240px 1fr; /* 사이드바 + 컨텐츠 */
  }
  
  .simple-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 240px;
  }
}
```

#### Tablet - Hamburger Menu
```css
@media (min-width: 768px) and (max-width: 1023px) {
  .simple-sidebar {
    display: none; /* 기본 숨김 */
  }
  
  .simple-hamburger-toggle {
    display: block; /* 햄버거 버튼 표시 */
  }
  
  .simple-hamburger-menu {
    position: fixed;
    right: 0;
    top: 0;
    width: 320px;
    height: 100vh;
    transform: translateX(100%); /* 기본 숨김 */
    transition: transform 0.3s ease;
  }
  
  .simple-hamburger-menu.open {
    transform: translateX(0); /* 열림 */
  }
}
```

#### Mobile - Bottom Tab Bar
```css
@media (max-width: 767px) {
  .simple-sidebar {
    display: none;
  }
  
  .simple-bottom-tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    background: var(--mg-white);
    border-top: 1px solid var(--mg-gray-200);
  }
}
```

---

## 4. 컴포넌트 리플로우 (Component Reflow)

### 4.1 KPI 카드 그리드

컴포넌트는 화면 크기에 따라 자동으로 레이아웃이 변경됩니다.

#### Desktop (4 Columns)
```css
.dashboard-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
```

#### Tablet (2x2 Grid)
```css
@media (min-width: 768px) and (max-width: 1023px) {
  .dashboard-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}
```

#### Mobile (Stacked)
```css
@media (max-width: 767px) {
  .dashboard-kpi-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

### 4.2 카드 컴포넌트

```css
/* 공통 카드 스타일 */
.mg-v2-card {
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
}

/* Desktop: 여유로운 패딩 */
@media (min-width: 1024px) {
  .mg-v2-card {
    padding: var(--spacing-xl);
  }
}

/* Mobile: 컴팩트한 패딩 */
@media (max-width: 767px) {
  .mg-v2-card {
    padding: var(--spacing-md);
  }
}
```

### 4.3 테이블 컴포넌트

```css
/* Desktop: 전체 테이블 표시 */
@media (min-width: 1024px) {
  .mg-table {
    display: table;
  }
}

/* Mobile: 카드 형태로 변환 */
@media (max-width: 767px) {
  .mg-table {
    display: block;
  }
  
  .mg-table thead {
    display: none;
  }
  
  .mg-table tr {
    display: block;
    margin-bottom: var(--spacing-md);
    border: 1px solid var(--mg-gray-200);
    border-radius: var(--border-radius-md);
  }
  
  .mg-table td {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-sm);
  }
  
  .mg-table td::before {
    content: attr(data-label);
    font-weight: 600;
    margin-right: var(--spacing-sm);
  }
}
```

---

## 5. 스페이싱 시스템 (Spacing System)

### 5.1 컨테이너 패딩

| 디바이스 | 좌우 패딩 | 상하 패딩 |
|---------|---------|----------|
| Mobile | 16px (1rem) | 16px (1rem) |
| Tablet | 20px (1.25rem) | 20px (1.25rem) |
| Desktop | 24px (1.5rem) | 24px (1.5rem) |

### 5.2 컴포넌트 간격

```css
:root {
  /* Mobile */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Desktop (더 여유로운 간격) */
  --spacing-lg-desktop: 32px;
  --spacing-xl-desktop: 48px;
}
```

### 5.3 섹션 간격

| 디바이스 | 섹션 Y-Margin |
|---------|--------------|
| Mobile | 32px ~ 40px |
| Tablet | 40px ~ 48px |
| Desktop | 48px ~ 64px |

### 5.4 구현 예제

```css
.section {
  margin-bottom: var(--spacing-xl);
}

@media (min-width: 1024px) {
  .section {
    margin-bottom: var(--spacing-xl-desktop);
  }
}
```

---

## 6. 타이포그래피 (Typography)

### 6.1 반응형 폰트 크기

```javascript
// frontend/src/constants/breakpoints.js
export const RESPONSIVE_TYPOGRAPHY = {
  MOBILE: {
    H1: '1.5rem',    // 24px
    H2: '1.25rem',   // 20px
    H3: '1.125rem',  // 18px
    H4: '1rem',      // 16px
    BODY: '0.875rem' // 14px
  },
  TABLET: {
    H1: '2rem',      // 32px
    H2: '1.5rem',    // 24px
    H3: '1.25rem',   // 20px
    H4: '1.125rem',  // 18px
    BODY: '1rem'     // 16px
  },
  DESKTOP: {
    H1: '2.5rem',    // 40px
    H2: '2rem',      // 32px
    H3: '1.5rem',    // 24px
    H4: '1.25rem',   // 20px
    BODY: '1rem'     // 16px
  }
};
```

### 6.2 CSS 변수 사용

```css
:root {
  --font-size-h1-mobile: 1.5rem;
  --font-size-h1-tablet: 2rem;
  --font-size-h1-desktop: 2.5rem;
}

h1 {
  font-size: var(--font-size-h1-mobile);
}

@media (min-width: 768px) {
  h1 {
    font-size: var(--font-size-h1-tablet);
  }
}

@media (min-width: 1024px) {
  h1 {
    font-size: var(--font-size-h1-desktop);
  }
}
```

---

## 7. 구현 예제

### 7.1 반응형 그리드 레이아웃

```jsx
// React 컴포넌트 예제
import { useResponsive } from '../../hooks/useResponsive';

const DashboardGrid = ({ children }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const gridCols = isMobile ? 1 : isTablet ? 2 : 4;
  
  return (
    <div 
      className="dashboard-grid"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gap: isMobile ? '16px' : isTablet ? '20px' : '24px'
      }}
    >
      {children}
    </div>
  );
};
```

### 7.2 CSS 클래스 기반 구현

```css
/* Mobile First 접근법 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 16px;
}

/* Tablet */
@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 20px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    padding: 24px;
  }
}
```

### 7.3 사이드바 토글 구현

```jsx
const SimpleLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  
  return (
    <div className="simple-layout">
      {/* Desktop: 항상 표시 */}
      {!isMobile && !isTablet && (
        <aside className="simple-sidebar">
          {/* 사이드바 내용 */}
        </aside>
      )}
      
      {/* Tablet: 햄버거 메뉴 */}
      {isTablet && (
        <>
          <button 
            className="simple-hamburger-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>
          <div className={`simple-hamburger-menu ${isSidebarOpen ? 'open' : ''}`}>
            {/* 메뉴 내용 */}
          </div>
        </>
      )}
      
      {/* Mobile: 하단 탭바 */}
      {isMobile && (
        <nav className="simple-bottom-tab-bar">
          {/* 탭바 내용 */}
        </nav>
      )}
      
      <main className="simple-main">
        {/* 컨텐츠 */}
      </main>
    </div>
  );
};
```

---

## 8. 체크리스트

### 8.1 반응형 구현 체크리스트

- [ ] **모바일 우선 접근법** 사용 (Mobile First)
- [ ] **CSS 변수** 사용 (하드코딩 금지)
- [ ] **브레이크포인트 상수** 사용
- [ ] **터치 타겟 최소 크기** 44px 이상
- [ ] **테이블은 모바일에서 카드 형태**로 변환
- [ ] **이미지는 반응형**으로 설정 (max-width: 100%)
- [ ] **텍스트는 가독성** 유지 (최소 14px)
- [ ] **스크롤 가능한 영역** 명확히 표시
- [ ] **햄버거 메뉴 애니메이션** 부드럽게
- [ ] **하단 탭바는 고정** 위치

### 8.2 테스트 체크리스트

- [ ] **320px** (최소 모바일) 테스트
- [ ] **768px** (태블릿 전환) 테스트
- [ ] **1024px** (데스크톱 전환) 테스트
- [ ] **1440px** (대형 데스크톱) 테스트
- [ ] **가로/세로 모드** 모두 테스트
- [ ] **터치 디바이스**에서 동작 확인
- [ ] **키보드 네비게이션** 가능 여부 확인

---

## 9. 참고 자료

- [표준화 문서: 반응형 레이아웃](./RESPONSIVE_LAYOUT_STANDARD.md)
- [디자인 시스템 v2.0 가이드](../design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)
- [브레이크포인트 상수](../../frontend/src/constants/breakpoints.js)
- [반응형 Hook](../../frontend/src/hooks/useResponsive.js)

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2025-01-XX  
**작성자**: MindGarden Development Team
