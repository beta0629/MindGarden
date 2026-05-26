# 회기 관리 시스템 정책 결정 합의서

**버전**: 0.1.0 (초안)
**작성일**: 2026-05-26
**작성**: core-planner
**상태**: 사용자 컨펌 대기
**참조 인벤토리**: explore Agent `6701d730` (회기 SSOT / PL-SQL 드리프트 / 환불 / 노쇼 인벤토리)
**병렬 작업**: P0/P1 핫픽스 3건 — core-coder Agent `1dd0d0ae` 진행 중

---

## 0. 문서 목적

본 문서는 회기(session) 관리 시스템의 4대 미해결 정책 이슈를 사용자 결정으로 확정하기 위한 **정책 합의서**이다.
- 코드/DB/Flyway 변경은 0건 (read-only).
- 사용자 컨펌 → 결정별 core-coder/core-planner 위임 분배.
- 본 합의서는 결정 후 `docs/standards/SESSION_STANDARD.md` 와 교차 참조될 예정.

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

## 2. 4개 결정 사항

각 결정은 **옵션 A/B/C × 권고 × 위험 × 작업량 추정** 표로 정리한다.

---

### 결정 1 — PL/SQL 표준화 프로시저의 거취

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
| **A (권고, 폐기)** | 5종 프로시저 + `PlSqlMappingSyncServiceImpl` 호출부 일괄 제거. Java 단일 경로 유지. Flyway: `DROP PROCEDURE IF EXISTS ...` 5종 + Java 파일 제거. | SSOT(Java) 명확화, 드리프트 영구 차단, 유지보수 부담 0 | 향후 PL/SQL 트랜잭션 일관성 이점을 잃음. 백업 SQL 보존 필요(아카이브) | S (1-2 PR, 마이그레이션 1건, 회귀 테스트 mapping 도메인 전수) |
| B (정합 마이그레이션) | PL/SQL `'COMPLETED'` → `'SESSIONS_EXHAUSTED'`, 결제 검증 `APPROVED OR CONFIRMED` 로 수정. PL/SQL 활성화. | PL/SQL 트랜잭션 일관성 활용 가능 | 5개월간 미가동 → 재활성화 시 회귀 위험 大. Java/PL-SQL 듀얼 경로 영구 유지 비용 | M~L (PL/SQL 5종 수정 + 통합 테스트 + 활성화 절차 + 운영 모니터링) |
| C (감사 전용 분리) | PL/SQL 은 비즈니스 로직 비활성, 감사 로그 전용 함수로 재설계 (READ-ONLY 트리거/뷰). | 감사 일관성 확보 | 복잡도 高, 재설계 부담, 실효성 불명확 | L (재설계 + 마이그레이션 + 테스트) |

**권고**: **옵션 A (폐기)**. 5개월 미가동 + Java SSOT 가 안정적이며, 드리프트 위험을 영구 제거. 폐기 시 `database/schema/archived/` 로 SQL 원본 이동(이력 보존).

---

### 결정 2 — 회기 차감 시점 + 노쇼 정책

**현재 상태**:
- 회기 차감 = `Schedule` BOOKED/CONFIRMED/IN_PROGRESS 점유 전이 시점 (상담 종료 보장 없음).
- `ScheduleStatus` 에 `NO_SHOW` / `LATE_CANCEL` 부재.
- 노쇼·지각 처리 코드/문서/UI 모두 침묵.

