-- 결제 방법 코드를 특정 테넌트에 추가하는 SQL 스크립트
-- 사용법: tenant_id를 직접 지정하여 결제 방법 코드 추가

-- 설정: tenant_id 직접 지정
SET @tenant_id = 'tenant-incheon-consultation-006';

-- 테넌트 정보 확인
SELECT 
    @tenant_id AS tenant_id,
    t.name AS tenant_name,
    t.contact_email,
    t.status,
    t.created_at
FROM tenants t
WHERE t.tenant_id = @tenant_id;

-- 결제 방법 코드 추가 (중복 체크 포함)
INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
    is_deleted, version
)
SELECT 
    'PAYMENT_METHOD', 'CASH', '현금', '현금', '현금 결제',
    NULL,
    1, TRUE, @tenant_id, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = @tenant_id 
    AND code_group = 'PAYMENT_METHOD' 
    AND code_value = 'CASH'
    AND is_deleted = FALSE
);

INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
    is_deleted, version
)
SELECT 
    'PAYMENT_METHOD', 'CARD', '카드', '카드', '카드 결제',
    NULL,
    2, TRUE, @tenant_id, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = @tenant_id 
    AND code_group = 'PAYMENT_METHOD' 
    AND code_value = 'CARD'
    AND is_deleted = FALSE
);

INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
    is_deleted, version
)
SELECT 
    'PAYMENT_METHOD', 'TRANSFER', '계좌이체', '계좌이체', '계좌이체 결제',
    NULL,
    3, TRUE, @tenant_id, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = @tenant_id 
    AND code_group = 'PAYMENT_METHOD' 
    AND code_value = 'TRANSFER'
    AND is_deleted = FALSE
);

-- 추가된 결제 방법 코드 확인
SELECT 
    code_group,
    code_value,
    korean_name,
    code_label,
    sort_order,
    is_active,
    created_at
FROM common_codes
WHERE tenant_id = @tenant_id
AND code_group = 'PAYMENT_METHOD'
AND is_deleted = FALSE
ORDER BY sort_order;

SELECT CONCAT('✅ 결제 방법 코드 추가 완료: tenant_id=', @tenant_id) AS result;
