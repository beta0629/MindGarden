# Admin Mobile Phase 2 — 일정 등록·통합 스케줄·사용자 추가 오케스트레이션

**작성일**: 2026-05-18  
**작성자**: core-planner  
**상태**: **1차 제품 기획 SSOT** — 구현 전 사용자 승인·분배실행 대기  
**선행 완료**: Admin Mobile MVP Phase 1 (스케줄 라이트 조회, 사용자 조회, 검수 등) — [`ADMIN_MOBILE_MVP_TEST_PLAN.md`](./ADMIN_MOBILE_MVP_TEST_PLAN.md), [`EXPO_NATIVE_APP_PLAN.md`](./EXPO_NATIVE_APP_PLAN.md) §2.4  
**관련 웹 SSOT**: `UnifiedScheduleComponent.js`, `ScheduleModal.js`, `IntegratedMatchingSchedule.js`, [`INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md`](./INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)

---

## 1. 목표·배경

| 항목 | 내용 |
|------|------|
| **사용자 목소리** | 관리자 모바일에서 **가장 필요한 기능은 일정 등록** |
| **현재 병목** | Phase 1은 `useAdminTodaySchedules` **조회만** — Android tenant·JWT hydrate는 해결됨(`1ebd609ca` 등), **등록·생성 UX**가 다음 병목 |
| **제품 목표** | 현장·이동 중 ADMIN/STAFF가 **웹과 동일 API·검증**으로 **신규 매칭 생성**·일정 등록·사용자 추가를 스케줄 영역에서 완결 (웹 `IntegratedMatchingSchedule` + `MappingCreationModal` SSOT) |
| **비목표** | 웹 ERP·FullCalendar·**입금 확인** 네이티브 모달 **100% 복제**, 데스크톱 어드민 대체 |

---

## 2. 목표 사용자·역할별 권한

백엔드 `DynamicPermissionService.canRegisterScheduler` · `ScheduleController` 기준과 정합.

| 역할 | Expo `role` | 일정 **등록** | **가예약** (`tentativeBeforeDeposit`) | 내담자 **등록** | 상담사 **등록** | 스태프 **등록** |
|------|-------------|---------------|--------------------------------------|-----------------|-----------------|-----------------|
| **ADMIN** | `admin` | ✅ 타인 일정 | ✅ | ✅ (`CLIENT_MANAGE`) | ✅ (`CONSULTANT_MANAGE`) | ✅ (`USER_MANAGE`, `@PreAuthorize ADMIN`) |
| **STAFF** | `staff` | ✅ 타인 일정 | ✅ | ✅ (`CLIENT_MANAGE`) | ⚠️ 동적 권한 — 기본 웹과 동일하게 **CONSULTANT_MANAGE 없으면 UI 비노출** | ❌ ADMIN 전용 |
| **CONSULTANT** | — | ❌ (본인만 이동·수정, 생성 API 거절) | ❌ | — | — | — |
| **CLIENT** | — | ❌ | ❌ | — | — | — |

**모바일 IA 원칙**

- STAFF: Phase 1과 동일 — **검수 탭 숨김**, 운영(일정·사용자·일지) 중심.
- 권한 없는 액션은 버튼 미노출 + API 403 시 `UnifiedModal` 안내(웹 `ScheduleModal` 오류 패턴과 동일한 사용자 언어).

---

## 3. 범위 표 — MVP vs Phase 2 vs 웹 parity

