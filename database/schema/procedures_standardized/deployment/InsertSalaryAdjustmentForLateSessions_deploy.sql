-- =====================================================
-- 지급완료 PRIMARY 기준 늦은 COMPLETED 회기 ADJUSTMENT INSERT
-- 정책: SALARY_LATE_NOTES_ADJUSTMENT_PLAN.md
-- - PAID PRIMARY 만 허용. PRIMARY 불변.
-- - delta = current COMPLETED − (PRIMARY.completed + SUM ADJUSTMENT.completed)
-- - FREELANCE: delta×요율, tax on adjustment만 (국세+지방 원천 + VAT if biz). local 10% 없음
-- - REGULAR: 증가 시간분 × hourly_rate 만 (base_salary 재지급 금지)
-- - special_support INSERT 금지, bonus/SS=0
-- - FREELANCE_BASE_RATE 없으면 거절 (30000 fallback 금지)
-- 배포: deployment/InsertSalaryAdjustmentForLateSessions_deploy.sql twin
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS InsertSalaryAdjustmentForLateSessions //

CREATE PROCEDURE InsertSalaryAdjustmentForLateSessions(
    IN p_calculation_id BIGINT,
    IN p_tenant_id VARCHAR(100),
    IN p_triggered_by VARCHAR(50),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_new_calculation_id BIGINT,
    OUT p_completed_delta INT,
    OUT p_gross_salary DECIMAL(15,2),
    OUT p_net_salary DECIMAL(15,2),
    OUT p_tax_amount DECIMAL(15,2)
)
proc_main: BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_consultant_id BIGINT;
    DECLARE v_status VARCHAR(20);
    DECLARE v_kind VARCHAR(20);
    DECLARE v_period_start DATE;
    DECLARE v_period_end DATE;
    DECLARE v_calculation_period VARCHAR(20);
    DECLARE v_fk_salary_profile_id BIGINT;
    DECLARE v_primary_completed INT DEFAULT 0;
    DECLARE v_adj_completed_sum INT DEFAULT 0;
    DECLARE v_current_completed INT DEFAULT 0;
    DECLARE v_delta INT DEFAULT 0;
    DECLARE v_primary_hours DECIMAL(8,2) DEFAULT 0;
    DECLARE v_adj_hours_sum DECIMAL(8,2) DEFAULT 0;
    DECLARE v_current_hours DECIMAL(8,2) DEFAULT 0;
    DECLARE v_delta_hours DECIMAL(8,2) DEFAULT 0;
    DECLARE v_total_consultations INT DEFAULT 0;
    DECLARE v_salary_profile_id BIGINT DEFAULT NULL;
    DECLARE v_salary_type VARCHAR(50);
    DECLARE v_base_salary DECIMAL(15,2) DEFAULT 0;
    DECLARE v_hourly_rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_is_business_registered BOOLEAN DEFAULT FALSE;
    DECLARE v_grade VARCHAR(20);
    DECLARE v_freelance_rate_code VARCHAR(50) DEFAULT NULL;
    DECLARE v_grade_rate DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_consultation_earnings DECIMAL(15,2) DEFAULT 0;
    DECLARE v_hourly_earnings DECIMAL(15,2) DEFAULT 0;
    DECLARE v_tax_base_gross DECIMAL(15,2) DEFAULT 0;
    DECLARE v_row_count INT DEFAULT 0;

    DECLARE v_national_rate DECIMAL(5,4);
    DECLARE v_local_wh_rate DECIMAL(5,4);
    DECLARE v_vat DECIMAL(5,4);
    DECLARE v_local_income_of_it DECIMAL(5,4);
    DECLARE v_income_tax_rate DECIMAL(5,4) DEFAULT 0;
    DECLARE v_income_tax_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_pension_rate DECIMAL(5,4);
    DECLARE v_health_rate DECIMAL(5,4);
    DECLARE v_longterm_rate DECIMAL(5,4);
    DECLARE v_employment_rate DECIMAL(5,4);
    DECLARE v_four_ins_annual_min DECIMAL(15,2);
    DECLARE v_it_max1 DECIMAL(15,2);
    DECLARE v_it_rate1 DECIMAL(5,4);
    DECLARE v_it_max2 DECIMAL(15,2);
    DECLARE v_it_rate2 DECIMAL(5,4);
    DECLARE v_it_max3 DECIMAL(15,2);
    DECLARE v_it_rate3 DECIMAL(5,4);
    DECLARE v_it_max4 DECIMAL(15,2);
    DECLARE v_it_rate4 DECIMAL(5,4);
    DECLARE v_it_max5 DECIMAL(15,2);
    DECLARE v_it_rate5 DECIMAL(5,4);
    DECLARE v_it_max6 DECIMAL(15,2);
    DECLARE v_it_rate6 DECIMAL(5,4);
    DECLARE v_it_rate7 DECIMAL(5,4);
    DECLARE v_national_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_local_wh_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_withholding_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_vat_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_local_income_tax DECIMAL(15,2) DEFAULT 0;
    DECLARE v_4insurance_amount DECIMAL(15,2) DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('추가 정산 생성 중 오류 발생: ', IFNULL(v_error_message, '알 수 없는 DB 오류'));
        SET p_new_calculation_id = NULL;
        SET p_completed_delta = 0;
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        ROLLBACK;
    END;

    SET p_success = FALSE;
    SET p_message = NULL;
    SET p_new_calculation_id = NULL;
    SET p_completed_delta = 0;
    SET p_gross_salary = 0;
    SET p_net_salary = 0;
    SET p_tax_amount = 0;

    START TRANSACTION;

    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_message = '테넌트 ID는 필수입니다.';
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    IF p_calculation_id IS NULL OR p_calculation_id <= 0 THEN
        SET p_message = '급여 계산 ID는 필수입니다.';
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    SELECT COUNT(*) INTO v_row_count
    FROM salary_calculations
    WHERE id = p_calculation_id
      AND tenant_id = p_tenant_id
      AND is_deleted = FALSE;

    IF v_row_count = 0 THEN
        SET p_message = '급여 계산을 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    SELECT consultant_id,
           status,
           IFNULL(calculation_kind, 'PRIMARY'),
           calculation_period_start,
           calculation_period_end,
           calculation_period,
           salary_profile_id,
           IFNULL(completed_consultations, 0),
           IFNULL(total_hours_worked, 0)
    INTO v_consultant_id,
         v_status,
         v_kind,
         v_period_start,
         v_period_end,
         v_calculation_period,
         v_fk_salary_profile_id,
         v_primary_completed,
         v_primary_hours
    FROM salary_calculations
    WHERE id = p_calculation_id
      AND tenant_id = p_tenant_id
      AND is_deleted = FALSE;

    IF v_kind <> 'PRIMARY' THEN
        SET p_message = '추가 정산은 지급완료 PRIMARY 급여에만 가능합니다.';
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    IF v_status <> 'PAID' THEN
        SET p_message = '추가 정산은 지급완료(PAID) 급여에만 가능합니다.';
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    SELECT IFNULL(SUM(IFNULL(completed_consultations, 0)), 0),
           IFNULL(SUM(IFNULL(total_hours_worked, 0)), 0)
    INTO v_adj_completed_sum, v_adj_hours_sum
    FROM salary_calculations
    WHERE parent_calculation_id = p_calculation_id
      AND tenant_id = p_tenant_id
      AND is_deleted = FALSE
      AND IFNULL(calculation_kind, 'PRIMARY') = 'ADJUSTMENT';

    SELECT
        COUNT(*) AS total_consultations,
        SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_consultations,
        COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / 60.0), 0) AS total_hours
    INTO v_total_consultations, v_current_completed, v_current_hours
    FROM schedules s
    WHERE s.consultant_id = v_consultant_id
      AND s.tenant_id = p_tenant_id
      AND s.date BETWEEN v_period_start AND v_period_end
      AND s.is_deleted = FALSE;

    SET v_current_completed = IFNULL(v_current_completed, 0);
    SET v_current_hours = IFNULL(v_current_hours, 0);
    SET v_delta = v_current_completed - (v_primary_completed + v_adj_completed_sum);
    SET v_delta_hours = v_current_hours - (v_primary_hours + v_adj_hours_sum);

    IF v_delta <= 0 THEN
        SET p_message = '추가 완료 회기가 없습니다';
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    SELECT csp.id, csp.salary_type, csp.base_salary, csp.hourly_rate, csp.is_business_registered, u.grade
    INTO v_salary_profile_id, v_salary_type, v_base_salary, v_hourly_rate, v_is_business_registered, v_grade
    FROM consultant_salary_profiles csp
    JOIN users u ON csp.consultant_id = u.id
    WHERE csp.consultant_id = v_consultant_id
      AND csp.tenant_id = p_tenant_id
      AND u.tenant_id = p_tenant_id
      AND csp.is_active = TRUE
      AND u.is_deleted = FALSE
    LIMIT 1;

    IF v_salary_profile_id IS NULL THEN
        SET p_message = '활성화된 급여 프로필을 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    IF v_salary_type = 'FREELANCE' THEN
        IF v_grade IS NULL OR TRIM(v_grade) = '' THEN
            SET p_message = 'FREELANCE_BASE_RATE 조회에 필요한 상담사 등급이 없습니다.';
            ROLLBACK;
            LEAVE proc_main;
        END IF;
        SET v_freelance_rate_code = CASE TRIM(v_grade)
            WHEN 'CONSULTANT_JUNIOR' THEN 'JUNIOR_RATE'
            WHEN 'CONSULTANT_SENIOR' THEN 'SENIOR_RATE'
            WHEN 'CONSULTANT_EXPERT' THEN 'EXPERT_RATE'
            WHEN 'CONSULTANT_MASTER' THEN 'MASTER_RATE'
            ELSE CONCAT(TRIM(v_grade), '_RATE')
        END;
        SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(10,2)) INTO v_grade_rate
        FROM common_codes cc
        WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
          AND cc.code_group = 'FREELANCE_BASE_RATE'
          AND cc.code_value = v_freelance_rate_code
          AND cc.is_active = TRUE
          AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
        ORDER BY cc.tenant_id IS NULL ASC
        LIMIT 1;
        IF v_grade_rate IS NULL OR v_grade_rate <= 0 THEN
            SET p_message = CONCAT(
                'FREELANCE_BASE_RATE(', v_freelance_rate_code,
                ')가 없어 추가 정산할 수 없습니다.');
            ROLLBACK;
            LEAVE proc_main;
        END IF;
        SET v_consultation_earnings = v_delta * v_grade_rate;
        SET p_gross_salary = v_consultation_earnings;
        SET v_hourly_earnings = 0;
        SET v_delta_hours = 0;
    ELSEIF v_salary_type = 'REGULAR' THEN
        IF v_delta_hours IS NULL OR v_delta_hours <= 0 THEN
            SET p_message = '정규직 추가 정산에 사용할 증가 근무시간이 없어 거절합니다.';
            ROLLBACK;
            LEAVE proc_main;
        END IF;
        IF v_hourly_rate IS NULL OR v_hourly_rate <= 0 THEN
            SET p_message = '정규직 시급이 없어 추가 정산할 수 없습니다.';
            ROLLBACK;
            LEAVE proc_main;
        END IF;
        SET v_hourly_earnings = v_delta_hours * v_hourly_rate;
        SET p_gross_salary = v_hourly_earnings;
        SET v_consultation_earnings = 0;
        SET v_base_salary = 0;
    ELSE
        SET p_message = CONCAT('지원하지 않는 급여 유형입니다: ', IFNULL(v_salary_type, 'NULL'));
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    -- SALARY_TAX_RATE SSOT (common_codes). NO DEFAULT rate literal. fail closed.
    SET v_national_rate = NULL;
    SET v_local_wh_rate = NULL;
    SET v_vat = NULL;
    SET v_local_income_of_it = NULL;
    SET v_pension_rate = NULL;
    SET v_health_rate = NULL;
    SET v_longterm_rate = NULL;
    SET v_employment_rate = NULL;
    SET v_four_ins_annual_min = NULL;
    SET v_it_max1 = NULL; SET v_it_rate1 = NULL;
    SET v_it_max2 = NULL; SET v_it_rate2 = NULL;
    SET v_it_max3 = NULL; SET v_it_rate3 = NULL;
    SET v_it_max4 = NULL; SET v_it_rate4 = NULL;
    SET v_it_max5 = NULL; SET v_it_rate5 = NULL;
    SET v_it_max6 = NULL; SET v_it_rate6 = NULL;
    SET v_it_rate7 = NULL;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4)) INTO v_national_rate
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'WITHHOLDING_NATIONAL'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4)) INTO v_local_wh_rate
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'WITHHOLDING_LOCAL'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4)) INTO v_vat
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'VAT'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4)) INTO v_local_income_of_it
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'LOCAL_INCOME_OF_INCOME_TAX'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4)) INTO v_pension_rate
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'PENSION'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4)) INTO v_health_rate
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'HEALTH'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4)) INTO v_longterm_rate
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'LONGTERM'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4)) INTO v_employment_rate
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'EMPLOYMENT'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.amount')) AS DECIMAL(15,2)) INTO v_four_ins_annual_min
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'FOUR_INSURANCE_ANNUAL_MIN'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.monthlyMax')) AS DECIMAL(15,2)),
           CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4))
      INTO v_it_max1, v_it_rate1
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'INCOME_TAX_BRACKET_1'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.monthlyMax')) AS DECIMAL(15,2)),
           CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4))
      INTO v_it_max2, v_it_rate2
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'INCOME_TAX_BRACKET_2'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.monthlyMax')) AS DECIMAL(15,2)),
           CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4))
      INTO v_it_max3, v_it_rate3
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'INCOME_TAX_BRACKET_3'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.monthlyMax')) AS DECIMAL(15,2)),
           CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4))
      INTO v_it_max4, v_it_rate4
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'INCOME_TAX_BRACKET_4'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.monthlyMax')) AS DECIMAL(15,2)),
           CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4))
      INTO v_it_max5, v_it_rate5
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'INCOME_TAX_BRACKET_5'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.monthlyMax')) AS DECIMAL(15,2)),
           CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4))
      INTO v_it_max6, v_it_rate6
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'INCOME_TAX_BRACKET_6'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;

    SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(cc.extra_data, '$.rate')) AS DECIMAL(5,4)) INTO v_it_rate7
    FROM common_codes cc
    WHERE (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
      AND cc.code_group = 'SALARY_TAX_RATE' AND cc.code_value = 'INCOME_TAX_BRACKET_7'
      AND cc.is_active = TRUE AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
    ORDER BY cc.tenant_id IS NULL ASC LIMIT 1;


    IF v_national_rate IS NULL OR v_local_wh_rate IS NULL OR v_vat IS NULL
       OR v_local_income_of_it IS NULL
       OR v_pension_rate IS NULL OR v_health_rate IS NULL
       OR v_longterm_rate IS NULL OR v_employment_rate IS NULL
       OR v_four_ins_annual_min IS NULL
       OR v_it_max1 IS NULL OR v_it_rate1 IS NULL
       OR v_it_max2 IS NULL OR v_it_rate2 IS NULL
       OR v_it_max3 IS NULL OR v_it_rate3 IS NULL
       OR v_it_max4 IS NULL OR v_it_rate4 IS NULL
       OR v_it_max5 IS NULL OR v_it_rate5 IS NULL
       OR v_it_max6 IS NULL OR v_it_rate6 IS NULL
       OR v_it_rate7 IS NULL THEN

        SET p_message = 'SALARY_TAX_RATE 공통코드(세율)가 없어 추가 정산할 수 없습니다.';
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    SET p_tax_amount = 0;
    SET v_withholding_amount = 0;
    SET v_vat_amount = 0;
    SET v_local_income_tax = 0;
    SET v_income_tax_amount = 0;
    SET v_4insurance_amount = 0;
    SET v_national_amount = 0;
    SET v_local_wh_amount = 0;

    IF v_salary_type = 'FREELANCE' THEN
        SET v_tax_base_gross = p_gross_salary;
        SET v_national_amount = v_tax_base_gross * v_national_rate;
        SET v_local_wh_amount = v_tax_base_gross * v_local_wh_rate;
        SET v_withholding_amount = v_national_amount + v_local_wh_amount;
        SET p_tax_amount = p_tax_amount + v_withholding_amount;
        IF v_is_business_registered = TRUE THEN
            SET v_vat_amount = v_tax_base_gross * v_vat;
            SET p_tax_amount = p_tax_amount + v_vat_amount;
        END IF;
    ELSEIF v_salary_type = 'REGULAR' THEN
        SET v_tax_base_gross = p_gross_salary;
        SET v_income_tax_rate = CASE
            WHEN p_gross_salary <= v_it_max1 THEN v_it_rate1
            WHEN p_gross_salary <= v_it_max2 THEN v_it_rate2
            WHEN p_gross_salary <= v_it_max3 THEN v_it_rate3
            WHEN p_gross_salary <= v_it_max4 THEN v_it_rate4
            WHEN p_gross_salary <= v_it_max5 THEN v_it_rate5
            WHEN p_gross_salary <= v_it_max6 THEN v_it_rate6
            ELSE v_it_rate7
        END;
        SET v_income_tax_amount = p_gross_salary * v_income_tax_rate;
        SET p_tax_amount = p_tax_amount + v_income_tax_amount;
        SET v_local_income_tax = ROUND(v_income_tax_amount * v_local_income_of_it, 0);
        SET p_tax_amount = p_tax_amount + v_local_income_tax;
        IF p_gross_salary * 12 >= v_four_ins_annual_min THEN
            SET v_4insurance_amount = (p_gross_salary * v_pension_rate)
                                    + (p_gross_salary * v_health_rate)
                                    + (p_gross_salary * v_longterm_rate)
                                    + (p_gross_salary * v_employment_rate);
            SET p_tax_amount = p_tax_amount + v_4insurance_amount;
        END IF;
    END IF;

    SET p_net_salary = p_gross_salary - p_tax_amount;

    INSERT INTO salary_calculations (
        consultant_id,
        salary_profile_id,
        calculation_period,
        calculation_period_start,
        calculation_period_end,
        base_salary,
        total_hours_worked,
        hourly_earnings,
        total_consultations,
        completed_consultations,
        commission_earnings,
        bonus_earnings,
        deductions,
        gross_salary,
        net_salary,
        total_salary,
        status,
        calculation_kind,
        parent_calculation_id,
        calculated_at,
        calculated_by,
        tenant_id,
        created_at,
        updated_at,
        version,
        is_deleted
    ) VALUES (
        v_consultant_id,
        v_fk_salary_profile_id,
        v_calculation_period,
        v_period_start,
        v_period_end,
        v_base_salary,
        IF(v_salary_type = 'REGULAR', v_delta_hours, 0),
        v_hourly_earnings,
        v_delta,
        v_delta,
        v_consultation_earnings,
        0,
        p_tax_amount,
        p_gross_salary,
        p_net_salary,
        p_gross_salary,
        'CALCULATED',
        'ADJUSTMENT',
        p_calculation_id,
        NOW(),
        p_triggered_by,
        p_tenant_id,
        NOW(),
        NOW(),
        0,
        FALSE
    );

    SET p_new_calculation_id = LAST_INSERT_ID();
    SET p_completed_delta = v_delta;

    IF v_national_amount > 0 THEN
        INSERT INTO salary_tax_calculations (
            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
        ) VALUES (
            p_tenant_id, p_new_calculation_id, 'WITHHOLDING_NATIONAL', '원천징수 국세', v_national_rate,
            v_tax_base_gross, v_tax_base_gross, v_national_amount,
            '추가정산 프리랜서 원천징수 국세', TRUE, NOW(), NOW()
        );
    END IF;
    IF v_local_wh_amount > 0 THEN
        INSERT INTO salary_tax_calculations (
            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
        ) VALUES (
            p_tenant_id, p_new_calculation_id, 'WITHHOLDING_LOCAL', '원천징수 지방세', v_local_wh_rate,
            v_tax_base_gross, v_tax_base_gross, v_local_wh_amount,
            '추가정산 프리랜서 원천징수 지방세', TRUE, NOW(), NOW()
        );
    END IF;
    IF v_vat_amount > 0 THEN
        INSERT INTO salary_tax_calculations (
            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
        ) VALUES (
            p_tenant_id, p_new_calculation_id, 'VAT', '부가세', v_vat,
            v_tax_base_gross, v_tax_base_gross, v_vat_amount, '추가정산 사업자 부가세 10%', TRUE, NOW(), NOW()
        );
    END IF;
    IF v_local_income_tax > 0 THEN
        INSERT INTO salary_tax_calculations (
            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
        ) VALUES (
            p_tenant_id, p_new_calculation_id, 'LOCAL_INCOME_TAX', '지방소득세', v_local_income_of_it,
            v_income_tax_amount, v_income_tax_amount, v_local_income_tax,
            '추가정산 정규직 지방소득세', TRUE, NOW(), NOW()
        );
    END IF;
    IF v_income_tax_amount > 0 THEN
        INSERT INTO salary_tax_calculations (
            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
        ) VALUES (
            p_tenant_id, p_new_calculation_id, 'INCOME_TAX', '소득세', v_income_tax_rate,
            v_tax_base_gross, v_tax_base_gross, v_income_tax_amount, '추가정산 정규직 소득세', TRUE, NOW(), NOW()
        );
    END IF;
    IF v_4insurance_amount > 0 THEN
        INSERT INTO salary_tax_calculations (
            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
        ) VALUES (
            p_tenant_id, p_new_calculation_id, 'FOUR_INSURANCE', '4대보험',
            (v_pension_rate + v_health_rate + v_longterm_rate + v_employment_rate),
            v_tax_base_gross, v_tax_base_gross, v_4insurance_amount,
            '추가정산 4대보험', TRUE, NOW(), NOW()
        );
    END IF;

    SET p_success = TRUE;
    SET p_message = '빠진 회기 추가 정산이 생성되었습니다.';
    COMMIT;

END //

DELIMITER ;
