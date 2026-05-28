-- =============================================================================
-- V20260606_010 — financial_transactions 중복 거래 DB UNIQUE 가드
-- ---------------------------------------------------------------------------
-- 합의서 / 인벤토리: docs/project-management/2026-05-28/ERP_AUTOMATION_AUDIT_REPORT.md §G3
-- 운영 측정:        docs/project-management/2026-05-28/ERP_AUTOMATION_DB_MEASUREMENT.md §M2
-- 트랙:             [Hotfix P1] PR-D (ERP)
--
-- 결함 (G3)
-- ---------
--   AmountManagementServiceImpl.isDuplicateTransaction:102-115 은 app-level
--   existsBy 가드만 두고 있어 confirmDeposit + checkoutSameDayCard 재시도
--   레이스 조건에서 동일 매칭에 대해 INCOME 분개가 중복 생성될 수 있음.
--   DB M2 측정 결과 현재 중복 건수 0 — 회귀 없음, 일관성 가드만 강화.
--
-- 설계
-- ----
--   복합 UNIQUE: (tenant_id, related_entity_id, related_entity_type,
--                  transaction_type, is_deleted)
--   - is_deleted 를 키 마지막 컬럼으로 포함하여 soft-deleted (is_deleted=1) 행과
--     활성(is_deleted=0) 행이 충돌하지 않도록 함 (실질적 partial unique).
--   - MySQL 8 가 CREATE INDEX IF NOT EXISTS 를 지원하지 않으므로 V65 패턴 그대로
--     INFORMATION_SCHEMA.STATISTICS 사전 검사 + PREPARE/EXECUTE 로 멱등 보장.
--   - H2 (테스트) 는 application-test.yml 의 spring.flyway.enabled=false 로 본
--     마이그레이션을 실행하지 않으며, JPA ddl-auto:update 가 엔티티 메타데이터
--     기반으로 스키마를 생성한다. 본 인덱스의 idempotent 시나리오는 동일 H2
--     스키마 위에서 CREATE UNIQUE INDEX IF NOT EXISTS 로 단위 검증한다
--     (AmountManagementServiceImplTest 의 financialTransactionsUniqueGuardTest 참조).
-- =============================================================================

SET @dbname = DATABASE();

-- 잠재적 중복 데이터 사전 검증 — UNIQUE 생성 실패 방지
-- M2 측정 시점(2026-05-28) 0 건 이었지만, 본 마이그 적용 직전 변동 가능성을 보수적으로 차단
SET @duplicateCount = (
    SELECT COALESCE(SUM(dup_cnt - 1), 0)
    FROM (
        SELECT COUNT(*) AS dup_cnt
        FROM financial_transactions
        WHERE related_entity_type IS NOT NULL
        GROUP BY tenant_id, related_entity_id, related_entity_type, transaction_type, is_deleted
        HAVING COUNT(*) > 1
    ) AS dup_groups
);

SET @msg = CONCAT(
    'V20260606_010 ABORT — financial_transactions 에 중복 분개 ',
    @duplicateCount,
    ' 건 잔존. 정리 후 재실행 필요 (운영 main c759f97a8 측정 시점 0 건).'
);

SET @preparedStatement = (SELECT IF(
    @duplicateCount > 0,
    CONCAT('SIGNAL SQLSTATE ''45000'' SET MESSAGE_TEXT = ''', @msg, ''''),
    'SELECT 1'
));
PREPARE abortIfDuplicates FROM @preparedStatement;
EXECUTE abortIfDuplicates;
DEALLOCATE PREPARE abortIfDuplicates;

-- 멱등 UNIQUE 인덱스 생성 (V65 패턴)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'financial_transactions'
       AND INDEX_NAME = 'uk_financial_transactions_dedupe') > 0,
    'SELECT 1',
    'CREATE UNIQUE INDEX uk_financial_transactions_dedupe ON financial_transactions (tenant_id, related_entity_id, related_entity_type, transaction_type, is_deleted)'
));
PREPARE createUniqueIndex FROM @preparedStatement;
EXECUTE createUniqueIndex;
DEALLOCATE PREPARE createUniqueIndex;
