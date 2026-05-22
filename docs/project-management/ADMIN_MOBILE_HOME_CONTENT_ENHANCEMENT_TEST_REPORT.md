# 어드민·스태프 모바일 홈 컨텐츠 강화 — Phase 4 테스트 리포트

**작성일**: 2026-05-22  
**최종 갱신**: 2026-05-22 (Phase 4 후속 — `getMmkv` SSR 가드 재검증)  
**작성자**: core-tester  
**Phase**: 4 — P0 검증 (코드 수정 없음)  
**기준 커밋**: `d67b827fb` on `develop` (푸시 완료) · SSR 가드 **미커밋** 워킹트리  
**종합 판정**: **CONDITIONAL PASS (P0)** — Jest·정적·`verify:bundle:ci` **PASS**; 실기기 UAT **PENDING**

---

## SSOT

| 문서 | 용도 |
|------|------|
| [`ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md`](./ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md) | §8 완료 기준·UAT 8항 |
| [`SCREEN_SPEC_ADMIN_MOBILE_HOME.md`](../design-system/SCREEN_SPEC_ADMIN_MOBILE_HOME.md) | P0/P1 화면 스펙 |
| [`TESTING_STANDARD.md`](../standards/TESTING_STANDARD.md) | 테스트 표준 |

---

## 1. 요약

어드민·스태프 홈 P0 구현(`index.tsx`, `AdminTodaySchedulePreview`, `adminHomeKpi`, `adminHomeCopy`, `useAdminMobileDashboard`)에 대해 **자동 단위 테스트 8/8 PASS**, **정적 코드 리뷰 PASS**를 확인했다.

- **미작성 일지 배너**: 어드민 홈 import·렌더 경로 **없음** (상담사 홈 전용 `usePendingRecords`·`PENDING_BANNER` 미사용).
- **STAFF 역할**: 홈 화면에 `isAdminRole`/`isStaffRole` 분기 **없음** → P0 KPI(알림·오늘 일정)만 노출. 검수·마음날씨·매칭 P1 KPI/CTA **미구현**(스펙상 P1). 검수 탭은 `_layout.tsx`에서 STAFF 숨김 유지.
- **`verify:bundle:ci`**: Phase 4 후속 재검증 **PASS** (exit **0**) — `getMmkv.ts` SSR 가드(미커밋) 적용 후 web export 286 routes 성공. 초기 exit **7** MMKV SSR 이슈 **해소**.
- **실기기 UAT §8**: 본 배치에서 **미실행 (PENDING)** — 실행 가이드: [`MOBILE_HOME_P0_DEVICE_UAT_RUN.md`](./MOBILE_HOME_P0_DEVICE_UAT_RUN.md) (Maestro·수동 체크리스트).

**P0 CONDITIONAL → PASS:** 자동·CI P0 게이트(Jest, 정적, `verify:bundle:ci`)는 **PASS 가능**. **전체 P0 DoD PASS** 는 §8 실기기 UAT 1~5·8항 완료 후.

---

## 2. 자동 테스트 결과

### 2.1 Jest (Phase 4 후속 통합 실행)

```bash
cd expo-app && npm run test:utils -- --testPathPattern="consultantHomeKpi|adminHomeKpi|consultantRecordMobilePolicy"
```

| 항목 | 결과 |
|------|------|
| Suites | **3 passed** (`adminHomeKpi`, `consultantHomeKpi`, `consultantRecordMobilePolicy`) |
| Tests | **19 passed / 19 total** |
| Time | ~2.7s |
| Exit code | **0** |

### 2.1a `adminHomeKpi` Jest (초기 단독 실행)

```bash
cd expo-app && npm run test:utils -- --testPathPattern=adminHomeKpi
```

| 항목 | 결과 |
|------|------|
| Suite | `src/utils/__tests__/adminHomeKpi.test.ts` |
| Tests | **8 passed / 8 total** |
| Time | ~2.8s |
| Exit code | **0** |

**커버 함수**: `sliceTodaySchedulePreview`, `formatAdminScheduleParticipantLabel`, `formatAdminScheduleTimeRange`, `buildAdminHomeSummaryLine`, `formatAdminTodayScheduleSectionTitle`.

**미작성**: `adminHomeCopy.ts` 전용 단위 테스트 파일 없음 (copy는 `adminHomeKpi.test.ts`에서 간접 검증).

### 2.2 `verify:bundle:ci` · `verify:metro-mmkv`

```bash
cd expo-app && npm run verify:metro-mmkv
cd expo-app && npm run verify:bundle:ci
```

