# 상담사 Expo 앱 패리티 인벤토리

| 항목 | 내용 |
|------|------|
| 기준일 | **2026-09-06** |
| 앱 SSOT | `expo-app/` (레거시 `mobile/`는 참고만) |
| 웹 기대치 SSOT | Clinic-OS 상담사 홈 / `ConsultantDashboardV2` |
| 웹 퀵액션 | `frontend/src/constants/consultantDashboardRoutes.js` → `CONSULTANT_DASHBOARD_QUICK_ACTIONS` (**create-schedule 없음**, 라벨「일정 확인」) |
| 화면 스펙 | `docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md`, `SCREEN_SPEC_CONSULTANT_DASHBOARD_CLINIC_OS.md` |
| 오케스트레이션 | `docs/project-management/CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md` |
| Metro/MMKV | `docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` — MMKV는 `@/lib/getMmkv`만 |

## 1. 목적·범위

- **목적**: 웹 상담사 홈·제품 규칙과 Expo 상담사 셸의 **동작·카피·역량(capability) 패리티** 갭을 증거 기반으로 정리하고, 일일 사용을 막는 **P0만** 최소 수정한다.
- **범위**: `expo-app/app/(consultant)/` 및 관련 상수·훅·Maestro. **대규모 리디자인·Google SSO 대체 인증 발명·일정 등록/생성 UI·타인 급여 조회 금지.**
- **제품 규칙 (불변)**: 상담사는 **일정 등록/생성 없음**(웹 SSOT). **본인 급여 조회만**. **tenant 컨텍스트 유지**. account≠role → **capability** (`hasCounselorCapability` 등).

## 2. 웹 기대치 요약 (Clinic-OS / ConsultantDashboardV2)

| 영역 | 웹 기대 |
|------|---------|
| 지금 할 일 | 미작성 일지·빠른 액션으로 “오늘 할 일” 파악 |
| 오늘 스케줄 | 당일 일정 목록 |
| 미작성 일지 | 배너/알림 + 일지 작성 흐름 |
| 메시지·급여 | 스냅샷/퀵액션으로 본인 메시지·본인 정산 |
| 완료 회기 추이 | 웹 홈 주간 차트 |
| 일정 등록 | **없음** — `CONSULTANT_DASHBOARD_QUICK_ACTIONS`에 create-schedule 없음, 라벨「일정 확인」 |
| 급여 | 본인만 / tenant isolation |
| 역할 | account≠role — 상담 역량(capability) 기준 |

## 3. 우선순위 갭 표

| Screen / route | Symptom or gap | Severity | Suspected area (file hints, non-binding) | Blocks daily counselor use? | Evidence (code/doc quote short) |
|----------------|----------------|----------|------------------------------------------|-----------------------------|----------------------------------|
| `/(consultant)/(home)` | 빠른 액션·빈 스케줄 CTA가 「일정 추가」/생성 유도. 웹은 「일정 확인」, create-schedule 금지 | **P0** | `consultantHomeCopy.ts`, `(home)/index.tsx`, `.maestro/flows/consultant-home-p0-smoke.yaml`, `.maestro/README.md` | **Y** | 수정 전 `QUICK_ACTION_SCHEDULE: '일정 추가'`, `EMPTY_SCHEDULE_DESCRIPTION: '새로운 상담 일정을 추가해보세요.'` / 웹: `label: '일정 확인'`, create-schedule 없음 |
| `useScheduleDetail` (스케줄 상세 조회) | `user.role === 'consultant' ? CONSULTANT : CLIENT` 이분법 → ADMIN+상담 역량 등이 CLIENT로 조회될 수 있음 | **P0** | `expo-app/src/api/hooks/useSchedules.ts`, `roleCapability.ts` (`resolveScheduleApiUserRole`) | **Y** (dual-capability / wrong role path) | 수정 전: `user.role === 'consultant' ? … : 'CLIENT'` → `resolveScheduleApiUserRole` / `hasCounselorCapability` |
| `/(consultant)/(home)` vs 웹 완료 회기 추이 | 홈에 웹 「완료 회기 추이」 없음. Expo는 `session-kpi` 더보기만 | **P1** | `(home)/index.tsx`, `(more)/session-kpi.tsx` | N | 홈에 주간 차트 섹션 없음; KPI는 `/(consultant)/(more)/session-kpi` |
| `/(consultant)/(schedule)` `view=weekly` | 주 전체 fetch인데 UI 문구는 「선택한 날짜에…」 | **P1** | `schedule/index.tsx`, `useConsultantSchedules` / `fetchConsultantSchedulesForParams` | N | `view: viewMode` + `params.view === 'weekly'` 주 fetch; empty `description="선택한 날짜에 상담 일정이 없습니다."` |
| `useSendMessage` | `user.role === 'consultant'` 이분법 — capability와 불일치 가능 | **P1** | `expo-app/src/api/hooks/useMessages.ts` | N (상담사 전용 셸에서는 대개 OK; dual-role 엣지) | `user.role === 'consultant' ? { senderType: 'CONSULTANT', … }` |
| `/(consultant)/(home)` 「지금 할 일」 | 웹식 명시 섹션 없음 — 미작성 배너+빠른액션으로 부분 충족 | **P1** | `(home)/index.tsx` | N | 섹션 타이틀 「지금 할 일」 미존재; pending banner + QuickActionBar |
| 실기기 UAT | CONSULTANT 홈 P0 UAT 체크리스트 미완료 | **P1** | `MOBILE_HOME_P0_DEVICE_UAT_RUN.md` | N (프로세스) | 표 ☐ PASS ☐ FAIL; Maestro CLI 미설치 기록 → **PENDING** |
| COMPLETED 일지 정책 | 오케스트레이션: COMPLETED 열람 CTA 금지 vs 코드: 읽기 전용 허용 | **P1** | `CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md`, `consultantRecordMobilePolicy.ts` | N (문서 드리프트) | 오케스트레이션: 「COMPLETED 일지 … 열람 CTA 금지」 / 코드: `COMPLETED`도 `isConsultantRecordVisibleOnMobile` true (읽기 전용) |
| `/(consultant)/(more)/community/*` | 커뮤니티 작성·상호작용 MMKV-only | **P2** | `community/create.tsx`, `community/[id].tsx` | N | 「이 기기(MMKV)에만」 안내 문구 |
| `/(consultant)/(more)/session-kpi` | `molecules/StatCard` 사용 (홈 SSOT는 atoms) | **P2** | `session-kpi.tsx` | N | `import { StatCard } from '@/components/molecules/StatCard'` |
| `/(consultant)/(more)/income` | 딥링크 Redirect — 의도적 fail-closed | **OK** | `income.tsx` | N | `<Redirect href="/(consultant)/(more)" />` — 갭 아님 |
| CredentialSheet | 테스트/보조 로그인 시트 존재 | **OK** | `CredentialSheet.tsx`, `CredentialSheetTrigger.tsx` | N | Google SSO 유지·제거 금지 (대체 인증 발명 금지) |
| 레거시 `mobile/` | 상담사 **ScheduleCreate** 화면 잔존 (Expo SSOT 아님) | **P1** (레거시만) | `mobile/src/screens/consultant/ScheduleCreate.js` | Y **if** 레거시 앱 사용 | Expo `/(consultant)` 에는 schedule create 라우트 **없음** — 제품 SSOT는 Expo |

