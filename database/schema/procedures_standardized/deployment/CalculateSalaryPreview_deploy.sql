-- =====================================================
-- 급여 미리보기 계산 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS CalculateSalaryPreview //

CREATE PROCEDURE CalculateSalaryPreview(
    IN p_consultant_id BIGINT,
    IN p_period_start DATE,
    IN p_period_end DATE,
    IN p_tenant_id VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_gross_salary DECIMAL(15,2),
    OUT p_net_salary DECIMAL(15,2),
    OUT p_tax_amount DECIMAL(15,2),
    OUT p_consultation_count INT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_salary_type VARCHAR(50);
    DECLARE v_base_salary DECIMAL(15,2) DEFAULT 0;
    DECLARE v_hourly_rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_is_business_registered BOOLEAN DEFAULT FALSE;
    DECLARE v_completed_consultations INT DEFAULT 0;
    DECLARE v_total_hours DECIMAL(8,2) DEFAULT 0;
    DECLARE v_consultation_earnings DECIMAL(15,2) DEFAULT 0;
    DECLARE v_hourly_earnings DECIMAL(15,2) DEFAULT 0;
    DECLARE v_grade_rate DECIMAL(10,2) DEFAULT 30000;
    DECLARE v_consultant_count INT DEFAULT 0;
    
    -- 세금 관련 변수
    DECLARE v_withholding_tax DECIMAL(5,4) DEFAULT 0.033;  -- 3.3% 원천징수
    DECLARE v_vat DECIMAL(5,4) DEFAULT 0.10;               -- 10% 부가세
    DECLARE v_income_tax_rate DECIMAL(5,4) DEFAULT 0;      -- 소득세율 (계산됨)
    DECLARE v_income_tax_amount DECIMAL(15,2) DEFAULT 0;   -- 소득세액
    
    -- 4대보험 관련 변수 (정규직)
    DECLARE v_pension_rate DECIMAL(5,4) DEFAULT 0.045;     -- 4.5% 국민연금
    DECLARE v_health_rate DECIMAL(5,4) DEFAULT 0.03545;    -- 3.545% 건강보험
    DECLARE v_longterm_rate DECIMAL(5,4) DEFAULT 0.00545;  -- 0.545% 장기요양
    DECLARE v_employment_rate DECIMAL(5,4) DEFAULT 0.009;  -- 0.9% 고용보험
    
    DECLARE v_withholding_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_vat_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_4insurance_amount DECIMAL(15,2) DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('급여 미리보기 계산 중 오류 발생: ', v_error_message);
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
        LEAVE;
    END IF;
    
    IF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '상담사 ID는 필수입니다.';
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
        LEAVE;
    END IF;
    
    IF p_period_start IS NULL OR p_period_end IS NULL OR p_period_start > p_period_end THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
        LEAVE;
    END IF;
    
    -- 2. 상담사 존재 여부 확인 (테넌트 격리)
    SELECT COUNT(*) INTO v_consultant_count
    FROM users
    WHERE id = p_consultant_id 
      AND tenant_id = p_tenant_id
      AND role = 'CONSULTANT'
      AND is_active = TRUE
      AND is_deleted = FALSE;
    
    IF v_consultant_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '상담사를 찾을 수 없습니다.';
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
        LEAVE;
    END IF;
    
    -- 기본값 설정
    SET p_success = TRUE;
    SET p_message = '급여 미리보기 계산이 완료되었습니다.';
    
    -- 3. 급여 프로필 정보 조회 (테넌트 격리)
    SELECT 
        csp.salary_type, csp.base_salary, csp.hourly_rate, csp.is_business_registered
    INTO v_salary_type, v_base_salary, v_hourly_rate, v_is_business_registered
    FROM consultant_salary_profiles csp
    WHERE csp.consultant_id = p_consultant_id 
      AND csp.tenant_id = p_tenant_id
      AND csp.is_active = TRUE
      AND csp.is_deleted = FALSE
    LIMIT 1;
    
    IF v_salary_type IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '활성화된 급여 프로필을 찾을 수 없습니다.';
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
        LEAVE;
    ELSE
        -- 4. 상담 통계 조회 (테넌트 격리)
        SELECT 
            SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_consultations,
            COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / 60.0), 0) as total_hours
        INTO v_completed_consultations, v_total_hours
        FROM schedules s
        WHERE s.consultant_id = p_consultant_id 
          AND s.tenant_id = p_tenant_id
          AND DATE(s.start_time) BETWEEN p_period_start AND p_period_end
          AND s.is_deleted = FALSE;
        
        SET p_consultation_count = v_completed_consultations;
        
        -- 5. 급여 계산
        IF v_salary_type = 'FREELANCE' THEN
            -- 프리랜서: 상담 건수 * 등급별 요율
            SET v_consultation_earnings = v_completed_consultations * v_grade_rate;
            SET p_gross_salary = v_consultation_earnings;
            SET v_hourly_earnings = 0;
        ELSEIF v_salary_type = 'REGULAR' THEN
            -- 정규직: 기본급 + 시간당 급여
            SET v_hourly_earnings = v_total_hours * COALESCE(v_hourly_rate, 0);
            SET p_gross_salary = v_base_salary + v_hourly_earnings;
            SET v_consultation_earnings = 0;
        ELSE
            -- 기타: 기본급만
            SET p_gross_salary = v_base_salary;
            SET v_hourly_earnings = 0;
            SET v_consultation_earnings = 0;
        END IF;
        
        -- 6. 세금 및 공제 계산
        SET p_tax_amount = 0;
        SET v_withholding_amount = 0;
        SET v_vat_amount = 0;
        SET v_income_tax_amount = 0;
        SET v_4insurance_amount = 0;
        
        IF v_salary_type = 'FREELANCE' THEN
            -- 프리랜서 세금 계산
            -- 1) 원천징수 3.3% (모든 프리랜서)
            SET v_withholding_amount = p_gross_salary * v_withholding_tax;
            SET p_tax_amount = p_tax_amount + v_withholding_amount;
            
            -- 2) 부가세 10% (사업자 등록 프리랜서만)
            IF v_is_business_registered = TRUE THEN
                SET v_vat_amount = p_gross_salary * v_vat;
                SET p_tax_amount = p_tax_amount + v_vat_amount;
            END IF;
            
        ELSEIF v_salary_type = 'REGULAR' THEN
            -- 정규직 세금 및 공제 계산
            -- 1) 소득세 (소득 구간별 차등 적용)
            SET v_income_tax_rate = CASE
                WHEN p_gross_salary <= 1200000 THEN 0.06      -- 6% (120만원 이하)
                WHEN p_gross_salary <= 4600000 THEN 0.15      -- 15% (120만원 초과 ~ 460만원)
                WHEN p_gross_salary <= 8800000 THEN 0.24      -- 24% (460만원 초과 ~ 880만원)
                WHEN p_gross_salary <= 15000000 THEN 0.35     -- 35% (880만원 초과 ~ 1500만원)
                WHEN p_gross_salary <= 30000000 THEN 0.38     -- 38% (1500만원 초과 ~ 3000만원)
                WHEN p_gross_salary <= 50000000 THEN 0.40     -- 40% (3000만원 초과 ~ 5000만원)
                ELSE 0.42                                     -- 42% (5000만원 초과)
            END;
            
            SET v_income_tax_amount = p_gross_salary * v_income_tax_rate;
            SET p_tax_amount = p_tax_amount + v_income_tax_amount;
            
            -- 2) 4대보험 (연봉 1,200만원 이상 시)
            IF p_gross_salary * 12 >= 12000000 THEN
                SET v_4insurance_amount = (p_gross_salary * v_pension_rate) + 
                                        (p_gross_salary * v_health_rate) + 
                                        (p_gross_salary * v_longterm_rate) + 
                                        (p_gross_salary * v_employment_rate);
                SET p_tax_amount = p_tax_amount + v_4insurance_amount;
            END IF;
        END IF;
        
        SET p_net_salary = p_gross_salary - p_tax_amount;
    END IF;
    
END //

DELIMITER ;

