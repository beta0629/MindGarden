# 내담자 목록 페이지 레이아웃 수정 — 핸드오프 문서

**작성일**: 2026-03-09  
**담당**: core-designer → core-coder  
**우선순위**: 🔴 HIGH (레이아웃 표준 준수)

**참조**:
- 기존 설계: `docs/design-system/v2/CONSULTANT_CLIENT_LIST_REDESIGN_SPEC.md`
- 현재 파일: `frontend/src/components/consultant/ConsultantClientList.js`
- 참조 패턴: `frontend/src/components/dashboard-v2/AdminDashboardV2.js`

---

## 0. 문제 요약

### 0.1 현재 문제점

❌ **비표준 레이아웃 구조**:
```jsx
<AdminCommonLayout title="내담자 목록">
  <div className="consultant-client-list-container"> {/* 비표준 래퍼 */}
    <div className="client-list-header">...</div>
    <div className="client-list-controls">...</div>
    <div className="client-card-grid">...</div>
  </div>
</AdminCommonLayout>
```

**문제**:
1. `consultant-client-list-container` 클래스 사용 (비표준)
2. ContentArea, ContentHeader, ContentSection 패턴 미적용
3. AdminDashboardV2와 레이아웃 구조가 다름
4. 대시보드와 일관성 없는 네비게이션 경험

### 0.2 올바른 구조

✅ **AdminDashboardV2 패턴**:
```jsx
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';

<AdminCommonLayout title="내담자 목록">
  <ContentArea>
    <ContentHeader title="..." subtitle="..." />
    <ContentSection noCard={true}>...</ContentSection>
    <ContentSection noCard={true}>...</ContentSection>
  </ContentArea>
</AdminCommonLayout>
```

---

## 1. AdminCommonLayout 구조 이해

### 1.1 레이아웃 계층

```
AdminCommonLayout (props: title, children)
└── DesktopLayout 또는 MobileLayout
    └── mg-v2-desktop-layout
        ├── DesktopGnb (상단 네비게이션 바)
        └── mg-v2-desktop-layout__body
            ├── DesktopLnb (좌측 사이드바, 260px)
            └── mg-v2-desktop-layout__main ← children이 렌더링되는 영역
                └── {children} ← 여기에 ContentArea 배치
```

**핵심**:
- `AdminCommonLayout`은 이미 **GNB + LNB + 메인 영역 구조**를 제공
- `children`은 `mg-v2-desktop-layout__main` 내부에 렌더링됨
- 따라서 **children 내부에서 추가 래퍼를 만들 필요 없음**

### 1.2 mg-v2-desktop-layout__main 스타일

```css
.mg-v2-desktop-layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: var(--mg-layout-page-padding, 24px); /* ← 이미 패딩 적용됨 */
  min-height: 0;
}
```

**결론**: 
- 페이지 패딩은 `mg-v2-desktop-layout__main`에서 이미 처리
- ContentArea는 **패딩 없이** 자식 요소들을 세로로 배치하는 역할

---

## 2. ContentArea 패턴

### 2.1 ContentArea 역할

**파일**: `frontend/src/components/dashboard-v2/content/ContentArea.js`

```jsx
const ContentArea = ({ children, className = '', ariaLabel }) => {
  return (
    <div
      className={`mg-v2-content-area ${className}`.trim()}
      role="region"
      aria-label={ariaLabel || '대시보드 콘텐츠'}
    >
      {children}
    </div>
  );
};
```

**스타일**: `frontend/src/components/dashboard-v2/content/ContentArea.css`
- 패딩 없음
- 자식 요소들을 세로로 배치 (flex-direction: column)
- gap으로 자식 간 간격 처리

### 2.2 ContentHeader 역할

**파일**: `frontend/src/components/dashboard-v2/content/ContentHeader.js`

```jsx
const ContentHeader = ({ title, subtitle, actions }) => {
  return (
    <header className="mg-v2-content-header">
      <div className="mg-v2-content-header__left">
        {title && <h1 className="mg-v2-content-header__title">{title}</h1>}
        {subtitle && <p className="mg-v2-content-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="mg-v2-content-header__right">{actions}</div>}
    </header>
  );
};
```

