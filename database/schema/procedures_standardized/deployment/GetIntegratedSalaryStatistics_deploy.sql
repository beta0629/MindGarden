-- =====================================================
-- 통합 급여 통계 조회 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetIntegratedSalaryStatistics //

CREATE PROCEDURE GetIntegratedSalaryStatistics(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_total_calculations INT,
    OUT p_total_gross_salary DECIMAL(15,2),
    OUT p_total_net_salary DECIMAL(15,2),
    OUT p_total_tax_amount DECIMAL(15,2),
    OUT p_average_salary DECIMAL(15,2),
    OUT p_erp_sync_success_rate DECIMAL(5,2)
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_total_erp_syncs INT DEFAULT 0;
    DECLARE v_successful_erp_syncs INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('급여 통계 조회 중 오류 발생: ', v_error_message);
        SET p_total_calculations = 0;
        SET p_total_gross_salary = 0;
        SET p_total_net_salary = 0;
        SET p_total_tax_amount = 0;
        SET p_average_salary = 0;
        SET p_erp_sync_success_rate = 0;
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_total_calculations = 0;
        SET p_total_gross_salary = 0;
        SET p_total_net_salary = 0;
        SET p_total_tax_amount = 0;
        SET p_average_salary = 0;
        SET p_erp_sync_success_rate = 0;
    ELSEIF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_total_calculations = 0;
        SET p_total_gross_salary = 0;
        SET p_total_net_salary = 0;
        SET p_total_tax_amount = 0;
        SET p_average_salary = 0;
        SET p_erp_sync_success_rate = 0;
    ELSE
            -- 2. 급여 통계 조회 (테넌트 격리)
        SELECT 
            COUNT(*),
            COALESCE(SUM(gross_salary), 0),
            COALESCE(SUM(net_salary), 0),
            COALESCE(SUM(deductions), 0),
            COALESCE(AVG(net_salary), 0)
        INTO p_total_calculations, p_total_gross_salary, p_total_net_salary, p_total_tax_amount, p_average_salary
        FROM salary_calculations 
        WHERE tenant_id = p_tenant_id
          AND calculation_period_start BETWEEN p_start_date AND p_end_date
          AND status IN ('CALCULATED', 'APPROVED', 'PAID')
          AND is_deleted = FALSE;
        
        -- 3. ERP 동기화 성공률 조회 (테넌트 격리)
        -- 주의: erp_sync_logs 테이블이 실제 DB에 존재하지 않을 수 있음
        -- 필요시 테이블 생성 마이그레이션 추가 필요
        -- SELECT 
        --     COUNT(*),
        --     SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)
        -- INTO v_total_erp_syncs, v_successful_erp_syncs
        -- FROM erp_sync_logs 
        -- WHERE tenant_id = p_tenant_id
        --   AND sync_type IN ('SALARY_CALCULATION', 'SALARY_APPROVAL', 'SALARY_PAYMENT')
        --   AND sync_date BETWEEN p_start_date AND p_end_date
        --   AND is_deleted = FALSE;
        
        -- 임시로 0으로 설정 (테이블이 생성되면 위 주석 해제)
        SET v_total_erp_syncs = 0;
        SET v_successful_erp_syncs = 0;
        
        IF v_total_erp_syncs > 0 THEN
            SET p_erp_sync_success_rate = ROUND((v_successful_erp_syncs / v_total_erp_syncs) * 100, 2);
        ELSE
            SET p_erp_sync_success_rate = 0;
        END IF;
        
        SET p_success = TRUE;
        SET p_message = '통합 급여 통계 조회가 완료되었습니다.';
    END IF;
    
END //

DELIMITER ;