| 옵션 | 내용 | 장점 | 위험 | 작업량 |
|------|------|------|------|--------|
| **A (권고, BOOKED 유지 + 노쇼 보상)** | 차감 시점은 현재 BOOKED 유지. `ScheduleStatus` 에 `NO_SHOW` / `LATE_CANCEL` 추가. 시간 기준 보상 룰 도입 (예: 24h 이전 취소 = 100% 복원, 24h 이내 = 50% 복원, 노쇼 = 0% 복원). 보상 시 `consultant_client_mappings` 회기 컬럼 보정. | 기존 캘린더 UX 무변경. 노쇼 정책 명문화. 점진 도입 가능 | 보상 룰 마이그레이션 (과거 노쇼 일정 회기 보정 여부 결정 필요). UI 보상 사유 표기 추가 | M (enum 추가 + 정책 서비스 + UI 노쇼 액션 + 보상 트랜잭션) |
| B (COMPLETED 시점 이동) | 차감 시점을 상담 종료(COMPLETED) 로 이동. 예약 시 가차감(예약 점유 가산) 별도 컬럼/뷰로 노출. | 회기 = 실제 사용 으로 정확 | 캘린더 가용성 표시 변경 + UI 회귀 위험 大. `remaining_sessions` 의미 변경 → 프론트/리포트/통계 전수 회귀. 작업량 大 | L (도메인 의미 변경 + 프론트 회귀 + 통계 재계산) |
| C (혼합 — 예약/사용 분리) | BOOKED 시점 = 회기 "예약"(`reserved_sessions` 신설, 차감 안 됨). COMPLETED 시점 = 회기 "사용"(`used_sessions` 차감). `Schedule.session_sequence` 활용. UI 표기 분리. | B 의 정확성 + 가용성 가시성 | 컬럼 신설 + Flyway + 통계 동시 갱신 + 노쇼 정책 별도 정의 필요. 가장 복잡 | L+ (스키마 + 도메인 + 통계 + UI + 마이그레이션) |

**권고**: **옵션 A (BOOKED 유지 + 노쇼 보상)**. 현행 동작 보존하면서 정책 공백을 메우는 최소 침습 경로. 향후 데이터 누적 후 옵션 C 로 이행 가능.

**보상 룰 초안 (옵션 A 권고 시 사용자 컨펌 필요)**:

| 사유 | 시점 | 회기 복원율 | 비고 |
|------|------|------------|------|
| 내담자 자발 취소 | 24h 이전 | 100% | 일정 CANCELLED, 회기 1건 환원 |
| 내담자 자발 취소 | 24h 이내 ~ 시작 전 | 50% | 정책상 패널티, 0.5건 환원 |
| 노쇼 (NO_SHOW) | 시작 시각 경과 + 미참여 | 0% | 회기 차감 유지, 일정 NO_SHOW 표시 |
| 지각 (LATE_CANCEL) | 시작 직전 취소 | 0% | 노쇼와 동일 처리 (정책 자유) |
| 상담사 사유 취소 | 시점 무관 | 100% | 자동 100% 복원 |

> 0.5건 복원이 회계/통계와 충돌하면 0% / 100% 이진 룰로 단순화 가능 (사용자 결정).

---

### 결정 3 — 부분 환불 후 미래 일정 자동 취소 정책

**현재 상태**:
- `partialRefundMapping(L3507)` 은 회기 컬럼만 갱신 + remaining=0 시 status `SESSIONS_EXHAUSTED` 만 설정.
- 미래 BOOKED/CONFIRMED 일정은 그대로 잔존.
- **P0-B 핫픽스에서 일괄 CANCELLED 처리 적용 예정** (core-coder Agent `1dd0d0ae` 진행 중).

| 옵션 | 내용 | 장점 | 위험 | 작업량 |
|------|------|------|------|--------|
| **A (권고, 자동 일괄 취소)** | P0-B 핫픽스 그대로 유지 → remaining=0 시 미래 일정 자동 CANCELLED + 알림 발송 (관리자/상담사/내담자). 사유: `REFUND_AUTO_CANCEL`. | 데이터 정합 자동 보장. 추가 UI 분기 없음 | 의도치 않은 일정 취소 시 복구 어려움. 알림 누락 시 사용자 혼란 | S (P0-B 의 후속 알림 채널 추가 + 감사 로그) |
| B (사용자 동의 모달) | 부분 환불 처리 전 모달: "남은 회기가 0이 됩니다. 미래 예약 X건을 자동 취소합니까?" 확인 후 처리. | UX 명확. 관리자 의사결정 가시화 | 환불 워크플로 분기 추가 (single-step → 2-step). 야간 자동 환불 배치와 충돌 가능 | M (백엔드 미리보기 API + 프론트 모달 + i18n) |
| C (정책 알림만) | 자동 취소 X. 사용자에게 알림만 발송 + 별도 취소 액션 필요. | 최소 침습 | remaining=0 + 미래 BOOKED 잔존 → 데이터 정합 깨짐 (스케줄러/통계/캘린더 충돌). 비권장 | S (알림만) |

