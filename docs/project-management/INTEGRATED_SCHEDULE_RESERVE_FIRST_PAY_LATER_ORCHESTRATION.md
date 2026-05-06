# 통합 스케줄 — 선예약·후결제·회기 불일치 오케스트레이션 (SSOT)

**작성일**: 2026-05-06  
**주관**: core-planner (본 문서는 단계·위임·게이트의 단일 진실 원천)  
**상태**: **기획·분배 SSOT** — 구현은 `core-coder`, 원인 분석은 `core-debugger`, 검증은 `core-tester`, 배포는 `core-deployer`에 위임한다.  
**범위**: 통합 스케줄에서 **예약(선행)과 결제·회기(후행)** 의 시간차·상태 불일치를 단계별로 추적·완화하기 위한 오케스트레이션만 다룬다. 애플리케이션 코드 본문은 본 문서에 포함하지 않는다.

---

## 1. 배경·문제 요약

### 1.1 UI 가용성 vs 세션 매핑 전제

- **탐색(explore) 관찰 요지**: 캘린더·사이드바 등에서 슬롯이 **SCHEDULABLE**(또는 동등한 “예약 가능” 표시)로 보이더라도, 매핑 훅(예: **`useSessionForMapping`**)이 **ACTIVE(또는 유효 회기 존재)** 를 전제로 동작하는 경로가 있으면, 화면상 “예약 가능”과 실제 **회기·잔여 횟수** 판정이 어긋날 수 있다.
- **위험**: 사용자는 가능하다고 인지하고 예약을 시도하지만, 서버·도메인에서는 거절되거나 **다른 회기**에 귀속되는 등 **2xx 응답과 함께 회기 불일치**가 남는 형태로 나타날 수 있다(아래 2절).

### 1.2 `createConsultantSchedule` 사전 검증의 한계

- 컨설턴트 일정 생성·슬롯 확정 API(예: **`createConsultantSchedule`** 경로)의 **사전 검증이 약한** 경우, 클라이언트 필터·낙관적 UI만으로는 **결제 전·회기 소진 후** 슬롯이 노출될 수 있다.
- **요구**: 서버 단 **불변 조건**(테넌트·회기 잔여·상품·결제 상태)을 명시한 검증 계층과, UI의 “가능” 표시를 동일 SSOT로 묶는 배치가 필요하다.

### 1.3 `remainingSessions` 0·필터 착시

- **`remainingSessions === 0`**(또는 동등 표현)일 때도 필터·캐시·이전 응답으로 **목록/캘린더에 잔여가 있는 것처럼** 보이는 **착시**가 발생할 수 있다.
- **요구**: 잔여·회기·결제 상태를 **한 소스**에서 읽고, 필터(기간·상태·역할)가 **이중 해석**하지 않도록 component-manager와 코더가 합의한다(아래 6절).

---

## 2. core-debugger — P0 시나리오·증거·“2xx + 회기 불일치”

### 2.1 P0 시나리오 (예시 라벨)

| 라벨 | 시나리오 요지 |
|------|----------------|
| **A** | **선예약 성공 → 후결제 실패/지연**: 예약 레코드는 존재하나 결제·ERP 확정이 끝나지 않아 회기·상담 상태가 중간에 멈춤. |
| **B** | **결제·회기 갱신 전 UI 재진입**: `remainingSessions` 또는 매핑 훅이 갱신되기 전에 동일 슬롯에서 재시도·중복 예약 시도. |
| **C** | **필터·역할 전환 후 불일치**: SCHEDULABLE 표시와 `useSessionForMapping` 전제(ACTIVE 등)가 역할·필터 변경 직후 어긋남. |

### 2.2 최소 증거 4점 (디버거 수집 체크리스트)

1. **요청·응답 쌍**: 예약 생성·일정 생성 API의 요청 본문, HTTP 상태, 응답 JSON(민감정보 마스킹).  
2. **회기·잔여 필드 스냅샷**: 동일 시각의 `remainingSessions`(또는 동등)·세션 ID·상품/패키지 키.  
3. **UI 상태**: 해당 슬롯의 SCHEDULABLE 여부, 훅이 의존하는 전제 플래그(ACTIVE 등), 콘솔 경고.  
4. **시간 순서**: 결제 콜백·ERP 확정·스케줄 확정 이벤트의 **타임라인**(로그 타임스탬프).

### 2.3 “2xx + 회기 불일치” 위험

- HTTP **2xx**이어도 **도메인 불변 조건 위반**(잘못된 회기 귀속, 잔여 0 이후 확정 등)이 응답에 **명시되지 않으면**, 클라이언트는 성공으로 처리하고 **이후 화면·정산·ERP**에서 뒤늦게 터진다.
- **디버거 산출**: 재현 절차, 위 4점 증거, 서버/클라이언트 중 책임 경계 초안 → **core-coder** 위임 시 수정 범위·회귀 조건에 포함한다.

---

