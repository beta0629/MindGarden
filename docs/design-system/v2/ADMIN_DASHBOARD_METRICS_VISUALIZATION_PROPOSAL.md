# 관리자 대시보드 지표 시각화 컴포넌트 제안

**목적**: CoreFlowPipeline + ContentCard 조합의 현재 구조·stats 주입 방식을 요약하고, 새 "관리자 대시보드 지표 시각화" 컴포넌트 도입 시 구조·props·API 연동 포인트를 제안한다. (실제 코드 작성 없음, 제안만)

---

## 1. 현재 구조 요약

### 1.1 사용 파일 경로

| 구분 | 경로 |
|------|------|
| **CoreFlowPipeline** | `frontend/src/components/admin/AdminDashboard/organisms/CoreFlowPipeline.js` |
| **ContentCard** | `frontend/src/components/dashboard-v2/content/ContentCard.js` |
| **DashboardStats** | `frontend/src/components/admin/components/DashboardStats.js` |
| **페이지(부모)** | `frontend/src/components/admin/AdminDashboard.js`, `frontend/src/components/dashboard-v2/AdminDashboardV2.js` |

- **ContentCard**: B0KlA 카드 래퍼. `children`, `className`만 받고 시맨틱/스타일만 적용.
- **CoreFlowPipeline**: Organism. `steps`(선택) + `stats`(선택) 받아 5단계 파이프라인 렌더. `steps` 없으면 `buildDefaultSteps(stats)`로 기본 5단계 생성.

### 1.2 stats·pendingDepositStats 주입 방식

- **데이터 소유·fetch**: **페이지(AdminDashboard / AdminDashboardV2)** 에서만 수행.
  - `stats`: `useState` 초기값 객체 → `loadStats()` 내부에서 여러 API 병렬 호출 후 `setStats(...)`.
  - `pendingDepositStats`: `useState` 초기값 객체 → `loadPendingDepositStats()`에서 단일 API 호출 후 `setPendingDepositStats(...)`.
  - `refundStats`: `loadRefundStats()`로 별도 fetch 후 `setRefundStats(...)`.
- **호출 시점**: `useEffect`에서 `loadStats()`, `loadRefundStats()`, `loadPendingDepositStats()`를 한 번에 호출. 매칭 확정·자동완료·중복 통합 등 액션 후에도 `loadStats()` 또는 위 세 함수 재호출로 갱신.
- **자식으로 전달**:
  - **CoreFlowPipeline**: `stats={{ totalMappings, pendingDepositCount, activeMappings, schedulePendingCount }}` 형태로 **객체 한 번에** props 전달.  
    `pendingDepositCount`는 부모가 `pendingDepositStats.count`로 매핑해 넘김.  
    `schedulePendingCount`는 현재 **0 하드코딩** (전용 API 미연동).
  - **DashboardStats**: `stats`, `refundStats`, `pendingDepositStats`를 **그대로** props로 전달.  
    DashboardStats 내부에서 고정된 6개 카드(총 상담사, 총 고객, 총 매핑, 활성 매칭, 환불 건수, 대기 입금)로 변환해 StatCard에 전달.

**정리**: 지표 데이터는 **부모 페이지에서만 fetch**하고, **props로만** CoreFlowPipeline·DashboardStats에 주입된다. 지표 컴포넌트는 자체 API 호출 없음.

### 1.3 관련 API (현재 Admin 대시보드에서 사용)

| 용도 | 호출 위치 | 엔드포인트(예) |
|------|-----------|----------------|
| stats (상담사/내담자/매칭 등) | `loadStats()` | `GET /api/v1/admin/consultants/with-vacation`, `GET /api/v1/admin/clients/with-mapping-info`, `GET /api/v1/admin/mappings`, `GET /api/v1/admin/consultant-rating-stats`, `GET /api/v1/admin/vacation-statistics`, `GET /api/v1/admin/statistics/consultation-completion` |
| pendingDepositStats | `loadPendingDepositStats()` | `GET /api/v1/admin/mappings/pending-deposit` (StandardizedApi) |
| refundStats | `loadRefundStats()` | `GET /api/v1/admin/refund-statistics?period=month` |
| todayStats | `loadTodayStats()` | `GET /api/v1/schedules/today/statistics?userRole=...` |

