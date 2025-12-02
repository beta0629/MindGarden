# 디자인 중앙화 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 디자인 시스템 중앙화 및 표준화 가이드입니다.

### 참조 문서
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [DTO 네이밍 표준](./DTO_NAMING_STANDARD.md)

### 구현 위치
- **CSS 변수**: `frontend/src/styles/unified-design-tokens.css`
- **테마 시스템**: `frontend/src/themes/`
- **컴포넌트**: `frontend/src/components/ui/`

---

## 🎯 중앙화 원칙

### 1. 모든 디자인 토큰은 CSS 변수로 관리
```css
/* ✅ 권장 */
:root {
  --mg-primary-500: #3b82f6;
  --mg-spacing-4: 1rem;
  --mg-border-radius-md: 0.375rem;
}

.button {
  background-color: var(--mg-primary-500);
  padding: var(--mg-spacing-4);
  border-radius: var(--mg-border-radius-md);
}

/* ❌ 금지 - 하드코딩 */
.button {
  background-color: #3b82f6;
  padding: 1rem;
  border-radius: 0.375rem;
}
```

---

### 2. 네이밍 규칙

#### CSS 클래스 네이밍 (BEM 기반)
```
형식: mg-{component}-{element}--{modifier}
```

**예시**:
```css
/* 컴포넌트 */
.mg-btn { }
.mg-card { }
.mg-modal { }

/* 요소 */
.mg-btn-icon { }
.mg-card-header { }
.mg-modal-content { }

/* 수정자 */
.mg-btn--primary { }
.mg-btn--large { }
.mg-card--elevated { }
```

#### CSS 변수 네이밍
```
형식: --mg-{category}-{property}-{variant}
```

**예시**:
```css
/* 색상 */
--mg-primary-500
--mg-secondary-600
--mg-success-400

/* 간격 */
--mg-spacing-1
--mg-spacing-4
--mg-spacing-8

/* 타이포그래피 */
--mg-font-size-sm
--mg-font-weight-bold
--mg-line-height-normal

/* 레이아웃 */
--mg-border-radius-md
--mg-shadow-lg
--mg-transition-fast
```

---

## 📋 CSS 변수 카테고리

### 1. 색상 시스템

#### Primary Colors
```css
:root {
  --mg-primary-50: #eff6ff;
  --mg-primary-100: #dbeafe;
  --mg-primary-200: #bfdbfe;
  --mg-primary-300: #93c5fd;
  --mg-primary-400: #60a5fa;
  --mg-primary-500: #3b82f6;  /* 기본 */
  --mg-primary-600: #2563eb;
  --mg-primary-700: #1d4ed8;
  --mg-primary-800: #1e40af;
  --mg-primary-900: #1e3a8a;
}
```

#### Semantic Colors
```css
:root {
  --mg-success: #10b981;
  --mg-warning: #f59e0b;
  --mg-error: #ef4444;
  --mg-info: #3b82f6;
}
```

#### Neutral Colors
```css
:root {
  --mg-gray-50: #f9fafb;
  --mg-gray-100: #f3f4f6;
  --mg-gray-200: #e5e7eb;
  --mg-gray-300: #d1d5db;
  --mg-gray-400: #9ca3af;
  --mg-gray-500: #6b7280;
  --mg-gray-600: #4b5563;
  --mg-gray-700: #374151;
  --mg-gray-800: #1f2937;
  --mg-gray-900: #111827;
}
```

---

### 2. 간격 시스템
```css
:root {
  --mg-spacing-0: 0;
  --mg-spacing-1: 0.25rem;   /* 4px */
  --mg-spacing-2: 0.5rem;    /* 8px */
  --mg-spacing-3: 0.75rem;   /* 12px */
  --mg-spacing-4: 1rem;      /* 16px */
  --mg-spacing-5: 1.25rem;   /* 20px */
  --mg-spacing-6: 1.5rem;    /* 24px */
  --mg-spacing-8: 2rem;      /* 32px */
  --mg-spacing-10: 2.5rem;   /* 40px */
  --mg-spacing-12: 3rem;     /* 48px */
  --mg-spacing-16: 4rem;     /* 64px */
}
```

