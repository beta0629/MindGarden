-- ============================================
-- 온보딩 PENDING 상태 테스트 데이터 생성
-- ============================================
-- 목적: 승인 테스트를 위한 PENDING 상태 온보딩 요청 데이터 생성
-- 작성일: 2025-12-27
-- ============================================

-- 기존 테스트 데이터 삭제 (test-@example.com으로 시작하는 이메일)
DELETE FROM onboarding_request WHERE requested_by LIKE 'test-%@example.com';

-- 1. PENDING 상태 - 상담소 (LOW 위험도)
INSERT INTO onboarding_request (
    id, tenant_id, tenant_name, brand_name, region, requested_by, 
    status, risk_level, business_type, checklist_json,
    created_at, updated_at, is_deleted, version
) VALUES (
    UNHEX(REPLACE(UUID(), '-', '')), 
    NULL, 
    '서울 강남 상담소', 
    '강남 상담소', 
    '서울특별시', 
    'test-pending-consultation@example.com',
    'PENDING', 
    'LOW', 
    'CONSULTATION',
    '{"adminPassword": "Test1234!@#", "contactPhone": "02-1234-5678", "regionCode": "seoul", "brandName": "강남 상담소"}',
    NOW() - INTERVAL 2 DAY, 
    NOW() - INTERVAL 2 DAY, 
    FALSE, 
    0
);

-- 2. PENDING 상태 - 상담소 (MEDIUM 위험도)
INSERT INTO onboarding_request (
    id, tenant_id, tenant_name, brand_name, region, requested_by, 
    status, risk_level, business_type, checklist_json,
    created_at, updated_at, is_deleted, version
) VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    NULL, 
    '부산 해운대 상담소', 
    '해운대 상담소', 
    '부산광역시', 
    'test-pending-medium@example.com',
    'PENDING', 
    'MEDIUM', 
    'CONSULTATION',
    '{"adminPassword": "Test1234!@#", "contactPhone": "051-1234-5678", "regionCode": "busan", "brandName": "해운대 상담소"}',
    NOW() - INTERVAL 1 DAY, 
    NOW() - INTERVAL 1 DAY, 
    FALSE, 
    0
);

-- 3. PENDING 상태 - 카운셀링 (COUNSELING)
INSERT INTO onboarding_request (
    id, tenant_id, tenant_name, brand_name, region, requested_by, 
    status, risk_level, business_type, checklist_json,
    created_at, updated_at, is_deleted, version
) VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    NULL, 
    '서울 강북 카운셀링 센터', 
    '강북 카운셀링', 
    '서울특별시', 
    'test-counseling@example.com',
    'PENDING', 
    'LOW', 
    'COUNSELING',
    '{"adminPassword": "Test1234!@#", "contactPhone": "02-3456-7890", "regionCode": "seoul", "brandName": "강북 카운셀링"}',
    NOW() - INTERVAL 1 DAY, 
    NOW() - INTERVAL 1 DAY, 
    FALSE, 
    0
);

-- 4. PENDING 상태 - 아카데미 (ACADEMY)
INSERT INTO onboarding_request (
    id, tenant_id, tenant_name, brand_name, region, requested_by, 
    status, risk_level, business_type, checklist_json,
    created_at, updated_at, is_deleted, version
) VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    NULL, 
    '경기 성남 아카데미', 
    '성남 아카데미', 
    '경기도', 
    'test-academy@example.com',
    'PENDING', 
    'LOW', 
    'ACADEMY',
    '{"adminPassword": "Test1234!@#", "contactPhone": "031-1234-5678", "regionCode": "gyeonggi", "brandName": "성남 아카데미"}',
    NOW() - INTERVAL 1 DAY, 
    NOW() - INTERVAL 1 DAY, 
    FALSE, 
    0
);

-- 5. PENDING 상태 - 서브도메인 포함
INSERT INTO onboarding_request (
    id, tenant_id, tenant_name, brand_name, region, subdomain, requested_by, 
    status, risk_level, business_type, checklist_json,
    created_at, updated_at, is_deleted, version
) VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    NULL, 
    '서울 마포 상담소', 
    '마포 상담소', 
    '서울특별시', 
    'mapo',
    'test-subdomain@example.com',
    'PENDING', 
    'LOW', 
    'CONSULTATION',
    '{"adminPassword": "Test1234!@#", "contactPhone": "02-4567-8901", "regionCode": "seoul", "brandName": "마포 상담소", "subdomain": "mapo"}',
    NOW() - INTERVAL 1 DAY, 
    NOW() - INTERVAL 1 DAY, 
    FALSE, 
    0
);

-- 6. PENDING 상태 - HIGH 위험도
INSERT INTO onboarding_request (
    id, tenant_id, tenant_name, brand_name, region, requested_by, 
    status, risk_level, business_type, checklist_json,
    created_at, updated_at, is_deleted, version
) VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    NULL, 
    '서울 영등포 상담소', 
    '영등포 상담소', 
    '서울특별시', 
    'test-high-risk@example.com',
    'PENDING', 
    'HIGH', 
    'CONSULTATION',
    '{"adminPassword": "Test1234!@#", "contactPhone": "02-5678-9012", "regionCode": "seoul", "brandName": "영등포 상담소"}',
    NOW() - INTERVAL 1 DAY, 
    NOW() - INTERVAL 1 DAY, 
    FALSE, 
    0
);

-- 7. IN_REVIEW 상태 - 상담소 (검토 중)
INSERT INTO onboarding_request (
    id, tenant_id, tenant_name, brand_name, region, requested_by, 
    status, risk_level, business_type, checklist_json,
    created_at, updated_at, is_deleted, version
) VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    NULL, 
    '인천 송도 상담소', 
    '송도 상담소', 
    '인천광역시', 
    'test-inreview@example.com',
    'IN_REVIEW', 
    'LOW', 
    'CONSULTATION',
    '{"adminPassword": "Test1234!@#", "contactPhone": "032-1234-5678", "regionCode": "incheon", "brandName": "송도 상담소"}',
    NOW() - INTERVAL 3 DAY, 
    NOW() - INTERVAL 1 HOUR, 
    FALSE, 
    0
);

-- 8. ON_HOLD 상태 - 상담소 (HIGH 위험도)
INSERT INTO onboarding_request (
    id, tenant_id, tenant_name, brand_name, region, requested_by, 
    status, risk_level, business_type, checklist_json,
    decided_by, decision_at, decision_note,
    created_at, updated_at, is_deleted, version
) VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    NULL, 
    '대구 수성 상담소', 
    '수성 상담소', 
    '대구광역시', 
    'test-onhold@example.com',
    'ON_HOLD', 
    'HIGH', 
    'CONSULTATION',
    '{"adminPassword": "Test1234!@#", "contactPhone": "053-1234-5678", "regionCode": "daegu", "brandName": "수성 상담소"}',
    'ops_core',
    DATE_FORMAT(NOW() - INTERVAL 1 DAY, '%Y-%m-%dT%H:%i:%sZ'),
    '추가 정보 확인 필요',
    NOW() - INTERVAL 5 DAY, 
    NOW() - INTERVAL 1 DAY, 
    FALSE, 
    1
);

-- 완료 메시지
SELECT '온보딩 PENDING 상태 테스트 데이터 생성 완료: 총 8건 (PENDING 6건, IN_REVIEW 1건, ON_HOLD 1건)' AS message;

