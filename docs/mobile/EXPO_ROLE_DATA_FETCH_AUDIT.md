# Expo 역할별 데이터 로딩 감사

| 항목 | 내용 |
|------|------|
| 기준일 | **2026-09-06** |
| 목적 | 역할(account≠role)·테넌트·쿼리 게이트 불일치로 인한 **빈 화면·잘못된 userRole·페치 스킵**을 증거 기반으로 정리하고 P0만 수정 |
| 앱 SSOT | `expo-app/` |
| 역할 역량 SSOT | `expo-app/src/utils/roleCapability.ts` (`hasCounselorCapability`, `resolveScheduleApiUserRole`) |
| 메시징 역할 | `expo-app/src/utils/adminRole.ts` → `toClientConsultantMessagingRole` |
| API ready 게이트 | `expo-app/src/hooks/useApiQueryReady.ts` |
| 유효 테넌트 | `expo-app/src/utils/resolveTenantIdForApi.ts` / `resolveEffectiveTenantIdForApi.ts` |
| JWT userId | `expo-app/src/utils/resolveClientScheduleUserId.ts` |
| Metro/MMKV | `docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` — MMKV는 `@/lib/getMmkv`만 |
| 하드코딩 게이트 | `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17 — 금액·세율 등 하드코딩 금지 |

---

## 1. Auth / session / tenant 요약

- **API client** (`expo-app/src/api/client.ts`): 요청 인터셉터가 `Authorization: Bearer <accessToken>` + `X-Tenant-Id`를 자동 삽입. React `TenantContext` 없음.
- **테넌트 소스**: Zustand `useTenantStore` + JWT `tenantId` + `user.tenantId` + recentTenants. **유효 테넌트**는 `resolveEffectiveTenantIdForApi` / `useResolveTenantIdForApi` / `useApiQueryReady().tenantId`.
- **쿼리 게이트**:
  - **권장**: `useApiQueryReady` — auth hydrate + accessToken + **effective** tenant (+ optional JWT-preferring `userId`).
  - **위험**: store-only `!!useTenantStore.tenantId` 또는 raw `role === 'consultant'` / `user?.id`만 사용 → JWT-tenant-only 세션·듀얼 역량·id 불일치 시 **페치 스킵·빈 데이터**.
- **테넌트 isolation**: write는 fail-closed(테넌트 없으면 차단). read는 허용 역할에 대해 effective tenant + capability로 동작해야 함.
- **인증**: Google SSO 유지. 대체 인증 발명 금지.

---

## 2. 역할 × 화면/훅 × 엔드포인트 감사표

### 2.1 Consultant shell (상세)

| role / capability | screen / hook | endpoint (요약) | expected tenant/auth | known failure mode | severity | status |
|-------------------|---------------|-----------------|----------------------|--------------------|----------|--------|
| counselor capability | `useScheduleDetail` | `GET …/schedules/{id}?userId&userRole` | Bearer + X-Tenant-Id; `userRole=resolveScheduleApiUserRole` | 과거: raw `role==='consultant'` → dual ADMIN을 CLIENT로 조회 | P0 | **Fixed** (#862 sibling, prior) |
| counselor / client | `useConsultationDetail` | 동일 schedule detail | 동일 + JWT-preferring userId | raw role 이분법 + store-only userId | P0 | **Fixed (this PR)** |
| counselor | `(consultant)/(home)` + home hooks | dashboard / pending / unread 등 | `useApiQueryReady().userId` | (기준 패턴 — 정상) | — | OK |
| counselor | `(schedule)/index` + `useConsultantSchedules` | schedules by date / date-range | ready + JWT userId | store `user?.id` only → empty list | P0 | **Fixed (this PR)** |
| counselor | `(clients)/index`, `[id]` | consultant clients / detail | ready + JWT userId | store id only → empty/403 | P0 | **Fixed (this PR)** |
| counselor | `(records)/index` + pending/list | consultation-records | ready + JWT userId | store id only → empty pending | P0 | **Fixed (this PR)** |
| counselor | `useConsultantMoodJournalInbox` | mood journal inbox | capability + effective tenant | `role !== 'consultant'` → dual/admin 차단; false `hasCounselorRole` | P0 | **Fixed (this PR)** |
| counselor | `useConsultantMindWeatherInbox` | mind-weather inbox | capability + effective tenant | 동일 raw role gate | P0 | **Fixed (this PR)** |
| any authed | `useNotifications` / `useUnreadCount` / settings | system-notifications / push settings | `useApiQueryReady` effective tenant | store-only tenant → JWT-tenant 세션에서 미페치 | P0 | **Fixed (this PR)** |
| counselor | `(more)/availability` | availability / vacations | capability + ready tenant/userId | `role==='consultant'` + store tenant → dual empty / no tenant UI | P0 | **Fixed (this PR)** |
| any | `hasCounselorCapability` | (util) | CONSULTANT → true; ADMIN+counseling / hasCounselorRole:true | `hasCounselorRole:false` short-circuit denied pure CONSULTANT | P0 | **Fixed (this PR)** |
| counselor | `useSendMessage` senderType | messages send | capability-aligned sender | raw `role==='consultant'` 이분법 | P1 | Open |
| counselor | `(schedule)` weekly empty copy | UI only | — | 주간 fetch인데 일간 empty 문구 | P1 | Open (parked copy) |
| counselor | home session-kpi / weekly trend | UI parity | — | 웹 완료 회기 추이 패리티 | P1 | Open (parked; prior P1 UI aborted) |
| counselor | schedule create | — | 제품: 생성 없음 | 생성 UI 추가 금지 | — | N/A (by design) |

### 2.2 Client shell (요약)

| role | screen / hook | endpoint | expected | known failure | severity | status |
|------|---------------|----------|----------|---------------|----------|--------|
| CLIENT | client home / sessions via `useClientScheduleApiContext` | schedules paged `userRole=CLIENT` | ready + JWT userId + tenant | 대부분 ready 게이트 사용 | — | OK (monitor) |
| CLIENT | shop / community hooks | shop & community APIs | `useApiQueryReady` | store-only 잔존 시 빈 카탈로그 | P1 | Open (spot-check) |
| CLIENT | mood / mind-weather (self) | self APIs | client session | inbox은 counselor-only | — | OK |

### 2.3 Admin / staff (요약)

| role | screen / hook | endpoint | expected | known failure | severity | status |
|------|---------------|----------|----------|---------------|----------|--------|
| ADMIN/STAFF | `useAdminApiQueryReady` | admin APIs | ready without forcing userId where appropriate | — | — | OK pattern |
| ADMIN + counseling | consultant shell routes | counselor APIs | `hasCounselorCapability` → CONSULTANT | raw role / false hasCounselorRole | P0 | **Fixed (this PR)** (capability path) |
| ADMIN only | consultant-only screens | — | gate empty / redirect | capability false → empty OK | — | OK |

---

## 3. Open P0 (this PR 이후)

이번 PR에서 식별·수정한 P0는 위 표 **Fixed (this PR)** / **Fixed**.  
**잔여 Open P0: 없음** (코드 감사 기준). 남은 항목은 P1·parked UI.

---

## 4. 검증 방법 (consultant Google SSO / test accounts)

1. **상담사 Google SSO**: 테넌트 선택 후 또는 JWT에만 tenant가 있는 세션으로 로그인.
2. **홈**: 오늘 일정·미작성 일지·알림 배지가 store tenant 비어 있어도 로드되는지 확인.
3. **스케줄 / 내담자 / 일지**: 목록이 빈 상태가 “로딩 스킵”이 아닌지(네트워크에 schedules·clients·records 요청 존재).
4. **알림 센터·미읽음**: `useTenantStore.tenantId`가 비어 있어도 JWT tenant로 목록·카운트 요청.
5. **감정일기·마음날씨 수신함**: `role` 스토어가 consultant이고 BE가 `hasCounselorRole:false`여도 inbox 쿼리 enabled.
6. **듀얼 ADMIN+상담**: 스케줄 상세·consultation detail `userRole=CONSULTANT`; availability 접근 가능.
7. **순수 CLIENT**: counselor inbox `blockReason=not_consultant`; availability empty.
8. **회귀**: `cd expo-app && npx jest src/utils/__tests__/roleCapability.test.ts src/utils/__tests__/resolveEffectiveTenantIdForApi.test.ts src/utils/__tests__/resolveClientScheduleUserId.test.ts`

---

## 5. Remaining gaps + OTA

| gap | note |
|-----|------|
| `useSendMessage` raw role | P1 — capability/`toClientConsultantMessagingRole`로 정렬 권장 |
| Client/admin store-only 잔존 훅 | 스팟 점검; 본 배치는 consultant P0만 |
| 홈 카피·주간 empty·session-kpi 패리티 | **parked** (이전 P1 UI 중단) |
| 실기기 UAT / Maestro | Google SSO 실계정으로 §4 수동 확인 권장 |
| **OTA** | 네이티브 바이너리 불필요 시 EAS **production** 채널 OTA로 훅·게이트 수정 배포 가능. Metro/MMKV·네이티브 모듈 변경 없으면 JS OTA로 충분. `getMmkv` import 경로 변경 금지. |

---

## 6. This PR 변경 요약

- `hasCounselorCapability`: CONSULTANT 우선, `hasCounselorRole:true` OR, ADMIN counseling — **false short-circuit 제거**
- `useConsultationDetail`: `resolveScheduleApiUserRole` + `resolveClientScheduleUserId`
- mood / mind-weather inbox: `hasCounselorCapability` + ready `userId`
- notifications: `useApiQueryReady` effective tenant
- schedule / clients / records / availability: JWT-preferring userId + ready / capability

**작성**: 2026-09-06 — core-coder P0 data-fetch audit.
