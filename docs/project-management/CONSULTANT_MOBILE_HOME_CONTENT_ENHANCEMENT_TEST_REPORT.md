# 상담사 모바일 홈 컨텐츠 강화 — Phase 4 테스트 리포트

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-05-22 |
| 최종 갱신 | 2026-05-22 (Phase 4 후속 — `getMmkv` SSR 가드 재검증) |
| 작성 | core-tester |
| 기준 커밋 | `d67b827fb` (`develop`, 푸시 완료) · SSR 가드 **미커밋** 워킹트리 |
| 검증 환경 | 로컬 워크스페이스 `/Users/mind/mindGarden/expo-app` |
| SSOT | `docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md` |
| UAT 기준 | `docs/project-management/CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md` §8 |

---

## 1. 요약

| 구분 | 결과 |
|------|------|
| **전체 판정** | **CONDITIONAL PASS (P0)** — 자동·CI 게이트 **PASS**; 실기기 UAT **PENDING** |
| P0 자동 테스트 | **통과** (19/19 대상 스위트 + 이전 11/11 consultant subset) |
| P0 정적·정책 검증 | **통과** (COMPLETED CTA 미노출, Pull-to-refresh 대상 일치) |
| `verify:bundle:ci` | **통과** (exit **0**, §2.2 — Phase 4 후속 재검증) |
| `verify:metro-mmkv` | **통과** (exit **0**, §2.2) |
| §8 실기기 UAT | **미수행** — [`MOBILE_HOME_P0_DEVICE_UAT_RUN.md`](./MOBILE_HOME_P0_DEVICE_UAT_RUN.md) · Maestro `consultant-home-p0-smoke.yaml` |
| P1 기능(다음 상담·확장 빠른 액션) | **미구현** — P0 범위 외, §8 항목 4·7 해당 |

**P0 CONDITIONAL → PASS 전환:** `verify:bundle:ci` SSR/MMKV 블로커 **해소됨** → **자동·CI P0 게이트는 PASS 가능**. **전체 P0 DoD 완료(무조건 PASS)** 는 §8 실기기 UAT 1~5·8항 수행 후에만 가능.

---

## 2. 자동 테스트 결과

### 2.1 Jest (expo-app)

| 명령 | Exit code | 결과 |
|------|-----------|------|
| `npm run test:utils -- --testPathPattern="consultantHomeKpi\|adminHomeKpi\|consultantRecordMobilePolicy"` (Phase 4 후속) | **0** | 3 suites, **19 passed** |
| `npm run test:utils -- --testPathPattern="consultantHomeKpi\|consultantRecordMobilePolicy"` (초기) | **0** | 2 suites, **11 passed** |
| `npm run test:utils` (전체 utils) | **0** | 40 suites, **232 passed** |

**대상 스위트 상세**

| 파일 | 케이스 | 결과 |
|------|--------|------|
| `src/utils/__tests__/consultantHomeKpi.test.ts` | `resolveTodayCount`, `buildConsultantTodaySummary`, `selectConsultantHomeKpiItems` | PASS |
| `src/utils/__tests__/consultantRecordMobilePolicy.test.ts` | `isConsultantRecordVisibleOnMobile`, `isConsultantRecordEditableOnMobile` | PASS |
| `src/utils/__tests__/adminHomeKpi.test.ts` | (Phase 4 후속 통합 실행에 포함) | PASS |

**참고:** Jest 종료 시 worker graceful exit 경고(`--detectOpenHandles` 권고)가 있으나 **실패·스킵 없음**.

**홈 화면 컴포넌트 통합/E2E:** `index.tsx` 전용 Jest·Playwright 스펙 **없음**. `navigateAfterAuth.test.ts`에 상담사 홈 라우팅 1건만 존재.

### 2.2 `npm run verify:bundle:ci` · `verify:metro-mmkv`

| 명령 | Exit code | 결과 | 검증 시점 |
|------|-----------|------|-----------|
| `npm run verify:metro-mmkv` | **0** | **통과** — web/ios 전 케이스 | Phase 4 후속 |
| `npm run verify:bundle:ci` | **0** | **통과** — `verify-metro-mmkv` + `CI=1 npx expo export --platform web` 완료 (286 static routes) | Phase 4 후속 |
| `npm run verify:bundle:ci` (초기) | **7** | **실패** — SSR 중 MMKV `set` (아래 이력) | Phase 4 초기 |

**Phase 4 후속 결과 (2026-05-22)**

- `expo-app/src/lib/getMmkv.ts` SSR 가드 적용(미커밋) 후 **exit 0** 확인.
- web export 정적 렌더 **크래시 없음**. 종료 시 `Something prevented Expo from exiting` 경고만 출력(비블로킹).
- `[Auth] restoreTokens failed n.default.getValueWithKeyAsync is not a function` — web SSR 경로 로그 1건; export **성공**.

**초기 실패 이력 (수정 전, 기록만)**

1. `verify-metro-mmkv`: 통과
2. `CI=1 npx expo export --platform web` 정적 렌더링 중 크래시:
   - `Error: Tried to access storage on the server. Did you forget to call this in useEffect?`
   - 스택: `react-native-mmkv` → `src/lib/getMmkv.ts` → `zustand persist` → **`src/stores/useTenantStore.ts:88`**
