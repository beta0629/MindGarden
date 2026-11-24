-- SCT 미연결 초대 표시명 + v1-placeholder 잔존 비활성 (.dev 재적용)
-- @author MindGarden
-- @since 2026-11-23

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_invitations' AND COLUMN_NAME = 'recipient_name'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_invitations ADD COLUMN recipient_name VARCHAR(120) NULL COMMENT ''미연결 발송 시 표시명'' AFTER management_no',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE sct_consent_templates
SET is_active = 0
WHERE tenant_id = ''
  AND version = 'v1-placeholder'
  AND is_active = 1;