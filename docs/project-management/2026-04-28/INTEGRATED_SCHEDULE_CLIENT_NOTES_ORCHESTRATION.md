# 통합 스케줄 — 내담자 특이사항·메모 CRUD 오케스트레이션

**작성일**: 2026-04-28  
**개정**: 2026-05-04 (§1.1 [캘린더 CSS 아키텍처](./INTEGRATED_SCHEDULE_CALENDAR_CSS_ARCHITECTURE_ORCHESTRATION.md) 교차 링크: 스코프·토큰·공휴일 시각 위임) · 2026-05-05 (§12.1 표 B8 비고: [e2e-integrated-schedule-smoke.yml](../../../.github/workflows/e2e-integrated-schedule-smoke.yml)·PR paths 변경 시 해당 job 실행) · 2026-05-04 (§13 CI 연결 단계: 병렬 준비·실행·참조 워크플로·완료 보고 경로) · 2026-05-04 (§1 범위 표: [KR 공휴일 SSOT](./INTEGRATED_SCHEDULE_KR_HOLIDAYS_ORCHESTRATION.md) 교차 링크) · 2026-05-04 (§10·§12.2: 월간 미해소 인디케이터 1차 구현 문서 동기화) · 2026-04-28 (코드 앵커 검증·정책 보강·구현·검증 체크리스트 추가)  
**주관**: core-planner  
**상태**: **구현 준비** (코드 변경은 **core-coder** 위임, 검증은 **core-tester**)

---

## 1. 한 페이지 요약

### 목표

「통합스케줄관리」(`/admin/integrated-schedule`)에서 **내담자 스케줄(캘린더 이벤트)을 클릭**하면 해당 내담자의 식별 정보와 **특이사항(메모)**을 확인하고, 관리자·스텝이 **기록·수정·삭제(CRUD)** 할 수 있게 한다. 예: 이번 주 상담비를 며칠 뒤에 받기로 한 약속 등 — **처리 누락 방지**가 핵심 가치다.

### 범위 (In / Out)

| 구분 | 내용 |
|------|------|
| **In (1차)** | 통합 스케줄 UI 앵커(`IntegratedMatchingSchedule.js` → `UnifiedScheduleComponent` → 이벤트 클릭 시 **`ScheduleDetailModal`**)에서 **내담자 맥락의 특이사항** CRUD, 멀티테넌트·역할(ADMIN/STAFF), 표시 경계·React #130 준수, 운영 반영 전 하드코딩·게이트. 신규 API는 프론트에서 **`StandardizedApi`** 로만 호출(스케줄 도메인 내 `ajax` 혼용 지양). |
| **Out (1차)** | 내담자 포털(본인) 노출, 결제/ERP 자동 연동, 푸시·알림 전용 채널, 일반 `AdminSchedulesPage` 전면 개편. |
| **KR 공휴일(SSOT)** | 캘린더 **관공서 공휴일 배경 레이어**(P2)·연도·소스·확장 위임 → [INTEGRATED_SCHEDULE_KR_HOLIDAYS_ORCHESTRATION.md](./INTEGRATED_SCHEDULE_KR_HOLIDAYS_ORCHESTRATION.md). |
| **§1.1 캘린더 CSS·시각** | FullCalendar **다파일 충돌·스코프·토큰·`!important`** 는 데이터 SSOT와 분리 → [INTEGRATED_SCHEDULE_CALENDAR_CSS_ARCHITECTURE_ORCHESTRATION.md](./INTEGRATED_SCHEDULE_CALENDAR_CSS_ARCHITECTURE_ORCHESTRATION.md) (문제 요약·소스 맵·위임 순서·완료 조건). |
| **Phase 2 (후보)** | 통합 스케줄 **월간** 미해소 **도트·건수 표시(1차)**는 §12.2·10절 정리대로 **본 에픽에 동기화**됨. 그 외 **전역 배지·주간/일간 동등 강화·“이번 주 약속” 필터·대시보드 위젯** 등은 별도 스펙(아래 10절). |

### 성공 기준