---

## 2. 신규 “관리자 대시보드 지표 시각화” 컴포넌트 제안

아토믹 디자인(core-solution-atomic-design) 및 프론트엔드 스킬(core-solution-frontend) 기준 제안.

### 2.1 (A) 컴포넌트 계층 구조

- **Atoms**
  - **MetricValue**: 숫자·단위 표시 (value + unit). 트렌드 미표시.
  - **MetricLabel**: 라벨 텍스트.
  - (선택) **TrendBadge**: trend 방향(up/down/neutral) + 값 표시용 작은 배지.  
  - 공통 UI는 `common/` 사용 원칙에 따라, 가능하면 기존 **StatusBadge**·**ActionButton** 등과 역할이 겹치지 않도록 “지표 전용”으로만 한정.

- **Molecules**
  - **MetricCard**: 한 개 지표용 카드.  
    조합: MetricLabel + MetricValue + (선택) TrendBadge.  
    디자인 토큰·카드 스타일은 `mg-v2-*`, ContentCard/카드 스펙과 통일.
  - (선택) **MetricCardSkeleton**: 로딩 시 MetricCard와 동일한 레이아웃의 스켈레톤.

- **Organisms**
  - **AdminMetricsVisualization**: 지표 시각화 섹션 전체.
    - **입력**: 지표 배열(아래 props), loading, error.
    - **역할**: 지표 배열을 그리드로 배치하고, 각 항목을 MetricCard로 렌더. loading이면 MetricCardSkeleton 또는 UnifiedLoading 표시, error면 에러 메시지 표시.
    - **레이아웃**: `mg-v2-*` 그리드/카드 레이아웃 사용. 반응형은 기존 대시보드 그리드와 동일한 토큰 사용 권장.

- **페이지 연동**
  - AdminDashboard / AdminDashboardV2에서 **데이터는 기존처럼 부모가 fetch**하고, **지표 배열을 가공해 AdminMetricsVisualization에 props로 전달**하는 방식 유지 (지표 컴포넌트는 API 호출하지 않음).

### 2.2 (B) props 설계

- **AdminMetricsVisualization (Organism)**

  - **metrics** `Array<MetricItem>` (필수)  
    - **MetricItem**:  
      - `id`: string (키·접근성)  
      - `label`: string  
      - `value`: number | string (표시값)  
      - `unit?`: string (예: `'건'`, `'명'`, `'%'`, `'원'`)  
      - `trend?`: `{ direction: 'up' | 'down' | 'neutral', value?: number | string }` (선택)
  - **loading** `boolean` (선택, 기본 false): true면 스켈레톤 또는 UnifiedLoading 표시.
  - **error** `string | null` (선택): 있으면 에러 메시지 영역 표시.
  - **className** (선택): 래퍼 추가 클래스.
  - (선택) **onMetricClick** `(metric: MetricItem) => void`: 카드 클릭 시 콜백 (기존 StatCard의 onClick 패턴과 동일).

  제안용 타입/스키마 예:

  ```ts
  // 제안용 스키마 (구현 시 constants/types 등으로 정의)
  interface MetricItem {
    id: string;
    label: string;
    value: number | string;
    unit?: string;
    trend?: { direction: 'up' | 'down' | 'neutral'; value?: number | string };
  }
  ```

  부모에서 넘길 배열 예 (기존 stats/pendingDepositStats 매핑):

  ```js
  const metrics = [
    { id: 'consultants', label: '총 상담사', value: stats.totalConsultants ?? 0, unit: '명' },
    { id: 'clients', label: '총 고객', value: stats.totalClients ?? 0, unit: '명' },
    { id: 'mappings', label: '총 매핑', value: stats.totalMappings ?? 0, unit: '건' },
    { id: 'activeMappings', label: '활성 매칭', value: stats.activeMappings ?? 0, unit: '건' },
    { id: 'pendingDeposit', label: '대기 입금', value: pendingDepositStats.count ?? 0, unit: '건', trend: pendingDepositStats.oldestHours != null ? { direction: pendingDepositStats.oldestHours > 24 ? 'down' : 'neutral', value: `${pendingDepositStats.oldestHours}h` } : undefined },
    // ...
  ];
  ```

