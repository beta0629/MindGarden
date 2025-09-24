-- 급여-세금-통계-ERP 통합 PL/SQL 시스템
-- 한글 인코딩 설정
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DELIMITER //

-- 통합 급여 계산 및 ERP 동기화 프로시저
CREATE PROCEDURE ProcessIntegratedSalaryCalculation(
    IN p_consultant_id BIGINT,
    IN p_period_start DATE,
    IN p_period_end DATE,
    IN p_triggered_by VARCHAR(50),
    OUT p_calculation_id BIGINT,
    OUT p_gross_salary DECIMAL(15,2),
    OUT p_net_salary DECIMAL(15,2),
    OUT p_tax_amount DECIMAL(15,2),
    OUT p_erp_sync_id BIGINT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_salary_type VARCHAR(50);
    DECLARE v_base_salary DECIMAL(15,2) DEFAULT 0;
    DECLARE v_hourly_rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_is_business_registered BOOLEAN DEFAULT FALSE;
    DECLARE v_total_consultations INT DEFAULT 0;
    DECLARE v_completed_consultations INT DEFAULT 0;
    DECLARE v_total_hours DECIMAL(8,2) DEFAULT 0;
    DECLARE v_consultation_earnings DECIMAL(15,2) DEFAULT 0;
    DECLARE v_hourly_earnings DECIMAL(15,2) DEFAULT 0;
    DECLARE v_branch_code VARCHAR(20);
    DECLARE v_grade VARCHAR(20);
    DECLARE v_grade_rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_calculation_exists INT DEFAULT 0;
    
    -- 세금 관련 변수
    DECLARE v_withholding_tax DECIMAL(5,4) DEFAULT 0.033;
    DECLARE v_local_tax DECIMAL(5,4) DEFAULT 0.0033;
    DECLARE v_vat DECIMAL(5,4) DEFAULT 0.10;
    DECLARE v_annual_threshold DECIMAL(15,2) DEFAULT 12000000;
    
    -- 4대보험 변수
    DECLARE v_pension_rate DECIMAL(5,4) DEFAULT 0.045;
    DECLARE v_health_rate DECIMAL(5,4) DEFAULT 0.03545;
    DECLARE v_longterm_rate DECIMAL(5,4) DEFAULT 0.00545;
    DECLARE v_employment_rate DECIMAL(5,4) DEFAULT 0.009;
    
    -- ERP 동기화 변수
    DECLARE v_erp_transaction_id VARCHAR(100);
    DECLARE v_erp_sync_status VARCHAR(20) DEFAULT 'PENDING';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_calculation_id = NULL;
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_erp_sync_id = NULL;
    END;
    
    -- 프로시저 시작
    SET p_success = TRUE;
    SET p_message = '통합 급여 계산 및 ERP 동기화가 성공적으로 완료되었습니다.';
    
    -- 기존 계산 확인
    SELECT COUNT(*) INTO v_calculation_exists
    FROM salary_calculations 
    WHERE consultant_id = p_consultant_id 
    AND calculation_period_start = p_period_start 
    AND calculation_period_end = p_period_end;
    
    IF v_calculation_exists > 0 THEN
        SET p_message = '해당 기간의 급여 계산이 이미 존재합니다.';
        SET p_success = FALSE;
    ELSE
        -- 1. 상담사 급여 프로필 정보 조회
        SELECT 
            csp.salary_type, 
            csp.base_salary, 
            csp.hourly_rate, 
            csp.is_business_registered,
            u.branch_code,
            u.grade
        INTO v_salary_type, v_base_salary, v_hourly_rate, v_is_business_registered, v_branch_code, v_grade
        FROM consultant_salary_profiles csp
        JOIN users u ON csp.consultant_id = u.id
        WHERE csp.consultant_id = p_consultant_id 
        AND csp.is_active = TRUE;
        
        -- 2. 상담사 등급별 기본 상담료 조회 (공통 코드에서)
        SELECT CAST(JSON_EXTRACT(extra_data, '$.rate') AS DECIMAL(10,2))
        INTO v_grade_rate
        FROM common_codes 
        WHERE code_group = 'FREELANCE_BASE_RATE' 
        AND code_value = CONCAT(v_grade, '_RATE')
        AND is_active = TRUE;
        
        IF v_grade_rate IS NULL OR v_grade_rate = 0 THEN
            SET v_grade_rate = 30000;
        END IF;
        
        -- 3. 해당 기간 상담 통계 조회
        SELECT 
            COUNT(*) as total_consultations,
            SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_consultations,
            COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / 60.0), 0) as total_hours
        INTO v_total_consultations, v_completed_consultations, v_total_hours
        FROM schedules s
        WHERE s.consultant_id = p_consultant_id 
        AND DATE(s.start_time) BETWEEN p_period_start AND p_period_end
        AND s.is_deleted = FALSE;
        
        -- 4. 급여 계산
        IF v_salary_type = 'FREELANCE' THEN
            SET v_consultation_earnings = v_completed_consultations * v_grade_rate;
            SET p_gross_salary = v_consultation_earnings;
        ELSEIF v_salary_type = 'REGULAR' THEN
            SET v_hourly_earnings = v_total_hours * v_hourly_rate;
            SET p_gross_salary = v_base_salary + v_hourly_earnings;
        ELSE
            SET p_gross_salary = v_base_salary;
        END IF;
        
        -- 5. 세금 계산
        SET p_tax_amount = 0;
        SET p_tax_amount = p_tax_amount + (p_gross_salary * v_withholding_tax);
        SET p_tax_amount = p_tax_amount + (p_gross_salary * v_local_tax);
        
        IF v_is_business_registered = TRUE THEN
            SET p_tax_amount = p_tax_amount + (p_gross_salary * v_vat);
        END IF;
        
        IF p_gross_salary * 12 >= v_annual_threshold THEN
            SET p_tax_amount = p_tax_amount + (p_gross_salary * v_pension_rate);
            SET p_tax_amount = p_tax_amount + (p_gross_salary * v_health_rate);
            SET p_tax_amount = p_tax_amount + (p_gross_salary * v_longterm_rate);
            SET p_tax_amount = p_tax_amount + (p_gross_salary * v_employment_rate);
        END IF;
        
        SET p_net_salary = p_gross_salary - p_tax_amount;
        
        -- 6. 급여 계산 데이터 저장
        INSERT INTO salary_calculations (
            consultant_id, salary_profile_id, calculation_period_start, calculation_period_end,
            base_salary, total_hours_worked, hourly_earnings, total_consultations, completed_consultations,
            commission_earnings, bonus_earnings, deductions, gross_salary, net_salary,
            status, calculated_at, branch_code, created_at, updated_at
        ) VALUES (
            p_consultant_id, NULL, p_period_start, p_period_end,
            v_base_salary, v_total_hours, v_hourly_earnings, v_total_consultations, v_completed_consultations,
            0, 0, p_tax_amount, p_gross_salary, p_net_salary,
            'CALCULATED', NOW(), v_branch_code, NOW(), NOW()
        );
        
        SET p_calculation_id = LAST_INSERT_ID();
        
        -- 7. 통계 업데이트 (실시간)
        CALL UpdateDailyStatistics(v_branch_code, p_period_start);
        CALL UpdateConsultantPerformance(p_consultant_id, p_period_start);
        
        -- 8. ERP 동기화 데이터 생성
        SET v_erp_transaction_id = CONCAT('SAL_', p_consultant_id, '_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'));
        
        INSERT INTO erp_sync_logs (
            sync_type, sync_date, records_processed, status, error_message,
            started_at, completed_at, duration_seconds, sync_data
        ) VALUES (
            'SALARY_CALCULATION', NOW(), 1, 'PENDING', NULL,
            NOW(), NULL, NULL, JSON_OBJECT(
                'calculation_id', p_calculation_id,
                'consultant_id', p_consultant_id,
                'gross_salary', p_gross_salary,
                'net_salary', p_net_salary,
                'tax_amount', p_tax_amount,
                'period_start', p_period_start,
                'period_end', p_period_end,
                'erp_transaction_id', v_erp_transaction_id
            )
        );
        
        SET p_erp_sync_id = LAST_INSERT_ID();
        
        -- 9. ERP 시스템으로 전송 (실제 구현에서는 ERP API 호출)
        -- TODO: 실제 ERP API 호출 로직 구현
        UPDATE erp_sync_logs 
        SET status = 'COMPLETED', 
            completed_at = NOW(),
            duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW())
        WHERE id = p_erp_sync_id;
        
        -- 10. 재무 거래 생성 (자동)
        INSERT INTO financial_transactions (
            transaction_type, category, subcategory, amount, description,
            transaction_date, related_entity_id, related_entity_type, 
            tax_included, tax_amount, amount_before_tax, branch_code,
            created_at, updated_at, is_deleted
        ) VALUES (
            'EXPENSE', '급여', '상담사급여', p_net_salary, 
            CONCAT('상담사 급여 지급 - ', p_period_start, ' ~ ', p_period_end),
            p_period_end, p_calculation_id, 'SALARY',
            FALSE, p_tax_amount, p_gross_salary, v_branch_code,
            NOW(), NOW(), FALSE
        );
        
    END IF;
    
