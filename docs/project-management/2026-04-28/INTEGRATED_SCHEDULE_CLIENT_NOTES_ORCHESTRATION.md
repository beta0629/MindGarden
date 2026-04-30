# 통합 스케줄 — 내담자 특이사항·메모 CRUD 오케스트레이션

**작성일**: 2026-04-28  
**개정**: 2026-04-28 (코드 앵커 검증·정책 보강·구현·검증 체크리스트 추가)  
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
| **Phase 2 (후보)** | 약속일 임박·미이행 **배지/캘린더 인디케이터**, “이번 주 약속” **필터**, 대시보드 위젯 등은 별도 스펙으로 분리 가능(아래 10절). |

### 성공 기준

- 통합 스케줄에서 **이벤트 클릭 → `ScheduleDetailModal` 맥락**에서 특이사항 목록·작성/수정/삭제(소프트 삭제 시 목록 정책 포함)가 완결된다.
- API는 **`/api/v1/`** 하위, **`tenantId` 필수**, ADMIN/STAFF 쓰기(삭제·타인 메모 수정 권한은 9절 결정에 따름).
- UI는 **Admin B0KlA**, **`UnifiedModal`** 표준에 정합(상세 모달 **내부 탭 또는 단일 본문 확장** 권장, 불필요한 2중 모달 지양).
- **core-tester**: 아래 12절 체크리스트 전부 통과, 콘솔 #130·크리티컬 0건.
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

- 캘린더에 **미처리 약속** 도트/배지.
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

---

## 실행 요청문 (호출자용 요약)

1. **explore**(선택): `extendedProps` 인벤토리.  
2. **core-designer**: 4절·9절 P2 반영 시안.  
3. **core-publisher**: 필요 시만.  
4. **core-coder**: 3·5·8·9·11절 기준 구현.  
5. **core-tester**: 12절.

---

*본 문서는 오케스트레이션·분배용이며, 구현 세부는 각 서브에이전트 산출물을 따른다.*
