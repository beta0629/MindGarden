# 매칭-스케줄 통합 화면 테스트 계획 (MATCHING_SCHEDULE_INTEGRATION_TEST_PLAN)

## 1. 개요

- **목적**: 매칭 목록과 스케줄 캘린더가 한 화면에 통합된 원스톱 화면의 동작·연동·에러 처리를 검증
- **테스트 대상**
  - **경로**: `/admin/integrated-schedule`
  - **좌측**: 매칭 목록 (실 API `GET /api/v1/admin/mappings`)
  - **우측**: 스케줄 캘린더 (실 API `GET /api/v1/schedules/admin` 등, `UnifiedScheduleComponent` 사용)
  - **상호작용**: 매칭 카드의 "스케줄 등록" 클릭 → `ScheduleModal`이 상담사·내담자 Pre-filled로 열림 → 저장 시 캘린더/매칭 목록 갱신
- **참조**: `docs/standards/TESTING_STANDARD.md`, `docs/design-system/v2/MATCHING_SCHEDULE_INTEGRATION_SPEC.md`

---

## 2. 검증 항목 요약

| # | 검증 항목 | 설명 |
|---|-----------|------|
| 1 | 통합 화면 로드 시 좌측 매칭 목록 | 실 API `/api/v1/admin/mappings`로 목록 로드 여부 |
| 2 | 우측 캘린더 이벤트 | 실 API(`/api/v1/schedules/admin` 등)로 이벤트 표시 여부 |
| 3 | "스케줄 등록" 클릭 → 모달·Pre-filled | 클릭 시 ScheduleModal 열림, 상담사·내담자 자동 채움 |
| 4 | 스케줄 저장 성공 시 갱신 | 저장 후 캘린더 refetch 및 매칭 목록 재조회 |
| 5 | 에러 처리 | API 실패 시 알림(토스트 등) 및 적절한 UI 상태 |

---

## 3. 상세 테스트 시나리오 및 체크리스트

### 3.1. 통합 화면 로드 시 좌측 매칭 목록이 실 API로 로드되는지

- [ ] 화면 진입 시 `GET /api/v1/admin/mappings`가 호출되는가?
- [ ] 응답이 `mappings` 배열 또는 배열 형태일 때 좌측 목록에 카드(상담사·내담자·상태)가 렌더링되는가?
- [ ] 로딩 중에는 로딩 UI(예: "매칭 목록 불러오는 중...")가 노출되는가?
- [ ] 매칭이 0건일 때 "매칭이 없습니다." 등 빈 상태 문구가 노출되는가?
- [ ] 인증·테넌트: 요청에 `Authorization`, `X-Tenant-ID` 등 API 표준 헤더가 포함되는가? (통합 테스트 시)

### 3.2. 우측 캘린더가 실 API로 이벤트를 표시하는지

- [ ] `UnifiedScheduleComponent`가 `userRole="ADMIN"` 등으로 마운트될 때 스케줄 조회 API(예: `GET /api/v1/schedules/admin`)가 호출되는가?
- [ ] API 응답의 이벤트가 캘린더 그리드에 표시되는가? (날짜·시간·상담사/내담자 등)
- [ ] 뷰 전환(일/주/월) 또는 날짜 변경 시 해당 범위로 재조회가 이루어지는가?

### 3.3. "스케줄 등록" 클릭 시 ScheduleModal이 열리고 상담사·내담자가 Pre-filled 되는지

- [ ] 매칭 카드의 "스케줄 등록" 버튼 클릭 시 `ScheduleModal`이 열리는가?
- [ ] 모달이 열릴 때 선택한 매칭의 **상담사·내담자** 정보가 모달 폼에 미리 채워지는가? (Pre-filled: consultantId, clientId, consultantName, clientName 등)
- [ ] 상담사·내담자 정보가 없는 매칭에서 "스케줄 등록" 클릭 시 모달 대신 에러 알림이 뜨는가?
- [ ] 모달에서 "취소" 또는 닫기 시 모달만 닫히고, 캘린더/매칭 목록은 기존 상태를 유지하는가?

### 3.4. 스케줄 저장 성공 시 캘린더 갱신(refetch) 및 매칭 목록 갱신 여부

- [ ] 모달에서 스케줄 저장(예: `POST /api/v1/schedules/consultant`) 성공 시 `onScheduleCreated` 콜백이 호출되는가?
- [ ] 콜백 호출 후 **캘린더**가 다시 조회되는가? (예: `refetchTrigger` 증가로 `UnifiedScheduleComponent` refetch)
- [ ] 콜백 호출 후 **매칭 목록**이 다시 로드되는가? (예: `loadMappings()` 재호출)
- [ ] 저장 성공 후 모달이 닫히고, Pre-filled 상태가 초기화되는가?

