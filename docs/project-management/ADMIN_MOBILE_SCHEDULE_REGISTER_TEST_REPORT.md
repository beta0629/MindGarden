# Admin Mobile Phase 2 — Sprint 1 + 1b 테스트 리포트

**작성일**: 2026-05-18  
**작성자**: core-tester  
**기준 커밋**: `e91bfca5c` — Step 3 기존 일정·슬롯 UX (`feat(expo)`); Sprint 1b `56dc9a77b` · 슬롯 충돌 `919c98904`  
**기획 SSOT**: [`ADMIN_MOBILE_SCHEDULE_REGISTER_ORCHESTRATION.md`](./ADMIN_MOBILE_SCHEDULE_REGISTER_ORCHESTRATION.md) §5B.6, §10 · Step 3 UX [`ADMIN_MOBILE_SCHEDULE_CREATE_UX_MEETING.md`](./ADMIN_MOBILE_SCHEDULE_CREATE_UX_MEETING.md)  
**디자인 SSOT**: [`ADMIN_MOBILE_SCHEDULE_CREATE_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_SCHEDULE_CREATE_DESIGN_HANDOFF.md)  
**선행 게이트**: [`ADMIN_MOBILE_MVP_TEST_PLAN.md`](./ADMIN_MOBILE_MVP_TEST_PLAN.md)

---

## 1. 요약

| 구분 | 결과 |
|------|------|
| **자동 게이트 (Expo)** | **2/2 PASS** (`e91bfca5c` 재실행) |
| **Step 3 UX 수동 (§10)** | **0/6 실행** — **PENDING** (정적 추적 **6/6 일치**, #1 리스트 필터 **부분**) |
| **Sprint 1 수동 (§3)** | **0/5 실행** — **PENDING** |
| **Sprint 1b 수동 (§4)** | **0/6 실행** — **PENDING** (정적 추적 5/6 일치, #6 웹 CTA **갭**) |
| **§5B.6 Jest** | **PASS** — `adminMappingCreateBody` · `adminConsultantDayScheduleNormalize` 포함 |
| **Maestro Sprint 1b** | **미작성** — 경로 제안만 §6 |
| **게이트 판정** | **조건부 PASS** — 자동·단위·Step3 정적 OK. **§10 수동 6건 + §3·§4 미완료 전 운영 반영 비권장** |

---

## 2. 자동 게이트

| # | 명령·대상 | 결과 | 비고 |
|---|-----------|------|------|
| A1 | `cd expo-app && npm run test:utils` | **PASS** | **15** suites, **77** tests, ~11s. Step3: `adminConsultantDayScheduleNormalize.test.ts`, `scheduleTimeSlotConflict.test.ts`. Sprint 1b: `adminMappingCreateBody.test.ts`. Sprint 1: `adminScheduleCreateBody.test.ts`, `adminRole.test.ts` 등 |
| A2 | `cd expo-app && npx tsc --noEmit` | **PASS** | exit 0 |

**실행 환경**: macOS, 워크스페이스 `mindGarden` (2026-05-18, 커밋 `e91bfca5c` 기준 재실행).

**참고**: worker graceful exit 경고(`--detectOpenHandles` 권장) — 실패 아님, 기존 타이머 누수 패턴과 동일.

### 2.1 Sprint 1b 관련 단위 테스트 (A1 하위)

| 파일 | 결과 | 검증 요약 |
|------|------|-----------|
| `adminMappingCreateBody.test.ts` | **PASS** | `PENDING_PAYMENT`·`mappingType: NEW`·회기/금액 floor |
| `adminScheduleCreateBody.test.ts` | **PASS** | `POST /schedules/consultant` 본문·endTime·가예약 |
| `adminRole.test.ts` | **PASS** | `canViewMappingsOnMobile` / `canManageMappingsOnMobile` (STAFF + `MAPPING_MANAGE`) |
| `adminConsultantDayScheduleNormalize.test.ts` | **PASS** | 시간대·내담자명·상태 라벨 정규화 (`e91bfca5c`) |
| `scheduleTimeSlotConflict.test.ts` | **PASS** | 점유 슬롯·CANCELLED/COMPLETED 제외·겹침 검증 (`919c98904` 선행) |

---

## 10. Step 3 UX — 기존 일정·슬롯 선택 (`e91bfca5c`)

**선행**: `919c98904` (슬롯 충돌), [`ADMIN_MOBILE_SCHEDULE_CREATE_UX_MEETING.md`](./ADMIN_MOBILE_SCHEDULE_CREATE_UX_MEETING.md), [`ADMIN_MOBILE_SCHEDULE_CREATE_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_SCHEDULE_CREATE_DESIGN_HANDOFF.md)