---

### 3. 타이포그래피
```css
:root {
  /* Font Family */
  --mg-font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --mg-font-mono: 'SF Mono', Monaco, 'Courier New', monospace;
  
  /* Font Size */
  --mg-font-size-xs: 0.75rem;    /* 12px */
  --mg-font-size-sm: 0.875rem;   /* 14px */
  --mg-font-size-base: 1rem;     /* 16px */
  --mg-font-size-lg: 1.125rem;   /* 18px */
  --mg-font-size-xl: 1.25rem;    /* 20px */
  --mg-font-size-2xl: 1.5rem;    /* 24px */
  --mg-font-size-3xl: 1.875rem;  /* 30px */
  --mg-font-size-4xl: 2.25rem;   /* 36px */
  
  /* Font Weight */
  --mg-font-weight-light: 300;
  --mg-font-weight-normal: 400;
  --mg-font-weight-medium: 500;
  --mg-font-weight-semibold: 600;
  --mg-font-weight-bold: 700;
  
  /* Line Height */
  --mg-line-height-tight: 1.25;
  --mg-line-height-normal: 1.5;
  --mg-line-height-relaxed: 1.75;
}
```

---

### 4. 레이아웃
```css
:root {
  /* Border Radius */
  --mg-border-radius-none: 0;
  --mg-border-radius-sm: 0.125rem;   /* 2px */
  --mg-border-radius-md: 0.375rem;   /* 6px */
  --mg-border-radius-lg: 0.5rem;     /* 8px */
  --mg-border-radius-xl: 0.75rem;    /* 12px */
  --mg-border-radius-2xl: 1rem;      /* 16px */
  --mg-border-radius-full: 9999px;
  
  /* Shadow */
  --mg-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --mg-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --mg-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --mg-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transition */
  --mg-transition-fast: 150ms;
  --mg-transition-base: 200ms;
  --mg-transition-slow: 300ms;
  
  /* Z-Index */
  --mg-z-dropdown: 1000;
  --mg-z-sticky: 1020;
  --mg-z-fixed: 1030;
  --mg-z-modal-backdrop: 1040;
  --mg-z-modal: 1050;
  --mg-z-popover: 1060;
  --mg-z-tooltip: 1070;
}
```

---

## 💻 컴포넌트 표준

### 1. 버튼 컴포넌트
```css
/* 기본 버튼 */
.mg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--mg-spacing-2) var(--mg-spacing-4);
  font-size: var(--mg-font-size-sm);
  font-weight: var(--mg-font-weight-medium);
  border-radius: var(--mg-border-radius-md);
  transition: all var(--mg-transition-base) ease;
  cursor: pointer;
  border: none;
}

/* Primary 버튼 */
.mg-btn--primary {
  background-color: var(--mg-primary-500);
  color: white;
}

.mg-btn--primary:hover {
  background-color: var(--mg-primary-600);
}

/* 크기 변형 */
.mg-btn--sm {
  padding: var(--mg-spacing-1) var(--mg-spacing-3);
  font-size: var(--mg-font-size-xs);
}

.mg-btn--lg {
  padding: var(--mg-spacing-3) var(--mg-spacing-6);
  font-size: var(--mg-font-size-base);
}
```

---

### 2. 카드 컴포넌트
```css
.mg-card {
  background-color: white;
  border-radius: var(--mg-border-radius-lg);
  box-shadow: var(--mg-shadow-md);
  padding: var(--mg-spacing-6);
  transition: all var(--mg-transition-base) ease;
}

.mg-card:hover {
  box-shadow: var(--mg-shadow-lg);
  transform: translateY(-2px);
}

.mg-card-header {
  margin-bottom: var(--mg-spacing-4);
  padding-bottom: var(--mg-spacing-4);
  border-bottom: 1px solid var(--mg-gray-200);
}

.mg-card-title {
  font-size: var(--mg-font-size-lg);
  font-weight: var(--mg-font-weight-semibold);
  color: var(--mg-gray-900);
}

.mg-card-body {
  color: var(--mg-gray-700);
}
```