### 3.5. 에러 처리 (API 실패 시 알림 등)

- [ ] 매칭 목록 API(`GET /api/v1/admin/mappings`) 실패 시 사용자에게 에러 알림(토스트/notificationManager 등)이 표시되는가?
- [ ] 실패 시 좌측 목록은 빈 배열 등으로 처리되어 화면이 깨지지 않는가?
- [ ] 스케줄 저장 API 실패 시 모달은 유지되고, 저장 실패 메시지가 사용자에게 전달되는가?
- [ ] (선택) 네트워크 오류·타임아웃 시 재시도 또는 명확한 안내가 있는가?

---

## 4. 테스트 수준별 권장 사항

테스트 피라미드(단위 70% / 통합 20% / E2E 10%)를 기준으로, 아래와 같이 수준별로 우선순위와 간단한 시나리오를 권장한다.

### 4.1. 단위 테스트 (우선순위: 높음)

- **대상**: `IntegratedMatchingSchedule` 내부 로직, `ScheduleModal`에 넘기는 props 생성
- **시나리오 예**
  - 매칭 목록이 빈 배열일 때 빈 상태 문구만 렌더링
  - 매칭 카드에 상담사명·내담자명·상태가 올바르게 표시
  - `handleScheduleRegister(mapping)` 호출 시 `consultantId`/`clientId` 없으면 알림만 하고 모달 미오픈
  - `handleScheduleRegister(mapping)` 호출 시 `preFilledMapping`이 설정되고 모달 오픈 상태로 전환
  - `handleScheduleCreated` 호출 시 refetch 트리거 증가 및 `loadMappings` 호출 (목으로 검증)
- **도구**: Jest, React Testing Library. API·UnifiedScheduleComponent는 Mock.

### 4.2. 통합 테스트 (우선순위: 높음)

- **대상**: 실제 API 호출과 연동 — 매칭 목록 로드, 스케줄 조회, 스케줄 저장 후 갱신
- **시나리오 예**
  - 인증·테넌트 헤더를 붙여 `GET /api/v1/admin/mappings` 호출 시 200 및 배열 형태 응답 검증
  - `GET /api/v1/schedules/admin` (또는 동일 계열) 호출 시 200 및 이벤트 데이터 검증
  - 스케줄 생성 API 호출 후, 같은 조건으로 스케줄 목록 재요청 시 새 일정 포함 여부 검증
  - 매칭 목록 API 4xx/5xx 시 클라이언트에서 에러 처리(알림) 및 빈 목록 처리 여부
- **도구**: MockMvc(백엔드) 또는 MSW/실 서버(프론트), `Authorization`·`X-Tenant-ID` 필수.

### 4.3. E2E 테스트 (우선순위: 중간)

- **대상**: 관리자 로그인 → 통합 화면 진입 → 매칭 목록 확인 → 스케줄 등록 클릭 → 모달 Pre-filled 확인 → 저장 → 캘린더/목록 갱신 확인
- **시나리오 예**
  - `/admin/integrated-schedule` 접속 후 좌측에 매칭 카드가 보이고, 우측에 캘린더가 로드된다.
  - 특정 매칭 카드의 "스케줄 등록" 클릭 → ScheduleModal이 열리고, 해당 상담사·내담자가 폼에 채워져 있다.
  - 모달에서 날짜/시간 선택 후 저장 → 모달 닫힘 → 캘린더에 새 이벤트가 보이거나 목록이 갱신된다.
  - (선택) 매칭 목록 API 실패를 시뮬레이션했을 때 에러 메시지가 노출된다.
- **도구**: Playwright. 위치: `tests/e2e/tests/admin/` (예: `integrated-schedule.spec.ts`).

---

## 5. 테스트 작성·실행 체크리스트

- [ ] `docs/standards/TESTING_STANDARD.md` 참조
- [ ] 단위: Mock 사용, Given-When-Then·@DisplayName(한글) 적용
- [ ] 통합: 인증·X-Tenant-ID 헤더 포함, 테스트 데이터 동적 생성
- [ ] E2E: `tests/e2e/tests/` 아래 `.spec.ts`, baseURL·로그인 플로우 정합
- [ ] 실행 후 실패 없음 확인, 필요 시 커버리지 검토

---

## 6. 참조

- [테스트 표준](../standards/TESTING_STANDARD.md)
- [매칭-스케줄 통합 UI/UX 스펙](../design-system/v2/MATCHING_SCHEDULE_INTEGRATION_SPEC.md)
- [에러 처리 표준](../standards/ERROR_HANDLING_STANDARD.md) — 예외 시나리오 검증 시 참고
- [API 설계 표준](../standards/API_DESIGN_STANDARD.md) — 엔드포인트·응답 형식
