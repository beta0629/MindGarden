-- 앱 기본 모델 상향과 정합; 의도적으로 3.5 유지 시 마이그레이션 전 백업·스킵
-- Legacy DB rows may still have OPENAI_MODEL = gpt-3.5-turbo; bump to gpt-4o-mini (case/whitespace insensitive).
-- Idempotent: only rows matching OPENAI_MODEL + trimmed lowercase gpt-3.5-turbo are updated.

UPDATE system_config
SET
    config_value = 'gpt-4o-mini',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'SYSTEM'
WHERE
    config_key = 'OPENAI_MODEL'
    AND LOWER(TRIM(config_value)) = 'gpt-3.5-turbo';
