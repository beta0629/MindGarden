-- =====================================================
-- 월별 급여 일괄 처리 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ProcessMonthlySalaryBatch //

CREATE PROCEDURE ProcessMonthlySalaryBatch(
    IN p_target_month VARCHAR(7), -- 'YYYY-MM' 형식
    IN p_tenant_id VARCHAR(100),
    IN p_processed_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_processed_count INT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_period_start DATE;
    DECLARE v_period_end DATE;
    DECLARE v_base_day_str VARCHAR(20) DEFAULT NULL;
    DECLARE v_year INT DEFAULT NULL;
    DECLARE v_month INT DEFAULT NULL;
    DECLARE v_calculation_id BIGINT;
    DECLARE v_gross_salary DECIMAL(15,2);
    DECLARE v_net_salary DECIMAL(15,2);
    DECLARE v_tax_amount DECIMAL(15,2);
    DECLARE v_erp_sync_id BIGINT;
    DECLARE v_calc_success BOOLEAN;
    DECLARE v_calc_message TEXT;
    
    DECLARE consultant_cursor CURSOR FOR
        SELECT u.id FROM users u 
        JOIN consultant_salary_profiles csp ON u.id = csp.consultant_id
        WHERE u.role = 'CONSULTANT' 
          AND u.tenant_id = p_tenant_id
          AND csp.tenant_id = p_tenant_id
          AND u.is_active = TRUE 
          AND u.is_deleted = FALSE
          AND csp.is_active = TRUE
          AND csp.is_deleted = FALSE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('월별 급여 일괄 처리 중 오류 발생: ', v_error_message);
        SET p_processed_count = 0;
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_processed_count = 0;
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_target_month IS NULL OR p_target_month = '' THEN
        SET p_success = FALSE;
        SET p_message = '대상 월은 필수입니다. (YYYY-MM 형식)';
        SET p_processed_count = 0;
        ROLLBACK;
        LEAVE;
    END IF;
    
    SET p_processed_count = 0;
    SET p_success = TRUE;
    SET p_message = '월별 급여 일괄 처리가 완료되었습니다.';
    
    -- 2. 기간 설정 (기산일 기준: common_codes SALARY_BASE_DATE.MONTHLY_BASE_DAY)
    SET v_year = CAST(SUBSTRING(p_target_month, 1, 4) AS UNSIGNED);
    SET v_month = CAST(SUBSTRING(p_target_month, 6, 2) AS UNSIGNED);
    SELECT JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.default_day')) INTO v_base_day_str
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_BASE_DATE'
      AND cc.code_value = 'MONTHLY_BASE_DAY'
      AND cc.is_active = TRUE
      AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC
    LIMIT 1;
    IF v_base_day_str = 'LAST_DAY' OR v_base_day_str IS NULL OR v_base_day_str = '' THEN
        SET v_period_start = STR_TO_DATE(CONCAT(p_target_month, '-01'), '%Y-%m-%d');
        SET v_period_end = LAST_DAY(v_period_start);
    ELSE
        SET v_period_end = STR_TO_DATE(CONCAT(p_target_month, '-', LEAST(CAST(v_base_day_str AS UNSIGNED), DAY(LAST_DAY(STR_TO_DATE(CONCAT(p_target_month, '-01'), '%Y-%m-%d')))), '%Y-%m-%d');
        IF v_month = 1 THEN
            SET v_period_start = DATE_ADD(STR_TO_DATE(CONCAT(v_year - 1, '-12-', LEAST(CAST(v_base_day_str AS UNSIGNED), 31)), '%Y-%m-%d'), INTERVAL 1 DAY);
        ELSE
            SET v_period_start = DATE_ADD(STR_TO_DATE(CONCAT(v_year, '-', LPAD(v_month - 1, 2, '0'), '-', LEAST(CAST(v_base_day_str AS UNSIGNED), DAY(LAST_DAY(STR_TO_DATE(CONCAT(v_year, '-', LPAD(v_month - 1, 2, '0'), '-01'), '%Y-%m-%d'))))), '%Y-%m-%d'), INTERVAL 1 DAY);
        END IF;
    END IF;
    
    -- 3. 상담사별 급여 계산 및 저장
    OPEN consultant_cursor;
    
    consultant_loop: LOOP
        FETCH consultant_cursor INTO v_consultant_id;
        IF done THEN
            LEAVE consultant_loop;
        END IF;
        
        -- 급여 계산 프로시저 호출 (테넌트 격리)
        CALL ProcessIntegratedSalaryCalculation(
            v_consultant_id,
            v_period_start,
            v_period_end,
            p_tenant_id,
            p_processed_by,
            v_calculation_id,
            v_gross_salary,
            v_net_salary,
            v_tax_amount,
            v_erp_sync_id,
            v_calc_success,
            v_calc_message
        );
        
        IF v_calc_success = TRUE THEN
            SET p_processed_count = p_processed_count + 1;
        END IF;
    END LOOP;
    
    CLOSE consultant_cursor;
    
    SET p_message = CONCAT('월별 급여 일괄 처리 완료. 처리된 상담사 수: ', p_processed_count);
    
    COMMIT;
    
END //

DELIMITER ;

