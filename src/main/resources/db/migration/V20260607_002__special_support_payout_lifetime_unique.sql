-- =============================================================================
-- 특별지원금 (special_support_monthly_payouts) — mapping 당 평생 1회 정책 P0 핫픽스
--   (2026-06-01, P0 hotfix — 다른 월에 이미 지급된 mapping 이 재카운트되어 중복 지급 위험)
--
-- 배경:
--   • 운영 https://mindgarden.core-solution.co.kr/admin/erp/salary 의 특별지원금
--     미리보기·확정에서, 4월에 이미 지급된 mapping 이 5월 후보에 다시 잡히는
--     결함이 발견됨.
--   • 운영 실측 (2026-05-31, 5월 미리보기):
--       - 조재은 (consultant_id=22): mapping 36(김남현, 4월 지급) + mapping 89 = ₩20,000
--         기대값 ₩10,000 (mapping 36 은 4월 지급되어 제외되어야 함)
--       - 김선희 (consultant_id=3) : mapping 32(김민선, 4월 지급) + mapping 75 + mapping 88 = ₩30,000
--         기대값 ₩20,000
--   • 근본 원인:
--     - `CalculateSalaryPreview` / `ProcessIntegratedSalaryCalculation` 프로시저의
--       `special_support_monthly_payouts sp` LEFT JOIN 조건이
--         `AND sp.salary_year_month = DATE_FORMAT(p_period_start, '%Y-%m')`
--       을 포함 → 현재 미리보기 월(YYYY-MM)만 검사하여 다른 월의 sp row 가 있어도
--       `sp.id IS NULL` 로 판단되어 mapping 재인정.
--     - UNIQUE 키 `uk_ss_payout_tenant_consultant_mapping_ym`
--       (tenant_id, consultant_id, mapping_id, salary_year_month) 는 같은 mapping
--       의 4월 row + 5월 row 를 별개 INSERT 로 허용 → DB 가드도 부재.
--   • 사용자 정책 확정 (옵션 A):
--     **mapping 당 평생 1회만 지급**. 동일 mapping 이 어느 월에라도 지급되었으면
--     이후 월 재지급 X. 새 mapping (재구매·다른 내담자) 은 별도 지급 OK.
--
-- 정책:
--   • UNIQUE 키를 `(tenant_id, consultant_id, mapping_id)` 로 변경 (salary_year_month 제거).
--   • 두 프로시저의 `LEFT JOIN sp ... AND sp.salary_year_month = ...` 행 3곳 삭제
--     (CalculateSalaryPreview SELECT 1곳, ProcessIntegratedSalaryCalculation SELECT/INSERT 2곳).
--   • INSERT 본문의 `salary_year_month` 컬럼 값은 그대로 보존 — 어느 월에 지급되었는지
--     감사 기록 유지 (집계·리포트용).
--   • 멀티테넌트 가드: UNIQUE 키에 `tenant_id` 포함 유지, 모든 SELECT/INSERT 에 tenant_id 격리 유지.
--
-- SSOT 동기:
--   • 동일 3-line 수정을 `database/schema/procedures_standardized/` 의 두 표준 본문
--     (`CalculateSalaryPreview_standardized.sql`, `ProcessIntegratedSalaryCalculation_standardized.sql`)
--     에도 함께 반영. 운영 배포 워크플로
--     (`.github/workflows/deploy-procedures-production-mysql.yml` 또는
--      `database/schema/procedures_standardized/deploy_standardized_procedures.sh`) 는
--     표준 본문을 적용하므로 일치 필수.
--   • 본 마이그의 프로시저 본문은 직전 V20260511_002 본문에서 3행만 제거한 형태.
--
-- 멱등성:
--   • 기존 UNIQUE 키 존재 시에만 DROP (이미 새 키가 적용된 환경에서 NO-OP).
--   • 새 UNIQUE 키 미존재 시에만 ADD.
--   • 데이터 정합성: ALTER ADD UNIQUE 실패 방지를 위해, 같은 (tenant_id, consultant_id, mapping_id)
--     으로 중복 row 가 존재하면 MIN(id) 외 행을 삭제 (감사 보존: 가장 오래된 = 첫 지급 row 보존).
--     운영 5월 확정 전 적용을 전제 (대부분 NO-OP).
--   • 프로시저는 DROP IF EXISTS + CREATE 로 항상 최신 본문 반영.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. (방어) 동일 (tenant_id, consultant_id, mapping_id) 중복 row 정리 — MIN(id) 보존
--    핫픽스 적용 시점이 4월 → 5월 사이라 운영에는 보통 dup 미존재. 안전상 멱등 정리.
-- -----------------------------------------------------------------------------
DELETE sp FROM special_support_monthly_payouts sp
INNER JOIN (
    SELECT tenant_id, consultant_id, mapping_id, MIN(id) AS keep_id
    FROM special_support_monthly_payouts
    GROUP BY tenant_id, consultant_id, mapping_id
    HAVING COUNT(*) > 1
) dup
   ON dup.tenant_id     = sp.tenant_id
  AND dup.consultant_id = sp.consultant_id
  AND dup.mapping_id    = sp.mapping_id