**권고**: **옵션 A (자동 일괄 취소)**. P0-B 핫픽스의 자연스러운 후속. 다만 **취소 사유 코드 신설(`REFUND_AUTO_CANCEL`) + 감사 로그 + 다채널 알림** 을 정책 표준으로 명문화.

**옵션 A 확장 안전장치 (사용자 컨펌 필요)**:
1. 미래 일정 N건 임계치(예: N>=5) 시 추가 확인 모달 강제.
2. 자동 취소된 일정 24h 이내 복구 액션(undo) 제공.
3. 알림 채널: 인앱 + 이메일(option) + 푸시.

---

### 결정 4 — ERP 환불 webhook 경로

**현재 상태**:
- `sendToErpSystem(L4496-4516)` 모의 전송. 항상 `success=true` 반환 (`AdminServiceImpl.java:4509-4510`).
- 실제 ERP webhook 수신 경로 없음.
- 외부 ERP 가 단독 환불 처리 시 정합 미정의 (`docs/debug/REFUND_SYSTEM_ERP_AND_UI_ANALYSIS.md` §3 참조).

| 옵션 | 내용 | 장점 | 위험 | 작업량 |
|------|------|------|------|--------|
| A (단방향 송신) | Mindgarden → ERP 환불 정보 송신만 유지(현행). ERP 단독 환불 시 관리자 수동 동기. | 구현 부담 0 | ERP 단독 환불 처리 시 우리 DB 갱신 누락 누적 | XS |
| B (양방향 webhook) | ERP → Mindgarden webhook 수신 endpoint 신설(`POST /api/v1/erp/callbacks/refund-completed`) + 서명/멱등 검증 + 자동 환불 동기. | 실시간 정합 자동 보장 | ERP 측 콜백 구현 협의 필수. 보안(HMAC/IP whitelist) + 멱등 + 재시도 설계 부담. ERP 일정 의존 | L (수신 API + 보안 + 멱등 + 재시도 + 통합 테스트 + ERP 협의) |
| **C (권고, 선택적 동기 — 관리자 게이트)** | ERP 측 환불 → Mindgarden 관리자용 "ERP 환불 반영" 화면(`POST /api/v1/admin/mappings/{id}/reflect-erp-refund`) + 사람 게이트 후 적용. 향후 옵션 B 로 무중단 이행 가능. | 사람 게이트로 오반영 위험 차단. 단계적 도입 가능 | 수동 작업 필요. 누락/지연 가능. UI 작업 부담 | M (관리자 화면 + API + 재무 거래 생성 재사용 + 감사 로그) |

**권고**: **옵션 C (선택적 동기 — 관리자 게이트)**. ERP 측 콜백 협의 미정 상태에서 즉시 도입 가능. **추후 ERP 협의 완료 시 옵션 B 로 점진 확장** (옵션 C 의 reflect API 가 옵션 B webhook 수신 핸들러로 그대로 재사용됨).

**옵션 C 확장 단계 안 (사용자 컨펌 필요)**:
1. **Phase 1 (Now)**: 옵션 C 관리자 게이트 화면 + API.
2. **Phase 2 (ERP 협의 후)**: 옵션 B webhook endpoint 추가, 동일 핸들러 재사용.
3. **Phase 3 (운영 안정 후)**: `getRefundHistory.erpStatus` 고정 `"SENT"` → ERP 실제 처리 결과 반영.

---

## 3. 결정 후 Phase 계획

권고 조합(**1A · 2A · 3A · 4C**) 기준 작업 분배 안. 사용자 컨펌 후 확정.

### Phase 0 — 즉시 (P0/P1 핫픽스 완료 직후, core-coder)
- **결정 3-A 후속**: 자동 취소 사유 코드(`REFUND_AUTO_CANCEL`) + 감사 로그 + 다채널 알림.
- **위임**: core-coder Agent (P0-B 후속).