### P0 이번 배치 조치 (Phase B) — 적용됨 (2026-09-06)

1. 홈 카피: `QUICK_ACTION_SCHEDULE` → 「일정 확인」; empty CTA 생성 유도 제거 (`EMPTY_SCHEDULE_*`); Maestro/README assert 동기화; 아이콘 `CalendarPlus`→`Calendar`.
2. `useScheduleDetail`: `resolveScheduleApiUserRole` (`hasCounselorCapability`) → `CONSULTANT` else `CLIENT`.

`useSendMessage` role 이분법은 **P1** — 본 배치 코드 범위 밖(인벤토리만).

## 4. 상담사 라우트 인벤토리 (`expo-app/app/(consultant)/`)

| Route | 파일 | 요약 |
|-------|------|------|
| `(consultant)/_layout` | `_layout.tsx` | 상담사 탭 셸 |
| `(home)/` | `(home)/index.tsx` | 홈 대시보드 |
| `(schedule)/` | `(schedule)/index.tsx` | 일정 목록(일/주) |
| `(schedule)/[id]` | `(schedule)/[id].tsx` | 일정 상세 |
| `(records)/` | `(records)/index.tsx` | 일지 목록(미작성 중심) |
| `(records)/[id]` | `(records)/[id].tsx` | 일지 상세 |
| `(records)/create/[scheduleId]` | `create/[scheduleId].tsx` | 일지 작성 |
| `(clients)/` | `(clients)/index.tsx` | 내담자 목록 |
| `(clients)/[id]` | `(clients)/[id].tsx` | 내담자 상세 |
| `(more)/` | `(more)/index.tsx` | 더보기 허브 |
| `(more)/availability` | `availability.tsx` | 근무 설정 |
| `(more)/messages` | `messages/index.tsx`, `[id].tsx` | 메시지 |
| `(more)/salary-settlement` | `salary-settlement.tsx` | 본인 급여 정산 |
| `(more)/session-kpi` | `session-kpi.tsx` | 회기 KPI·추이 |
| `(more)/income` | `income.tsx` | Redirect(fail-closed) **OK** |
| `(more)/profile` | `profile.tsx` | 프로필 |
| `(more)/settings` | `settings.tsx` | 설정 |
| `(more)/notifications` | `notifications.tsx` | 알림 |
| `(more)/notification-settings` | `notification-settings.tsx` | 알림 설정 |
| `(more)/mind-weather-inbox` | `mind-weather-inbox.tsx` | 마음날씨 수신함 |
| `(more)/mood-journal-inbox` | `mood-journal-inbox.tsx` | 무드 저널 수신함 |
| `(more)/community` | `community/index.tsx`, `create.tsx`, `[id].tsx` | 커뮤니티(MMKV 일부) |

## 5. 다음 배치 후보 (P1만, 본 문서 기준)

- 홈 완료 회기 추이(또는 스냅샷 링크) / 스케줄 weekly empty 카피 / `useSendMessage` capability / 「지금 할 일」 섹션 정리 / 실기기 UAT / COMPLETED 일지 문서·코드 정합.