**변경 파일 (커밋)**: `schedule/create.tsx`, `useConsultantSchedulesByDate.ts`, `AdminConsultantDayScheduleList.tsx`, `AdminScheduleSelectionSummary.tsx`, `AdminScheduleTimeSlotPicker.tsx`, `adminConsultantDayScheduleNormalize.ts`

### 10.1 수동 체크리스트

| # | 시나리오 | 기대 | 수동 실행 | 정적 추적 (코드·리뷰) | 비고 |
|---|----------|------|-----------|------------------------|------|
| S3-1 | Step3 **기존 일정** 리스트 | API 시간·내담자 표시 | **PENDING** | **일치** — `AdminConsultantDayScheduleList` + `normalizeConsultantDaySchedulesFromItems` (`timeRangeLabel`, `clientName`, 상태 Badge) | API 실데이터·말줄임은 디바이스 필요 |
| S3-2 | 예약된 슬롯 **비활성** | 탭 불가 | **PENDING** | **일치** — `buildAdminScheduleSlotAvailabilities` → `TimeSlotChip` `disabled={!isAvailable}` · `handlePress` early return | |
| S3-3 | **빈 슬롯만** 선택 | `endTime` 자동 | **PENDING** | **일치** — `onSelectStartTime` + `computeEndTimeFromDuration`; duration 변경 시 선택 초기화 | |
| S3-4 | 시작/종료 **TextInput 없음** (Step3) | 슬롯·요약만 | **PENDING** | **일치** — Step3: 날짜 `TextInput`(YMD)만; 시각 입력 없음 · `AdminScheduleSelectionSummary` | Step4는 시각 **읽기 전용** 텍스트만 |
| S3-5 | **날짜 변경** 시 refetch | 리스트·슬롯 동시 갱신 | **PENDING** | **일치** — `queryKey`에 `dateYmd` · `consultant`/`dateYmd` 변경 시 `startTime`/`endTime` 리셋 · 동일 `existingSchedulesQuery` | ◀▶·YMD 직접입력 공통 |
| S3-6 | **mapping prefill** → Step3 | 상담사·내담자·Step3 진입 | **PENDING** | **일치** — `mappingId`·`step: '3'` (`schedule/index.tsx`) · `setStep(3)` prefill effect | POST 성공은 디바이스 |

**정적 부분 불일치 (FAIL 아님, UAT 시 확인)**: 웹 `isScheduleShownInExistingBookingsList`와 달리 **기존 일정 리스트**는 API 전건을 정규화해 표시(취소·완료 포함 가능). **슬롯 점유**는 `buildOccupiedRangesFromSchedules`로 취소·완료 제외 — 슬롯·리스트 표시 규칙이 웹과 100% 동일하지 않을 수 있음.

**수동 실행 권장 순서**: ADMIN 로그인 → 일정 허브 → 상담사·내담자 있는 날짜로 Step3 → S3-1~5 → 매칭 카드 「이 매칭으로 일정 잡기」→ S3-6.

**권장 경로**: `/(admin)/(operation)/schedule/create` 또는 `schedule?mappingId=&step=3`

### 10.2 Step 3 자동·정적 게이트

| 항목 | 결과 |
|------|------|
| `npm run test:utils` | **PASS** (§2 A1) |
| `npx tsc --noEmit` | **PASS** (§2 A2) |
| `adminConsultantDayScheduleNormalize` | **PASS** |
| `scheduleTimeSlotConflict` | **PASS** |
| Step3 IA (날짜 → 기존 일정 → duration → 슬롯 → 요약) | **정적 일치** |

### 10.3 core-coder (Step 3 배치)

**자동 게이트 실패 없음.** 수동 미실행으로 **P0 위임 없음.**

