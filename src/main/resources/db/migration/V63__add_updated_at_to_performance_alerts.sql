-- ============================================
-- V63: performance_alerts 테이블에 updated_at 컬럼 추가
-- ============================================
-- 목적: BaseEntity의 updatedAt 필드와 테이블 스키마 일치
-- 작성일: 2025-12-11
-- ============================================

-- performance_alerts 테이블에 updated_at 컬럼 추가
ALTER TABLE performance_alerts
ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
AFTER created_at;

-- 기존 레코드의 updated_at을 created_at과 동일하게 설정
UPDATE performance_alerts
SET updated_at = created_at
WHERE updated_at IS NULL OR updated_at = '0000-00-00 00:00:00.000000';

