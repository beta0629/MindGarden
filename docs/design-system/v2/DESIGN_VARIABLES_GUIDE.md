# MindGarden 디자인 시스템 v2.0 - 변수 설정 가이드

## 📋 개요

이 문서는 MindGarden 프로젝트에서 디자인 중앙화를 위한 모든 변수 설정 방법과 가이드라인을 제공합니다.

## 🎯 목표

- **완전한 중앙화**: 모든 디자인 토큰을 중앙에서 관리
- **일관성 보장**: 모든 컴포넌트에서 동일한 변수 사용
- **유지보수성**: 한 곳에서 변경하면 전체 적용
- **확장성**: 새로운 변수 추가가 용이한 구조

## 🏗️ 변수 시스템 아키텍처

### 1. 변수 계층 구조
```
📁 디자인 변수 시스템
├── 🎨 CSS Variables (기본 색상, 크기, 간격)
├── 🧩 JavaScript Constants (컴포넌트 상수)
├── 🎭 Theme Variables (역할별 테마)
├── 📐 Layout Variables (레이아웃 상수)
└── 🔧 Utility Variables (유틸리티 상수)
```

## 🎨 CSS Variables 시스템

### 1. 기본 색상 팔레트
```css
/* mindgarden-design-system.css */
:root {
  /* === 기본 색상 팔레트 === */
  
  /* 내담자 테마 - 화사한 분위기 */
  --client-primary: #FFB6C1;        /* 라이트 핑크 */
  --client-secondary: #FFE4E1;      /* 미스트 로즈 */
  --client-accent: #FF69B4;         /* 핫 핑크 */
  --client-background: #FFF8DC;     /* 코른실크 */
  --client-text: #8B4513;           /* 새들브라운 */
  --client-text-light: #A0522D;     /* 시에나 */
  
  /* 상담사 테마 - 활력 충만 분위기 */
  --consultant-primary: #98FB98;    /* 민트 그린 */
  --consultant-secondary: #B6E5D8;  /* 소프트 민트 */
  --consultant-accent: #32CD32;     /* 라임 그린 */
  --consultant-background: #F0FFF0; /* 허니듀 */
  --consultant-text: #2F4F2F;       /* 다크 시그린 */
  --consultant-text-light: #556B2F; /* 올리브 드랩 */
  
  /* 관리자 테마 - 간결하고 깔끔한 분위기 */
  --admin-primary: #87CEEB;         /* 스카이 블루 */
  --admin-secondary: #E0F6FF;       /* 라이트 블루 */
  --admin-accent: #4682B4;          /* 스틸 블루 */
  --admin-background: #F8F9FA;      /* 고스트 화이트 */
  --admin-text: #2C3E50;            /* 미드나잇 블루 */
  --admin-text-light: #5D6D7E;      /* 스틸 그레이 */
  
  /* === 공통 색상 === */
  --color-white: #FFFFFF;
  --color-black: #000000;
  --color-transparent: transparent;
  
  /* === 상태 색상 === */
  --status-success: #10B981;
  --status-warning: #F59E0B;
  --status-error: #EF4444;
  --status-info: #3B82F6;
  
  /* === 중성 색상 === */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
}
```

