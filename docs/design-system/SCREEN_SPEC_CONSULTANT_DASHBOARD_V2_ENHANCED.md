# 상담사 대시보드 V2 개선 UI/UX 스펙 (Design Freeze)

## 1. 개요 및 배경
본 스펙은 상담사 대시보드의 V2 개선안을 정의합니다. Web과 App 환경에서 동일한 데이터를 제공하되, 각 플랫폼의 특성에 맞는 레이아웃(Web LNB vs App AppShell)을 적용합니다. B0KlA 어드민 대시보드 샘플, G-14 ContentHeader, KPI 4-grid 등의 기존 디자인 시스템을 준수하며, Web과 App 간의 크로스 링크를 엄격히 금지합니다.

**API·기능 SSOT (explore 21c0fb39)**: Web `ConsultantDashboardV2` + `ScheduleController` Phase1 API가 단일 진실 공급원이며, Expo·Renewal은 동일 BE 계약을 공유하되 UI는 플랫폼별 독립 구현한다.

## 2. 레이아웃 구조

### 2.1 Web `/consultant/dashboard` (LNB 기반)
- **전체 구조**: 좌측 고정 사이드바(260px) + 우측 메인 영역
- **배경**: `var(--mg-color-background-base)` (#FAF9F7)
- **상단 바**: `ContentHeader` (G-14 스펙 적용, 브레드크럼 + 제목 + 액션)
- **본문 영역**: 패딩 `var(--mg-spacing-24)` ~ `var(--mg-spacing-32)`
- **섹션 블록**: 각 콘텐츠는 독립된 블록으로 감싸며, 배경 `var(--mg-color-surface-base)`, 테두리 `1px solid var(--mg-color-border-light)`, `border-radius: var(--mg-radius-16)` 적용. 좌측 악센트 바(4px, `var(--mg-color-primary-main)`) 사용.

### 2.2 App `(consultant)/` (AppShell 기반)
- **전체 구조**: 하단 바텀 탭(Bottom Tab) 기반의 AppShell 레이아웃
- **배경**: `var(--mg-color-background-base)`
- **상단 바**: 모바일 네비게이션 헤더 (제목 중앙 정렬, 우측 알림 아이콘)
- **본문 영역**: 세로 스크롤, 패딩 `var(--mg-spacing-16)`
- **카드 밀도**: 모바일 화면에 맞춰 패딩 축소(`var(--mg-spacing-16)`), 요소 간 간격 `var(--mg-spacing-12)`. 좌측 악센트 바는 유지하되 굵기 3px로 조정.
- **주의**: Web LNB와 App AppShell 간의 크로스 링크 및 컴포넌트 공유 절대 금지.

## 3. 세부 UI/UX 스펙 (섹션별 와이어프레임)

### 3.1 KPI 4-grid
- **Web**: 상단 가로 4열(`grid-template-columns: repeat(4, 1fr)`) 또는 2x2 그리드.
- **App**: 2x2 그리드(`grid-template-columns: repeat(2, 1fr)`).
- **디자인**: 숫자 강조(24px, 600, `var(--mg-color-text-primary)`), 라벨(12px, `var(--mg-color-text-secondary)`).

### 3.2 오늘/다가오는 일정 (ListTableView)
- **컴포넌트**: `ListTableView` 재사용.
- **항목**: 시간, 내담자명, 상담 종류, 상태 뱃지.
- **액션**: 행 클릭 시 상세 페이지 이동.

### 3.3 긴급 내담자 (ListTableView)
- **디자인**: 경고/긴급 상태를 나타내는 뱃지(`var(--mg-color-error-main)`) 포함.
- **항목**: 내담자명, 최근 상담일, 위험도 표시.

### 3.4 최근 메시지 (ListTableView)
- **디자인**: 발신자 프로필 이미지, 메시지 프리뷰(1줄 말줄임표), 수신 시간.
- **상태**: 안 읽은 메시지는 텍스트 굵게(600) 및 우측에 빨간 점(Dot) 표시.

### 3.5 월간 통계 차트 (chart-empty)
- **디자인**: 막대 또는 꺾은선 차트 영역. 높이 Web 300px, App 200px.
- **빈 데이터**: 데이터가 없을 경우 `chart-empty` 컴포넌트 렌더링 (일러스트 + "이번 달 통계 데이터가 없습니다" 텍스트).

### 3.6 QuickActionBar
- **위치**: Web은 ContentHeader 우측 또는 우측 하단 플로팅. App은 화면 하단 플로팅(FAB) 또는 최상단 카드 아래 배치.
- **항목**: 일정 등록, 메시지 작성, 내담자 추가 등 주요 액션.

## 4. API 매핑

> **BE SSOT**: `frontend/src/constants/api.js` (`DASHBOARD_API`) · `ScheduleController` (Phase1) · `expo-app/src/api/endpoints.ts`  
> **금지/미구현**: `GET /api/v1/consultants/{id}/dashboard` (BE 없음) · Renewal `GET /api/v1/consultants/{id}/urgent-clients` (BE 없음 — `high-priority-clients` 사용)

### 4.1 API ↔ 화면 매트릭스 (Web V2 / Web Renewal / Expo Home / BE)

| API (BE SSOT) | 연결 섹션 | Web V2 | Web Renewal | Expo Home | BE |
|---------------|-----------|--------|-------------|-----------|-----|
| `GET /api/v1/schedules/today/statistics?userRole=CONSULTANT` | KPI 4-grid · 주간 차트 (`weeklyStats`) | ✅ | ❌ | ❌ (`todayCount`=목록 length) | ✅ |
| `GET /api/v1/schedules?userId={id}&userRole=CONSULTANT` | 오늘·어제 일정 (클라이언트 필터) | ✅ | ⚠️ 오늘만 | ⚠️ `/schedules/date/{ymd}` | ✅ |
| `GET /api/v1/schedules/upcoming` | 다가오는 7일 | ✅ | ❌ | ❌ | ✅ |
| `GET /api/v1/schedules/consultants/{id}/incomplete-records` | 미작성 일지 (`IncompleteRecordsAlert`) | ✅ | ❌ (스텁 API) | ⚠️ `usePendingRecords`(다른 API) | ✅ |
| `GET /api/v1/schedules/consultants/{id}/high-priority-clients` | 긴급 내담자 (`UrgentClientsSection`) | ✅ | ❌ (`urgent-clients` **금지**) | ❌ | ✅ |
| `GET /api/v1/schedules/consultants/{id}/upcoming-preparation` | 다음 상담 준비 (`NextConsultationCard`) | ✅ | ❌ | ❌ | ✅ |
| `GET /api/v1/consultation-messages/unread-count` | KPI 메시지 | ✅ | ❌ | ✅ KPI | ✅ |
| `GET /api/v1/ratings/consultant/{id}/stats` | KPI 평점 | ✅ | ❌ | ❌ | ✅ |
| `GET /api/v1/system-notifications/active` | 최근 알림 (3건) | ✅ | ❌ | — (TopBar dot만) | ✅ |
| `GET /api/v1/consultants/{id}/consultation-records` | — | ❌ | ⚠️ **스텁(빈 배열)** | ❌ | ⚠️ 스텁 |
| `GET /api/v1/consultants/{id}/dashboard` | — | ❌ | ❌ | ❌ (상수만) | ❌ **미구현** |

### 4.2 섹션별 Empty / Loading / Error (Web V2 SSOT)

| 섹션 | API | Empty | Loading | Error |
|------|-----|-------|---------|-------|
| KPI 4-grid | `today/statistics` + `ratings/.../stats` + `unread-count` | 숫자 `0` | `ContentKpiRow` 스켈레톤 (4칸) | `-` 표시 · tenantId 없음 시 배너 |
| 미작성 일지 | `incomplete-records` | 알림 숨김 (`count=0`) | 인라인 스피너 | 섹션 생략 · 콘솔 warn |
| 다음 상담 준비 | `upcoming-preparation` | 카드 숨김 | 카드 스켈레톤 | 카드 숨김 |
| 긴급 내담자 | `high-priority-clients` | "주의가 필요한 내담자가 없습니다" | `ListTableView` 스켈레톤 (2줄) | "데이터 로드 실패" + 재시도 |
| 오늘·어제 일정 | `schedules?userId&userRole` | "예정된 일정이 없습니다" | 리스트 스켈레톤 (3줄) | "일정을 불러오지 못했습니다" |
| 다가오는 7일 | `upcoming` | "다가오는 상담이 없습니다" | 리스트 스켈레톤 (3줄) | "일정을 불러오지 못했습니다" |
| 최근 알림 | `system-notifications/active` | "새로운 알림이 없습니다" | 리스트 스켈레톤 (3줄) | "알림 로드 실패" |
| 주간 차트 | `today/statistics` (`weeklyStats`) | `chart-empty` ("이번 달 통계 데이터가 없습니다") | 차트 영역 스켈레톤 | "통계를 불러올 수 없습니다" |

### 4.3 P0 개선 항목 (P0-1~10, defer 없음)

| # | 항목 | 대상 | 근거 |
|---|------|------|------|
| **P0-1** | Web SSOT 단일화: 로그인·LNB·딥링크를 `ConsultantDashboardV2`(`/consultant/dashboard`) freeze; Renewal deprecated 명시 | Web | 이중 트랙 · `ROLE-02` |
| **P0-2** | Renewal API 교정: `TenantAwareApiClient` → `StandardizedApi`, Phase1 API 연동; `urgent-clients` 제거 | `ConsultantDashboardRenewal.js` | BE 미존재·스텁 |
| **P0-3** | Expo Phase1 API 훅: `useConsultantHomeStats`, `useIncompleteRecords`, `useHighPriorityClients`, `useUpcomingPreparation` + `endpoints.ts` 정렬 | Expo | orchestration §5.2 |
| **P0-4** | Expo 홈 UI P1: `ConsultantNextSessionCard`, `ConsultantUrgentClientBanner`, KPI 확장, QuickAction 4~5 | `(home)/index.tsx` | `SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md` §3 |
| **P0-5** | 미작성 일지 SSOT: Expo `usePendingRecords` ↔ BE `incomplete-records` 정합 | Expo + Web | orchestration §6 |
| **P0-6** | Web V2 B0KlA Quality Gate: `ContentKpiRow`·spacing·1280px·dark cascade | `ConsultantDashboardV2.js` | `ROLE-02` DoD |
| **P0-7** | QuickActionBar 경로: `consultantDashboardRoutes` 상수 SSOT (client 대칭) | Web | 레거시 경로 혼선 |
| **P0-8** | 죽은 API 상수 정리: Expo `consultantDashboard`, Renewal `urgent-clients` 제거 | Expo + Web | phantom endpoint |
| **P0-9** | 화면설계서 SSOT: 본 ENHANCED + Phase1 v2 + Mobile Home 인덱스 freeze | docs | FULL.md 대체 |
| **P0-10** | E2E smoke: V2 KPI·Phase1 블록·tenantId 배너 + Expo 홈 KPI/refetch | QA | `ROLE-04` |

## 5. 상태·예외, 접근성(a11y), 다크 모드, Must-not

### 5.1 상태 및 예외 처리
- **Loading**: 전체 페이지 로딩 지양, 각 섹션별 스켈레톤 UI 적용.
- **Error**: 섹션 내부에 에러 메시지와 '재시도' 버튼 제공 (Graceful Degradation).

### 5.2 접근성 (a11y)
- 모든 버튼 및 링크에 `aria-label` 부여.
- 이미지 및 아이콘에 `alt` 속성(장식용은 `alt=""`) 적용.
- 키보드 네비게이션(Tab 키) 시 포커스 링(`outline: 2px solid var(--mg-color-primary-main)`) 명확히 표시.

### 5.3 다크 모드 (Dark Cascade)
- **배경**: `var(--mg-color-background-dark)` (#2C2C2C).
- **서페이스**: `var(--mg-color-surface-dark)` (#3A3A3A).
- **텍스트**: `var(--mg-color-text-dark-primary)` (#FAF9F7).
- **테두리**: `var(--mg-color-border-dark)` (#4A4A4A).
- 다크 모드 전환 시 CSS 변수(Cascade)를 통해 자동 전환되도록 설계.

### 5.4 Must-not
- 인라인 스타일(`style={{...}}`) 절대 금지.
- 하드코딩된 색상값(#hex) 및 간격(px) 사용 금지. 반드시 `var(--mg-*)` 토큰 사용.
- Web LNB 컴포넌트와 App AppShell 컴포넌트 간의 상호 참조(Cross-link) 절대 금지.
- Quality Gate WBS §1에 위배되는 비표준 레이아웃 사용 금지.

## 6. core-coder Handoff

> **착수 게이트**: 구현은 **#534 merge + develop CI green 후** — **P0-6 Web V2 먼저**, **P0-3~4 Expo 별도 PR**.

1. **Web/App 분리**: Web은 `frontend/src/components/dashboard-v2/consultant/`, App은 `expo-app/app/(consultant)/(home)/`에 각각 구현. 크로스 링크 절대 금지.
2. **Web 레이아웃**: `docs/design-system/PENCIL_DESIGN_GUIDE.md` B0KlA 샘플 기준. `var(--mg-*)` 토큰 사용, 사이드바(260px) + 메인 영역 구조.
3. **App 레이아웃**: Bottom Tab 기반 AppShell. 모바일 화면 밀도에 맞춰 카드 패딩 축소(`var(--mg-spacing-16)`), 세로 스크롤 대응.
4. **공통 컴포넌트**: `ContentHeader` (G-14), `QuickActionBar`, `ListTableView` 등 기존 공통 모듈 우선 사용.
5. **KPI 4-grid**: Web은 2x2 또는 4x1 그리드, App은 2x2 그리드.
6. **차트 영역**: 빈 데이터 시 `chart-empty` 컴포넌트 표시.
7. **상태 처리**: API 매핑 표에 정의된 Empty/Loading/Error 상태를 각 섹션별로 스켈레톤, 빈 화면 UI로 구현.
8. **다크 모드**: `dark cascade` 규칙에 따라 다크 테마 토큰 적용.
9. **접근성(a11y)**: `aria-label`, `role` 속성 필수. 키보드 네비게이션 지원.
10. **Must-not**: 인라인 스타일 금지, 하드코딩 색상/간격 금지, Web/App 간 컴포넌트 직접 참조 금지.
