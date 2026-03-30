-- 비밀번호 해시 업데이트 스크립트
-- 주의: 이 스크립트는 Java에서 생성한 BCrypt 해시를 사용해야 함
-- 임시로 기존 해시를 유지하되, Java 서비스에서 재생성 권장

-- 비밀번호: godgod826!
-- BCrypt 해시 (강도 12): Java PasswordEncoder에서 생성 필요
-- 예시: $2a$12$...

-- 사용자 비밀번호 확인
SELECT 
    id,
    user_id,
    email,
    password,
    role,
    tenant_id
FROM users 
WHERE email = 'beta0629@gmail.com'
  AND user_id = 'beta0629';

-- 비밀번호 해시는 Java 서비스에서 생성하여 업데이트해야 함
-- UPDATE users 
-- SET password = '[Java에서 생성한 BCrypt 해시]'
-- WHERE email = 'beta0629@gmail.com'
--   AND user_id = 'beta0629';

