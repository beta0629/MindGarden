# 상담사 대시보드 Enhanced 핸드오프 (Design Spec)

**상태**: v1.0 Enhanced — **App/Web UI 분리 · API-only Must link** · 7/13 Design Freeze  
**작성**: `core-planner`  
**트랙**: WBS `T-ROLE-C` · `ROLE-03` (Consultant Enhanced)  
**SSOT**: [`COMPREHENSIVE_IMPROVEMENT_WBS.md`](../project-management/2026-07-07/COMPREHENSIVE_IMPROVEMENT_WBS.md) · [`CONSULTANT_ENHANCED_ORCHESTRATION.md`](../project-management/2026-07-07/CONSULTANT_ENHANCED_ORCHESTRATION.md) · [`CLIENT_DASHBOARD_REBUILD_HANDOFF_v1.3.md`](./CLIENT_DASHBOARD_REBUILD_HANDOFF_v1.3.md) §1

> **[Design Freeze Sign-off (2026-07-07)]**
> - **no defer on visual**: 7/13 개편이 상담사 웹·앱 대시보드의 **마지막 시각/UX 개선 창구**입니다.
> - P2 visual 갭은 P0로 승격되어 7/13 범위 내에서 해소합니다.
> - 본 핸드오프는 **explore → designer spec → coder** 순서의 **디자이너·코더 입력 SSOT**입니다. 구현 전 `SCREEN_SPEC_CONSULTANT_DASHBOARD_ENHANCED_FULL.md`(Phase 2 산출) 필수.

---

## 1. 플랫폼 연동 정책 — UI 분리 + API 연동 허용

> **사용자 확정 (2026-07-07, DEC-02)**: 「앱과 웹은 링크 하면 안 돼 디자인 깨져」 + **「API 연동은 가능하잖어」**

### 1.1 확정 원칙

| 구분 | 허용 | 금지 |
|------|------|------|
| **UI / 네비 / 라우트** | 플랫폼별 독립 SSOT (웹 LNB vs 앱 AppShell·바텀탭) | 앱↔웹 경로 parity, 크로스 deep link, 화면 구조 강제 통합 |
| **API / 데이터** | **허용** — `StandardizedApi` / `expo-app/src/api/client.ts`, `/api/v1/*`, `tenantId`, 동일 BE·DTO | — |

### 1.2 Must-link 재정의 (UI Must link **폐기**)

| 분류 | 정의 | Consultant Dashboard 예 |
|------|------|-------------------------|
| **API-only Must link** ☑ | 동일 BE·동일 비즈니스 데이터. UI·경로는 각 플랫폼 SSOT | 오늘 스케줄·미작성 일지·unread 메시지·KPI 통계·다음 상담 준비·긴급 내담자 |
| **Web-only (UI)** | 웹 LNB·`AdminCommonLayout`·B0KlA `mg-v2-section-block`·1280/768 | ContentKpiRow 4칸·주간 차트·ListTableView compact·QuickActionBar(헤더) |
| **App-only (UI)** | Expo AppShell·`AppTopBar`·KPI 가로 ScrollView·FlashList | `CONSULTANT_HOME_ROUTES`·바텀탭 `(schedule)/(clients)/(records)/(more)` |
| ~~UI Must link~~ **폐기** | 앱 화면·경로를 웹 navigate 대상으로 매핑 | `/consultant/dashboard` ↔ `/(consultant)/(home)` deep link |

### 1.3 플랫폼 SSOT 경로

| 영역 | 웹 SSOT | 앱 SSOT |
|------|---------|---------|
| 대시보드 화면 | `frontend/src/components/dashboard-v2/consultant/ConsultantDashboardV2.js` | `expo-app/app/(consultant)/(home)/index.tsx` |
| 라우트·퀵액션 | `frontend/src/components/dashboard-v2/constants/menuItems.js` (`CONSULTANT_*`) | `expo-app/src/constants/consultantHomeCopy.ts` (`CONSULTANT_HOME_ROUTES`) |
| 레이아웃 셸 | `ConsultantAppShell` / `AdminCommonLayout` | `expo-app/app/(consultant)/_layout.tsx` |
| 스타일 | `ConsultantDashboard.css` · B0KlA · `unified-design-tokens.css` | `expo-app/src/theme/consultant-theme.ts` |
| 데이터 훅 | `ConsultantDashboardV2.js` 내 fetch · `StandardizedApi` | `useConsultantMobileDashboard` · `usePendingRecords` · `useUnreadMessageCount` |

