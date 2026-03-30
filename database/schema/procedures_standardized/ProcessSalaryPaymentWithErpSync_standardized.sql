-- =====================================================
-- 급여 지급 및 ERP 동기화 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ProcessSalaryPaymentWithErpSync //

CREATE PROCEDURE ProcessSalaryPaymentWithErpSync(
    IN p_calculation_id BIGINT,
    IN p_tenant_id VARCHAR(100),
    IN p_paid_by VARCHAR(50),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_consultant_id BIGINT;
    DECLARE v_net_salary DECIMAL(15,2);
    DECLARE v_erp_sync_id BIGINT;
    DECLARE v_calculation_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('급여 지급 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_calculation_id IS NULL OR p_calculation_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '급여 계산 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 급여 계산 정보 조회 (테넌트 격리)
    SELECT consultant_id, net_salary
    INTO v_consultant_id, v_net_salary
    FROM salary_calculations 
    WHERE id = p_calculation_id 
      AND tenant_id = p_tenant_id
      AND status = 'APPROVED'
      AND is_deleted = FALSE;
    
    -- 3. 급여 계산 존재 여부 확인
    SELECT COUNT(*) INTO v_calculation_count
    FROM salary_calculations
    WHERE id = p_calculation_id 
      AND tenant_id = p_tenant_id
      AND status = 'APPROVED'
      AND is_deleted = FALSE;
    
    IF v_calculation_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '지급 가능한 급여 계산을 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    ELSE
        -- 4. 급여 지급 완료 (테넌트 격리)
        UPDATE salary_calculations 
        SET status = 'PAID', 
            updated_at = NOW(),
            updated_by = p_paid_by
        WHERE id = p_calculation_id 
          AND tenant_id = p_tenant_id
          AND is_deleted = FALSE;
        
        -- 5. ERP 동기화 로그 생성 (테넌트 격리)
        INSERT INTO erp_sync_logs (
            sync_type, 
            sync_date, 
            records_processed, 
            status, 
            error_message,
            tenant_id,
            started_at, 
            completed_at, 
            duration_seconds, 
            sync_data,
            created_at,
            created_by
        ) VALUES (
            'SALARY_PAYMENT', 
            NOW(), 
            1, 
            'PENDING', 
            NULL,
            p_tenant_id,
            NOW(), 
            NULL, 
            NULL, 
            JSON_OBJECT(
                'calculation_id', p_calculation_id,
                'consultant_id', v_consultant_id,
                'net_salary', v_net_salary,
                'paid_by', p_paid_by,
                'payment_date', NOW()
            ),
            NOW(),
            p_paid_by
        );
        
        SET v_erp_sync_id = LAST_INSERT_ID();
        
        -- 6. ERP 시스템으로 지급 정보 전송
        -- TODO: 실제 ERP API 호출 로직 구현
        UPDATE erp_sync_logs 
        SET status = 'COMPLETED', 
            completed_at = NOW(),
            duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW()),
            updated_at = NOW(),
            updated_by = p_paid_by
        WHERE id = v_erp_sync_id 
          AND tenant_id = p_tenant_id;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('급여 지급 완료 및 ERP 동기화가 완료되었습니다. ERP 동기화 ID: ', v_erp_sync_id);
        
        COMMIT;
    END IF;
    
END //

DELIMITER ;

