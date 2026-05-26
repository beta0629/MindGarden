# 회기 관리 시스템 정책 결정 합의서

**버전**: 0.2.0 (v2 — 사용자 컨펌 반영 + Phase 2/3 상세 설계)
**작성일**: 2026-05-26
**갱신일**: 2026-05-26
**작성**: core-planner
**상태**: ✅ 사용자 컨펌 확정 (Q1–Q4 + 보조 결정)
**참조 인벤토리**: explore Agent `6701d730` (회기 SSOT / PL-SQL 드리프트 / 환불 / 노쇼 인벤토리)
**병렬 작업**: P0/P1 핫픽스 3건 — core-coder Agent `1dd0d0ae` 진행 중 · Phase 1 PL/SQL 폐기 — core-coder Agent `d15ef2dc` 진행 중

---

## 0. 문서 목적

본 문서는 회기(session) 관리 시스템의 4대 미해결 정책 이슈를 사용자 결정으로 확정하고, Phase 2/3 상세 설계를 기록하는 **정책 합의서**이다.

- v0.1.0 (commit `ad4592ee8`): 초안 + 옵션 비교 + 권고.
- **v0.2.0 (본 문서)**: 사용자 컨펌 결과 + §2.1/§3.1/§4.1 상세 설계 + §5 Phase 갱신.
- 코드/DB/Flyway 변경은 0건 (read-only).
- 결정별 core-coder/core-planner/core-tester 위임은 별도 진행.
- 본 합의서는 `docs/standards/SESSION_STANDARD.md` 와 교차 참조될 예정.

### 0.1 사용자 컨펌 확정 요약

| Q | 확정 | 보조 결정 |
|---|------|-----------|
| **Q1** | **1A** — PL/SQL 폐기 | — (core-coder `d15ef2dc` 진행 중) |
| **Q2** | **2A** — BOOKED 유지 + 노쇼 보상 룰 | **A** — 0.5건 환원 허용 (24h 이내 50%) |
| **Q3** | **3A** — 자동 일괄 취소 (`REFUND_AUTO_CANCEL`) | **C** — 다채널 알림 의무화 (인앱 + 이메일 + 푸시 + 알림톡) |
| **Q4** | **4B** — 양방향 webhook 즉시 도입 | **A** — ERP 측 콜백 협의 완료, 즉시 Phase 3 진입 |

---

## 1. 배경 + 현재 상태

### 1.1 회기 SSOT(Single Source of Truth)

| 항목 | 값 |
|------|----|
| SSOT 테이블 | `consultant_client_mappings` |
| 핵심 컬럼 | `total_sessions`, `used_sessions`, `remaining_sessions`, `status`, `payment_status`, `version` |
| 동시성 제어 | JPA `@Version` (낙관적 락) |
| 표준 경로 | `AdminServiceImpl` / `ConsultantServiceImpl` / `ScheduleServiceImpl` (Java 단일 경로) |

### 1.2 인벤토리 핵심 발견 (Agent `6701d730`)

| # | 발견 | 영향 | 코드 위치 |
|---|------|------|-----------|
| F1 | PL/SQL 표준화 프로시저 5종 5개월 이상 비활성화, Java enum 과 status / payment_status 매핑 충돌 | 활성화 시 즉시 데이터 손상 | `database/schema/procedures_standardized/UseSessionForMapping_standardized.sql` 외 |
| F2 | `ScheduleStatus` 에 `NO_SHOW` / `LATE_CANCEL` 부재, 노쇼 정책 코드/문서/UI 모두 침묵 | 노쇼 발생 시 회기 차감/보상 룰 없음 | `src/main/java/com/coresolution/consultation/constant/ScheduleStatus.java` |
| F3 | 회기 차감 시점 = `Schedule` BOOKED/CONFIRMED/IN_PROGRESS 점유 전이 | 상담 종료 보장 없이 회기 소모 | `ScheduleServiceImpl` 일정 전이 로직 |
| F4 | `partialRefundMapping` 이 회기 컬럼만 갱신, 미래 BOOKED/CONFIRMED 일정 잔존 | 환불 후 일정 정합성 없음 (P0-B 핫픽스 진행 중) | `AdminServiceImpl.java:3507` (`partialRefundMapping`) |
| F5 | `sendToErpSystem` 모의 전송, 실제 ERP webhook 수신 경로 부재 | ERP 단독 환불 처리 시 데이터 불일치 | `AdminServiceImpl.java:4496-4516` |

### 1.3 PL/SQL ↔ Java 매핑 충돌 상세 (F1)

