# MindGarden 디자인 시스템 v2.0 - 아이콘 & 레이아웃 중앙화 가이드

## 📋 개요

이 문서는 MindGarden 프로젝트에서 아이콘과 레이아웃을 중앙화하여 일관된 디자인을 유지하기 위한 가이드입니다.

## 🎯 목표

- **아이콘 중앙화**: 모든 아이콘을 `constants/icons.js`에서 통합 관리
- **레이아웃 중앙화**: 모든 레이아웃 클래스를 중앙에서 관리
- **색상 테마 시스템**: 역할별 3가지 색상 테마로 통일
- **일관성 보장**: 크기, 색상, 스타일의 완전한 통일
- **유지보수성 향상**: 한 곳에서 모든 디자인 토큰 관리

## 🎨 역할별 색상 테마 시스템

### 1. 내담자 테마 - 화사한 분위기
```css
:root {
  /* 내담자 기본 색상 */
  --client-primary: #FFB6C1;        /* 라이트 핑크 - 따뜻하고 화사함 */
  --client-secondary: #FFE4E1;      /* 미스트 로즈 - 부드러운 분위기 */
  --client-accent: #FF69B4;         /* 핫 핑크 - 활기찬 포인트 */
  --client-background: #FFF8DC;     /* 코른실크 - 따뜻한 배경 */
  --client-text: #8B4513;           /* 새들브라운 - 따뜻한 텍스트 */
  --client-text-light: #A0522D;     /* 시에나 - 부드러운 텍스트 */
  
  /* 내담자 그라데이션 */
  --client-gradient: linear-gradient(135deg, #FFB6C1 0%, #FFE4E1 100%);
  --client-gradient-soft: linear-gradient(135deg, #FFE4E1 0%, #FFF8DC 100%);
}
```

### 2. 상담사 테마 - 활력 충만 분위기
```css
:root {
  /* 상담사 기본 색상 */
  --consultant-primary: #98FB98;    /* 민트 그린 - 활력과 성장 */
  --consultant-secondary: #B6E5D8;  /* 소프트 민트 - 차분한 활력 */
  --consultant-accent: #32CD32;     /* 라임 그린 - 강한 활력 */
  --consultant-background: #F0FFF0; /* 허니듀 - 신선한 배경 */
  --consultant-text: #2F4F2F;       /* 다크 시그린 - 안정감 있는 텍스트 */
  --consultant-text-light: #556B2F; /* 올리브 드랩 - 부드러운 텍스트 */
  
  /* 상담사 그라데이션 */
  --consultant-gradient: linear-gradient(135deg, #98FB98 0%, #B6E5D8 100%);
  --consultant-gradient-soft: linear-gradient(135deg, #B6E5D8 0%, #F0FFF0 100%);
}
```

### 3. 관리자 테마 - 간결하고 깔끔한 분위기
```css
:root {
  /* 관리자 기본 색상 */
  --admin-primary: #87CEEB;         /* 스카이 블루 - 신뢰와 전문성 */
  --admin-secondary: #E0F6FF;       /* 라이트 블루 - 깔끔한 배경 */
  --admin-accent: #4682B4;          /* 스틸 블루 - 강한 전문성 */
  --admin-background: #F8F9FA;      /* 고스트 화이트 - 깨끗한 배경 */
  --admin-text: #2C3E50;            /* 미드나잇 블루 - 전문적인 텍스트 */
  --admin-text-light: #5D6D7E;      /* 스틸 그레이 - 부드러운 텍스트 */
  
  /* 관리자 그라데이션 */
  --admin-gradient: linear-gradient(135deg, #87CEEB 0%, #E0F6FF 100%);
  --admin-gradient-soft: linear-gradient(135deg, #E0F6FF 0%, #F8F9FA 100%);
}
```

### 4. 통합 색상 시스템
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
```

### 5. 역할별 아이콘 색상 시스템
```javascript
// constants/icons.js에 추가
export const ICON_COLORS_BY_ROLE = {
  CLIENT: {
    PRIMARY: {
      background: 'var(--client-primary)',
      color: 'var(--client-text)'
    },
    SECONDARY: {
      background: 'var(--client-secondary)',
      color: 'var(--client-text-light)'
    },
    ACCENT: {
      background: 'var(--client-accent)',
      color: 'var(--color-white)'
    }
  },
  
  CONSULTANT: {
    PRIMARY: {
      background: 'var(--consultant-primary)',
      color: 'var(--consultant-text)'
    },
    SECONDARY: {
      background: 'var(--consultant-secondary)',
      color: 'var(--consultant-text-light)'
    },
    ACCENT: {
      background: 'var(--consultant-accent)',
      color: 'var(--color-white)'
    }
  },
  
  ADMIN: {
    PRIMARY: {
      background: 'var(--admin-primary)',
      color: 'var(--admin-text)'
    },
    SECONDARY: {
      background: 'var(--admin-secondary)',
      color: 'var(--admin-text-light)'
    },
    ACCENT: {
      background: 'var(--admin-accent)',
      color: 'var(--color-white)'
    }
  }
};
```

### 6. 역할별 카드 스타일 시스템
```css
/* 내담자 카드 스타일 */
.mg-card--client {
  background: var(--client-gradient-soft);
  border: 1px solid var(--client-secondary);
  color: var(--client-text);
}