### 1.4 공유 가능 범위

| 영역 | 공유 | 비고 |
|------|:----:|------|
| API client | O | 웹 `StandardizedApi` · 앱 `expo-app/src/api/client.ts` |
| Auth·tenantId | O | 저장소만 플랫폼별 |
| schedules·incomplete-records·messages·ratings API | O | API-only Must link |
| Route map·deep link | X | |
| Tab / LNB / 바텀탭 | X | |
| 화면 컴포넌트·CSS/RN StyleSheet | X | cross-import 금지 |

---

## 2. 개요 및 목표

상담사(CONSULTANT)가 **웹·앱 어느 쪽에서든** 출근·상담 전·상담 사이에 **3초 이내** “오늘 무엇을 해야 하는지”를 파악할 수 있도록, 웹 `ConsultantDashboardV2`와 Expo 홈을 **병행 개선**합니다.

- **웹**: B0KlA·`AdminCommonLayout`·ContentKpiRow·QuickActionBar·ListTableView(Compact) — 어드민 G1-02 톤 정합.
- **앱**: 내담자 홈 패턴(`AppTopBar`·StatCard KPI strip·카드형 스케줄) — **어드민 2칸 flex 레이아웃 이식 금지**.
- **공통**: 동일 API·동일 비즈니스 규칙(미작성 일지만 CTA, COMPLETED 일지 모바일 열람 금지, tenantId 필수).

