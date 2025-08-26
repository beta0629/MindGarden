# 디자인 가이드 (Design Guide)

## 1. 디자인 시스템 개요

### 1.1 디자인 철학
- **사용자 중심**: 상담사와 클라이언트 모두가 직관적으로 사용할 수 있는 인터페이스
- **일관성**: 모든 페이지에서 동일한 디자인 패턴과 컴포넌트 사용
- **접근성**: 다양한 사용자가 쉽게 접근할 수 있는 웹 접근성 준수
- **반응형**: 모든 디바이스에서 최적화된 사용자 경험 제공

### 1.2 디자인 원칙
- **Simplicity**: 불필요한 요소 제거, 핵심 기능에 집중
- **Clarity**: 명확한 정보 전달과 직관적인 네비게이션
- **Efficiency**: 최소한의 클릭으로 원하는 작업 완료
- **Trust**: 전문적이고 신뢰할 수 있는 브랜드 이미지

## 2. 색상 시스템

### 2.1 메인 컬러 팔레트 (파스텔 톤)
```css
:root {
  /* Primary Colors - 부드러운 파스텔 블루 */
  --primary-50: #f0f8ff;    /* 매우 연한 하늘색 */
  --primary-100: #e0f2fe;   /* 연한 하늘색 */
  --primary-200: #bae6fd;   /* 파스텔 하늘색 */
  --primary-300: #7dd3fc;   /* 밝은 하늘색 */
  --primary-400: #38bdf8;   /* 중간 하늘색 */
  --primary-500: #0ea5e9;   /* 메인 브랜드 컬러 - 부드러운 블루 */
  --primary-600: #0284c7;   /* 진한 하늘색 */
  --primary-700: #0369a1;   /* 깊은 하늘색 */
  --primary-800: #075985;   /* 어두운 하늘색 */
  --primary-900: #0c4a6e;   /* 매우 어두운 하늘색 */
  
  /* Secondary Colors - 부드러운 그레이 */
  --secondary-50: #fafbfc;   /* 매우 연한 그레이 */
  --secondary-100: #f5f7fa;  /* 연한 그레이 */
  --secondary-200: #eef2f7;  /* 파스텔 그레이 */
  --secondary-300: #e2e8f0;  /* 밝은 그레이 */
  --secondary-400: #cbd5e1;  /* 중간 그레이 */
  --secondary-500: #94a3b8;  /* 표준 그레이 */
  --secondary-600: #64748b;  /* 진한 그레이 */
  --secondary-700: #475569;  /* 깊은 그레이 */
  --secondary-800: #334155;  /* 어두운 그레이 */
  --secondary-900: #1e293b;  /* 매우 어두운 그레이 */
  
  /* Accent Colors - 부드러운 파스텔 톤 */
  --accent-green: #a7f3d0;   /* 파스텔 민트 그린 - 성공, 완료 */
  --accent-yellow: #fde68a;  /* 파스텔 크림 옐로우 - 경고, 대기 */
  --accent-red: #fca5a5;     /* 파스텔 살구 레드 - 오류, 취소 */
  --accent-purple: #c4b5fd;  /* 파스텔 라벤더 퍼플 - 정보, 알림 */
  --accent-pink: #fbcfe8;    /* 파스텔 베이비 핑크 - 강조 */
  --accent-orange: #fed7aa;  /* 파스텔 피치 오렌지 - 활성 */
  
  /* Background Colors - 부드러운 배경 */
  --bg-primary: #fefefe;     /* 메인 배경 - 거의 흰색 */
  --bg-secondary: #fafbfc;   /* 보조 배경 - 매우 연한 그레이 */
  --bg-tertiary: #f5f7fa;    /* 3차 배경 - 연한 그레이 */
  --bg-card: #ffffff;        /* 카드 배경 - 순백 */
  --bg-overlay: rgba(255, 255, 255, 0.95); /* 오버레이 배경 */
  
  /* 태블릿 전용 색상 */
  --tablet-primary: #e0f2fe;   /* 태블릿 메인 컬러 */
  --tablet-secondary: #f1f5f9; /* 태블릿 보조 컬러 */
  --tablet-accent: #bae6fd;    /* 태블릿 강조 컬러 */
  
  /* 홈페이지 전용 색상 */
  --homepage-primary: #f0f9ff;   /* 홈페이지 메인 컬러 */
  --homepage-secondary: #f8fafc; /* 홈페이지 보조 컬러 */
  --homepage-accent: #7dd3fc;    /* 홈페이지 강조 컬러 */
}
```

### 2.2 상태별 색상
```css
/* 상담 상태별 색상 */
.status-requested { color: var(--accent-yellow); }
.status-assigned { color: var(--accent-purple); }
.status-in-progress { color: var(--primary-500); }
.status-completed { color: var(--accent-green); }
.status-cancelled { color: var(--accent-red); }

/* 사용자 상태별 색상 */
.status-active { color: var(--accent-green); }
.status-inactive { color: var(--secondary-500); }
.status-suspended { color: var(--accent-red); }
```

## 3. 타이포그래피 시스템