| 항목 | PL/SQL 기대값 | Java 표준값 (`MappingStatusConstants`) |
|------|--------------|----------------------------------------|
| 회기 소진 시 매핑 status | `'COMPLETED'` (`UseSessionForMapping_standardized.sql:157`) | `SESSIONS_EXHAUSTED` |
| 회기 사용 가능 결제 검증 | `payment_status = 'CONFIRMED'` 만 허용 (L111) | `APPROVED` 또는 `CONFIRMED` (Java 는 둘 다 허용) |
| 활성 매핑 status | `'ACTIVE'` | `ACTIVE` (일치) |

> 인용: `MappingStatusConstants.java` L18 (`SESSIONS_EXHAUSTED`), L25-26 (`CONFIRMED`/`APPROVED`).

### 1.4 ScheduleStatus 현행 enum (F2)

```
AVAILABLE / BOOKED / TENTATIVE_PENDING_PAYMENT / CONFIRMED /
IN_PROGRESS / VACATION / COMPLETED / CANCELLED
```

→ `NO_SHOW` / `LATE_CANCEL` 부재. `ScheduleStatus.occupiesTimeForConflictCheck()` 가 BOOKED/TENTATIVE_PENDING_PAYMENT/CONFIRMED/IN_PROGRESS 를 점유로 간주.

---

## 2. 4개 결정 사항 (확정)

각 결정은 **옵션 A/B/C × 권고 × 위험 × 작업량 추정** 표로 정리한다. ✅ 표시 = 사용자 컨펌 확정.

---

### 결정 1 — PL/SQL 표준화 프로시저의 거취 ✅ **1A 확정**

**현재 상태**: 5종 프로시저가 5개월+ 비활성화 상태. Java enum(`MappingStatusConstants`) 과 매핑 충돌(L1.3 표) → 활성화 시 즉시 데이터 손상.

**관련 자산**:
- `database/schema/procedures_standardized/UseSessionForMapping_standardized.sql`
- `database/schema/procedures_standardized/AddSessionsToMapping_standardized.sql`
- `database/schema/procedures_standardized/SyncAllMappings_standardized.sql`
- `database/schema/procedures_standardized/ValidateMappingIntegrity_standardized.sql`
- `database/schema/procedures_standardized/TestMappingSync_standardized.sql`
- Java: `src/main/java/com/coresolution/consultation/service/impl/PlSqlMappingSyncServiceImpl.java`

| 옵션 | 내용 | 장점 | 위험 | 작업량 |
|------|------|------|------|--------|
| **A ✅ (확정, 폐기)** | 5종 프로시저 + `PlSqlMappingSyncServiceImpl` 호출부 일괄 제거. Java 단일 경로 유지. Flyway: `DROP PROCEDURE IF EXISTS ...` 5종 + Java 파일 제거. | SSOT(Java) 명확화, 드리프트 영구 차단, 유지보수 부담 0 | 향후 PL/SQL 트랜잭션 일관성 이점을 잃음. 백업 SQL 보존 필요(아카이브) | S (1-2 PR, 마이그레이션 1건, 회귀 테스트 mapping 도메인 전수) |
| B (정합 마이그레이션) | PL/SQL `'COMPLETED'` → `'SESSIONS_EXHAUSTED'`, 결제 검증 `APPROVED OR CONFIRMED` 로 수정. PL/SQL 활성화. | PL/SQL 트랜잭션 일관성 활용 가능 | 5개월간 미가동 → 재활성화 시 회귀 위험 大. Java/PL-SQL 듀얼 경로 영구 유지 비용 | M~L |
| C (감사 전용 분리) | PL/SQL 은 비즈니스 로직 비활성, 감사 로그 전용 함수로 재설계 (READ-ONLY 트리거/뷰). | 감사 일관성 확보 | 복잡도 高, 재설계 부담, 실효성 불명확 | L |

**확정**: **옵션 A (폐기)**. 폐기 시 `database/schema/archived/` 로 SQL 원본 이동(이력 보존). **위임**: core-coder Agent `d15ef2dc` (Phase 1, 진행 중).

---

### 결정 2 — 회기 차감 시점 + 노쇼 정책 ✅ **2A + 0.5건 환원 확정**

**현재 상태**:
- 회기 차감 = `Schedule` BOOKED/CONFIRMED/IN_PROGRESS 점유 전이 시점 (상담 종료 보장 없음).
- `ScheduleStatus` 에 `NO_SHOW` / `LATE_CANCEL` 부재.
- 노쇼·지각 처리 코드/문서/UI 모두 침묵.