**Props**:
- `title`: 페이지 제목 (예: "내담자 목록")
- `subtitle`: 페이지 설명 (예: "나와 연계된 내담자들을 조회할 수 있습니다.")
- `actions`: 우측 액션 버튼 (선택 사항)

### 2.3 ContentSection 역할

**파일**: `frontend/src/components/dashboard-v2/content/ContentSection.js`

```jsx
const ContentSection = ({ title, subtitle, actions, children, className = '', noCard = false }) => {
  // ...
  if (noCard) {
    return (
      <section className={`mg-v2-content-section mg-v2-content-section--plain ${className}`.trim()}>
        {content}
      </section>
    );
  }
  return (
    <section className={`mg-v2-content-section mg-v2-content-section--card ${className}`.trim()}>
      {content}
    </section>
  );
};
```

**Props**:
- `title`: 섹션 제목 (선택 사항)
- `subtitle`: 섹션 설명 (선택 사항)
- `actions`: 우측 액션 버튼 (선택 사항)
- `children`: 섹션 내용
- `noCard`: true면 카드 스타일 없이 plain 모드 (배경·테두리 없음)

**사용 예시**:
```jsx
{/* 카드 스타일 있는 섹션 */}
<ContentSection title="통계" subtitle="주요 지표">
  <div className="stats-grid">...</div>
</ContentSection>

{/* 카드 스타일 없는 섹션 (검색·필터 등) */}
<ContentSection noCard={true}>
  <div className="client-list-controls">...</div>
</ContentSection>
```

---

## 3. 수정 작업 상세

### 3.1 Import 추가

**파일**: `frontend/src/components/consultant/ConsultantClientList.js`

```javascript
// 기존 import
import AdminCommonLayout from '../layout/AdminCommonLayout';

// 추가 import
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
```

### 3.2 JSX 구조 수정

#### Before (현재 - 잘못됨)

```jsx
<AdminCommonLayout title="내담자 목록">
  <div className="consultant-client-list-container">
    <div className="client-list-header">
      <h1 className="client-list-title">
        <Users size={24} />
        내담자 목록 {clients.length > 0 && `(${clients.length}명)`}
      </h1>
      <p className="client-list-subtitle">
        나와 연계된 내담자들을 조회할 수 있습니다. (읽기 전용)
      </p>
      <div className="mg-v2-alert mg-v2-alert--info">
        <Info size={20} />
        내담자 생성, 수정, 삭제는 관리자와 스태프만 가능합니다.
      </div>
    </div>

    <div className="client-list-controls">
      {/* 검색·필터 */}
    </div>

    {loading && <UnifiedLoading ... />}
    {error && <div className="client-list-error-state">...</div>}
    {!loading && !error && (
      <div className="client-list-content">
        {filteredClients.length === 0 ? (
          <div className="client-list-empty-state">...</div>
        ) : (
          <div className="client-card-grid">...</div>
        )}
      </div>
    )}
  </div>
</AdminCommonLayout>
```

#### After (올바른 구조)