### 2. 크기 및 간격 변수
```css
:root {
  /* === 폰트 크기 === */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  --font-size-4xl: 36px;
  --font-size-5xl: 48px;
  
  /* === 폰트 두께 === */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  
  /* === 간격 (Spacing) === */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
  --spacing-4xl: 96px;
  
  /* === 아이콘 크기 === */
  --icon-xs: 12px;
  --icon-sm: 14px;
  --icon-md: 16px;
  --icon-lg: 18px;
  --icon-xl: 20px;
  --icon-2xl: 24px;
  --icon-3xl: 32px;
  --icon-4xl: 48px;
  
  /* === 보더 반경 === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  
  /* === 그림자 === */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

### 3. 그라데이션 변수
```css
:root {
  /* === 내담자 그라데이션 === */
  --client-gradient: linear-gradient(135deg, #FFB6C1 0%, #FFE4E1 100%);
  --client-gradient-soft: linear-gradient(135deg, #FFE4E1 0%, #FFF8DC 100%);
  --client-gradient-strong: linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%);
  
  /* === 상담사 그라데이션 === */
  --consultant-gradient: linear-gradient(135deg, #98FB98 0%, #B6E5D8 100%);
  --consultant-gradient-soft: linear-gradient(135deg, #B6E5D8 0%, #F0FFF0 100%);
  --consultant-gradient-strong: linear-gradient(135deg, #32CD32 0%, #98FB98 100%);
  
  /* === 관리자 그라데이션 === */
  --admin-gradient: linear-gradient(135deg, #87CEEB 0%, #E0F6FF 100%);
  --admin-gradient-soft: linear-gradient(135deg, #E0F6FF 0%, #F8F9FA 100%);
  --admin-gradient-strong: linear-gradient(135deg, #4682B4 0%, #87CEEB 100%);
  
  /* === 공통 그라데이션 === */
  --gradient-primary: linear-gradient(135deg, var(--mint-green) 0%, var(--soft-mint) 100%);
  --gradient-secondary: linear-gradient(135deg, var(--olive-green) 0%, var(--mint-green) 100%);
  --gradient-neutral: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
}
```

## 🧩 JavaScript Constants 시스템

### 1. 아이콘 상수
```javascript
// constants/icons.js
export const ICON_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  HUGE: 48
};

export const ICON_COLORS = {
  PRIMARY: 'var(--mint-green)',
  SECONDARY: 'var(--soft-mint)',
  SUCCESS: 'var(--status-success)',
  WARNING: 'var(--status-warning)',
  ERROR: 'var(--status-error)',
  MUTED: 'var(--gray-500)',
  TRANSPARENT: 'transparent'
};

export const ICON_USAGE = {
  DASHBOARD_HEADER: { size: 'XXL', variant: 'PRIMARY' },
  STAT_CARD: { size: 'XL', variant: 'PRIMARY' },
  SECTION_TITLE: { size: 'LG', variant: 'PRIMARY' },
  BUTTON: { size: 'SM', variant: 'TRANSPARENT' },
  TABLE_ROW: { size: 'SM', variant: 'SECONDARY' },
  CARD_HEADER: { size: 'MD', variant: 'PRIMARY' },
  MODAL_HEADER: { size: 'XXL', variant: 'PRIMARY' },
  EMPTY_STATE: { size: 'HUGE', variant: 'MUTED' }
};
```

### 2. 레이아웃 상수
```javascript
// constants/layout.js
export const LAYOUT_SYSTEM = {
  DASHBOARD: {
    CONTAINER: 'mg-dashboard-layout',
    HEADER: 'mg-dashboard-header',
    STATS: 'mg-dashboard-stats',
    CONTENT: 'mg-dashboard-content',
    SIDEBAR: 'mg-dashboard-sidebar',
    MAIN: 'mg-dashboard-main'
  },
  
  CARD: {
    CONTAINER: 'mg-card',
    HEADER: 'mg-card-header',
    CONTENT: 'mg-card-content',
    FOOTER: 'mg-card-footer',
    ICON: 'mg-card-icon',
    VALUE: 'mg-card-value',
    LABEL: 'mg-card-label',
    TITLE: 'mg-card-title',
    SUBTITLE: 'mg-card-subtitle'
  },
  
  SECTION: {
    CONTAINER: 'mg-section',
    HEADER: 'mg-section-header',
    CONTENT: 'mg-section-content',
    TITLE: 'mg-section-title',
    SUBTITLE: 'mg-section-subtitle',
    ICON: 'mg-section-icon',
    ACTIONS: 'mg-section-actions'
  },
  
  TAB: {
    CONTAINER: 'mg-tabs',
    ITEM: 'mg-tab',
    ACTIVE: 'mg-tab-active',
    CONTENT: 'mg-tab-content'
  },
  
  GRID: {
    CONTAINER: 'mg-grid',
    ITEM: 'mg-grid-item',
    STATS: 'mg-stats-grid',
    CARDS: 'mg-cards-grid',
    TWO_COLUMN: 'mg-two-column-grid',
    THREE_COLUMN: 'mg-three-column-grid'
  }
};
```

### 3. 색상 테마 상수
```javascript
// constants/colorThemes.js
export const COLOR_THEMES = {
  CLIENT: {
    name: '내담자 테마',
    description: '화사한 분위기',
    colors: {
      primary: 'var(--client-primary)',
      secondary: 'var(--client-secondary)',
      accent: 'var(--client-accent)',
      background: 'var(--client-background)',
      text: 'var(--client-text)',
      textLight: 'var(--client-text-light)',
      gradient: 'var(--client-gradient)',
      gradientSoft: 'var(--client-gradient-soft)'
    }
  },
  
  CONSULTANT: {
    name: '상담사 테마',
    description: '활력 충만 분위기',
    colors: {
      primary: 'var(--consultant-primary)',
      secondary: 'var(--consultant-secondary)',
      accent: 'var(--consultant-accent)',
      background: 'var(--consultant-background)',
      text: 'var(--consultant-text)',
      textLight: 'var(--consultant-text-light)',
      gradient: 'var(--consultant-gradient)',
      gradientSoft: 'var(--consultant-gradient-soft)'
    }
  },
  
  ADMIN: {
    name: '관리자 테마',
    description: '간결하고 깔끔한 분위기',
    colors: {
      primary: 'var(--admin-primary)',
      secondary: 'var(--admin-secondary)',
      accent: 'var(--admin-accent)',
      background: 'var(--admin-background)',
      text: 'var(--admin-text)',
      textLight: 'var(--admin-text-light)',
      gradient: 'var(--admin-gradient)',
      gradientSoft: 'var(--admin-gradient-soft)'
    }
  }
};

export const getThemeByRole = (userRole) => {
  const roleMap = {
    'CLIENT': COLOR_THEMES.CLIENT,
    'CONSULTANT': COLOR_THEMES.CONSULTANT,
    'ADMIN': COLOR_THEMES.ADMIN,
    'BRANCH_ADMIN': COLOR_THEMES.ADMIN,
    'SUPER_ADMIN': COLOR_THEMES.ADMIN,
    'HQ_MASTER': COLOR_THEMES.ADMIN
  };
  
  return roleMap[userRole] || COLOR_THEMES.ADMIN;
};
```

### 4. 컴포넌트 상수
```javascript
// constants/components.js
export const COMPONENT_SIZES = {
  BUTTON: {
    SM: 'mg-button--sm',
    MD: 'mg-button--md',
    LG: 'mg-button--lg',
    XL: 'mg-button--xl'
  },
  
  CARD: {
    SM: 'mg-card--sm',
    MD: 'mg-card--md',
    LG: 'mg-card--lg',
    XL: 'mg-card--xl'
  },
  
  MODAL: {
    SM: 'mg-modal--sm',
    MD: 'mg-modal--md',
    LG: 'mg-modal--lg',
    XL: 'mg-modal--xl'
  }
};

export const COMPONENT_VARIANTS = {
  BUTTON: {
    PRIMARY: 'mg-button--primary',
    SECONDARY: 'mg-button--secondary',
    SUCCESS: 'mg-button--success',
    WARNING: 'mg-button--warning',
    ERROR: 'mg-button--error',
    GHOST: 'mg-button--ghost'
  },
  
  CARD: {
    DEFAULT: 'mg-card--default',
    ELEVATED: 'mg-card--elevated',
    OUTLINED: 'mg-card--outlined',
    FILLED: 'mg-card--filled'
  }
};
```

## 🎭 테마 변수 시스템

### 1. 동적 테마 적용
```javascript
// utils/themeUtils.js
export const applyTheme = (userRole) => {
  const theme = getThemeByRole(userRole);
  
  // CSS 변수 동적 업데이트
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
  }
  
  return theme;
};

export const getThemeClasses = (userRole, componentType) => {
  const baseClasses = {
    dashboard: 'mg-dashboard-layout',
    card: 'mg-card',
    section: 'mg-section',
    button: 'mg-button'
  };
  
  const themeClass = `mg-theme--${userRole.toLowerCase()}`;
  const componentClass = baseClasses[componentType] || '';
  
  return `${componentClass} ${themeClass}`.trim();
};
```

### 2. 반응형 변수
```css
/* 반응형 브레이크포인트 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 반응형 간격 */
@media (max-width: 768px) {
  :root {
    --spacing-xs: 2px;
    --spacing-sm: 4px;
    --spacing-md: 8px;
    --spacing-lg: 16px;
    --spacing-xl: 24px;
  }
}

@media (min-width: 1024px) {
  :root {
    --spacing-xs: 6px;
    --spacing-sm: 12px;
    --spacing-md: 20px;
    --spacing-lg: 32px;
    --spacing-xl: 48px;
  }
}
```

## 🔧 유틸리티 변수 시스템

### 1. 애니메이션 변수
```css
:root {
  /* === 애니메이션 지속시간 === */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  --duration-slower: 500ms;
  
  /* === 애니메이션 이징 === */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* === 애니메이션 지연 === */
  --delay-none: 0ms;
  --delay-fast: 50ms;
  --delay-normal: 100ms;
  --delay-slow: 200ms;
}
```

### 2. Z-Index 변수
```css
:root {
  /* === Z-Index 계층 === */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-toast: 1080;
}
```

### 3. 트랜지션 변수
```css
:root {
  /* === 기본 트랜지션 === */
  --transition-fast: all var(--duration-fast) var(--ease-out);
  --transition-normal: all var(--duration-normal) var(--ease-in-out);
  --transition-slow: all var(--duration-slow) var(--ease-in-out);
  
  /* === 특수 트랜지션 === */
  --transition-bounce: all var(--duration-normal) var(--ease-bounce);
  --transition-fade: opacity var(--duration-normal) var(--ease-out);
  --transition-slide: transform var(--duration-normal) var(--ease-out);
}
```

## 📝 변수 사용 가이드라인

### 1. CSS Variables 사용법

#### ✅ 올바른 사용법
```css
/* CSS에서 변수 사용 */
.my-component {
  background: var(--mint-green);
  color: var(--admin-text);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: var(--transition-normal);
}

/* 반응형 변수 사용 */
@media (max-width: 768px) {
  .my-component {
    padding: var(--spacing-sm);
  }
}
```

#### ❌ 잘못된 사용법
```css
/* 하드코딩된 값 금지 */
.my-component {
  background: #98FB98;
  color: #2C3E50;
  padding: 16px;
  border-radius: 8px;
}

/* 일관성 없는 값 사용 금지 */
.my-component {
  background: var(--mint-green);
  color: #2C3E50; /* 변수 사용하지 않음 */
  padding: 16px; /* 변수 사용하지 않음 */
}
```

### 2. JavaScript Constants 사용법

#### ✅ 올바른 사용법
```jsx
// 상수 import
import { ICON_SIZES, ICON_USAGE, LAYOUT_SYSTEM } from '../../constants/icons';
import { COLOR_THEMES, getThemeByRole } from '../../constants/colorThemes';

// 컴포넌트에서 사용
const MyComponent = ({ userRole }) => {
  const theme = getThemeByRole(userRole);
  
  return (
    <div className={LAYOUT_SYSTEM.DASHBOARD.CONTAINER}>
      <div className={LAYOUT_SYSTEM.CARD.CONTAINER}>
        <ICONS.USERS size={ICON_SIZES[ICON_USAGE.STAT_CARD.size]} />
      </div>
    </div>
  );
};
```

#### ❌ 잘못된 사용법
```jsx
// 직접 import 금지
import { Users } from 'lucide-react';

// 하드코딩된 값 사용 금지
<div className="mg-dashboard-layout">
  <Users size={20} />
</div>
```

### 3. 테마 적용 방법

#### ✅ 올바른 테마 적용
```jsx
// 사용자 역할에 따른 테마 적용
const Dashboard = ({ userRole }) => {
  const theme = getThemeByRole(userRole);
  const themeClasses = getThemeClasses(userRole, 'dashboard');
  
  return (
    <div className={themeClasses}>
      <StatCard 
        icon="USERS" 
        value={10} 
        label="총 사용자"
        theme={theme}
      />
    </div>
  );
};
```

## 🚀 변수 추가 및 수정 가이드

### 1. 새로운 변수 추가 절차

#### Step 1: CSS Variables 추가
```css
/* mindgarden-design-system.css에 추가 */
:root {
  --new-variable: value;
}
```

#### Step 2: JavaScript Constants 추가
```javascript
// constants/해당파일.js에 추가
export const NEW_CONSTANTS = {
  NEW_VALUE: 'var(--new-variable)'
};
```

#### Step 3: 문서 업데이트
- 이 가이드 문서에 새 변수 추가
- 사용 예시 및 가이드라인 작성

#### Step 4: 테스트 및 검증
- 모든 브라우저에서 정상 작동 확인
- 기존 컴포넌트에 영향 없음 확인

### 2. 기존 변수 수정 절차

#### Step 1: 영향도 분석
- 해당 변수를 사용하는 모든 컴포넌트 파악
- 변경으로 인한 시각적 변화 예상

#### Step 2: 단계적 변경
- 개발 환경에서 먼저 테스트
- 점진적으로 프로덕션에 적용

#### Step 3: 문서 업데이트
- 변경 사항을 문서에 반영
- 팀원들에게 변경 사항 공지

## 📚 참고 자료

- **[MASTER_GUIDE.md](./MASTER_GUIDE.md)** - 전체 디자인 시스템 개요 (필수)
- **[ICON_LAYOUT_CENTRALIZATION_GUIDE.md](./ICON_LAYOUT_CENTRALIZATION_GUIDE.md)** - 아이콘/레이아웃 중앙화
- **[CARD_SYSTEM_GUIDE.md](./CARD_SYSTEM_GUIDE.md)** - 카드 시스템 상세 가이드
- **[MGBUTTON_MIGRATION_GUIDE.md](./MGBUTTON_MIGRATION_GUIDE.md)** - MGButton 마이그레이션 가이드
- **[MOBILE_OPTIMIZATION_GUIDE.md](./MOBILE_OPTIMIZATION_GUIDE.md)** - 모바일 최적화 가이드
- [MindGarden 디자인 시스템 가이드](./MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)
- [디자인 시스템 아키텍처](./DESIGN_SYSTEM_ARCHITECTURE.md)

## 🔄 업데이트 이력

- **2025-01-23**: 초기 문서 작성
- **2025-01-23**: CSS Variables 시스템 정의
- **2025-01-23**: JavaScript Constants 시스템 정의
- **2025-01-23**: 테마 변수 시스템 정의
- **2025-01-23**: 유틸리티 변수 시스템 정의
- **2025-01-23**: 변수 사용 가이드라인 작성
