-- AI 분석 결과 필드 추가
-- 작성일: 2025-12-02
-- 목적: AI 모델 분석 결과 저장을 위한 인덱스 추가 (컬럼은 이미 존재)

-- 인덱스 추가 (컬럼은 이미 모두 존재함)
CREATE INDEX idx_threat_ai_analysis ON security_threat_detection(threat_type, detected_at);

