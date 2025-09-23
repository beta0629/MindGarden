-- 지점별 지점수퍼 관리자 계정 생성 SQL 스크립트
-- 작성일: 2025-09-23
-- 설명: 각 지점에 지점수퍼 관리자 계정을 생성하고 기본 데이터를 설정

-- 1. 강남점 관리자 계정
INSERT INTO users (
    email, password, username, name, role, phone, branch_code, is_active, is_email_verified, 
    created_at, updated_at, is_deleted, version
) VALUES (
    'gangnam_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- admin123
    'gangnam_admin',
    '강남점 관리자',
    'BRANCH_SUPER_ADMIN',
    '010-1234-5678',
    'GANGNAM',
    true,
    true,
    NOW(),
    NOW(),
    false,
    0
);

-- 2. 홍대점 관리자 계정
INSERT INTO users (
    email, password, name, role, phone, branch_code, is_active, is_email_verified, 
    created_at, updated_at, is_deleted, version
) VALUES (
    'hongdae_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- admin123
    '홍대점 관리자',
    'BRANCH_SUPER_ADMIN',
    '010-1234-5679',
    'HONGDAE',
    true,
    true,
    NOW(),
    NOW(),
    false,
    0
);

-- 3. 잠실점 관리자 계정
INSERT INTO users (
    email, password, name, role, phone, branch_code, is_active, is_email_verified, 
    created_at, updated_at, is_deleted, version
) VALUES (
    'jamsil_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- admin123
    '잠실점 관리자',
    'BRANCH_SUPER_ADMIN',
    '010-1234-5680',
    'JAMSIL',
    true,
    true,
    NOW(),
    NOW(),
    false,
    0
);

-- 4. 신촌점 관리자 계정
INSERT INTO users (
    email, password, name, role, phone, branch_code, is_active, is_email_verified, 
    created_at, updated_at, is_deleted, version
) VALUES (
    'sinchon_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- admin123
    '신촌점 관리자',
    'BRANCH_SUPER_ADMIN',
    '010-1234-5681',
    'SINCHON',
    true,
    true,
    NOW(),
    NOW(),
    false,
    0
);

-- 5. 부산점 관리자 계정
INSERT INTO users (
    email, password, name, role, phone, branch_code, is_active, is_email_verified, 
    created_at, updated_at, is_deleted, version
) VALUES (
    'busan_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- admin123
    '부산점 관리자',
    'BRANCH_SUPER_ADMIN',
    '010-1234-5682',
    'BUSAN',
    true,
    true,
    NOW(),
    NOW(),
    false,
    0
);

-- 6. 대구점 관리자 계정
INSERT INTO users (
    email, password, name, role, phone, branch_code, is_active, is_email_verified, 
    created_at, updated_at, is_deleted, version
) VALUES (
    'daegu_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- admin123
    '대구점 관리자',
    'BRANCH_SUPER_ADMIN',
    '010-1234-5683',
    'BUSAN',
    true,
    true,
    NOW(),
    NOW(),
    false,
    0
);

-- 7. 인천점 관리자 계정
INSERT INTO users (
    email, password, name, role, phone, branch_code, is_active, is_email_verified, 
    created_at, updated_at, is_deleted, version
) VALUES (
    'incheon_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- admin123
    '인천점 관리자',
    'BRANCH_SUPER_ADMIN',
    '010-1234-5684',
    'INCHEON',
    true,
    true,
    NOW(),
    NOW(),
    false,
    0
);

-- 8. 광주점 관리자 계정
INSERT INTO users (
    email, password, name, role, phone, branch_code, is_active, is_email_verified, 
    created_at, updated_at, is_deleted, version
) VALUES (
    'gwangju_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- admin123
    '광주점 관리자',
    'BRANCH_SUPER_ADMIN',
    '010-1234-5685',
    'GWANGJU',
    true,
    true,
    NOW(),
    NOW(),
    false,
    0
);