---

### 3. 모달 컴포넌트
```css
.mg-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: var(--mg-z-modal-backdrop);
}

.mg-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: var(--mg-border-radius-xl);
  box-shadow: var(--mg-shadow-xl);
  z-index: var(--mg-z-modal);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.mg-modal-header {
  padding: var(--mg-spacing-6);
  border-bottom: 1px solid var(--mg-gray-200);
}

.mg-modal-content {
  padding: var(--mg-spacing-6);
}

.mg-modal-footer {
  padding: var(--mg-spacing-6);
  border-top: 1px solid var(--mg-gray-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--mg-spacing-3);
}
```

---

## 🧩 위젯 시스템

### 1. 위젯 CSS 변수
```css
:root {
  /* 위젯 레이아웃 */
  --widget-border-radius: 12px;
  --widget-border-radius-lg: 16px;
  --widget-border-radius-sm: 8px;
  --widget-padding: 1.5rem;
  --widget-padding-sm: 1rem;
  --widget-padding-lg: 2rem;
  --widget-margin-bottom: 1.5rem;
  --widget-min-height: 180px;
  --widget-min-height-lg: 220px;
  
  /* 위젯 그리드 */
  --widget-grid-gap: 1.5rem;
  --widget-grid-gap-sm: 1rem;
  --widget-grid-min-width: 220px;
  --widget-stats-grid-min-width: 200px;
  
  /* 위젯 색상 */
  --widget-background: #ffffff;
  --widget-background-gradient: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  --widget-border-color: var(--mg-gray-200);
  --widget-border-color-hover: var(--mg-primary-200);
  
  /* 위젯 그림자 */
  --widget-shadow: var(--mg-shadow-sm);
  --widget-shadow-hover: var(--mg-shadow-md);
  --widget-shadow-primary: var(--mg-shadow-primary);
  
  /* 위젯 애니메이션 */
  --widget-transition: all 0.3s ease;
  --widget-transition-fast: all 0.2s ease;
  --widget-hover-transform: translateY(-2px);
  
  /* 위젯 타이포그래피 */
  --widget-title-size: 1.25rem;
  --widget-subtitle-size: 0.875rem;
  --widget-value-size: 2.25rem;
  --widget-value-size-lg: 2.5rem;
  --widget-label-size: 0.875rem;
  
  /* 위젯 아이콘 */
  --widget-icon-size: 48px;
  --widget-icon-size-sm: 40px;
  --widget-icon-font-size: 1.5rem;
  --widget-icon-border-radius: 12px;
}
```

---

### 2. 위젯 컴포넌트 구조

#### BaseWidget 컴포넌트
```javascript
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import { MG_DESIGN_TOKENS } from '../../../constants/designTokens';

const BaseWidget = ({
  widget = {},
  loading = false,
  error = null,
  isEmpty = false,
  children,
  onRefresh,
  headerActions,
  footer,
  size = 'md',
  variant = 'default'
}) => {
  return (
    <div className={`mg-widget mg-widget--${size} mg-widget--${variant}`}>
      {/* 위젯 헤더 */}
      <div className="mg-widget__header">
        <h3 className="mg-widget__title">{widget.title}</h3>
        {headerActions && (
          <div className="mg-widget__actions">
            {headerActions}
          </div>
        )}
      </div>
      
      {/* 위젯 바디 */}
      <div className="mg-widget__body">
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}
        {isEmpty && <EmptyState />}
        {!loading && !error && !isEmpty && children}
      </div>
      
      {/* 위젯 푸터 */}
      {footer && (
        <div className="mg-widget__footer">
          {footer}
        </div>
      )}
    </div>
  );
};
```

---

### 3. 위젯 CSS 클래스

