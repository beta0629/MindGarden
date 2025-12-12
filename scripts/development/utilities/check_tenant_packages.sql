-- beta74@live.co.kr 테넌트의 패키지 데이터 확인

-- 1. 테넌트 정보 확인
SELECT 
    tenant_id,
    name AS tenant_name,
    contact_email,
    status,
    created_at
FROM tenants
WHERE LOWER(contact_email) = LOWER('beta74@live.co.kr')
AND is_deleted = FALSE;

-- 2. 테넌트 ID 변수 설정
SET @tenant_email = 'beta74@live.co.kr';
SET @tenant_id = (
    SELECT tenant_id 
    FROM tenants 
    WHERE LOWER(contact_email) = LOWER(@tenant_email)
    AND is_deleted = FALSE
    LIMIT 1
);

-- 3. 테넌트 ID 확인
SELECT @tenant_id AS tenant_id;

-- 4. 해당 테넌트의 CONSULTATION_PACKAGE 코드 조회
SELECT 
    id,
    tenant_id,
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    extra_data,
    sort_order,
    is_active,
    created_at,
    updated_at
FROM common_codes
WHERE tenant_id = @tenant_id
AND code_group = 'CONSULTATION_PACKAGE'
AND is_deleted = FALSE
ORDER BY sort_order;

-- 5. 패키지 개수 확인
SELECT 
    COUNT(*) AS total_packages,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) AS active_packages,
    COUNT(CASE WHEN code_value LIKE 'SINGLE_%' THEN 1 END) AS single_session_packages
FROM common_codes
WHERE tenant_id = @tenant_id
AND code_group = 'CONSULTATION_PACKAGE'
AND is_deleted = FALSE;

