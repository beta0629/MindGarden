# Admin Mobile — 일정 등록 Step 3 UX 개선 (기획·디자이너 회의)

**작성일**: 2026-05-18  
**작성자**: core-planner (기획·디자이너 합의 기록)  
**상태**: **합의 SSOT** — `core-designer` 상세 스펙 → `core-coder` 구현 배치  
**선행 문서**: [`ADMIN_MOBILE_SCHEDULE_REGISTER_ORCHESTRATION.md`](./ADMIN_MOBILE_SCHEDULE_REGISTER_ORCHESTRATION.md), [`ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md)  
**웹 parity 참고**: `frontend/src/components/schedule/TimeSlotGrid.js`, [`docs/design-system/SCHEDULE_MODAL_STEP3_STEP4_ATOMIC_SPEC.md`](../design-system/SCHEDULE_MODAL_STEP3_STEP4_ATOMIC_SPEC.md)  
**코드 현황(조사만, 본 문서에서 수정 없음)**: `expo-app/app/(admin)/(operation)/schedule/create.tsx`, `expo-app/src/components/molecules/AdminScheduleTimeSlotPicker.tsx`, `expo-app/src/api/hooks/useConsultantSchedulesByDate.ts`

---

## 0. 회의 요약

| 항목 | 합의 |
|------|------|
| **핵심 문제** | 예약(일정 등록) Step 3에서 **선택한 날짜·상담사의 기존 일정이 화면에 보이지 않아** 겹침·공백 파악이 어렵다. |
| **부가 피드백** | 구버전 APK/Metro 빌드에서는 **시간 직접 입력(TextInput)** UX가 남아 있을 수 있음. `develop`에는 슬롯 칩 그리드(`AdminScheduleTimeSlotPicker`, 커밋 `919c98904` 계열)가 있으나 **「기존 일정」목록 UI는 미구현**. |
| **제품 방향** | 웹 `TimeSlotGrid`와 동일 인지 모델: **기존 일정을 먼저 읽고 → 상담 시간(분) 선택 → 점유 슬롯은 비활성 → 칩으로 시작 시각 선택 → 선택 요약**. |
| **다음 단계** | 본 문서 §3 IA 확정 → **core-designer** 모바일 Step 3 상세 스펙 → **core-coder** P0 구현 → **core-tester** Maestro/수동 시나리오. |

---

## 1. 문제 정의

### 1.1 사용자 관점

- **누가**: ADMIN·STAFF (현장·이동 중 일정 등록)
- **무엇을**: 일정 등록 4스텝 폼 **Step 3 (날짜·시간)**
- **불편**:
  1. 해당 상담사·날짜에 **이미 잡힌 일정 목록이 보이지 않음** → 슬롯 그리드만으로는 “누구와 몇 시에 겹치는지” 맥락이 부족.
  2. (일부 빌드) **시작/종료 시각 직접 입력** → 오타·형식 오류·겹침 사전 인지 어려움.
  3. 슬롯이 전부 비활성일 때 **왜 불가한지**(기존 예약·휴무·과거) 설명이 약함.

### 1.2 시스템 관점 (현재 develop 조사)

| 영역 | 현황 | 갭 |
|------|------|-----|
| API | `GET /api/v1/schedules/consultant/{id}/date?date=` — `useConsultantSchedulesByDate` | ✅ 조회·충돌용 `occupiedRanges` 사용 중 |
| 슬롯 그리드 | `AdminScheduleTimeSlotPicker` + `scheduleTimeSlotConflict` | ✅ 점유 슬롯 비활성(웹과 유사) |
| **기존 일정 리스트** | 웹 `TimeSlotGrid` § `mg-v2-ad-ts__existing-*` | ❌ 모바일 UI **미노출** |
| 파싱 필드 | `id`, `startTime`, `endTime`, `status`, `statusCode`만 정규화 | ⚠️ 제목·내담자명 등 표시용 필드 **확장 필요 여부** — 구현 시 API 응답 샘플 확인(explore) |
| 구 디자인 핸드오프 | Step 3 = TimePicker 2개 | ⚠️ **문서·구현 불일치** — 본 회의 IA로 핸드오프 §3.2 갱신 대상 |

### 1.3 비범위 (본 배치)

- Step 4(상담 유형·가예약) 구조 변경
- 일정 **수정**·FullCalendar·ERP 결제 네이티브
- 상담사별 영업시간·휴가 UI 전면 재설계(웹 `loadConsultantInfo` 수준) — P2 백로그

---

## 2. 목표·성공 기준

### 2.1 목표

1. Step 3에서 **선택한 날짜의 해당 상담사 기존 일정**을 스크롤 가능한 리스트로 **항상 노출**(데이터 있을 때).
2. **상담 시간(분)** 변경 시 슬롯 그리드·종료 시각 요약이 **즉시 재계산**되고, 점유 구간과 **시각적으로 정합**.
3. 웹 `TimeSlotGrid`와 **동일 API·동일 충돌 규칙** 유지(취소·완료 등 목록 제외 규칙 포함).
4. 매칭 카드 **「이 매칭으로 일정 잡기」** 진입 시 Step 3 prefill 흐름 **유지·강화**.

### 2.2 성공 기준 (UAT)

- [ ] 상담사·날짜 선택 후 Step 3 진입 시 **기존 일정 1건 이상**이면 리스트에 시간대·라벨 표시.
- [ ] 기존 일정 시간대와 겹치는 슬롯은 **선택 불가**(칩 비활성) + 리스트와 **시각적으로 대응** 가능.
- [ ] 날짜 ◀▶ 또는 YMD 변경 시 리스트·그리드 **동시 갱신**(로딩/에러 상태 명확).
- [ ] 슬롯 선택 후 **시작·종료 요약** 한 블록에 표시 → Step 4로 진행.
- [ ] `mappingId` prefill: Step 3 진입, 상담사·내담자 고정, 날짜 기본값(오늘 또는 `dateYmd` 쿼리) 동작.
- [ ] STAFF: 가예약 토글은 Step 4 유지; Step 3 권한 차이 **없음**.

---

## 3. Step 3 정보 구조(IA) — 합의안

**스텝 타이틀**: `날짜·시간` (기존 `ADMIN_SCHEDULE_REGISTER_COPY.STEP_DATETIME` 유지 가능)

**세로 스크롤 단일 컬럼 순서** (위 → 아래):

| 순서 | 블록 | 역할 | 비고 |
|:----:|------|------|------|
| A | **날짜** | `◀` YYYY-MM-DD `▶` + (선택) 직접 입력 | 상담사·날짜 변경 시 B~E refetch |
| B | **이 날짜의 기존 일정** | 선택 상담사·`dateYmd` 기준 리스트 | 웹 “기존 스케줄” 박스 parity; **0건이면 EmptyState 한 줄** |
| C | **상담 시간(분)** | 공통코드 duration 칩 | 변경 시 선택 슬롯 **초기화** (현행 동작 유지) |
| D | **시작 시간 슬롯 그리드** | 30분 칩 + 범례(가능/예약됨/과거) | 점유는 API 기반; 직접 시각 TextInput **금지(신규 기준)** |
| E | **선택 요약** | `시작 HH:mm · 종료 HH:mm · N분` | 미선택 시 안내 문구 |

### 3.1 블록 B — 기존 일정 리스트 (웹 정합)

**웹 SSOT** (`TimeSlotGrid.js`):

- `loadExistingSchedules` → 동일 GET 엔드포인트.
- 표시 필터: `isScheduleShownInExistingBookingsList` — **취소·완료·AVAILABLE 제외**.
- 항목: `startTime - endTime` + `title` 또는 `상담사 - 내담자` fallback.

**모바일 합의**:

- 블록 제목 카피(상수화): 예) `이 날짜의 기존 일정` / 영문 키 `LABEL_EXISTING_SCHEDULES`.
- 항목: **시간(굵게)** + **라벨 1줄**(말줄임). 상태 배지는 P1(가예약·확정 등).
- 리스트는 **읽기 전용**; 탭 시 상세 화면 이동은 P2.
- 로딩: 스켈레톤 또는 인라인 `ActivityIndicator`. 실패: 재시도(슬롯 그리드와 동일 패턴).

### 3.2 블록 D·E — 슬롯·요약

- `AdminScheduleTimeSlotPicker`를 **D+E 컨테이너**로 유지하거나, **B는 `create.tsx`**, D·E는 피커 — 컴포넌트 분리는 **core-component-manager + 코더** 판단(P1).
- `availableCount === 0`일 때: EmptyState + **블록 B가 비어 있지 않으면** “기존 일정을 참고해 다른 날짜를 선택하세요” 보조 문구(core-designer 문안).

### 3.3 구버전 APK / Metro 이슈

| 구분 | 처리 |
|------|------|
| **신규 SSOT** | Step 3 = 슬롯 칩만 (직접 시각 입력 제거) |
| **구 APK** | 스모크·Maestro는 **최신 dev APK 재설치** 후 검증 — [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) |
| **문서** | [`ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md) §3.2 Step 3 와이어프레임을 **본 IA로 교체** (designer 산출물에 포함) |

