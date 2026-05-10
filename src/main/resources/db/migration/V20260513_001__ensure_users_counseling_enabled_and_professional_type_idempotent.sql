-- ====================================================================
-- users: professional_provider_type_code, counseling_enabled 보강
-- ====================================================================
-- 목적: JPA User와 동기화. 개발 등에서 V20260510_002가 미적용·부분 스킵된
--       경우에도 Unknown column 방지.
-- 멱등: information_schema 기준으로 컬럼이 있으면 ALTER 생략.
--       V20260510_002(무조건 ADD)·V20260510_005와 동일 정의, 중복 ADD 없음.
-- 공통코드 시드: V20260510_002 / V20260510_005의 INSERT 블록이 담당.
-- 표준: DATABASE_MIGRATION_STANDARD.md
-- ====================================================================

SET @dbname = DATABASE();

-- 1) professional_provider_type_code
SET @col1 = 'professional_provider_type_code';
SET @need1 = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = @col1
);
SET @sql1 = IF(
    @need1,
    'ALTER TABLE users ADD COLUMN professional_provider_type_code VARCHAR(64) NULL COMMENT ''PROFESSIONAL_PROVIDER_TYPE code_value'' AFTER role',
    'SELECT ''Column professional_provider_type_code already exists'' AS msg'
);
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- 2) counseling_enabled (professional_provider_type_code 뒤에 정렬)
SET @col2 = 'counseling_enabled';
SET @need2 = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = @col2
);
SET @sql2 = IF(
    @need2,
    'ALTER TABLE users ADD COLUMN counseling_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''ADMIN 상담 겸직'' AFTER professional_provider_type_code',
    'SELECT ''Column counseling_enabled already exists'' AS msg'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 역할 기준 전문가 유형 백필 (V20260510_002 / 005와 동일, NULL·빈 값만 갱신)
UPDATE users u
SET u.professional_provider_type_code = CASE
    WHEN u.role = 'PLAY_THERAPIST' THEN 'PLAY_THERAPY'
    WHEN u.role = 'SPEECH_THERAPIST' THEN 'SPEECH_THERAPY'
    ELSE 'DEFAULT_COUNSELOR'
END
WHERE u.role IN ('CONSULTANT', 'PLAY_THERAPIST', 'SPEECH_THERAPIST')
  AND (u.is_deleted = 0 OR u.is_deleted IS NULL OR u.is_deleted = FALSE)
  AND (u.professional_provider_type_code IS NULL OR u.professional_provider_type_code = '');
