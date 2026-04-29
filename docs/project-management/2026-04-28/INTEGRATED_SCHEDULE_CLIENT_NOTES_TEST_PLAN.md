# 통합 스케줄 — 내담자 특이사항·메모 테스트 계획서

**작성일**: 2026-04-29  
**SSOT**: [INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION.md](./INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION.md) (8절 앵커, 9절 정책, 12절 검증)  
**표준**: `docs/standards/TESTING_STANDARD.md`, `/.cursor/skills/core-solution-testing/SKILL.md`  
**담당**: core-tester (계획·케이스·실행·회귀 검증) / 구현·픽스처 코드는 core-coder

---

## 1. 범위·전제

### 1.1 범위 (In)

- URL: `/admin/integrated-schedule`
- 앵커: `IntegratedMatchingSchedule.js` → `UnifiedScheduleComponent.handleEventClick` → `ScheduleDetailModal` 내 **내담자 맥락 특이사항** CRUD(또는 소프트 삭제 UX)
- API: `/api/v1/` 하위(구현 확정 후 본 문서 **부록 A**에 경로·메서드 표로 갱신), `StandardizedApi` 사용 전제의 UI 검증
- 정책 반영: 오케스트레이션 **9절 P1~P5** (구현과 테스트 케이스는 동일 결정을 따름)

### 1.2 전제

| 항목 | 내용 |
|------|------|
| 브라우저 | 수동: Chrome 기준(개발 표준). 자동: Playwright 설정의 chromium / 필요 시 firefox·webkit (`tests/e2e/playwright.config.ts`) |
| 역할 | **ADMIN**, **STAFF** 각각으로 P3(타인 메모 수정·삭제) 시나리오 분리 |
| 테넌트 | **전용 테스트 테넌트** 또는 스테이징 격리 테넌트. 타 테넌트 데이터는 동적 생성·헤더 조작으로 검증. 프로덕션 데이터·하드코딩 ID 사용 금지 |
| 인증 | E2E: `tests/e2e/helpers/erpAuth.ts`의 `getMindGardenWebLogin()` 등 표준 헬퍼. API 통합: `Authorization: Bearer`, **`X-Tenant-ID`** 필수 |
| 표시·콘솔 | [COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md](../COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md) — React #130·`safeDisplay` 회귀 포함 |

### 1.3 범위 (Out, 1차)

- 내담자 포털 노출, ERP 자동 연동, Phase 2 배지·필터(오케스트레이션 10절)

---

## 2. 수동 E2E 시나리오 (12절 매핑)

각 단계는 **독립 실행 가능**하게 설계하고, 실패 시 스크린샷·콘솔·해당 요청 HAR 보관.

### S1 — 일반 예약 이벤트 특이사항 CRUD·지속성

**매핑**: 12절 1항 — 일반 예약 클릭 → 생성·수정·삭제(또는 소프트) → 새로고침 후 지속성

| 단계 | 액션 | 기대 결과 |
|------|------|-----------|
| S1-1 | ADMIN으로 로그인 후 `/admin/integrated-schedule` 진입 | 캘린더·레이아웃 정상, 콘솔 에러·#130 없음 |
| S1-2 | **일반 예약**(휴가 아님) 이벤트 클릭 | `ScheduleDetailModal` 오픈, 제목 등 기존 상세 표시 |
| S1-3 | 특이사항 영역에서 **신규 작성**(제목·본문·선택 필드: `noteType`, `promiseDate` 등) 저장 | 성공 토스트/목록 반영, 의도된 2xx만 |
| S1-4 | 동일 모달에서 **수정** 후 저장 | 목록·상세 반영 |
| S1-5 | **삭제**(또는 소프트 삭제 UX) 실행 | 정책(P4)에 맞게 목록에서 제거 또는 “삭제됨” 구분 표시 |
| S1-6 | 모달 닫기 후 **브라우저 새로고침**, 동일 이벤트 재클릭 | S1-3~5 결과가 DB 기준으로 유지(소프트 삭제 시 “기본 목록 제외” 확인) |

### S2 — 휴가 이벤트 (9절 P2)

**매핑**: 12절 2항

| 단계 | 액션 | 기대 결과 |
|------|------|-----------|
| S2-1 | 휴가 유형 이벤트 클릭(`extendedProps.type === 'vacation'` 등 구현 기준) | 특이사항 CRUD **미노출 또는 비활성**(시안과 동일) |
| S2-2 | 개발자 도구로 해당 영역 DOM/접근성 확인 | 실수로 API 호출되지 않음(네트워크에 특이사항 CRUD 없음) |

### S3 — `clientId` 없음 (9절 P1)

**매핑**: 12절 3항

| 단계 | 액션 | 기대 결과 |
|------|------|-----------|
| S3-1 | `clientId`가 없는 일정(시드 또는 테스트 매칭) 클릭 | UI: **내담자 미연결 안내** 및 P1 설계대로 `mappingId`·`scheduleId` 기반 조회/작성 가능 |
| S3-2 | 가능한 경우 노트 1건 작성 | 2xx, 목록에 표시 |
| S3-3 | 잘못된 조합(타 `scheduleId`)으로 조작 시 | 404 또는 빈 목록 등 API 스펙과 일치 |

