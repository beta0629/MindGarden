-- 급여관리 PL/SQL 프로시저 (기존 시스템 로직 기반)
-- 한글 인코딩 설정
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DELIMITER //

-- 상담사 급여 계산 프로시저 (기존 ConsultantSalaryProfile 기반)
CREATE PROCEDURE CalculateConsultantSalary(
    IN p_consultant_id BIGINT,
    IN p_period_start DATE,
    IN p_period_end DATE,
    OUT p_calculation_id BIGINT,
    OUT p_gross_salary DECIMAL(15,2),
    OUT p_net_salary DECIMAL(15,2),
    OUT p_tax_amount DECIMAL(15,2),
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
    DECLARE v_calculation_exists INT DEFAULT 0;
    DECLARE v_grade VARCHAR(20);
    DECLARE v_grade_rate DECIMAL(10,2) DEFAULT 0;
    
    -- 세금 관련 변수
    DECLARE v_withholding_tax DECIMAL(5,4) DEFAULT 0.033; -- 원천징수세 3.3%
    DECLARE v_local_tax DECIMAL(5,4) DEFAULT 0.0033; -- 지방소득세 0.33%
    DECLARE v_vat DECIMAL(5,4) DEFAULT 0.10; -- 부가가치세 10%
    DECLARE v_annual_threshold DECIMAL(15,2) DEFAULT 12000000; -- 4대보험 적용 기준 1,200만원
    
    -- 4대보험 변수
    DECLARE v_pension_rate DECIMAL(5,4) DEFAULT 0.045; -- 국민연금 4.5%
    DECLARE v_health_rate DECIMAL(5,4) DEFAULT 0.03545; -- 건강보험료 3.545%
    DECLARE v_longterm_rate DECIMAL(5,4) DEFAULT 0.00545; -- 장기요양보험료 0.545%
    DECLARE v_employment_rate DECIMAL(5,4) DEFAULT 0.009; -- 고용보험료 0.9%
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_calculation_id = NULL;
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
    END;
    
    -- 프로시저 시작
    SET p_success = TRUE;
    SET p_message = '상담사 급여 계산이 성공적으로 완료되었습니다.';
    
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
        -- 상담사 급여 프로필 정보 조회
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
        AND csp.is_active = TRUE
        AND csp.is_contract_active() = TRUE;
        
        -- 상담사 등급별 기본 상담료 조회 (공통 코드에서)
        SELECT CAST(JSON_EXTRACT(extra_data, '$.rate') AS DECIMAL(10,2))
        INTO v_grade_rate
        FROM common_codes 
        WHERE code_group = 'FREELANCE_BASE_RATE' 
        AND code_value = CONCAT(v_grade, '_RATE')
        AND is_active = TRUE;
        
        -- 등급별 기본 상담료가 없으면 기본값 사용
        IF v_grade_rate IS NULL OR v_grade_rate = 0 THEN
            SET v_grade_rate = 30000; -- 기본값
        END IF;
        
        -- 해당 기간 상담 통계 조회
        SELECT 
            COUNT(*) as total_consultations,
            SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_consultations,
            COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / 60.0), 0) as total_hours
        INTO v_total_consultations, v_completed_consultations, v_total_hours
        FROM schedules s
        WHERE s.consultant_id = p_consultant_id 
        AND DATE(s.start_time) BETWEEN p_period_start AND p_period_end
        AND s.is_deleted = FALSE;
        
        -- 급여 계산 (프리랜서 vs 정규직)
        IF v_salary_type = 'FREELANCE' THEN
            -- 프리랜서: 상담 완료 건수 기반
            SET v_consultation_earnings = v_completed_consultations * v_grade_rate;
            SET p_gross_salary = v_consultation_earnings;
        ELSEIF v_salary_type = 'REGULAR' THEN
            -- 정규직: 기본급 + 시간제 급여
            SET v_hourly_earnings = v_total_hours * v_hourly_rate;
            SET p_gross_salary = v_base_salary + v_hourly_earnings;
        ELSE
            -- 기타: 기본급만
            SET p_gross_salary = v_base_salary;
        END IF;
        
        -- 세금 계산
        SET p_tax_amount = 0;
        
        -- 원천징수세 + 지방소득세 (모든 경우)
        SET p_tax_amount = p_tax_amount + (p_gross_salary * v_withholding_tax);
        SET p_tax_amount = p_tax_amount + (p_gross_salary * v_local_tax);
        
        -- 사업자 등록 시 부가가치세 추가
        IF v_is_business_registered = TRUE THEN
            SET p_tax_amount = p_tax_amount + (p_gross_salary * v_vat);
        END IF;
        
        -- 4대보험 (연간 1,200만원 이상 시에만)
        -- TODO: 연간 급여 계산 로직 필요 (현재는 월간으로 간주)
        IF p_gross_salary * 12 >= v_annual_threshold THEN
            SET p_tax_amount = p_tax_amount + (p_gross_salary * v_pension_rate);
            SET p_tax_amount = p_tax_amount + (p_gross_salary * v_health_rate);
            SET p_tax_amount = p_tax_amount + (p_gross_salary * v_longterm_rate);
            SET p_tax_amount = p_tax_amount + (p_gross_salary * v_employment_rate);
        END IF;
        
        -- 순 급여 계산
        SET p_net_salary = p_gross_salary - p_tax_amount;
        
        -- 급여 계산 데이터 저장
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
    END IF;
    