| 옵션 | 내용 | 장점 | 위험 | 작업량 |
|------|------|------|------|--------|
| **A ✅ (확정, BOOKED 유지 + 노쇼 보상)** | 차감 시점은 현재 BOOKED 유지. `ScheduleStatus` 에 `NO_SHOW` / `LATE_CANCEL` 추가. 시간 기준 보상 룰 도입. 보상 시 `consultant_client_mappings` 회기 컬럼 보정. | 기존 캘린더 UX 무변경. 노쇼 정책 명문화. 점진 도입 가능 | 보상 룰 마이그레이션 (과거 노쇼 일정 회기 보정 여부 결정 필요). UI 보상 사유 표기 추가 | M |
| B (COMPLETED 시점 이동) | 차감 시점을 상담 종료(COMPLETED) 로 이동. | 회기 = 실제 사용 으로 정확 | 캘린더/통계 전수 회귀. 작업량 大 | L |
| C (혼합 — 예약/사용 분리) | BOOKED 시점 = 회기 "예약". COMPLETED 시점 = 회기 "사용". | B 의 정확성 + 가용성 가시성 | 컬럼 신설 + Flyway + 통계 동시 갱신. 가장 복잡 | L+ |

**확정**: **옵션 A (BOOKED 유지 + 노쇼 보상)** + **보조 A (0.5건 환원 허용)**.

---

### 2.1 노쇼 보상 룰 상세 (Q2 + Q2 보조 = 2A · 0.5건 환원)

#### 2.1.1 보상 룰 매트릭스 (확정)

| 사유 | 시점 조건 | `ScheduleStatus` | 회기 환원율 | 처리 |
|------|-----------|------------------|------------|------|
| 내담자 자발 취소 | **≥ 24h before slot** (시작 시각 기준) | `CANCELLED` | **100%** | `used_sessions--`, `remaining_sessions++` (1건) |
| 내담자 자발 취소 | **< 24h before slot, > 시작 시각** | `CANCELLED` | **50%** | 0.5건 환원 (§2.1.2 옵션 c 권고) |
| 지각 (LATE_CANCEL) | 시작 직전 ~ 시작 시각 | `LATE_CANCEL` | **50%** | 24h 이내 취소와 **동일 규칙** |
| 노쇼 (NO_SHOW) | **시작 시각 경과 후 미참석** | `NO_SHOW` | **0%** | `used_sessions` 유지 (차감 확정) |
| 상담사 사유 취소 | 시점 무관 | `CANCELLED` | **100%** | 자동 1건 환원 |

> **24h 기준**: 일정 `startAt` (slot 시작 시각) 대비 취소/변경 요청 시각. 타임존 = 테넌트 기본 (`Asia/Seoul`).

#### 2.1.2 신규 ScheduleStatus

| enum 값 | 설명 | 점유(`occupiesTimeForConflictCheck`) | 회기 차감 |
|---------|------|--------------------------------------|----------|
| `NO_SHOW` | 시작 시각 경과 후 미참석 | false (종료 상태) | 유지 (0% 환원) |
| `LATE_CANCEL` | 시작 직전 취소 (지각 취소) | false | 50% 환원 |

- 공통코드 `SCHEDULE_STATUS_GROUP` 시드 추가 (Flyway 분리, Phase 2).
- 관리자/상담사 UI: 노쇼·지각 처리 액션 + 사유 선택.

#### 2.1.3 0.5건 환원 처리 옵션 (택 1 — 합의서 명시)

| 옵션 | 방식 | 장점 | 단점 |
|------|------|------|------|
| **(a) 별도 컬럼** | `consultant_client_mappings.half_session_credit` 신설 + UI 표기 분리 | 정수 컬럼 의미 보존, UI 분리 표기 용이 | 컬럼 추가, 2개 잔여 개념 혼재 |
| **(b) 분수 사용량** | `used_sessions` → `DECIMAL(5,1)` 변경 + 표기 정수/분수 토글 | 단일 컬럼으로 표현 | 기존 int 의미 변경 → 통계/리포트/프론트 전수 회귀 |
| **(c) ✅ 권고 — 보상 거래 별도 기록** | 회기 컬럼(`total`/`used`/`remaining`)은 **정수 유지** + `session_compensation_history` 테이블 신설 | 감사 추적 우선, UI 표기 단순(정수 + 보상 이력), 회귀 충격 최소 | 테이블/서비스 추가 |

