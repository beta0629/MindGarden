-- MAIN001 지점 데이터 생성
-- Branch 테이블에 본점 데이터 추가

INSERT INTO branch (
    id, 
    branch_code, 
    branch_name, 
    branch_type,
    postal_code,
    address,
    address_detail,
    phone_number,
    email,
    operating_start_time,
    operating_end_time,
    max_consultants,
    max_clients,
    description,
    branch_status,
    is_deleted,
    created_at,
    updated_at,
    version
) VALUES (
    1,
    'MAIN001',
    '본점',
    'HEADQUARTERS',
    '06234',
    '서울특별시 강남구 테헤란로 123',
    '1층',
    '02-1234-5678',
    'main@mindgarden.com',
    '09:00:00',
    '18:00:00',
    50,
    1000,
    '마인드가든 본점',
    'ACTIVE',
    false,
    NOW(),
    NOW(),
    0
) ON DUPLICATE KEY UPDATE 
    branch_name = '본점',
    branch_status = 'ACTIVE',
    is_deleted = false,
    updated_at = NOW();
