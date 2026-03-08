# 내담자 목록 페이지 레이아웃 수정 — core-coder 핸드오프

**작성일**: 2026-03-09  
**담당**: core-designer → core-coder  
**우선순위**: 🔴 HIGH  
**작업 시간**: 약 30분 (레이아웃 구조 수정만)

---

## 작업 개요

**목표**: `ConsultantClientList.js`의 레이아웃 구조를 AdminDashboardV2 패턴으로 수정하여 디자인 시스템과 일관성 확보

**범위**: 
- ✅ 레이아웃 구조 수정 (JSX)
- ✅ CSS 정리 (비표준 스타일 제거)
- ❌ 비즈니스 로직 변경 없음
- ❌ 새 컴포넌트 생성 없음 (FilterBadge, ClientCard 이미 존재)

---

## Step 1: Import 추가

**파일**: `frontend/src/components/consultant/ConsultantClientList.js`

**위치**: 기존 import 섹션 (5-12행)

**추가**:
```javascript
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
```

**결과**:
```javascript
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../utils/ajax';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ClientDetailModal from './ClientDetailModal';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import { Users, Info, Search, AlertTriangle, List, CheckCircle, XCircle, Clock, CheckCircle2, PauseCircle } from 'lucide-react';
import FilterBadge from './molecules/FilterBadge';
import ClientCard from './molecules/ClientCard';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content'; // ← 추가
import './ConsultantClientList.css';
```

---

## Step 2: JSX 구조 수정

**파일**: `frontend/src/components/consultant/ConsultantClientList.js`

**위치**: return 문 (227-340행)

### 2.1 현재 구조 (227-340행)

```jsx
return (
  <AdminCommonLayout title="내담자 목록">
    <div className="consultant-client-list-container"> {/* ❌ 제거 */}
      <div className="client-list-header"> {/* ❌ 제거 */}
        <h1 className="client-list-title"> {/* ❌ ContentHeader로 교체 */}
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
);
```

### 2.2 수정 후 구조

```jsx
return (
  <AdminCommonLayout title="내담자 목록">
    <ContentArea> {/* ✅ 추가 */}
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
);
```

---

## Step 3: CSS 정리

**파일**: `frontend/src/components/consultant/ConsultantClientList.css`

### 3.1 제거할 스타일 (9-45행)

```css
/* ❌ 제거 */
.consultant-client-list-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
  background: var(--mg-color-background-main, #FAF9F7);
}

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

### 3.2 수정할 스타일 (71-76행)

```css
/* 🔧 수정: margin-bottom 제거 */
.client-list-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* margin-bottom: 24px; */ /* ← 이 줄 제거 */
}
```

### 3.3 모바일 반응형 수정 (496-499행)

```css
/* 🔧 수정: 제거 */
@media (max-width: 767px) {
  /* .consultant-client-list-container {
    padding: 16px;
  } */ /* ← 이 블록 제거 */
  
  .client-list-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  /* ... 나머지 유지 ... */
}
```

---

## Step 4: 검증

### 4.1 코드 검증

- [ ] `ContentArea`, `ContentHeader`, `ContentSection` import 확인
- [ ] `consultant-client-list-container` div 제거 확인
- [ ] `client-list-header` div 제거 확인
- [ ] `ContentHeader` 컴포넌트 사용 확인
- [ ] `ContentSection` 2개 사용 확인 (검색·필터, 카드 그리드)
- [ ] CSS에서 비표준 스타일 제거 확인

### 4.2 시각적 검증

- [ ] 브라우저에서 페이지 로드 확인
- [ ] 대시보드와 동일한 레이아웃 구조 확인
- [ ] 헤더·섹션 간격 일관성 확인
- [ ] 반응형 레이아웃 정상 작동 확인 (모바일~데스크톱)
- [ ] 스크롤 동작 정상 확인

### 4.3 기능 검증

- [ ] 검색 기능 정상 작동
- [ ] 필터 배지 클릭 정상 작동
- [ ] 카드 클릭 → 상세보기 모달 정상 작동
- [ ] 빈 상태·에러 상태 정상 표시

---

## 참조 코드

### AdminDashboardV2 패턴 (참조)

**파일**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js` (711-726행)

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

