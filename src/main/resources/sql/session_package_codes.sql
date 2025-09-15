-- 회기 패키지 공통코드 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, created_at, updated_at) VALUES
('SESSION_PACKAGE', 'BASIC_PACKAGE', '기본 패키지', '100000', true, NOW(), NOW()),
('SESSION_PACKAGE', 'PREMIUM_PACKAGE', '프리미엄 패키지', '200000', true, NOW(), NOW()),
('SESSION_PACKAGE', 'VIP_PACKAGE', 'VIP 패키지', '300000', true, NOW(), NOW()),
('SESSION_PACKAGE', 'FAMILY_PACKAGE', '가족 패키지', '500000', true, NOW(), NOW()),
('SESSION_PACKAGE', 'COUPLE_PACKAGE', '커플 패키지', '400000', true, NOW(), NOW()),
('SESSION_PACKAGE', 'STUDENT_PACKAGE', '학생 패키지', '80000', true, NOW(), NOW()),
('SESSION_PACKAGE', 'SENIOR_PACKAGE', '시니어 패키지', '150000', true, NOW(), NOW()),
('SESSION_PACKAGE', 'CORPORATE_PACKAGE', '기업 패키지', '1000000', true, NOW(), NOW());