- 통합 스케줄에서 **이벤트 클릭 → `ScheduleDetailModal` 맥락**에서 특이사항 목록·작성/수정/삭제(소프트 삭제 시 목록 정책 포함)가 완결된다.
- API는 **`/api/v1/`** 하위, **`tenantId` 필수**, ADMIN/STAFF 쓰기(삭제·타인 메모 수정 권한은 9절 결정에 따름).
- UI는 **Admin B0KlA**, **`UnifiedModal`** 표준에 정합(상세 모달 **내부 탭 또는 단일 본문 확장** 권장, 불필요한 2중 모달 지양).
- **core-tester**: 아래 12절 체크리스트 전부 통과, 콘솔 #130·크리티컬 0건.
- **네트워크(§12·B5 정합)**: 통합 스케줄·특이사항 검증 구간에서 **의도치 않은 4xx/5xx 네트워크 패턴 없음**(의도된 권한·유효성 응답은 제외).
- **[운영 반영 체크리스트](docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)** 및 하드코딩 게이트.

---

## 2. 가상 서브에이전트 회의록

**회의 주관**: core-planner  
**참석 관점**: core-designer, core-component-manager, core-coder, core-tester (가상 합의)

### core-planner

- **「누가·무엇을·언제까지」**가 특이사항 한 건에 드러나도록 `promiseDate`, `noteType`, 제목/본문을 1차에 넣는다.
- 구현은 **core-coder** 단일 창구; 본 문서의 **8~12절**을 착수 전 필독으로 삼는다.
- **이견 조정**: 이벤트 클릭 UX는 기존 **`ScheduleDetailModal`**(이미 `UnifiedModal` 사용)을 **확장하는 것이 1순위** — 새 전용 모달을 또 띄우면 `selectedSchedule`·z-index·접근성 부담이 커진다.

### core-designer

- B0KlA 톤, **빈 목록 / 로딩 / API 에러 / clientId 없음** 상태의 와이어를 1차에 포함한다.
- **휴가 이벤트** 클릭 시에는 특이사항 CRUD **비표시 또는 비활성** UI를 시안에 포함한다.

### core-component-manager

- **검증된 앵커**(8절): `UnifiedScheduleComponent.js`의 `handleEventClick` → `ScheduleDetailModal`. `ScheduleModal`은 **날짜 클릭 후 신규 스케줄 등록** 등과 연계되므로 **이벤트 클릭 흐름 문서에 단독 적지 않는다**(혼동 방지).
- 기존 `ScheduleDetailModal`의 **「예약 확정」 확인용 `adminNote` 텍스트영역**은 **일회성 입금 확인 메모** 성격이므로, 신규 **지속 특이사항 엔티티**와 **UI·카피·API 모두 분리**한다.

### core-coder

- 신규·변경 API 호출: **`StandardizedApi`**, `tenantId` 누락 금지, 렌더는 [표시 경계](docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md).
- `clientId`가 이벤트에 없을 때의 분기(9절)를 백엔드·프론트 동시에 만족시키는 설계.
- `IntegratedMatchingSchedule`에서 `UnifiedScheduleComponent`로 넘기는 props(**`userId` 등**)가 스케줄 API와 맞는지 이번 배치에서 **회귀 확인**.

### core-tester

- E2E: 통합 스케줄 → 일반 예약 이벤트 클릭 → CRUD → 새로고침 후 지속성.
- **휴가 이벤트** 클릭 시 특이사항 영역 미노출 또는 비활성 확인.
- 타 테넌트·권한·#130 회귀는 12절 참조.

---

## 3. 정보 설계 초안 (특이사항 엔티티)

**엔티티명(가칭)**: `ClientScheduleNote` 등 — **core-coder**가 기존 네이밍·테이블 규칙에 맞춰 확정.