**권고 (확정)**: **옵션 (c)** — 회기 컬럼 정수 유지 + `session_compensation_history` 별도 기록.

##### `session_compensation_history` 스키마 (Phase 2 설계안)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | |
| `mapping_id` | BIGINT FK | `consultant_client_mappings.id` |
| `schedule_id` | BIGINT FK (nullable) | 연관 일정 |
| `compensation_type` | VARCHAR | `FULL_RESTORE` / `HALF_RESTORE` / `NO_RESTORE` |
| `amount` | DECIMAL(3,1) | 환원량 (1.0 / 0.5 / 0.0) |
| `reason_code` | VARCHAR | `CANCEL_24H_PLUS` / `CANCEL_24H_MINUS` / `LATE_CANCEL` / `NO_SHOW` / `CONSULTANT_CANCEL` |
| `applied_by` | BIGINT | 처리 사용자 ID |
| `applied_at` | TIMESTAMP | |
| `tenant_id` | VARCHAR | 멀티테넌트 격리 |

- 0.5건 환원 시: `remaining_sessions` 는 정수 유지, **누적 0.5 × 2 = 1건** 도달 시 `remaining_sessions++` + 이력 2행 기록 (또는 배치 정산).
- UI: 매핑 상세에 "보상 이력" 탭 — `amount` 합산 표시.

#### 2.1.4 Phase 2 구현 범위 (core-coder + core-tester)

1. `ScheduleStatus` enum + 공통코드 시드.
2. `SessionCompensationService` — 24h 경계 판정 + 보상 트랜잭션.
3. `session_compensation_history` Flyway + JPA 엔티티.
4. 관리자 노쇼/지각 처리 UI + API.
5. 보상 시나리오별 통합 테스트 (100% / 50% / 0% / 상담사 취소).

---

### 결정 3 — 부분 환불 후 미래 일정 자동 취소 정책 ✅ **3A + 다채널 알림 확정**

**현재 상태**:
- `partialRefundMapping(L3507)` 은 회기 컬럼만 갱신 + remaining=0 시 status `SESSIONS_EXHAUSTED` 만 설정.
- 미래 BOOKED/CONFIRMED 일정은 그대로 잔존.
- **P0-B 핫픽스에서 일괄 CANCELLED 처리 적용 예정** (core-coder Agent `1dd0d0ae` 진행 중).

| 옵션 | 내용 | 장점 | 위험 | 작업량 |
|------|------|------|------|--------|
| **A ✅ (확정, 자동 일괄 취소)** | remaining=0 시 미래 일정 자동 CANCELLED + 다채널 알림. 사유: `REFUND_AUTO_CANCEL`. | 데이터 정합 자동 보장 | 의도치 않은 취소 시 복구 어려움 | S~M |
| B (사용자 동의 모달) | 환불 전 확인 모달 | UX 명확 | 2-step 워크플로, 배치 충돌 | M |
| C (정책 알림만) | 자동 취소 X | 최소 침습 | 데이터 정합 깨짐. **비권장** | S |

**확정**: **옵션 A (자동 일괄 취소)** + **보조 C (다채널 알림 의무화 — 사용자 채널 선호도 무시, 일괄 발송)**.

---

### 3.1 자동 일괄 취소 + 다채널 알림 의무 (Q3 + Q3 보조 = 3A · 다채널)

#### 3.1.1 적용 대상

| 메서드 | 트리거 | 일정 처리 |
|--------|--------|----------|
| `partialRefundMapping` | 부분 환불 후 `remaining_sessions = 0` | 미래 BOOKED/CONFIRMED → `CANCELLED`, 사유 = `REFUND_AUTO_CANCEL` |
| `terminateMapping` | 매핑 종료/전액 환불 | 미래 일정 일괄 `CANCELLED`, 사유 = `REFUND_AUTO_CANCEL` |

#### 3.1.2 알림 채널 의무 (4채널 일괄 발송)

> **사용자 채널 선호도 무시** — 환불 자동 취소는 법적/운영 고지 성격 → 4채널 모두 발송.

| # | 채널 | 구현 | 비고 |
|---|------|------|------|
| 1 | **인앱 알림** | `Notification` 엔티티 생성 | 내담자 + 상담사 + (해당 시) 관리자 |
| 2 | **이메일** | `EmailService.sendAutoCancelNotification` | 신규 메서드 |
| 3 | **모바일 푸시** | `mobilePushDispatchService.dispatchAutoCancellation` | 신규 메서드 |
| 4 | **알림톡** | `AlimtalkService` + 템플릿 `AUTO_CANCEL_REFUND` | **솔라피 신규 템플릿 등록 필요** (§3.1.4) |

