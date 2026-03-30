-- =====================================================
-- 스케줄러 실행 로그 테이블 tenant_id 컬럼 길이 확장
-- 작성일: 2025-12-24
-- 설명: tenant_id 컬럼을 VARCHAR(36)에서 VARCHAR(64)로 확장
--       긴 tenant_id (예: tenant-incheon-counseling-012) 저장 가능하도록 수정
-- =====================================================

-- scheduler_execution_log 테이블의 tenant_id 컬럼 길이 확장
ALTER TABLE scheduler_execution_log 
MODIFY COLUMN tenant_id VARCHAR(64) COMMENT '테넌트 ID';