WHERE sp.id <> dup.keep_id;

-- -----------------------------------------------------------------------------
-- 2. 기존 UNIQUE 키 DROP (멱등) — uk_ss_payout_tenant_consultant_mapping_ym
-- -----------------------------------------------------------------------------
SET @dbname = (SELECT DATABASE());

SET @drop_old_uk = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'special_support_monthly_payouts'
         AND INDEX_NAME   = 'uk_ss_payout_tenant_consultant_mapping_ym') > 0,
    'ALTER TABLE special_support_monthly_payouts DROP INDEX uk_ss_payout_tenant_consultant_mapping_ym',
    'SELECT ''uk_ss_payout_tenant_consultant_mapping_ym already absent — no drop'' AS info'
));
PREPARE st1 FROM @drop_old_uk;
EXECUTE st1;
DEALLOCATE PREPARE st1;

-- -----------------------------------------------------------------------------
-- 3. 신규 UNIQUE 키 ADD (멱등) — uk_ss_payout_tenant_consultant_mapping
--    mapping 당 평생 1회 정책 강제 (tenant_id 멀티테넌트 격리 포함)
-- -----------------------------------------------------------------------------
SET @add_new_uk = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'special_support_monthly_payouts'
         AND INDEX_NAME   = 'uk_ss_payout_tenant_consultant_mapping') = 0,
    'ALTER TABLE special_support_monthly_payouts ADD UNIQUE KEY uk_ss_payout_tenant_consultant_mapping (tenant_id, consultant_id, mapping_id)',
    'SELECT ''uk_ss_payout_tenant_consultant_mapping already present — no add'' AS info'
));
PREPARE st2 FROM @add_new_uk;
EXECUTE st2;
DEALLOCATE PREPARE st2;