### 3.1 공통 폰트 시스템
```css
:root {
  /* Font Family - 공통 */
  --font-family-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font Sizes - 공통 */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Font Weights - 공통 */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
}
```

### 3.2 홈페이지 전용 타이포그래피
```css
/* 홈페이지 메인 타이틀 */
.homepage-main-title {
  font-family: 'Pretendard', sans-serif;
  font-size: 3.5rem;           /* 56px */
  font-weight: var(--font-extrabold);
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: var(--primary-900);
  text-align: center;
  margin-bottom: 1.5rem;
}

/* 홈페이지 서브 타이틀 */
.homepage-sub-title {
  font-family: 'Pretendard', sans-serif;
  font-size: 1.5rem;           /* 24px */
  font-weight: var(--font-medium);
  line-height: 1.4;
  color: var(--secondary-600);
  text-align: center;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* 홈페이지 섹션 타이틀 */
.homepage-section-title {
  font-family: 'Pretendard', sans-serif;
  font-size: 2.5rem;           /* 40px */
  font-weight: var(--font-bold);
  line-height: 1.2;
  color: var(--primary-800);
  text-align: center;
  margin-bottom: 3rem;
}

/* 홈페이지 본문 텍스트 */
.homepage-body-text {
  font-family: 'Pretendard', sans-serif;
  font-size: 1.125rem;         /* 18px */
  font-weight: var(--font-normal);
  line-height: 1.7;
  color: var(--secondary-700);
}
```

### 3.3 태블릿 전용 타이포그래피
```css
/* 태블릿 메인 타이틀 */
.tablet-main-title {
  font-family: 'Pretendard', sans-serif;
  font-size: 2.25rem;          /* 36px */
  font-weight: var(--font-bold);
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--primary-800);
  margin-bottom: 1rem;
}

/* 태블릿 서브 타이틀 */
.tablet-sub-title {
  font-family: 'Pretendard', sans-serif;
  font-size: 1.25rem;          /* 20px */
  font-weight: var(--font-medium);
  line-height: 1.4;
  color: var(--secondary-600);
  margin-bottom: 1.5rem;
}

/* 태블릿 섹션 타이틀 */
.tablet-section-title {
  font-family: 'Pretendard', sans-serif;
  font-size: 1.875rem;         /* 30px */
  font-weight: var(--font-semibold);
  line-height: 1.3;
  color: var(--primary-700);
  margin-bottom: 1.5rem;
}

/* 태블릿 본문 텍스트 */
.tablet-body-text {
  font-family: 'Pretendard', sans-serif;
  font-size: 1rem;             /* 16px */
  font-weight: var(--font-normal);
  line-height: 1.6;
  color: var(--secondary-700);
}

/* 태블릿 카드 타이틀 */
.tablet-card-title {
  font-family: 'Pretendard', sans-serif;
  font-size: 1.125rem;         /* 18px */
  font-weight: var(--font-semibold);
  line-height: 1.3;
  color: var(--secondary-800);
  margin-bottom: 0.75rem;
}
```

### 3.2 타이포그래피 스케일
```css
/* 제목 스타일 */
.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.heading-2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: 1.3;
}

.heading-3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: 1.4;
}

/* 본문 스타일 */
.body-large {
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  line-height: 1.6;
}

.body-medium {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: 1.6;
}

.body-small {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: 1.5;
}

/* 캡션 스타일 */
.caption {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## 4. 컴포넌트 시스템

### 4.1 버튼 컴포넌트
```css
/* 기본 버튼 스타일 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: 1.5;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  min-height: 2.5rem;
}

/* 버튼 변형 */
.btn-primary {
  background-color: var(--primary-500);
  color: white;
  border-color: var(--primary-500);
}

.btn-primary:hover {
  background-color: var(--primary-600);
  border-color: var(--primary-600);
}

.btn-secondary {
  background-color: var(--secondary-100);
  color: var(--secondary-700);
  border-color: var(--secondary-200);
}

.btn-secondary:hover {
  background-color: var(--secondary-200);
  border-color: var(--secondary-300);
}

.btn-outline {
  background-color: transparent;
  color: var(--primary-500);
  border-color: var(--primary-500);
}

.btn-outline:hover {
  background-color: var(--primary-50);
}

/* 버튼 크기 */
.btn-sm { padding: 0.375rem 0.75rem; min-height: 2rem; }
.btn-lg { padding: 0.75rem 1.5rem; min-height: 3rem; }

