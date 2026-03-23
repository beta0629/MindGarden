-- =====================================================
-- erd_diagrams.tenant_id 컬럼 길이 확장
-- =====================================================
-- 목적: tenant-verify-final-*, tenant-final-report-* 등 38자 이상 tenantId
--       저장 시 Data truncation 오류(132건) 해결
-- 작성일: 2026-03-23
-- 참조: docs/troubleshooting/DEV_SERVER_ERROR_LOG_REPORT_20260323.md
-- =====================================================

-- erd_diagrams.tenant_id: VARCHAR(36) → VARCHAR(64)
ALTER TABLE erd_diagrams
MODIFY COLUMN tenant_id VARCHAR(64) COMMENT '테넌트 ID (NULL이면 전체 시스템 ERD)';