#### 3.1.3 알림 표준 카피 (Q3 보조 = C)

| 필드 | 내용 |
|------|------|
| **제목** | `예약 취소 안내 (환불 처리)` |
| **본문** | `환불 처리로 인해 [N건] 의 예약이 자동 취소되었습니다. 자세한 사항은 마이페이지에서 확인하세요.` |
| **변수** | `[N]` = 취소된 미래 일정 건수 |

- 인앱/푸시: 제목 + 본문 축약.
- 이메일: HTML 템플릿 + 마이페이지 딥링크.
- 알림톡: 솔라피 템플릿 변수 `{cancelCount}`, `{mypageUrl}`.

#### 3.1.4 솔라피 `AUTO_CANCEL_REFUND` 템플릿 등록 (권고)

| 항목 | 값 |
|------|-----|
| 템플릿 코드 | `AUTO_CANCEL_REFUND` |
| 카테고리 | 예약/취소 |
| 본문 예시 | `[MindGarden] 환불 처리로 인해 #{cancelCount}건의 예약이 자동 취소되었습니다. 자세한 사항은 #{mypageUrl} 에서 확인하세요.` |
| 등록 시점 | **Phase 0 (P0-B 후속)** — 알림 구현과 동시 |
| 담당 | core-coder (코드) + 운영 (솔라피 콘솔 템플릿 승인) |

#### 3.1.5 감사 로그

| 대상 | 기록 내용 |
|------|----------|
| `consultant_client_mappings.notes` | `REFUND_AUTO_CANCEL: N건 취소, 처리자={userId}, 시각={timestamp}` |
| `consultant_client_mapping_history` | 행 추가 — 사유 코드, 취소 건수, 처리 사용자 ID |
| 알림 발송 결과 | 채널별 `{channel: SUCCESS|FAIL, error?}` JSON (인앱/이메일/푸시/알림톡) |

---

### 결정 4 — ERP 환불 webhook 경로 ✅ **4B + 즉시 Phase 3 진입 확정**

**현재 상태**:
- `sendToErpSystem(L4496-4516)` 모의 전송. 항상 `success=true` 반환.
- 실제 ERP webhook 수신 경로 없음.

| 옵션 | 내용 | 장점 | 위험 | 작업량 |
|------|------|------|------|--------|
| A (단방향 송신) | Mindgarden → ERP 송신만 | 구현 부담 0 | ERP 단독 환불 시 DB 갱신 누락 | XS |
| **B ✅ (확정, 양방향 webhook)** | ERP → Mindgarden webhook 수신 + 서명/멱등 + 자동 환불 동기 | 실시간 정합 자동 보장 | 보안 + 멱등 + 재시도 설계 | L |
| C (관리자 게이트) | 사람 게이트 후 적용 | 오반영 위험 차단 | 수동 작업/지연 | M |

**확정**: **옵션 B (양방향 webhook 즉시 도입)** + **보조 A (ERP 측 콜백 협의 완료 → Phase 3 즉시 진입)**.
**Phase 4 (선택)**: 옵션 C 관리자 게이트 (`reflect-erp-refund`) — 수동 보정 대비.

---

### 4.1 ERP 양방향 webhook 상세 설계 (Q4 + Q4 보조 = 4B · 즉시 진입)

#### 4.1.1 Endpoint

| 항목 | 값 |
|------|-----|
| **URL** | `POST /api/v1/integration/erp/refund-webhook` |
| **Content-Type** | `application/json` |
| **멱등 키** | `X-Idempotency-Key` 헤더 (ERP 측 환불 `transactionId`) |

**HTTP 응답**:

| 코드 | 의미 |
|------|------|
| `200` | 수신·처리 성공 |
| `409` | 중복 idempotency key (이미 처리됨) |
| `400` | 서명 불일치 / 페이로드 검증 실패 / 타임스탬프 만료 |
| `500` | 내부 처리 실패 (ERP 재시도 대상) |

#### 4.1.2 보안

| 항목 | 구현 |
|------|------|
| **HMAC SHA-256** | `X-Mindgarden-Signature` 헤더 — ERP 공유 비밀키로 페이로드 서명 검증 |
| **IP allowlist** | `application.yml` → `mindgarden.integration.erp.allowed-ips` (협의된 ERP IP 등록) |
| **TLS only** | HTTP 요청 거부 (443/TLS 필수) |
| **Replay 방지** | `X-Timestamp` 헤더 — **5분 이내** 요청만 허용 |

