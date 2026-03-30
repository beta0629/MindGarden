-- =====================================================
-- scheduler_execution_log tenant_id 길이 확장
-- 작성일: 2026-03-30
-- 설명: 긴 tenant_id 저장 시 Data too long 예외 방지
-- =====================================================

ALTER TABLE scheduler_execution_log
MODIFY COLUMN tenant_id VARCHAR(100) COMMENT '테넌트 ID';