**참고**: AdminCommonLayout은 DesktopLayout/MobileLayout을 추상화한 래퍼이므로, 내부에서는 ContentArea만 사용하면 됩니다.

---

## 작업 체크리스트

### Phase 1: 레이아웃 구조 수정

- [ ] **Step 1**: Import 추가 (`ContentArea`, `ContentHeader`, `ContentSection`)
- [ ] **Step 2**: `consultant-client-list-container` div 제거
- [ ] **Step 3**: `ContentArea` 컴포넌트로 전체 래핑
- [ ] **Step 4**: `client-list-header` → `ContentHeader` 컴포넌트로 교체
- [ ] **Step 5**: 안내 배너를 ContentArea 직속 자식으로 배치
- [ ] **Step 6**: 검색·필터를 `ContentSection(noCard)` 내부로 이동
- [ ] **Step 7**: 카드 그리드를 `ContentSection(noCard)` 내부로 이동

### Phase 2: CSS 정리

- [ ] **Step 8**: `.consultant-client-list-container` 스타일 제거
- [ ] **Step 9**: `.client-list-header` 스타일 제거
- [ ] **Step 10**: `.client-list-title`, `.client-list-subtitle` 스타일 제거
- [ ] **Step 11**: `.client-list-controls` margin-bottom 제거
- [ ] **Step 12**: 모바일 반응형에서 `.consultant-client-list-container` 패딩 제거

### Phase 3: 검증

- [ ] **Step 13**: 브라우저에서 시각적 확인
- [ ] **Step 14**: AdminDashboardV2와 레이아웃 일치 확인
- [ ] **Step 15**: 반응형 레이아웃 확인 (모바일~데스크톱)
- [ ] **Step 16**: 기능 정상 작동 확인 (검색·필터·카드 클릭)

---

## 예상 결과

### Before (현재)

```
AdminCommonLayout
└── consultant-client-list-container (비표준, 패딩 24px)
    ├── client-list-header (커스텀)
    │   ├── client-list-title (커스텀)
    │   ├── client-list-subtitle (커스텀)
    │   └── mg-v2-alert
    ├── client-list-controls
    └── client-list-content
        └── client-card-grid
```

### After (수정 후)

```
AdminCommonLayout
└── ContentArea (표준, 패딩 없음)
    ├── ContentHeader (표준, title·subtitle props)
    ├── mg-v2-alert (표준)
    ├── ContentSection (noCard, 검색·필터)
    │   └── client-list-controls
    └── ContentSection (noCard, 카드 그리드)
        └── client-card-grid
```

**개선점**:
- ✅ 비표준 래퍼 제거
- ✅ ContentArea 패턴 적용
- ✅ AdminDashboardV2와 동일한 구조
- ✅ 일관된 시각적 계층

---

## 참조 문서

| 문서 | 용도 |
|------|------|
| **본 문서** | core-coder 핸드오프 (단계별 가이드) |
| CONSULTANT_CLIENT_LIST_LAYOUT_FIX.md | 상세 구현 가이드 (Before/After 비교) |
| CONSULTANT_CLIENT_LIST_LAYOUT_SUMMARY.md | 요약 (핵심 문제·해결 방안) |
| CONSULTANT_CLIENT_LIST_REDESIGN_SPEC.md | 전체 설계 스펙 |
| AdminDashboardV2.js | 참조 패턴 (712-726행) |
| dashboard-v2/content/ | ContentArea, ContentHeader, ContentSection 컴포넌트 |

---

## 주의사항

### 할 일

✅ **레이아웃 구조 수정**: ContentArea 패턴 적용
✅ **CSS 정리**: 비표준 스타일 제거
✅ **Import 추가**: dashboard-v2/content 컴포넌트

### 하지 말 것

❌ **비즈니스 로직 변경**: state·hooks·API 호출 로직 수정 금지
❌ **새 컴포넌트 생성**: FilterBadge, ClientCard 이미 존재
❌ **디자인 변경**: 색상·간격·폰트 등 비주얼 요소 변경 금지
❌ **기능 추가**: 새 기능 추가 금지 (레이아웃 수정만)

---

**설계 완료일**: 2026-03-09  
**설계자**: core-designer  
**다음 단계**: core-coder 작업 착수