서명 생성 (ERP 측):
```
signature = HMAC-SHA256(secret, timestamp + "." + rawBody)
```

#### 4.1.3 페이로드 (예시)

```json
{
  "transactionId": "ERP-20260601-001",
  "tenantId": "...",
  "mappingId": 123,
  "refundType": "FULL",
  "refundAmount": 50000,
  "refundSessions": 3,
  "reason": "고객 요청 전액 환불",
  "occurredAt": "2026-06-01T10:00:00+09:00"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `transactionId` | ✅ | ERP 고유 거래 ID (= idempotency key) |
| `tenantId` | ✅ | 테넌트 격리 |
| `mappingId` | ✅ | `consultant_client_mappings.id` |
| `refundType` | ✅ | `FULL` \| `PARTIAL` |
| `refundAmount` | ✅ | 환불 금액 (원) |
| `refundSessions` | PARTIAL 시 | 환불 회기 수 |
| `reason` | | ERP 측 사유 |
| `occurredAt` | ✅ | ERP 처리 시각 (ISO-8601) |

#### 4.1.4 처리 흐름

```
ERP POST refund-webhook
  │
  ├─ 1. TLS + IP allowlist 검증
  ├─ 2. X-Timestamp (5분) + HMAC SHA-256 검증
  ├─ 3. X-Idempotency-Key 중복 검사 → 409 if exists
  ├─ 4. mapping payment_status / status 정합 확인
  ├─ 5. refundType 분기:
  │     ├─ FULL  → terminateMapping (사유 = ERP_WEBHOOK_REFUND)
  │     └─ PARTIAL → partialRefundMapping (사유 = ERP_WEBHOOK_REFUND)
  ├─ 6. 회기 컬럼 갱신 + 미래 일정 일괄 CANCELLED (§3.1, REFUND_AUTO_CANCEL)
  ├─ 7. 다채널 알림 발송 (§3.1.2, 4채널)
  ├─ 8. erp_refund_webhook_log 기록
  └─ 9. 200 OK 응답
