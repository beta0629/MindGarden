# CoreSolution 아토믹 디자인 시스템

**버전**: 1.0.0  
**최종 업데이트**: 2025-02-04  
**상태**: 공식 디자인 시스템  
**기반**: Atomic Design Pattern by Brad Frost

---

## 📌 개요

CoreSolution의 반응형 웹 애플리케이션을 위한 체계적인 디자인 시스템입니다. 아토믹 디자인 패턴을 기반으로 하여 재사용 가능하고 확장 가능한 컴포넌트 아키텍처를 제공합니다.

### 디자인 철학

1. **깔끔함 (Clean)**: 불필요한 장식을 제거하고 본질에 집중
2. **일관성 (Consistency)**: 모든 컴포넌트가 동일한 디자인 언어 사용
3. **재사용성 (Reusability)**: 작은 단위부터 큰 단위까지 체계적 조합
4. **반응형 (Responsive)**: 모바일 우선, 모든 디바이스 대응
5. **접근성 (Accessibility)**: WCAG 2.1 AA 기준 준수

---

## 🏗️ 아토믹 디자인 계층 구조

```
Pages (페이지)
    ↓
Templates (템플릿)
    ↓
Organisms (유기체)
    ↓
Molecules (분자)
    ↓
Atoms (원자)
```

---

## 1️⃣ Atoms (원자)

가장 작은 단위의 UI 컴포넌트입니다. 더 이상 분해할 수 없는 기본 요소들입니다.

### 1.1 버튼 (Button)

**기본 버튼**
```css
.cs-button {
  /* Primary Button */
  --cs-button-primary-bg: var(--cs-primary-500);
  --cs-button-primary-hover: var(--cs-primary-600);
  --cs-button-primary-text: #ffffff;
  
  /* Secondary Button */
  --cs-button-secondary-bg: var(--cs-secondary-100);
  --cs-button-secondary-hover: var(--cs-secondary-200);
  --cs-button-secondary-text: var(--cs-secondary-700);
  
  /* Size Variants */
  --cs-button-sm-padding: 8px 16px;
  --cs-button-md-padding: 12px 24px;
  --cs-button-lg-padding: 16px 32px;
}
```

**변형 (Variants)**
- Primary: 주요 액션
- Secondary: 보조 액션
- Ghost: 투명 배경
- Danger: 위험한 액션
- Size: sm, md, lg

### 1.2 입력 필드 (Input)

```css
.cs-input {
  --cs-input-bg: #ffffff;
  --cs-input-border: var(--cs-secondary-300);
  --cs-input-border-focus: var(--cs-primary-500);
  --cs-input-text: var(--cs-secondary-900);
  --cs-input-placeholder: var(--cs-secondary-400);
  --cs-input-padding: 12px 16px;
  --cs-input-radius: 8px;
}
```

**상태**
- Default
- Focus
- Error
- Disabled

### 1.3 라벨 (Label)

```css
.cs-label {
  --cs-label-text: var(--cs-secondary-700);
  --cs-label-required: var(--cs-error-500);
  --cs-label-font-size: 14px;
  --cs-label-font-weight: 500;
}
```

### 1.4 아이콘 (Icon)

```css
.cs-icon {
  --cs-icon-size-sm: 16px;
  --cs-icon-size-md: 24px;
  --cs-icon-size-lg: 32px;
  --cs-icon-color: var(--cs-secondary-600);
}
```

### 1.5 텍스트 (Text)

```css
.cs-text {
  /* Typography Scale */
  --cs-text-xs: 12px;
  --cs-text-sm: 14px;
  --cs-text-base: 16px;
  --cs-text-lg: 18px;
  --cs-text-xl: 20px;
  --cs-text-2xl: 24px;
  --cs-text-3xl: 30px;
  
  /* Colors */
  --cs-text-primary: var(--cs-secondary-900);
  --cs-text-secondary: var(--cs-secondary-600);
  --cs-text-tertiary: var(--cs-secondary-400);
}
```

### 1.6 배지 (Badge)

```css
.cs-badge {
  --cs-badge-sm: 20px;
  --cs-badge-md: 24px;
  --cs-badge-lg: 28px;
  --cs-badge-radius: 12px;
  
  /* Variants */
  --cs-badge-primary-bg: var(--cs-primary-100);
  --cs-badge-primary-text: var(--cs-primary-700);
  --cs-badge-success-bg: var(--cs-success-100);
  --cs-badge-success-text: var(--cs-success-700);
}
```

### 1.7 체크박스 (Checkbox)

```css
.cs-checkbox {
  --cs-checkbox-size: 20px;
  --cs-checkbox-border: var(--cs-secondary-300);
  --cs-checkbox-checked: var(--cs-primary-500);
  --cs-checkbox-radius: 4px;
}
```

### 1.8 라디오 버튼 (Radio)

