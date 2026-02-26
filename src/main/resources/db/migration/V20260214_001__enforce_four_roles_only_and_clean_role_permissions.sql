-- ============================================
-- 4개 표준 역할만 유지 및 role_permissions/role_templates 정리
-- ============================================
-- 목적: ADMIN, STAFF, CONSULTANT, CLIENT 4개 역할만 사용. 권한은 role_permissions만 참조.
-- 작성일: 2026-02-14
-- 표준: DATABASE_MIGRATION_STANDARD.md 준수
-- ============================================

-- ============================================
-- 1. role_permissions: 4개 역할이 아닌 행 삭제 (idempotent)
-- ============================================
DELETE FROM role_permissions
WHERE role_name NOT IN ('ADMIN', 'STAFF', 'CONSULTANT', 'CLIENT');

-- ============================================
-- 2. role_templates: 상담/코운셀링 업종에서 4개 표준 템플릿만 활성 유지
-- ============================================
-- CONSULTATION: CONSULTATION_DIRECTOR, CONSULTATION_COUNSELOR, CONSULTATION_CLIENT, CONSULTATION_STAFF
-- COUNSELING:   COUNSELING_DIRECTOR, COUNSELING_COUNSELOR, COUNSELING_CLIENT, COUNSELING_STAFF
-- 그 외 템플릿은 비활성화·소프트 삭제하여 테넌트 생성 시 4개 역할만 적용되도록 함
UPDATE role_templates
SET is_active = FALSE,
    is_deleted = TRUE,
    updated_at = NOW(),
    updated_by = 'SYSTEM'
WHERE business_type IN ('COUNSELING', 'CONSULTATION')
  AND template_code NOT IN (
    'CONSULTATION_DIRECTOR', 'CONSULTATION_COUNSELOR', 'CONSULTATION_CLIENT', 'CONSULTATION_STAFF',
    'COUNSELING_DIRECTOR', 'COUNSELING_COUNSELOR', 'COUNSELING_CLIENT', 'COUNSELING_STAFF'
  );
