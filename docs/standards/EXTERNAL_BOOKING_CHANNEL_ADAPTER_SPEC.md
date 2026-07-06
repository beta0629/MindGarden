# 외부 예약 채널 어댑터 연동 스펙 (초안)

**목적**: MindGarden 통합 일정과 **외부 예약 채널**(첫 구현: **NAVER_PLACE**)을 연결하는 백엔드·웹훅·스키마·운영 패턴의 **단일 표준 초안**을 정의한다.  
**범위**: 아키텍처·인터페이스 시그니처·DB 확장·멱등·내부 API 경계·구현 완료 조건. **애플리케이션 코드 본문은 포함하지 않는다.**  
**상태**: Proposed — [ADR-0004](../adr/adr-0004-external-booking-channel-naver-place-adapter.md) 결정과 쌍으로 유지한다.

**연계 문서**

| 문서 | 용도 |
|------|------|
| [ADR-0004](../adr/adr-0004-external-booking-channel-naver-place-adapter.md) | 책임 경계·SSOT·충돌 정책 |
| [NAVER_PLACE_BOOKING_PARTNERSHIP_ORCHESTRATION_CHECKLIST.md](../project-management/NAVER_PLACE_BOOKING_PARTNERSHIP_ORCHESTRATION_CHECKLIST.md) | 제휴·운영 게이트 |
| [NAVER_PLACE_BOOKING_INTEGRATION_ROADMAP.md](../project-management/NAVER_PLACE_BOOKING_INTEGRATION_ROADMAP.md) | Phase·위임 |
| [INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) | 선예약·회기·결제 정합 |

---

## 1. 아키텍처 개요

```
[네이버 스마트플레이스] ──웹훅/ API──► [InboundWebhookHandler]
                                              │
                                              ▼
                                    [ChannelMappingService]
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
         [external_channel_connections] [external_product_mappings] [booking_sync_logs]
                    │                         │
                    └─────────────┬───────────┘
                                  ▼
                    [ScheduleService.createConsultantSchedule]  ← ADR-0001·0002 검증
                                  │
                    [OutboundSlotSync] ◄── Phase 2: 앱 슬롯 변경 → 네이버
```

- **채널 추상화**: `BookingChannel` enum — `NAVER_PLACE`(v1), 추후 `KAKAO_BOOKING` 등 확장.
- **어댑터 패키지(제안)**: `com.coresolution.consultation.integration.booking.*` — 통합 일정 도메인과 분리.
- **멀티테넌트**: 모든 진입점에서 `tenantId` 확정 후 `TenantContextHolder` 바인딩; 미확정 시 **400/401** 및 로그만 기록.

---

## 2. 백엔드 어댑터 인터페이스 초안

> Java 인터페이스 **시그니처 수준** — 구현 코드는 `core-coder` 배치.

### 2.1 `InboundWebhookHandler`

| 메서드 | 설명 |
|--------|------|
| `boolean supports(BookingChannel channel)` | 채널별 핸들러 라우팅 |
| `WebhookAck handle(BookingChannel channel, String rawBody, WebhookHeaders headers, String tenantIdHint)` | 서명 검증 → 파싱 → 도메인 이벤트 변환 → 멱등 키 저장 |
| `WebhookVerificationResult verifySignature(BookingChannel channel, String rawBody, WebhookHeaders headers, ExternalChannelConnection connection)` | HMAC/네이버 제휴 스펙에 따른 검증 |

**내부 DTO(개념)**: `BookingWebhookEvent` — `eventId`, `eventType`(CREATED/UPDATED/CANCELLED), `externalBookingId`, `externalProductId`, `startAt`, `endAt`, `customerRef`, `payloadHash`.

### 2.2 `OutboundSlotSync`

| 메서드 | 설명 |
|--------|------|
| `SyncResult pushAvailableSlots(String tenantId, BookingChannel channel, Long consultantId, LocalDate from, LocalDate to)` | Phase 2 — 가용 슬롯 배치 푸시 |
| `SyncResult pushBookingCancellation(String tenantId, BookingChannel channel, String externalBookingId, CancelReason reason)` | 앱 취소 → 채널 반영 |
| `SyncResult pushBookingUpdate(String tenantId, BookingChannel channel, String externalBookingId, SlotChange change)` | 시간 변경 등 |

### 2.3 `ChannelMappingService`

| 메서드 | 설명 |
|--------|------|
| `Optional<ExternalProductMapping> resolveProductMapping(String tenantId, BookingChannel channel, String externalProductId)` | 예약상품 → `consultantId`·`mappingId` 후보 |
| `Optional<ExternalChannelConnection> getActiveConnection(String tenantId, BookingChannel channel)` | OAuth/토큰 메타·연결 상태 |
| `ClientConsultantPair resolveClientConsultant(String tenantId, BookingWebhookEvent event, ExternalProductMapping mapping)` | 내담자 식별·매핑(신규/기존) — PO 정책에 따름 |
| `void recordSyncLog(BookingSyncLogEntry entry)` | `booking_sync_logs` 적재 |

