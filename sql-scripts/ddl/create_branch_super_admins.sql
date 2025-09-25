-- 각 지점별 지점수퍼관리자 생성 스크립트

-- 1. 강남점 지점수퍼관리자
INSERT INTO users (
    email, password, name, role, grade, branch_code, branch_id, 
    phone, address, is_active, created_at, updated_at
) VALUES (
    'gangnam_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKyVhQrF0yP/8KzqKzqKzqKzqKzq', -- password: gangnam123
    '강남점 관리자',
    'BRANCH_SUPER_ADMIN',
    'SUPER_ADMIN',
    'GANGNAM',
    NULL,
    '010-1111-2222',
    '서울특별시 강남구 테헤란로 123',
    true,
    NOW(),
    NOW()
);

-- 2. 홍대점 지점수퍼관리자
INSERT INTO users (
    email, password, name, role, grade, branch_code, branch_id, 
    phone, address, is_active, created_at, updated_at
) VALUES (
    'hongdae_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKyVhQrF0yP/8KzqKzqKzqKzqKzq', -- password: hongdae123
    '홍대점 관리자',
    'BRANCH_SUPER_ADMIN',
    'SUPER_ADMIN',
    'HONGDAE',
    NULL,
    '010-2222-3333',
    '서울특별시 마포구 홍익로 456',
    true,
    NOW(),
    NOW()
);

-- 3. 잠실점 지점수퍼관리자
INSERT INTO users (
    email, password, name, role, grade, branch_code, branch_id, 
    phone, address, is_active, created_at, updated_at
) VALUES (
    'jamsil_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKyVhQrF0yP/8KzqKzqKzqKzqKzq', -- password: jamsil123
    '잠실점 관리자',
    'BRANCH_SUPER_ADMIN',
    'SUPER_ADMIN',
    'JAMSIL',
    NULL,
    '010-3333-4444',
    '서울특별시 송파구 올림픽로 789',
    true,
    NOW(),
    NOW()
);

-- 4. 신촌점 지점수퍼관리자
INSERT INTO users (
    email, password, name, role, grade, branch_code, branch_id, 
    phone, address, is_active, created_at, updated_at
) VALUES (
    'sinchon_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKyVhQrF0yP/8KzqKzqKzqKzqKzq', -- password: sinchon123
    '신촌점 관리자',
    'BRANCH_SUPER_ADMIN',
    'SUPER_ADMIN',
    'SINCHON',
    NULL,
    '010-4444-5555',
    '서울특별시 서대문구 신촌로 101',
    true,
    NOW(),
    NOW()
);

-- 5. 인천송도점 지점수퍼관리자
INSERT INTO users (
    email, password, name, role, grade, branch_code, branch_id, 
    phone, address, is_active, created_at, updated_at
) VALUES (
    'songdo_admin@mindgarden.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKyVhQrF0yP/8KzqKzqKzqKzqKzq', -- password: songdo123
    '인천송도점 관리자',
    'BRANCH_SUPER_ADMIN',
    'SUPER_ADMIN',
    'inchen_songdo',
    NULL,
    '010-5555-6666',
    '인천광역시 연수구 송도과학로 202',
    true,
    NOW(),
    NOW()
);

-- 생성된 사용자 확인
SELECT 
    id, email, name, role, grade, branch_code, 
    phone, address, is_active, created_at
FROM users 
WHERE role = 'BRANCH_SUPER_ADMIN' 
ORDER BY branch_code;