### S4 — 테넌트·권한 (9절 P3·멀티테넌트)

**매핑**: 12절 4항

| 단계 | 액션 | 기대 결과 |
|------|------|-----------|
| S4-1 | 테넌트 A에서 생성한 노트 ID를 알고, 테넌트 B 헤더로 GET/PATCH/DELETE 시도 | **403 또는 404**(노출 최소화 정책과 일치) |
| S4-2 | STAFF A가 작성한 메모를 STAFF B로 수정·삭제 시도 | **403**(P3가 “STAFF 본인만”인 경우) |
| S4-3 | 동일 케이스를 ADMIN으로 실행 | 정책대로 **허용**(ADMIN 전부 허용 시) |

### S5 — 콘솔·네트워크 품질

**매핑**: 12절 5항

| 단계 | 액션 | 기대 결과 |
|------|------|-----------|
| S5-1 | S1~S4 수행 중 DevTools Console 모니터링 | **에러 0건**, **React #130 0건** |
| S5-2 | Network 탭 필터: XHR/Fetch | **의도치 않은 4xx/5xx** 없음(권한 거부는 시나리오에서 의도된 경우만) |

### S6 — 기존 모달 회귀 (예약 확정·취소·상담일지)

**매핑**: 12절 6항

| 단계 | 액션 | 기대 결과 |
|------|------|-----------|
| S6-1 | 일반 예약 클릭 → **예약 확정** 플로우(기존 `adminNote` 입금 확인 메모 포함) | 신규 특이사항 UI와 **필드·카피 혼동 없음**, 확정 완료 |
| S6-2 | **예약 취소** 플로우 | 기존과 동일 동작 |
| S6-3 | **상담일지** 연계(모달 내 기존 진입 경로) | 열람·저장 등 기존 동작 유지 |

### S7 — 파이프라인·게이트

**매핑**: 12절 7항