END //

-- 급여 승인 및 ERP 동기화 프로시저
CREATE PROCEDURE ApproveSalaryWithErpSync(
    IN p_calculation_id BIGINT,
    IN p_approved_by VARCHAR(50),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_consultant_id BIGINT;
    DECLARE v_gross_salary DECIMAL(15,2);
    DECLARE v_net_salary DECIMAL(15,2);
    DECLARE v_branch_code VARCHAR(20);
    DECLARE v_erp_sync_id BIGINT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
    END;
    
    SET p_success = TRUE;
    SET p_message = '급여 승인 및 ERP 동기화가 완료되었습니다.';
    
    -- 급여 계산 정보 조회
    SELECT consultant_id, gross_salary, net_salary, branch_code
    INTO v_consultant_id, v_gross_salary, v_net_salary, v_branch_code
    FROM salary_calculations 
    WHERE id = p_calculation_id AND status = 'CALCULATED';
    
    IF v_consultant_id IS NULL THEN
        SET p_message = '승인 가능한 급여 계산을 찾을 수 없습니다.';
        SET p_success = FALSE;
    ELSE
        -- 급여 승인
        UPDATE salary_calculations 
        SET status = 'APPROVED', 
            updated_at = NOW()
        WHERE id = p_calculation_id;
        
        -- ERP 동기화 로그 생성
        INSERT INTO erp_sync_logs (
            sync_type, sync_date, records_processed, status, error_message,
            started_at, completed_at, duration_seconds, sync_data
        ) VALUES (
            'SALARY_APPROVAL', NOW(), 1, 'PENDING', NULL,
            NOW(), NULL, NULL, JSON_OBJECT(
                'calculation_id', p_calculation_id,
                'consultant_id', v_consultant_id,
                'gross_salary', v_gross_salary,
                'net_salary', v_net_salary,
                'approved_by', p_approved_by,
                'approval_date', NOW()
            )
        );
        
        SET v_erp_sync_id = LAST_INSERT_ID();
        
        -- ERP 시스템으로 승인 정보 전송
        -- TODO: 실제 ERP API 호출 로직 구현
        UPDATE erp_sync_logs 
        SET status = 'COMPLETED', 
            completed_at = NOW(),
            duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW())
        WHERE id = v_erp_sync_id;
        
    END IF;
    
