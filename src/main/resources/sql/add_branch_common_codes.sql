-- 지점 관련 공통코드 추가
-- 작성일: 2025-01-17
-- 작성자: MindGarden Team
-- 설명: 본사(HQ)와 지점 코드를 공통코드로 관리

-- 1. 코드 그룹 메타데이터 추가
INSERT INTO code_group_metadata (group_name, korean_name, description, icon, color_code, display_order, is_active, created_at, updated_at) VALUES
('BRANCH', '지점', '본사 및 지점 코드를 관리하는 그룹', '🏢', '#007bff', 80, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    korean_name = '지점',
    description = '본사 및 지점 코드를 관리하는 그룹',
    icon = '🏢',
    color_code = '#007bff',
    is_active = true,
    updated_at = NOW();

-- 2. 지점 공통코드 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
-- 본사 (Headquarters)
('BRANCH', 'HQ', '본사', '마인드가든 본사', 1, true, '{"type": "headquarters", "address": "서울특별시 강남구 테헤란로 456", "phone": "02-1234-5678", "email": "hq@mindgarden.com"}', NOW(), NOW(), false, 1),

-- 본점 (Main Branch)
('BRANCH', 'MAIN001', '본점', '마인드가든 본점', 2, true, '{"type": "main_branch", "address": "서울특별시 강남구 테헤란로 123", "phone": "02-1234-5679", "email": "main@mindgarden.com"}', NOW(), NOW(), false, 1),

-- 지점들
('BRANCH', 'GANGNAM', '강남점', '마인드가든 강남지점', 3, true, '{"type": "branch", "address": "서울특별시 강남구 강남대로 123", "phone": "02-1234-5680", "email": "gangnam@mindgarden.com"}', NOW(), NOW(), false, 1),

('BRANCH', 'HONGDAE', '홍대점', '마인드가든 홍대지점', 4, true, '{"type": "branch", "address": "서울특별시 마포구 홍익로 123", "phone": "02-1234-5681", "email": "hongdae@mindgarden.com"}', NOW(), NOW(), false, 1),

('BRANCH', 'JAMSIL', '잠실점', '마인드가든 잠실지점', 5, true, '{"type": "branch", "address": "서울특별시 송파구 잠실로 123", "phone": "02-1234-5682", "email": "jamsil@mindgarden.com"}', NOW(), NOW(), false, 1),

('BRANCH', 'SINCHON', '신촌점', '마인드가든 신촌지점', 6, true, '{"type": "branch", "address": "서울특별시 서대문구 신촌로 123", "phone": "02-1234-5683", "email": "sinchon@mindgarden.com"}', NOW(), NOW(), false, 1),

('BRANCH', 'BUSAN', '부산점', '마인드가든 부산지점', 7, true, '{"type": "branch", "address": "부산광역시 해운대구 해운대로 123", "phone": "051-1234-5684", "email": "busan@mindgarden.com"}', NOW(), NOW(), false, 1),

('BRANCH', 'DAEGU', '대구점', '마인드가든 대구지점', 8, true, '{"type": "branch", "address": "대구광역시 중구 중앙대로 123", "phone": "053-1234-5685", "email": "daegu@mindgarden.com"}', NOW(), NOW(), false, 1),

('BRANCH', 'INCHEON', '인천점', '마인드가든 인천지점', 9, true, '{"type": "branch", "address": "인천광역시 남동구 구월로 123", "phone": "032-1234-5686", "email": "incheon@mindgarden.com"}', NOW(), NOW(), false, 1),

('BRANCH', 'GWANGJU', '광주점', '마인드가든 광주지점', 10, true, '{"type": "branch", "address": "광주광역시 서구 상무대로 123", "phone": "062-1234-5687", "email": "gwangju@mindgarden.com"}', NOW(), NOW(), false, 1)

ON DUPLICATE KEY UPDATE 
    code_label = VALUES(code_label),
    code_description = VALUES(code_description),
    is_active = VALUES(is_active),
    extra_data = VALUES(extra_data),
    updated_at = NOW();

-- 3. 본사 관리자 계정의 지점 코드를 HQ로 업데이트
UPDATE users 
SET branch_code = 'HQ' 
WHERE email = 'super_hq_admin@mindgarden.com' 
   OR role IN ('HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER');

-- 4. 결과 확인
SELECT 
    '지점 공통코드 추가 완료' as status, 
    COUNT(*) as total_branch_codes 
FROM common_codes 
WHERE code_group = 'BRANCH' AND is_deleted = false;

-- 5. 본사 관리자 계정 확인
SELECT 
    id, email, name, role, branch_code
FROM users 
WHERE email = 'super_hq_admin@mindgarden.com' 
   OR role IN ('HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER')
   OR branch_code = 'HQ';
