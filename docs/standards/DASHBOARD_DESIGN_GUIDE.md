# 대시보드 디자인 가이드

**버전**: 1.0.0  
**최종 업데이트**: 2025-02-04  
**상태**: 디자인 스펙 정의  
**참조**: `frontend/src/pages/AdminDashboardSample.js` (샘플 페이지)

---

## 📌 개요

샘플 페이지(`AdminDashboardSample.js`)를 기반으로 모든 대시보드(관리자, 상담사, 내담자)에 적용할 구체적인 디자인 스펙을 정의합니다.

### 디자인 원칙

1. **현대적이고 깔끔한 디자인**: 샘플 페이지 수준의 시각적 품질
2. **일관성**: 모든 대시보드가 공통 디자인 언어 사용
3. **역할별 특화**: 각 역할에 맞는 색상 및 톤 조정
4. **반응형**: 모바일/태블릿/데스크톱 완벽 대응

---

## 🎨 색상 시스템

### 공통 색상 팔레트 (샘플 페이지 기반)

```css
:root {
  /* Primary 색상 (관리자 대시보드 기본) */
  --dashboard-primary: #4f46e5;        /* Indigo 600 */
  --dashboard-primary-hover: #4338ca;  /* Indigo 700 */
  --dashboard-primary-light: #818cf8;  /* Indigo 400 */
  --dashboard-primary-dark: #312e81;   /* Indigo 800 */
  
  /* Secondary 색상 */
  --dashboard-secondary: #10b981;      /* Emerald 500 */
  --dashboard-secondary-hover: #059669; /* Emerald 600 */
  
  /* 배경 색상 */
  --dashboard-bg-light: #f8fafc;       /* Slate 50 */
  --dashboard-bg-dark: #0f172a;       /* Slate 900 */
  
  /* Surface 색상 */
  --dashboard-surface-light: #ffffff;
  --dashboard-surface-dark: #1e293b;   /* Slate 800 */
  
  /* 텍스트 색상 */
  --dashboard-text-light: #1e293b;     /* Slate 800 */
  --dashboard-text-dark: #f1f5f9;      /* Slate 100 */
  --dashboard-text-secondary-light: #64748b; /* Slate 500 */
  --dashboard-text-secondary-dark: #94a3b8;  /* Slate 400 */
  
  /* 테두리 색상 */
  --dashboard-border-light: #e2e8f0;   /* Slate 200 */
  --dashboard-border-dark: #334155;    /* Slate 700 */
}
```

### 역할별 색상 테마

#### 관리자 대시보드
```css
.admin-dashboard {
  --role-primary: var(--dashboard-primary);        /* Indigo */
  --role-primary-hover: var(--dashboard-primary-hover);
  --role-gradient: linear-gradient(135deg, #4f46e5 0%, #312e81 100%);
  --role-bg-gradient: linear-gradient(to bottom, rgba(99, 102, 241, 0.05), transparent);
  --role-bg-blur: rgba(147, 51, 234, 0.2);       /* Purple blur */
}
```

#### 상담사 대시보드
```css
.consultant-dashboard {
  --role-primary: var(--dashboard-secondary);     /* Emerald */
  --role-primary-hover: var(--dashboard-secondary-hover);
  --role-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --role-bg-gradient: linear-gradient(to bottom, rgba(16, 185, 129, 0.05), transparent);
  --role-bg-blur: rgba(16, 185, 129, 0.2);
}
```

#### 내담자 대시보드
```css
.client-dashboard {
  --role-primary: var(--cs-success-400);         /* Mint Green */
  --role-primary-hover: var(--cs-success-500);
  --role-gradient: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  --role-bg-gradient: linear-gradient(135deg, 
    var(--mg-pink-50) 0%, 
    var(--mg-success-50) 50%, 
    var(--mg-primary-50) 100%);
  --role-bg-blur: rgba(52, 211, 153, 0.15);
}
```

---

## 🎴 카드 디자인 스펙

### KPI 카드 (통계 카드)

#### 구조
```html
<div className="kpi-card">
  <div className="kpi-card-bg kpi-card-bg-{color}"></div>
  <div className="kpi-card-content">
    <div className="kpi-card-header">
      <div className="kpi-icon kpi-icon-{color}">
        <Icon />
      </div>
      <div className="kpi-trend kpi-trend-{direction}">
        <TrendIcon />
        <span>{percentage}%</span>
      </div>
    </div>
    <div className="kpi-card-body">
      <p className="kpi-label">{label}</p>
      <h3 className="kpi-value">{value}</h3>
    </div>
  </div>
</div>
```

