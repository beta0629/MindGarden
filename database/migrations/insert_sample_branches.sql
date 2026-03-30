-- 샘플 지점 데이터 삽입
-- 기존 백업 파일을 참고하여 실제 지점 데이터 추가

INSERT IGNORE INTO branches (
    id, created_at, updated_at, deleted_at, is_deleted, version,
    address, address_detail, branch_code, branch_name, branch_settings, 
    branch_status, branch_type, closed_days, closing_date, description, 
    email, fax_number, is_active, logo_url, manager_id, max_clients, 
    max_consultants, opening_date, operating_end_time, operating_start_time, 
    parent_branch_id, phone_number, postal_code, website_url
) VALUES 
-- 본점
(1, NOW(), NOW(), NULL, FALSE, 1, 
 '서울시 강남구', NULL, 'MAIN001', '본점', NULL, 
 'ACTIVE', 'MAIN', NULL, NULL, '본사 지점', 
 'main@mindgarden.com', NULL, TRUE, NULL, NULL, 100, 
 50, '2025-01-01', '18:00:00', '09:00:00', 
 NULL, '02-1234-5678', '06292', 'https://mindgarden.com'),

-- 강남점
(2, NOW(), NOW(), NULL, FALSE, 1, 
 '서울시 강남구 테헤란로 123', '강남빌딩 5층', 'GN001', '강남점', NULL, 
 'ACTIVE', 'BRANCH', NULL, NULL, '강남 지역 지점', 
 'gangnam@mindgarden.com', NULL, TRUE, NULL, NULL, 80, 
 30, '2025-01-15', '18:00:00', '09:00:00', 
 1, '02-2345-6789', '06234', 'https://gangnam.mindgarden.com'),

-- 서초점
(3, NOW(), NOW(), NULL, FALSE, 1, 
 '서울시 서초구 서초대로 456', '서초빌딩 3층', 'SC001', '서초점', NULL, 
 'ACTIVE', 'BRANCH', NULL, NULL, '서초 지역 지점', 
 'seocho@mindgarden.com', NULL, TRUE, NULL, NULL, 60, 
 25, '2025-02-01', '18:00:00', '09:00:00', 
 1, '02-3456-7890', '06611', 'https://seocho.mindgarden.com'),

-- 송파점
(4, NOW(), NOW(), NULL, FALSE, 1, 
 '서울시 송파구 올림픽로 789', '송파빌딩 7층', 'SP001', '송파점', NULL, 
 'ACTIVE', 'BRANCH', NULL, NULL, '송파 지역 지점', 
 'songpa@mindgarden.com', NULL, TRUE, NULL, NULL, 70, 
 35, '2025-02-15', '18:00:00', '09:00:00', 
 1, '02-4567-8901', '05542', 'https://songpa.mindgarden.com'),

-- 마포점
(5, NOW(), NOW(), NULL, FALSE, 1, 
 '서울시 마포구 홍대입구역 101', '마포빌딩 4층', 'MP001', '마포점', NULL, 
 'ACTIVE', 'BRANCH', NULL, NULL, '마포 지역 지점', 
 'mapo@mindgarden.com', NULL, TRUE, NULL, NULL, 50, 
 20, '2025-03-01', '18:00:00', '09:00:00', 
 1, '02-5678-9012', '04042', 'https://mapo.mindgarden.com'),

-- 분당점
(6, NOW(), NOW(), NULL, FALSE, 1, 
 '경기도 성남시 분당구 판교역로 234', '분당빌딩 6층', 'BD001', '분당점', NULL, 
 'ACTIVE', 'BRANCH', NULL, NULL, '분당 지역 지점', 
 'bundang@mindgarden.com', NULL, TRUE, NULL, NULL, 90, 
 40, '2025-03-15', '18:00:00', '09:00:00', 
 1, '031-1234-5678', '13494', 'https://bundang.mindgarden.com'),

-- 수원점
(7, NOW(), NOW(), NULL, FALSE, 1, 
 '경기도 수원시 영통구 광교로 567', '수원빌딩 8층', 'SW001', '수원점', NULL, 
 'ACTIVE', 'BRANCH', NULL, NULL, '수원 지역 지점', 
 'suwon@mindgarden.com', NULL, TRUE, NULL, NULL, 75, 
 30, '2025-04-01', '18:00:00', '09:00:00', 
 1, '031-2345-6789', '16229', 'https://suwon.mindgarden.com');