.mg-card--client .mg-card-icon {
  background: var(--client-gradient);
  color: var(--client-text);
}

/* 상담사 카드 스타일 */
.mg-card--consultant {
  background: var(--consultant-gradient-soft);
  border: 1px solid var(--consultant-secondary);
  color: var(--consultant-text);
}

.mg-card--consultant .mg-card-icon {
  background: var(--consultant-gradient);
  color: var(--consultant-text);
}

/* 관리자 카드 스타일 */
.mg-card--admin {
  background: var(--admin-gradient-soft);
  border: 1px solid var(--admin-secondary);
  color: var(--admin-text);
}

.mg-card--admin .mg-card-icon {
  background: var(--admin-gradient);
  color: var(--admin-text);
}
```

### 7. 역할별 섹션 헤더 스타일
```css
/* 내담자 섹션 헤더 */
.mg-section-header--client {
  background: var(--client-gradient);
  color: var(--client-text);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

/* 상담사 섹션 헤더 */
.mg-section-header--consultant {
  background: var(--consultant-gradient);
  color: var(--consultant-text);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

/* 관리자 섹션 헤더 */
.mg-section-header--admin {
  background: var(--admin-gradient);
  color: var(--admin-text);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}
```

### 8. 역할별 테마 적용 방법
```javascript
// 사용자 역할에 따른 테마 적용
export const getThemeByRole = (userRole) => {
  const roleMap = {
    'CLIENT': COLOR_THEMES.CLIENT,
    'CONSULTANT': COLOR_THEMES.CONSULTANT,
    'ADMIN': COLOR_THEMES.ADMIN,
    'BRANCH_ADMIN': COLOR_THEMES.ADMIN,
    'SUPER_ADMIN': COLOR_THEMES.ADMIN,
    'HQ_MASTER': COLOR_THEMES.ADMIN
  };
  
  return roleMap[userRole] || COLOR_THEMES.ADMIN; // 기본값: 관리자 테마
};

// 컴포넌트에서 사용
const Dashboard = ({ userRole }) => {
  const theme = getThemeByRole(userRole);
  
  return (
    <div className={`mg-dashboard-layout mg-theme--${userRole.toLowerCase()}`}>
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

## 🔧 아이콘 중앙화 시스템

### 1. 아이콘 크기 표준

```javascript
// constants/icons.js
export const ICON_SIZES = {
  XS: 12,    // 매우 작은 아이콘 (테이블 행)
  SM: 14,    // 작은 아이콘 (버튼 내부)
  MD: 16,    // 중간 아이콘 (카드 헤더)
  LG: 18,    // 큰 아이콘 (섹션 제목)
  XL: 20,    // 매우 큰 아이콘 (통계 카드)
  XXL: 24,   // 모달 헤더
  XXXL: 32,  // 대시보드 헤더
  HUGE: 48   // 빈 상태
};
```

### 2. 아이콘 색상 표준

```javascript
export const ICON_COLORS = {
  // 기본 아이콘 (민트그린 배경 + 흰색 아이콘)
  PRIMARY: {
    background: 'var(--mint-green)',
    color: 'var(--color-white)'
  },
  
  // 보조 아이콘 (소프트 민트 배경 + 올리브 그린 아이콘)
  SECONDARY: {
    background: 'var(--soft-mint)',
    color: 'var(--olive-green)'
  },
  
  // 성공 아이콘 (녹색 배경 + 흰색 아이콘)
  SUCCESS: {
    background: 'var(--status-success)',
    color: 'var(--color-white)'
  },
  
  // 경고 아이콘 (주황색 배경 + 흰색 아이콘)
  WARNING: {
    background: 'var(--status-warning)',
    color: 'var(--color-white)'
  },
  
  // 오류 아이콘 (빨간색 배경 + 흰색 아이콘)
  ERROR: {
    background: 'var(--status-error)',
    color: 'var(--color-white)'
  },
  
  // 비활성 아이콘 (회색 배경 + 흰색 아이콘)
  MUTED: {
    background: 'var(--medium-gray)',
    color: 'var(--color-white)'
  },
  
  // 투명 배경 (텍스트 색상)
  TRANSPARENT: {
    background: 'transparent',
    color: 'var(--olive-green)'
  }
};
```

### 3. 아이콘 사용 용도별 표준

```javascript
export const ICON_USAGE = {
  // 대시보드 헤더 아이콘
  DASHBOARD_HEADER: { 
    size: 'XXL', 
    variant: 'PRIMARY' 
  },
  
  // 통계 카드 아이콘
  STAT_CARD: { 
    size: 'XL', 
    variant: 'PRIMARY' 
  },
  
  // 섹션 제목 아이콘
  SECTION_TITLE: { 
    size: 'LG', 
    variant: 'PRIMARY' 
  },
  
  // 버튼 내부 아이콘
  BUTTON: { 
    size: 'SM', 
    variant: 'TRANSPARENT' 
  },
  
  // 테이블 행 아이콘
  TABLE_ROW: { 
    size: 'SM', 
    variant: 'SECONDARY' 
  },
  
  // 카드 헤더 아이콘
  CARD_HEADER: { 
    size: 'MD', 
    variant: 'PRIMARY' 
  },
  
  // 모달 헤더 아이콘
  MODAL_HEADER: { 
    size: 'XXL', 
    variant: 'PRIMARY' 
  },
  
  // 빈 상태 아이콘
  EMPTY_STATE: { 
    size: 'HUGE', 
    variant: 'MUTED' 
  }
};
```

## 🏗️ 레이아웃 중앙화 시스템

### 1. 대시보드 레이아웃 시스템

```javascript
// constants/layout.js
export const LAYOUT_SYSTEM = {
  // 대시보드 레이아웃
  DASHBOARD: {
    CONTAINER: 'mg-dashboard-layout',
    HEADER: 'mg-dashboard-header',
    STATS: 'mg-dashboard-stats',
    CONTENT: 'mg-dashboard-content',
    SIDEBAR: 'mg-dashboard-sidebar',
    MAIN: 'mg-dashboard-main'
  },
  
  // 카드 시스템
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
  
  // 섹션 시스템
  SECTION: {
    CONTAINER: 'mg-section',
    HEADER: 'mg-section-header',
    CONTENT: 'mg-section-content',
    TITLE: 'mg-section-title',
    SUBTITLE: 'mg-section-subtitle',
    ICON: 'mg-section-icon',
    ACTIONS: 'mg-section-actions'
  },
  
  // 탭 시스템
  TAB: {
    CONTAINER: 'mg-tabs',
    ITEM: 'mg-tab',
    ACTIVE: 'mg-tab-active',
    CONTENT: 'mg-tab-content'
  },
  
  // 그리드 시스템
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

### 2. 컴포넌트별 레이아웃 패턴

```javascript
export const LAYOUT_PATTERNS = {
  // 통계 대시보드 패턴
  STATS_DASHBOARD: {
    container: LAYOUT_SYSTEM.DASHBOARD.CONTAINER,
    stats: LAYOUT_SYSTEM.GRID.STATS,
    cards: LAYOUT_SYSTEM.CARD.CONTAINER
  },
  
  // 섹션 기반 레이아웃 패턴
  SECTION_LAYOUT: {
    container: LAYOUT_SYSTEM.SECTION.CONTAINER,
    header: LAYOUT_SYSTEM.SECTION.HEADER,
    content: LAYOUT_SYSTEM.SECTION.CONTENT
  },
  
  // 탭 기반 레이아웃 패턴
  TAB_LAYOUT: {
    container: LAYOUT_SYSTEM.TAB.CONTAINER,
    tabs: LAYOUT_SYSTEM.TAB.ITEM,
    content: LAYOUT_SYSTEM.TAB.CONTENT
  }
};
```

## 🎨 CSS 스타일 시스템

### 1. 아이콘 스타일 클래스

```css
/* mindgarden-design-system.css에 추가 */

/* 기본 아이콘 컨테이너 */
.mg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

/* 아이콘 크기별 패딩 */
.mg-icon--xs { padding: 2px; }
.mg-icon--sm { padding: 4px; }
.mg-icon--md { padding: 6px; }
.mg-icon--lg { padding: 8px; }
.mg-icon--xl { padding: 10px; }
.mg-icon--xxl { padding: 12px; }
.mg-icon--xxxl { padding: 16px; }
.mg-icon--huge { padding: 20px; }

/* 아이콘 색상 변형 */
.mg-icon--primary {
  background: var(--mint-green);
  color: var(--color-white);
}

.mg-icon--secondary {
  background: var(--soft-mint);
  color: var(--olive-green);
}

.mg-icon--success {
  background: var(--status-success);
  color: var(--color-white);
}

.mg-icon--warning {
  background: var(--status-warning);
  color: var(--color-white);
}

.mg-icon--error {
  background: var(--status-error);
  color: var(--color-white);
}

.mg-icon--muted {
  background: var(--medium-gray);
  color: var(--color-white);
}

.mg-icon--transparent {
  background: transparent;
  color: var(--olive-green);
}

/* 호버 효과 */
.mg-icon--primary:hover {
  background: var(--olive-green);
  transform: translateY(-1px);
}

.mg-icon--secondary:hover {
  background: var(--mint-green);
  color: var(--color-white);
}
```

### 2. 레이아웃 스타일 클래스

```css
/* 대시보드 레이아웃 */
.mg-dashboard-layout {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.mg-dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.mg-dashboard-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 카드 시스템 */
.mg-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.mg-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);
}

.mg-card-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.mg-card-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

/* 섹션 시스템 */
.mg-section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.mg-section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
}

.mg-section-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.mg-section-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: var(--spacing-xs) 0 0 0;
}

/* 탭 시스템 */
.mg-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.mg-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mg-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.mg-tab-active {
  background: var(--mint-green);
  color: var(--color-white);
}
```

## 🧩 재사용 가능한 컴포넌트

### 1. StatCard 컴포넌트

```jsx
// components/ui/StatCard.js
import React from 'react';
import { ICONS, ICON_SIZES, ICON_USAGE, LAYOUT_SYSTEM } from '../../constants/icons';

const StatCard = ({ 
  icon, 
  value, 
  label, 
  variant = 'primary',
  size = 'xl',
  className = '' 
}) => {
  const iconSize = ICON_SIZES[size.toUpperCase()];
  const IconComponent = ICONS[icon];
  
  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in ICONS`);
    return null;
  }
  
  return (
    <div className={`${LAYOUT_SYSTEM.CARD.CONTAINER} ${className}`}>
      <div className={`${LAYOUT_SYSTEM.CARD.ICON} mg-icon--${variant}`}>
        <IconComponent size={iconSize} />
      </div>
      <div className={LAYOUT_SYSTEM.CARD.CONTENT}>
        <div className={LAYOUT_SYSTEM.CARD.VALUE}>{value}</div>
        <div className={LAYOUT_SYSTEM.CARD.LABEL}>{label}</div>
      </div>
    </div>
  );
};

export default StatCard;
```

### 2. SectionHeader 컴포넌트

```jsx
// components/ui/SectionHeader.js
import React from 'react';
import { ICONS, ICON_SIZES, ICON_USAGE, LAYOUT_SYSTEM } from '../../constants/icons';

const SectionHeader = ({ 
  icon, 
  title, 
  subtitle, 
  variant = 'primary',
  actions,
  className = '' 
}) => {
  const iconSize = ICON_SIZES[ICON_USAGE.SECTION_TITLE.size];
  const IconComponent = ICONS[icon];
  
  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in ICONS`);
    return null;
  }
  
  return (
    <div className={`${LAYOUT_SYSTEM.SECTION.HEADER} ${className}`}>
      <div className={`${LAYOUT_SYSTEM.SECTION.ICON} mg-icon--${variant}`}>
        <IconComponent size={iconSize} />
      </div>
      <div className={LAYOUT_SYSTEM.SECTION.CONTENT}>
        <h2 className={LAYOUT_SYSTEM.SECTION.TITLE}>{title}</h2>
        {subtitle && (
          <p className={LAYOUT_SYSTEM.SECTION.SUBTITLE}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className={LAYOUT_SYSTEM.SECTION.ACTIONS}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
```

### 3. TabNavigation 컴포넌트

```jsx
// components/ui/TabNavigation.js
import React from 'react';
import { ICONS, ICON_SIZES, ICON_USAGE, LAYOUT_SYSTEM } from '../../constants/icons';

const TabNavigation = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  className = '' 
}) => {
  return (
    <div className={`${LAYOUT_SYSTEM.TAB.CONTAINER} ${className}`}>
      {tabs.map((tab) => {
        const IconComponent = ICONS[tab.icon];
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            className={`${LAYOUT_SYSTEM.TAB.ITEM} ${isActive ? LAYOUT_SYSTEM.TAB.ACTIVE : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {IconComponent && (
              <IconComponent 
                size={ICON_SIZES[ICON_USAGE.BUTTON.size]} 
              />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
```

## 📝 사용 가이드라인

### 1. 아이콘 사용 규칙

#### ✅ 올바른 사용법
```jsx
// 중앙화된 아이콘 사용
import { ICONS, ICON_SIZES, ICON_USAGE } from '../../constants/icons';

// 크기 지정 방식
<ICONS.PLUS size={ICON_SIZES.MD} />

// 용도별 표준 사용
<ICONS.PLUS size={ICON_SIZES[ICON_USAGE.BUTTON.size]} />

// 컴포넌트 사용
<StatCard icon="USERS" value={10} label="총 사용자" />
```

#### ❌ 잘못된 사용법
```jsx
// 직접 import 금지
import { Plus } from 'lucide-react';

// 하드코딩된 크기 금지
<Plus size={16} />
<Plus size={18} />

// 일관성 없는 크기 사용 금지
<Plus size={16} />
<Users size={18} />
<Calendar size={20} />
```

### 2. 레이아웃 사용 규칙

#### ✅ 올바른 사용법
```jsx
// 중앙화된 레이아웃 클래스 사용
import { LAYOUT_SYSTEM } from '../../constants/layout';

<div className={LAYOUT_SYSTEM.DASHBOARD.CONTAINER}>
  <div className={LAYOUT_SYSTEM.DASHBOARD.STATS}>
    <StatCard icon="USERS" value={10} label="총 사용자" />
  </div>
</div>

// 컴포넌트 사용
<SectionHeader 
  icon="CALENDAR" 
  title="회기 관리" 
  subtitle="내담자의 상담 회기를 관리합니다" 
/>
```

#### ❌ 잘못된 사용법
```jsx
// 하드코딩된 클래스명 금지
<div className="mg-session-management-redesign">
<div className="mg-session-stats-grid">
<div className="mg-stat-card">

// 일관성 없는 클래스명 금지
<div className="session-stats">
<div className="stats-grid">
<div className="stat-card">
```

## 🚀 마이그레이션 계획

### Phase 1: 기반 구축
1. `constants/icons.js` 확장
2. `constants/layout.js` 생성
3. CSS 스타일 추가

### Phase 2: 컴포넌트 생성
1. `StatCard` 컴포넌트 생성
2. `SectionHeader` 컴포넌트 생성
3. `TabNavigation` 컴포넌트 생성

### Phase 3: SessionManagement.js 적용
1. Import 문 변경
2. 아이콘 사용 방식 변경
3. 레이아웃 클래스 변경
4. 컴포넌트 적용

### Phase 4: 전체 확장
1. 다른 Admin 컴포넌트에 적용
2. 전체 대시보드 마이그레이션
3. 문서화 및 가이드라인 정리

## 📚 참고 자료

- [MindGarden 디자인 시스템 가이드](./MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)
- [디자인 시스템 아키텍처](./DESIGN_SYSTEM_ARCHITECTURE.md)
- [구현 계획](./IMPLEMENTATION_PLAN.md)

## 🔄 업데이트 이력

- **2025-01-23**: 초기 문서 작성
- **2025-01-23**: 아이콘 중앙화 시스템 정의
- **2025-01-23**: 레이아웃 중앙화 시스템 정의
- **2025-01-23**: 재사용 컴포넌트 설계
- **2025-01-23**: 역할별 색상 테마 시스템 추가
  - 내담자 테마: 화사한 분위기 (핑크 계열)
  - 상담사 테마: 활력 충만 분위기 (민트 그린 계열)
  - 관리자 테마: 간결하고 깔끔한 분위기 (블루 계열)
- **2025-01-23**: MGButton 전체 적용 섹션 추가
- **2025-01-23**: 통일된 카드 레이아웃 시스템 섹션 추가
- **2025-01-23**: 마스터 가이드 링크 추가

## 📚 관련 문서

- **[MASTER_GUIDE.md](./MASTER_GUIDE.md)** - 전체 디자인 시스템 개요
- **[CARD_SYSTEM_GUIDE.md](./CARD_SYSTEM_GUIDE.md)** - 카드 시스템 상세 가이드
- **[MGBUTTON_MIGRATION_GUIDE.md](./MGBUTTON_MIGRATION_GUIDE.md)** - MGButton 마이그레이션 가이드
- **[MOBILE_OPTIMIZATION_GUIDE.md](./MOBILE_OPTIMIZATION_GUIDE.md)** - 모바일 최적화 가이드
