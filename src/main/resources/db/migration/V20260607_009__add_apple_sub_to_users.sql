-- =============================================================================
-- Apple App Store Guideline 4.8 (Login Services) — T1 Sign in with Apple
--
-- 대상 거절: Submission ce38fb9a-ced4-4957-b606-21618ff23518 (2026-06-04)
-- Plan A 오케스트레이션: docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md
-- 디자이너 핸드오프:    docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md
--
-- 변경:
-- - users.apple_sub VARCHAR(64) NULL UNIQUE (Apple identityToken `sub` 영구 식별자)
-- - 컬럼 위치는 기존 social_provider_user_id 옆 (OAuth2 컬럼 그룹 정렬 유지)
-- - NULLABLE: 기존 비-Apple 사용자(카카오/네이버/이메일) 영향 없음
-- - UNIQUE: Apple sub 는 전역 영구 식별자 — 중복 가입 자동 차단
-- - MySQL 8.0+ Online DDL: ALGORITHM=INSTANT (가능) / LOCK=NONE
--
-- 재실행 안전: INFORMATION_SCHEMA 로 컬럼·인덱스 존재 여부 확인 후 조건부 ALTER.
-- =============================================================================

SET @dbname = DATABASE();

-- 1) apple_sub 컬럼 추가 (이미 있으면 SKIP)
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'apple_sub'
);

SET @add_column_sql = IF(
    @column_exists = 0,
    'ALTER TABLE users
        ADD COLUMN apple_sub VARCHAR(64) NULL
        COMMENT ''Apple Sign in with Apple subject identifier (identityToken sub). NULLABLE — Apple 미사용 사용자(카카오/네이버/이메일)는 NULL. T1 Apple 4.8 대응 (Flyway V20260607_009).''
        AFTER social_provider_user_id',
    'SELECT 1'
);

PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;

-- 2) apple_sub UNIQUE 인덱스 추가 (이미 있으면 SKIP)
SET @index_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'users'
       AND INDEX_NAME = 'uk_users_apple_sub'
);

SET @add_index_sql = IF(
    @index_exists = 0,
    'ALTER TABLE users
        ADD UNIQUE KEY uk_users_apple_sub (apple_sub)',
    'SELECT 1'
);

PREPARE add_index_stmt FROM @add_index_sql;
EXECUTE add_index_stmt;
DEALLOCATE PREPARE add_index_stmt;