```jsx
<AdminCommonLayout title="내담자 목록">
  <ContentArea>
    {/* 페이지 헤더 */}
    <ContentHeader
      title="내담자 목록"
      subtitle="나와 연계된 내담자들을 조회할 수 있습니다."
    />
    
    {/* 안내 배너 */}
    <div className="mg-v2-alert mg-v2-alert--info">
      <Info size={20} />
      내담자 생성, 수정, 삭제는 관리자와 스태프만 가능합니다.
    </div>

    {/* 검색·필터 영역 */}
    <ContentSection noCard={true}>
      <div className="client-list-controls">
        <div className="client-search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="client-search-input"
            placeholder="이름, 이메일, 전화번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="client-filter-badges">
          {FILTER_CONFIG.map(filter => (
            <FilterBadge
              key={filter.value}
              label={filter.label}
              value={filter.value}
              count={statusCounts[filter.value] || 0}
              icon={filter.icon}
              isActive={filterStatus === filter.value}
              onClick={handleFilterClick}
              activeColor={filter.activeColor}
            />
          ))}
        </div>
      </div>
    </ContentSection>

    {/* 카드 그리드 영역 */}
    <ContentSection noCard={true}>
      {loading && (
        <UnifiedLoading type="inline" text="내담자 목록을 불러오는 중..." />
      )}

      {error && (
        <div className="client-list-error-state">
          <AlertTriangle size={48} />
          <div className="client-list-error-state__message">{error}</div>
          <button className="mg-v2-client-view-btn" onClick={loadClients}>
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && (
        filteredClients.length === 0 ? (
          <div 
            role="status" 
            aria-live="polite" 
            className="client-list-empty-state"
          >
            <Users size={64} />
            <h3 className="client-list-empty-state__title">
              {clients.length === 0
                ? '연계된 내담자가 없습니다'
                : `${FILTER_CONFIG.find(f => f.value === filterStatus)?.label || filterStatus} 상태의 내담자가 없습니다`
              }
            </h3>
            <p className="client-list-empty-state__description">
              {clients.length === 0
                ? '아직 나와 연계된 내담자가 없습니다.'
                : '다른 상태를 선택하거나 검색어를 변경해보세요.'
              }
            </p>
            {clients.length > 0 && (
              <button
                className="mg-v2-client-view-btn"
                onClick={() => setFilterStatus('ALL')}
              >
                전체 상태 보기
              </button>
            )}
          </div>
        ) : (
          <div className="client-card-grid">
            {filteredClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onViewDetails={handleViewClient}
              />
            ))}
          </div>
        )
      )}
    </ContentSection>
  </ContentArea>
</AdminCommonLayout>
```

### 3.3 CSS 수정

**파일**: `frontend/src/components/consultant/ConsultantClientList.css`

#### 제거할 스타일

```css
/* ❌ 제거: 전체 컨테이너 */
.consultant-client-list-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
  background: var(--mg-color-background-main, #FAF9F7);
}

/* ❌ 제거: 페이지 헤더 */
.client-list-header {
  padding-bottom: 24px;
}

.client-list-title {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: var(--mg-color-text-main, #2C2C2C);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.client-list-title svg {
  width: 24px;
  height: 24px;
  color: var(--mg-color-primary-main, #3D5246);
}

.client-list-subtitle {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--mg-color-text-secondary, #5C6B61);
  margin-bottom: 16px;
}
```

#### 수정할 스타일

```css
/* 🔧 수정: margin-bottom 제거 */
.client-list-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* margin-bottom: 24px; */ /* ← 제거 (ContentSection이 처리) */
}
```

#### 유지할 스타일

```css
/* ✅ 유지: 안내 배너 */
.mg-v2-alert { ... }
.mg-v2-alert--info { ... }

/* ✅ 유지: 검색·필터 */
.client-list-controls { ... }
.client-search-input-wrapper { ... }
.client-search-input { ... }
.client-filter-badges { ... }
.mg-v2-filter-badge { ... }

/* ✅ 유지: 카드 그리드 */
.client-card-grid { ... }

/* ✅ 유지: 내담자 카드 */
.mg-v2-client-card { ... }

/* ✅ 유지: 회기 현황 */
.mg-v2-client-session-info { ... }

/* ✅ 유지: 빈 상태·에러 상태 */
.client-list-empty-state { ... }
.client-list-error-state { ... }

/* ✅ 유지: 반응형 */
@media (max-width: 767px) { ... }
```

---

## 4. 수정 체크리스트

### 4.1 필수 수정 사항

- [ ] `ContentArea`, `ContentHeader`, `ContentSection` import 추가
- [ ] `<div className="consultant-client-list-container">` 제거
- [ ] `<div className="client-list-header">` → `<ContentHeader>` 컴포넌트로 교체
- [ ] 안내 배너를 ContentArea 직속 자식으로 이동
- [ ] 검색·필터 영역을 `<ContentSection noCard={true}>` 내부로 이동
- [ ] 카드 그리드 영역을 `<ContentSection noCard={true}>` 내부로 이동
- [ ] CSS에서 `.consultant-client-list-container` 스타일 제거
- [ ] CSS에서 `.client-list-header`, `.client-list-title`, `.client-list-subtitle` 제거
- [ ] CSS에서 `.client-list-controls` margin-bottom 제거

