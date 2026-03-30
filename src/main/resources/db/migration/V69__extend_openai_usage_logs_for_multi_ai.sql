-- V69: OpenAI 사용량 로그 테이블 확장 (멀티 AI 제공자 지원)
-- 작성일: 2026-01-21
-- 설명: 기존 openai_usage_logs 테이블을 확장하여 Gemini, Google Speech 등 다양한 AI 제공자 지원

-- ====================================================================================
-- 1. 기존 openai_usage_logs 테이블 확장
-- ====================================================================================

-- AI 제공자 구분 컬럼 추가
ALTER TABLE openai_usage_logs
ADD COLUMN ai_provider VARCHAR(50) DEFAULT 'OPENAI' COMMENT 'AI 제공자: OPENAI, GEMINI, GOOGLE_SPEECH 등' AFTER model;

-- API 엔드포인트 정보
ALTER TABLE openai_usage_logs
ADD COLUMN api_endpoint VARCHAR(200) COMMENT 'API 엔드포인트 URL' AFTER ai_provider;

-- 응답 시간 및 성공 여부
ALTER TABLE openai_usage_logs
ADD COLUMN response_time_ms INT COMMENT '응답 시간 (밀리초)' AFTER estimated_cost;

ALTER TABLE openai_usage_logs
ADD COLUMN is_success BOOLEAN DEFAULT TRUE COMMENT '요청 성공 여부' AFTER response_time_ms;

-- 에러 정보
ALTER TABLE openai_usage_logs
ADD COLUMN error_message TEXT COMMENT '에러 메시지 (실패 시)' AFTER is_success;

-- ====================================================================================
-- 2. 인덱스 추가
-- ====================================================================================

-- AI 제공자별 조회 최적화
CREATE INDEX idx_ai_provider ON openai_usage_logs(ai_provider);

-- 성공/실패 조회 최적화
CREATE INDEX idx_is_success ON openai_usage_logs(is_success);

-- 테넌트 + AI 제공자 복합 인덱스 (비용 분석용)
CREATE INDEX idx_tenant_provider ON openai_usage_logs(tenant_id, ai_provider);

-- 날짜 + AI 제공자 복합 인덱스 (일별 사용량 분석용)
CREATE INDEX idx_created_at_provider ON openai_usage_logs(created_at, ai_provider);

-- ====================================================================================
-- 3. 기존 데이터 업데이트
-- ====================================================================================

-- 기존 레코드의 ai_provider를 'OPENAI'로 설정 (이미 DEFAULT 값이지만 명시적 업데이트)
UPDATE openai_usage_logs
SET ai_provider = 'OPENAI'
WHERE ai_provider IS NULL;

-- ====================================================================================
-- 4. 주석 추가 (테이블 설명 업데이트)
-- ====================================================================================

ALTER TABLE openai_usage_logs
COMMENT='AI 사용량 로그 (OpenAI, Gemini, Google Speech 등 멀티 AI 제공자 지원)';
