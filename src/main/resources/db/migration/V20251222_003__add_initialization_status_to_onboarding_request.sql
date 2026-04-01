-- ============================================
-- 초기화 작업 상태 추적 필드 추가
-- ============================================
-- 목적: 온보딩 초기화 작업 단계별 성공/실패 상태를 추적
-- 작성일: 2025-12-22
-- 운영 등 컬럼이 이미 있는 경우 ADD 생략 (실패 후 재적용·검증 호환)
-- ============================================

-- initialization_status_json 컬럼 추가 (없을 때만: MySQL은 IF NOT EXISTS 미지원)
SET @dbname = DATABASE();
SET @tablename = 'onboarding_request';
SET @columnname = 'initialization_status_json';

SET @prepared = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
);

SET @sql = IF(
    @prepared,
    'ALTER TABLE onboarding_request ADD COLUMN initialization_status_json TEXT NULL COMMENT ''초기화 작업 단계별 상태 (JSON 형식)''',
    'SELECT ''Column initialization_status_json already exists'' AS msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