---

## 4. 역할·진입 경로 (ADMIN vs STAFF · mapping prefill)

### 4.1 ADMIN vs STAFF

| 항목 | ADMIN | STAFF |
|------|-------|-------|
| Step 3 IA | 동일 (A→E) | 동일 |
| 가예약 | Step 4 토글 | Step 4 토글 (동일) |
| 검수 탭 | 노출 | **숨김** (Phase 1 원칙) |
| 상담사 신규 등록 링크 | `CONSULTANT_MANAGE` 시 | 동적 권한 동일 |

### 4.2 Deep link / prefill (`schedule/create`)

| 쿼리 | 동작 |
|------|------|
| `mappingId` | 매칭 조회 → 상담사·내담자 세팅 → **step=3** |
| `consultantId` + `clientId` | 각각 Step 1·2 스킵 가능 → **step=3** |
| `dateYmd` | Step 3 날짜 초기값 |
| `step` | 1~4 (유효 범위 클램프) |

**진입 예** (`schedule/index.tsx`): `pathname: schedule/create`, `mappingId`, (선택) `dateYmd`.

**회의 합의**: prefill 후에도 Step 3에서 **날짜·상담사 변경 가능** — 변경 시 B·D refetch. 단, mapping 진입 직후 상담사는 Step 1로 돌아가 수정 가능(현행 유지).