| 필드 | 타입(개략) | 설명 |
|------|------------|------|
| `id` | UUID / BIGINT | PK |
| `tenantId` | 문자열 | **필수** |
| `clientId` | FK, nullable 정책 가능 | 이벤트에 clientId 없을 때는 null + `mappingId` 등 대체 키 전략(9절) |
| `mappingId` | FK, nullable | 통합 매칭 화면에서 스케줄·매칭 연계 시 사용 |
| `scheduleId` | FK, nullable | 기존 `schedules` PK와 연계 시(이벤트 `extendedProps.id` 등과 정합) |
| `occurrenceKey` | 문자열, nullable | 반복 일정 도입 시 확장용 |
| `noteType` | 코드 | **가능하면 공통코드 그룹**으로 라벨 관리(하드코딩 문자열 라벨 지양). 예: `PAYMENT_PROMISE`, `ATTENDANCE`, `RISK`, `OTHER` |
| `title` | 짧은 문자열 | 목록 한 줄 |
| `body` | TEXT | 상세 |
| `promiseDate` | DATE, nullable | 약속 기한 |
| `amount` | DECIMAL, nullable | 사용 시 표시는 **기존 스케줄·ERP 화면과 동일한 표시 경계·마스킹 규칙**에 따름 |
| `currency` | 코드, nullable | |
| `createdBy` / `updatedBy` | 사용자 ID | |
| `createdAt` / `updatedAt` | 타임스탬프 | |
| `deletedAt` | 타임스탬프, nullable | **소프트 삭제 권장**; 목록에서 기본 제외 여부는 제품 정책으로 명시 |

### 감사·보존

- 소프트 삭제 + `updatedBy`/`updatedAt` 최소 충족. 운영 **보관 기간·파기**는 개인정보 처리방침·내부 규정에 맡기되, 구현 시 **삭제된 행 조회 API 노출 여부**만 명확히 한다.

---

## 4. UI/UX·디자인 방향

### 표준 정합

- 페이지: `IntegratedMatchingSchedule`는 `ContentArea`/`ContentHeader` 유지.
- **스케줄 이벤트 클릭 후**: 기존 **`ScheduleDetailModal`**(`UnifiedModal`, `AdminDashboardB0KlA.css`, `safeDisplay`)을 **확장** — **탭「상세 | 특이사항」** 또는 **본문 내 접이식 섹션** 중 택일(디자이너 시안 우선).
- **금지**: 커스텀 풀스크린 오버레이, `UnifiedModal` 우회 이중 모달(확인 모달·중첩 `UnifiedModal`은 기존 패턴만 허용).

### 패턴 비교 (참고)

| 방식 | 장점 | 단점 | 1차 |
|------|------|------|-----|
| 사이드 패널 | 캘린더와 동시 맥락 | 좁은 화면 가림 | Phase 2 검토 |
| **기존 상세 모달 확장** | 이미 `UnifiedModal`·포커스 트랩 존재 | 본문 길어짐 | **권장** |
| 별도 전용 모달 | 분리된 책임 | 상태·z-index 복잡 | 비권장(1차) |

---

## 5. API·백엔드 개요

- **베이스**: `/api/v1/`, 프론트는 **`StandardizedApi`**.
- **관리자 스케줄 목록(통합 월간 등)**: `GET /api/v1/schedules/admin` 응답의 **`clientScheduleNotesUnresolvedCount`**(§12.2)로 일정별 미해소 특이사항 건수를 내려준다.
- **테넌트**: 모든 경로·쿼리·바디에 tenant 격리.
- **권한**: ADMIN/STAFF; **타인 작성 메모 수정/삭제** 허용 여부는 제품 정책으로 단일 선택(9절).
- **예시(초안)**  
  - `GET /api/v1/admin/clients/{clientId}/schedule-notes?tenantId=...`  
  - `POST`, `PATCH`, `DELETE` 또는 소프트 삭제용 `PATCH`  
  - `clientId` 없이 `mappingId`+`scheduleId`만으로 조회하는 **보조 엔드포인트** 필요 시 별도 설계.
- **응답 매핑**: JSX 자식에 객체 직접 금지([COMMON_DISPLAY_BOUNDARY](docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md)).

---

## 6. 배치표 (다음 단계 — 담당·순서·완료 조건)

| 순서 | 담당 | 산출물 | 완료 조건 |
|------|------|--------|-----------|
| 1 | **core-designer** | `ScheduleDetailModal` 확장 와이어(탭 또는 섹션), 빈/에러/무clientId/휴가 | B0KlA·토큰·반응형 브레이크포인트 명시 |
| 2 | **core-publisher** (선택) | 마크업 | 코더가 컴포넌트화 가능 |
| 3 | **core-coder** | Flyway·Entity·API·`ScheduleDetailModal`(+필요 시 하위 organism) | 11절 체크리스트·하드코딩 게이트 |
| 4 | **core-tester** | 결과·로그 | 12절 전항목 |