#### 위젯 컨테이너
```css
.mg-widget {
  background-color: var(--widget-background);
  border-radius: var(--widget-border-radius);
  box-shadow: var(--widget-shadow);
  padding: var(--widget-padding);
  margin-bottom: var(--widget-margin-bottom);
  min-height: var(--widget-min-height);
  transition: var(--widget-transition);
}

.mg-widget:hover {
  box-shadow: var(--widget-shadow-hover);
  transform: var(--widget-hover-transform);
}

/* 크기 변형 */
.mg-widget--sm {
  padding: var(--widget-padding-sm);
  min-height: calc(var(--widget-min-height) * 0.8);
}

.mg-widget--lg {
  padding: var(--widget-padding-lg);
  min-height: var(--widget-min-height-lg);
}

/* 스타일 변형 */
.mg-widget--card {
  border: 1px solid var(--widget-border-color);
}

.mg-widget--minimal {
  box-shadow: none;
  border: 1px solid var(--widget-border-color);
}
```

#### 위젯 헤더
```css
.mg-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--mg-spacing-4);
  padding-bottom: var(--mg-spacing-3);
  border-bottom: 1px solid var(--widget-border-color);
}

.mg-widget__title {
  font-size: var(--widget-title-size);
  font-weight: var(--widget-title-weight);
  color: var(--mg-gray-900);
  margin: 0;
}

.mg-widget__subtitle {
  font-size: var(--widget-subtitle-size);
  color: var(--mg-gray-600);
  margin-top: var(--mg-spacing-1);
}

.mg-widget__actions {
  display: flex;
  gap: var(--mg-spacing-2);
}
```

#### 위젯 바디
```css
.mg-widget__body {
  position: relative;
  min-height: 100px;
}

/* 로딩 상태 */
.mg-widget__body--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* 에러 상태 */
.mg-widget__body--error {
  padding: var(--mg-spacing-4);
  background-color: var(--widget-error-bg);
  border-radius: var(--mg-border-radius-md);
}

/* 빈 상태 */
.mg-widget__body--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--mg-gray-500);
}
```

---

### 4. 통계 위젯 (StatCard)

#### CSS
```css
.mg-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--widget-stats-grid-min-width), 1fr));
  gap: var(--widget-grid-gap);
}

.mg-stats-card {
  background-color: var(--widget-background);
  border-radius: var(--widget-border-radius);
  box-shadow: var(--widget-shadow);
  padding: var(--widget-padding);
  transition: var(--widget-transition);
}

.mg-stats-card:hover {
  box-shadow: var(--widget-shadow-hover);
  transform: var(--widget-hover-transform);
}

.mg-stats-card__icon {
  width: var(--widget-icon-size);
  height: var(--widget-icon-size);
  border-radius: var(--widget-icon-border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--widget-icon-font-size);
  margin-bottom: var(--mg-spacing-3);
}

.mg-stats-card__value {
  font-size: var(--widget-value-size);
  font-weight: var(--widget-value-weight);
  color: var(--mg-gray-900);
  margin-bottom: var(--mg-spacing-2);
}

.mg-stats-card__label {
  font-size: var(--widget-label-size);
  font-weight: var(--widget-label-weight);
  color: var(--mg-gray-600);
}

.mg-stats-card__change {
  font-size: var(--widget-change-size);
  font-weight: var(--widget-change-weight);
  margin-top: var(--mg-spacing-2);
}

.mg-stats-card__change--positive {
  color: var(--widget-success-color);
}

.mg-stats-card__change--negative {
  color: var(--widget-error-color);
}
```

