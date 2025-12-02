-- AI 분석 결과 필드 추가
-- 작성일: 2025-12-02
-- 목적: AI 모델 분석 결과 저장을 위한 컬럼 추가

-- ai_anomaly_detection 테이블에 AI 분석 필드 추가
ALTER TABLE ai_anomaly_detection
ADD COLUMN IF NOT EXISTS ai_analysis TEXT COMMENT 'AI 모델의 분석 결과',
ADD COLUMN IF NOT EXISTS ai_recommendation TEXT COMMENT 'AI 모델의 권장 조치사항';

-- 인덱스 추가 (AI 분석 결과가 있는 항목 조회용)
CREATE INDEX IF NOT EXISTS idx_ai_analysis ON ai_anomaly_detection(model_used, detected_at);

-- security_threat_detection 테이블에 AI 분석 필드 추가
ALTER TABLE security_threat_detection
ADD COLUMN IF NOT EXISTS ai_analysis TEXT COMMENT 'AI 모델의 위협 분석 결과',
ADD COLUMN IF NOT EXISTS ai_recommendation TEXT COMMENT 'AI 모델의 권장 대응 조치',
ADD COLUMN IF NOT EXISTS threat_type VARCHAR(50) COMMENT 'AI가 식별한 위협 유형';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_threat_ai_analysis ON security_threat_detection(model_used, detected_at);