```css
.cs-radio {
  --cs-radio-size: 20px;
  --cs-radio-border: var(--cs-secondary-300);
  --cs-radio-selected: var(--cs-primary-500);
}
```

### 1.9 스위치 (Switch)

```css
.cs-switch {
  --cs-switch-width: 44px;
  --cs-switch-height: 24px;
  --cs-switch-bg: var(--cs-secondary-300);
  --cs-switch-active: var(--cs-primary-500);
  --cs-switch-thumb: #ffffff;
}
```

### 1.10 구분선 (Divider)

```css
.cs-divider {
  --cs-divider-color: var(--cs-secondary-200);
  --cs-divider-thickness: 1px;
}
```

---

## 2️⃣ Molecules (분자)

Atoms를 조합하여 만든 더 복잡한 UI 컴포넌트입니다.

### 2.1 폼 필드 (Form Field)

**구성**: Label + Input + Error Message

```html
<div class="cs-form-field">
  <label class="cs-label">이메일</label>
  <input type="email" class="cs-input" />
  <span class="cs-error-message">올바른 이메일을 입력하세요</span>
</div>
```

### 2.2 검색 바 (Search Bar)

**구성**: Input + Icon Button

```html
<div class="cs-search-bar">
  <input type="search" class="cs-input" placeholder="검색..." />
  <button class="cs-button cs-button-icon">
    <icon name="search" />
  </button>
</div>
```

### 2.3 카드 (Card)

**구성**: Header + Content + Footer + Actions

```html
<div class="cs-card">
  <div class="cs-card-header">
    <h3 class="cs-text cs-text-lg">카드 제목</h3>
  </div>
  <div class="cs-card-content">
    <p class="cs-text">카드 내용</p>
  </div>
  <div class="cs-card-footer">
    <button class="cs-button cs-button-primary">액션</button>
  </div>
</div>
```

### 2.4 알림 (Alert)

**구성**: Icon + Text + Close Button

```html
<div class="cs-alert cs-alert-success">
  <icon name="check-circle" />
  <p class="cs-text">성공 메시지</p>
  <button class="cs-button cs-button-icon">×</button>
</div>
```

### 2.5 드롭다운 (Dropdown)

**구성**: Button + Menu List

```html
<div class="cs-dropdown">
  <button class="cs-button">선택</button>
  <ul class="cs-dropdown-menu">
    <li class="cs-dropdown-item">옵션 1</li>
    <li class="cs-dropdown-item">옵션 2</li>
  </ul>
</div>
```

### 2.6 탭 (Tabs)

**구성**: Tab Buttons + Tab Panels

```html
<div class="cs-tabs">
  <div class="cs-tab-list">
    <button class="cs-tab cs-tab-active">탭 1</button>
    <button class="cs-tab">탭 2</button>
  </div>
  <div class="cs-tab-panels">
    <div class="cs-tab-panel cs-tab-panel-active">내용 1</div>
    <div class="cs-tab-panel">내용 2</div>
  </div>
</div>
```

### 2.7 모달 (Modal)

**구성**: Overlay + Dialog + Header + Content + Footer

```html
<div class="cs-modal-overlay">
  <div class="cs-modal">
    <div class="cs-modal-header">
      <h2 class="cs-text cs-text-xl">모달 제목</h2>
      <button class="cs-button cs-button-icon">×</button>
    </div>
    <div class="cs-modal-content">
      <p class="cs-text">모달 내용</p>
    </div>
    <div class="cs-modal-footer">
      <button class="cs-button cs-button-secondary">취소</button>
      <button class="cs-button cs-button-primary">확인</button>
    </div>
  </div>
</div>
```

---

## 3️⃣ Organisms (유기체)

Molecules와 Atoms를 조합하여 만든 복잡한 UI 섹션입니다.

### 3.1 헤더 (Header)

**구성**: Logo + Navigation + Search + User Menu

```html
<header class="cs-header">
  <div class="cs-header-logo">CoreSolution</div>
  <nav class="cs-header-nav">
    <a href="#" class="cs-nav-link">대시보드</a>
    <a href="#" class="cs-nav-link">관리</a>
  </nav>
  <div class="cs-header-search">
    <molecule-search-bar />
  </div>
  <div class="cs-header-user">
    <molecule-dropdown />
  </div>
</header>
```

### 3.2 사이드바 (Sidebar)

**구성**: Logo + Navigation Menu + Footer

```html
<aside class="cs-sidebar">
  <div class="cs-sidebar-logo">CoreSolution</div>
  <nav class="cs-sidebar-nav">
    <a href="#" class="cs-sidebar-item cs-sidebar-item-active">
      <icon name="dashboard" />
      <span>대시보드</span>
    </a>
    <a href="#" class="cs-sidebar-item">
      <icon name="users" />
      <span>사용자 관리</span>
    </a>
  </nav>
  <div class="cs-sidebar-footer">
    <button class="cs-button cs-button-secondary">로그아웃</button>
  </div>
</aside>
```