3. 상담사 홈 변경과 **직접 연관된 번들/모듈 해석 오류는 없음**. Expo 앱 전역 SSR·MMKV 초기화 이슈로 분류 → **SSR 가드로 해소**.

---

## 3. §8 UAT 체크리스트

**실기기·Maestro 실행:** [`MOBILE_HOME_P0_DEVICE_UAT_RUN.md`](./MOBILE_HOME_P0_DEVICE_UAT_RUN.md)

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 1 | **요약**: 로그인 후 홈에서 「오늘 N건의 상담」(또는 0건 문구)가 인사 아래 표시 | **정적 통과** / **수동 UAT 필요** | `index.tsx` L174–194: `buildConsultantTodaySummary(todayCount)` + `CONSULTANT_HOME_COPY.GREETING`. 0건 시 `TODAY_SUMMARY_ZERO`. 유닛: `consultantHomeKpi.test.ts` |
| 2 | **미작성 일지**: 미작성 시 배너 → 일지 탭; COMPLETED만 있으면 배너 없음 | **정적 통과** / **수동 UAT 필요** | 홈: `pendingCount > 0`일 때만 배너(L198–237), `CONSULTANT_HOME_ROUTES.RECORDS` 이동. `usePendingRecords` → `normalizeEntityRowToPending`에서 `isSessionCompleted`면 **제외**. 정책 테스트: `consultantRecordMobilePolicy.test.ts` |
| 3 | **오늘 스케줄**: 카드 탭·액션(입장/일지 등) 기존과 동일 | **정적 통과** / **수동 UAT 필요** | `ScheduleCard` + `getConsultantScheduleListRowActions` / `getConsultantScheduleCardFooterHint` 유지(L335–352). FlashList·전체 보기 라우트 존재 |
| 4 | **빠른 액션**: 「일정 추가」→ 스케줄, 「근무 설정」→ availability; (P1) 급여·메시지 | **P0 정적 통과** / **P1 해당 없음** / **수동 UAT 필요** | P0: `quickActions` 2개 — `CONSULTANT_HOME_ROUTES.SCHEDULE`, `AVAILABILITY`(L101–114). **P1 급여·메시지·일지 빠른 액션 미구현** |
| 5 | **알림 TopBar**: unread 배지 → 알림 화면 | **정적 통과** / **수동 UAT 필요** | `AppTopBar` + `useUnreadCount`, `unreadNotificationCount > 0` 시 dot(L151–155), `CONSULTANT_HOME_ROUTES.NOTIFICATIONS` |
| 6 | **(P1) KPI**: 미읽음 메시지 수 반영, 0/오류 시 깨짐 없음 | **정적 통과** / **수동 UAT 필요** | `selectConsultantHomeKpiItems` 2번째 항목 `unread_messages`; NaN → 0 클램프(테스트). 로딩: `SkeletonLoader`(L251–256). **P1 KPI 중 신규내담·평점은 미구현** |
| 7 | **(P1) 다음 상담**: 오늘 일정 있으면 다음 1건 강조 카드 | **P1 미구현** | `index.tsx`에 `ConsultantNextSessionCard` 또는 동등 섹션 **없음**. SCREEN_SPEC §3.1 P1 블록 |
| 8 | **오프라인/에러**: API 실패 시 스켈레ton→empty/부분 렌더, 크래시 없음 | **정적 부분 통과** / **수동 UAT 필요** | KPI·스케줄 스켈레ton, `?? 0` 폴백, `EmptyState`. 네트워크 단절·500 재현은 **실기기/통합 테스트 필요** |

---

## 4. Definition of Done (§8 상단) 대조

| 완료 기준 | 결과 | 근거 |
|-----------|------|------|
| P0 섹션이 SCREEN_SPEC·와이어 §1과 시각·동선 일치 | **부분** | P0: TopBar·인사·요약·미작성 배너·KPI(2칸)·오늘 스케줄·빠른 액션(2) **코드 존재**. 시각 정합은 **수동 UAT** |
| API tenant·user 스코프; `endpoints.ts` 상수화 | **통과** | `useConsultantDashboard(consultantId)`, `usePendingRecords(consultantId)`, `useUnreadCount`(tenantId), `useUnreadMessageCount`(userId+tenantId). 라우트·copy는 `consultantHomeCopy.ts` |
| COMPLETED 일지 홈·목록 CTA 없음 | **통과** | §5 참조 |
| Pull-to-refresh가 홈 주요 쿼리 invalidate | **통과** | §6 참조 |
| `npm run verify:bundle:ci` 통과 | **통과** | §2.2 Phase 4 후속 exit **0** |
| 신규 copy·KPI 유틸 유닛 테스트 존재 | **통과** | `consultantHomeKpi.test.ts`, `consultantRecordMobilePolicy.test.ts` |

---

## 5. COMPLETED 일지 정책 회귀 확인

