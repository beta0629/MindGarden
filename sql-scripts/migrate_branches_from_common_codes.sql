-- common_codes의 지점 데이터를 branches 테이블로 마이그레이션
-- 작성일: 2025-01-17
-- 작성자: MindGarden Team

-- 1. 기존 branches 테이블 데이터 확인
SELECT '기존 branches 테이블 데이터:' as info;
SELECT id, branch_name, branch_code, branch_type, branch_status FROM branches;

-- 2. common_codes의 BRANCH 그룹 데이터 확인
SELECT 'common_codes의 BRANCH 그룹 데이터:' as info;
SELECT id, code_value, code_label, korean_name, is_active FROM common_codes WHERE code_group = 'BRANCH' ORDER BY sort_order;

-- 3. branches 테이블에 지점 데이터 추가
INSERT INTO branches (
    branch_name, 
    branch_code, 
    branch_type, 
    branch_status, 
    address, 
    phone_number, 
    email, 
    max_consultants, 
    max_clients,
    created_at, 
    updated_at, 
    is_deleted, 
    version
) VALUES
-- 본사 (Headquarters)
('본사', 'HQ', 'MAIN', 'ACTIVE', '서울특별시 강남구 테헤란로 456', '02-1234-5678', 'hq@mindgarden.com', 50, 200, NOW(), NOW(), false, 1),

-- 본점 (Main Branch) - 이미 존재하므로 제외
-- ('본점', 'MAIN001', 'MAIN', 'ACTIVE', '서울특별시 강남구 테헤란로 123', '02-1234-5679', 'main@mindgarden.com', 30, 150, NOW(), NOW(), false, 1),

-- 지점들
('강남점', 'GANGNAM', 'FRANCHISE', 'ACTIVE', '서울특별시 강남구 강남대로 123', '02-1234-5680', 'gangnam@mindgarden.com', 25, 120, NOW(), NOW(), false, 1),

('홍대점', 'HONGDAE', 'FRANCHISE', 'ACTIVE', '서울특별시 마포구 홍익로 123', '02-1234-5681', 'hongdae@mindgarden.com', 20, 100, NOW(), NOW(), false, 1),

('잠실점', 'JAMSIL', 'FRANCHISE', 'ACTIVE', '서울특별시 송파구 잠실로 123', '02-1234-5682', 'jamsil@mindgarden.com', 20, 100, NOW(), NOW(), false, 1),

('신촌점', 'SINCHON', 'FRANCHISE', 'ACTIVE', '서울특별시 서대문구 신촌로 123', '02-1234-5683', 'sinchon@mindgarden.com', 20, 100, NOW(), NOW(), false, 1),

('인천송도점', 'SONGDO', 'FRANCHISE', 'ACTIVE', '인천광역시 연수구 송도과학로 123', '032-1234-5684', 'songdo@mindgarden.com', 20, 100, NOW(), NOW(), false, 1);

-- 4. 마이그레이션 후 데이터 확인
SELECT '마이그레이션 후 branches 테이블 데이터:' as info;
SELECT id, branch_name, branch_code, branch_type, branch_status, address, phone_number, email FROM branches ORDER BY id;

-- 5. 마이그레이션 완료 후 common_codes에서 BRANCH 그룹 데이터 삭제 (나중에 실행)
-- DELETE FROM common_codes WHERE code_group = 'BRANCH';