| 단계 | Exit code | 결과 | 검증 시점 |
|------|-----------|------|-----------|
| `verify-metro-mmkv` | **0** | **PASS** (web/ios 전 케이스) | Phase 4 후속 |
| `verify:bundle:ci` (전체) | **0** | **PASS** — web export 286 static routes | Phase 4 후속 |
| `verify:bundle:ci` (초기) | **7** | **FAIL** — SSR MMKV (아래 이력) | Phase 4 초기 |

**Phase 4 후속 (2026-05-22):** `getMmkv.ts` SSR 가드(미커밋) 후 **exit 0**. export 종료 시 Expo force-exit 경고만(비블로킹).

**초기 실패 이력 (수정 전)**

```
Error: Tried to access storage on the server. Did you forget to call this in useEffect?
  at getLocalStorage (.../react-native-mmkv/lib/web/getLocalStorage.js)
  at Object.set (.../src/lib/getMmkv.ts)
  at useTenantStore.ts:88
```

정적 렌더(SSR) 경로에서 Zustand persist → MMKV write가 발생. **어드민 홈 P0 파일과 직접 연관 없음** — expo-app web export 공통 이슈 → **SSR 가드로 해소**.

### 2.3 Definition of Done (§8 상단) — 자동·정적

| 항목 | 판정 | 근거 |
|------|------|------|
| P0 섹션 ↔ SCREEN_SPEC | **PASS (P0)** | AppTopBar, 인사+요약, KPI 가로 스크롤, 일정 미리보기, QuickActionBar 3개 구현 |
| API tenant·역할 스코프 | **PASS (정적)** | `useAdminTodaySchedules` → `useAdminApiQueryReady`; `useUnreadCount` → `enabled: !!tenantId` |
| 미작성 일지 배너 없음 | **PASS** | §4 정적 확인 |
| STAFF 검수·마음날씨 KPI/CTA 없음 | **PASS (P0)** | 홈에 해당 UI 없음; P1 KPI 미구현 |
| Pull-to-refresh invalidate | **PASS (정적)** | `onRefresh` → `dashboard.refetchAll()` → unread + schedules refetch |
| `verify:bundle:ci` | **PASS** | §2.2 Phase 4 후속 exit **0** |
| `adminHomeKpi`·copy 유닛 테스트 | **CONDITIONAL** | `adminHomeKpi` 8 tests PASS; copy 전용 test 파일 없음 |

---

## 3. §8 UAT 체크리스트 (8항)

**실기기·Maestro 실행:** [`MOBILE_HOME_P0_DEVICE_UAT_RUN.md`](./MOBILE_HOME_P0_DEVICE_UAT_RUN.md) · Maestro: `expo-app/.maestro/README.md`

| # | 항목 | P | 판정 | 검증 방법·비고 |
|---|------|---|------|----------------|
| 1 | ADMIN 홈 「오늘 N건 일정」 요약 (인사 아래) | P0 | **PASS (정적)** | `buildAdminHomeSummaryLine(dashboard.todayScheduleCount, 0)` → `adminHomeCopy` 템플릿. 실기기 문구 확인 **PENDING** |
| 2 | 오늘 일정 1~3건 미리보기 → 스케줄 라이트 | P0 | **PASS (정적)** | `sliceTodaySchedulePreview` + `AdminTodaySchedulePreview`; ScheduleCard read-only(`actionLabel`/`onActionPress` 없음). 탭·상세 일치 **PENDING** |
| 3 | TopBar 알림 unread 배지 → 알림 설정 | P0 | **PASS (정적)** | `AppTopBar` Bell + dot; `NOTIFICATION_SETTINGS` 라우트. 실기기 배지·이동 **PENDING** |
| 4 | 빠른 액션: 일정 등록 / 스케줄 / 메시지 | P0 | **PASS (정적)** | `ADMIN_HOME_ROUTES.CREATE_SCHEDULE`, `.SCHEDULE`, `.MESSAGES` 연결 확인 |
| 5 | STAFF: 검수 탭·검수 KPI 없음, 크래시 없음 | P0 | **PASS (정적)** | `(admin)/_layout.tsx` `hideReviewTab = isStaffRole(role)`; 홈 KPI는 알림·일정만. STAFF 실로그인 **PENDING** |
| 6 | (P1) 매칭 대기 KPI | P1 | **P1 미구현** | 홈에 `useAdminMappings`·매칭 StatCard 없음 |
| 7 | (P1) ADMIN 검수 대기 KPI/배너 | P1 | **P1 미구현** | `AdminOpsBannerStack`·검수 KPI 없음 |
| 8 | API 실패 시 스켈레톤→empty, 부분 렌더, 크래시 없음 | P0 | **CONDITIONAL (정적)** | KPI `SkeletonLoader`×2, 일정 `SkeletonCard`×2, `EmptyState` 구현. 네트워크 차단 실기기 **PENDING** |