| 기능 | Phase 1 (완료) | **Phase 2 — Sprint 1 (필수)** | Phase 2 — Sprint 2 | 웹 parity (참고) |
|------|----------------|------------------------------|--------------------|------------------|
| 오늘 일정 조회 | ✅ `schedule.tsx` | 유지 + **날짜 이동** | 주간 목록·필터 | `GET .../schedules/date/{date}` |
| 일정 **등록** | ❌ | ✅ **스텝 폼 + POST** | 수정·취소( PUT ) | `ScheduleModal` 4단계 |
| 가예약 토글 | ❌ | ✅ ADMIN/STAFF | 매핑 상태 연동 안내 | `tentativeBeforeDeposit` |
| 통합 스케줄 (매칭+캘린더) | ❌ | **Sprint 1**: 일정 등록만 | **Sprint 1b**: 매칭 탭·신규 매칭·「일정 잡기」 | 드래그·FullCalendar·ERP 결제 모달 UI | `IntegratedMatchingSchedule` |
| **신규 매칭 생성** | ❌ | ❌ | ✅ **5스텝** (`POST /api/v1/admin/mappings`) | 결제·입금 **확인** 모달 | `MappingCreationModal` |
| 내담자 추가 | 조회만 | ✅ **최소 필드** 등록 | 수정·주소·프로필 | `ClientComprehensiveManagement` |
| 상담사 추가 | 조회만 | ✅ **최소 필드** (권한 시) | 상세·등급 | `ConsultantComprehensiveManagement` |
| 스태프 추가 | ❌ | ✅ ADMIN만 **최소 필드** | 권한·상담겸직 | `StaffManagement` |
| ERP·결제·회기 확정 | ❌ | ❌ (웹 링크) | — | `MappingPaymentModal` 등 |
| FullCalendar DnD | ❌ | ❌ | ❌ | `UnifiedScheduleComponent` |

---

## 4. API·필드 SSOT (웹 ↔ 모바일)

### 4.1 일정 생성

| 항목 | 값 |
|------|-----|
| **Method·Path** | `POST /api/v1/schedules/consultant` |
| **웹 호출** | `ScheduleModal.js` → `StandardizedApi.post(...)` |
| **Expo 상수** | `SCHEDULE_API`에 **`SCHEDULE_CREATE_CONSULTANT: '/api/v1/schedules/consultant'`** 추가 권장 (현재 `SCHEDULE_CREATE`는 `/api/v1/schedules` — 내담자 예약 훅용, **혼동 금지**) |
| **DTO** | `ScheduleCreateRequest` |

| UI 라벨 (모바일) | JSON 필드 | 웹 `ScheduleModal` | 필수 | 비고 |
|------------------|-----------|-------------------|------|------|
| 상담사 | `consultantId` | `selectedConsultant.originalId \|\| id` | ✅ | Long |
| 내담자 | `clientId` | `selectedClient.originalId \|\| id` | ✅ | Long |
| 날짜 | `date` | `YYYY-MM-DD` | ✅ | 과거일 **400** |
| 시작 시각 | `startTime` | `HH:mm` | ✅ | |
| 종료 시각 | `endTime` | duration 코드로 계산 | ✅ | |
| 제목 | `title` | 기본: `상담사명 - 내담자명` | ○ | |
| 메모 | `description` | description | ○ | |
| 일정 유형 | `scheduleType` | `'CONSULTATION'` | ○ | 기본값 동일 |
| 상담 유형 | `consultationType` | 코드 (`INDIVIDUAL` 등) | ○ | 공통코드 API 연동은 **explore→코더** |
| 상담 시간(분) | *(클라이언트만)* | `selectedDuration` → endTime 계산 | ✅ UI | 서버에는 start/end만 |
| 가예약 | `tentativeBeforeDeposit` | ADMIN/STAFF만 body 포함 | ○ | `true` 시 매핑·회기 검증 경로 상이 — [`INTEGRATED_SCHEDULE_...`](./INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) |
| 상태 | — | 서버 derived | — | 요청 본문에 **status 없음** (웹 동일) |

**서버 검증 (모바일도 동일 메시지 노출)**

- `canRegisterScheduler` — ADMIN/STAFF만 생성.
- 휴무·과거일·매칭 없음·회기 소진 — `ScheduleServiceImpl.createConsultantSchedule` (단위 테스트: `ScheduleServiceImplCreateConsultantSchedulePreValidationTest`).

### 4.2 일정 조회 (기존)

| Method·Path | Expo |
|-------------|------|
| `GET /api/v1/schedules/date/{yyyy-MM-dd}?userId=&userRole=ADMIN\|STAFF` | `useAdminTodaySchedules` → Sprint 1에서 **선택 날짜** 파라미터화 |

### 4.3 사용자 등록 (관리자 API)

