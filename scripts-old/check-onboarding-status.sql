-- 온보딩 요청 및 결제 수단 확인 스크립트
-- 사용법: mysql -u root -p < database_name > scripts/check-onboarding-status.sql

-- 1. 최근 온보딩 요청 조회 (최근 10개)
SELECT 
    id,
    tenant_id,
    tenant_name,
    requested_by,
    status,
    risk_level,
    business_type,
    created_at,
    updated_at
FROM onboarding_request
WHERE is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 10;

-- 2. 최근 결제 수단 조회 (최근 10개)
SELECT 
    id,
    payment_method_id,
    tenant_id,
    pg_provider,
    card_brand,
    card_last4,
    card_exp_month,
    card_exp_year,
    is_default,
    is_active,
    created_at
FROM ops_payment_method
WHERE is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 10;

-- 3. 특정 이메일로 온보딩 요청 조회
-- SELECT * FROM onboarding_request 
-- WHERE requested_by = 'your-email@example.com' 
-- AND is_deleted = FALSE
-- ORDER BY created_at DESC;

-- 4. 온보딩 요청 상태별 개수
SELECT 
    status,
    COUNT(*) as count
FROM onboarding_request
WHERE is_deleted = FALSE
GROUP BY status;

-- 5. 결제 수단이 있지만 온보딩 요청이 없는 경우 확인
SELECT 
    pm.payment_method_id,
    pm.tenant_id,
    pm.created_at as payment_method_created,
    pm.pg_provider,
    pm.card_last4
FROM ops_payment_method pm
LEFT JOIN onboarding_request or_req ON JSON_EXTRACT(or_req.checklist_json, '$.paymentMethodId') = pm.payment_method_id
WHERE pm.is_deleted = FALSE
  AND pm.is_active = TRUE
  AND or_req.id IS NULL
ORDER BY pm.created_at DESC;

