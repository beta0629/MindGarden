-- V20251225_002: COUNSELING 업종 역할 템플릿 추가
-- 목적: COUNSELING 업종에 대한 역할 템플릿 추가 (프로시저 실패 방지)
-- 문제: ApplyDefaultRoleTemplates 프로시저가 COUNSELING 업종 템플릿을 찾지 못해 실패
-- 해결: COUNSELING 업종 템플릿 추가

INSERT IGNORE INTO role_templates (
    role_template_id, template_code, name, name_ko, name_en,
    business_type, description, description_ko, description_en,
    is_active, display_order, is_system_template,
    created_at, updated_at, created_by, updated_by, is_deleted, version, lang_code
) VALUES
(UUID(), 'COUNSELING_DIRECTOR', '원장', '원장', 'Director',
 'COUNSELING', '상담소 원장 역할', '상담소 원장 역할', 'Counseling center director role',
 TRUE, 1, TRUE, NOW(), NOW(), 'system', 'system', FALSE, 0, 'ko'),
(UUID(), 'COUNSELING_COUNSELOR', '상담사', '상담사', 'Counselor',
 'COUNSELING', '상담소 상담사 역할', '상담소 상담사 역할', 'Counseling center counselor role',
 TRUE, 2, TRUE, NOW(), NOW(), 'system', 'system', FALSE, 0, 'ko'),
(UUID(), 'COUNSELING_CLIENT', '내담자', '내담자', 'Client',
 'COUNSELING', '상담소 내담자 역할', '상담소 내담자 역할', 'Counseling center client role',
 TRUE, 3, TRUE, NOW(), NOW(), 'system', 'system', FALSE, 0, 'ko'),
(UUID(), 'COUNSELING_STAFF', '사무원', '사무원', 'Staff',
 'COUNSELING', '상담소 사무원 역할', '상담소 사무원 역할', 'Counseling center staff role',
 TRUE, 4, TRUE, NOW(), NOW(), 'system', 'system', FALSE, 0, 'ko');