---

## 5. 사용성·정보 노출·레이아웃 (디자이너 전달용)

### 5.1 사용성

- **읽기 → 선택**: 기존 일정을 **먼저** 보여 충돌 맥락을 준 뒤 슬롯을 고른다.
- **한 손 스크롤**: A~E 단일 `ScrollView`; 하단 고정 [이전][다음] 유지.
- **실수 방지**: duration 변경 시 선택 초기화 + 요약 갱신.

### 5.2 정보 노출

- 리스트: **시간 + 제목/참가자** (PII는 기존 일정 목록·웹과 동일 수준).
- 취소·완료 일정: 리스트·점유 **모두 제외**(웹 `isScheduleShownInExistingBookingsList` parity).
- 휴무 상담사: Step 1 배지로 이미 안내; Step 3 슬롯 전부 불가 시 B와 연계 메시지.

### 5.3 레이아웃(모바일)

- 블록 간격: 앱 `theme.spacing.md` 기준.
- 기존 일정: **카드 리스트** 또는 **얇은 구분선 리스트** (플래시리스트 불필요, 1일 최대 수십 건).
- 슬롯 그리드: 현행 3열 칩 유지; designer가 터치 타깃 44pt 이상 확인.

**산출물 경로(디자이너)**: 본 문서 확정 후  
`docs/design-system/ADMIN_MOBILE_SCHEDULE_CREATE_STEP3_SPEC.md` (신규 권장)  
또는 [`ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md) §3.2 개정.

---

## 6. 분배실행

| Phase | 담당 | 병렬 | 목표 |
|-------|------|:----:|------|
| **P0-D** | **core-designer** (`model: gemini-3.1-pro` 권장) | — | Step 3 A~E 와이어·컴포넌트 계층·카피·상태(로딩/빈/에러)·토큰 |
| **P0-C** | **core-coder** | designer 완료 후 | B 블록 + 파서/필터 + 핸드오프 §3.2 반영 |
| **P0-T** | **core-tester** | P0-C 후 | 회귀·Maestro Step 3·mapping prefill |
| **P1** | component-manager → coder | 병렬 가능 | 피커/리스트 컴포넌트 분리·재사용 |
| **P2** | 기획 백로그 | — | 리스트 탭→상세, 휴가·영업시간 고도화 |

---

## 7. core-designer 위임 프롬프트

```
역할: core-designer
model: gemini-3.1-pro (권장)

과제: Admin Mobile 일정 등록 Step 3 UX 상세 스펙

필수 읽기:
- docs/project-management/ADMIN_MOBILE_SCHEDULE_CREATE_UX_MEETING.md (본 문서, SSOT)
- docs/design-system/SCHEDULE_MODAL_STEP3_STEP4_ATOMIC_SPEC.md (웹 TimeSlotGrid·기존 스케줄 블록 의미만 참고, CSS 클래스는 웹 전용)
- docs/project-management/ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md §2 권한, §3.2 Step 3 교체 대상

설계 범위:
- Step 3 IA: 날짜 → 이 날짜의 기존 일정 리스트 → 상담 시간(분) 칩 → 슬롯 그리드 → 선택 요약
- 상태: 로딩, 0건, API 오류, 슬롯 전부 불가, duration 변경 후 선택 초기화
- ADMIN/STAFF 동일 UI; mappingId prefill 시 상단 컨텍스트(상담사·내담자 이름) 표시 여부 결정
- 카피 키 제안 목록 (adminScheduleRegisterCopy.ts 확장안)
- 아토믹: AdminExistingSchedulesList(가칭), AdminScheduleTimeSlotPicker, TimeSlotChip — 계층·props 경계만 (코드 작성 없음)

제약:
- 직접 시각 TextInput UX는 신규 SSOT에서 제외(슬롯 칩만)
- safeDisplay·역할별 PII는 기존 어드민 모바일 수준 준수
- 코드·CSS 파일 수정 없음

산출물:
- docs/design-system/ADMIN_MOBILE_SCHEDULE_CREATE_STEP3_SPEC.md (신규)
  또는 ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md §3.2 개정본
- core-coder 전달용: 블록별 spacing, 타이포, 배지, EmptyState 문안, 스크린샷 와이어(ASCII 가능)

완료 기준:
- A~E 블록 순서·상호작용이 문서화됨
- 웹 TimeSlotGrid “기존 스케줄”과 필드·필터 의미가 1:1 대응표로 명시됨
```

---

## 8. core-coder 구현 체크리스트 (P0 / P1)

> 상세 UI는 **designer 산출물 확정 후** 착수. 아래는 기획 게이트용 최소 범위.

### P0 (필수 — 본 회의 목표)

- [ ] **기존 일정 리스트 UI (블록 B)**  
  - `create.tsx` Step 3에 배치 (날짜 아래, duration 위).  
  - 데이터: `useConsultantSchedulesByDate(consultantId, dateYmd)` — Step 3·4 공용 쿼리 재사용.
- [ ] **표시 필터 웹 parity**  
  - `isScheduleShownInExistingBookingsList` 동등 로직을 `expo-app` utils에 포팅 (`scheduleTimeSlotConflict` 또는 `schedule.js` 상수 정합).  
  - 취소·완료·AVAILABLE 제외.
- [ ] **응답 파싱 확장**  
  - API 실측 후 `title`, `clientName`, `consultantName` 등 표시 필드 `parseConsultantSchedulesByDateResponse` 확장.  
  - 없으면 `HH:mm–HH:mm` + `—` fallback (`toDisplayString`).
- [ ] **카피 상수화**  
  - `adminScheduleRegisterCopy.ts`: `LABEL_EXISTING_SCHEDULES`, `EMPTY_EXISTING_SCHEDULES`, `EXISTING_SCHEDULES_LOADING` 등.
- [ ] **날짜/상담사 변경 시** 리스트·슬롯 **동시 invalidation/refetch** (기존 `dateYmd`·`consultant` 의존성 확인).
- [ ] **선택 요약 (블록 E)**  
  - 슬롯 선택 시 시작·종료·분 명시; Step 4 진입 전 검증 유지 (`validateAdminScheduleTimeSelection`).
- [ ] **구 핸드오프 정합**  
  - TimePicker 2개 설명 제거; 본 IA 반영.
- [ ] **테스트**  
  - `scheduleTimeSlotConflict`·파서 단위 테스트; mapping prefill·리스트 필터 케이스.

**참조 표준**:  
`docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`,  
`docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` (expo-app 수정 시 §5),  
`/core-solution-frontend`, `/core-solution-multi-tenant`.

### P1 (권장 — 다음 스프린트)

- [ ] `AdminExistingSchedulesList` molecule 추출 + **core-component-manager** 중복 검토.
- [ ] 기존 일정 항목 **상태 배지**(가예약·확정) — designer 스펙 반영 후.
- [ ] 슬롯 전부 불가 시 **블록 B 연계** 보조 카피.
- [ ] `AdminScheduleTimeSlotPicker`와 B의 **단일 로딩/에러** UX 통합.
- [ ] Maestro: Step 3 기존 일정 노출 assert, 날짜 변경 refetch.

### P2 (백로그)

- [ ] 리스트 항목 탭 → 일정 상세(읽기 전용).
- [ ] 상담사 영업시간·휴가 API 반영(웹 `consultantInfo` 수준).
- [ ] 주간 캘린더 미니맵.

---

## 9. core-tester 위임 요약 (P0-C 후)

```
역할: core-tester

시나리오:
1. ADMIN: schedule/create Step 3 — 기존 일정 2건 이상인 날짜 → 리스트 노출 → 겹치는 슬롯 비활성
2. 날짜 변경 → 리스트·그리드 갱신
3. mappingId 진입 → Step 3, 상담사·내담자 prefill, 일정 등록 POST 성공
4. STAFF: 동일 Step 3 (가예약은 Step 4)
5. API 실패 시 재시도 UI

도구: expo-app 단위 테스트 + (가능 시) .maestro admin-mvp-smoke 일정 등록 확장
완료: P0 체크리스트 전항 통과 보고
```

---

## 10. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| API 응답에 `title`/`clientName` 없음 | explore로 샘플 확인; fallback 라벨; 필요 시 백엔드 DTO 확장 별도 배치 |
| 구 APK 스모크 실패 | dev APK 재빌드·설치 문서화 |
| 이중 fetch (create + picker) | React Query 동일 queryKey 공유로 dedupe |
| 하드코딩 카피 | 운영 게이트 전 상수 파일만 사용 |

---

## 11. 문서·코드 추적

| 문서/코드 | 조치 |
|-----------|------|
| `ADMIN_MOBILE_SCHEDULE_REGISTER_DESIGN_HANDOFF.md` §3.2 | designer 개정 |
| `SCHEDULE_MODAL_STEP3_STEP4_ATOMIC_SPEC.md` | 웹 참고만, 모바일은 신규 spec |
| `create.tsx` Step 3 | P0-C |
| `AdminScheduleTimeSlotPicker.tsx` | D·E, 점유 로직 유지 |
| `useConsultantSchedulesByDate.ts` | 파싱·타입 확장 |

---

## 12. 실행 요청 (부모 에이전트)

1. **즉시**: `core-designer` — §7 프롬프트, `model: gemini-3.1-pro`.  
2. **designer 산출물 확정 후**: `core-coder` — §8 P0.  
3. **P0 merge 전**: `core-tester` — §9.

**본 문서는 코드 수정 없이 기획·디자이너 합의 SSOT로 유지한다.**