**explore**: 착수 직전 `UnifiedScheduleComponent`·`ScheduleDetailModal`·이벤트 `extendedProps` 필드 인벤토리 0.5일 이내 권장.

---

## 7. 참조 문서 링크 (상대 경로)

- [core-planner 위임 순서·테스터 게이트](docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md)
- [공통 표시 경계·React #130](docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md)
- [운영 반영 전 체크리스트](docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)
- [디자인 시스템 README](docs/design-system/README.md)
- [디자인 시스템 v2 README](docs/design-system/v2/README.md)

---

## 8. 코드 앵커 및 문서 정정 (필독)

| 항목 | 경로·동작 |
|------|-----------|
| 통합 스케줄 페이지 | `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` |
| 캘린더·이벤트 클릭 | `frontend/src/components/schedule/UnifiedScheduleComponent.js` — `handleEventClick` → `setIsDetailModalOpen(true)` |
| 월간 미해소 인디케이터(1차) | `frontend/src/components/ui/Schedule/ScheduleCalendarView.js` — `integratedMonthEventLayout`·`clientScheduleNotesUnresolvedCount`·§12.2 |
| 스케줄 상세 모달 | `frontend/src/components/schedule/ScheduleDetailModal.js` — 이미 **`UnifiedModal`**, B0KlA, `toDisplayString` / `SafeText` 사용 |
| 신규 등록 모달 | `frontend/src/components/schedule/ScheduleModal.js` — **이벤트 클릭 CRUD 앵커 아님** |
| 기존 `adminNote` | `ScheduleDetailModal` 내 **예약 확정(입금 확인)** 플로우용 — 신규 특이사항과 **혼동 금지** |

---

## 9. 정책·결정 테이블 (구현 전 확정 권장)

| ID | 질문 | 권장안(기본값) | 비고 |
|----|------|----------------|------|
| P1 | 이벤트에 `clientId` 없음 | **mappingId·scheduleId로 노트 조회/작성** 가능하게 API 설계, UI에 **내담자 미연결 안내** | 백엔드 FK nullable과 일치 |
| P2 | 휴가 이벤트 클릭 | 특이사항 CRUD **숨김 또는 비활성** | `extendedProps.type === 'vacation'` 분기 |
| P3 | 타인 작성 메모 | **ADMIN 전부 / STAFF 본인만 수정·삭제** 등 단일 정책 문서화 후 API 강제 | 기존 스케줄 API 권한과 정합 |
| P4 | 소프트 삭제 목록 | 기본 목록에서 **제외**, “삭제됨 포함”은 ADMIN만 등 | 필요 시만 |
| P5 | `noteType` 라벨 | **공통코드** 연동 우선 | 운영 반영 시 하드코딩 검사 |

---

## 10. Phase 2 후보 (본 문서 범위 밖, 별도 에픽 가능)

- **월간 Dot = 1차 범위**: 통합 스케줄 월간 뷰에서 `clientScheduleNotesUnresolvedCount`로 **미해소 N건**을 표시하는 인디케이터는 **1차 구현·§12.2**에 반영됨(취소·휴가 이벤트는 강조 제외). 아래는 그 **외 확장**만 해당한다.
- 캘린더 **다중 타입 배지·주간/일간 뷰 동등 UX·임박 알림 연동** 등 추가 인디케이터.
- 특이사항 **“이번 주 만기” 필터** 또는 사이드 요약.
- 알림·슬랙 등은 별도 스펙.

---

## 11. 구현 준비 체크리스트 (core-coder 착수 전)

복사해 PR/이슈 본문에 사용 가능.

- [ ] 8절 파일 경로 열람, `handleEventClick`이 채우는 `scheduleData` 필드(`clientId`, `consultantId`, `id` 등) **실측**
- [ ] 9절 P1~P5 중 미결정 항목 **기획/운영과 1줄 결정** 후 본문에 기록
- [ ] DB 마이그레이션 네이밍·인덱스(`tenantId`+`clientId` 또는 `tenantId`+`scheduleId`) 초안
- [ ] API URL·DTO·권한 어노테이션 초안과 **기존 스케줄·매칭 컨트롤러** 충돌 여부 확인
- [ ] `ScheduleDetailModal` UI: **탭 vs 단일 섹션** 시안 확정(디자이너 산출물 또는 임시 와이어)
- [ ] 신규 프론트 호출 전부 **`StandardizedApi`**, 응답 필드 **문자열/숫자 매핑 후 렌더**
- [ ] `adminNote`(입금 확인)와 신규 특이사항 **필드·카피·API 분리** 설계 확인
- [ ] 휴가 클릭 시 분기 **단위 테스트 또는 스토리북** 최소 시나리오
- [ ] [운영 반영 체크리스트](docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 해당 항목 스캔

---

## 12. 검증 체크리스트 (core-tester)

- [ ] `/admin/integrated-schedule` 접속, **일반 예약** 이벤트 클릭 → 상세 모달에서 특이사항 **생성·수정·삭제(또는 소프트)** → 새로고침 후 **지속성**
- [ ] **휴가** 이벤트 클릭 → 특이사항 CRUD **미노출 또는 비활성**(9절 P2)
- [ ] `clientId` 없는 이벤트(또는 테스트 데이터)에서 **P1 정책**대로 동작·메시지
- [ ] 타 테넌트 `tenantId`·타 사용자 권한 **조작 시 403/404**
- [ ] **콘솔 #130·크리티컬 0건**, 네트워크 **4xx/5xx** 의도치 않은 패턴 없음
- [ ] 기존 **예약 확정·취소·상담일지** 플로우 **회귀** (동일 모달 내)
- [ ] 하드코딩 스캔·린트·백엔드 테스트(해당 시) CI 통과

### 12.1 Phase B 검증 표 (B1~B8, 커밋 `3aa6f6947` 기준)

| ID | §12 대응 항목 | 검증 방법(이번 배치) | 결과(2026-04-30) | 비고 |
|----|---------------|----------------------|------------------|------|
| **B1** | 일반 예약 → 상세 모달 특이사항 CRUD·새로고침 지속성 | E2E: `integrated-schedule-client-notes`·옵션 CRUD 스펙; 수동 동일 | **미실행** | Playwright 전부 `loginErpUser` 후 URL 전환 타임아웃(`/login` 고정). **블로커**: 백엔드(8080)·프록시·`E2E_*` 자격 또는 API 응답 실패 추정. CRUD 자동화는 `E2E_INTEGRATED_SCHEDULE_NOTES_CRUD=1` 시에만 DB 기록. |
| **B2** | 휴가 이벤트 → 특이사항 CRUD 미노출·비활성 | 수동 또는 휴가 일정이 앞선 캘린더 데이터 + E2E 스킵 메시지 확인 | **미실행** | 동일 로그인 블로커. 스펙은 탭 없으면 스킵(README·스펙 주석과 정합). |
| **B3** | `clientId` 없음 시 P1 동작·메시지 | 수동·테스트 데이터 | **미실행** | 전용 E2E 없음; 데이터 준비 필요. |
| **B4** | 타 테넌트·타 사용자 권한 403/404 | 수동·보안/통합 테스트 | **미실행** | 본 E2E 스위트 범위 밖. |
| **B5** | 콘솔 #130·크리티컬 0, 네트워크 비정상 패턴 없음 | E2E S5·`react130ConsoleGate`; LNB 콘솔 스모크 | **미실행** | 로그인 단계에서 중단. 게이트 구현은 `tests/e2e/helpers/react130ConsoleGate.ts`(커밋 포함). |
| **B6** | 예약 확정·취소·상담일지 등 동일 모달 회귀 | 수동 스모크 | **미실행** | 자동 스펙 없음. |
| **B7** | 하드코딩 스캔·린트·CI | 커밋 훅·CI | **부분** | 로컬 훅: `schedule.js` 완료색 hex → `var(--mg-secondary-400)`; `react130ConsoleGate.ts`는 `#130` 오탐 방지용 이스케이프 조합으로 정리됨(동일 런타임 매칭). CI 전체 녹색은 본 실행에서 미확인. |
| **B8** | Phase 1.1 E2E | `integrated-schedule-client-notes.spec.ts`의 `Phase 1.1: 미해소 아이콘이 있는 월간 일정 클릭 시 특이사항 탭 요약 배너 노출` 테스트; 미해소 아이콘 일정 없으면 스킵. | **로컬·환경 의존** | `erpAuth.skipWhenLocalBackend8080Down()`: 로컬(비 CI)에서 **8080 TCP 불가 시 beforeEach에서 스킵** → 연쇄 fail 완화. 8080+3000+README 자격 충족 후 재실행 시 통과·데이터 없음 스킵으로 **결과 열 갱신**. CI: [`.github/workflows/e2e-integrated-schedule-smoke.yml`](../../../.github/workflows/e2e-integrated-schedule-smoke.yml) — PR `paths` 변경 시 해당 job 실행. **2026-05-05**: core-tester — `ScheduleLegend.test.js` 추가·`build:ci`/관련 Jest 통과. E2E는 환경 미충족 시 전부 스킵 가능 유지. |

**미실행 행·재시도 전제(2026-04-30 core-tester 재확인)**: `localhost:3000` HTTP 200 확인, **`localhost:8080` 미기동**, **`E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` 미설정** → README 권장 3스펙은 **이번에 재실행하지 않음**(이전 기록: 로그인 후 전환 타임아웃 등 **6 failed** 참고). 다음 갱신: API **8080** + 프론트 **3000** + [`tests/e2e/README.md`](../../../tests/e2e/README.md)의 `E2E_TEST_*` 준비 후 동일 명령으로 `npx playwright test` 실행해 B1~B5, B8 **결과** 열을 갱신. 문서·**PR 설명**에는 Node/npm·Playwright 설치·`BASE_URL`·자격·**8080+3000 동시 기동**을 **환경 전제**로 명시할 것. 구현 머지 전 12절은 [위임 순서·테스터 게이트](docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md)에 따라 **core-tester** 통과를 전제로 한다.
**2026-05-04 추가**: B8(Phase 1.1 E2E) 항목도 다음 core-tester 재실행 시 함께 검증한다.

**Playwright(권장 명령, chromium)**: `cd tests/e2e && npx playwright test tests/admin/integrated-schedule-client-notes.spec.ts tests/admin/integrated-schedule-detail-modal.spec.ts tests/admin/admin-dashboard-lnb-console-smoke.spec.ts --project=chromium` → **6 failed**(원인 공통: 로그인 후 화면 전환 타임아웃, `erpAuth` 안내: API 기동·`BASE_URL`·프록시·자격 확인).

**옵션 `E2E_INTEGRATED_SCHEDULE_NOTES_CRUD=1`**: 이번 실행에서는 로그인 실패로 CRUD 본문 미도달; 기동·자격 확보 후만 선택 실행(DB 특이사항 행 생성).

**코더 후속(하드코딩 경고, 운영 게이트 전)**: 상기 B7·코드 반영 완료. 추가 스캔 경고 시 동일 원칙(토큰·E2E 헬퍼에 `#`+3~6 hex 리터럴 금지)으로 정리.

### 12.2 월간 캘린더 미해소 인디케이터 (1차 구현, 코드 기준 동기화)

- **목표**: 통합 스케줄 **월간** 캘린더에서 해당 일정에 **미해소(미처리) 내담자 특이사항**이 있음을 한눈에 알 수 있게 한다.
- **API 계약 (옵션 C, 이원 필드)**:
  - **`clientScheduleNotesUnresolvedCount`**: 해당 **일정 PK(`schedule_id`)에 직결**된 미해소 건수. 집계: `ClientScheduleNoteRepository.countUnresolvedByScheduleIdsGrouped` (`tenantId` + `scheduleId IN` + `resolvedAt IS NULL` + `isDeleted=false`).
  - **`clientScheduleNotesClientWideUnresolvedCount`**: 해당 **내담자(`clientId`) 기준 전체** 미해소 건수(다른 일정·매칭 포함). 집계: `countUnresolvedByClientIdsGrouped` (`tenantId` + `clientId IN` + 동일 미해소·미삭제 조건). `clientId` 없으면 0.
- **UI**: `ScheduleCalendarView` + **`integratedMonthEventLayout`**일 때, **직결 건수 > 0**이면 클래스 **`mg-v2-ad-calendar-event--client-notes-unresolved`**(경고 Dot) 및 툴팁 **` · 미해소 N건`** 또는 **` · 이 일정 미해소 N건 · 내담자 전체 M건`**. **직결 0·내담자 전체만 > 0**이면 **`mg-v2-ad-calendar-event--client-notes-client-wide`**(정보 톤 Dot) 및 **` · 내담자 미해소 M건`**. **취소·휴가**는 제외.
- **위임**: 필드·집계·표시 로직 변경·회귀는 **core-coder**; 월간 뷰에서 위 조건(숫자 0/양수, 취소·휴가 제외, 접근성 문구) 검증은 **core-tester**(§12·필요 시 E2E/수동 시나리오에 한 줄 추가).

### 12.3 Phase 1.1 (2026 배치)

- **월간 통합 레이아웃 아이콘**: 월간 뷰에서 lucide `AlertCircle`(일정 직결 우선) 및 `Info`(내담자 전체만) 우측 아이콘 표시.
- **CSS 클래스**: `mg-v2-ad-calendar-event__unresolved-icon` 등 적용 (경로: `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css` 등).
- **모달 상단 요약**: `ScheduleClientNotesSection` 상단에 "직결 N건 / 내담자 전체 M건" 요약 정보 노출.
- **데이터 전달**: `UnifiedScheduleComponent`의 `handleEventClick` 로직에서 `scheduleData`에 이원 카운트(`clientScheduleNotesUnresolvedCount`, `clientScheduleNotesClientWideUnresolvedCount`) 전달.

---

## 13. CI 연결 단계

통합 스케줄 관련 E2E를 CI에 연결할 때 **준비와 실행을 두 묶음**으로 나눈다. **YAML 예시는 본 문서에 적지 않는다**(플래너는 분배·경로만; 워크플로 본문은 **core-coder**).

**한계(한 문장)**: 통합 스케줄 스펙이 **8080(백엔드) 없으면 스킵**하는 식이면, CI 환경에서 해당 단계가 건너뛰어져 잡이 **항상 녹색**일 수 있고, 그 경우 녹색이 **실제 통합 스케줄 회귀 통과**를 의미하지 않을 수 있다.

### 13.1 1단계(병렬 준비)

- **explore**: E2E·워크플로가 의존하는 **스펙·스킵 조건·헬퍼·README** 경로를 정리한다.
- **core-deployer**: `.github/workflows/`에 둘 **워크플로 초안**(트리거·job 구성). **`.github/workflows/e2e-consultation-log-smoke.yml`**의 **시크릿 게이트**·**fork 안전** 패턴을 **명시적으로 참조**해 설계한다.
- **본 문서 갱신**: 본 파일 §13 및 [KR 공휴일 SSOT](./INTEGRATED_SCHEDULE_KR_HOLIDAYS_ORCHESTRATION.md) §7에 동일 단계·경로를 맞춘다.

### 13.2 2단계(병렬 실행)

- **core-coder**: **`.github/workflows/e2e-integrated-schedule-smoke.yml`** 를 **신규**로 두거나 **기존 워크플로를 확장**한다(파일 본문은 코더 산출).
- **core-tester**: 로컬 재현 절차와 **문서상 시크릿 매트릭스**(README·워크플로와 불일치 없게)를 갱신·검증한다.

### 13.3 완료 보고 시 경로(bullet)

- `docs/project-management/2026-04-28/INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION.md`
- `docs/project-management/2026-04-28/INTEGRATED_SCHEDULE_KR_HOLIDAYS_ORCHESTRATION.md`
- `.github/workflows/e2e-integrated-schedule-smoke.yml` (코더 산출·존재 시)
- `.github/workflows/e2e-consultation-log-smoke.yml` (시크릿 게이트·fork 안전 **참조 전용**)

---

## 실행 요청문 (호출자용 요약)

1. **explore**(선택): `extendedProps` 인벤토리.  
2. **core-designer**: 4절·9절 P2 반영 시안.  
3. **core-publisher**: 필요 시만.  
4. **core-coder**: 3·5·8·9·11절 기준 구현.  
5. **core-tester**: 12절.

---

*본 문서는 오케스트레이션·분배용이며, 구현 세부는 각 서브에이전트 산출물을 따른다.*