END //

-- 급여 승인 프로시저
CREATE PROCEDURE ApproveSalaryCalculation(
    IN p_calculation_id BIGINT,
    IN p_approved_by VARCHAR(50),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
    END;
    
    SET p_success = TRUE;
    SET p_message = '급여 승인이 완료되었습니다.';
    
    UPDATE salary_calculations 
    SET status = 'APPROVED', 
        updated_at = NOW()
    WHERE id = p_calculation_id AND status = 'CALCULATED';
    
    IF ROW_COUNT() = 0 THEN
        SET p_message = '승인 가능한 급여 계산을 찾을 수 없습니다.';
        SET p_success = FALSE;
    END IF;
    
END //

-- 급여 지급 완료 프로시저
CREATE PROCEDURE MarkSalaryAsPaid(
    IN p_calculation_id BIGINT,
    IN p_paid_by VARCHAR(50),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
    END;
    
    SET p_success = TRUE;
    SET p_message = '급여 지급이 완료되었습니다.';
    
    UPDATE salary_calculations 
    SET status = 'PAID', 
        updated_at = NOW()
    WHERE id = p_calculation_id AND status = 'APPROVED';
    
    IF ROW_COUNT() = 0 THEN
        SET p_message = '지급 가능한 급여 계산을 찾을 수 없습니다.';
        SET p_success = FALSE;
    END IF;
    
END //

-- 급여 통계 조회 프로시저
CREATE PROCEDURE GetSalaryStatistics(
    IN p_branch_code VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_calculations INT,
    OUT p_total_gross_salary DECIMAL(15,2),
    OUT p_total_net_salary DECIMAL(15,2),
    OUT p_average_salary DECIMAL(15,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
    END;
    
    SET p_success = TRUE;
    SET p_message = '급여 통계 조회가 완료되었습니다.';
    
    SELECT 
        COUNT(*),
        COALESCE(SUM(gross_salary), 0),
        COALESCE(SUM(net_salary), 0),
        COALESCE(AVG(net_salary), 0)
    INTO p_total_calculations, p_total_gross_salary, p_total_net_salary, p_average_salary
    FROM salary_calculations 
    WHERE branch_code = p_branch_code 
    AND calculation_period_start BETWEEN p_start_date AND p_end_date
    AND status IN ('CALCULATED', 'APPROVED', 'PAID');
    
END //

-- 상위 성과자 조회 프로시저
CREATE PROCEDURE GetTopPerformers(
    IN p_branch_code VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- 오류 발생 시 빈 결과 반환
    END;
    
    SELECT 
        sc.consultant_id,
        u.name as consultant_name,
        u.branch_code,
        sc.completed_consultations,
        sc.total_hours_worked,
        sc.gross_salary,
        sc.net_salary,
        sc.status
    FROM salary_calculations sc
    JOIN users u ON sc.consultant_id = u.id
    WHERE sc.branch_code = p_branch_code 
    AND sc.calculation_period_start BETWEEN p_start_date AND p_end_date
    AND sc.status IN ('CALCULATED', 'APPROVED', 'PAID')
    ORDER BY sc.net_salary DESC, sc.completed_consultations DESC
    LIMIT p_limit;
    
END //

DELIMITER ;