#### JavaScript 상수
```javascript
export const WIDGET_CONSTANTS = {
  // CSS 클래스명
  CSS_CLASSES: {
    WIDGET_CONTAINER: (type) => `mg-widget mg-widget--${type}`,
    WIDGET_HEADER: 'mg-widget__header',
    WIDGET_BODY: 'mg-widget__body',
    WIDGET_FOOTER: 'mg-widget__footer',
    WIDGET_TITLE: 'mg-widget__title',
    WIDGET_SUBTITLE: 'mg-widget__subtitle',
    
    STATS_GRID: 'mg-stats-grid',
    STATS_CARD: 'mg-stats-card',
    STATS_CARD_ICON: 'mg-stats-card__icon',
    STATS_CARD_VALUE: 'mg-stats-card__value',
    STATS_CARD_LABEL: 'mg-stats-card__label',
    STATS_CARD_CHANGE: 'mg-stats-card__change',
    
    LOADING_CONTAINER: 'mg-loading-container',
    ERROR_CONTAINER: 'mg-error-container',
    EMPTY_CONTAINER: 'mg-empty-container'
  },
  
  // 기본 제목들
  DEFAULT_TITLES: {
    LOADING: '데이터 로딩 중...',
    ERROR: '데이터를 불러올 수 없습니다',
    EMPTY: '데이터가 없습니다',
    NO_DATA: '표시할 데이터가 없습니다'
  }
};
```

---

### 5. 위젯 사용 예시

#### 통계 카드 위젯
```javascript
import { BaseWidget } from './BaseWidget';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';

const TodayStatsWidget = ({ widget, user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchTodayStats();
  }, []);
  
  const fetchTodayStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/statistics/today');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('통계 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <BaseWidget
      widget={widget}
      loading={loading}
      error={error}
      isEmpty={!stats}
      onRefresh={fetchTodayStats}
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.STATS_GRID}>
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.STATS_CARD}>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.STATS_CARD_ICON}
               style={{ backgroundColor: 'var(--mg-primary-50)', color: 'var(--mg-primary-500)' }}>
            👥
          </div>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.STATS_CARD_VALUE}>
            {stats?.totalUsers || 0}
          </div>
          <div className={WIDGET_CONSTANTS.CSS_CLASSES.STATS_CARD_LABEL}>
            전체 사용자
          </div>
          <div className={`${WIDGET_CONSTANTS.CSS_CLASSES.STATS_CARD_CHANGE} mg-stats-card__change--positive`}>
            ↑ {stats?.userGrowth || 0}%
          </div>
        </div>
        
        {/* 추가 통계 카드들... */}
      </div>
    </BaseWidget>
  );
};
```

---

### 6. 위젯 반응형 디자인

```css
/* 태블릿 */
@media (max-width: 768px) {
  .mg-widget {
    padding: var(--widget-padding-sm);
  }
  
  .mg-stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--widget-grid-gap-sm);
  }
  
  .mg-widget__title {
    font-size: calc(var(--widget-title-size) * 0.9);
  }
  
  .mg-stats-card__value {
    font-size: calc(var(--widget-value-size) * 0.85);
  }
}

/* 모바일 */
@media (max-width: 480px) {
  .mg-widget {
    padding: var(--mg-spacing-3);
    margin-bottom: var(--mg-spacing-3);
  }
  
  .mg-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .mg-widget__header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--mg-spacing-2);
  }
  
  .mg-stats-card__icon {
    width: var(--widget-icon-size-sm);
    height: var(--widget-icon-size-sm);
    font-size: var(--widget-icon-font-size-sm);
  }
}
```

---

## 🎨 테넌트 브랜딩 시스템

### 1. 테넌트별 색상 오버라이드
```css
/* 테넌트 A */
[data-tenant="tenant-a"] {
  --mg-primary-500: #8b5cf6;  /* Purple */
  --mg-primary-600: #7c3aed;
}

/* 테넌트 B */
[data-tenant="tenant-b"] {
  --mg-primary-500: #ec4899;  /* Pink */
  --mg-primary-600: #db2777;
}
```

### 2. 테넌트 브랜딩 적용
```javascript
// 테넌트 브랜딩 설정
function applyTenantBranding(tenantId, branding) {
    const root = document.documentElement;
    
    // 색상 적용
    if (branding.primaryColor) {
        root.style.setProperty('--mg-primary-500', branding.primaryColor);
    }
    
    // 로고 적용
    if (branding.logoUrl) {
        document.querySelectorAll('.mg-logo').forEach(logo => {
            logo.src = branding.logoUrl;
        });
    }
    
    // 폰트 적용
    if (branding.fontFamily) {
        root.style.setProperty('--mg-font-sans', branding.fontFamily);
    }
}
```

