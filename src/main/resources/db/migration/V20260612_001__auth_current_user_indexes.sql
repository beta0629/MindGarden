-- =============================================================================
-- V20260612_001__auth_current_user_indexes.sql
-- Phase1 / Slot ⑮ / B7: /api/v1/auth/current-user 응답 시간 100ms 이내 최적화 보강 인덱스.
--
-- 배경
-- - PR #231 측정: 256~1025ms (FE 9회 dedup 전, 누적 4.5초).
-- - core-debugger 1단계 보고서(`docs/project-management/2026-06-11/STANDARDIZATION_ROADMAP.md` §B7 + §5.2):
--   * branchService.getAllActiveBranches() 의 N+1 + 멀티테넌트 누락 (최대 병목)
--   * Tenant·PermissionGroup 캐싱 미적용 — Java 측 Caffeine 캐싱으로 처리
--   * user_social_accounts (tenant_id, user_id, is_deleted) 인덱스 누락
--   * branches (tenant_id, branch_code, is_deleted) 단건 조회 인덱스 누락
--
-- 본 마이그레이션 변경 사항 (idempotent)
-- 1. user_social_accounts: tenant_id + user_id + is_deleted 복합 인덱스 추가
-- 2. branches: tenant_id + branch_code + is_deleted 복합 인덱스 추가
--    (BranchRepository.findBranchNameByTenantIdAndBranchCode JPQL projection 단건 조회 최적화)
--
-- role_permission_groups 인덱스
-- - 본 PR 의 PermissionGroupServiceImpl @Cacheable 캐싱(TTL 5분)으로 트래픽이 크게 줄어드므로
--   인덱스 추가는 모니터링 결과에 따라 차순위로 결정 (본 PR 제외).
--
-- 컬럼 추가 없음 (기존 tenant_id / branch_code / is_deleted / user_id 재사용).
--
-- 회귀 위험
-- - CreateIndexIfNotExists 프로시저 패턴(V60 과 동일)으로 idempotent 보장.
-- - 운영 트래픽 영향: INSERT/UPDATE 미세 부담(인덱스 2개 추가) — 두 테이블 모두 쓰기 트래픽은 낮음.
--
-- 참조
-- - docs/project-management/2026-06-11/STANDARDIZATION_ROADMAP.md §B7
-- - src/main/java/com/coresolution/consultation/controller/AuthController.java#getCurrentUser
-- - src/main/java/com/coresolution/consultation/repository/BranchRepository.java#findBranchNameByTenantIdAndBranchCode
-- - V60__add_composite_indexes_for_performance.sql (CreateIndexIfNotExists 프로시저 패턴 원조)
-- =============================================================================

DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

DELIMITER $$

CREATE PROCEDURE CreateIndexIfNotExists(
    IN tableName VARCHAR(255),
    IN indexName VARCHAR(255),
    IN indexColumns VARCHAR(500)
)
BEGIN
    DECLARE indexExists INT DEFAULT 0;

    SELECT COUNT(*) INTO indexExists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = tableName
      AND index_name = indexName;

    IF indexExists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', indexName, ' ON ', tableName, '(', indexColumns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- 1. user_social_accounts: tenant_id + user_id + is_deleted 복합 인덱스
--    AuthController.getCurrentUser →
--    UserSocialAccountRepository.findByTenantIdAndUserIdAndIsDeletedFalse
-- =============================================================================

CALL CreateIndexIfNotExists(
    'user_social_accounts',
    'idx_user_social_tenant_user_active',
    'tenant_id, user_id, is_deleted'
);

-- =============================================================================
-- 2. branches: tenant_id + branch_code + is_deleted 복합 인덱스
--    BranchRepository.findBranchNameByTenantIdAndBranchCode (JPQL projection)
-- =============================================================================

CALL CreateIndexIfNotExists(
    'branches',
    'idx_branches_tenant_code_active',
    'tenant_id, branch_code, is_deleted'
);

-- 프로시저 삭제 (V60 와 동일한 정리 절차)
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

-- =============================================================================
-- 수동 검증 (운영 적용 후)
-- =============================================================================
-- SHOW INDEX FROM user_social_accounts WHERE Key_name LIKE 'idx_user_social_tenant%';
-- SHOW INDEX FROM branches WHERE Key_name LIKE 'idx_branches_tenant_code%';
--
-- EXPLAIN SELECT tenant_id, user_id, is_deleted FROM user_social_accounts
--   WHERE tenant_id='<UUID>' AND user_id=<long> AND is_deleted=0;
-- EXPLAIN SELECT branch_name FROM branches
--   WHERE tenant_id='<UUID>' AND branch_code='<CODE>' AND is_deleted=0;
-- type='ref', key=새 인덱스명 인지 확인.