/* 버튼 상태 */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loading {
  position: relative;
  color: transparent;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

### 4.2 폼 컴포넌트
```css
/* 입력 필드 */
.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--secondary-900);
  background-color: white;
  border: 1px solid var(--secondary-300);
  border-radius: 0.375rem;
  transition: border-color 0.2s ease-in-out;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.form-input:invalid {
  border-color: var(--accent-red);
}

/* 라벨 */
.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--secondary-700);
  margin-bottom: 0.5rem;
}

/* 에러 메시지 */
.form-error {
  font-size: var(--text-sm);
  color: var(--accent-red);
  margin-top: 0.25rem;
}

/* 체크박스와 라디오 */
.form-checkbox,
.form-radio {
  width: 1rem;
  height: 1rem;
  color: var(--primary-500);
  border: 1px solid var(--secondary-300);
  border-radius: 0.25rem;
}

.form-checkbox:checked,
.form-radio:checked {
  background-color: var(--primary-500);
  border-color: var(--primary-500);
}
```

### 4.3 카드 컴포넌트
```css
.card {
  background-color: white;
  border: 1px solid var(--secondary-200);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--secondary-200);
  background-color: var(--secondary-50);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--secondary-900);
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--secondary-200);
  background-color: var(--secondary-50);
}
```

### 4.4 테이블 컴포넌트
```css
.table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.table th {
  background-color: var(--secondary-50);
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--secondary-700);
  border-bottom: 1px solid var(--secondary-200);
}

.table td {
  padding: 0.75rem 1rem;
  font-size: var(--text-sm);
  color: var(--secondary-900);
  border-bottom: 1px solid var(--secondary-100);
}

.table tbody tr:hover {
  background-color: var(--secondary-50);
}

.table tbody tr:last-child td {
  border-bottom: none;
}
```

## 5. 레이아웃 시스템

### 5.1 그리드 시스템
```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -0.5rem;
}

.col {
  flex: 1;
  padding: 0 0.5rem;
}

.col-1 { flex: 0 0 8.333333%; }
.col-2 { flex: 0 0 16.666667%; }
.col-3 { flex: 0 0 25%; }
.col-4 { flex: 0 0 33.333333%; }
.col-6 { flex: 0 0 50%; }
.col-8 { flex: 0 0 66.666667%; }
.col-9 { flex: 0 0 75%; }
.col-12 { flex: 0 0 100%; }

/* 반응형 그리드 */
@media (max-width: 768px) {
  .col-md-12 { flex: 0 0 100%; }
  .col-md-6 { flex: 0 0 50%; }
}

@media (max-width: 576px) {
  .col-sm-12 { flex: 0 0 100%; }
}
```

### 5.2 스페이싱 시스템
```css
:root {
  /* Spacing Scale */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}

/* Margin & Padding 유틸리티 */
.m-0 { margin: 0; }
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-4 { margin: var(--space-4); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.p-0 { padding: 0; }
.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }
```

## 6. 아이콘 시스템

### 6.1 아이콘 라이브러리
- **Heroicons**: 기본 UI 아이콘
- **Lucide Icons**: 추가 UI 아이콘
- **Custom Icons**: 도메인별 특화 아이콘

### 6.2 아이콘 사용 가이드라인
```css
.icon {
  width: 1rem;
  height: 1rem;
  display: inline-block;
  vertical-align: middle;
}

.icon-sm { width: 0.875rem; height: 0.875rem; }
.icon-lg { width: 1.25rem; height: 1.25rem; }
.icon-xl { width: 1.5rem; height: 1.5rem; }

/* 아이콘과 텍스트 정렬 */
.icon-text {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
```

## 7. 애니메이션 및 전환

### 7.1 기본 전환 효과
```css
:root {
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}

.transition {
  transition: all var(--transition-normal);
}

.transition-fast {
  transition: all var(--transition-fast);
}

.transition-slow {
  transition: all var(--transition-slow);
}
```

### 7.2 호버 효과
```css
.hover-lift {
  transition: transform var(--transition-normal);
}

.hover-lift:hover {
  transform: translateY(-2px);
}

.hover-scale {
  transition: transform var(--transition-normal);
}

.hover-scale:hover {
  transform: scale(1.05);
}
```

## 8. 반응형 디자인 및 디바이스별 최적화

### 8.1 브레이크포인트 정의
```css
/* 디바이스별 브레이크포인트 */
:root {
  /* 모바일 */
  --breakpoint-mobile: 320px;
  --breakpoint-mobile-max: 767px;
  
  /* 태블릿 */
  --breakpoint-tablet: 768px;
  --breakpoint-tablet-max: 1023px;
  
  /* 데스크톱 */
  --breakpoint-desktop: 1024px;
  --breakpoint-desktop-max: 1279px;
  
  /* 대형 화면 */
  --breakpoint-large: 1280px;
}

/* 태블릿 전용 스타일 */
@media (min-width: 768px) and (max-width: 1023px) {
  /* 태블릿에만 적용되는 스타일 */
}

/* 데스크톱 전용 스타일 */
@media (min-width: 1024px) {
  /* 데스크톱에만 적용되는 스타일 */
}
```

### 8.2 태블릿 전용 디자인 시스템

#### 8.2.1 태블릿 레이아웃
```css
/* 태블릿 전용 컨테이너 */
.tablet-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* 태블릿 그리드 시스템 */
.tablet-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
}

.tablet-col-6 { grid-column: span 6; }
.tablet-col-8 { grid-column: span 8; }
.tablet-col-12 { grid-column: span 12; }

/* 태블릿 헤더 */
.tablet-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: var(--bg-overlay);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--secondary-200);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}

/* 태블릿 로고 */
.tablet-logo {
  font-family: 'Pretendard', sans-serif;
  font-size: 1.5rem;
  font-weight: var(--font-bold);
  color: var(--primary-600);
  text-decoration: none;
}

/* 태블릿 햄버거 메뉴 */
.tablet-hamburger {
  width: 24px;
  height: 24px;
  position: relative;
  cursor: pointer;
  z-index: 1001;
}

.tablet-hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--secondary-700);
  position: absolute;
  left: 0;
  transition: all 0.3s ease;
}

.tablet-hamburger span:nth-child(1) {
  top: 6px;
}

.tablet-hamburger span:nth-child(2) {
  top: 12px;
}

.tablet-hamburger span:nth-child(3) {
  top: 18px;
}

/* 햄버거 메뉴 활성화 상태 */
.tablet-hamburger.active span:nth-child(1) {
  transform: rotate(45deg);
  top: 12px;
}

.tablet-hamburger.active span:nth-child(2) {
  opacity: 0;
}

.tablet-hamburger.active span:nth-child(3) {
  transform: rotate(-45deg);
  top: 12px;
}

/* 태블릿 사이드바 */
.tablet-sidebar {
  position: fixed;
  left: 0;
  top: 60px;
  width: 280px;
  height: calc(100vh - 60px);
  background: var(--bg-card);
  border-right: 1px solid var(--secondary-200);
  overflow-y: auto;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 999;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
}

.tablet-sidebar.open {
  transform: translateX(0);
}

/* 태블릿 사이드바 오버레이 */
.tablet-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 998;
}

.tablet-sidebar-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* 태블릿 사이드바 네비게이션 */
.tablet-sidebar-nav {
  padding: 1.5rem 0;
}

.tablet-sidebar-nav-item {
  display: block;
  padding: 1rem 1.5rem;
  color: var(--secondary-700);
  text-decoration: none;
  font-family: 'Pretendard', sans-serif;
  font-size: 1rem;
  font-weight: var(--font-medium);
  border-bottom: 1px solid var(--secondary-100);
  transition: all 0.3s ease;
}

.tablet-sidebar-nav-item:hover {
  background: var(--primary-50);
  color: var(--primary-600);
  padding-left: 2rem;
}

.tablet-sidebar-nav-item.active {
  background: var(--primary-100);
  color: var(--primary-700);
  border-left: 4px solid var(--primary-500);
}

/* 태블릿 사이드바 서브메뉴 */
.tablet-sidebar-submenu {
  background: var(--bg-secondary);
  padding-left: 1rem;
}

.tablet-sidebar-submenu .tablet-sidebar-nav-item {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  border-bottom: none;
}

/* 태블릿 메인 콘텐츠 */
.tablet-main-content {
  margin-left: 0;
  margin-top: 60px;
  padding: 1.5rem;
  transition: margin-left 0.3s ease;
}

.tablet-main-content.sidebar-open {
  margin-left: 280px;
}

/* 태블릿 사용자 프로필 */
.tablet-user-profile {
  padding: 1.5rem;
  border-bottom: 1px solid var(--secondary-200);
  text-align: center;
}

.tablet-user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin: 0 auto 1rem;
  background: var(--primary-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--primary-600);
}

.tablet-user-name {
  font-family: 'Pretendard', sans-serif;
  font-size: 1.125rem;
  font-weight: var(--font-semibold);
  color: var(--secondary-800);
  margin-bottom: 0.5rem;
}

.tablet-user-role {
  font-family: 'Pretendard', sans-serif;
  font-size: 0.875rem;
  color: var(--secondary-600);
}
```

#### 8.2.2 태블릿 컴포넌트
```css
/* 태블릿 카드 */
.tablet-card {
  background: var(--bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

/* 태블릿 버튼 */
.tablet-btn {
  min-height: 3.5rem;
  padding: 1rem 1.5rem;
  font-size: var(--text-base);
  border-radius: 0.75rem;
  font-weight: var(--font-medium);
}

/* 태블릿 폼 */
.tablet-form-input {
  height: 3.5rem;
  padding: 0 1rem;
  font-size: var(--text-base);
  border-radius: 0.75rem;
}

/* 태블릿 테이블 */
.tablet-table {
  font-size: var(--text-sm);
}

.tablet-table th,
.tablet-table td {
  padding: 1rem;
}
```

#### 8.2.3 태블릿 터치 최적화
```css
/* 터치 친화적 요소 */
.tablet-touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* 터치 피드백 */
.tablet-touch-feedback {
  transition: transform 0.1s ease;
}

.tablet-touch-feedback:active {
  transform: scale(0.95);
}

/* 스와이프 제스처 */
.tablet-swipeable {
  touch-action: pan-y;
  user-select: none;
}
```

### 8.3 홈페이지 전용 디자인 시스템

#### 8.3.1 홈페이지 헤더
```css
/* 홈페이지 헤더 */
.homepage-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--secondary-200);
  z-index: 1000;
  transition: all 0.3s ease;
}

.homepage-header.scrolled {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 홈페이지 로고 */
.homepage-logo {
  font-family: 'Pretendard', sans-serif;
  font-size: 1.75rem;
  font-weight: var(--font-bold);
  color: var(--primary-600);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.homepage-logo img {
  width: 40px;
  height: 40px;
}

/* 홈페이지 네비게이션 */
.homepage-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.homepage-nav-link {
  font-family: 'Pretendard', sans-serif;
  font-size: 1rem;
  font-weight: var(--font-medium);
  color: var(--secondary-700);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.homepage-nav-link:hover {
  color: var(--primary-600);
  background: var(--primary-50);
}

.homepage-nav-link.active {
  color: var(--primary-600);
  background: var(--primary-100);
}

/* 홈페이지 헤더 컨테이너 */
.homepage-header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 홈페이지 CTA 버튼 */
.homepage-cta-button {
  background: var(--primary-500);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: all 0.3s ease;
}

.homepage-cta-button:hover {
  background: var(--primary-600);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
}
```

#### 8.3.2 홈페이지 푸터
```css
/* 홈페이지 푸터 */
.homepage-footer {
  background: var(--secondary-900);
  color: var(--secondary-100);
  padding: 4rem 0 2rem;
}

.homepage-footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 푸터 그리드 */
.homepage-footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 3rem;
  margin-bottom: 3rem;
}

/* 푸터 섹션 */
.homepage-footer-section h3 {
  font-family: 'Pretendard', sans-serif;
  font-size: 1.25rem;
  font-weight: var(--font-semibold);
  color: white;
  margin-bottom: 1.5rem;
}

.homepage-footer-section p,
.homepage-footer-section a {
  font-family: 'Pretendard', sans-serif;
  font-size: 0.875rem;
  color: var(--secondary-300);
  line-height: 1.6;
  text-decoration: none;
}

.homepage-footer-section a:hover {
  color: var(--primary-400);
}

/* 푸터 하단 */
.homepage-footer-bottom {
  border-top: 1px solid var(--secondary-800);
  padding-top: 2rem;
  text-align: center;
  color: var(--secondary-400);
  font-size: 0.875rem;
}

/* 푸터 소셜 링크 */
.homepage-footer-social {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.homepage-footer-social a {
  width: 40px;
  height: 40px;
  background: var(--secondary-800);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.homepage-footer-social a:hover {
  background: var(--primary-500);
  transform: translateY(-2px);
}
```

#### 8.3.3 홈페이지 레이아웃
```css
/* 홈페이지 전용 컨테이너 */
.homepage-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 홈페이지 히어로 섹션 */
.homepage-hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
  text-align: center;
  padding: 6rem 2rem;
  margin-top: 80px; /* 헤더 높이만큼 여백 */
}

.homepage-hero h1 {
  font-size: 3.5rem;
  font-weight: var(--font-extrabold);
  color: var(--primary-900);
  margin-bottom: 1.5rem;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.homepage-hero p {
  font-size: 1.5rem;
  color: var(--secondary-700);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.4;
}

/* 홈페이지 섹션 */
.homepage-section {
  padding: 6rem 0;
}

.homepage-section:nth-child(even) {
  background: var(--bg-secondary);
}

#### 8.3.2 홈페이지 컴포넌트
```css
/* 홈페이지 카드 */
.homepage-card {
  background: var(--bg-card);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.homepage-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
}

/* 홈페이지 버튼 */
.homepage-btn {
  min-height: 3rem;
  padding: 0.75rem 2rem;
  font-size: var(--text-lg);
  border-radius: 2rem;
  font-weight: var(--font-semibold);
  transition: all 0.3s ease;
}

.homepage-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}
```

### 8.4 디바이스별 스타일 분리

#### 8.4.1 CSS 파일 분리
```css
/* base.css - 공통 스타일 */
@import 'base/variables.css';
@import 'base/reset.css';
@import 'base/typography.css';