| 대상 | Method·Path | 권한 | 웹 SSOT | Sprint 1 모바일 최소 필드 |
|------|-------------|------|---------|---------------------------|
| 내담자 | `POST /api/v1/admin/clients` | ADMIN, STAFF + `CLIENT_MANAGE` | `ClientComprehensiveManagement` create payload | `name`, `email` **또는** `phone`, `password?`, `status` |
| 상담사 | `POST /api/v1/admin/consultants` | `CONSULTANT_MANAGE` | `ConsultantComprehensiveManagement` | `email`, `phone?`, `status?`, `grade?` |
| 스태프 | `POST /api/v1/admin/staff` | ADMIN + `USER_MANAGE` | `StaffManagement` | `email`, `name?`, `phone?`, `password?` |
| 이메일 중복 | `GET /api/v1/admin/duplicate-check/email?email=` | 등록 전 | 웹 등록 모달 | 등록 스텝 내 호출 |

**사용자 목록 (기존)**  
`GET /api/v1/admin/user-management` — `useAdminUserManagement` (피커·검색 재사용).

### 4.4 매칭·통합 스케줄 API (Sprint 1b SSOT)

| API | 용도 | Sprint |
|-----|------|--------|
| `GET /api/v1/admin/mappings` | 매칭 카드 목록·필터 | **1b** |
| `POST /api/v1/admin/mappings` | 신규 매칭 생성 — 웹 `MappingCreationModal.handleCreateMapping` 동일 body | **1b** |
| `GET` 공통코드 `CONSULTATION_PACKAGE` | 패키지 스텝 옵션 | **1b** (explore→코더) |
| `POST .../mappings/{id}/confirm-payment` | 입금·결제 **확인** UI | **비범위** — 웹 fallback |
| `POST .../mappings/{id}/confirm-deposit` | 가예약·입금 승인 | **비범위** — 웹 fallback |
| `POST .../mappings/{id}/approve` | 매칭 승인 | Sprint 2 검토 / 1b는 카드에 **웹 열기** CTA |

**`POST /api/v1/admin/mappings` 요청 필드 (웹 SSOT — 모바일 동일)**

| UI 스텝 | JSON 필드 | 웹 | 필수 |
|---------|-----------|-----|------|
| 1 상담사 | `consultantId` | `selectedConsultant.id` | ✅ |
| 2 패키지 | `packageName`, `totalSessions`, `packagePrice`, `remainingSessions` | `paymentInfo.*` | ✅ packageName |
| 3 내담자 | `clientId` | `selectedClient.id` | ✅ |
| 4 결제 | `paymentMethod`, `paymentReference`, `paymentAmount`, `paymentStatus`, `responsibility`, `specialConsiderations`, `notes` | step 4 폼 | ○ (기본값 웹과 동일) |
| 공통 | `startDate`, `status`(`PENDING_PAYMENT`), `mappingType`(`NEW`) | 생성 시 고정 | ✅ |

DTO: `ConsultantClientMappingCreateRequest.java` — 백엔드 검증·에러 메시지는 웹과 동일 노출.

**모바일 채택안 (Sprint 1b — 기획 확정)**

| 웹 패턴 | Sprint 1b 모바일 |
|---------|------------------|
| 좌 **매칭 목록** + 우 **캘린더** 2열 | ❌ — **세그먼트** [일정 \| 매칭] 단일 허브 (`schedule/index`) |
| 헤더 「신규 매칭」 | ✅ FAB·시트 「신규 매칭」→ `schedule/mapping/create` 5스텝 |
| 매칭 카드 **드래그 → 캘린더** | ❌ |
| 카드 「일정 등록」→ `preFilledMapping` → ScheduleModal **step 3** | ✅ `mappingId`로 consultant·client resolve 후 `schedule/create` **Step 3** 진입 |
| `MappingPaymentModal`·입금 확인 | ❌ 네이티브 — **`getAdminWebUrl('/admin/integrated-schedule')`** 또는 매칭 상세 웹 |

---

## 5. 일정 등록 — 최소 플로우 (스텝 UX, 와이어 수준)

웹 `ScheduleModal` step 1~4를 **모바일 스택·바텀시트**로 재구성. 공통 모달: **`UnifiedModal`** (Expo 기존 컴포넌트).

