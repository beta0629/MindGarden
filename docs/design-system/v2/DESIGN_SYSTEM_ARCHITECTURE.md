# MindGarden 디자인 시스템 아키텍처

**작성일**: 2025년 10월 14일  
**버전**: 1.0  
**문서 유형**: Architecture & Implementation Guide

---

## 📋 목차

1. [개요](#개요)
2. [디렉토리 구조](#디렉토리-구조)
3. [CSS 아키텍처](#css-아키텍처)
4. [컴포넌트 아키텍처](#컴포넌트-아키텍처)
5. [테마 시스템](#테마-시스템)
6. [마이그레이션 가이드](#마이그레이션-가이드)
7. [개발 워크플로우](#개발-워크플로우)

---

## 개요

### 설계 목표

1. **확장성**: 새로운 컴포넌트 추가가 용이
2. **일관성**: 모든 페이지에서 동일한 디자인 언어
3. **유지보수성**: CSS Variables 기반 테마 시스템
4. **성능**: 순수 CSS, 최소한의 JavaScript
5. **접근성**: WCAG 2.1 AA 수준 준수

### 핵심 원칙

```
단일 진실의 원천 (Single Source of Truth)
  ↓
CSS Variables로 중앙 관리
  ↓
컴포넌트 재사용
  ↓
일관된 사용자 경험
```

---

## 디렉토리 구조

### 현재 구조

```
frontend/src/
├── styles/
│   ├── mindgarden-design-system.css    # 메인 디자인 시스템 (우선 사용)
│   ├── design-system/
│   │   └── admin-design-guidelines.css  # Admin 전용 (점진적 마이그레이션)
│   └── 00-core/
│       └── _variables.css               # Legacy CSS Variables (유지)
│
├── components/
│   ├── mindgarden/                      # 디자인 시스템 컴포넌트 (참고용)
│   │   ├── HeroSection.js
│   │   ├── StatsDashboard.js
│   │   ├── ButtonShowcase.js
│   │   ├── CardShowcase.js
│   │   ├── ClientCardShowcase.js
│   │   ├── ConsultantCardShowcase.js
│   │   ├── DashboardLayoutShowcase.js
│   │   └── ... (18개 쇼케이스 컴포넌트)
│   │
│   ├── admin/                           # Admin 컴포넌트 (마이그레이션 대상)
│   ├── consultant/                      # Consultant 컴포넌트 (마이그레이션 대상)
│   ├── client/                          # Client 컴포넌트 (마이그레이션 대상)
│   └── common/                          # 공통 컴포넌트
│
├── pages/
│   └── MindGardenDesignSystemShowcase.js # 디자인 시스템 쇼케이스
│
└── App.js                               # 라우팅 설정
```

### 권장 구조 (마이그레이션 후)

```
frontend/src/
├── styles/
│   ├── design-system/
│   │   ├── core/
│   │   │   ├── variables.css           # CSS Variables (테마)
│   │   │   ├── reset.css               # CSS Reset
│   │   │   └── typography.css          # 타이포그래피
│   │   ├── components/
│   │   │   ├── buttons.css
│   │   │   ├── cards.css
│   │   │   ├── forms.css
│   │   │   ├── modals.css
│   │   │   ├── tables.css
│   │   │   └── dashboard.css           # 대시보드 전용
│   │   ├── layouts/
│   │   │   ├── dashboard-layout.css
│   │   │   └── grid.css
│   │   └── themes/
│   │       ├── default.css              # 기본 테마
│   │       ├── dark.css                 # 다크 테마 (미래)
│   │       └── high-contrast.css        # 고대비 테마 (미래)
│   │
│   └── mindgarden-design-system.css    # 통합 파일 (현재 사용 중)
│
└── components/
    ├── ui/                              # 재사용 가능한 UI 컴포넌트
    │   ├── Button/
    │   │   ├── Button.js
    │   │   └── Button.module.css        # CSS Modules (선택 사항)
    │   ├── Card/
    │   ├── Modal/
    │   └── ...
    │
    └── features/                        # 기능별 컴포넌트
        ├── admin/
        ├── consultant/
        └── client/
```

---

## CSS 아키텍처

### CSS Variables 계층 구조

```css
/* Level 1: 기본 색상 팔레트 */
:root {
  /* Primary Colors */
  --color-cream: #F5F5DC;
  --color-light-beige: #FDF5E6;
  --color-olive-green: #808000;
  --color-mint-green: #98FB98;
  --color-soft-mint: #B6E5D8;
  
  /* Neutral Colors */
  --color-dark-gray: #2F2F2F;
  --color-medium-gray: #6B6B6B;
  --color-light-gray: #E5E5E5;
  
  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}

/* Level 2: 의미론적 색상 (Semantic Colors) */
:root {
  /* Text */
  --text-primary: var(--color-dark-gray);
  --text-secondary: var(--color-medium-gray);
  --text-inverse: #FFFFFF;
  
  /* Background */
  --bg-primary: var(--color-cream);
  --bg-secondary: var(--color-light-beige);
  --bg-surface: #FFFFFF;
  
  /* Border */
  --border-color: var(--color-light-gray);
  --border-focus: var(--color-olive-green);
  
  /* Interactive */
  --interactive-primary: var(--color-olive-green);
  --interactive-hover: var(--color-mint-green);
}

/* Level 3: 컴포넌트 토큰 (Component Tokens) */
:root {
  /* Button */
  --button-primary-bg: var(--color-mint-green);
  --button-primary-text: var(--text-primary);
  --button-primary-hover: var(--color-olive-green);
  
  /* Card */
  --card-bg: rgba(255, 255, 255, 0.6);
  --card-border: rgba(255, 255, 255, 0.5);
  --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  /* Dashboard */
  --dashboard-stat-icon-bg: linear-gradient(135deg, var(--color-mint-green), var(--color-soft-mint));
}
```

### CSS 명명 규칙 (BEM 기반)

```css
/* Block */
.mg-button { }

/* Element */
.mg-button__icon { }
.mg-button__text { }

/* Modifier */
.mg-button--primary { }
.mg-button--outline { }
.mg-button--large { }

/* State */
.mg-button.is-loading { }
.mg-button.is-disabled { }
```

### 파일 구조 패턴

```css
/* 1. 컴포넌트 기본 스타일 */
.mg-dashboard-layout {
  /* 레이아웃 */
  /* 박스 모델 */
  /* 타이포그래피 */
  /* 시각적 스타일 */
  /* 기타 */
}

/* 2. 컴포넌트 변형 */
.mg-dashboard-layout--compact { }

/* 3. 컴포넌트 하위 요소 */
.mg-dashboard-layout__header { }
.mg-dashboard-layout__content { }

/* 4. 반응형 (모바일 우선) */
@media (max-width: 768px) {
  .mg-dashboard-layout {
    /* 모바일 스타일 */
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .mg-dashboard-layout {
    /* 태블릿 스타일 */
  }
}
```

---

## 컴포넌트 아키텍처

### 컴포넌트 개발 패턴

#### 1. Presentational Component (표현 컴포넌트)

```jsx
// components/ui/Button/Button.js
import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  onClick,
  disabled = false,
  ...props 
}) => {
  const baseClass = 'mg-button';
  const variantClass = `mg-button-${variant}`;
  const sizeClass = size !== 'medium' ? `mg-button-${size}` : '';
  
  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass}`.trim()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
```

#### 2. Container Component (컨테이너 컴포넌트)

```jsx
// components/features/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import DashboardLayout from '../../ui/DashboardLayout';
import StatCard from '../../ui/StatCard';

const AdminDashboard = () => {
  const { user } = useSession();
  const [stats, setStats] = useState([]);
  
  useEffect(() => {
    // 데이터 로딩 로직
  }, []);
  
  return (
    <DashboardLayout
      title="관리자 대시보드"
      subtitle="시스템 전체 현황"
    >
      <div className="mg-dashboard-stats">
        {stats.map(stat => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
```

#### 3. Compound Component Pattern (복합 컴포넌트)

```jsx
// components/ui/Card/Card.js
const Card = ({ children, className = '' }) => (
  <div className={`mg-card ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="mg-card__header">
    {children}
  </div>
);

const CardBody = ({ children }) => (
  <div className="mg-card__body">
    {children}
  </div>
);

const CardFooter = ({ children }) => (
  <div className="mg-card__footer">
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;

// 사용 예시
<Card>
  <Card.Header>
    <h3>제목</h3>
  </Card.Header>
  <Card.Body>
    내용
  </Card.Body>
  <Card.Footer>
    <Button>확인</Button>
  </Card.Footer>
</Card>
```

---

## 테마 시스템

### 테마 구조

```javascript
// themes/defaultTheme.js
export const defaultTheme = {
  colors: {
    primary: {
      main: '#98FB98',
      hover: '#808000',
      active: '#6B6B00',
    },
    background: {
      primary: '#F5F5DC',
      secondary: '#FDF5E6',
      surface: '#FFFFFF',
    },
    text: {
      primary: '#2F2F2F',
      secondary: '#6B6B6B',
      inverse: '#FFFFFF',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  typography: {
    fontFamily: {
      base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '50%',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
};
```

### Theme Provider (Context API)

```jsx
// contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { defaultTheme } from '../themes/defaultTheme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const [themeName, setThemeName] = useState('default');

  useEffect(() => {
    // CSS Variables 적용
    const root = document.documentElement;
    
    Object.entries(theme.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });
    
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    // ... 다른 테마 속성들
  }, [theme]);

  const switchTheme = (newThemeName) => {
    // 테마 전환 로직
    setThemeName(newThemeName);
    // 로컬 스토리지에 저장
    localStorage.setItem('theme', newThemeName);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 테마 적용 예시

```jsx
// App.js
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        {/* 앱 컨텐츠 */}
      </Router>
    </ThemeProvider>
  );
}
```

---

## 마이그레이션 가이드

### Phase 1: 준비 단계 (완료)

- [x] 디자인 시스템 쇼케이스 완성
- [x] `mindgarden-design-system.css` 작성
- [x] 18개 컴포넌트 정의
- [x] 디자인 가이드 문서 작성
- [x] 아키텍처 문서 작성

### Phase 2: 공통 컴포넌트 마이그레이션 (다음 단계)

#### 우선순위 1: 레이아웃 컴포넌트
```
1. DashboardLayout
2. PageHeader
3. Section
4. Grid
```

#### 우선순위 2: 기본 UI 컴포넌트
```
1. Button
2. Card
3. Input, Textarea, Select
4. Modal
5. Table
```

#### 우선순위 3: 복합 컴포넌트
```
1. StatCard
2. ClientCard
3. ConsultantCard
4. ActivityFeed
```

### Phase 3: 페이지별 마이그레이션

#### 순서
```
1. Admin Dashboard → 가장 복잡, 템플릿 역할
2. Consultant Dashboard → Admin 템플릿 재사용
3. Client Dashboard → Admin 템플릿 재사용
4. 기타 페이지들
```

### 마이그레이션 체크리스트

각 페이지 마이그레이션 시:

```markdown
## [페이지명] 마이그레이션

### Before
- [ ] 기존 CSS 파일 확인
- [ ] 하드코딩된 스타일 목록 작성
- [ ] 컴포넌트 의존성 확인

### During
- [ ] `mg-dashboard-layout` 적용
- [ ] 인라인 스타일 → CSS 클래스 변환
- [ ] CSS Variables 사용
- [ ] 공통 컴포넌트로 교체
- [ ] 테이블에 `data-label` 추가

### After
- [ ] 데스크탑 테스트
- [ ] 태블릿 테스트
- [ ] 모바일 테스트
- [ ] 브라우저 호환성 테스트
- [ ] 접근성 테스트
- [ ] 성능 테스트

### Cleanup
- [ ] 사용하지 않는 CSS 제거
- [ ] 사용하지 않는 컴포넌트 제거
- [ ] 코드 리뷰
- [ ] 문서 업데이트
```

---

## 개발 워크플로우

### 새 컴포넌트 개발

1. **디자인 시스템 쇼케이스 확인**
   ```
   http://localhost:3000/design-system
   ```

2. **컴포넌트 생성**
   ```bash
   # UI 컴포넌트
   frontend/src/components/ui/[ComponentName]/
   ├── [ComponentName].js
   └── [ComponentName].test.js (optional)
   ```

3. **스타일 적용**
   ```jsx
   // CSS 클래스 사용
   <div className="mg-card mg-card--glass">
     {/* 컨텐츠 */}
   </div>
   ```

4. **테스트**
   - 데스크탑 (1920x1080)
   - 태블릿 (768x1024)
   - 모바일 (375x667)

5. **문서화**
   - JSDoc 주석 추가
   - Props 설명
   - 사용 예시

### 기존 페이지 수정

1. **현재 상태 확인**
   ```bash
   # 사용 중인 CSS 클래스 확인
   grep -r "className" [ComponentFile].js
   ```

2. **디자인 가이드 참조**
   ```
   docs/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md
   ```

3. **점진적 마이그레이션**
   - 한 번에 하나의 섹션씩
   - 기능 유지하면서 스타일만 변경
   - 테스트 후 다음 섹션

4. **코드 리뷰**
   - 디자인 일관성 확인
   - 반응형 확인
   - 성능 확인

### Git 워크플로우

```bash
# Feature 브랜치 생성
git checkout -b feature/migrate-admin-dashboard

# 작업 후 커밋
git add .
git commit -m "feat: Migrate Admin Dashboard to new design system

- Apply mg-dashboard-layout
- Replace inline styles with CSS classes
- Add responsive mobile layout
- Update tests

Ref: #123"

# Push 및 PR 생성
git push origin feature/migrate-admin-dashboard
```

---

## 성능 최적화

### CSS 최적화

```css
/* Bad: 중복된 스타일 */
.admin-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
}

.consultant-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
}

/* Good: 재사용 가능한 클래스 */
.mg-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}
```

### JavaScript 최적화

```jsx
// Bad: 매번 새로운 객체 생성
<div style={{ padding: '16px', margin: '8px' }}>

// Good: CSS 클래스 사용
<div className="mg-p-lg mg-m-sm">
```

### 번들 크기 최적화

```javascript
// Bad: 전체 라이브러리 import
import { Icon } from 'lucide-react';

// Good: 필요한 아이콘만 import
import { Users, Calendar, TrendingUp } from 'lucide-react';
```

---

## 문제 해결

### 일반적인 이슈

#### 1. CSS 적용 안 됨
```css
/* 문제: CSS 우선순위 */
.custom-style { color: red; }

/* 해결: !important 사용 (최후의 수단) */
.custom-style { color: red !important; }

/* 더 나은 해결: 구체성 높이기 */
.mg-dashboard-layout .custom-style { color: red; }
```

#### 2. 모바일 레이아웃 깨짐
```css
/* 문제: 고정 너비 */
.container { width: 1200px; }

/* 해결: 최대 너비 사용 */
.container { 
  width: 100%; 
  max-width: 1200px;
  box-sizing: border-box;
}
```

#### 3. z-index 충돌
```
레이어 계층:
- Modal: 9999
- Dropdown: 1000
- Sticky Header: 100
- Content: 1
```

---

## 도구 및 리소스

### 개발 도구

- **Chrome DevTools**: 반응형 테스트
- **React DevTools**: 컴포넌트 디버깅
- **VS Code Extensions**:
  - CSS Peek
  - CSS Variable Autocomplete
  - Prettier

### 참조 문서

- [디자인 시스템 가이드](/docs/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)
- [디자인 시스템 쇼케이스](http://localhost:3000/design-system)
- [CSS 파일](/frontend/src/styles/mindgarden-design-system.css)

---

## 다음 단계

### 즉시 실행 가능한 작업

1. **Theme Provider 구현**
   ```bash
   frontend/src/contexts/ThemeContext.js
   ```

2. **공통 UI 컴포넌트 생성**
   ```bash
   frontend/src/components/ui/
   ├── Button/
   ├── Card/
   ├── Modal/
   └── Table/
   ```

3. **Admin Dashboard 마이그레이션**
   ```bash
   frontend/src/components/admin/AdminDashboard.js
   ```

### 장기 계획

- [ ] 다크 테마 추가
- [ ] 고대비 테마 추가 (접근성)
- [ ] 애니메이션 라이브러리 통합
- [ ] Storybook 도입
- [ ] 디자인 토큰 자동화

---

**문서 관리**:
- 이 문서는 디자인 시스템 변경 시 함께 업데이트됩니다.
- 질문이나 제안사항은 팀 리드에게 문의하세요.

**관련 문서**:
- [디자인 시스템 가이드](/docs/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)
- [마이그레이션 플랜](/v0-pure-css-prompt.plan.md)