### Phase 1 — 1주 (PL/SQL 폐기, core-coder + deployer)
- **결정 1-A**: 5종 프로시저 + `PlSqlMappingSyncServiceImpl` 제거. Flyway 마이그레이션 1건. 백업 SQL `database/schema/archived/` 이동.
- **회귀 테스트**: 매핑 도메인 전수(`UseSession`, `AddSessions`, `partialRefund`, `terminate`, `SyncAllMappings`).
- **위임**: core-coder + 배포 게이트 deployer.

### Phase 2 — 2주 (노쇼 정책 + 보상, core-planner + core-coder)
- **결정 2-A**: `ScheduleStatus` 에 `NO_SHOW` / `LATE_CANCEL` 추가 + 보상 룰 서비스 + 관리자 노쇼 처리 UI + 보상 룰 테이블/공통코드.
- **선행 의존**: 보상 룰 사용자 컨펌(0.5건 vs 0/100% 이진).
- **위임**: core-planner(스키마/룰 설계) → core-coder(구현).

### Phase 3 — 1개월 (ERP 관리자 게이트, core-coder)
- **결정 4-C**: 관리자 "ERP 환불 반영" 화면 + `reflect-erp-refund` API + 감사 로그.
- **위임**: core-coder.

### Phase 4 — 추후 (ERP 양방향, ERP 협의 완료 시)
- **결정 4-C → 4-B 확장**: webhook 수신 endpoint + HMAC 검증 + 멱등 키.
- **위임**: core-planner(보안 설계) → core-coder.

---

## 4. KPI + 검증

### 4.1 KPI

| 지표 | 측정 방법 | 목표 |
|------|----------|------|
| K1. PL/SQL 호출 0건 | `PlSqlMappingSyncServiceImpl` 호출 카운터 + 운영 로그 grep | Phase 1 완료 후 0건 유지 (드리프트 종결) |
| K2. 회기 정합성 | `consultant_client_mappings` 무결성 배치(`ValidateMappingIntegrity` 의 Java 포팅): `total = used + remaining` 검증 | 일 위반 0건 |
| K3. 환불 후 일정 정합 | 부분 환불 + remaining=0 사례에서 미래 BOOKED/CONFIRMED 잔존 0건 | 100% |
| K4. 노쇼 정책 적용율 | 노쇼/지각 사유 회기 보상 트랜잭션 수 / `Schedule.NO_SHOW` 발생 수 | 100% |
| K5. ERP 반영 시간 | 옵션 C 관리자 반영 평균 처리 시간 | < 1 영업일 |

### 4.2 회귀 테스트 항목

- 매핑 도메인: 회기 사용/추가/환불/소진/만료 시나리오.
- 일정 도메인: BOOKED → COMPLETED / NO_SHOW / CANCELLED 전이.
- 환불 도메인: 부분/전액 환불 후 미래 일정 처리.
- ERP 동기화: 옵션 C 관리자 반영 → 매핑/재무 거래 일관성.
- 통계 도메인: `remaining_sessions` / `used_sessions` 의 의미 무변경 확인 (옵션 2-A 권고 시).

---

## 5. 사용자 컨펌 Q1-Q4 후보 옵션

> **본 절은 사용자 컨펌 입력 폼.** 각 Q 에 옵션 1개 선택 + 보조 결정 답변.

### Q1. PL/SQL 표준화 프로시저의 거취
- ☐ 1A — **폐기** (권고). 5종 프로시저 + 호출 Java 일괄 제거. 백업 SQL 아카이브.
- ☐ 1B — 정합 마이그레이션. PL/SQL 활성화.
- ☐ 1C — 감사 전용 분리.

### Q2. 회기 차감 시점 + 노쇼 정책
- ☐ 2A — **BOOKED 유지 + 노쇼 보상 룰 도입** (권고).
- ☐ 2B — 차감 시점을 COMPLETED 로 이동.
- ☐ 2C — 혼합(예약/사용 컬럼 분리).

**Q2 보조 결정** (2A 선택 시):
- ☐ 보상 룰 = **0.5건 환원 허용** (24h 이내 50%) (권고).
- ☐ 보상 룰 = 0/100% 이진(0.5건 환원 없음).
- ☐ 과거 노쇼 일정 회기 보정: ☐ 적용 / ☐ 미적용 / ☐ 별도 검토.

