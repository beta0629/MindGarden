# ADR-0004: 외부 예약 채널(네이버 플레이스/예약) 어댑터와 통합 일정 경계

**Status:** Proposed

## Context

MindGarden 통합 일정은 앱 내 `Schedule` 엔티티·`consultant_client_mappings` 매핑·잔여 회기·결제·입금 게이트([ADR-0001](./adr-0001-scheduling-eligibility-vs-payment-deposit-gating.md), [ADR-0002](./adr-0002-session-remaining-and-mapping-status-transitions.md))를 중심으로 동작한다. 현재 `Schedule.java`에는 `externalId`·`sourceChannel`·`external_booking_id` 등 **외부 예약 채널 식별 필드가 없으며**, 저장소에는 네이버 OAuth·네이버페이 연동만 존재하고 **네이버 스마트플레이스(플레이스) 예약 연동은 없다**.

네이버 예약은 **공개 API가 없고**, 스마트플레이스 **제휴·파트너십** 및 사업자 검수·샌드박스 선행이 필요하다. 제휴 연동의 일반 패턴은 **계정 연동 → 예약상품↔상담사 매핑 → 슬롯·예약 이벤트 동기화**이며, 멀티테넌트 환경에서는 **모든 레이어에 `tenantId` 격리**가 필수이다([`docs/standards/EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md`](../standards/EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md)).

[ADR-0003](./adr-0003-integrated-schedule-multissot-orchestration-boundaries.md)에 따르면 통합 일정 모듈은 **권한 + 매핑·잔여 불변 조건 + 일정 영속화**까지를 한 트랜잭션에서 다루고, 결제·ERP·알림은 경계 밖에 둔다. 외부 예약 채널(네이버 플레이스 등)은 **새로운 “진입 소스”** 이며, 통합 일정의 도메인 불변 조건을 우회하는 별도 일정 생성 경로가 되어서는 안 된다.

### ADR-0003과의 관계

| 영역 | 통합 일정 모듈(ADR-0003) | 외부 채널 어댑터(본 ADR) |
|------|--------------------------|---------------------------|
| 일정 확정 불변 조건 | `validateMappingForSchedule`·`validateRemainingSessions`·트랜잭션 롤백 | 어댑터는 **내부 API 경계**(`createConsultantSchedule` 등)만 호출; 검증 로직 중복 구현 금지 |
| 마스터 데이터 | Phase별 SSOT(아래 Decision) | 채널별 ID·토큰·상품 매핑·동기화 상태 |
| 충돌·보상 | 앱 DB 일정 롤백 | 채널↔앱 불일치·웹훅 재시도·수동 해결 큐 |
| 알림·ERP | 경계 밖 | 예약 수신 후 기존 알림·결제 흐름 **이벤트 순서**만 정합 |

### 마스터 데이터 소스(MindGarden Schedule vs 네이버 예약) — Phase별 정의

| Phase | MindGarden `schedules` | 네이버 예약 | 비고 |
|-------|------------------------|-------------|------|
| **Phase 1** (단방향 수신) | **SSOT** — 네이버 예약 확정 웹훅 → 내부 일정 생성 | 이벤트 소스(읽기 전용) | 슬롯 푸시 없음; 네이버에서 예약된 건만 반영 |
| **Phase 2** (양방향) | **SSOT** — 확정·취소·변경의 최종 업무 상태 | **가용 슬롯·예약 상태 미러** | 앱에서 차단한 슬롯은 아웃바운드 동기화로 네이버 반영 |
| **Phase 3** (운영) | SSOT 유지 | 연결·매핑·로그는 어댑터 테이블 SSOT | 온보딩·재동기화·CS 도구 |

Phase 1~2 전환 전 PO·운영과 **“네이버에서 직접 수정한 예약”** 의 우선순위를 합의해야 한다.

### 양방향 충돌 정책(초안)

동일 `external_booking_id` 또는 동일 `(consultantId, date, startTime)` 에 대해 채널·앱 양쪽에서 변경이 겹칠 때:

1. **기본(Phase 1)**: **채널 우선(네이버 확정/취소 웹훅)** — 앱은 수신 이벤트를 멱등 처리하고, 기존 내부 일정과 충돌 시 **수동 해결 큐**(`booking_sync_logs` + 운영 알림)에 적재.
2. **Phase 2 옵션 A — Last-write-wins**: `last_synced_at`·이벤트 타임스탬프 비교; 낮은 우선순위 변경은 거부·로그.
3. **Phase 2 옵션 B — 채널 우선순위 매트릭스**: 이벤트 유형별(예: **취소 > 변경 > 확정**) 및 출처(네이버 vs 앱 ADMIN) 표를 PO가 확정.
4. **공통**: `tenantId` 불일치·매핑 미존재·잔여 회기 0은 **자동 확정 금지** — [ADR-0001](./adr-0001-scheduling-eligibility-vs-payment-deposit-gating.md) 게이트 유지, 실패는 동기화 로그 + CS 에스컬레이션.

### tenantId 격리 원칙

