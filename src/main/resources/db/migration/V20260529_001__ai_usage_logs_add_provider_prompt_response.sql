-- V20260529_001: ai_usage_logs — ai_provider DEFAULT 제거 + prompt/response 컬럼 신설
--
-- 운영 진단 보고 (docs/project-management/2026-05-25/PROD_LOG_DIAGNOSIS_2026_05_25.md) §N3 + AI
-- 관리 페이지 시각 회귀 보고서 §LOW 보강:
--   - ai_provider 컬럼은 V69 에서 DEFAULT 'OPENAI' 로 신설됨 → caller 가 명시적으로 set 하지 않으면
--     실제 호출이 Gemini 여도 'OPENAI' 로 저장됨 (사용 통계 왜곡, 어드민 표시 오류).
--   - prompt/response 본문 컬럼 부재 → AI 관리 페이지 상세 모달이 메타데이터만 노출 가능.
--
-- 본 마이그레이션은 다음을 수행한다:
--   1) ai_provider DEFAULT 제거 (NOT NULL 유지) — caller 가 반드시 effectiveProvider 를 set 하도록 강제.
--   2) prompt LONGTEXT NULL 신설 — system + user 결합 본문 적재 (JSON 또는 raw concat).
--   3) response LONGTEXT NULL 신설 — AI 응답 본문 (성공 시) 적재.
--   4) idx_ai_usage_logs_ai_provider_created_at 인덱스 신설 — provider 필터 + 시간 정렬 조회 성능.
--
-- 보존:
--   - 솔라피 V20260528_003 미적용 보존 (본 마이그레이션과 무관).
--   - 기존 392+ 행의 ai_provider 값은 'OPENAI' 그대로 유지 (역추적 불가). 후속 호출부터 정확한 값 적용.
--   - 기존 행의 prompt/response 는 NULL (역추적 불가).
--
-- 멱등성: INFORMATION_SCHEMA 가드로 컬럼/인덱스 존재 시 NO-OP.

SET @dbname = DATABASE();

-- 1) ai_provider DEFAULT 'OPENAI' 제거 + NOT NULL 확정
SET @ai_provider_default = (
    SELECT COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'ai_usage_logs' AND COLUMN_NAME = 'ai_provider'
);
SET @sql_provider = IF(
    @ai_provider_default IS NOT NULL,
    'ALTER TABLE ai_usage_logs MODIFY COLUMN ai_provider VARCHAR(50) NOT NULL COMMENT ''caller 가 명시적으로 set 한 실제 호출 provider (OPENAI/GEMINI/CLAUDE/REPLICATE/UNKNOWN)''',
    'SELECT ''ai_provider DEFAULT already removed'' AS skipped'
);
PREPARE stmt FROM @sql_provider;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) prompt LONGTEXT NULL 신설 (기존 행은 NULL)
SET @prompt_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'ai_usage_logs' AND COLUMN_NAME = 'prompt'
);
SET @sql_prompt = IF(
    @prompt_exists = 0,
    'ALTER TABLE ai_usage_logs ADD COLUMN prompt LONGTEXT NULL COMMENT ''system + user 프롬프트 결합 본문 (JSON 또는 raw concat). 기존 행은 NULL''',
    'SELECT ''prompt column already exists'' AS skipped'
);
PREPARE stmt FROM @sql_prompt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) response LONGTEXT NULL 신설 (기존 행은 NULL)
SET @response_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'ai_usage_logs' AND COLUMN_NAME = 'response'
);
SET @sql_response = IF(
    @response_exists = 0,
    'ALTER TABLE ai_usage_logs ADD COLUMN response LONGTEXT NULL COMMENT ''AI 응답 본문 (성공 시 raw text 또는 JSON). 기존 행 또는 실패는 NULL''',
    'SELECT ''response column already exists'' AS skipped'
);
PREPARE stmt FROM @sql_response;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) idx_ai_usage_logs_ai_provider_created_at — provider 필터 성능
SET @idx_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'ai_usage_logs'
      AND INDEX_NAME = 'idx_ai_usage_logs_ai_provider_created_at'
);
SET @sql_idx = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_ai_usage_logs_ai_provider_created_at ON ai_usage_logs (ai_provider, created_at)',
    'SELECT ''idx_ai_usage_logs_ai_provider_created_at already exists'' AS skipped'
);
PREPARE stmt FROM @sql_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