### Q3. 부분 환불 후 미래 일정 자동 취소 정책
- ☐ 3A — **자동 일괄 취소** (권고). 사유 `REFUND_AUTO_CANCEL` + 감사 + 다채널 알림.
- ☐ 3B — 사용자 동의 모달.
- ☐ 3C — 정책 알림만 (비권장).

**Q3 보조 결정** (3A 선택 시):
- ☐ 임계치 N건 이상 시 추가 확인 모달: ☐ 도입 / ☐ 미도입.
- ☐ 24h 이내 undo 액션: ☐ 도입 / ☐ 미도입.
- ☐ 알림 채널: ☐ 인앱 / ☐ 이메일 / ☐ 푸시 (복수 선택).

### Q4. ERP 환불 webhook 경로
- ☐ 4A — 단방향 송신 유지(현행).
- ☐ 4B — 양방향 webhook (즉시).
- ☐ 4C — **선택적 동기(관리자 게이트)** (권고). Phase 2/3 로 4B 확장 가능.

**Q4 보조 결정** (4C 선택 시):
- ☐ Phase 4 webhook 확장 일정: ☐ 즉시 협의 / ☐ 운영 3개월 후 / ☐ 미정.
- ☐ `getRefundHistory.erpStatus` 실제 반영: ☐ Phase 3 동시 / ☐ 별도 결정.

---

## 6. 게이트 (운영 반영 / Flyway / 회귀 테스트)

본 합의서 외부에서 실제 코드/DB 변경 시 반드시 통과해야 할 게이트.

### 6.1 운영 반영 게이트
- ✅ **사용자 컨펌 완료** (Q1-Q4 결정).
- ✅ **변경 단위 PR 분리**: 결정별 1 PR(또는 1-2 PR), 단일 PR 에 다중 결정 포함 금지.
- ✅ **deployer 위임 + 운영 배포 윈도우 준수** (`docs/standards/DEPLOYMENT_STANDARD.md` 정합).

### 6.2 Flyway 게이트
- ✅ Phase 1 (PL/SQL 폐기): `DROP PROCEDURE IF EXISTS` 5종 + 백업 SQL `database/schema/archived/` 이동(1 마이그레이션, idempotent).
- ✅ Phase 2 (노쇼 정책): `ScheduleStatus` enum 추가는 코드만, 공통코드(`SCHEDULE_STATUS_GROUP`) 시드는 마이그레이션 분리.
- ✅ 모든 마이그레이션은 `docs/standards/DATABASE_MIGRATION_STANDARD.md` 의 idempotent 원칙 준수.

### 6.3 회귀 테스트 게이트
- ✅ 매핑 도메인 단위 테스트 통과.
- ✅ Phase 2 노쇼 정책: 보상 룰 시나리오별 통합 테스트 작성.
- ✅ Phase 3 ERP 게이트: 관리자 화면 e2e + 멱등 테스트.
- ✅ 회귀 충격 평가: 통계/리포트/캘린더/모바일 앱 시나리오 영향도.

### 6.4 본 합의서 자체 게이트 (Read-Only)
- ❌ 본 합의서는 코드/DB/Flyway 변경 0건.
- ❌ core-coder / deployer 호출 금지 (위임은 사용자 컨펌 후 별도 진행).
- ✅ 단일 파일(`docs/standards/SESSION_MANAGEMENT_POLICY_DECISIONS.md`).
- ✅ `docs/session-mgmt-policy` 브랜치 커밋 + push.

---

## 7. 다음 단계

1. **사용자 컨펌**: Q1-Q4 + 보조 결정.
2. **컨펌 후 분배**:
   - 결정 1A → core-coder (PL/SQL 폐기 PR + 백업 아카이브).
   - 결정 2A → core-planner(보상 룰 스키마/공통코드 설계) → core-coder.
   - 결정 3A → core-coder (P0-B 후속, 알림/감사 보강).
   - 결정 4C → core-coder (관리자 게이트 화면 + API).
3. **합의서 갱신**: 사용자 컨펌 결과 반영 후 본 문서 v1.0.0 으로 승격.

---

**문서 끝.** 본 합의서는 정책 합의용 read-only 산출물. 코드 변경은 사용자 컨펌 + 별도 core-coder 위임으로 진행.
