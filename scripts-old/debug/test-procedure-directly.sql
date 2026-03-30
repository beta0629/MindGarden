-- 프로시저 직접 테스트
SET @p_request_id = 28;
SET @p_tenant_id = 'tenant-unknown-consultation-001';
SET @p_tenant_name = '테스트 CONSULTATION 1763902144467';
SET @p_business_type = 'CONSULTATION';
SET @p_approved_by = 'superadmin@mindgarden.com';
SET @p_decision_note = '직접 테스트';
SET @p_success = FALSE;
SET @p_message = '';

CALL ProcessOnboardingApproval(
    @p_request_id,
    @p_tenant_id,
    @p_tenant_name,
    @p_business_type,
    @p_approved_by,
    @p_decision_note,
    @p_success,
    @p_message
);

SELECT @p_success AS success, @p_message AS message;