-- =====================================================
-- 급여 미리보기 계산 프로시저 (P0 hotfix V20260607_002)
--   변경점: LEFT JOIN sp 조건에서 `AND sp.salary_year_month = DATE_FORMAT(p_period_start, '%Y-%m')` 제거
--   (mapping 당 평생 1회 정책 — 어느 월에라도 지급되었으면 다시 후보로 잡지 않음)
-- JDBC CallableStatement 위치 = information_schema.PARAMETERS.ORDINAL_POSITION
--   1–4 IN: consultant_id, period_start, period_end, tenant_id
--   5–11 OUT: success, message, gross_salary, net_salary, tax_amount, consultation_count, special_support_amount
-- =====================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS CalculateSalaryPreview $$

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
    OUT p_consultation_count INT,
    OUT p_special_support_amount DECIMAL(15,2)
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
    DECLARE v_grade VARCHAR(20) DEFAULT NULL;
    DECLARE v_freelance_rate_code VARCHAR(50) DEFAULT NULL;
    DECLARE v_grade_rate DECIMAL(10,2) DEFAULT 30000;
    DECLARE v_consultant_count INT DEFAULT 0;
    DECLARE v_ss_extra_json TEXT;
    DECLARE v_ss_unit_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_ss_min_sessions INT DEFAULT 10;
    DECLARE v_ss_total DECIMAL(15,2) DEFAULT 0;
    DECLARE v_require_paid BOOLEAN DEFAULT TRUE;
    DECLARE v_paid_flag_txt VARCHAR(32);

    -- 세금 관련 변수
    DECLARE v_withholding_tax DECIMAL(5,4) DEFAULT 0.033;  -- 3.3% 원천징수
    DECLARE v_vat DECIMAL(5,4) DEFAULT 0.10;               -- 10% 부가세
    DECLARE v_income_tax_rate DECIMAL(5,4) DEFAULT 0;
    DECLARE v_income_tax_amount DECIMAL(15,2) DEFAULT 0;

    -- 4대보험 관련 변수 (정규직)
    DECLARE v_pension_rate DECIMAL(5,4) DEFAULT 0.045;
    DECLARE v_health_rate DECIMAL(5,4) DEFAULT 0.03545;
    DECLARE v_longterm_rate DECIMAL(5,4) DEFAULT 0.00545;
    DECLARE v_employment_rate DECIMAL(5,4) DEFAULT 0.009;

    DECLARE v_withholding_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_vat_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_4insurance_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_freelance_taxable DECIMAL(15,2) DEFAULT 0;

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
        SET p_special_support_amount = 0;
    END;

    main: BEGIN

    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
        SET p_special_support_amount = 0;
        LEAVE main;
    END IF;

    IF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '상담사 ID는 필수입니다.';
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
        SET p_special_support_amount = 0;
        LEAVE main;
    END IF;

    IF p_period_start IS NULL OR p_period_end IS NULL OR p_period_start > p_period_end THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
        SET p_special_support_amount = 0;
        LEAVE main;
    END IF;

    -- 2. 상담사 존재 여부 확인 (테넌트 격리)
    SELECT COUNT(*) INTO v_consultant_count
    FROM users
    WHERE id = p_consultant_id
      AND tenant_id = p_tenant_id
      AND role IN ('CONSULTANT', 'PLAY_THERAPIST', 'SPEECH_THERAPIST')
      AND is_active = TRUE
      AND is_deleted = FALSE;

    IF v_consultant_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '상담사를 찾을 수 없습니다.';
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
        SET p_special_support_amount = 0;
        LEAVE main;
    END IF;

    SET p_success = TRUE;
    SET p_message = '급여 미리보기 계산이 완료되었습니다.';

    -- 3. 급여 프로필 정보 및 상담사 등급 조회 (테넌트 격리)
    SELECT
        csp.salary_type, csp.base_salary, csp.hourly_rate, csp.is_business_registered,
        u.grade
    INTO v_salary_type, v_base_salary, v_hourly_rate, v_is_business_registered, v_grade
    FROM consultant_salary_profiles csp
    JOIN users u ON csp.consultant_id = u.id AND u.tenant_id = p_tenant_id AND u.is_deleted = FALSE
    WHERE csp.consultant_id = p_consultant_id
      AND csp.tenant_id = p_tenant_id
      AND csp.is_active = TRUE
    LIMIT 1;

    -- 프리랜서 등급별 요율: common_codes FREELANCE_BASE_RATE
    IF v_salary_type = 'FREELANCE' AND v_grade IS NOT NULL AND v_grade != '' THEN
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
            SET v_grade_rate = 30000;
        END IF;
    ELSEIF v_salary_type = 'FREELANCE' THEN
        SET v_grade_rate = 30000;
    END IF;

    IF v_salary_type IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '활성화된 급여 프로필을 찾을 수 없습니다.';
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
        SET p_special_support_amount = 0;
        LEAVE main;
    ELSE
        -- 4. 상담 통계 조회 (테넌트 격리)
        SELECT
            SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_consultations,
            COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / 60.0), 0) as total_hours
        INTO v_completed_consultations, v_total_hours
        FROM schedules s
        WHERE s.consultant_id = p_consultant_id
          AND s.tenant_id = p_tenant_id
          AND s.date BETWEEN p_period_start AND p_period_end
          AND s.is_deleted = FALSE;

        SET p_consultation_count = v_completed_consultations;

        -- 5. 급여 계산
        IF v_salary_type = 'FREELANCE' THEN
            SET v_consultation_earnings = v_completed_consultations * v_grade_rate;
            SET p_gross_salary = v_consultation_earnings;
            SET v_hourly_earnings = 0;
        ELSEIF v_salary_type = 'REGULAR' THEN
            SET v_hourly_earnings = v_total_hours * COALESCE(v_hourly_rate, 0);
            SET p_gross_salary = v_base_salary + v_hourly_earnings;
            SET v_consultation_earnings = 0;
        ELSE
            SET p_gross_salary = v_base_salary;
            SET v_hourly_earnings = 0;
            SET v_consultation_earnings = 0;
        END IF;

        -- 6. 특별지원금 산출 (세금 전; 프리랜서는 상담료+특별지원 합계에 원천징수·부가세 적용)
        SET v_ss_total = 0;
        SET p_special_support_amount = 0;
        SELECT cc.extra_data INTO v_ss_extra_json
        FROM common_codes cc
        WHERE cc.code_group = 'SPECIAL_SUPPORT_SALARY'
          AND cc.code_value = 'DEFAULT'
          AND cc.is_active = TRUE
          AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
          AND (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
        ORDER BY cc.tenant_id IS NULL ASC
        LIMIT 1;

        IF v_ss_extra_json IS NOT NULL AND v_ss_extra_json <> '' THEN
            SET v_ss_unit_amount = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_ss_extra_json, '$.amount')) AS DECIMAL(15,2));
            SET v_ss_min_sessions = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_ss_extra_json, '$.minSessions')) AS UNSIGNED);
            IF v_ss_min_sessions IS NULL OR v_ss_min_sessions <= 0 THEN
                SET v_ss_min_sessions = 10;
            END IF;
            SET v_paid_flag_txt = LOWER(IFNULL(JSON_UNQUOTE(JSON_EXTRACT(v_ss_extra_json, '$.requirePaidConfirmation')), 'true'));
            IF v_paid_flag_txt IN ('0', 'false', 'no') THEN
                SET v_require_paid = FALSE;
            ELSE
                SET v_require_paid = TRUE;
            END IF;
        ELSE
            SET v_ss_unit_amount = 0;
        END IF;

        IF v_ss_unit_amount IS NOT NULL AND v_ss_unit_amount > 0 THEN
            -- P0 hotfix V20260607_002: salary_year_month 조건 제거 (mapping 당 평생 1회 정책)
            SELECT COALESCE(SUM(
                CASE
                    WHEN sp.id IS NOT NULL THEN 0
                    WHEN m.total_sessions < v_ss_min_sessions THEN 0
                    WHEN v_require_paid = TRUE AND m.payment_status NOT IN ('CONFIRMED', 'PAY', 'DEP', 'APPROVED') THEN 0
                    ELSE v_ss_unit_amount
                END
            ), 0) INTO v_ss_total
            FROM consultant_client_mappings m
            LEFT JOIN special_support_monthly_payouts sp
              ON sp.tenant_id = p_tenant_id
             AND sp.consultant_id = p_consultant_id
             AND sp.mapping_id = m.id
            WHERE m.tenant_id = p_tenant_id
              AND m.consultant_id = p_consultant_id
              AND m.is_deleted = FALSE;
        END IF;
        SET p_special_support_amount = IFNULL(v_ss_total, 0);

        -- 7. 세금 및 공제 계산
        SET p_tax_amount = 0;
        SET v_withholding_amount = 0;
        SET v_vat_amount = 0;
        SET v_income_tax_amount = 0;
        SET v_4insurance_amount = 0;

        IF v_salary_type = 'FREELANCE' THEN
            SET v_freelance_taxable = p_gross_salary + IFNULL(v_ss_total, 0);
            SET v_withholding_amount = v_freelance_taxable * v_withholding_tax;
            SET p_tax_amount = p_tax_amount + v_withholding_amount;

            IF v_is_business_registered = TRUE THEN
                SET v_vat_amount = v_freelance_taxable * v_vat;
                SET p_tax_amount = p_tax_amount + v_vat_amount;
            END IF;

        ELSEIF v_salary_type = 'REGULAR' THEN
            SET v_income_tax_rate = CASE
                WHEN p_gross_salary <= 1200000 THEN 0.06
                WHEN p_gross_salary <= 4600000 THEN 0.15
                WHEN p_gross_salary <= 8800000 THEN 0.24
                WHEN p_gross_salary <= 15000000 THEN 0.35
                WHEN p_gross_salary <= 30000000 THEN 0.38
                WHEN p_gross_salary <= 50000000 THEN 0.40
                ELSE 0.42
            END;

            SET v_income_tax_amount = p_gross_salary * v_income_tax_rate;
            SET p_tax_amount = p_tax_amount + v_income_tax_amount;

            IF p_gross_salary * 12 >= 12000000 THEN
                SET v_4insurance_amount = (p_gross_salary * v_pension_rate) +
                                        (p_gross_salary * v_health_rate) +
                                        (p_gross_salary * v_longterm_rate) +
                                        (p_gross_salary * v_employment_rate);
                SET p_tax_amount = p_tax_amount + v_4insurance_amount;
            END IF;
        END IF;

        -- 실지급액 = 상담료 + 특별지원금 - 세금·공제 (총 급여 OUT p_gross_salary 는 상담료만 유지)
        SET p_net_salary = p_gross_salary + IFNULL(v_ss_total, 0) - p_tax_amount;
    END IF;

    END main;