| 우선순위 | 조건 | 위임 |
|----------|------|------|
| P2 | UAT S3-1에서 취소·완료가 리스트에 노출되고 혼란 | `isScheduleShownInExistingBookingsList` 동등 필터를 `normalizeConsultantDaySchedulesFromItems` 또는 리스트 props 전에 적용 (웹 `schedule.js` parity) |
| P1 | 수동 S3-2·S3-3 겹침·endTime 오류 | `scheduleTimeSlotConflict` · `create.tsx` selection effect |
| P1 | 수동 S3-6 prefill 실패 | `mappingId` 라우트·`findAdminMappingById` |

---

## 3. Sprint 1 수동 체크리스트 (§10 완료 기준)

| # | 시나리오 | 기대 | 결과 | 비고 |
|---|----------|------|------|------|
| S1-1 | **ADMIN** — 스케줄 허브 FAB → 4스텝 등록 | `POST .../schedules/consultant` 성공, 목록 refetch | **PENDING** | `schedule/create.tsx` 구현·정적 OK |
| S1-2 | **STAFF** — 일정 등록 + 내담자 등록 | 검수·스태프 등록 UI 없음 | **PENDING** | `(admin)/_layout` 검수 탭 `href: null` |
| S1-3 | **STAFF** — 상담사 등록 버튼 | `CONSULTANT_MANAGE` 없으면 숨김 | **PENDING** | JWT 권한별 상이 |
| S1-4 | create-client 후 `schedule/create` 복귀 | consultant/client prefill | **PENDING** | 라우트 params 수동 확인 |
| S1-5 | Android release APK | tenant ready 후 등록 | **SKIP** | 선택; `build-android-apk-dev.sh` |

**권장 경로**: `/(admin)/(operation)/schedule` → FAB → `schedule/create`

---

## 4. Sprint 1b 수동 체크리스트 (§5B.6)

| # | 시나리오 | 기대 | 수동 실행 | 정적 추적 (코드·리뷰) | 비고 |
|---|----------|------|-----------|------------------------|------|
| 1b-1 | `schedule/index` 「매칭」탭 목록 | `GET /api/v1/admin/mappings` 표시 | **PENDING** | **일치** — `useAdminMappings` + 세그먼트 `mappings` | |
| 1b-2 | 「신규 매칭」5스텝 → POST | `PENDING_PAYMENT` 목록 반영 | **PENDING** | **일치** — `mapping/create.tsx` 5스텝, `useAdminCreateMapping`, body `status: PENDING_PAYMENT` | |
| 1b-3 | 「이 매칭으로 일정 잡기」 | `create` Step 3 prefill, POST schedule 성공 | **PENDING** | **일치** — `mappingId`·`step: '3'`·`setStep(3)` prefill | API 성공은 디바이스 필요 |
| 1b-4 | 「일정」탭 FAB 일정 등록 | 4스텝 성공 | **PENDING** | **일치** — Sprint 1 `schedule/create` 유지 | S1-1과 동일 검증 |
| 1b-5 | **STAFF** | 매칭 조회·일정·신규매칭(`MAPPING_MANAGE` 시), 검수/스태프 UI 없음 | **PENDING** | **일치** — `adminRole`·검수 탭 숨김·`canRegisterStaffOnMobile` | STAFF JWT 권한별 1b-2 가변 |
| 1b-6 | **입금대기** | 「웹에서 결제 확인」만, 네이티브 결제 모달 없음 | **PENDING** | **부분 불일치** — `confirm-payment` 네이티브 모달 **없음** ✓ / `PENDING_PAYMENT` 카드 **웹 CTA 미구현** ✗ | §5B·기획 SSOT 대비 **갭** → §7 |

**수동 실행 권장 순서**: 1b-1 → 1b-2 → 1b-1(목록 재확인) → 1b-3 → 1b-4 → 1b-5 → 1b-6.

**권장 계정**: ADMIN 전체; STAFF + `MAPPING_MANAGE` / `MAPPING_VIEW` 조합 각 1회.

---

## 5. 커버리지·갭