| 영역 | COMPLETED CTA·목록 노출 | 근거 |
|------|-------------------------|------|
| **홈** `app/(consultant)/(home)/index.tsx` | **없음** | 미작성 배너만 `pendingCount > 0`. COMPLETED·「지난 일지」문구·일지 열람 CTA **미사용** |
| **일지 목록** `app/(consultant)/(records)/index.tsx` | **없음** | `usePendingRecords`만 렌더. 완료 일지 목록·CTA **없음** |
| **일지 상세** `app/(consultant)/(records)/[id].tsx` | **열람 CTA 없음(웹 안내)** | `isCompletedOnMobile` 시 `COMPLETED_RECORD_DESKTOP_ONLY_*` EmptyState, `isConsultantRecordEditableOnMobile`로 편집 차단 |
| **데이터 계층** `usePendingRecords` | **COMPLETED 필터** | `normalizeEntityRowToPending`: `isSessionCompleted === true` → `null` |
| **정책 유틸** | **테스트 통과** | `isConsultantRecordVisibleOnMobile('COMPLETED') === false` |

**표시 경계:** 홈 KPI·배너·스케줄 건수는 숫자·문자열 스칼라 위주. `user?.name`은 문자열 폴백(`GREETING_FALLBACK_NAME`) 존재. API 객체를 JSX 자식으로 직접 넣는 패턴 **없음** (`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` 관점).

---

## 6. Pull-to-refresh ↔ 쿼리 키 정적 검토

**홈 `onRefresh` (index.tsx L94–99)**

| 호출 | 훅 | 쿼리 키 (요약) | 일치 |
|------|-----|----------------|------|
| `dashboard.refetchAll()` | `useConsultantMobileDashboard` → `useConsultantDashboard` | `SCHEDULE_QUERY_KEYS.dashboard(consultantId)` + `todayYmd` | ✅ |
| `pendingQuery.refetch()` | `usePendingRecords` | `RECORD_QUERY_KEYS.pending(consultantId)` | ✅ |
| `unreadNotificationQuery.refetch()` | `useUnreadCount` | `NOTIFICATION_QUERY_KEYS.unreadCount(tenantId)` | ✅ |
| `unreadMessageQuery.refetch()` | `useUnreadMessageCount` | `MESSAGE_QUERY_KEYS.unreadCount(userId)` + `tenantId` | ✅ |

**결론:** 화면에서 구독하는 4개 데이터 소스가 refresh 시 **각각 `refetch()`** 되며, `refetchAll`은 대시보드(오늘 스케줄·todayCount)만 담당 — **중복 누락 없음**.

**개선 여지(블로커 아님):** `invalidateQueries` 일괄 패턴은 admin 홈과 달리 per-hook `refetch` 방식. 동작상 문제 없음.

---

## 7. P0 구현 대조 (SCREEN_SPEC §3.1)

| P0 섹션 | 구현 | 비고 |
|---------|------|------|
| AppTopBar + 알림 | ✅ | |
| 인사 + 오늘 N건 요약 | ✅ | 양수 요약 문구 일부 `consultantHomeKpi.ts` 인라인( copy 미분리) |
| 미작성 일지 배너 | ✅ | |
| KPI 스트립 (오늘 상담·안읽은 메시지) | ✅ | P0 설계상 2칸 |
| 오늘의 스케줄 | ✅ | |
| 빠른 액션 (일정 추가·근무 설정) | ✅ | |
| P1: 다음 상담·긴급 내담자·확장 QA·스냅샷 | ❌ | 후속 Phase |

---

## 8. core-coder 위임 목록 (수정은 tester 미수행)

| 우선순위 | 항목 | 설명 |
|----------|------|------|
| ~~**P0 블로커**~~ | ~~`verify:bundle:ci` SSR/MMKV~~ | **해소** — `getMmkv.ts` SSR 가드, Phase 4 후속 exit **0** (미커밋) |
| **P1 기능** | 다음 상담 카드 | SCREEN_SPEC §3.1 `ConsultantNextSessionCard` — §8 UAT #7 |
| **P1 기능** | 빠른 액션 확장 | 메시지·일지·급여(조건부) — §8 UAT #4 |
| **P2 / 품질** | copy 상수화 | `buildConsultantTodaySummary` 양수 문구를 `consultantHomeCopy.ts`로 이전 (운영 하드코딩 게이트) |
| **테스트** | 홈 통합 테스트(선택) | `index.tsx` mock hook 기반 smoke 또는 Playwright 상담사 홈 시나리오 |

---

## 9. 체크리스트 (TESTING_STANDARD)

- [x] `docs/standards/TESTING_STANDARD.md` / `core-solution-testing` 스킬 참조
- [x] Given-When-Then·describe 구조 (기존 유닛 테스트)
- [x] 정책·KPI 유닛 테스트 실행 및 통과 (Phase 4 후속: 19/19)
- [ ] 실기기 UAT §8 1~8항 — **미수행 (PENDING)**
- [x] `verify:bundle:ci` — **통과** (Phase 4 후속 exit **0**)
- [x] `verify:metro-mmkv` — **통과** (exit **0**)

---

*문서 버전: 1.1 | Phase 4 core-tester 산출 | Phase 4 후속 재검증(코드 수정 없음, 리포트만 갱신)*