**선행**: WBS `ROLE-02` 웹 1차 B0KlA 블록(#530 merge) · **본 Enhanced는 잔여 갭·앱 P0·품질 게이트 마감**.

---

## 3. 사용자 관점 (§0.4 — 디자이너 전달용)

| 항목 | 내용 |
|------|------|
| **사용성** | 상담사는 **출근·상담 전·상담 사이**에 대시보드를 연다. 1순위: 오늘 몇 건·다음 상담 시각. 2순위: 미작성 일지·미읽음 메시지. 3순위: 일정 추가·근무 설정·내담자·급여(조건부). 자주 쓰는 동작은 **웹 QuickActionBar / 앱 QuickActionBar** 상단 배치. |
| **정보 노출** | COMPLETED 일지 **모바일 열람 CTA 금지**. 미작성(DRAFT/미완료)만 배너·CTA. 내담 PII는 ScheduleCard 수준. ERP·매칭 큐·입금 대기·커뮤니티 검수 **상담사 홈 노출 금지**. 급여는 본인 정산 요약만(조건부). |
| **레이아웃 (웹)** | 상→하: ContentHeader → QuickActionBar → (미작성 알림) → 다음 상담 → ContentKpiRow → 긴급 내담자 → 최근/다가오는 일정 → 주간 차트. 최대 너비 1280px, 8px grid. |
| **레이아웃 (앱)** | 상→하: AppTopBar → 인사+요약 → (알림 스택) → KPI strip → (다음 상담 P1) → 오늘 스케줄 → 빠른 액션. 스크roll 2~3 화면 이내. |

---

## 4. 웹 vs 앱 — 기능·섹션 대응 (API-only)

> **UI 경로는 대응하지 않음.** 아래는 **동일 데이터 소스**만 매핑.

| 데이터·기능 | API-only Must link | 웹 섹션 | 앱 섹션 | P0 7/13 |
|-------------|:------------------:|---------|---------|---------|
| 오늘 스케줄 건수·목록 | ☑ | ContentKpiRow + 최근 일정 | KPI + FlashList | ☑ |
| 미작성 일지 | ☑ | IncompleteRecordsAlert | PendingRecordsBanner | ☑ |
| 안읽은 메시지 | ☑ | KPI + navigate 웹-native | KPI + TopBar 배지 | ☑ |
| 다음 상담 준비 | ☑ | NextConsultationCard | NextSessionCard (P1) | ◐ P1→P0 승격 검토 |
| 긴급 내담자 | ☑ | UrgentClientsSection | UrgentBanner (P1) | ◐ |
| 신규 내담·평균 평점 | ☑ | ContentKpiRow | StatCard (P1) | ◐ |
| 주간 상담 차트 | ☑ | weeklyStats 차트 | **앱 홈 제외** | 웹 only |
| 시스템 알림 목록 | ☑ | recentNotifications | notifications 탭 | ◐ |
| QuickAction 4종 | UI 분리 | 일지·일정·내담자·메시지 (LNB 정합) | 일정·근무·(P1) 메시지·일지 | ☑ |

**갭 인벤토리 SSOT**: Phase 0 `explore` 산출 — [`CONSULTANT_ENHANCED_ORCHESTRATION.md`](../project-management/2026-07-07/CONSULTANT_ENHANCED_ORCHESTRATION.md) §Phase 0.

---

## 5. 웹 Enhanced — 블록·컴포넌트 (Atomic)

**페이지 래퍼**: `AdminCommonLayout` + `ConsultantDashboardV2.js`

| 순서 | Organism / Block | SSOT 컴포넌트 | 비고 |
|------|------------------|---------------|------|
| 1 | Page Header | `ContentHeader` G-14 h1 | 이중 제목 금지 |
| 2 | Quick Action | `QuickActionBar` | LNB 4항목 정합, CTA ≤ Primary 1 per row |
| 3 | 미작성 알림 | `IncompleteRecordsAlert` | count>0 조건부 |
| 4 | 다음 상담 | `NextConsultationCard` | 조건부 |
| 5 | KPI | `ContentKpiRow` | 4칸: 오늘·신규·메시지·평점 |
| 6 | 긴급 내담 | `UrgentClientsSection` | ListTableView Compact |
| 7 | 최근·다가오는 | 기존 섹션 | safeDisplay 필수 |
| 8 | 주간 차트 | Chart.js | dark cascade · hex 0 |

**레거시 제거**: `ConsultantDashboardRenewal.js` 참조 0 · 인라인 hex · ProfileCard in pending lists.

---

## 6. 앱 Enhanced — 블록·컴포넌트 (Atomic)

**화면**: `expo-app/app/(consultant)/(home)/index.tsx`  
**상세 스펙**: [`SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md`](./SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md) (기존) + Phase 2 designer 갱신분 병합

| 순서 | 컴포넌트 | P0 7/13 |
|------|----------|---------|
| 0 | `AppTopBar` + unread 배지 | ☑ |
| 1 | 인사 + `buildConsultantTodaySummary` | ☑ |
| 2 | 미작성 일지 배너 | ☑ |
| 3 | KPI strip (`atoms/StatCard`) | ☑ |
| 4 | 다음 상담 카드 | P1 (7/13 슬랙 시 P0 승격) |
| 5 | 오늘 스케줄 FlashList | ☑ |
| 6 | `QuickActionBar` | ☑ |

**Must-not (앱)**: `molecules/StatCard` 사용 금지 · COMPLETED 일지 CTA · 어드민 위젯 cross-import.

---

## 7. API-only Must link 목록 (코더 공통)

| ID | 엔드포인트 (예) | 웹 | 앱 |
|----|-----------------|:--:|:--:|
| A-01 | `/api/v1/schedules/today/statistics` | ☑ | ☑ |
| A-02 | `/api/v1/schedules` (오늘) | ☑ | ☑ |
| A-03 | `/api/v1/schedules/consultants/{id}/incomplete-records` | ☑ | ☑ |
| A-04 | `/api/v1/consultation-messages/unread-count` | ☑ | ☑ |
| A-05 | `/api/v1/schedules/consultants/{id}/upcoming-preparation` | ☑ | P1 |
| A-06 | `/api/v1/schedules/consultants/{id}/high-priority-clients` | ☑ | P1 |
| A-07 | `/api/v1/ratings/consultant/{id}/stats` | ☑ | P1 |
| A-08 | `/api/v1/system-notifications/active` | ☑ | ◐ |

**BE 신규 API**: 7/13 범위 **Out-of-scope** (WBS DEC-06). 기존·확장 API만 사용.

---

## 8. 제거·금지 패턴 (Anti-Patterns)

1. 앱 경로를 웹 `navigate('/consultant/...')` 또는 `quickActionsConfig`에 **parity**로 추가
2. 웹에 `AppTopBar`·바텀탭 패턴 이식
3. 앱에 B0KlA `mg-v2-section-block` CSS cross-import
4. COMPLETED 일지 모바일 열람 CTA
5. 매칭 큐·DepositPending·어드민 KPI 위젯 상담사 홈 배치
6. `ContentHeader` + 섹션 내부 이중 h1
7. 하드코딩 hex/rgba·px (토큰 100%)

---

## 9. Coder DoD (웹·앱 각 1 PR 권장)

### 9.1 공통

- [ ] API-only Must link §7 호출 유지·tenantId 경계
- [ ] UI Must link / App parity 경로 **0건**
- [ ] React #130 · safeDisplay · #130 grep 0
- [ ] **UI/UX Quality Gate §10** 전항 PASS

### 9.2 웹 (`ConsultantDashboardV2`)

- [ ] B0KlA · `mg-v2-*` · `var(--mg-*)` only
- [ ] 1280 / 414 반응형 회귀 0
- [ ] dark cascade (해당 페이지)
- [ ] Jest smoke: `ConsultantDashboardV2.smoke.test.js` PASS

### 9.3 앱 (`(consultant)/(home)`)

- [ ] `SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md` P0 체크리스트
- [ ] `consultantHomeCopy.ts` 문구 상수화
- [ ] `npm run verify:bundle:ci` (Metro) PASS
- [ ] Jest: `consultantHomeKpi.test.ts` 등 회귀 PASS

---

## 10. UI/UX Quality Gate (최고 품질 기준)

[`CLIENT_DASHBOARD_REBUILD_HANDOFF_v1.3.md`](./CLIENT_DASHBOARD_REBUILD_HANDOFF_v1.3.md) §9와 동일 7항. 플랫폼별 추가:

| # | 웹 | 앱 |
|---|----|----|
| 1 | B0KlA `var(--mg-*)` 100% | `consultant-theme` / `theme.colors.*` 100% |
| 4 | 1280·414 | 390·414 SafeArea |
| 5 | aria-label·focus ring | `accessibilityLabel`·44px touch |
| 7 | admin-dashboard-sample 정합 | 내담자 홈(`(client)/(home)`) 시각·간격 정합 |

---

## 11. 버전·참조

| 문서 | 용도 |
|------|------|
| [`CONSULTANT_ENHANCED_ORCHESTRATION.md`](../project-management/2026-07-07/CONSULTANT_ENHANCED_ORCHESTRATION.md) | Phase·분배실행 |
| [`SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md`](./SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md) | 앱 홈 (기존 designer) |
| `SCREEN_SPEC_CONSULTANT_DASHBOARD_ENHANCED_FULL.md` | **Phase 2 designer 산출 (예정)** |
| [`CONSULTANT_DASHBOARD_PHASE1_DESIGN_SPEC.md`](./v2/CONSULTANT_DASHBOARD_PHASE1_DESIGN_SPEC.md) | 웹 Phase1 블록 (legacy 참조) |
| [`CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md`](../project-management/CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md) | 앱 갭 분석 (2026-05) |

| 버전 | 일자 | 비고 |
|------|------|------|
| v1.0 | 2026-07-07 | Enhanced 핸드오프 · DEC-02 · 7/13 Design Freeze (`core-planner`) |