```
[운영 탭 > 일정] schedule/index.tsx  ← Sprint 1b: 통합 스케줄 허브 (§5B)
  ├─ 세그먼트 [ 일정 | 매칭 ]
  ├─ (일정) 날짜 ◀ ▶ + FlashList
  ├─ (매칭) 매칭 카드 목록 + 카드 CTA 「이 매칭으로 일정 잡기」
  └─ FAB / 확장 FAB → 「일정 등록」| 「신규 매칭」

schedule/create — 스텝 (ADMIN/STAFF)
  Step 1  상담사 선택     검색 + 목록 (GET consultants / user-management 필터)
          └─ 링크 「상담사 등록」→ users/create-consultant (권한 시)
  Step 2  내담자 선택     검색 + 목록
          └─ 링크 「내담자 등록」→ users/create-client
  Step 3  날짜·시간       날짜 피커 + 슬롯 그리드(간소) 또는 시작/종료 TimePicker
          (preFilledMapping 진입 시 Step 3부터, 상담사·내담자 고정)
  Step 4  세부            상담유형·시간(분)·제목·메모·[가예약 토글]
          └─ 제출 POST /api/v1/schedules/consultant
          └─ 성공 → schedule.tsx 해당 날짜로 pop + invalidate queries
```

**STAFF vs ADMIN UI 차이**

- 검수·스태프 등록 버튼 없음(STAFF).
- 가예약 토글: 둘 다 가능(백엔드 동일).

---

## 5B. Sprint 1b — 신규 매칭·통합 스케줄 허브

**목표**: 세션(회기) 추가가 아니라, 웹 `IntegratedMatchingSchedule` + `MappingCreationModal`과 **동일 비즈니스** — **신규 매칭 생성**과 **매칭 기반 일정 등록**을 모바일 스케줄 영역에서 완결한다. Sprint 1(일정 등록 4스텝) **직후** 착수, 동일 API·tenant·권한 전제.

### 5B.1 사용자 관점 (사용성·정보·레이아웃)

| 관점 | 내용 |
|------|------|
| **사용성** | 현장에서 “매칭 없어 일정 안 잡힘” 병목 제거 — **먼저 매칭 만들고**, 같은 허브에서 **일정 잡기**. 웹처럼 앱 전환·웹 ERP 왕복 최소화. |
| **정보 노출** | 매칭 카드: 상담사·내담자·패키지·잔여 회기·상태(`PENDING_PAYMENT` 등). **입금 승인·ERP 결제 상세**는 네이티브 미노출 → 「웹에서 결제 확인」. ADMIN/STAFF 동일; STAFF는 검수 탭 없음(Phase 1 유지). |
| **레이아웃** | **한 화면 허브** — 상단 AppTopBar 「일정·매칭」, 본문 **세그먼트**로 일정/매칭 전환. 캘린더 2열은 모바일 비범위. |

### 5B.2 IA — `schedule/index` 통합 허브

**라우트 SSOT**: `app/(admin)/(operation)/schedule/index.tsx` (기존 `schedule.tsx` → `schedule/` 스택 하위 index).

```
schedule/index
  AppTopBar: "일정·매칭" (또는 운영 카피 SSOT)
  SegmentedControl: [ 일정 ] [ 매칭 ]     ← 기본 탭: 일정 (Sprint 1 유지)

  ── 탭: 일정 (Sprint 1) ──
  날짜 ◀ ▶
  FlashList 일정 카드
  (빈 상태: 해당일 일정 없음)

  ── 탭: 매칭 (Sprint 1b) ──
  (선택) 상태 필터 칩: 전체 / 입금대기 / 활성 … — 웹 목록 필터 축소판
  FlashList 매칭 카드
    · 상담사 · 내담자 · 패키지 · 잔여회기 · 상태 뱃지
    · Primary CTA: 「이 매칭으로 일정 잡기」
    · Secondary (입금대기 등): 「웹에서 결제 확인」→ getAdminWebUrl

  FAB (우하단)
    · 단일 FAB 탭 → BottomSheet / SpeedDial
        - 「일정 등록」→ schedule/create?dateYmd=
        - 「신규 매칭」→ schedule/mapping/create
    · (대안) 세그먼트별 FAB 1개만 노출 — 일정 탭=등록만, 매칭 탭=신규 매칭만
      → **디자이너 Phase 1b-디자인에서 하나 선택** (권장: 확장 FAB로 두 액션 항상 접근)
```

**웹 대응**