/* 디바이스별 스타일 */
@import 'devices/mobile.css';
@import 'devices/tablet.css';
@import 'devices/desktop.css';

/* 페이지별 스타일 */
@import 'pages/homepage.css';
@import 'pages/dashboard.css';
@import 'pages/consultation.css';
```

#### 8.4.2 태블릿 전용 CSS
```css
/* tablet.css */
@media (min-width: 768px) and (max-width: 1023px) {
  /* 태블릿 전용 변수 */
  :root {
    --container-padding: 1.5rem;
    --card-padding: 1.5rem;
    --button-height: 3.5rem;
    --font-size-base: 16px;
  }
  
  /* 태블릿 전용 레이아웃 */
  .main-content {
    margin-left: 280px;
    padding: 1.5rem;
  }
  
  /* 태블릿 전용 네비게이션 */
  .tablet-nav-toggle {
    display: block;
  }
  
  .desktop-nav {
    display: none;
  }
}
```

#### 8.4.3 홈페이지 전용 CSS
```css
/* homepage.css */
.homepage {
  /* 홈페이지 전용 스타일 */
}

.homepage .hero-section {
  background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
  min-height: 80vh;
}

.homepage .feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 4rem 0;
}

/* 홈페이지는 사이드바 없음 */
.homepage .sidebar {
  display: none;
}