### 4.2 검증 사항

- [ ] AdminDashboardV2와 동일한 레이아웃 구조
- [ ] 대시보드와 일관된 네비게이션 경험
- [ ] 일관된 시각적 계층 (헤더 → 섹션 → 카드)
- [ ] 반응형 레이아웃 정상 작동 (모바일~데스크톱)
- [ ] 스크롤 동작 정상 (mg-v2-desktop-layout__main overflow-y: auto)

---

## 5. 참조 코드 — AdminDashboardV2 패턴

**파일**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js` (712-726행)

```jsx
const mainContent = (
  <ContentArea>
    <ContentHeader 
      title="대시보드 개요" 
      subtitle="오늘의 주요 지표와 현황을 한눈에 확인하세요." 
    />

    <ContentKpiRow items={kpiItems} />

    <ContentCard>
      <CoreFlowPipeline stats={{...}} />
    </ContentCard>

    {/* 추가 섹션들... */}
  </ContentArea>
);

return (
  <div className="mg-v2-ad-b0kla mg-v2-ad-dashboard-v2">
    {isDesktop ? (
      <DesktopLayout {...layoutProps}>{mainContent}</DesktopLayout>
    ) : (
      <MobileLayout {...layoutProps}>{mainContent}</MobileLayout>
    )}
  </div>
);
```

**참고**: 
- AdminDashboardV2는 `DesktopLayout`/`MobileLayout`을 직접 사용
- AdminCommonLayout은 이를 추상화한 래퍼이므로, 내부에서는 **ContentArea만** 사용하면 됨

---

## 6. 구현 우선순위

### 6.1 Phase 1: 레이아웃 구조 수정 (최우선)

1. Import 추가
2. JSX 구조 수정 (consultant-client-list-container 제거, ContentArea 패턴 적용)
3. CSS 정리 (비표준 스타일 제거)

**목표**: AdminDashboardV2와 동일한 레이아웃 구조

### 6.2 Phase 2: 컴포넌트 확인 (선택)

- FilterBadge, ClientCard, ClientSessionInfo 컴포넌트 존재 여부 확인
- 이미 존재하므로 재사용

### 6.3 Phase 3: 디자인 검증

- 어드민 대시보드 샘플과 비주얼 일관성 확인
- 대시보드와 네비게이션 경험 일관성 확인

---

## 7. 예상 결과

### 7.1 레이아웃 일관성

#### Before (현재 - 잘못됨)

```
AdminCommonLayout
└── consultant-client-list-container (비표준)
    ├── client-list-header (커스텀)
    │   ├── client-list-title (커스텀)
    │   ├── client-list-subtitle (커스텀)
    │   └── mg-v2-alert
    ├── client-list-controls
    └── client-list-content
        └── client-card-grid
```

**문제**:
- ❌ 비표준 래퍼 (`consultant-client-list-container`)
- ❌ 커스텀 헤더 클래스 (ContentHeader 미사용)
- ❌ ContentArea 패턴 미적용
- ❌ 대시보드와 구조 불일치

#### After (올바른 구조)

```
AdminCommonLayout
└── ContentArea (표준)
    ├── ContentHeader (표준)
    ├── mg-v2-alert (표준)
    ├── ContentSection (noCard)
    │   └── client-list-controls
    └── ContentSection (noCard)
        └── client-card-grid