END$$

DELIMITER ;


-- =====================================================
-- 통합 급여 계산 프로시저 (P0 hotfix V20260607_002)
--   변경점: LEFT JOIN sp 조건에서 `AND sp.salary_year_month = DATE_FORMAT(p_period_start, '%Y-%m')` 제거
--   (SELECT 1곳 + INSERT 1곳 — mapping 당 평생 1회 정책)
-- 표준 시그니처 5 IN + 8 OUT (특별지원금 OUT 포함).
-- 배포: `.github/workflows/deploy-procedures-production-mysql.yml` 또는
--       `database/schema/procedures_standardized/deploy_standardized_procedures.sh` 로 동일 본문 적용.
-- schedules 기간: 상담 일자는 date(DATE); start_time/end_time은 TIME(6)만 저장 → 기간은 s.date BETWEEN ...
-- =====================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS ProcessIntegratedSalaryCalculation $$

CREATE PROCEDURE ProcessIntegratedSalaryCalculation(
    IN p_consultant_id BIGINT,
    IN p_period_start DATE,
    IN p_period_end DATE,
    IN p_tenant_id VARCHAR(100),
    IN p_triggered_by VARCHAR(50),
    OUT p_calculation_id BIGINT,
    OUT p_gross_salary DECIMAL(15,2),
    OUT p_net_salary DECIMAL(15,2),
    OUT p_tax_amount DECIMAL(15,2),
    OUT p_erp_sync_id BIGINT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_special_support_amount DECIMAL(15,2)
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_salary_profile_id BIGINT DEFAULT NULL;
    DECLARE v_salary_type VARCHAR(50);
    DECLARE v_base_salary DECIMAL(15,2) DEFAULT 0;
    DECLARE v_hourly_rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_is_business_registered BOOLEAN DEFAULT FALSE;
    DECLARE v_total_consultations INT DEFAULT 0;
    DECLARE v_completed_consultations INT DEFAULT 0;
    DECLARE v_total_hours DECIMAL(8,2) DEFAULT 0;
    DECLARE v_consultation_earnings DECIMAL(15,2) DEFAULT 0;
    DECLARE v_hourly_earnings DECIMAL(15,2) DEFAULT 0;
    DECLARE v_grade VARCHAR(20);
    DECLARE v_freelance_rate_code VARCHAR(50) DEFAULT NULL;
    DECLARE v_grade_rate DECIMAL(10,2) DEFAULT 30000;
    DECLARE v_calculation_exists INT DEFAULT 0;
    DECLARE v_calculation_period VARCHAR(20);
    DECLARE v_consultant_count INT DEFAULT 0;
    DECLARE v_tax_base_gross DECIMAL(15,2) DEFAULT 0;
    DECLARE v_ss_extra_json TEXT;
    DECLARE v_ss_unit_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_ss_min_sessions INT DEFAULT 10;
    DECLARE v_ss_total DECIMAL(15,2) DEFAULT 0;
    DECLARE v_require_paid BOOLEAN DEFAULT TRUE;
    DECLARE v_paid_flag_txt VARCHAR(32);

    -- 세금 관련 변수
    DECLARE v_withholding_tax DECIMAL(5,4) DEFAULT 0.033;
    DECLARE v_vat DECIMAL(5,4) DEFAULT 0.10;
    DECLARE v_income_tax_rate DECIMAL(5,4) DEFAULT 0;
    DECLARE v_income_tax_amount DECIMAL(15,2) DEFAULT 0;

    -- 4대보험 관련 변수 (정규직)
    DECLARE v_pension_rate DECIMAL(5,4) DEFAULT 0.045;
    DECLARE v_health_rate DECIMAL(5,4) DEFAULT 0.03545;
    DECLARE v_longterm_rate DECIMAL(5,4) DEFAULT 0.00545;
    DECLARE v_employment_rate DECIMAL(5,4) DEFAULT 0.009;

    DECLARE v_withholding_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_vat_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_local_income_tax DECIMAL(15,2) DEFAULT 0;
    DECLARE v_4insurance_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_freelance_taxable DECIMAL(15,2) DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('급여 계산 중 오류 발생: ', v_error_message);
        SET p_calculation_id = NULL;
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_erp_sync_id = NULL;
        SET p_special_support_amount = 0;
    END;

    START TRANSACTION;

    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_calculation_id = NULL;
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_erp_sync_id = NULL;
        SET p_special_support_amount = 0;
        ROLLBACK;
    ELSEIF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '상담사 ID는 필수입니다.';
        SET p_calculation_id = NULL;
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_erp_sync_id = NULL;
        SET p_special_support_amount = 0;
        ROLLBACK;
    ELSEIF p_period_start IS NULL OR p_period_end IS NULL OR p_period_start > p_period_end THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_calculation_id = NULL;
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_erp_sync_id = NULL;
        SET p_special_support_amount = 0;
        ROLLBACK;
    ELSE
        -- 2. 상담사 존재 여부 확인 (테넌트 격리)
        SELECT COUNT(*) INTO v_consultant_count
        FROM users
        WHERE id = p_consultant_id
          AND tenant_id = p_tenant_id
          AND role IN ('CONSULTANT', 'PLAY_THERAPIST', 'SPEECH_THERAPIST')
          AND is_active = TRUE
          AND is_deleted = FALSE;

        IF v_consultant_count = 0 THEN
            SET p_success = FALSE;
            SET p_message = '상담사를 찾을 수 없습니다.';
            SET p_calculation_id = NULL;
            SET p_gross_salary = 0;
            SET p_net_salary = 0;
            SET p_tax_amount = 0;
            SET p_erp_sync_id = NULL;
            SET p_special_support_amount = 0;
            ROLLBACK;
        ELSE
            SET p_success = TRUE;
            SET p_message = '급여 계산이 완료되었습니다.';
            SET v_calculation_period = CONCAT(YEAR(p_period_start), '-', LPAD(MONTH(p_period_start), 2, '0'));

            -- 3. 기존 계산 확인 (테넌트 격리)
            SELECT COUNT(*) INTO v_calculation_exists
            FROM salary_calculations
            WHERE consultant_id = p_consultant_id
              AND tenant_id = p_tenant_id
              AND calculation_period = v_calculation_period
              AND is_deleted = FALSE;

            IF v_calculation_exists > 0 THEN
                SET p_success = FALSE;
                SET p_message = CONCAT(
                    '동일 상담사·동일 월(', v_calculation_period,
                    ')에 급여 확정이 이미 있습니다. 중복 확정은 불가합니다.');
                SET p_calculation_id = NULL;
                SET p_gross_salary = 0;
                SET p_net_salary = 0;
                SET p_tax_amount = 0;
                SET p_erp_sync_id = NULL;
                SET p_special_support_amount = 0;
                ROLLBACK;
            ELSE
                -- 4. 급여 프로필 및 사용자 정보 조회 (테넌트 격리)
                SELECT
                    csp.id, csp.salary_type, csp.base_salary, csp.hourly_rate, csp.is_business_registered,
                    u.grade
                INTO v_salary_profile_id, v_salary_type, v_base_salary, v_hourly_rate, v_is_business_registered, v_grade
                FROM consultant_salary_profiles csp
                JOIN users u ON csp.consultant_id = u.id
                WHERE csp.consultant_id = p_consultant_id
                  AND csp.tenant_id = p_tenant_id
                  AND u.tenant_id = p_tenant_id
                  AND csp.is_active = TRUE
                  AND u.is_deleted = FALSE
                LIMIT 1;

                IF v_salary_profile_id IS NULL THEN
                    SET p_success = FALSE;
                    SET p_message = '활성화된 급여 프로필을 찾을 수 없습니다.';
                    SET p_calculation_id = NULL;
                    SET p_gross_salary = 0;
                    SET p_net_salary = 0;
                    SET p_tax_amount = 0;
                    SET p_erp_sync_id = NULL;
                    SET p_special_support_amount = 0;
                    ROLLBACK;
                ELSE
                    -- 프리랜서 등급별 요율: FREELANCE_BASE_RATE
                    IF v_salary_type = 'FREELANCE' AND v_grade IS NOT NULL AND v_grade != '' THEN
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
                            SET v_grade_rate = 30000;
                        END IF;
                    ELSEIF v_salary_type = 'FREELANCE' THEN
                        SET v_grade_rate = 30000;
                    END IF;
                    -- 5. 상담 통계 조회 (테넌트 격리)
                    SELECT
                        COUNT(*) as total_consultations,
                        SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_consultations,
                        COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / 60.0), 0) as total_hours
                    INTO v_total_consultations, v_completed_consultations, v_total_hours
                    FROM schedules s
                    WHERE s.consultant_id = p_consultant_id
                      AND s.tenant_id = p_tenant_id
                      AND s.date BETWEEN p_period_start AND p_period_end
                      AND s.is_deleted = FALSE;

                    -- 6. 급여 계산
                    IF v_salary_type = 'FREELANCE' THEN
                        SET v_consultation_earnings = v_completed_consultations * v_grade_rate;
                        SET p_gross_salary = v_consultation_earnings;
                        SET v_hourly_earnings = 0;
                    ELSEIF v_salary_type = 'REGULAR' THEN
                        SET v_hourly_earnings = v_total_hours * COALESCE(v_hourly_rate, 0);
                        SET p_gross_salary = v_base_salary + v_hourly_earnings;
                        SET v_consultation_earnings = 0;
                    ELSE
                        SET p_gross_salary = v_base_salary;
                        SET v_hourly_earnings = 0;
                        SET v_consultation_earnings = 0;
                    END IF;

                    -- 6b. 특별지원금 산출 (세금 전; 프리랜서 과세표준에 합산)
                    SET v_ss_total = 0;
                    SET p_special_support_amount = 0;
                    SELECT cc.extra_data INTO v_ss_extra_json
                    FROM common_codes cc
                    WHERE cc.code_group = 'SPECIAL_SUPPORT_SALARY'
                      AND cc.code_value = 'DEFAULT'
                      AND cc.is_active = TRUE
                      AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
                      AND (cc.tenant_id = p_tenant_id OR cc.tenant_id IS NULL)
                    ORDER BY cc.tenant_id IS NULL ASC
                    LIMIT 1;

                    IF v_ss_extra_json IS NOT NULL AND v_ss_extra_json <> '' THEN
                        SET v_ss_unit_amount = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_ss_extra_json, '$.amount')) AS DECIMAL(15,2));
                        SET v_ss_min_sessions = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_ss_extra_json, '$.minSessions')) AS UNSIGNED);
                        IF v_ss_min_sessions IS NULL OR v_ss_min_sessions <= 0 THEN
                            SET v_ss_min_sessions = 10;
                        END IF;
                        SET v_paid_flag_txt = LOWER(IFNULL(JSON_UNQUOTE(JSON_EXTRACT(v_ss_extra_json, '$.requirePaidConfirmation')), 'true'));
                        IF v_paid_flag_txt IN ('0', 'false', 'no') THEN
                            SET v_require_paid = FALSE;
                        ELSE
                            SET v_require_paid = TRUE;
                        END IF;
                    ELSE
                        SET v_ss_unit_amount = 0;
                    END IF;

                    IF v_ss_unit_amount IS NOT NULL AND v_ss_unit_amount > 0 THEN
                        -- P0 hotfix V20260607_002: salary_year_month 조건 제거 (mapping 당 평생 1회 정책)
                        SELECT COALESCE(SUM(
                            CASE
                                WHEN sp.id IS NOT NULL THEN 0
                                WHEN m.total_sessions < v_ss_min_sessions THEN 0
                                WHEN v_require_paid = TRUE AND m.payment_status NOT IN ('CONFIRMED', 'PAY', 'DEP', 'APPROVED') THEN 0
                                ELSE v_ss_unit_amount
                            END
                        ), 0) INTO v_ss_total
                        FROM consultant_client_mappings m
                        LEFT JOIN special_support_monthly_payouts sp
                          ON sp.tenant_id = p_tenant_id
                         AND sp.consultant_id = p_consultant_id
                         AND sp.mapping_id = m.id
                        WHERE m.tenant_id = p_tenant_id
                          AND m.consultant_id = p_consultant_id
                          AND m.is_deleted = FALSE;
                    END IF;
                    SET p_special_support_amount = IFNULL(v_ss_total, 0);

                    -- 7. 세금 및 공제 계산
                    SET p_tax_amount = 0;
                    SET v_withholding_amount = 0;
                    SET v_vat_amount = 0;
                    SET v_local_income_tax = 0;
                    SET v_income_tax_amount = 0;
                    SET v_4insurance_amount = 0;

                    IF v_salary_type = 'FREELANCE' THEN
                        SET v_freelance_taxable = p_gross_salary + IFNULL(v_ss_total, 0);
                        SET v_withholding_amount = v_freelance_taxable * v_withholding_tax;
                        SET p_tax_amount = p_tax_amount + v_withholding_amount;
                        -- 지방소득세: 원천징수의 10%
                        SET v_local_income_tax = ROUND(v_withholding_amount * 0.10, 0);
                        SET p_tax_amount = p_tax_amount + v_local_income_tax;

                        IF v_is_business_registered = TRUE THEN
                            SET v_vat_amount = v_freelance_taxable * v_vat;
                            SET p_tax_amount = p_tax_amount + v_vat_amount;
                        END IF;

                    ELSEIF v_salary_type = 'REGULAR' THEN
                        SET v_income_tax_rate = CASE
                            WHEN p_gross_salary <= 1200000 THEN 0.06
                            WHEN p_gross_salary <= 4600000 THEN 0.15
                            WHEN p_gross_salary <= 8800000 THEN 0.24
                            WHEN p_gross_salary <= 15000000 THEN 0.35
                            WHEN p_gross_salary <= 30000000 THEN 0.38
                            WHEN p_gross_salary <= 50000000 THEN 0.40
                            ELSE 0.42
                        END;

                        SET v_income_tax_amount = p_gross_salary * v_income_tax_rate;
                        SET p_tax_amount = p_tax_amount + v_income_tax_amount;
                        -- 지방소득세: 소득세의 10%
                        SET v_local_income_tax = ROUND(v_income_tax_amount * 0.10, 0);
                        SET p_tax_amount = p_tax_amount + v_local_income_tax;

                        IF p_gross_salary * 12 >= 12000000 THEN
                            SET v_4insurance_amount = (p_gross_salary * v_pension_rate) +
                                                    (p_gross_salary * v_health_rate) +
                                                    (p_gross_salary * v_longterm_rate) +
                                                    (p_gross_salary * v_employment_rate);
                            SET p_tax_amount = p_tax_amount + v_4insurance_amount;
                        END IF;
                    END IF;

                    IF v_salary_type = 'FREELANCE' THEN
                        SET v_tax_base_gross = v_freelance_taxable;
                    ELSE
                        SET v_tax_base_gross = p_gross_salary;
                    END IF;

                    SET p_net_salary = p_gross_salary + IFNULL(v_ss_total, 0) - p_tax_amount;
                    SET p_gross_salary = p_gross_salary + IFNULL(v_ss_total, 0);

                    -- 8. 급여 계산 데이터 저장 (테넌트 격리)
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
                        calculated_at,
                        tenant_id,
                        created_at,
                        created_by,
                        updated_at,
                        is_deleted
                    ) VALUES (
                        p_consultant_id,
                        v_salary_profile_id,
                        v_calculation_period,
                        p_period_start,
                        p_period_end,
                        v_base_salary,
                        v_total_hours,
                        v_hourly_earnings,
                        v_total_consultations,
                        v_completed_consultations,
                        v_consultation_earnings,
                        IFNULL(v_ss_total, 0),
                        p_tax_amount,
                        p_gross_salary,
                        p_net_salary,
                        p_gross_salary,
                        'CALCULATED',
                        NOW(),
                        p_tenant_id,
                        NOW(),
                        p_triggered_by,
                        NOW(),
                        FALSE
                    );

                    SET p_calculation_id = LAST_INSERT_ID();
                    SET p_erp_sync_id = NULL;

                    IF IFNULL(v_ss_total, 0) > 0 AND p_calculation_id IS NOT NULL AND v_ss_unit_amount > 0 THEN
                        -- P0 hotfix V20260607_002: salary_year_month 조건 제거 (mapping 당 평생 1회 정책)
                        -- INSERT 컬럼 salary_year_month 값은 그대로 보존 (감사용 — 어느 월에 지급되었는지 기록).
                        INSERT INTO special_support_monthly_payouts (
                            tenant_id, consultant_id, client_id, mapping_id, salary_year_month, amount, salary_calculation_id, created_at
                        )
                        SELECT
                            p_tenant_id,
                            p_consultant_id,
                            m.client_id,
                            m.id,
                            DATE_FORMAT(p_period_start, '%Y-%m'),
                            v_ss_unit_amount,
                            p_calculation_id,
                            NOW()
                        FROM consultant_client_mappings m
                        LEFT JOIN special_support_monthly_payouts sp
                          ON sp.tenant_id = p_tenant_id
                         AND sp.consultant_id = p_consultant_id
                         AND sp.mapping_id = m.id
                        WHERE m.tenant_id = p_tenant_id
                          AND m.consultant_id = p_consultant_id
                          AND m.is_deleted = FALSE
                          AND sp.id IS NULL
                          AND m.total_sessions >= v_ss_min_sessions
                          AND (v_require_paid = FALSE OR m.payment_status IN ('CONFIRMED', 'PAY', 'DEP', 'APPROVED'));
                    END IF;

                    -- 9. 세목별 세금 내역 salary_tax_calculations INSERT (2차 세금 연동)
                    IF v_withholding_amount > 0 THEN
                        INSERT INTO salary_tax_calculations (
                            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
                            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
                        ) VALUES (
                            p_tenant_id, p_calculation_id, 'WITHHOLDING_TAX', '원천징수', v_withholding_tax,
                            v_tax_base_gross, v_tax_base_gross, v_withholding_amount, '프리랜서 원천징수 3.3%', TRUE, NOW(), NOW()
                        );
                    END IF;
                    IF v_local_income_tax > 0 THEN
                        INSERT INTO salary_tax_calculations (
                            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
                            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
                        ) VALUES (
                            p_tenant_id, p_calculation_id, 'LOCAL_INCOME_TAX', '지방소득세', 0.10,
                            IF(v_withholding_amount > 0, v_withholding_amount, v_income_tax_amount),
                            IF(v_withholding_amount > 0, v_withholding_amount, v_income_tax_amount),
                            v_local_income_tax, '원천징수/소득세의 10%', TRUE, NOW(), NOW()
                        );
                    END IF;
                    IF v_vat_amount > 0 THEN
                        INSERT INTO salary_tax_calculations (
                            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
                            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
                        ) VALUES (
                            p_tenant_id, p_calculation_id, 'VAT', '부가세', v_vat,
                            v_tax_base_gross, v_tax_base_gross, v_vat_amount, '사업자 부가세 10%', TRUE, NOW(), NOW()
                        );
                    END IF;
                    IF v_income_tax_amount > 0 THEN
                        INSERT INTO salary_tax_calculations (
                            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
                            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
                        ) VALUES (
                            p_tenant_id, p_calculation_id, 'INCOME_TAX', '소득세', v_income_tax_rate,
                            v_tax_base_gross, v_tax_base_gross, v_income_tax_amount, '정규직 소득세', TRUE, NOW(), NOW()
                        );
                    END IF;
                    IF v_4insurance_amount > 0 THEN
                        INSERT INTO salary_tax_calculations (
                            tenant_id, calculation_id, tax_type, tax_name, tax_rate,
                            base_amount, taxable_amount, tax_amount, description, is_active, created_at, updated_at
                        ) VALUES (
                            p_tenant_id, p_calculation_id, 'FOUR_INSURANCE', '4대보험',
                            (v_pension_rate + v_health_rate + v_longterm_rate + v_employment_rate),
                            v_tax_base_gross, v_tax_base_gross, v_4insurance_amount, '국민연금·건강·장기요양·고용보험', TRUE, NOW(), NOW()
                        );
                    END IF;

                    COMMIT;
                END IF;
            END IF;
        END IF;
    END IF;

END$$

DELIMITER ;