.homepage .main-content {
  margin-left: 0;
  width: 100%;
}
```

### 8.5 디자인 깨짐 방지 전략

#### 8.5.1 CSS 격리
```css
/* 컴포넌트별 CSS 격리 */
.consultant-dashboard {
  /* 상담사 대시보드 전용 스타일 */
}

.consultant-dashboard .calendar-view {
  /* 캘린더 뷰 전용 스타일 */
}

.consultant-dashboard .client-list {
  /* 내담자 목록 전용 스타일 */
}

/* 홈페이지와 격리 */
.homepage .consultant-dashboard {
  display: none;
}
```

#### 8.5.2 조건부 스타일 적용
```css
/* 태블릿에서만 표시 */
@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-only {
    display: block;
  }
  
  .desktop-only,
  .mobile-only {
    display: none;
  }
}

/* 데스크톱에서만 표시 */
@media (min-width: 1024px) {
  .desktop-only {
    display: block;
  }
  
  .tablet-only,
  .mobile-only {
    display: none;
  }
}
```

#### 8.5.3 JavaScript 기반 디바이스 감지
```javascript
// 디바이스 타입 감지
const DeviceDetector = {
  isTablet() {
    return window.innerWidth >= 768 && window.innerWidth <= 1023;
  },
  
  isDesktop() {
    return window.innerWidth >= 1024;
  },
  
  isMobile() {
    return window.innerWidth < 768;
  },
  
  // 디바이스별 클래스 적용
  applyDeviceClass() {
    const body = document.body;
    body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
    
    if (this.isTablet()) {
      body.classList.add('device-tablet');
    } else if (this.isDesktop()) {
      body.classList.add('device-desktop');
    } else {
      body.classList.add('device-mobile');
    }
  }
};