#### CSS 스펙
```css
.kpi-card {
  position: relative;
  background: var(--dashboard-surface-light);
  border-radius: 16px;
  padding: 24px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--dashboard-border-light);
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 배경 그라데이션 레이어 */
.kpi-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60%;
  opacity: 0.1;
  z-index: 0;
}

.kpi-card-bg-indigo {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
}

.kpi-card-bg-purple {
  background: linear-gradient(135deg, #9333ea 0%, #a855f7 100%);
}

.kpi-card-bg-emerald {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.kpi-card-bg-dark {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

/* 카드 콘텐츠 */
.kpi-card-content {
  position: relative;
  z-index: 1;
}

/* 아이콘 */
.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.kpi-icon-indigo {
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
}

.kpi-icon-purple {
  background: rgba(147, 51, 234, 0.1);
  color: #9333ea;
}

.kpi-icon-emerald {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

/* 트렌드 표시 */
.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.kpi-trend-up {
  color: #10b981;
}

.kpi-trend-down {
  color: #ef4444;
}

/* 라벨 및 값 */
.kpi-label {
  font-size: 14px;
  color: var(--dashboard-text-secondary-light);
  margin-bottom: 8px;
  font-weight: 500;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--dashboard-text-light);
  line-height: 1.2;
}

/* 다크 모드 */
.dark .kpi-card {
  background: var(--dashboard-surface-dark);
  border-color: var(--dashboard-border-dark);
}

.dark .kpi-label {
  color: var(--dashboard-text-secondary-dark);
}

.dark .kpi-value {
  color: var(--dashboard-text-dark);
}
```

---

## 📐 레이아웃 구조

### 사이드바

#### 구조
```html
<aside className="dashboard-sidebar">
  <div className="sidebar-header">
    <div className="sidebar-logo">
      <div className="logo-icon">
        <Icon />
      </div>
      <div>
        <h1>시스템명</h1>
        <p>역할</p>
      </div>
    </div>
  </div>
  <nav className="sidebar-nav">
    <a className="nav-item active">
      <Icon />
      <span>메뉴명</span>
    </a>
  </nav>
  <div className="sidebar-footer">
    <div className="user-profile">
      <img className="user-avatar" />
      <div className="user-info">
        <p className="user-name">사용자명</p>
        <p className="user-email">이메일</p>
      </div>
    </div>
  </div>
</aside>
```

#### CSS 스펙
```css
.dashboard-sidebar {
  width: 256px;
  background: var(--dashboard-surface-light);
  border-right: 1px solid var(--dashboard-border-light);
  display: flex;
  flex-direction: column;
  height: 100vh;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px;
  padding-bottom: 8px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(to bottom right, #6366f1, var(--role-primary));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  color: var(--dashboard-text-secondary-light);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--dashboard-bg-light);
  color: var(--dashboard-text-light);
}

.nav-item.active {
  background: rgba(79, 70, 229, 0.1);
  color: var(--role-primary);
  font-weight: 600;
}

/* 다크 모드 */
.dark .dashboard-sidebar {
  background: var(--dashboard-surface-dark);
  border-right-color: var(--dashboard-border-dark);
}

.dark .nav-item:hover {
  background: var(--dashboard-bg-dark);
  color: var(--dashboard-text-dark);
}
```

### 헤더

#### 구조
```html
<header className="dashboard-header">
  <div className="header-left">
    <button className="hamburger-btn">
      <MenuIcon />
    </button>
    <div className="header-title">
      <h2>페이지 제목</h2>
      <p>부제목</p>
    </div>
  </div>
  <div className="header-right">
    <div className="search-box">
      <SearchIcon />
      <input type="text" placeholder="통합 검색..." />
    </div>
    <button className="notification-btn">
      <NotificationIcon />
      <span className="notification-badge"></span>
    </button>
    <button className="theme-toggle-btn">
      <ThemeIcon />
    </button>
  </div>
</header>
```

#### CSS 스펙
```css
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  padding: 0 32px;
  z-index: 10;
  background: transparent;
}

.header-title h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--dashboard-text-light);
  margin: 0;
}

.header-title p {
  font-size: 14px;
  color: var(--dashboard-text-secondary-light);
  margin: 4px 0 0 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--dashboard-surface-light);
  border: 1px solid var(--dashboard-border-light);
  border-radius: 12px;
  min-width: 240px;
}

.search-box input {
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  font-size: 14px;
  color: var(--dashboard-text-light);
}

.notification-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--dashboard-surface-light);
  border: 1px solid var(--dashboard-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid var(--dashboard-surface-light);
}
```

### 메인 콘텐츠 영역

#### 구조
```html
<main className="dashboard-main">
  <div className="dashboard-bg-gradient"></div>
  <div className="dashboard-bg-blur"></div>
  <div className="dashboard-content">
    <div className="content-wrapper">
      <!-- 콘텐츠 -->
    </div>
  </div>
</main>
```

