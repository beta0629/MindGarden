-- Test fixture, not a SHOW CREATE dump.
-- source note: role codes match V9 consultation templates the approval path reads.
-- business_type CONSULTATION is inside tenants.chk_business_type.
INSERT INTO role_templates (
    role_template_id, template_code, name, name_ko, name_en,
    business_type, description, description_ko, description_en,
    is_active, display_order, is_system_template, is_admin_role, is_deleted, version,
    created_at, updated_at, created_by, updated_by
) VALUES
(UUID(), 'CONSULTATION_DIRECTOR', '원장', '원장', 'Director',
 'CONSULTATION', '상담소 원장 역할', '상담소 원장 역할', 'Consultation center director role',
 1, 1, 1, 1, 0, 0, NOW(), NOW(), 'system', 'system'),
(UUID(), 'CONSULTATION_COUNSELOR', '상담사', '상담사', 'Counselor',
 'CONSULTATION', '상담소 상담사 역할', '상담소 상담사 역할', 'Consultation center counselor role',
 1, 2, 1, 0, 0, 0, NOW(), NOW(), 'system', 'system'),
(UUID(), 'CONSULTATION_CLIENT', '내담자', '내담자', 'Client',
 'CONSULTATION', '상담소 내담자 역할', '상담소 내담자 역할', 'Consultation center client role',
 1, 3, 1, 0, 0, 0, NOW(), NOW(), 'system', 'system'),
(UUID(), 'CONSULTATION_STAFF', '사무원', '사무원', 'Staff',
 'CONSULTATION', '상담소 사무원 역할', '상담소 사무원 역할', 'Consultation center staff role',
 1, 4, 1, 0, 0, 0, NOW(), NOW(), 'system', 'system');