// 리사이즈 이벤트 처리
window.addEventListener('resize', () => {
  DeviceDetector.applyDeviceClass();
});

// 초기 적용
DeviceDetector.applyDeviceClass();
```

### 8.6 성능 최적화

#### 8.6.1 CSS 로딩 최적화
```html
<!-- 디바이스별 CSS 로딩 -->
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/components.css">

<!-- 태블릿 전용 CSS -->
<link rel="stylesheet" href="/css/tablet.css" media="(min-width: 768px) and (max-width: 1023px)">

<!-- 데스크톱 전용 CSS -->
<link rel="stylesheet" href="/css/desktop.css" media="(min-width: 1024px)">

<!-- 홈페이지 전용 CSS -->
<link rel="stylesheet" href="/css/homepage.css" media="(min-width: 1024px)">
```

#### 8.6.2 이미지 최적화
```css
/* 태블릿 전용 이미지 */
@media (min-width: 768px) and (max-width: 1023px) {
  .hero-image {
    content: url('/images/hero-tablet.jpg');
  }
}

/* 데스크톱 전용 이미지 */
@media (min-width: 1024px) {
  .hero-image {
    content: url('/images/hero-desktop.jpg');
  }
}
```

이러한 디자인 분리 전략을 통해 태블릿과 홈페이지에서 각각 최적화된 사용자 경험을 제공하면서도 디자인이 깨지는 현상을 방지할 수 있습니다.

## 12. 공통 영역 및 스타일 가이드

### 12.1 공통 컴포넌트 스타일

#### 12.1.1 공통 버튼 스타일
```css
/* 공통 버튼 기본 스타일 */
.btn-common {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Pretendard', sans-serif;
  font-weight: var(--font-medium);
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 0.5rem;
  min-height: 2.5rem;
}

/* 공통 버튼 크기 */
.btn-common.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 2rem;
}

.btn-common.btn-md {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  min-height: 2.5rem;
}

.btn-common.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  min-height: 3rem;
}

/* 공통 버튼 변형 */
.btn-common.btn-primary {
  background: var(--primary-500);
  color: white;
}

.btn-common.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.btn-common.btn-secondary {
  background: var(--secondary-100);
  color: var(--secondary-700);
  border: 1px solid var(--secondary-200);
}

.btn-common.btn-secondary:hover {
  background: var(--secondary-200);
  border-color: var(--secondary-300);
}

/* SNS 로그인 버튼 */
.btn-sns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: 1px solid var(--secondary-200);
  border-radius: 0.75rem;
  background: white;
  color: var(--secondary-700);
  font-family: 'Pretendard', sans-serif;
  font-size: 1rem;
  font-weight: var(--font-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 3rem;
}

.btn-sns:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 카카오 로그인 버튼 */
.btn-sns-kakao {
  background: #fee500;
  border-color: #fee500;
  color: #000000;
}

.btn-sns-kakao:hover {
  background: #fdd800;
  border-color: #fdd800;
}

.btn-sns-kakao .sns-icon {
  width: 20px;
  height: 20px;
}

/* 네이버 로그인 버튼 */
.btn-sns-naver {
  background: #03c75a;
  border-color: #03c75a;
  color: white;
}

.btn-sns-naver:hover {
  background: #02b351;
  border-color: #02b351;
}

.btn-sns-naver .sns-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