#### CSS 스펙
```css
.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.dashboard-bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 384px;
  background: var(--role-bg-gradient);
  pointer-events: none;
  z-index: 0;
}

.dashboard-bg-blur {
  position: absolute;
  top: -96px;
  right: 0;
  width: 384px;
  height: 384px;
  background: var(--role-bg-blur);
  border-radius: 50%;
  filter: blur(96px);
  pointer-events: none;
  z-index: 0;
}

.dashboard-content {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.content-wrapper {
  width: 100%;
  margin: 0 auto;
}

/* 반응형 최대 너비 (화면 해상도에 따라 변경) */
/* Mobile: 제한 없음 (100%) */
@media (max-width: 767px) {
  .content-wrapper {
    max-width: 100%;
  }
}

/* Tablet: 768px - 1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .content-wrapper {
    max-width: 100%;
  }
}

/* Desktop: 1024px - 1439px */
@media (min-width: 1024px) and (max-width: 1439px) {
  .content-wrapper {
    max-width: 1200px;
  }
}

/* Large Desktop: 1440px - 1919px */
@media (min-width: 1440px) and (max-width: 1919px) {
  .content-wrapper {
    max-width: 1600px;
  }
}

/* XL Desktop: 1920px - 2559px */
@media (min-width: 1920px) and (max-width: 2559px) {
  .content-wrapper {
    max-width: 1800px;
  }
}

/* 2K/4K Desktop: 2560px 이상 */
@media (min-width: 2560px) {
  .content-wrapper {
    max-width: 2000px;
  }
}
```

---

## 📱 반응형 디자인

### 브레이크포인트

```css
/* 모바일 */
@media (max-width: 767px) {
  .dashboard-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 280px;
    transform: translateX(-100%);
    z-index: 1000;
    transition: transform 0.3s ease;
  }
  
  .dashboard-sidebar.open {
    transform: translateX(0);
  }
  
  .dashboard-main {
    width: 100%;
    margin-left: 0;
  }
  
  .dashboard-content {
    padding: 16px;
  }
  
  .kpi-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* 태블릿 */
@media (min-width: 768px) and (max-width: 1023px) {
  .dashboard-sidebar {
    width: 240px;
  }
  
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .dashboard-sidebar {
    width: 256px;
  }
  
  .kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
  }
}
```

---

## 🎯 적용 방법

### 1. CSS 변수 추가

`frontend/src/styles/dashboard-common-v3.css`에 샘플 페이지 색상 변수 추가:

```css
:root {
  /* 샘플 페이지 색상 변수 추가 */
  --dashboard-primary: #4f46e5;
  --dashboard-primary-hover: #4338ca;
  --dashboard-secondary: #10b981;
  --dashboard-bg-light: #f8fafc;
  --dashboard-bg-dark: #0f172a;
  /* ... (위 색상 시스템 참조) */
}
```

### 2. 카드 컴포넌트 스타일 적용

`frontend/src/styles/dashboard-common-v3.css`에 KPI 카드 스타일 추가:

```css
/* 기존 .mg-dashboard-stat-card 스타일을 확장 */
.mg-dashboard-stat-card {
  position: relative;
  overflow: hidden;
  /* ... (위 KPI 카드 CSS 스펙 참조) */
}

.mg-dashboard-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: var(--role-gradient);
  opacity: 0.1;
  z-index: 0;
}
```

### 3. 레이아웃 구조 적용

각 대시보드 컴포넌트에 샘플 페이지 구조 적용 (단계적):

1. **Phase 1**: CSS만으로 카드 스타일 개선
2. **Phase 2**: 레이아웃 구조 변경 (사이드바, 헤더)

---

## 📋 체크리스트

### 디자인 스펙 정의
- [x] 색상 시스템 정의
- [x] 카드 디자인 스펙 정의
- [x] 레이아웃 구조 정의
- [x] 반응형 디자인 정의
- [ ] 타이포그래피 스펙 정의
- [ ] 애니메이션 스펙 정의
- [ ] 아이콘 스펙 정의

### CSS 변수 추가
- [ ] 샘플 페이지 색상 변수 추가
- [ ] 역할별 테마 색상 추가
- [ ] 다크 모드 색상 추가

### 스타일 적용
- [ ] 카드 스타일 적용
- [ ] 레이아웃 스타일 적용
- [ ] 반응형 스타일 적용

---

## 🔗 참조 문서

- [전체 대시보드 시스템 상용화 개선 계획](./ALL_DASHBOARDS_COMMERCIALIZATION_PLAN.md)
- [관리자 대시보드 CSS 수정만으로 개선 가능 여부 분석](./ADMIN_DASHBOARD_CSS_MIGRATION_ANALYSIS.md)
- [반응형 디자인 가이드라인](./RESPONSIVE_DESIGN_GUIDELINES.md)