### 2.4 `BookingChannelAdapter` (퍼사드)

| 메서드 | 설명 |
|--------|------|
| `BookingChannel channel()` | `NAVER_PLACE` 등 |
| `InboundWebhookHandler inbound()` | |
| `OutboundSlotSync outbound()` | Phase 2부터 활성 |
| `ChannelMappingService mapping()` | |

---

## 3. 웹훅 수신 엔드포인트 설계

| 항목 | 값 |
|------|-----|
| **경로** | `POST /api/v1/webhooks/booking/{channel}` — `{channel}` = `naver-place` (URL alias) |
| **인증** | 채널별 서명 헤더(제휴 스펙 확정 후 상수화); **시크릿은 DB 평문 금지** — `secret_ref`만 저장 |
| **tenantId** | (1) 경로·쿼리 `connectionId` 또는 (2) 페이로드 `businessId` → `external_channel_connections` 역조회 → `TenantContextHolder` 설정 |
| **응답** | 멱등 처리 시 **200** + `{ "ack": true, "duplicate": boolean }`; 검증 실패 **401**; 도메인 거절 **422** + sync log |
| **Rate limit** | 테넌트·채널별 — 운영 설정 |

**보안**

- 공개 URL이므로 IP allowlist(제휴 제공 시)·서명 필수·raw body 보존(민감정보 마스킹).
- 웹훅 처리는 **짧은 트랜잭션** — 무거운 아웃바운드는 아웃박스 큐.

---

## 4. 스키마 확장 제안

### 4.1 `schedules` 테이블 컬럼 추가

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `external_booking_id` | `VARCHAR(128)` NULL | 채널 예약 ID; `(tenant_id, booking_source, external_booking_id)` 유니크 |
| `booking_source` | `VARCHAR(32)` NULL | `NAVER_PLACE`, `INTERNAL`, … |
| `sync_status` | `VARCHAR(32)` NULL | `SYNCED`, `PENDING`, `CONFLICT`, `FAILED` |
| `last_synced_at` | `DATETIME` NULL | 마지막 성공 동기화 시각 |

> 현재 [`Schedule.java`](../../src/main/java/com/coresolution/consultation/entity/Schedule.java)에는 위 필드 없음 — Flyway 마이그레이션 필요.

### 4.2 `external_channel_connections`

| 컬럼 | 설명 |
|------|------|
| `id`, `tenant_id` | PK; **`UNIQUE(tenant_id, channel)`** |
| `channel` | `NAVER_PLACE` |
| `external_business_id` | 스마트플레이스 사업자 ID |
| `status` | `PENDING`, `ACTIVE`, `REVOKED`, `ERROR` |
| `oauth_token_ref` / `webhook_secret_ref` | Secrets Manager 참조 ID만 |
| `connected_at`, `last_health_check_at` | |
| `metadata_json` | 샌드박스·지점 ID 등 |

### 4.3 `external_product_mappings`

| 컬럼 | 설명 |
|------|------|
| `id`, `tenant_id`, `channel` | |
| `external_product_id` | 네이버 예약상품 ID |
| `consultant_id` | MindGarden 상담사 |
| `mapping_id` | 선택 — `consultant_client_mappings` 기본 매핑 힌트 |
| `is_active`, `slot_duration_minutes` | |
| **`UNIQUE(tenant_id, channel, external_product_id)`** | |

### 4.4 `booking_sync_logs`

| 컬럼 | 설명 |
|------|------|
| `id`, `tenant_id`, `channel` | |
| `direction` | `INBOUND`, `OUTBOUND` |
| `event_type`, `external_booking_id`, `schedule_id` | |
| `idempotency_key` | **`UNIQUE(tenant_id, idempotency_key)`** |
| `status` | `SUCCESS`, `FAILED`, `SKIPPED`, `CONFLICT` |
| `error_code`, `error_message`(마스킹) | |
| `payload_ref` | S3/로그 저장소 키(PII 최소화) |
| `created_at`, `retry_count` | |

---

## 5. 멱등·재시도·아웃박스 패턴

### 5.1 멱등

- **키**: `tenantId + channel + eventId`(웹훅 제공) 또는 `payloadHash` fallback.
- `booking_sync_logs.idempotency_key` 선 insert — 중복 시 **no-op** + 200.
- 일정 생성 후 `schedules.external_booking_id` 유니크로 **이중 insert** 방지.

### 5.2 재시도

