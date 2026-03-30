-- 단회기 상담 패키지 등록 (30,000원 ~ 100,000원, 5,000원 단위)
-- 기존 단회기 패키지가 있다면 삭제 후 재등록

DELETE FROM common_codes WHERE code_group = 'CONSULTATION_PACKAGE' AND code_value LIKE 'SINGLE_%';

-- 단회기 패키지 등록 (30,000원 ~ 100,000원, 5,000원 단위)
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, is_active, is_deleted, version, sort_order, created_at, updated_at) VALUES
('CONSULTATION_PACKAGE', 'SINGLE_30000', 'SINGLE_30000', '단회기 상담 (30,000원)', true, false, 0, 100, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_35000', 'SINGLE_35000', '단회기 상담 (35,000원)', true, false, 0, 101, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_40000', 'SINGLE_40000', '단회기 상담 (40,000원)', true, false, 0, 102, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_45000', 'SINGLE_45000', '단회기 상담 (45,000원)', true, false, 0, 103, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_50000', 'SINGLE_50000', '단회기 상담 (50,000원)', true, false, 0, 104, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_55000', 'SINGLE_55000', '단회기 상담 (55,000원)', true, false, 0, 105, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_60000', 'SINGLE_60000', '단회기 상담 (60,000원)', true, false, 0, 106, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_65000', 'SINGLE_65000', '단회기 상담 (65,000원)', true, false, 0, 107, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_70000', 'SINGLE_70000', '단회기 상담 (70,000원)', true, false, 0, 108, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_75000', 'SINGLE_75000', '단회기 상담 (75,000원)', true, false, 0, 109, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_80000', 'SINGLE_80000', '단회기 상담 (80,000원)', true, false, 0, 110, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_85000', 'SINGLE_85000', '단회기 상담 (85,000원)', true, false, 0, 111, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_90000', 'SINGLE_90000', '단회기 상담 (90,000원)', true, false, 0, 112, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_95000', 'SINGLE_95000', '단회기 상담 (95,000원)', true, false, 0, 113, NOW(), NOW()),
('CONSULTATION_PACKAGE', 'SINGLE_100000', 'SINGLE_100000', '단회기 상담 (100,000원)', true, false, 0, 114, NOW(), NOW());

-- 등록 확인
SELECT code_value, code_label, korean_name, sort_order 
FROM common_codes 
WHERE code_group = 'CONSULTATION_PACKAGE' 
ORDER BY sort_order;