### 3.3 테이블 (Table)

**구성**: Header + Body + Footer + Pagination

```html
<div class="cs-table-container">
  <table class="cs-table">
    <thead class="cs-table-header">
      <tr>
        <th class="cs-table-cell">이름</th>
        <th class="cs-table-cell">이메일</th>
        <th class="cs-table-cell">역할</th>
        <th class="cs-table-cell">액션</th>
      </tr>
    </thead>
    <tbody class="cs-table-body">
      <tr>
        <td class="cs-table-cell">홍길동</td>
        <td class="cs-table-cell">hong@example.com</td>
        <td class="cs-table-cell">
          <atom-badge variant="primary">관리자</atom-badge>
        </td>
        <td class="cs-table-cell">
          <button class="cs-button cs-button-sm">수정</button>
        </td>
      </tr>
    </tbody>
  </table>
  <div class="cs-table-pagination">
    <molecule-pagination />
  </div>
</div>
```

### 3.4 필터 바 (Filter Bar)

**구성**: Search + Filters + Sort + Actions

```html
<div class="cs-filter-bar">
  <molecule-search-bar />
  <div class="cs-filter-group">
    <molecule-dropdown label="상태" />
    <molecule-dropdown label="날짜" />
  </div>
  <div class="cs-filter-actions">
    <button class="cs-button cs-button-secondary">초기화</button>
    <button class="cs-button cs-button-primary">적용</button>
  </div>
</div>
```

### 3.5 대시보드 그리드 (Dashboard Grid)

**구성**: KPI Cards + Charts + Tables

```html
<div class="cs-dashboard-grid">
  <div class="cs-dashboard-kpi">
    <molecule-card-kpi title="총 사용자" value="1,234" trend="+12%" />
    <molecule-card-kpi title="활성 세션" value="567" trend="+5%" />
    <molecule-card-kpi title="매출" value="₩12.3M" trend="+23%" />
  </div>
  <div class="cs-dashboard-charts">
    <molecule-card>
      <organism-chart type="line" />
    </molecule-card>
  </div>
  <div class="cs-dashboard-tables">
    <organism-table />
  </div>
</div>
```

### 3.6 관리자 대시보드 모니터링

**참조 예**: AI·보안 모니터링·시스템 모니터링 두 Organism — [ADMIN_DASHBOARD_MONITORING_DESIGN_SPEC.md](./ADMIN_DASHBOARD_MONITORING_DESIGN_SPEC.md), 구현: `AdminDashboardMonitoring.js`, `DashboardSection.js`, 위젯 5개(AIMonitoringWidget, SecurityAuditWidget, SchedulerStatusWidget, SystemMetricsWidget, AIUsageWidget).

---

## 4️⃣ Templates (템플릿)

Organisms를 조합하여 만든 페이지 레벨 레이아웃입니다.

### 4.1 대시보드 템플릿

```html
<div class="cs-template-dashboard">
  <organism-sidebar />
  <div class="cs-template-main">
    <organism-header />
    <main class="cs-template-content">
      <organism-dashboard-grid />
    </main>
  </div>
</div>
```

### 4.2 리스트 페이지 템플릿

```html
<div class="cs-template-list">
  <organism-sidebar />
  <div class="cs-template-main">
    <organism-header />
    <main class="cs-template-content">
      <div class="cs-page-header">
        <h1 class="cs-text cs-text-2xl">사용자 관리</h1>
        <button class="cs-button cs-button-primary">추가</button>
      </div>
      <organism-filter-bar />
      <organism-table />
    </main>
  </div>
</div>
```

### 4.3 폼 페이지 템플릿

```html
<div class="cs-template-form">
  <organism-sidebar />
  <div class="cs-template-main">
    <organism-header />
    <main class="cs-template-content">
      <div class="cs-form-container">
        <h1 class="cs-text cs-text-2xl">사용자 등록</h1>
        <form class="cs-form">
          <molecule-form-field label="이름" />
          <molecule-form-field label="이메일" />
          <molecule-form-field label="비밀번호" type="password" />
          <div class="cs-form-actions">
            <button class="cs-button cs-button-secondary">취소</button>
            <button class="cs-button cs-button-primary">저장</button>
          </div>
        </form>
      </div>
    </main>
  </div>
</div>
```

---

## 5️⃣ Pages (페이지)

Templates에 실제 콘텐츠를 채워넣은 최종 페이지입니다.

### 5.1 관리자 대시보드 페이지

- Template: Dashboard Template
- Content: 실제 KPI 데이터, 차트 데이터, 테이블 데이터

### 5.2 사용자 목록 페이지

- Template: List Page Template
- Content: 실제 사용자 데이터, 필터 조건

