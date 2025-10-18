-- 운영 환경 테스트 데이터 정리
-- 1. 테스트 상담사 삭제
DELETE FROM users 
WHERE name LIKE '%테스트%' 
   OR name LIKE '%test%' 
   OR email LIKE '%test%'
   OR username LIKE '%test%';

-- 2. 테스트 내담자 삭제  
DELETE FROM clients 
WHERE name LIKE '%테스트%' 
   OR name LIKE '%test%'
   OR email LIKE '%test%';

-- 3. 테스트 매핑 삭제
DELETE FROM consultant_client_mappings 
WHERE consultant_id IN (
    SELECT id FROM users WHERE name LIKE '%테스트%' OR name LIKE '%test%'
)
OR client_id IN (
    SELECT id FROM clients WHERE name LIKE '%테스트%' OR name LIKE '%test%'
);

-- 4. 테스트 패키지 관련 매핑 삭제
DELETE FROM consultant_client_mappings 
WHERE package_name LIKE '%테스트%' 
   OR package_name LIKE '%test%';

-- 5. 결과 확인
SELECT 'Test data cleanup completed' as status;
SELECT COUNT(*) as remaining_mappings FROM consultant_client_mappings;