| 웹 (`IntegratedMatchingSchedule`) | 모바일 (Sprint 1b) |
|-----------------------------------|-------------------|
| ContentHeader 「통합 스케줄링」+ 「신규 매칭」 | 세그먼트 + FAB 「신규 매칭」 |
| 좌측 매칭 카드 리스트 | 매칭 탭 FlashList |
| 우측 FullCalendar | 일정 탭 날짜별 리스트 (기존 Sprint 1) |
| 카드 「일정 등록」 | 카드 CTA → prefill 일정 등록 |
| `MappingCreationModal` | `schedule/mapping/create` 5스텝 스택 |

### 5B.3 신규 매칭 — 5스텝 vs 축소안 (기획 결정)

웹 `MappingCreationModal` **STEPS_CONFIG**: 1 상담사 → 2 패키지 → 3 내담자 → 4 결제 → 5 완료.

| 안 | 스텝 | POST 시점 | 장점 | 단점 |
|----|------|-----------|------|------|
| **A. 5스텝 풀 패리티 (권장)** | 웹과 동일 5단계 | Step 4 「매칭 생성」→ `POST` → Step 5 완료 | API·검증·교육 1:1, 일정 등록 실패(매칭 없음) 감소 | Step 4 폼 길이·공통코드 로딩 |
| **B. 4스텝 축소** | 1 상담사 → 2 패키지 → 3 내담자 → 4 요약·생성 | Step 4에서 결제 **기본값**만 편집 가능 | 모바일 입력 부담 ↓ | 웹 Step 4 세부와 UI 불일치 |
| **C. 3스텝 + 웹 fallback** | 1 상담사 → 2 패키지·내담자(합침) → 3 생성 | 최소 필드 POST | 가장 빠름 | 패키지·내담자 동시 검색 UX 난이도, 웹 이탈 ↑ |

**Sprint 1b 채택: 안 A (5스텝 풀 패리티)**

- Step 4 **결제**: 웹과 동일 필드(`paymentMethod`, `paymentReference` 자동생성, `packagePrice`, `responsibility` 등). **입금 확인·ERP `MappingPaymentModal`** 은 생성 **후** 카드/완료 화면에서 **웹 링크**만 제공.
- **비목표**: `confirm-payment` / `confirm-deposit` 네이티브 모달 — [`INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md`](./INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) Phase 1 게이트와 충돌 시 웹 SSOT 우선.

```
schedule/mapping/create — 5스텝 (ADMIN/STAFF)
  Step 1  상담사 선택      (웹 step 1 — 검색·목록)
          └─ 「상담사 등록」→ users/create-consultant (권한 시, 복귀)
  Step 2  패키지 선택      CONSULTATION_PACKAGE 공통코드
  Step 3  내담자 선택      필터·정렬은 웹 축소(이름 검색 우선)
          └─ 「내담자 등록」→ users/create-client
  Step 4  결제 정보        패키지 연동 필드 + 결제수단 BadgeSelect
          └─ 제출 POST /api/v1/admin/mappings (body §4.4)
  Step 5  완료             요약 + CTA
          · 「이 매칭으로 일정 잡기」→ schedule/create?mappingId=
          · 「매칭 목록으로」→ schedule/index (매칭 탭)
          · (입금대기 시) 「웹에서 결제 확인」 — Sprint 1c: [`ADMIN_MOBILE_MAPPING_PAYMENT_APPROVAL_ORCHESTRATION.md`](./ADMIN_MOBILE_MAPPING_PAYMENT_APPROVAL_ORCHESTRATION.md)
```

### 5B.4 매칭 → 일정 prefill (웹 `preFilledMapping` 패리티)

| 진입 | 동작 |
|------|------|
| 매칭 카드 「이 매칭으로 일정 잡기」 | `schedule/create?mappingId={id}&dateYmd=` |
| 신규 매칭 Step 5 완료 | 동일 — 생성 응답 `id`로 prefill |
| `schedule/create` | `mappingId` → `GET` 목록 또는 mapping 단건 resolve → **consultantId·clientId 고정**, **Step 3(날짜·시간)** 부터 (Sprint 1 TODO 해소) |

서버: 일정 생성 시 매칭·회기 검증은 기존 `ScheduleServiceImpl` — 웹 `ScheduleModal`과 동일 메시지.

### 5B.5 Expo 라우트·모듈 (Sprint 1b 추가)

