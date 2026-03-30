# 대시보드 레이아웃 마이그레이션 계획

**버전**: 1.0.0  
**최종 업데이트**: 2025-02-04  
**상태**: 마이그레이션 계획 수립  
**참조**: 
- `docs/standards/DASHBOARD_DESIGN_GUIDE.md` (디자인 가이드)
- `frontend/src/pages/DashboardDesignGuideSample.js` (샘플 페이지)

---

## 📌 개요

디자인 가이드에 맞춘 샘플 페이지를 만들고, 실제 대시보드(관리자, 상담사, 내담자)에 적용하는 방법을 정의합니다.

### 현재 구조 vs 목표 구조

#### 현재 구조
```jsx
// 현재 대시보드 구조
<SimpleLayout title="대시보드">
  <div className="mg-dashboard-layout">
    <div className="mg-dashboard-header">...</div>
    <div className="mg-dashboard-stats">...</div>
    <DashboardSection>...</DashboardSection>
  </div>
</SimpleLayout>
```

**특징**:
- `SimpleLayout`이 `UnifiedHeader`와 햄버거 메뉴 제공
- 사이드바 없음 (햄버거 메뉴로 대체)
- 헤더 기능 부족 (검색, 알림, 다크 모드 없음)

#### 목표 구조 (샘플 페이지)
```jsx
// 목표 대시보드 구조
<div className="dashboard-container">
  <aside className="dashboard-sidebar">...</aside>
  <main className="dashboard-main">
    <header className="dashboard-header">...</header>
    <div className="dashboard-content">...</div>
  </main>
</div>
```

**특징**:
- 고정 사이드바
- 헤더에 검색, 알림, 다크 모드 포함
- 배경 그라데이션 및 블러 효과

---

## 🎯 마이그레이션 전략

### 옵션 A: SimpleLayout 유지 + CSS 개선 (권장) ⭐

**전략**: `SimpleLayout` 구조는 유지하고, CSS만으로 디자인 개선

#### 장점
- ✅ 기존 시스템과의 호환성 유지
- ✅ 세션 관리, 권한 체크 등 기존 기능 유지
- ✅ 빠른 적용 가능 (CSS만 수정)
- ✅ 리스크 최소화

#### 적용 방법

1. **CSS 변수 추가**
   - `frontend/src/styles/dashboard-common-v3.css`에 샘플 페이지 색상 변수 추가

2. **카드 스타일 개선**
   - 기존 `.mg-dashboard-stat-card`에 샘플 페이지 스타일 적용
   - 배경 그라데이션, 아이콘 스타일, 호버 효과 추가

3. **레이아웃 스타일 개선**
   - 기존 `.mg-dashboard-layout`에 배경 효과 추가
   - 헤더 스타일 개선

#### 제한사항
- ⚠️ 사이드바는 `SimpleLayout`의 햄버거 메뉴 유지
- ⚠️ 헤더 기능 추가는 별도 개발 필요

---

### 옵션 B: 레이아웃 구조 변경 (고급)

**전략**: `SimpleLayout` 대신 샘플 페이지 구조로 완전 변경

#### 장점
- ✅ 샘플 페이지와 완전히 동일한 구조
- ✅ 사이드바, 헤더 기능 완전 구현

#### 단점
- ❌ 기존 시스템과의 통합 작업 필요
- ❌ 세션 관리, 권한 체크 등 재구현 필요
- ❌ 개발 시간 많이 소요 (2-3주)
- ❌ 리스크 높음

#### 적용 방법

1. **새 레이아웃 컴포넌트 생성**
   - `DashboardLayout.js` 생성 (샘플 페이지 구조 기반)
   - 세션 관리, 권한 체크 통합

2. **기존 대시보드 마이그레이션**
   - `AdminDashboard.js`에서 `SimpleLayout` 제거
   - `DashboardLayout` 사용

3. **기능 통합**
   - 동적 메뉴 시스템 통합
   - 권한 기반 메뉴 필터링
   - 알림 시스템 연동

---

## 📋 단계별 적용 계획

### Phase 1: 샘플 페이지 생성 및 검증 (1일)

**목표**: 디자인 가이드에 맞춘 샘플 페이지 생성 및 확인

#### 작업 내용
- [x] `DashboardDesignGuideSample.js` 생성
- [x] `DashboardDesignGuideSample.css` 생성
- [ ] 샘플 페이지 라우트 추가
- [ ] 브라우저에서 확인

#### 확인 사항
- [ ] 색상 시스템이 디자인 가이드와 일치하는가?
- [ ] 카드 스타일이 디자인 가이드와 일치하는가?
- [ ] 레이아웃 구조가 디자인 가이드와 일치하는가?
- [ ] 반응형이 제대로 동작하는가?

---

### Phase 2: CSS 변수 추가 (1일)

**목표**: 샘플 페이지 색상을 CSS 변수로 추가

#### 작업 내용
- [ ] `frontend/src/styles/dashboard-common-v3.css`에 색상 변수 추가
- [ ] 역할별 테마 색상 추가
- [ ] 다크 모드 색상 추가