- 웹훅·연동 설정·상품 매핑·동기화 로그의 **모든 영속 레코드**에 `tenant_id` 필수; `TenantContextHolder` 없이 일정 생성 금지.
- 채널 연결(`external_channel_connections`)은 **테넌트당·채널당** 유니크; OPS 전역 설정과 테넌트 자격 증명 분리.
- 크로스 테넌트 웹훅·재시도·아웃박스 처리 **절대 금지** — 수신 시 서명·연결 ID로 테넌트 역해석 후 컨텍스트 바인딩.

## Decision

- **어댑터 레이어 도입**: 외부 예약 채널은 **채널 추상화 + NAVER_PLACE 첫 구현체**로 [`EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md`](../standards/EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md)에 정의한다. 통합 일정 서비스 내부에 네이버 전용 분기를 넣지 않는다.
- **일정 생성 경계**: 네이버→MindGarden 예약 반영은 **`ScheduleServiceImpl.createConsultantSchedule`**(및 ADR-0001·0002가 요구하는 사전 검증) 또는 PO가 승인한 **가예약(`tentativeBeforeDeposit`)** 경로만 사용한다. 어댑터가 Repository를 직접 호출하지 않는다.
- **스키마 확장**: `schedules`에 `external_booking_id`·`booking_source`·`sync_status`·`last_synced_at` 및 연동 전용 테이블(연결·매핑·로그)을 Flyway로 추가 — 상세는 연동 스펙 따름.
- **Phase 0 블로커**: 네이버 제휴·API/웹훅 스펙 확보 전 **Phase 1 코드 착수 금지** — [`NAVER_PLACE_BOOKING_PARTNERSHIP_ORCHESTRATION_CHECKLIST.md`](../project-management/NAVER_PLACE_BOOKING_PARTNERSHIP_ORCHESTRATION_CHECKLIST.md).
- **SSOT 분리 유지**: [ADR-0003](./adr-0003-integrated-schedule-multissot-orchestration-boundaries.md)과 동일하게 결제 확정·ERP·알림은 일정 생성 트랜잭션에 합치지 않는다. 외부 예약 수신은 **선예약·후결제** 시나리오([INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md))와 이벤트 순서만 정합한다.

## Consequences

- 제휴 지연 시 Phase 1 일정 전체가 블로킹된다. 스펙 확보 전까지는 **문서·인터페이스·스키마 초안**만 진행 가능하다.
- Phase 1에서 슬롯을 네이버에 푸시하지 않으면 **이중 예약**(네이버 가용 vs 앱 BOOKED) 리스크가 남는다 — 운영 가이드·Phase 2 일정을 로드맵에 명시한다.
- 매핑·잔여 회기 불일치로 웹훅 처리가 거절되면 **네이버에는 예약 존재·앱에는 없음** 상태가 가능하다 — 수동 해결 큐·CS 절차가 필수이다.
- 양방향 동기화·충돌 정책 확정 전 Last-write-wins만 적용하면 회계·회기([ADR-0002](./adr-0002-session-remaining-and-mapping-status-transitions.md))와 어긋날 수 있다 — PO·운영 합의 후 Phase 2 정책 고정.

### 가정(PO 검토)

- 네이버 스마트플레이스 **제휴 범위**(업종·예약상품 유형·다지점)와 MindGarden 테넌트 모델(1테넌트 = 1 사업자 vs 복수 지점) 매핑.
- 외부 예약 수신 시 **가예약 vs 즉시 BOOKED** 기본값 — 선예약·후결제 정책과 카피([INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) §3).
- 네이버 예약 **취소·노쇼·환불** 이벤트와 내부 `ScheduleStatus`·ERP 환불 흐름의 **단일 오너**.
- Phase 2 **충돌 정책** 최종 선택(A/B/C) 및 CS 수동 해결 SLA.
- ADMIN/STAFF vs 테넌트 관리자 **연동 설정 권한** — [`NAVER_PLACE_BOOKING_SETTINGS_UI_REQUIREMENTS.md`](../planning/NAVER_PLACE_BOOKING_SETTINGS_UI_REQUIREMENTS.md).

## References

- [ADR-0001: 예약 가능·자격 vs 결제·입금 게이팅](./adr-0001-scheduling-eligibility-vs-payment-deposit-gating.md)
- [ADR-0002: 세션 잔여·매핑 상태 전이](./adr-0002-session-remaining-and-mapping-status-transitions.md)
- [ADR-0003: 통합 일정 멀티슬롯 오케스트레이션 경계](./adr-0003-integrated-schedule-multissot-orchestration-boundaries.md)
- [외부 예약 채널 어댑터 연동 스펙](../standards/EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md)
- [네이버 플레이스 제휴·운영 체크리스트](../project-management/NAVER_PLACE_BOOKING_PARTNERSHIP_ORCHESTRATION_CHECKLIST.md)
- [네이버 플레이스 연동 로드맵](../project-management/NAVER_PLACE_BOOKING_INTEGRATION_ROADMAP.md)
- [통합 일정: 선예약·후결제 오케스트레이션](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)
- [`Schedule.java`](../../src/main/java/com/coresolution/consultation/entity/Schedule.java) — 현재 외부 예약 필드 없음(2026-07 기준)