/* 페이스북 로그인 버튼 */
.btn-sns-facebook {
  background: #1877f2;
  border-color: #1877f2;
  color: white;
}

.btn-sns-facebook:hover {
  background: #166fe5;
  border-color: #166fe5;
}

.btn-sns-facebook .sns-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

/* 인스타그램 로그인 버튼 */
.btn-sns-instagram {
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  border-color: #dc2743;
  color: white;
}

.btn-sns-instagram:hover {
  background: linear-gradient(45deg, #e0852a 0%, #d55f33 25%, #c61f3a 50%, #b61f5d 75%, #a91577 100%);
  border-color: #c61f3a;
}

.btn-sns-instagram .sns-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

#### 12.1.2 공통 폼 스타일
```css
/* 공통 폼 컨테이너 */
.form-common {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 공통 폼 그룹 */
.form-group-common {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 공통 폼 라벨 */
.form-label-common {
  font-family: 'Pretendard', sans-serif;
  font-size: 0.875rem;
  font-weight: var(--font-medium);
  color: var(--secondary-700);
}

/* 공통 폼 입력 필드 */
.form-input-common {
  font-family: 'Pretendard', sans-serif;
  font-size: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--secondary-300);
  border-radius: 0.5rem;
  background: white;
  transition: all 0.3s ease;
}

.form-input-common:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.form-input-common:invalid {
  border-color: var(--accent-red);
}

/* 공통 폼 에러 메시지 */
.form-error-common {
  font-family: 'Pretendard', sans-serif;
  font-size: 0.75rem;
  color: var(--accent-red);
  margin-top: 0.25rem;
}

/* SNS 로그인 폼 */
.sns-login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
}

.sns-login-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: var(--secondary-500);
  font-size: 0.875rem;
}

.sns-login-divider::before,
.sns-login-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--secondary-200);
}

.sns-login-divider span {
  padding: 0 1rem;
  background: white;
}

/* SNS 로그인 버튼 그룹 */
.sns-login-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* SNS 계정 연동 상태 */
.sns-account-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.sns-account-status.connected {
  background: var(--accent-green);
  color: white;
}

.sns-account-status.disconnected {
  background: var(--secondary-100);
  color: var(--secondary-600);
}

.sns-account-status .status-icon {
  width: 16px;
  height: 16px;
}
```

#### 12.1.3 공통 카드 스타일
```css
/* 공통 카드 기본 스타일 */
.card-common {
  background: var(--bg-card);
  border: 1px solid var(--secondary-200);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card-common:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 공통 카드 헤더 */
.card-header-common {
  padding: 1.5rem;
  border-bottom: 1px solid var(--secondary-200);
  background: var(--bg-secondary);
}

.card-title-common {
  font-family: 'Pretendard', sans-serif;
  font-size: 1.25rem;
  font-weight: var(--font-semibold);
  color: var(--secondary-800);
  margin: 0;
}

/* 공통 카드 본문 */
.card-body-common {
  padding: 1.5rem;
}

/* 공통 카드 푸터 */
.card-footer-common {
  padding: 1.5rem;
  border-top: 1px solid var(--secondary-200);
  background: var(--bg-secondary);
}
```

### 12.2 공통 레이아웃 스타일

#### 12.2.1 공통 그리드 시스템
```css
/* 공통 그리드 컨테이너 */
.grid-common {
  display: grid;
  gap: 1.5rem;
}

/* 공통 그리드 열 */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* 공통 그리드 간격 */
.grid-gap-sm { gap: 1rem; }
.grid-gap-md { gap: 1.5rem; }
.grid-gap-lg { gap: 2rem; }

/* 반응형 그리드 */
@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: repeat(1, 1fr);
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

#### 12.2.2 공통 스페이싱 시스템
```css
/* 공통 마진 */
.m-common-0 { margin: 0; }
.m-common-1 { margin: 0.25rem; }
.m-common-2 { margin: 0.5rem; }
.m-common-4 { margin: 1rem; }
.m-common-6 { margin: 1.5rem; }
.m-common-8 { margin: 2rem; }

/* 공통 패딩 */
.p-common-0 { padding: 0; }
.p-common-1 { padding: 0.25rem; }
.p-common-2 { padding: 0.5rem; }
.p-common-4 { padding: 1rem; }
.p-common-6 { padding: 1.5rem; }
.p-common-8 { padding: 2rem; }

/* 공통 섹션 간격 */
.section-common {
  padding: 4rem 0;
}

.section-common.section-sm {
  padding: 2rem 0;
}

.section-common.section-lg {
  padding: 6rem 0;
}
```

### 12.3 공통 유틸리티 클래스

#### 12.3.1 공통 텍스트 유틸리티
```css
/* 공통 텍스트 정렬 */
.text-center-common { text-align: center; }
.text-left-common { text-align: left; }
.text-right-common { text-align: right; }

/* 공통 텍스트 색상 */
.text-primary-common { color: var(--primary-600); }
.text-secondary-common { color: var(--secondary-600); }
.text-success-common { color: var(--accent-green); }
.text-warning-common { color: var(--accent-yellow); }
.text-error-common { color: var(--accent-red); }

/* 공통 텍스트 크기 */
.text-xs-common { font-size: 0.75rem; }
.text-sm-common { font-size: 0.875rem; }
.text-base-common { font-size: 1rem; }
.text-lg-common { font-size: 1.125rem; }
.text-xl-common { font-size: 1.25rem; }
```

#### 12.3.2 공통 디스플레이 유틸리티
```css
/* 공통 디스플레이 */
.hidden-common { display: none; }
.block-common { display: block; }
.inline-common { display: inline; }
.inline-block-common { display: inline-block; }
.flex-common { display: flex; }
.grid-common { display: grid; }

/* 공통 플렉스 유틸리티 */
.flex-col-common { flex-direction: column; }
.flex-row-common { flex-direction: row; }
.items-center-common { align-items: center; }
.justify-center-common { justify-content: center; }
.justify-between-common { justify-content: space-between; }
```

### 12.4 공통 애니메이션 및 전환

#### 12.4.1 공통 전환 효과
```css
/* 공통 전환 */
.transition-common {
  transition: all 0.3s ease;
}

.transition-fast-common {
  transition: all 0.15s ease;
}

.transition-slow-common {
  transition: all 0.5s ease;
}

/* 공통 호버 효과 */
.hover-lift-common {
  transition: transform 0.3s ease;
}

.hover-lift-common:hover {
  transform: translateY(-2px);
}

.hover-scale-common {
  transition: transform 0.3s ease;
}

.hover-scale-common:hover {
  transform: scale(1.02);
}
```

#### 12.4.2 공통 로딩 상태
```css
/* 공통 로딩 스피너 */
.loading-spinner-common {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--secondary-200);
  border-top: 2px solid var(--primary-500);
  border-radius: 50%;
  animation: spin-common 1s linear infinite;
}