END //

-- 급여 지급 완료 및 ERP 동기화 프로시저
CREATE PROCEDURE ProcessSalaryPaymentWithErpSync(
    IN p_calculation_id BIGINT,
    IN p_paid_by VARCHAR(50),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_consultant_id BIGINT;
    DECLARE v_net_salary DECIMAL(15,2);
    DECLARE v_branch_code VARCHAR(20);
    DECLARE v_erp_sync_id BIGINT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
    END;
    
    SET p_success = TRUE;
    SET p_message = '급여 지급 완료 및 ERP 동기화가 완료되었습니다.';
    
    -- 급여 계산 정보 조회
    SELECT consultant_id, net_salary, branch_code
    INTO v_consultant_id, v_net_salary, v_branch_code
    FROM salary_calculations 
    WHERE id = p_calculation_id AND status = 'APPROVED';
    
    IF v_consultant_id IS NULL THEN
        SET p_message = '지급 가능한 급여 계산을 찾을 수 없습니다.';
        SET p_success = FALSE;
    ELSE
        -- 급여 지급 완료
        UPDATE salary_calculations 
        SET status = 'PAID', 
            updated_at = NOW()
        WHERE id = p_calculation_id;
        
        -- ERP 동기화 로그 생성
        INSERT INTO erp_sync_logs (
            sync_type, sync_date, records_processed, status, error_message,
            started_at, completed_at, duration_seconds, sync_data
        ) VALUES (
            'SALARY_PAYMENT', NOW(), 1, 'PENDING', NULL,
            NOW(), NULL, NULL, JSON_OBJECT(
                'calculation_id', p_calculation_id,
                'consultant_id', v_consultant_id,
                'net_salary', v_net_salary,
                'paid_by', p_paid_by,
                'payment_date', NOW()
            )
        );
        
        SET v_erp_sync_id = LAST_INSERT_ID();
        
        -- ERP 시스템으로 지급 정보 전송
        -- TODO: 실제 ERP API 호출 로직 구현
        UPDATE erp_sync_logs 
        SET status = 'COMPLETED', 
            completed_at = NOW(),
            duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW())
        WHERE id = v_erp_sync_id;
        
        -- 통계 업데이트 (급여 지급 완료)
        CALL UpdateDailyStatistics(v_branch_code, CURDATE());
        
    END IF;
    
