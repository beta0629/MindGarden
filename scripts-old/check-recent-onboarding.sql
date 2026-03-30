-- 최근 온보딩 요청 및 결제 수단 확인 스크립트
-- 사용법: mysql -u root -p < database_name < scripts/check-recent-onboarding.sql

-- 1. 최근 온보딩 요청 조회 (최근 5개)
SELECT 
    id,
    tenant_id,
    tenant_name,
    requested_by,
    status,
    risk_level,
    business_type,
    created_at,
    decision_at,
    decision_note
FROM onboarding_request
WHERE is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 5;

-- 2. 최근 결제 수단 조회 (최근 5개)
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
LIMIT 5;

-- 3. PENDING 상태인 온보딩 요청 (승인 대기 중)
SELECT 
    id,
    tenant_name,
    requested_by,
    status,
    created_at,
    checklist_json
FROM onboarding_request
WHERE status = 'PENDING'
  AND is_deleted = FALSE
ORDER BY created_at DESC;

-- 4. 결제 수단은 있지만 온보딩 요청이 PENDING인 경우
SELECT 
    or_req.id as onboarding_id,
    or_req.tenant_name,
    or_req.requested_by,
    or_req.status,
    or_req.created_at as request_created,
    pm.payment_method_id,
    pm.card_last4,
    pm.created_at as payment_created
FROM onboarding_request or_req
LEFT JOIN ops_payment_method pm ON JSON_EXTRACT(or_req.checklist_json, '$.paymentMethodId') = pm.payment_method_id
WHERE or_req.status = 'PENDING'
  AND or_req.is_deleted = FALSE
  AND pm.payment_method_id IS NOT NULL
ORDER BY or_req.created_at DESC;