## 3. core-designer — 사용자 언어·상태 모델·토큰·UnifiedModal·접근성

- **사용자 언어**: “선예약”, “결제 대기”, “회기 소진”, “확정” 등 **상태명을 제품 언어로 고정**하고, 개발용 enum·API 필드명과 1:1 매핑표를 스펙에 둔다.
- **상태 모델**: 예약 단독 성공 / 결제 대기 / 회기 확정 / 취소·환불 등 **선형이 아닌 분기**를 다이어그램으로 명시한다.
- **디자인 토큰**: 색·간격·타이포는 **`unified-design-tokens.css`**·`AdminDashboardB0KlA.css`·`mindgarden-design-system.pen`에 정의된 값만 사용한다(하드코딩 금지는 코더·CI 게이트와 공유).
- **UnifiedModal**: 안내·확인·오류는 **공통 UnifiedModal** 패턴으로 통일하고, “가능해 보이지만 실패” 상황에 **명확한 차단 메시지**와 다음 행동(결제하기·상담실 문의 등)을 제시한다.
- **접근성**: 포커스 트랩, `aria-live`로 비동기 실패 알림, 키보드로 예약 흐름 완주 가능 여부를 시안 단계에서 명시한다.

---

## 4. core-tester — Phase 0~N 테스트 게이트 (문서 인용 블록)

아래 블록은 본 오케스트레이션에서 **테스터 게이트**를 재현·복붙할 때 사용한다. 상세 규칙은 [`docs/standards/TESTING_STANDARD.md`](../standards/TESTING_STANDARD.md)를 따른다.

```markdown
## 선예약·후결제·회기 — 테스트 게이트 (Phase 0~N)

### Phase 0 — 스모크·가드 (입장: 브랜치 생성 / 퇴장: P0 시나리오 A·B·C 중 1건 이상 재현 가능)
- 테넌트·역할별 로그인, 통합 스케줄 진입, 콘솔 에러 0건(React #130 등 회귀).
- `remainingSessions` 0 계정·패키지로 **슬롯 비노출 또는 차단 문구** 기대값을 문서화.

### Phase 1 — 단위·순수 로직
- 잔여·회기 계산, 필터 키, 매핑 훅 전제(ACTIVE 등)에 대한 **단위 테스트** 추가 또는 갱신.
- 표시 경계(`safeDisplay` 등)는 `COMMON_DISPLAY_BOUNDARY` 회의 정합.

### Phase 2 — API·통합
- `createConsultantSchedule`(및 동일 도메인) **검증 강화** 후: 잔여 0·결제 미완·잘못된 세션 ID에 대한 **4xx/도메인 오류 본문** 계약 테스트.
- 결제·ERP 연동이 있는 경우 [`docs/debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md`](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md) 흐름과 충돌 없는지 스팟 검증.

### Phase 3 — E2E (주요 사용자 경로)
- 선예약 → 결제 완료 → 회기 차감 → 캘린더 반영까지 **한 플로우** E2E 1건 이상.
- 결제 실패·재시도·페이지 재진입 시 **이중 예약 방지** E2E 1건 이상.

### Phase N — 릴리스 전 회귀
- 통합 스케줄 필터·역할 전환·모달 트리오(§6) 회귀 리스트 실행.
- **퇴장 조건**: 계획된 테스트 전부 Green, 알려진 스킵은 문서·이슈에 사유 기재.
```

---

## 5. core-deployer — 배포 Phase (문서 인용 블록)

아래 블록은 **저장소 워크플로 실제 `on:`** 과 불일치 시 **워크플로 파일이 우선**이다. 세부는 [`/.cursor/agents/core-deployer.md`](../../.cursor/agents/core-deployer.md) 및 `/core-solution-deployment` 스킬을 따른다.