| 경로 | 용도 |
|------|------|
| `schedule/index.tsx` | **허브** — 세그먼트 일정/매칭 + FAB |
| `schedule/mapping/create.tsx` | 신규 매칭 5스텝 |
| `schedule/create.tsx` | `mappingId` prefill (§5B.4) |
| `src/api/hooks/useAdminMappings.ts` | 목록 query |
| `src/api/hooks/useAdminMappingCreate.ts` | create mutation |
| `src/constants/adminMappingCreateCopy.ts` | 카피·에러 상수 |
| `src/utils/adminMappingCreateBody.ts` | POST body 빌더 (웹 parity 테스트) |

### 5B.6 Sprint 1b 완료 기준

- [ ] ADMIN: 매칭 탭에서 목록 조회 → 「신규 매칭」5스텝 완료 → 목록에 `PENDING_PAYMENT` 표시  
- [ ] 동일 매칭으로 「일정 잡기」→ Step 3부터 일정 1건 등록 성공  
- [ ] 입금 확인 필요 시 「웹에서 결제 확인」만 노출(네이티브 결제 모달 없음)  
- [ ] STAFF: 매칭·일정 생성 가능, 스태프 등록·검수 탭 없음  
- [ ] Jest: `adminMappingCreateBody.test.ts` + 기존 `adminScheduleCreateBody`  
- [ ] Maestro: 허브 세그먼트·신규 매칭·prefill 일정 (flow는 `core-tester` 초안)

---

## 6. 사용자 추가 — 진입점·스텝 UX

| 진입점 | 우선순위 | 설명 |
|--------|----------|------|
| **A. 일정 등록 스텝 내 인라인** | P0 | 피커에 없을 때 즉시 등록 후 **선택 상태로 복귀** |
| **B. 사용자 조회 `users.tsx` FAB** | P1 | 「+ 사용자 추가」→ 역할 선택 → create-* 화면 |
| **C. 홈 바로가기** | P2 | Phase 2 후반 |

**create-client (와이어)**

1. 이름 · 연락처(이메일 또는 휴대폰) · 비밀번호(선택)  
2. (선택) 상태 ACTIVE  
3. 제출 → `POST /api/v1/admin/clients` → 성공 시 id 반환 → 이전 화면으로 `clientId` 전달  

**create-consultant** — 이메일 필수, 중복 검사, `POST /api/v1/admin/consultants`  

**create-staff** — ADMIN만, `POST /api/v1/admin/staff`  

상세 필드(주소·RRN·프로필 이미지)는 **웹 parity Phase 3** 또는 웹 fallback.

---

## 7. Expo 라우트·모듈 (예상)

| 경로 | 용도 |
|------|------|
| `app/(admin)/(operation)/schedule/index.tsx` | **허브** — 일정/매칭 세그먼트 + FAB (Sprint 1b) |
| `app/(admin)/(operation)/schedule/create.tsx` | 일정 등록 4스텝 + `mappingId` prefill |
| `app/(admin)/(operation)/schedule/mapping/create.tsx` | 신규 매칭 5스텝 (Sprint 1b) |
| `app/(admin)/(operation)/schedule/_layout.tsx` | Stack (index · create · mapping/create) |
| `app/(admin)/(operation)/users/create-client.tsx` | 내담자 등록 |
| `app/(admin)/(operation)/users/create-consultant.tsx` | 상담사 등록 |
| `app/(admin)/(operation)/users/create-staff.tsx` | 스태프 등록 (ADMIN) |
| `src/api/hooks/useAdminScheduleMutations.ts` | 일정 create mutation + invalidate |
| `src/api/hooks/useAdminMappings.ts` | 매칭 목록 (Sprint 1b) |
| `src/api/hooks/useAdminMappingCreate.ts` | 매칭 create mutation (Sprint 1b) |
| `src/constants/adminScheduleRegisterCopy.ts` | 일정 등록 카피 |
| `src/constants/adminMappingCreateCopy.ts` | 매칭 생성 카피 (Sprint 1b) |

**기술 전제 (구현 위임 시 필수)**

- `useAdminApiQueryReady` · `useAdminApiTenantSync` · `sessionCookie` / Bearer — [`EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md`](./EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md) §5  
- 표시: `toDisplayString` / `safeDisplay` — [`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`](./COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md)  
- **오프라인**: Sprint 1 — 등록·변경은 **네트워크 필수**(실패 시 재시도 UX). 오프라인 큐는 Sprint 3 검토.