#### 추가할 CSS 변수
```css
:root {
  /* 샘플 페이지 색상 변수 */
  --dashboard-primary: #4f46e5;
  --dashboard-primary-hover: #4338ca;
  --dashboard-secondary: #10b981;
  --dashboard-bg-light: #f8fafc;
  --dashboard-bg-dark: #0f172a;
  /* ... (디자인 가이드 참조) */
}

/* 역할별 테마 */
.admin-dashboard {
  --role-primary: var(--dashboard-primary);
  --role-gradient: linear-gradient(135deg, #4f46e5 0%, #312e81 100%);
  /* ... */
}
```

---

### Phase 3: 카드 스타일 적용 (2일)

**목표**: 기존 카드에 샘플 페이지 스타일 적용

#### 작업 내용
- [ ] `.mg-dashboard-stat-card`에 배경 그라데이션 추가
- [ ] 아이콘 스타일 개선
- [ ] 호버 효과 강화
- [ ] 트렌드 표시 스타일 추가

#### 적용 예시
```css
.mg-dashboard-stat-card {
  position: relative;
  overflow: hidden;
  /* 기존 스타일 유지 */
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

.mg-dashboard-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

---

### Phase 4: 레이아웃 스타일 적용 (2일)

**목표**: 배경 효과 및 레이아웃 스타일 개선

#### 작업 내용
- [ ] `.mg-dashboard-layout`에 배경 그라데이션 추가
- [ ] 헤더 스타일 개선
- [ ] 간격 및 타이포그래피 개선

#### 적용 예시
```css
.mg-dashboard-layout {
  position: relative;
  /* 기존 스타일 유지 */
}

.mg-dashboard-layout::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 384px;
  background: var(--role-bg-gradient);
  pointer-events: none;
  z-index: 0;
}
```

---

### Phase 5: 레이아웃 구조 변경 (선택적, 1주)

**목표**: 사이드바 및 헤더 구조 변경

#### 작업 내용
- [ ] 새 레이아웃 컴포넌트 생성 (`DashboardLayout.js`)
- [ ] 세션 관리 통합
- [ ] 동적 메뉴 시스템 통합
- [ ] 권한 기반 메뉴 필터링
- [ ] 알림 시스템 연동

---

## 🔍 레이아웃 적용 방법 비교

### 방법 1: CSS만으로 개선 (옵션 A)

**현재 구조 유지**:
```jsx
<SimpleLayout title="관리자 대시보드">
  <div className="mg-dashboard-layout">
    {/* 기존 구조 유지 */}
  </div>
</SimpleLayout>
```

**CSS로 개선**:
- 카드 스타일 개선
- 배경 효과 추가
- 색상 시스템 통합

**결과**: 시각적 품질 70% 개선, 구조는 유지

---

### 방법 2: 구조 변경 (옵션 B)

**새 구조 적용**:
```jsx
<DashboardLayout>
  <aside className="dashboard-sidebar">...</aside>
  <main className="dashboard-main">
    <header className="dashboard-header">...</header>
    <div className="dashboard-content">...</div>
  </main>
</DashboardLayout>
```

**완전한 마이그레이션**:
- 사이드바 구조 변경
- 헤더 기능 추가
- 모든 기능 재통합

**결과**: 샘플 페이지와 완전히 동일, 개발 시간 많이 소요

---

## ✅ 권장 사항

### 즉시 실행 (Phase 1-4)

1. **Phase 1**: 샘플 페이지 생성 및 검증
2. **Phase 2**: CSS 변수 추가
3. **Phase 3**: 카드 스타일 적용
4. **Phase 4**: 레이아웃 스타일 적용

**예상 소요 시간**: 1주  
**예상 효과**: 시각적 품질 70% 개선

### 이후 검토 (Phase 5)

- Phase 1-4 완료 후 평가
- 필요시 Phase 5 진행 (구조 변경)

---

## 📋 체크리스트

### Phase 1: 샘플 페이지 생성
- [x] `DashboardDesignGuideSample.js` 생성
- [x] `DashboardDesignGuideSample.css` 생성
- [ ] 샘플 페이지 라우트 추가
- [ ] 브라우저에서 확인
- [ ] 디자인 가이드와 일치 여부 확인

### Phase 2: CSS 변수 추가
- [ ] 샘플 페이지 색상 변수 추가
- [ ] 역할별 테마 색상 추가
- [ ] 다크 모드 색상 추가

### Phase 3: 카드 스타일 적용
- [ ] 배경 그라데이션 추가
- [ ] 아이콘 스타일 개선
- [ ] 호버 효과 강화
- [ ] 트렌드 표시 스타일 추가

### Phase 4: 레이아웃 스타일 적용
- [ ] 배경 그라데이션 추가
- [ ] 헤더 스타일 개선
- [ ] 간격 및 타이포그래피 개선

### Phase 5: 레이아웃 구조 변경 (선택적)
- [ ] 새 레이아웃 컴포넌트 생성
- [ ] 세션 관리 통합
- [ ] 동적 메뉴 시스템 통합
- [ ] 권한 기반 메뉴 필터링
- [ ] 알림 시스템 연동

---

## 🔗 참조 문서

- [대시보드 디자인 가이드](./DASHBOARD_DESIGN_GUIDE.md)
- [전체 대시보드 시스템 상용화 개선 계획](./ALL_DASHBOARDS_COMMERCIALIZATION_PLAN.md)
- [관리자 대시보드 CSS 수정만으로 개선 가능 여부 분석](./ADMIN_DASHBOARD_CSS_MIGRATION_ANALYSIS.md)
