-- Super HQ Admin 사용자 생성
-- 비밀번호: MindGarden2025! (BCrypt로 암호화됨)

INSERT INTO users (
    email, 
    name, 
    password, 
    role, 
    branch_code, 
    is_active, 
    created_at, 
    updated_at, 
    version
) VALUES (
    'super_hq_admin@mindgarden.com',
    'Super HQ Admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5J5K5K5K5K', -- MindGarden2025! (BCrypt)
    'SUPER_HQ_ADMIN',
    'HQ',
    true,
    NOW(),
    NOW(),
    1
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password),
    role = VALUES(role),
    branch_code = VALUES(branch_code),
    is_active = VALUES(is_active),
    updated_at = NOW();

-- 결과 확인
SELECT 
    id, email, name, role, branch_code, is_active
FROM users 
WHERE email = 'super_hq_admin@mindgarden.com';