| 영역 | 자동 | 갭 |
|------|------|-----|
| 매칭 POST body | `adminMappingCreateBody` | Hook·화면 통합 테스트 없음 |
| 일정 POST body | `adminScheduleCreateBody` | `useAdminCreateSchedule` E2E 없음 |
| 허브·prefill | — | Maestro 미작성 (§6) |
| 입금 확인 UX | — | `PENDING_PAYMENT` 카드 웹 링크 CTA 없음 (§4 #6) |
| 서버 | (Sprint 1 리포트) Java pre-validation | Expo↔API MockMvc mappings POST 없음 |

---

## 6. Maestro 초안 경로 제안 (파일 미생성)

기존 Phase 1 플로우를 확장·분리하는 형태를 권장한다. 비밀번호는 기존과 동일하게 `MAESTRO_*` 환경 변수만 사용.

| 제안 경로 | 목적 |
|-----------|------|
| `expo-app/.maestro/flows/admin-schedule-hub-smoke.yaml` | ADMIN: 운영 → 일정·매칭 허브 → 세그먼트 [매칭] assert |
| `expo-app/.maestro/flows/subflows/admin-mapping-create-5step.yaml` | 신규 매칭 5스텝 제출(픽커·최소 필드) — dev 테넌트 픽스처 데이터 필요 |
| `expo-app/.maestro/flows/subflows/admin-schedule-prefill-from-mapping.yaml` | 매칭 카드 「이 매칭으로 일정 잡기」→ Step 3 문구 assert |
| `expo-app/.maestro/flows/admin-schedule-hub-staff.yaml` | STAFF: 검수 탭 없음 + 매칭 탭(권한 있을 때) |
| (선택) `expo-app/.maestro/flows/subflows/admin-credentials-login.yaml` | 기존 서브플로우 재사용 |

**assert 후보 카피**: `ADMIN_MAPPING_COPY.TAB_MAPPINGS`, `ACTION_SCHEDULE_FROM_MAPPING`, `FAB_NEW_MAPPING`, `ADMIN_SCHEDULE_REGISTER_COPY` (일정 FAB).

---

## 7. core-coder 위임 (Sprint 1b·공통)

**자동 게이트 실패 없음.** Step 3 전용은 §10.3.

| 우선순위 | 조건 | 위임 내용 |
|----------|------|-----------|
| **P0** | §5B.6 #6 / 기획 「웹에서 결제 확인」 | `schedule/index.tsx` `MappingListCard`: `PENDING_PAYMENT`·`DEPOSIT_PENDING` 시 `buildAdminWebUrl` + `ADMIN_MOBILE_WEB_ROUTES`에 `integrated-schedule` 경로 추가, CTA만 노출 (`MappingPaymentModal` 네이티브 금지 유지) |
| P1 | 수동 1b-3 POST 4xx | `create.tsx` prefill·`findAdminMappingById`·invalidate |
| P1 | 수동 S1-4 prefill | `create-client.tsx` navigation params |
| P2 | 수동 S1-3 STAFF 상담사 버튼 노출 | `canRegisterConsultantOnMobile` 게이트 |

---

## 8. §5B.6·§10 체크리스트 대조

### Sprint 1b (§5B.6)

| 기준 | 자동/정적 | 수동 |
|------|-----------|------|
| 매칭 탭 목록 → 신규 매칭 5스텝 → `PENDING_PAYMENT` | Jest body ✓ / UI ✓ | **PENDING** |
| 「일정 잡기」→ Step 3 prefill 일정 1건 | 코드 ✓ | **PENDING** |
| 입금 확인 웹 CTA만 | 네이티브 모달 없음 ✓ / **웹 CTA 없음** | **PENDING** |
| STAFF 매칭·일정·검수/스태프 없음 | 코드 ✓ | **PENDING** |
| Jest `adminMappingCreateBody` + `adminScheduleCreateBody` | **PASS** | — |
| Maestro 허브·매칭·prefill | — | **미작성** (§6) |

### Sprint 1 (§10)

| 기준 | 상태 |
|------|------|
| ADMIN/STAFF 일정 등록·가예약·내담자 인라인·스태프 등록 | 수동 **PENDING** (§3) |
| `npm run test:utils` | **PASS** |
| Android APK 스모크 | **SKIP** |

---

## 9. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-18 | Sprint 1 자동 3/3 PASS, 수동 0/5 PENDING 초판 (`5c7b83920`) |
| 2026-05-18 | Sprint 1 + 1b 통합: `56dc9a77b`, Expo 자동 2/2 PASS, 1b 수동 0/6 PENDING, #6 웹 CTA 정적 갭 → core-coder P0 |
| 2026-05-18 | Step 3 UX `e91bfca5c`: 자동 2/2 PASS (15 suites·77 tests), §10 수동 0/6 PENDING, 정적 6/6, 리스트 필터 웹 parity P2 |