-- 9. 각 지점별 테스트 상담사 계정 생성
INSERT INTO users (
    email, password, name, role, phone, branch_code, is_active, is_email_verified, 
    created_at, updated_at, is_deleted, version
) VALUES 
('consultant_gangnam@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '강남점 테스트상담사', 'CONSULTANT', '010-2345-6789', 'GANGNAM', true, true, NOW(), NOW(), false, 0),
('consultant_hongdae@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '홍대점 테스트상담사', 'CONSULTANT', '010-2345-6790', 'HONGDAE', true, true, NOW(), NOW(), false, 0),
('consultant_jamsil@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '잠실점 테스트상담사', 'CONSULTANT', '010-2345-6791', 'JAMSIL', true, true, NOW(), NOW(), false, 0),
('consultant_sinchon@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '신촌점 테스트상담사', 'CONSULTANT', '010-2345-6792', 'SINCHON', true, true, NOW(), NOW(), false, 0),
('consultant_busan@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '부산점 테스트상담사', 'CONSULTANT', '010-2345-6793', 'BUSAN', true, true, NOW(), NOW(), false, 0),
('consultant_daegu@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '대구점 테스트상담사', 'CONSULTANT', '010-2345-6794', 'DAEGU', true, true, NOW(), NOW(), false, 0),
('consultant_incheon@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '인천점 테스트상담사', 'CONSULTANT', '010-2345-6795', 'INCHEON', true, true, NOW(), NOW(), false, 0),
('consultant_gwangju@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '광주점 테스트상담사', 'CONSULTANT', '010-2345-6796', 'GWANGJU', true, true, NOW(), NOW(), false, 0);

-- 10. 각 지점별 테스트 내담자 계정 생성
INSERT INTO users (
    email, password, name, role, phone, branch_code, is_active, is_email_verified, 
    created_at, updated_at, is_deleted, version
) VALUES 
('client_gangnam@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '강남점 테스트내담자', 'CLIENT', '010-3456-7890', 'GANGNAM', true, true, NOW(), NOW(), false, 0),
('client_hongdae@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '홍대점 테스트내담자', 'CLIENT', '010-3456-7891', 'HONGDAE', true, true, NOW(), NOW(), false, 0),
('client_jamsil@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '잠실점 테스트내담자', 'CLIENT', '010-3456-7892', 'JAMSIL', true, true, NOW(), NOW(), false, 0),
('client_sinchon@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '신촌점 테스트내담자', 'CLIENT', '010-3456-7893', 'SINCHON', true, true, NOW(), NOW(), false, 0),
('client_busan@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '부산점 테스트내담자', 'CLIENT', '010-3456-7894', 'BUSAN', true, true, NOW(), NOW(), false, 0),
('client_daegu@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '대구점 테스트내담자', 'CLIENT', '010-3456-7895', 'DAEGU', true, true, NOW(), NOW(), false, 0),
('client_incheon@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '인천점 테스트내담자', 'CLIENT', '010-3456-7896', 'INCHEON', true, true, NOW(), NOW(), false, 0),
('client_gwangju@mindgarden.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '광주점 테스트내담자', 'CLIENT', '010-3456-7897', 'GWANGJU', true, true, NOW(), NOW(), false, 0);

-- 11. 상담사 상세 정보 생성 (consultants 테이블)
INSERT INTO consultants (
    id, grade, specialty, years_of_experience, is_available, max_clients, 
    current_clients, total_clients, average_rating, total_ratings, 
    session_duration, break_time, consultation_hours, success_rate,
    created_at, updated_at, is_deleted, version
) 
SELECT 
    u.id, 'SENIOR', '개인상담', 5, true, 20, 0, 0, 0.0, 0, 
    60, 15, 40, 85.0, NOW(), NOW(), false, 0
FROM users u 
WHERE u.role = 'CONSULTANT' 
AND u.email LIKE '%@mindgarden.com'
AND u.branch_code IN ('GANGNAM', 'HONGDAE', 'JAMSIL', 'SINCHON', 'BUSAN', 'DAEGU', 'INCHEON', 'GWANGJU');

-- 12. 내담자 상세 정보 생성 (clients 테이블)
INSERT INTO clients (
    id, created_at, updated_at, is_deleted, version
) 
SELECT 
    u.id, NOW(), NOW(), false, 0
FROM users u 
WHERE u.role = 'CLIENT' 
AND u.email LIKE '%@mindgarden.com'
AND u.branch_code IN ('GANGNAM', 'HONGDAE', 'JAMSIL', 'SINCHON', 'BUSAN', 'DAEGU', 'INCHEON', 'GWANGJU');

-- 13. 결과 확인
SELECT 
    '지점별 계정 생성 완료' as status,
    COUNT(*) as total_accounts
FROM users 
WHERE email LIKE '%_admin@mindgarden.com' 
AND role = 'BRANCH_SUPER_ADMIN';

SELECT 
    '테스트 상담사 계정 생성 완료' as status,
    COUNT(*) as total_consultants
FROM users 
WHERE email LIKE 'consultant_%@mindgarden.com' 
AND role = 'CONSULTANT';

SELECT 
    '테스트 내담자 계정 생성 완료' as status,
    COUNT(*) as total_clients
FROM users 
WHERE email LIKE 'client_%@mindgarden.com' 
AND role = 'CLIENT';