@keyframes spin-common {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 공통 스켈레톤 로딩 */
.skeleton-common {
  background: linear-gradient(90deg, var(--secondary-100) 25%, var(--secondary-200) 50%, var(--secondary-100) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading-common 1.5s infinite;
}

@keyframes skeleton-loading-common {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 12.5 공통 접근성 스타일

#### 12.5.1 공통 포커스 스타일
```css
/* 공통 포커스 표시 */
.focus-visible-common:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* 공통 스킵 링크 */
.skip-link-common {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-500);
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
  font-family: 'Pretendard', sans-serif;
  font-weight: var(--font-medium);
}

.skip-link-common:focus {
  top: 6px;
}
```

#### 12.5.2 공통 스크린 리더 지원
```css
/* 공통 스크린 리더 전용 텍스트 */
.sr-only-common {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 공통 ARIA 라벨 */
.aria-label-common {
  cursor: pointer;
}

.aria-label-common:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

이러한 공통 스타일 가이드를 통해 일관성 있는 디자인을 유지하면서도 각 디바이스별 최적화를 달성할 수 있습니다.

## 9. 접근성 (Accessibility)

### 9.1 색상 대비
- 모든 텍스트는 WCAG AA 기준 (4.5:1) 충족
- 색상만으로 정보 전달 금지

### 9.2 키보드 네비게이션
```css
/* 포커스 표시 */
.btn:focus,
.form-input:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* 스킵 링크 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-500);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

### 9.3 스크린 리더 지원
```html
<!-- ARIA 라벨 -->
<button aria-label="상담 신청 폼 닫기">
  <i class="icon-close"></i>
</button>

<!-- 상태 표시 -->
<div role="status" aria-live="polite">
  상담이 성공적으로 신청되었습니다.
</div>
```

## 10. 테마 시스템

### 10.1 다크 모드 지원
```css
@media (prefers-color-scheme: dark) {
  :root {
    --primary-500: #38bdf8;
    --secondary-50: #0f172a;
    --secondary-100: #1e293b;
    --secondary-900: #f8fafc;
  }
  
  body {
    background-color: var(--secondary-900);
    color: var(--secondary-100);
  }
}
```

### 10.2 사용자 테마 선택
```css
[data-theme="dark"] {
  --primary-500: #38bdf8;
  --secondary-50: #0f172a;
  --secondary-100: #1e293b;
  --secondary-900: #f8fafc;
}

[data-theme="light"] {
  --primary-500: #0ea5e9;
  --secondary-50: #f8fafc;
  --secondary-100: #f1f5f9;
  --secondary-900: #0f172a;
}
```

## 11. 성능 최적화

### 11.1 이미지 최적화
```css
/* 지연 로딩 */
.lazy-image {
  opacity: 0;
  transition: opacity 0.3s;
}

.lazy-image.loaded {
  opacity: 1;
}

/* 반응형 이미지 */
.responsive-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}
```

### 11.2 CSS 최적화
```css
/* Critical CSS */
.critical {
  /* 첫 화면 렌더링에 필요한 스타일 */
}

/* Non-critical CSS */
.non-critical {
  /* 지연 로딩 가능한 스타일 */
}
```

이 디자인 가이드를 따라 일관성 있고 사용자 친화적인 인터페이스를 구축할 수 있습니다.