---

## 8. 비범위·리스크

| 리스크 | 완화 |
|--------|------|
| 회기 0·매칭 없음으로 생성 실패 | 웹과 동일 서버 메시지 + 「목록 새로고침」안내 (`ScheduleModal` parity) |
| `SCHEDULE_CREATE` vs `/consultant` 경로 혼동 | endpoints 상수 분리·코드리뷰 |
| STAFF에 상담사 등록 UI 노출 → 403 | `CONSULTANT_MANAGE` 게이트 (웹 `PermissionCheckUtils`) |
| 가예약·선결제 불일치 | Sprint 1b 전 [`INTEGRATED_SCHEDULE_...`](./INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) Phase 1 게이트 참조 |
| Android tenant 미 hydrate | 기존 `retryAdminApiSession`·Maestro 스모크 유지 |
| FullCalendar·ERP 결제 모달 전체 복제 | **명시적 비범위** — CTA로 웹 `getAdminWebUrl` 통합 스케줄·매칭 결제 |
| 매칭 5스텝 Step 4 과다 입력 | 안 A 유지, BadgeSelect·기본값·reference 자동생성으로 웹 parity |
| `mappingId` prefill 미구현 | Sprint 1b **블로커** — `create.tsx` TODO 제거 조건에 포함 |
| 하드코딩 카피·색상 | 운영 반영 전 토큰·상수 — §17 [`ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md`](./ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md) |

---

## 9. 인벤토리 요약 (explore 대체 — 2026-05-18)

### 백엔드

| 항목 | 위치 |
|------|------|
| 일정 생성 | `ScheduleController#createConsultantSchedule` — `POST /api/v1/schedules/consultant` |
| DTO | `ScheduleCreateRequest.java` |
| 도메인 | `ScheduleServiceImpl#createConsultantSchedule*` |
| 내담자·상담사·스태프 | `AdminController` — `/api/v1/admin/clients|consultants|staff` |
| 권한 | `DynamicPermissionServiceImpl#canRegisterScheduler` |

### Expo (현재)

| 항목 | 위치 |
|------|------|
| 오늘 일정 조회 | `useAdminSchedules.ts`, `schedule.tsx` |
| 엔드포인트 | `endpoints.ts` — `SCHEDULE_API`, `ADMIN_MOBILE_API.USER_MANAGEMENT` |
| 사용자 조회 | `useAdminUserManagement.ts`, `users.tsx` |
| 일정 등록 | `schedule/create.tsx` (Sprint 1) |
| 매칭 목록·생성 | **Sprint 1b** — `mappingId` prefill TODO |
| 내담자 예약 mutation 참고 | `useBooking.ts` — **경로 다름**, 복사 금지 |

### 웹

| 항목 | 위치 |
|------|------|
| 일정 모달 | `frontend/src/components/schedule/ScheduleModal.js` |
| 통합 스케줄 | `IntegratedMatchingSchedule.js` |
| 매칭 생성 모달 | `MappingCreationModal.js` — 5스텝, `POST /api/v1/admin/mappings` |
| 스케줄 페이지 | `SchedulePage.js` |

---

## 10. 분배실행 표 (구현 전 사용자 승인용)

### Sprint 1 — 일정 등록·사용자 추가