---

## ✅ 체크리스트

### CSS 작성 시
- [ ] CSS 변수 사용 (하드코딩 금지)
- [ ] BEM 네이밍 규칙 준수
- [ ] `mg-` 접두사 사용
- [ ] 반응형 디자인 고려
- [ ] 다크 모드 지원 (필요시)

### 컴포넌트 작성 시
- [ ] 재사용 가능한 구조
- [ ] Props로 스타일 커스터마이징
- [ ] 접근성 고려 (ARIA 속성)
- [ ] 키보드 네비게이션 지원

### 테넌트 브랜딩 시
- [ ] CSS 변수로 색상 오버라이드
- [ ] 로고 동적 로딩
- [ ] 폰트 동적 적용
- [ ] 브랜딩 미리보기 제공

---

## 🚫 금지 사항

### 1. 하드코딩된 색상
```css
/* ❌ 금지 */
.button {
  background-color: #3b82f6;
  color: #ffffff;
}

/* ✅ 권장 */
.mg-btn {
  background-color: var(--mg-primary-500);
  color: white;
}
```

### 2. 인라인 스타일
```html
<!-- ❌ 금지 -->
<div style="padding: 16px; background: #3b82f6;">

<!-- ✅ 권장 -->
<div class="mg-card mg-card--primary">
```

### 3. !important 남용
```css
/* ❌ 금지 */
.button {
  background-color: #3b82f6 !important;
}

/* ✅ 권장 - 명시도 조정 */
.mg-btn.mg-btn--primary {
  background-color: var(--mg-primary-500);
}
```

---

## 📊 디자인 토큰 현황

### 통합된 변수 (1,026개)
| 카테고리 | 변수 수 | 예시 |
|---------|--------|------|
| 색상 | 450 | --mg-primary-500 |
| 간격 | 120 | --mg-spacing-4 |
| 타이포그래피 | 80 | --mg-font-size-base |
| 레이아웃 | 150 | --mg-border-radius-md |
| 애니메이션 | 50 | --mg-transition-base |
| 반응형 | 176 | --mg-breakpoint-md |

---

## 💡 베스트 프랙티스

### 1. 시맨틱 변수 사용
```css
/* Good */
--mg-text-primary: var(--mg-gray-900);
--mg-text-secondary: var(--mg-gray-600);
--mg-bg-primary: white;
--mg-bg-secondary: var(--mg-gray-50);

/* Better - 의미있는 네이밍 */
.mg-card-title {
  color: var(--mg-text-primary);
}
```

### 2. 컴포넌트 변수
```css
/* 컴포넌트별 변수 정의 */
.mg-btn {
  --btn-padding-x: var(--mg-spacing-4);
  --btn-padding-y: var(--mg-spacing-2);
  --btn-font-size: var(--mg-font-size-sm);
  
  padding: var(--btn-padding-y) var(--btn-padding-x);
  font-size: var(--btn-font-size);
}

/* 크기 변형 시 변수만 오버라이드 */
.mg-btn--lg {
  --btn-padding-x: var(--mg-spacing-6);
  --btn-padding-y: var(--mg-spacing-3);
  --btn-font-size: var(--mg-font-size-base);
}
```

### 3. 다크 모드 지원
```css
:root {
  --mg-bg-primary: white;
  --mg-text-primary: var(--mg-gray-900);
}

[data-theme="dark"] {
  --mg-bg-primary: var(--mg-gray-900);
  --mg-text-primary: var(--mg-gray-50);
}
```

---

## 📞 문의

디자인 중앙화 표준 관련 문의:
- 프론트엔드 팀
- 디자인 팀

**최종 업데이트**: 2025-12-02

