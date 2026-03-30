-- 테스트 테넌트용 데이터 추가 스크립트
-- 테넌트: test-consultation-1763988242@example.com

-- 1. 테넌트 정보 확인
SELECT 
    id, tenant_id, name, business_type, created_at
FROM tenants 
WHERE tenant_id LIKE '%1763988242%' 
   OR name LIKE '%test%';

-- 2. 테스트 상담사 추가 (테넌트별)
INSERT INTO users (
    email, name, nickname, password, role, tenant_id, branch_code,
    social_provider, created_at, updated_at, is_active, username, is_email_verified, is_social_account,
    is_deleted, version
) VALUES 
-- 상담사 1
('consultant1@test-consultation.com', '김상담', '김상담사', '$2a$10$dummyHashForTesting', 'CONSULTANT', 
 (SELECT tenant_id FROM tenants WHERE tenant_id LIKE '%1763988242%' LIMIT 1), 
 'TEST_BRANCH_01', 'LOCAL', NOW(), NOW(), true, 'test_consultant1', true, false, false, 0),

-- 상담사 2
('consultant2@test-consultation.com', '이상담', '이상담사', '$2a$10$dummyHashForTesting', 'CONSULTANT', 
 (SELECT tenant_id FROM tenants WHERE tenant_id LIKE '%1763988242%' LIMIT 1), 
 'TEST_BRANCH_01', 'LOCAL', NOW(), NOW(), true, 'test_consultant2', true, false, false, 0),

-- 상담사 3
('consultant3@test-consultation.com', '박상담', '박상담사', '$2a$10$dummyHashForTesting', 'CONSULTANT', 
 (SELECT tenant_id FROM tenants WHERE tenant_id LIKE '%1763988242%' LIMIT 1), 
 'TEST_BRANCH_01', 'LOCAL', NOW(), NOW(), true, 'test_consultant3', true, false, false, 0);

-- 3. 테스트 내담자 추가 (테넌트별)
INSERT INTO users (
    email, name, nickname, password, role, tenant_id, branch_code,
    social_provider, created_at, updated_at, is_active, username, is_email_verified, is_social_account,
    is_deleted, version
) VALUES 
-- 내담자 1
('client1@test-consultation.com', '김내담', '김내담자', '$2a$10$dummyHashForTesting', 'CLIENT', 
 (SELECT tenant_id FROM tenants WHERE tenant_id LIKE '%1763988242%' LIMIT 1), 
 'TEST_BRANCH_01', 'LOCAL', NOW(), NOW(), true, 'test_client1', true, false, false, 0),

-- 내담자 2
('client2@test-consultation.com', '이내담', '이내담자', '$2a$10$dummyHashForTesting', 'CLIENT', 
 (SELECT tenant_id FROM tenants WHERE tenant_id LIKE '%1763988242%' LIMIT 1), 
 'TEST_BRANCH_01', 'LOCAL', NOW(), NOW(), true, 'test_client2', true, false, false, 0),

-- 내담자 3
('client3@test-consultation.com', '박내담', '박내담자', '$2a$10$dummyHashForTesting', 'CLIENT', 
 (SELECT tenant_id FROM tenants WHERE tenant_id LIKE '%1763988242%' LIMIT 1), 
 'TEST_BRANCH_01', 'LOCAL', NOW(), NOW(), true, 'test_client3', true, false, false, 0),

-- 내담자 4
('client4@test-consultation.com', '최내담', '최내담자', '$2a$10$dummyHashForTesting', 'CLIENT', 
 (SELECT tenant_id FROM tenants WHERE tenant_id LIKE '%1763988242%' LIMIT 1), 
 'TEST_BRANCH_01', 'LOCAL', NOW(), NOW(), true, 'test_client4', true, false, false, 0),

-- 내담자 5
('client5@test-consultation.com', '정내담', '정내담자', '$2a$10$dummyHashForTesting', 'CLIENT', 
 (SELECT tenant_id FROM tenants WHERE tenant_id LIKE '%1763988242%' LIMIT 1), 
 'TEST_BRANCH_01', 'LOCAL', NOW(), NOW(), true, 'test_client5', true, false, false, 0);

-- 4. 상담사-내담자 매칭 추가
INSERT INTO consultant_client_mappings (
    consultant_id, client_id, tenant_id, branch_code, 
    status, start_date, created_at, updated_at, is_deleted, version,
    payment_status, remaining_sessions
)
SELECT 
    c.id as consultant_id,
    cl.id as client_id,
    c.tenant_id,
    c.branch_code,
    'ACTIVE',
    NOW(),
    NOW(),
    NOW(),
    false,
    0,
    'CONFIRMED',
    10
FROM users c
CROSS JOIN users cl
WHERE c.role = 'CONSULTANT' 
  AND cl.role = 'CLIENT'
  AND c.tenant_id LIKE '%1763988242%'
  AND cl.tenant_id LIKE '%1763988242%'
  AND c.email LIKE '%test-consultation.com'
  AND cl.email LIKE '%test-consultation.com'
LIMIT 8; -- 각 상담사당 2-3명의 내담자 매칭

-- 5. 테스트 상담 기록 추가 (최근 활동 시뮬레이션)
INSERT INTO consultation_records (
    consultant_id, client_id, tenant_id, branch_code,
    consultation_date, consultation_type, duration_minutes,
    status, notes, created_at, updated_at
)
SELECT 
    ccm.consultant_id,
    ccm.client_id,
    ccm.tenant_id,
    ccm.branch_code,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY) as consultation_date,
    CASE FLOOR(RAND() * 3)
        WHEN 0 THEN 'INDIVIDUAL'
        WHEN 1 THEN 'GROUP'
        ELSE 'FAMILY'
    END as consultation_type,
    30 + FLOOR(RAND() * 90) as duration_minutes, -- 30-120분
    'COMPLETED',
    CONCAT('테스트 상담 기록 #', FLOOR(RAND() * 1000)),
    NOW(),
    NOW()
FROM consultant_client_mappings ccm
WHERE ccm.tenant_id LIKE '%1763988242%'
  AND ccm.is_deleted = false;

-- 6. 결과 확인 쿼리
SELECT '=== 테스트 데이터 추가 완료 ===' as status;

SELECT 
    '상담사' as type,
    COUNT(*) as count
FROM users 
WHERE role = 'CONSULTANT' 
  AND tenant_id LIKE '%1763988242%'
  AND email LIKE '%test-consultation.com'

UNION ALL

SELECT 
    '내담자' as type,
    COUNT(*) as count
FROM users 
WHERE role = 'CLIENT' 
  AND tenant_id LIKE '%1763988242%'
  AND email LIKE '%test-consultation.com'

UNION ALL

SELECT 
    '매칭' as type,
    COUNT(*) as count
FROM consultant_client_mappings 
WHERE tenant_id LIKE '%1763988242%'
  AND is_deleted = false

UNION ALL

SELECT 
    '상담기록' as type,
    COUNT(*) as count
FROM consultation_records 
WHERE tenant_id LIKE '%1763988242%';