| Phase | subagent | model | 산출물 | 전달 프롬프트 요약 |
|-------|----------|-------|--------|-------------------|
| **0** | `explore` | default | API 계약 보강표·공통코드(상담유형·duration) 조회 경로 | §4.1~4.3 필드 검증, 피커 GET, JWT·`X-Tenant-ID` |
| **1** | `core-designer` | **gemini-3.1-pro** | 일정 4스텝·사용자 create 3종 화면설계 | §5·§6, [`ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md) 갱신 |
| **2** | `core-coder` | default | `schedule/create`·user create·POST 일정 | §7 Sprint 1 행, METRO 핸드오프 §5, 표시 경계 |
| **3** | `core-tester` | default | Sprint 1 스모크·Jest·Maestro | §10 Sprint 1 완료 기준 |

### Sprint 1b — 신규 매칭·통합 스케줄 허브 (Sprint 1 **게이트 통과 후**)

| Phase | subagent | model | 산출물 | 전달 프롬프트 요약 |
|-------|----------|-------|--------|-------------------|
| **1b-0** | `explore` | default | `POST /api/v1/admin/mappings` body·응답·공통코드 `CONSULTATION_PACKAGE` 경로 표 | §4.4, `MappingCreationModal.js`, `ConsultantClientMappingCreateRequest` |
| **1b-1** | `core-designer` | **gemini-3.1-pro** | **허브 IA**·세그먼트·FAB 시트·매칭 카드·**5스텝** 와이어 | §5B.2~5B.3, 안 A 확정, Step 5 CTA·웹 fallback 카피, ADMIN/STAFF |
| **1b-2** | `core-coder` | default | `schedule/index` 허브·`mapping/create`·hooks·prefill | §5B.4~5B.5, `mappingId` TODO 제거, `adminMappingCreateBody` 테스트 |
| **1b-3** | `core-tester` | default | 1b 스모크·Maestro(허브·신규 매칭·prefill 일정) | §5B.6 체크리스트 |
| **병렬** | **1b-0 ∥ 1b-1** (API 표 확정 후 **1b-2**) | | | |

**완료 기준 — Sprint 1**

- [ ] ADMIN: 내일 날짜 일정 1건 등록 → 목록에 표시  
- [ ] STAFF: 동일 + 가예약 1건 또는 토글 OFF 일반 등록  
- [ ] 등록 스텝에서 내담자 신규 생성 → 동일 플로우에서 선택  
- [ ] ADMIN: 스태프 1명 등록 (dev)  
- [ ] `npm run test:utils` + admin Jest  
- [ ] Android dev APK 스모크 — [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md)

**완료 기준 — Sprint 1b** (§5B.6와 동일)

- [ ] 신규 매칭 5스텝 → 목록 반영  
- [ ] 매칭에서 일정 Step 3 prefill 등록  
- [ ] 입금 확인은 웹 CTA만  
- [ ] Maestro·Jest `adminMappingCreateBody`  

---

## 11. 실행 요청문 (부모 에이전트용)

### Sprint 1

1. 사용자에게 **§11.1 한 장 요약** 승인.  
2. **Phase 0** `explore` + **Phase 1** `core-designer` (`gemini-3.1-pro`) 병렬.  
3. **Phase 2** `core-coder` — 일정 등록 + 사용자 create.  
4. **Phase 3** `core-tester` 게이트 ([`CORE_PLANNER_DELEGATION_ORDER.md`](./CORE_PLANNER_DELEGATION_ORDER.md)).

### Sprint 1b (Sprint 1 게이트 후)

1. 사용자에게 **§11.2 한 장 요약** 승인 (5스텝 안 A·웹 결제 fallback).  
2. **1b-0** `explore` + **1b-1** `core-designer` (`gemini-3.1-pro`) 병렬.  
3. **1b-2** `core-coder` — 허브·매칭 생성·`mappingId` prefill.  
4. **1b-3** `core-tester` — §5B.6.

### 11.1 Sprint 1 한 장 요약

모바일 **일정 등록 4스텝** + 등록 중 **내담자/상담사/스태프(ADMIN)** 최소 생성. API는 웹 `ScheduleModal`·`AdminController`와 동일. ERP·FullCalendar·매칭 생성은 **하지 않음**.

### 11.2 Sprint 1b 한 장 요약

`schedule/index`를 **일정+매칭 허브**로 — 세그먼트·FAB(「일정 등록」「신규 매칭」). 웹 `MappingCreationModal`과 동일 **5스텝·POST mappings**. 매칭 카드→**일정 Step 3 prefill**. **입금·ERP 결제 확인**은 네이티브 없이 **웹 통합 스케줄** 링크. 캘린더 2열·DnD·`MappingPaymentModal` UI는 비범위.

---

## 12. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-18 | 1차 제품 기획·API SSOT·분배실행표 작성 |
| 2026-05-18 | **Sprint 1b** §5B 신규 매칭·통합 허브 IA·5스텝(안 A)·§4.4·§10 분배표 갱신 |
| 2026-05-18 | **1c: 결제 승인 웹 브릿지** — 진행중 ([`ADMIN_MOBILE_MAPPING_PAYMENT_APPROVAL_ORCHESTRATION.md`](./ADMIN_MOBILE_MAPPING_PAYMENT_APPROVAL_ORCHESTRATION.md)) |