---

## 4. 정적 코드 리뷰

### 4.1 미작성 일지 배너 없음 (상담사 전용 CTA 미혼입)

| 검사 | 결과 |
|------|------|
| `app/(admin)/(home)/index.tsx` import | `consultantHomeCopy`, `usePendingRecords`, `PENDING_BANNER` **없음** |
| `AdminTodaySchedulePreview.tsx` | 상담사 일지·배너 관련 import **없음** |
| `(admin)/` 트리 grep `미작성\|Unwritten\|diary` | **매치 없음** (일지는 `(operation)/records` 서브화면만) |
| 대조: `(consultant)/(home)/index.tsx` | `usePendingRecords`, `{/* 미작성 일지 배너 */}` **존재** — 어드민 홈과 분리됨 |

### 4.2 STAFF — `AdminRoleGate`·홈 조건부 렌더

**`AdminRoleGate`** (`src/components/guards/AdminRoleGate.tsx`):

- `consultant` → `/(consultant)/(home)` 리다이렉트
- `client` → `/(client)/(home)` 리다이렉트
- `!isAdminMobileShellRole(role)` → 로그인
- ADMIN·STAFF 모두 admin 셸 진입 허용

**탭 레벨 STAFF 게이트** (`app/(admin)/_layout.tsx`):

- `isStaffRole(role)` → 검수 탭 `href: null` (탭 숨김)
- `(review)/_layout.tsx` — STAFF 딥링크 차단 별도 유지

**홈 P0 (`index.tsx`)**:

- 역할 분기 **없음** → STAFF도 동일 P0 UI (인사, 알림 KPI, 오늘 일정, 3 quick actions)
- ADMIN 전용 P1 KPI(검수·마음날씨·매칭) **미구현** → STAFF 회귀 관점 **양호**
- `buildAdminHomeSummaryLine(..., 0)` — 처리 대기 M건은 P0에서 항상 0 (P1 집계 미연동)

### 4.3 P0 ↔ SCREEN_SPEC 정합 (주요)

| 스펙 | 구현 | 판정 |
|------|------|------|
| AppTopBar + unread dot | ✅ | PASS |
| 가로 ScrollView KPI + `atoms/StatCard` | ✅ | PASS |
| 일정 미리보기 read-only ScheduleCard | ✅ | PASS |
| QuickActionBar 3개 (P0) | ✅ | PASS |
| P1 배너 스택 | ❌ | P1 미구현 (예상) |
| `adminTheme` 직접 vs `useTheme()` | `useTheme()` 사용 | MINOR — 기존 admin 화면 패턴과 동일 |

---

## 5. core-coder 위임 목록 (필요 시)

| 우선순위 | 항목 | 담당 | 비고 |
|----------|------|------|------|
| ~~**P2 (CI)**~~ | ~~`verify:bundle:ci` web export MMKV SSR~~ | ~~core-coder~~ | **해소** — `getMmkv.ts` SSR 가드, exit **0** (미커밋) |
| **P3** | `adminHomeCopy.ts` 단위 테스트 | core-coder | `SUMMARY_*` placeholder 치환 회귀용 (선택) |
| **P1 스코프** | §3.3 P1 — 매칭 KPI, 검수 KPI, 배너 스택, pending ops 요약 | core-coder | 별도 Phase; 본 리포트 P0 범위 외 |
| **Human** | §8 UAT 1~5, 8 실기기 | QA/팀 | ADMIN·STAFF 계정 각 1회 |

---

## 6. 체크리스트 (TESTING_STANDARD)

- [x] `TESTING_STANDARD.md` 참조
- [x] Given-When-Then·describe/it 구조 (`adminHomeKpi.test.ts`)
- [x] 테스트 데이터 동적 생성 (`makeSchedule(id)`)
- [x] 코드 수정 없음 (테스트 리포트만 갱신)
- [ ] 실기기 UAT 8항 — **PENDING**
- [x] `verify:bundle:ci` — **PASS** (Phase 4 후속 exit **0**)
- [x] `verify:metro-mmkv` — **PASS** (exit **0**)

---

*문서 버전: 1.1 | Phase 4 core-tester 산출 | Phase 4 후속 재검증(코드 수정 없음, 리포트만 갱신)*
