-- =============================================================================
-- 상담일지 관리자 작성·수정 지원 (PR M)
--
-- 1) consultation_records — 실제 작성·수정자 컬럼 4개 추가.
--    consultant_id 는 계속 "일정 담당(작성 귀속) 상담사" 이고, 관리자가 대리 작성·수정하면
--    created_by_* / updated_by_* 에 관리자 id·역할이 남는다.
-- 2) consultation_record_edit_audits — 성공한 작성·수정 1건당 1행 (append-only).
--    바뀐 필드명만 저장하며 본문 값은 어떤 컬럼에도 담지 않는다.
--
-- 호환성:
--   - ADD COLUMN NULL — 기존 행은 NULL 그대로. 데이터 UPDATE/DELETE·백필 없음.
--   - 컬럼 위치 미지정(맨 뒤) — MySQL 8 INSTANT ADD COLUMN 대상.
-- 멱등 패턴: INFORMATION_SCHEMA 가드(V20260930_002 동일) + CREATE TABLE IF NOT EXISTS. 재실행 NO-OP.
-- @author CoreSolution
-- @since 2026-10-06
-- =============================================================================

SET @dbname = DATABASE();

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'consultation_records'
       AND COLUMN_NAME = 'created_by_user_id'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE consultation_records ADD COLUMN created_by_user_id BIGINT NULL COMMENT ''실제 작성자 users.id''',
    'SELECT "created_by_user_id already exists"'
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'consultation_records'
       AND COLUMN_NAME = 'created_by_role'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE consultation_records ADD COLUMN created_by_role VARCHAR(40) NULL COMMENT ''실제 작성자 역할''',
    'SELECT "created_by_role already exists"'
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'consultation_records'
       AND COLUMN_NAME = 'updated_by_user_id'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE consultation_records ADD COLUMN updated_by_user_id BIGINT NULL COMMENT ''마지막 수정자 users.id''',
    'SELECT "updated_by_user_id already exists"'
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'consultation_records'
       AND COLUMN_NAME = 'updated_by_role'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE consultation_records ADD COLUMN updated_by_role VARCHAR(40) NULL COMMENT ''마지막 수정자 역할''',
    'SELECT "updated_by_role already exists"'
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

CREATE TABLE IF NOT EXISTS consultation_record_edit_audits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    record_id BIGINT NOT NULL COMMENT '대상 상담일지 ID',
    action VARCHAR(20) NOT NULL COMMENT 'CREATE/EDIT',
    editor_id BIGINT NULL COMMENT '실제 작성·수정자 users.id',
    editor_role VARCHAR(40) NULL COMMENT '실제 작성·수정자 역할',
    changed_fields VARCHAR(2000) NULL COMMENT '바뀐 필드명(콤마 구분, 값 미저장)',
    edited_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '작성·수정 시각',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    KEY idx_crea_tenant_record (tenant_id, record_id, edited_at),
    KEY idx_crea_tenant_editor (tenant_id, editor_id, edited_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='상담일지 작성·수정 감사(append-only, 필드명만)';
