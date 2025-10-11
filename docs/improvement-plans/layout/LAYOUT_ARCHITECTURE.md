# 레이아웃 아키텍처 가이드

## 개요
MindGarden 프로젝트의 화면 레이아웃 아키텍처 및 반응형 디자인 가이드라인을 정의합니다.

## 현재 문제점 분석

### 1. 레이아웃 구조 문제
- **세로 중심 레이아웃**: 모든 콘텐츠가 세로로 무작정 나열됨
- **공간 활용 비효율**: 모바일에서 가로 공간 활용도 낮음
- **시각적 계층 부족**: 정보의 중요도에 따른 시각적 구분 부족
- **스크롤 최적화 부족**: 과도한 스크롤로 인한 사용성 저하

### 2. 반응형 디자인 문제
- **일관성 부족**: 디바이스별 레이아웃 일관성 부족
- **브레이크포인트 미정의**: 명확한 반응형 기준점 부재
- **컴포넌트 재사용성 낮음**: 레이아웃 컴포넌트의 재사용성 부족

## 레이아웃 아키텍처 설계

### 1. 그리드 시스템

#### 기본 그리드 구조
```css
/* 모바일 우선 그리드 시스템 */
.grid-container {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
}

/* 모바일: 1열 */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
  }
}

/* 태블릿: 2열 */
@media (min-width: 769px) and (max-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
  }
}

/* 데스크톱: 3-4열 */
@media (min-width: 1025px) {
  .grid-container {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-md);
  }
}
```

#### 카드 그리드 시스템
```css
/* 통계 카드 그리드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

/* 콘텐츠 카드 그리드 */
.content-grid {
  display: grid;
  gap: var(--spacing-sm);
}

/* 모바일: 1열 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xs);
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
  }
}

/* 태블릿: 2열 */
@media (min-width: 769px) and (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .content-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 데스크톱: 3열 */
@media (min-width: 1025px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .content-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 2. 레이아웃 컴포넌트

#### 페이지 레이아웃 구조
```jsx
const PageLayout = ({ children }) => (
  <div className="page-layout">
    <header className="page-header">
      <PageHeader />
    </header>
    <main className="page-main">
      <div className="page-container">
        {children}
      </div>
    </main>
  </div>
);
```

#### 섹션 레이아웃 구조
```jsx
const SectionLayout = ({ title, subtitle, children, grid = true }) => (
  <section className="section-layout">
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
    <div className={`section-content ${grid ? 'grid-layout' : 'list-layout'}`}>
      {children}
    </div>
  </section>
);
```

#### 카드 레이아웃 구조
```jsx
const CardLayout = ({ variant = 'default', children, ...props }) => (
  <div className={`card-layout card-layout--${variant}`} {...props}>
    {children}
  </div>
);
```

### 3. 반응형 브레이크포인트

```css
/* 브레이크포인트 정의 */
:root {
  --breakpoint-mobile: 768px;
  --breakpoint-tablet: 1024px;
  --breakpoint-desktop: 1200px;
  --breakpoint-wide: 1440px;
}

/* 모바일 우선 접근법 */
.component {
  /* 모바일 기본 스타일 */
}

@media (min-width: 768px) {
  .component {
    /* 태블릿 스타일 */
  }
}

@media (min-width: 1024px) {
  .component {
    /* 데스크톱 스타일 */
  }
}
```

### 4. 레이아웃 유틸리티 클래스

```css
/* 컨테이너 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.container--fluid {
  max-width: none;
}

.container--narrow {
  max-width: 800px;
}

/* 그리드 유틸리티 */
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

.grid-gap-sm { gap: var(--spacing-sm); }
.grid-gap-md { gap: var(--spacing-md); }
.grid-gap-lg { gap: var(--spacing-lg); }

/* 플렉스 유틸리티 */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }

/* 간격 유틸리티 */
.gap-xs { gap: var(--spacing-xs); }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }

/* 숨김/표시 유틸리티 */
.hidden-mobile {
  @media (max-width: 768px) {
    display: none;
  }
}

.hidden-tablet {
  @media (min-width: 769px) and (max-width: 1024px) {
    display: none;
  }
}

.hidden-desktop {
  @media (min-width: 1025px) {
    display: none;
  }
}
```

## 화면별 레이아웃 가이드

### 1. 관리자 대시보드
- **모바일**: 2열 통계 그리드, 1열 카드 리스트
- **태블릿**: 4열 통계 그리드, 2열 카드 그리드
- **데스크톱**: 4열 통계 그리드, 3열 카드 그리드

### 2. 회기 관리 페이지
- **모바일**: 세로 스택 레이아웃, 컴팩트 카드
- **태블릿**: 2열 레이아웃, 표준 카드
- **데스크톱**: 3열 레이아웃, 확장된 카드

### 3. 사용자 관리 페이지
- **모바일**: 리스트 뷰, 검색 필터 상단 고정
- **태블릿**: 그리드 + 리스트 하이브리드
- **데스크톱**: 테이블 + 사이드바 레이아웃

## 구현 우선순위

### Phase 1: 기본 레이아웃 시스템
1. 그리드 시스템 구축
2. 레이아웃 컴포넌트 개발
3. 유틸리티 클래스 정의

### Phase 2: 반응형 최적화
1. 브레이크포인트 적용
2. 모바일 레이아웃 개선
3. 터치 인터페이스 최적화

### Phase 3: 고급 레이아웃
1. 동적 레이아웃 시스템
2. 애니메이션 및 전환 효과
3. 접근성 개선

## 성능 고려사항

### 1. CSS 최적화
- 유틸리티 클래스 우선 사용
- 중복 스타일 제거
- Critical CSS 분리

### 2. 렌더링 최적화
- 레이아웃 시프트 최소화
- 가상화 적용 (긴 리스트)
- 지연 로딩 구현

### 3. 번들 최적화
- 컴포넌트별 코드 스플리팅
- 동적 임포트 활용
- 트리 셰이킹 적용

## 마이그레이션 계획

### 1. 기존 코드 분석
- 현재 레이아웃 문제점 파악
- 컴포넌트 의존성 분석
- 스타일 충돌 지점 식별

### 2. 점진적 마이그레이션
- 새로운 레이아웃 시스템 도입
- 기존 컴포넌트 단계적 교체
- 호환성 유지

### 3. 테스트 및 검증
- 반응형 테스트
- 크로스 브라우저 테스트
- 사용성 테스트

## 참고 자료
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [Responsive Design Patterns](https://bradfrost.com/blog/web/responsive-design-patterns/)
- [Mobile-First Design](https://bradfrost.com/blog/web/mobile-first-responsive-web-design/)