- **인바운드**: 네이버 재전송 대비 멱등; **422**는 재시도해도 실패할 유형(매핑 없음) — dead-letter + 알림.
- **아웃바운드**: 지수 백오프(1m, 5m, 30m, 2h); `retry_count` 상한 후 `FAILED` + OPS 알림.

### 5.3 아웃박스

- `Schedule` 변경·취소 트랜잭션 커밋 후 **`booking_outbox`**(또는 기존 outbox 패턴)에 `OUTBOUND_SLOT_SYNC` / `OUTBOUND_CANCEL` 이벤트 적재.
- 워커가 `OutboundSlotSync` 호출 — **동기 웹훅 핸들러에서 외부 HTTP 금지**.

---

## 6. `ScheduleServiceImpl.createConsultantSchedule` 연동 지점

[ADR-0004](../adr/adr-0004-external-booking-channel-naver-place-adapter.md) · [ADR-0001](../adr/adr-0001-scheduling-eligibility-vs-payment-deposit-gating.md)에 따라 어댑터는 **내부 서비스 경계만** 사용한다.

### 6.1 호출 경로(개념)

```
InboundWebhookHandler
  → ChannelMappingService.resolveProductMapping / resolveClientConsultant
  → (tenantId 바인딩)
  → ScheduleService.createConsultantSchedule(
        consultantId, clientId, date, startTime, endTime,
        title, description, consultationType, branchCode,
        tentativeBeforeDeposit  // PO: 외부 예약 기본 true/false
     )
  → schedules.external_booking_id / booking_source / sync_status 갱신
  → booking_sync_logs SUCCESS
```

### 6.2 검증·롤백(기존 구현 준수)

[`ScheduleServiceImpl.createConsultantSchedule`](../../src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java) 504~566행 경로:

- `hasTimeConflict` — 동일 슬롯 충돌 시 예외 → sync log `CONFLICT`.
- `validateMappingForSchedule` / `validateRemainingSessions` — 실패 시 **일정 미생성** → sync log `FAILED` + CS 큐([ADR-0002](../adr/adr-0002-session-remaining-and-mapping-status-transitions.md)).
- `tentativeBeforeDeposit` — 선예약·후결제([INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md))와 정합.

### 6.3 어댑터가 호출하면 안 되는 것

- `ScheduleRepository.save` 직접 호출
- 결제 확정·ERP·회기 차감 우회
- `tenantId` 없는 저장 분기

### 6.4 취소·변경(Phase 1+)

- **취소 웹훅**: `ScheduleService.cancelSchedule`(또는 확정된 취소 API) + `sync_status` 갱신.
- **변경 웹훅**: `updateSchedule` — 충돌 정책은 ADR-0004 Phase별 표.

---

## 7. core-coder 구현 완료 조건 체크리스트

### Phase 0 (스펙·스키마만 — 제휴 전)

- [ ] 본 스펙·ADR-0004 PO 승인(Proposed → Accepted)
- [ ] Flyway: §4 테이블·컬럼 **빈 마이그레이션 또는 feature flag off**
- [ ] `BookingChannel`·인터페이스 스켈레ton + `NAVER_PLACE` no-op 핸들러

### Phase 1 (단방향 수신)

- [ ] `POST /api/v1/webhooks/booking/naver-place` + 서명 검증(샌드박스 키)
- [ ] 멱등(`booking_sync_logs`) + `createConsultantSchedule` 연동
- [ ] `schedules.external_booking_id`·`booking_source`·`sync_status` 설정
- [ ] **tenantId** 격리 단위·통합 테스트([TESTING_STANDARD.md](./TESTING_STANDARD.md))
- [ ] 하드코딩 게이트·시크릿 `secret_ref`만 DB — [`PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)
- [ ] `core-tester`: 웹훅 CREATED 멱등·매핑 없음 422·충돌 CONFLICT

### Phase 2 (양방향)

- [ ] `OutboundSlotSync` + 아웃박스 워커
- [ ] ADR-0004 충돌 정책 PO 확정 반영
- [ ] 앱 취소 → 네이버 반영 E2E 1건

### Phase 3 (운영)

- [ ] 동기화 실패 알림·수동 재동기화 API
- [ ] 어드민 설정 UI — [`NAVER_PLACE_BOOKING_SETTINGS_UI_REQUIREMENTS.md`](../planning/NAVER_PLACE_BOOKING_SETTINGS_UI_REQUIREMENTS.md)

---

## 8. References

- [ADR-0003: 통합 일정 책임 경계](../adr/adr-0003-integrated-schedule-multissot-orchestration-boundaries.md)
- [`ScheduleService.java`](../../src/main/java/com/coresolution/consultation/service/ScheduleService.java) — `createConsultantSchedule` 10인자 경로
- [멀티테넌트 스킬](/.cursor/skills/core-solution-multi-tenant/SKILL.md) — `tenantId` 필수