```markdown
## 선예약·후결제·회기 — 배포 Phase

### Phase D0 — 변경 분류
- 백엔드(Java·Flyway·API)만 / 프론트(`frontend/**`)만 / 풀스택 여부 판정.

### Phase D1 — 개발 반영 (필요 시)
- `develop` + paths → 예: `deploy-backend-dev.yml` 등 저장소 관례에 따른 자동 배포.
- 프론트만이면 개발 프론트 파이프라인(존재 시)에 위임.

### Phase D2 — 운영 반영
- 운영 풀스택: `deploy-production.yml` 등 **수동 `workflow_dispatch`** 인지 여부 확인.
- 운영 프론트만: `deploy-frontend-prod.yml` — `main` + `paths` 트리거 여부 확인.
- 운영 반영 전 [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 및 하드코딩 게이트 점검.

### Phase D3 — 배포 후 검증
- 스테이징/운영에서 P0 시나리오 A·B·C 중 최소 1건 스모크.
- ERP·결제 연동이 있으면 금액·상태 **샘플 1건** 대조.
```

---

## 6. core-component-manager — SSOT·모달 트리오·필터 이중화

- **SSOT**: “예약 가능”, 잔여 회기, 결제 대기 표시는 **단일 데이터 소스·단일 매핑 레이어**에서 나와야 하며, 컴포넌트마다 별도 해석 금지.
- **모달 트리오**: 안내 / 확인 / 오류·차단을 **UnifiedModal** 변형으로 묶고, 동일 토큰·동일 카피 테이블을 공유하는지 검토한다.
- **필터 이중화 위험**: 기간·상태·역할 필터가 **서버 쿼리**와 **클라이언트 재필터**를 동시에 적용하면 `remainingSessions` 0 착시가 증폭될 수 있다. **한 쪽에 권한을 두는** 합의가 필요하다.

---

## 7. 단계 표 (Phase 0 → 릴리스)

| Phase | 목적 | 입장 조건 | 퇴장 조건 | 담당 서브에이전트 |
|:-----:|------|-----------|-----------|------------------|
| **0** | ADR·PO 합의 | 문제 재현 또는 사업 요구 수신 | ADR 후보(8절) 중 채택/보류 결정 | core-planner, (필요 시) explore |
| **1** | 인벤토리·갭 | Phase 0 퇴장 | UI/API/회기 필드 맵 1페이지 | explore, core-component-manager |
| **2** | 원인·계약 | Phase 1 퇴장 | P0 A/B/C 중 최소 1건 재현 + 증거 4점 | core-debugger |
| **3** | UX·시안 | Phase 2 산출 | 상태 모델·카피·모달·토큰 스펙 확정 | core-designer, (필요 시) core-publisher |
| **4** | 구현 | Phase 3 퇴장 | PR: 검증·도메인 규칙 반영 | core-coder |
| **5** | 테스트 게이트 | Phase 4 머지 후보 | §4 블록 Phase N까지 Green | core-tester |
| **6** | 배포 | Phase 5 퇴장 | §5 블록 D3 완료 | core-deployer |
| **7** | 릴리스·회고 | Phase 6 완료 | 릴리스 노트·잔여 리스크 1페이지 | core-planner |

위임 순서·직접 수정 금지·테스터 필수는 [`docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`](./CORE_PLANNER_DELEGATION_ORDER.md)를 따른다.

---

## 8. ADR 후보 목록 (제목만)

본문 작성은 `docs/adr/` 또는 후속 티켓에 위임한다.

1. 선예약 레코드와 결제·ERP 확정의 **최종 일관성 모델**(사가 vs 아웃박스 vs 보상 트랜잭션)  
2. **`remainingSessions` 계산 주체**(서버 단일 vs 클라이언트 캐시 허용 범위)  
3. **`createConsultantSchedule` 불변 조건** 및 오류 계약(4xx vs 2xx+도메인 코드)  
4. 통합 스케줄 **SCHEDULABLE 표시와 `useSessionForMapping` 전제**의 결합 방식  
5. 필터·쿼리 **단일 권한**(서버 only / 클라이언트 only / 명시적 2단계)  
6. **테넌트 격리** 하 선예약·환불·회기 차감의 감사 로그 보존 기간

---

## 9. 참조 링크

| 문서 | 용도 |
|------|------|
| [`docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`](./CORE_PLANNER_DELEGATION_ORDER.md) | 위임 순서·직접 수정 금지·테스터 게이트 |
| [`docs/debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md`](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md) | 입금·ERP·환불 흐름과 충돌 검토 |
| [`docs/standards/TESTING_STANDARD.md`](../standards/TESTING_STANDARD.md) | 테스트 계층·원칙(존재 시 본문 기준) |
| [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) | 운영 반영 전 점검 |

---

## 10. ADR 디렉터리 (부록)

채택·진행 중인 ADR 본문과 인덱스는 `docs/adr/`에 둔다. 아래는 본 오케스트레이션과 직접 연결된 기록이다.

| 문서 | 용도 |
|------|------|
| [`docs/adr/README.md`](../adr/README.md) | ADR-0001~0003 요약 표·상태·본 문서(SSOT) 링크 |
| [`docs/adr/adr-0001-scheduling-eligibility-vs-payment-deposit-gating.md`](../adr/adr-0001-scheduling-eligibility-vs-payment-deposit-gating.md) | 예약 가능·자격과 결제·입금 게이팅 경계 |
| [`docs/adr/adr-0002-session-remaining-and-mapping-status-transitions.md`](../adr/adr-0002-session-remaining-and-mapping-status-transitions.md) | 세션 잔여와 매핑·상태 전이 |
| [`docs/adr/adr-0003-integrated-schedule-multissot-orchestration-boundaries.md`](../adr/adr-0003-integrated-schedule-multissot-orchestration-boundaries.md) | 통합 일정 멀티슬롯 오케스트레이션 책임 경계 |

---

*본 문서는 오케스트레이션·분배용 SSOT이며, 최종 법·회계·ERP 정책은 담당 부서와 외부 시스템 규정을 따른다.*
