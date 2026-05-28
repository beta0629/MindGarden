-- =============================================================================
-- ERP P0 핫픽스 — financial_transactions.id=30 soft-delete 복원
--                  + UpdateAllConsultantPerformance mind_garden 측 DROP
--
-- 작성 일자: 2026-06-06
-- 브랜치   : hotfix/erp-p0-data-repair-and-procedure-fix
-- 근거 보고: docs/project-management/2026-05-28/ERP_AUTOMATION_DB_MEASUREMENT.md
--             (브랜치 docs/erp-automation-db-measurement, commit 5a4c10049)
--           §M1 (자동 분개 무결성 깨짐 — 80만원), §M7 (AE→FT 1건 dangling),
--           §M8 (UpdateAllConsultantPerformance 시그니처 충돌, 매일 00:03/04:00/14:00 ERROR)
-- 합의서   : docs/standards/SCHEDULER_E3_FINANCIAL_TENANT_MIGRATION_PLAN.md
--             (브랜치 docs/scheduler-error-e3-plan, commit dc64f3ba5, v2.0 시나리오 C)
--           §0.2 시나리오 C 채택 (mind_garden 스키마 deprecated, core_solution 단독 정착)
--
-- ───────────────────────────────────────────────────────────────────────────
-- Track 1 — P0-3a 데이터 보정 (회계 무결성 복원, 옵션 A 채택)
-- ───────────────────────────────────────────────────────────────────────────
-- 운영 실측 (M1·M7):
--   • financial_transactions.id=30 : is_deleted=1
--       (관련 매칭 id=9, INCOME 800,000원, BANK_TRANSFER)
--   • accounting_entries.id=30      : POSTED + APPROVED (살아있음)
--       → 분개 차변/대변 합산 13,147,680원 중 80만원이 FT 부재로 dangling
-- 옵션 비교 (planner 위임 §Phase 1):
--   • 옵션 A (채택): financial_transactions 살리기 (is_deleted=0 복원)
--       → AccountingEntry 측 POSTED+APPROVED 가 운영 사실에 가까움.
--         재무 측 dangling 해소가 정공법 (회계 무결성 우선).
--   • 옵션 B (폐기): accounting_entries cancel (역분개)
--       → 분개 차변/대변 합산 깨짐 + AE 80만원 강제 무효화 → 회계 회귀 위험.
--
-- 사전 가드 (운영 데이터 격리, idempotent):
--   • id=30 + related_entity_id=9 + related_entity_type='CONSULTANT_CLIENT_MAPPING'
--     + transaction_type='INCOME' + amount=800000 + is_deleted=1 모두 만족 시에만 UPDATE.
--   • 재실행 시 is_deleted 가 이미 0 이면 WHERE 조건 false → NO-OP (idempotent).
--   • H2 통합 테스트는 동일 PK + amount + related_entity 시드 데이터로 매칭.
--
-- ───────────────────────────────────────────────────────────────────────────
-- Track 2 — P0-3b PL/SQL 시그니처 충돌 해소
-- ───────────────────────────────────────────────────────────────────────────
-- 운영 실측 (M8):
--   • UpdateAllConsultantPerformance 가 core_solution.null.* + mind_garden.null.*
--     양쪽에 존재 → SimpleJdbcCall.metaData() 모호 → 매일 00:03/04:00/14:00
--     PlSqlStatisticsServiceImpl ERROR.
-- 처리:
--   • 시나리오 C (planner 합의서 v2.0 §0.2, §1.6) 인용 — mind_garden 측 DROP.
--   • core_solution 측은 본 핫픽스에서 재정의하지 않음 — 운영 정착 본 유지
--     (표준화 본 deploy 는 별도 PR + Java 시그니처 정합 동시 진행 필요, 본 PR 범위 밖).
--
-- 사전 가드 (H2/MySQL 호환):
--   • mind_garden 스키마가 존재하지 않을 수도 있는 H2 인메모리 통합 테스트 대비
--     CREATE SCHEMA IF NOT EXISTS 로 사전 보장 (운영은 이미 존재 → NO-OP).
--   • DROP PROCEDURE IF EXISTS 는 부재 시 NO-OP (idempotent).
--
-- ───────────────────────────────────────────────────────────────────────────
-- 게이트 / 검증 (운영 배포 후):
--   (1) SELECT id, is_deleted, deleted_at FROM financial_transactions WHERE id=30;
--       → is_deleted=0 + deleted_at IS NULL 확인
--   (2) SHOW PROCEDURE STATUS WHERE Name='UpdateAllConsultantPerformance';
--       → core_solution 1건만 (mind_garden 행 0건)
--   (3) D+1 00:03 / 04:00 / 14:00 KST 스케줄러 로그
--       → "Unable to determine the correct call signature" 0건
-- =============================================================================

-- ─── Track 1: P0-3a — financial_transactions.id=30 soft-delete 복원 ──────────
UPDATE financial_transactions
SET is_deleted = 0,
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 30
  AND related_entity_id = 9
  AND related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
  AND transaction_type = 'INCOME'
  AND amount = 800000
  AND is_deleted = 1;

-- ─── Track 2: P0-3b — mind_garden.UpdateAllConsultantPerformance DROP ────────
-- H2 인메모리(MODE=MySQL) 테스트 환경에서도 안전하게 실행되도록 스키마 사전 보장.
-- 운영 MySQL 에는 이미 존재 → IF NOT EXISTS NO-OP.
CREATE SCHEMA IF NOT EXISTS mind_garden;

-- 시나리오 C — core_solution 단독 정착. mind_garden 측은 deprecated.
DROP PROCEDURE IF EXISTS mind_garden.UpdateAllConsultantPerformance;