- **MetricCard (Molecule)**  
  - **metric** `MetricItem`, **loading?** `boolean`, (선택) **onClick** 콜백.  
  - 내부에서 MetricLabel, MetricValue, TrendBadge(있을 때만) 조합.

- **Atoms (MetricValue, MetricLabel, TrendBadge)**  
  - 표시 전용. 필요한 최소 props만 (value, unit, label, trend 등). 스타일은 `mg-v2-*` 토큰만 사용.

### 2.3 (C) 기존 Admin 대시보드 API 연동 포인트

- **데이터 소스**: 지표 배열을 채우는 값은 **현재와 동일하게** 다음 API에서 가져오면 됨.
  - **loadStats()** 결과: `totalConsultants`, `totalClients`, `totalMappings`, `activeMappings`, `consultationStats`, `vacationStats`, `consultantRatingStats` 등 → 메인 지표 카드용.
  - **loadPendingDepositStats()** 결과: `count`, `totalAmount`, `oldestHours` → “대기 입금” 지표 및 trend.
  - **loadRefundStats()** 결과: `totalRefundCount`, `averageRefundPerCase` 등 → “환불 건수” 등.
  - **loadTodayStats()** 결과: `totalToday`, `completedToday` 등 → “오늘 예약/완료” 등 (필요 시).

- **연동 방식**  
  - **변경 없음**: 페이지에서 위 load* 함수들로 fetch 후 state에 보관.  
  - **신규 컴포넌트**: 이 state를 바탕으로 **metrics 배열을 구성**해 `AdminMetricsVisualization`에 `metrics={...}`, `loading={...}`, `error={...}` 로 전달.  
  - **CoreFlowPipeline**은 계속 `stats` 객체를 그대로 받되, 필요하면 동일 state에서 나온 값을 그대로 넘기면 됨 (이미 `pendingDepositStats.count` → `pendingDepositCount` 매핑 사용 중).

- **schedulePendingCount**  
  - 현재 AdminDashboard/AdminDashboardV2에서 `schedulePendingCount: 0` 하드코딩.  
  - 지표 시각화에 “스케줄 등록 대기”를 넣을 경우, 추후 **스케줄 대기 건수 전용 API**가 생기면 해당 API를 부모의 load* 중 하나에서 호출하고, 그 결과를 `metrics`와 CoreFlowPipeline의 `stats.schedulePendingCount`에 반영하면 됨.

### 2.4 정리

- **현재**: CoreFlowPipeline + ContentCard는 “부모가 fetch → stats 객체로 주입” 구조. DashboardStats도 동일하게 stats/refundStats/pendingDepositStats를 부모에서 받음.
- **제안**: 재사용 가능한 “지표 시각화”는 **지표 배열 + loading + error**를 받는 Organism(AdminMetricsVisualization)과 MetricCard/MetricValue 등 하위 계층으로 분리.  
  **API 연동은 기존처럼 페이지에만 두고**, 동일한 loadStats/loadPendingDepositStats/loadRefundStats 등 결과로 metrics 배열을 만들어 전달하면 됨.  
  실제 구현 시 core-solution-atomic-design·core-solution-frontend·디자인 토큰(mg-v2-*)을 준수하고, 공통 컴포넌트(common/)는 규칙에 맞게 사용하면 된다.