| 단계 | 액션 | 기대 결과 |
|------|------|-----------|
| S7-1 | 저장소 하드코딩 스캔·린트·`mvn test`(해당 모듈) CI | **통과** |
| S7-2 | 운영 반영 전 | [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 해당 항목 충족 |

---

## 3. API 테스트 제안 (JUnit / 통합 관례)

프로젝트 관례: `@SpringBootTest` + `@AutoConfigureMockMvc` + `MockMvc` 패턴(`*IntegrationTest.java`). 단위는 `@ExtendWith(MockitoExtension.class)` + Service 직접 검증.

구현 클래스·URL 확정 후 **동일 패키지**에 테스트 추가를 권장한다 (예: `com.coresolution.consultation.integration` 또는 컨트롤러 인접).

### 3.1 필수 케이스 그룹

| 그룹 | 설명 | 검증 포인트 |
|------|------|-------------|
| **T-tenant** | 동일 노트에 대해 `X-Tenant-ID` 불일치 | 403/404, 바디에 타 테넌트 데이터 없음 |
| **T-P3** | 타인 작성 노트 PATCH/DELETE | STAFF 403 / ADMIN 200(정책 확정안 기준) |
| **T-P4** | 소프트 삭제 후 GET 목록 | 기본 쿼리에서 제외; “삭제 포함” 쿼리는 ADMIN만 200 |
| **T-P1** | `clientId` 없이 `mappingId`+`scheduleId`(또는 확정된 보조 경로)로 GET/POST | 200 및 스키마; 잘못된 키는 404 |
| **T-auth** | 토큰 없음·만료 | 401 |
| **T-validation** | 필수 필드 누락·길이 초과 | 400, 메시지 일관성 |

### 3.2 WebMvcTest 사용 시점

슬라이스 테스트(`@WebMvcTest`)는 보안 필터·`SecurityContext` 모킹 비용이 있으면 통합 한 건으로 대체 가능. 참고: `OnboardingControllerCaptchaWebMvcTest` 패턴.

### 3.3 데이터

- `UUID.randomUUID()` 등 **동적** tenant·user·client·schedule·mapping. 표준: TESTING_STANDARD.md · core-solution-testing 스킬.

---

## 4. 회귀 범위 (기능)

| 영역 | 설명 |
|------|------|
| 통합 스케줄 캘린더 | 이벤트 클릭·모달 오픈·`IntegratedMatchingSchedule` → `UnifiedScheduleComponent` props 회귀 |
| `ScheduleDetailModal` | 예약 확정(`adminNote`와 신규 특이사항 분리), 취소, 상담일지 |
| 표시 경계 | 금액·마스킹·`SafeText`/`toDisplayString` |
| 디자인 토큰 | 기존 E2E: 모달 배경 비투명 — 아래 5절 참조 |

---

## 5. 회귀 자동화 가능 여부

| 도구 | 저장소 내 위치 | 현황 |
|------|----------------|------|
| **Playwright** | `tests/e2e/playwright.config.ts`, `tests/e2e/tests/**/*.spec.ts` | **사용 중** |
| **Cypress** | — | **미사용** |
| **Jest** | 프론트 컴포넌트 근처 `*.test.js` 등 | 컴포넌트 단위(휴가 분기·탭 렌더) 보완 시 활용 |

**이미 존재하는 관련 스펙**

- `tests/e2e/tests/admin/integrated-schedule-detail-modal.spec.ts` — 통합 스케줄 일정 클릭 후 **일정 상세 모달 배경 투명 여부**(디자인 토큰 회귀). S5·레이아웃 회귀와 연계 가능.
- `tests/e2e/tests/admin/consultation-log-modal-smoke.spec.ts` — 상담일지 스모크(별 화면; S6 교차 참고).
- `tests/e2e/tests/admin/integrated-schedule-client-notes.spec.ts` — 내담자 특이사항: 모달 오픈·특이사항 탭·폼 가시성(S1 UI 일부)·콘솔 error 0건(S5 일부). 캘린더 무일정 시 skip. 전체 CRUD는 `E2E_INTEGRATED_SCHEDULE_NOTES_CRUD=1` 시에만 1건 등록 시도.

**권장 추가(코더·테스터 협의 후)**

- S3·S4·S6·S7 세부는 **API 통합·수동** 또는 **시드된 전용 테넌트**로 확장.
- **P3·P4·P1**의 세밀한 조합은 **API 통합 테스트**가 비용 대비 안정적.

**요약**: 지금은 **수동 E2E(12절 전항목) + API 통합**이 주력; Playwright 확장은 **구현·시드 확정 후 추후** 단계로 명시해도 됨.

---

## 6. 완료 정의 (DoD)

| 기준 | 내용 |
|------|------|
| 기능 | S1~S7 전부 **통과**(증적: 체크리스트 서명 또는 CI·E2E 로그) |
| 콘솔 | **React #130 0건**, 미처리 콘솔 에러 0건 |
| 네트워크 | 시나리오상 허용 외 **의도치 않은 4xx/5xx** 없음 |
| 품질 게이트 | S7·운영 체크리스트·하드코딩 정책 충족 |

---

## 7. 데이터 시드·픽스처 (필요 엔티티)

구현 엔티티명은 코더 확정값을 따른다. 테스트 DB에는 아래가 **최소**로 준비되면 S1~S4를 재현하기 쉽다.

- **Tenant**: 격리용 테넌트 2개 이상(S4)
- **User**: 역할 **ADMIN** 1명, **STAFF** 2명 이상(S4-2)
- **Client**·**Schedule**(또는 통합 스케줄 API가 반환하는 동일 스키마): `clientId` 있는 일반 예약 1건 이상(S1)
- **Schedule 또는 이벤트**: `clientId` 없음·`mappingId`+`scheduleId`만 있는 케이스(S3, P1)
- **휴가 이벤트**: `type`(또는 동등 필드)이 휴가로 식별되는 일정(S2, P2)
- **특이사항 노트**: 타인 작성 1건(P3), 소프트 삭제 대상 1건(P4)
- **공통코드**(P5 확정 시): `noteType` 표시 검증용 코드 행

---

## 부록 A — API 경로 추적표 (구현 후 갱신)

**베이스 경로**: `/api/v1/admin/schedule-notes`  
**컨트롤러**: `com.coresolution.consultation.controller.AdminClientScheduleNoteController`  
**프론트 상수**: `frontend/src/constants/clientScheduleNoteConstants.js` → `CLIENT_SCHEDULE_NOTE_API`

| HTTP | 경로 | 쿼리/본문 요약 | 테스트 ID |
|------|------|----------------|------------|
| GET | `/api/v1/admin/schedule-notes` | Query: `clientId?`, `scheduleId?`, `mappingId?` (최소 1개), `includeDeleted` 기본 `false` (ADMIN만 삭제분 조회에 `true` 유효) | T-P1, T-P4, T-tenant |
| POST | `/api/v1/admin/schedule-notes` | Body: `ClientScheduleNoteCreateRequest` (`clientId`/`scheduleId`/`mappingId` 최소 1, `noteType`, `title` 등) | T-validation, T-P1 |
| PUT | `/api/v1/admin/schedule-notes/{id}` | Body: `ClientScheduleNoteUpdateRequest` (부분 갱신) | T-P3 |
| DELETE | `/api/v1/admin/schedule-notes/{id}` | 소프트 삭제 | T-P3 |

**비고**: 수정 HTTP 메서드는 **PUT** (`PATCH` 아님). 프론트 `StandardizedApi.put(\`${CLIENT_SCHEDULE_NOTE_API}/${id}\`, …)` 와 일치.

---

*문서 개정 시 SSOT 오케스트레이션 9절·12절 변경과 동기화할 것.*