```

**개선**:
- ✅ ContentArea 패턴 적용
- ✅ ContentHeader 컴포넌트 사용
- ✅ ContentSection으로 영역 구분
- ✅ AdminDashboardV2와 동일한 구조
- ✅ mg-v2-* 표준 클래스

### 7.2 사용자 경험

#### Before

- ❌ 대시보드와 다른 레이아웃
- ❌ 일관성 없는 네비게이션
- ❌ 비표준 시각적 계층

#### After

- ✅ 대시보드와 동일한 레이아웃
- ✅ 일관된 네비게이션 경험
- ✅ 명확한 시각적 계층 (헤더 → 섹션 → 카드)
- ✅ 반응형 레이아웃 일관성

### 7.3 시각적 비교

#### Before (현재)

```
┌─────────────────────────────────────────────────────────────┐
│ [GNB]                                                        │
├──────────┬──────────────────────────────────────────────────┤
│          │ ┌────────────────────────────────────────────┐   │
│          │ │ consultant-client-list-container (비표준)   │   │
│  [LNB]   │ │ ┌────────────────────────────────────────┐ │   │
│          │ │ │ client-list-header (커스텀)             │ │   │
│  260px   │ │ │ - client-list-title                    │ │   │
│          │ │ │ - client-list-subtitle                 │ │   │
│          │ │ │ - mg-v2-alert                          │ │   │
│          │ │ └────────────────────────────────────────┘ │   │
│          │ │ ┌────────────────────────────────────────┐ │   │
│          │ │ │ client-list-controls                   │ │   │
│          │ │ └────────────────────────────────────────┘ │   │
│          │ │ ┌────────────────────────────────────────┐ │   │
│          │ │ │ client-card-grid                       │ │   │
│          │ │ └────────────────────────────────────────┘ │   │
│          │ └────────────────────────────────────────────┘   │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

#### After (올바른 구조)

```
┌─────────────────────────────────────────────────────────────┐
│ [GNB] (DesktopGnb)                                           │
├──────────┬──────────────────────────────────────────────────┤
│          │ mg-v2-desktop-layout__main (padding: 24px)       │
│          │ ┌────────────────────────────────────────────┐   │
│          │ │ ContentArea (표준)                         │   │
│  [LNB]   │ │ ┌────────────────────────────────────────┐ │   │
│          │ │ │ ContentHeader (표준)                   │ │   │
│  260px   │ │ │ - title: "내담자 목록"                  │ │   │
│          │ │ │ - subtitle: "나와 연계된..."            │ │   │
│          │ │ └────────────────────────────────────────┘ │   │
│          │ │ ┌────────────────────────────────────────┐ │   │
│          │ │ │ mg-v2-alert--info                      │ │   │
│          │ │ └────────────────────────────────────────┘ │   │
│          │ │ ┌────────────────────────────────────────┐ │   │
│          │ │ │ ContentSection (noCard)                │ │   │
│          │ │ │ └─ client-list-controls                │ │   │
│          │ │ └────────────────────────────────────────┘ │   │
│          │ │ ┌────────────────────────────────────────┐ │   │
│          │ │ │ ContentSection (noCard)                │ │   │
│          │ │ │ └─ client-card-grid                    │ │   │
│          │ │ └────────────────────────────────────────┘ │   │
│          │ └────────────────────────────────────────────┘   │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**차이점**:
1. ✅ 비표준 래퍼 제거 (`consultant-client-list-container`)
2. ✅ ContentArea 패턴 적용
3. ✅ ContentHeader 컴포넌트 사용 (커스텀 헤더 제거)
4. ✅ ContentSection으로 영역 명확히 구분
5. ✅ AdminDashboardV2와 동일한 계층 구조

---

## 8. 참조 문서

- `docs/design-system/v2/CONSULTANT_CLIENT_LIST_REDESIGN_SPEC.md` — 전체 설계 스펙
- `docs/design-system/PENCIL_DESIGN_GUIDE.md` — 펜슬 디자인 가이드
- `docs/standards/RESPONSIVE_LAYOUT_SPEC.md` — 반응형 레이아웃 상세
- `frontend/src/components/dashboard-v2/AdminDashboardV2.js` — 참조 패턴
- `frontend/src/components/dashboard-v2/content/` — ContentArea, ContentHeader, ContentSection 컴포넌트

---

**설계 완료일**: 2026-03-09  
**설계자**: core-designer  
**다음 단계**: core-coder에게 전달 → 레이아웃 구조 수정 착수
