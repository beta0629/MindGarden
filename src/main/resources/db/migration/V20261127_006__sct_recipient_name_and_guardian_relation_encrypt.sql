-- SCT PII: recipient_name / guardian_relation 암호문 저장용 길이 확장 + 미사용 respondent_meta_json 제거
-- Schema-only. NO data UPDATE / encrypt backfill.
-- @author MindGarden
-- @since 2026-11-27

-- 1) sct_invitations.recipient_name → VARCHAR(512) (PiiAttributeConverter)
ALTER TABLE sct_invitations
    MODIFY COLUMN recipient_name VARCHAR(512) NULL;

-- 2) sct_consents.guardian_relation → VARCHAR(512) (PiiAttributeConverter)
ALTER TABLE sct_consents
    MODIFY COLUMN guardian_relation VARCHAR(512) NULL;

-- 3) 미사용 respondent_meta_json 컬럼 제거 (존재 시에만 DROP)
SET @dbname = DATABASE();
SET @tablename = 'sct_invitations';
SET @columnname = 'respondent_meta_json';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = @tablename
          AND COLUMN_NAME = @columnname
    ) > 0,
    CONCAT('ALTER TABLE ', @tablename, ' DROP COLUMN ', @columnname),
    'SELECT 1'
));
PREPARE dropIfExists FROM @preparedStatement;
EXECUTE dropIfExists;
DEALLOCATE PREPARE dropIfExists;