### 5.3 사용자 등록 페이지

- Template: Form Page Template
- Content: 실제 폼 필드, 유효성 검사

---

## 🎨 디자인 토큰 (Design Tokens)

### 색상 시스템

```css
:root {
  /* Primary Colors */
  --cs-primary-50: #eff6ff;
  --cs-primary-500: #3b82f6;
  --cs-primary-900: #1e3a8a;
  
  /* Secondary Colors */
  --cs-secondary-50: #f9fafb;
  --cs-secondary-500: #6b7280;
  --cs-secondary-900: #111827;
  
  /* Semantic Colors */
  --cs-success-500: #10b981;
  --cs-error-500: #ef4444;
  --cs-warning-500: #f59e0b;
  --cs-info-500: #3b82f6;
}
```

### 간격 시스템 (Spacing)

```css
:root {
  --cs-spacing-xs: 4px;
  --cs-spacing-sm: 8px;
  --cs-spacing-md: 16px;
  --cs-spacing-lg: 24px;
  --cs-spacing-xl: 32px;
  --cs-spacing-2xl: 48px;
  --cs-spacing-3xl: 64px;
}
```

### 타이포그래피

```css
:root {
  --cs-font-family: 'Noto Sans KR', -apple-system, sans-serif;
  --cs-font-size-xs: 12px;
  --cs-font-size-sm: 14px;
  --cs-font-size-base: 16px;
  --cs-font-size-lg: 18px;
  --cs-font-size-xl: 20px;
  --cs-font-size-2xl: 24px;
  --cs-font-size-3xl: 30px;
  
  --cs-font-weight-normal: 400;
  --cs-font-weight-medium: 500;
  --cs-font-weight-semibold: 600;
  --cs-font-weight-bold: 700;
  
  --cs-line-height-tight: 1.25;
  --cs-line-height-normal: 1.5;
  --cs-line-height-relaxed: 1.75;
}
```

### 그림자 (Shadows)

```css
:root {
  --cs-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --cs-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --cs-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --cs-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

### 반경 (Border Radius)

```css
:root {
  --cs-radius-sm: 4px;
  --cs-radius-md: 8px;
  --cs-radius-lg: 12px;
  --cs-radius-xl: 16px;
  --cs-radius-full: 9999px;
}
```

---

## 📱 반응형 디자인

### 브레이크포인트

```css
:root {
  --cs-breakpoint-sm: 640px;   /* 모바일 */
  --cs-breakpoint-md: 768px;   /* 태블릿 */
  --cs-breakpoint-lg: 1024px;  /* 데스크톱 */
  --cs-breakpoint-xl: 1280px;  /* 큰 데스크톱 */
  --cs-breakpoint-2xl: 1536px; /* 초대형 */
}
```

### 반응형 유틸리티

```css
/* 모바일 우선 접근 */
.cs-container {
  width: 100%;
  padding: var(--cs-spacing-md);
}

@media (min-width: 768px) {
  .cs-container {
    max-width: 768px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .cs-container {
    max-width: 1024px;
  }
}
```

---

## 🔧 구현 가이드

### 1. 컴포넌트 구조

```
frontend/src/components/
├── atoms/
│   ├── Button/
│   ├── Input/
│   ├── Label/
│   └── Icon/
├── molecules/
│   ├── FormField/
│   ├── SearchBar/
│   ├── Card/
│   └── Alert/
├── organisms/
│   ├── Header/
│   ├── Sidebar/
│   ├── Table/
│   └── DashboardGrid/
└── templates/
    ├── DashboardTemplate/
    ├── ListPageTemplate/
    └── FormPageTemplate/
```

### 2. CSS 변수 사용 규칙

```css
/* ✅ 올바른 사용 */
.cs-button {
  background: var(--cs-primary-500);
  color: var(--cs-button-primary-text);
  padding: var(--cs-spacing-md) var(--cs-spacing-lg);
}

/* ❌ 잘못된 사용 (하드코딩) */
.cs-button {
  background: #3b82f6;
  color: #ffffff;
  padding: 16px 24px;
}
```

### 3. 컴포넌트 네이밍 규칙

- Atoms: `cs-{component-name}` (예: `cs-button`, `cs-input`)
- Molecules: `cs-{component-name}` (예: `cs-form-field`, `cs-card`)
- Organisms: `cs-{component-name}` (예: `cs-header`, `cs-sidebar`)
- Templates: `cs-template-{template-name}` (예: `cs-template-dashboard`)

---

## 📚 참고 자료

- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/)
- [CoreSolution 디자인 토큰](./unified-design-tokens.css)
- [대시보드 디자인 가이드](../standards/DASHBOARD_DESIGN_GUIDE.md)

---

## 🔄 버전 히스토리

- **1.0.0** (2025-02-04): 초기 버전 작성