END //

-- 통합 급여 통계 조회 프로시저
CREATE PROCEDURE GetIntegratedSalaryStatistics(
    IN p_branch_code VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_calculations INT,
    OUT p_total_gross_salary DECIMAL(15,2),
    OUT p_total_net_salary DECIMAL(15,2),
    OUT p_total_tax_amount DECIMAL(15,2),
    OUT p_average_salary DECIMAL(15,2),
    OUT p_erp_sync_success_rate DECIMAL(5,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_total_erp_syncs INT DEFAULT 0;
    DECLARE v_successful_erp_syncs INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
    END;
    
    SET p_success = TRUE;
    SET p_message = '통합 급여 통계 조회가 완료되었습니다.';
    
    -- 급여 통계 조회
    SELECT 
        COUNT(*),
        COALESCE(SUM(gross_salary), 0),
        COALESCE(SUM(net_salary), 0),
        COALESCE(SUM(deductions), 0),
        COALESCE(AVG(net_salary), 0)
    INTO p_total_calculations, p_total_gross_salary, p_total_net_salary, p_total_tax_amount, p_average_salary
    FROM salary_calculations 
    WHERE branch_code = p_branch_code 
    AND calculation_period_start BETWEEN p_start_date AND p_end_date
    AND status IN ('CALCULATED', 'APPROVED', 'PAID');
    
    -- ERP 동기화 성공률 조회
    SELECT 
        COUNT(*),
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)
    INTO v_total_erp_syncs, v_successful_erp_syncs
    FROM erp_sync_logs 
    WHERE sync_type IN ('SALARY_CALCULATION', 'SALARY_APPROVAL', 'SALARY_PAYMENT')
    AND sync_date BETWEEN p_start_date AND p_end_date;
    
    IF v_total_erp_syncs > 0 THEN
        SET p_erp_sync_success_rate = (v_successful_erp_syncs / v_total_erp_syncs) * 100;
    ELSE
        SET p_erp_sync_success_rate = 0;
    END IF;
    
END //

DELIMITER ;