```

#### 4.1.5 재시도 + 감사

| 항목 | 정책 |
|------|------|
| **ERP 재시도** | 5분 간격 × 5회 (멱등 키로 중복 차단) |
| **Dead letter (선택)** | 5회 실패 → Slack 알림 → 관리자 수동 조치 |
| **로그 테이블** | `erp_refund_webhook_log` 신설 |

##### `erp_refund_webhook_log` 스키마 (Phase 3 설계안)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | |
| `idempotency_key` | VARCHAR UNIQUE | `transactionId` |
| `request_body` | TEXT | 원본 JSON |
| `signature` | VARCHAR | 수신 서명 |
| `client_ip` | VARCHAR | 요청 IP |
| `status` | VARCHAR | `RECEIVED` / `PROCESSED` / `DUPLICATE` / `FAILED` |
| `error_message` | TEXT (nullable) | 실패 시 |
| `processed_at` | TIMESTAMP | |
| `tenant_id` | VARCHAR | |

#### 4.1.6 단계적 진행 (Phase 3 분할)

| Sub-Phase | 기간 | 범위 | 위임 |
|-----------|------|------|------|
| **Phase 3.1** | 1주 | webhook endpoint 신설 + HMAC + IP allowlist + 멱등 + `erp_refund_webhook_log` + 단위 테스트 | core-coder (보안) |
| **Phase 3.2** | 1주 | `partialRefundMapping`/`terminateMapping` 통합 + §3.1 다채널 알림 통합 + 통합 테스트 | core-coder + core-tester |
| **Phase 3.3** | 1주 | ERP stage 환경 연동 테스트 + 운영 반영 + deployer | core-coder + core-tester + ERP 협의 + deployer |
| **Phase 4 (선택)** | — | 4C 관리자 게이트 (`POST /api/v1/admin/mappings/{id}/reflect-erp-refund`) — 수동 보정 대비 | core-coder |

---

## 5. Phase 진행 순서 (갱신)

확정 조합: **1A · 2A · 3A · 4B**.

| Phase | 결정 | 의존 | 기간 | 위임 대상 |
|-------|------|------|------|-----------|
| **Phase 0 (즉시)** | 3A 후속 — P0-B + `REFUND_AUTO_CANCEL` + §3.1 다채널 알림 + 솔라피 `AUTO_CANCEL_REFUND` | PR #3 (P0-B) 머지 후 | 즉시 | core-coder |
| **Phase 1 (1주)** | 1A — PL/SQL 5종 + `PlSqlMappingSyncServiceImpl` 폐기 | 독립 (**Agent `d15ef2dc` 진행 중**) | 1주 | core-coder + deployer |
| **Phase 2 (2주)** | 2A — §2.1 노쇼 보상 룰 + `NO_SHOW`/`LATE_CANCEL` + `session_compensation_history` | Phase 1 머지 후 | 2주 | core-coder + core-tester |
| **Phase 3 (3주)** | 4B — §4.1 ERP webhook (3.1 → 3.2 → 3.3) | Phase 0 + Phase 2 머지 후 | 3주 | core-coder (보안) + core-tester (통합) + ERP 협의 |
| **Phase 4 (선택)** | 4C — 관리자 ERP 환불 반영 게이트 | Phase 3 도입 후 | — | core-coder |

### 5.1 분배실행 표 (다음 위임 권고)

| Phase | subagent | 전달 prompt 요약 | 병렬 |
|-------|----------|-----------------|------|
| **Phase 0** | core-coder | P0-B 후속: `REFUND_AUTO_CANCEL` 사유 코드 + §3.1 4채널 알림 + `EmailService.sendAutoCancelNotification` + `dispatchAutoCancellation` + `AlimtalkService` `AUTO_CANCEL_REFUND` + 감사 로그 | PR #3 머지 후 단독 |
| **Phase 2** | core-coder | §2.1: `ScheduleStatus` NO_SHOW/LATE_CANCEL + `SessionCompensationService` + `session_compensation_history` (옵션 c) + 관리자 UI | Phase 1 머지 후 |
| **Phase 2** | core-tester | 보상 룰 시나리오 통합 테스트 (100%/50%/0%/상담사 취소) | core-coder와 병렬 (API 확정 후) |
| **Phase 3.1** | core-coder | §4.1.1–4.1.2: `POST /api/v1/integration/erp/refund-webhook` + HMAC + IP allowlist + 멱등 + `erp_refund_webhook_log` + 단위 테스트 | Phase 0+2 머지 후 |
| **Phase 3.2** | core-coder + core-tester | §4.1.4 처리 흐름 + §3.1 알림 통합 + E2E | 3.1 완료 후 |
| **Phase 3.3** | core-coder + deployer | ERP stage 연동 + 운영 반영 | 3.2 완료 후 |

---

## 6. KPI + 검증

### 6.1 KPI

| 지표 | 측정 방법 | 목표 |
|------|----------|------|
| K1. PL/SQL 호출 0건 | `PlSqlMappingSyncServiceImpl` 호출 카운터 + 운영 로그 grep | Phase 1 완료 후 0건 유지 |
| K2. 회기 정합성 | `total = used + remaining` 무결성 배치 | 일 위반 0건 |
| K3. 환불 후 일정 정합 | 부분/전액 환불 후 미래 BOOKED/CONFIRMED 잔존 0건 | 100% |
| K4. 노쇼 정책 적용율 | 보상 트랜잭션 수 / `NO_SHOW`·`LATE_CANCEL` 발생 수 | 100% |
| K5. ERP webhook 처리율 | `erp_refund_webhook_log` PROCESSED / 수신 총건 | 100% (5회 재시도 내) |
| K6. 다채널 알림 발송율 | REFUND_AUTO_CANCEL 시 4채널 SUCCESS 비율 | ≥ 99% (채널별) |

### 6.2 회귀 테스트 항목

- 매핑 도메인: 회기 사용/추가/환불/소진/만료 시나리오.
- 일정 도메인: BOOKED → COMPLETED / NO_SHOW / LATE_CANCEL / CANCELLED 전이.
- 환불 도메인: 부분/전액 환불 후 미래 일정 + §3.1 알림.
- ERP webhook: HMAC 검증 / 멱등 / FULL·PARTIAL 분기 / 재시도.
- 보상 도메인: 24h 경계 / 0.5건 누적 / NO_SHOW 0% 환원.
- 통계 도메인: `remaining_sessions` / `used_sessions` 정수 의미 무변경 (옵션 2.1.3-c).

---

## 7. 사용자 컨펌 기록 (확정)

> **2026-05-26 사용자 컨펌 완료.** 아래는 확정 기록.

### Q1. PL/SQL 표준화 프로시저의 거취
- ✅ **1A — 폐기** (확정). 5종 프로시저 + 호출 Java 일괄 제거. 백업 SQL 아카이브.

### Q2. 회기 차감 시점 + 노쇼 정책
- ✅ **2A — BOOKED 유지 + 노쇼 보상 룰 도입** (확정).

**Q2 보조 결정** (확정):
- ✅ 보상 룰 = **0.5건 환원 허용** (24h 이전 100% / 24h 이내 50% / 노쇼 0% / LATE_CANCEL 50%).
- ☐ 과거 노쇼 일정 회기 보정: **별도 검토** (Phase 2 착수 전 결정).

### Q3. 부분 환불 후 미래 일정 자동 취소 정책
- ✅ **3A — 자동 일괄 취소** (확정). 사유 `REFUND_AUTO_CANCEL` + 감사 + 다채널 알림.

**Q3 보조 결정** (확정):
- ☐ 임계치 N건 이상 추가 확인 모달: **미도입** (3A 단순 경로).
- ☐ 24h 이내 undo 액션: **미도입** (v2 범위 외).
- ✅ 알림 채널: **인앱 + 이메일 + 푸시 + 알림톡** (4채널 의무, 선호도 무시).

### Q4. ERP 환불 webhook 경로
- ✅ **4B — 양방향 webhook (즉시)** (확정).

**Q4 보조 결정** (확정):
- ✅ ERP 측 콜백 **협의 완료** → **Phase 3 즉시 진입**.
- ☐ Phase 4 (4C 관리자 게이트): **선택** — Phase 3 안정 후 수동 보정용.

---

## 8. 게이트 (운영 반영 / Flyway / 회귀 테스트)

### 8.1 운영 반영 게이트
- ✅ **사용자 컨펌 완료** (Q1–Q4 + 보조 결정).
- ✅ **변경 단위 PR 분리**: Phase별 1 PR(또는 1–2 PR), 단일 PR 에 다중 Phase 포함 금지.
- ✅ **deployer 위임 + 운영 배포 윈도우 준수** (`docs/standards/DEPLOYMENT_STANDARD.md` 정합).

### 8.2 Flyway 게이트
- ✅ Phase 1 (PL/SQL 폐기): `DROP PROCEDURE IF EXISTS` 5종 + 백업 SQL `database/schema/archived/` (1 마이그레이션).
- ✅ Phase 2 (노쇼): `session_compensation_history` 테이블 + `ScheduleStatus` 공통코드 시드 (마이그레이션 분리).
- ✅ Phase 3 (ERP webhook): `erp_refund_webhook_log` 테이블 (마이그레이션 1건).
- ✅ 모든 마이그레이션: `docs/standards/DATABASE_MIGRATION_STANDARD.md` idempotent 원칙.

### 8.3 회귀 테스트 게이트
- ✅ 매핑 도메인 단위 테스트 통과.
- ✅ Phase 2: §2.1 보상 룰 시나리오별 통합 테스트.
- ✅ Phase 3: ERP webhook HMAC/멱등/E2E + §3.1 알림 발송 검증.
- ✅ 회귀 충격: 통계/리포트/캘린더/모바일 앱 영향도.

### 8.4 본 합의서 v2 게이트 (Read-Only)
- ❌ 본 v2 갱신은 코드/DB/Flyway 변경 0건.
- ❌ core-coder / deployer 호출 금지 (위임은 사용자 검수 후 별도 진행).
- ✅ 단일 파일(`docs/standards/SESSION_MANAGEMENT_POLICY_DECISIONS.md`).
- ✅ `docs/session-mgmt-policy` 브랜치 커밋 + push.

---

## 9. 다음 단계

1. **사용자 검수**: 본 v2 합의서 (§2.1 / §3.1 / §4.1 / §5) 확인.
2. **Phase 진입 위임** (검수 후 별도 진행):
   - **Phase 0** → core-coder: P0-B 후속 + §3.1 다채널 알림 + 솔라피 `AUTO_CANCEL_REFUND`.
   - **Phase 1** → core-coder `d15ef2dc` (진행 중): PL/SQL 폐기 PR 완료 + deployer.
   - **Phase 2** → core-coder + core-tester: §2.1 노쇼 보상 룰 (Phase 1 머지 후).
   - **Phase 3** → core-coder (보안) + core-tester (통합) + ERP 협의: §4.1 webhook 3.1→3.3.
   - **Phase 4 (선택)** → core-coder: 4C 관리자 게이트.
3. **합의서 승격**: Phase 0 착수 후 v1.0.0 formal release 검토.

---

**문서 끝.** v0.2.0 — 정책 합의 + Phase 2/3 상세 설계 read-only 산출물. 코드 변경은 Phase별 core-coder 위임으로 진행.
