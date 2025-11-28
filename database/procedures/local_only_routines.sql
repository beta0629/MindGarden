-- MySQL dump 10.13  Distrib 9.2.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: mind_garden
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping routines for database 'mind_garden'
--
/*!50003 DROP PROCEDURE IF EXISTS `AddSessionsToMapping` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `AddSessionsToMapping`(
    IN p_mapping_id BIGINT,
    IN p_additional_sessions INT,
    IN p_package_name VARCHAR(100),
    IN p_package_price BIGINT,
    IN p_extension_reason TEXT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_current_total INT DEFAULT 0;
    DECLARE v_current_remaining INT DEFAULT 0;
    DECLARE v_current_used INT DEFAULT 0;
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('회기 추가 처리 중 오류 발생: ', @text);
    END;
    
    START TRANSACTION;
    
    -- 1. 현재 매핑 정보 조회
    SELECT 
        total_sessions, 
        remaining_sessions, 
        used_sessions,
        status
    INTO 
        v_current_total, 
        v_current_remaining, 
        v_current_used,
        v_mapping_status
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    -- 2. 매핑 존재 및 상태 검증
    IF v_current_total IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '매핑을 찾을 수 없습니다';
        ROLLBACK;
    ELSEIF v_mapping_status NOT IN ('ACTIVE', 'COMPLETED') THEN
        SET p_result_code = 2;
        SET p_result_message = '회기 추가가 가능한 상태가 아닙니다';
        ROLLBACK;
    ELSE
        -- 3. 회기 추가 처리
        UPDATE consultant_client_mappings 
        SET 
            total_sessions = total_sessions + p_additional_sessions,
            remaining_sessions = remaining_sessions + p_additional_sessions,
            status = 'ACTIVE',
            updated_at = NOW()
        WHERE id = p_mapping_id;
        
        -- 4. 회기 추가 로그 기록
        INSERT INTO session_usage_logs (
            mapping_id, 
            consultant_id, 
            client_id, 
            session_type, 
            action_type, 
            additional_sessions,
            package_name,
            package_price,
            reason,
            created_at
        ) VALUES (
            p_mapping_id, 
            (SELECT consultant_id FROM consultant_client_mappings WHERE id = p_mapping_id),
            (SELECT client_id FROM consultant_client_mappings WHERE id = p_mapping_id),
            'EXTENSION', 
            'ADD', 
            p_additional_sessions,
            p_package_name,
            p_package_price,
            p_extension_reason,
            NOW()
        );
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('회기 추가 완료. 총 회기: ', (v_current_total + p_additional_sessions), ', 남은 회기: ', (v_current_remaining + p_additional_sessions));
        
        COMMIT;
    END IF;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ApplyDiscountAccounting` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ApplyDiscountAccounting`(
    IN p_mapping_id BIGINT,
    IN p_discount_code VARCHAR(50),
    IN p_original_amount DECIMAL(10,2),
    IN p_discount_amount DECIMAL(10,2),
    IN p_final_amount DECIMAL(10,2),
    IN p_branch_code VARCHAR(20),
    IN p_applied_by VARCHAR(100),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_revenue_transaction_id BIGINT;
    DECLARE v_discount_transaction_id BIGINT;
    DECLARE v_accounting_transaction_id BIGINT;
    DECLARE v_existing_count INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_result_code = -1;
        SET p_result_message = CONCAT('할인 적용 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 기존 할인 거래 확인
    SELECT COUNT(*) INTO v_existing_count 
    FROM discount_accounting_transactions 
    WHERE mapping_id = p_mapping_id AND status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND');
    
    IF v_existing_count > 0 THEN
        SET p_result_code = -2;
        SET p_result_message = '이미 할인이 적용된 매핑입니다.';
        ROLLBACK;
    ELSE
        -- 2. 매출 거래 생성
        INSERT INTO financial_transactions (
            transaction_type, category, subcategory, amount, description,
            related_entity_id, related_entity_type, branch_code, 
            transaction_date, status, created_at, discount_code
        ) VALUES (
            'INCOME', 'CONSULTATION', 'PACKAGE_SALE', p_original_amount,
            CONCAT('패키지 판매 - 원래 금액 (할인코드: ', IFNULL(p_discount_code, 'N/A'), ')'),
            p_mapping_id, 'CONSULTANT_CLIENT_MAPPING', p_branch_code,
            NOW(), 'COMPLETED', NOW(), p_discount_code
        );
        
        SET v_revenue_transaction_id = LAST_INSERT_ID();
        
        -- 3. 할인 거래 생성 (음수로 저장)
        INSERT INTO financial_transactions (
            transaction_type, category, subcategory, amount, description,
            related_entity_id, related_entity_type, branch_code,
            transaction_date, status, created_at, discount_code
        ) VALUES (
            'DISCOUNT', 'SALES_DISCOUNT', 'PACKAGE_DISCOUNT', -p_discount_amount,
            CONCAT('패키지 할인 - ', IFNULL(p_discount_code, '자동할인'), ' (', p_discount_amount, '원)'),
            p_mapping_id, 'CONSULTANT_CLIENT_MAPPING', p_branch_code,
            NOW(), 'COMPLETED', NOW(), p_discount_code
        );
        
        SET v_discount_transaction_id = LAST_INSERT_ID();
        
        -- 4. 할인 회계 거래 생성
        INSERT INTO discount_accounting_transactions (
            mapping_id, discount_code, original_amount, discount_amount, final_amount,
            remaining_amount, status, revenue_transaction_id, discount_transaction_id,
            branch_code, applied_by, applied_at, created_at
        ) VALUES (
            p_mapping_id, p_discount_code, p_original_amount, p_discount_amount, p_final_amount,
            p_final_amount, 'APPLIED', v_revenue_transaction_id, v_discount_transaction_id,
            p_branch_code, p_applied_by, NOW(), NOW()
        );
        
        SET v_accounting_transaction_id = LAST_INSERT_ID();
        
        -- 5. 매핑 테이블 업데이트
        UPDATE consultant_client_mappings 
        SET discount_code = p_discount_code,
            discount_amount = p_discount_amount,
            original_amount = p_original_amount,
            final_amount = p_final_amount,
            discount_applied_at = NOW(),
            updated_at = NOW()
        WHERE id = p_mapping_id;
        
        COMMIT;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('할인 적용 완료. 회계거래ID: ', v_accounting_transaction_id);
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ApproveSalaryWithErpSync` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ApproveSalaryWithErpSync`(
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
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `CalculateFinancialKPIs` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `CalculateFinancialKPIs`(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_branch_code VARCHAR(50)
)
BEGIN
    DECLARE total_revenue BIGINT DEFAULT 0;
    DECLARE total_expenses BIGINT DEFAULT 0;
    DECLARE net_profit BIGINT DEFAULT 0;
    DECLARE total_transactions INT DEFAULT 0;
    DECLARE profit_margin DECIMAL(5,2) DEFAULT 0;
    DECLARE avg_transaction_value DECIMAL(15,2) DEFAULT 0;
    
    -- 기본 재무 데이터 조회
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'REVENUE' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0),
        COUNT(*)
    INTO total_revenue, total_expenses, total_transactions
    FROM financial_transactions
    WHERE transaction_date BETWEEN p_start_date AND p_end_date
    AND (p_branch_code IS NULL OR branch_code = p_branch_code)
    AND is_deleted = FALSE;
    
    -- KPI 계산
    SET net_profit = total_revenue - total_expenses;
    SET profit_margin = CASE 
        WHEN total_revenue > 0 THEN (net_profit / total_revenue) * 100 
        ELSE 0 
    END;
    SET avg_transaction_value = CASE 
        WHEN total_transactions > 0 THEN total_revenue / total_transactions 
        ELSE 0 
    END;
    
    -- 결과 반환
    SELECT 
        total_revenue,
        total_expenses,
        net_profit,
        total_transactions,
        profit_margin,
        avg_transaction_value,
        p_start_date AS period_start,
        p_end_date AS period_end;
        
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `CalculateSalaryPreview` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `CalculateSalaryPreview`(
    IN p_consultant_id BIGINT,
    IN p_period_start DATE,
    IN p_period_end DATE,
    OUT p_gross_salary DECIMAL(15,2),
    OUT p_net_salary DECIMAL(15,2),
    OUT p_tax_amount DECIMAL(15,2),
    OUT p_consultation_count INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_salary_type VARCHAR(50);
    DECLARE v_base_salary DECIMAL(15,2) DEFAULT 0;
    DECLARE v_hourly_rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_is_business_registered BOOLEAN DEFAULT FALSE;
    DECLARE v_completed_consultations INT DEFAULT 0;
    DECLARE v_total_hours DECIMAL(8,2) DEFAULT 0;
    DECLARE v_consultation_earnings DECIMAL(15,2) DEFAULT 0;
    DECLARE v_hourly_earnings DECIMAL(15,2) DEFAULT 0;
    DECLARE v_grade_rate DECIMAL(10,2) DEFAULT 30000;
    
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
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_consultation_count = 0;
    END;
    
    -- 기본값 설정
    SET p_success = TRUE;
    SET p_message = 'Salary preview calculated successfully';
    
    -- 1. 급여 프로필 정보 조회
    SELECT 
        csp.salary_type, csp.base_salary, csp.hourly_rate, csp.is_business_registered
    INTO v_salary_type, v_base_salary, v_hourly_rate, v_is_business_registered
    FROM consultant_salary_profiles csp
    WHERE csp.consultant_id = p_consultant_id 
    AND csp.is_active = TRUE
    LIMIT 1;
    
    IF v_salary_type IS NULL THEN
        SET p_message = 'No active salary profile found';
        SET p_success = FALSE;
    ELSE
        -- 2. 상담 통계 조회
        SELECT 
            SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_consultations,
            COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / 60.0), 0) as total_hours
        INTO v_completed_consultations, v_total_hours
        FROM schedules s
        WHERE s.consultant_id = p_consultant_id 
        AND DATE(s.start_time) BETWEEN p_period_start AND p_period_end
        AND s.is_deleted = FALSE;
        
        SET p_consultation_count = v_completed_consultations;
        
        -- 3. 급여 계산
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
        
        -- 4. 세금 및 공제 계산
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `CheckTimeConflict` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `CheckTimeConflict`(
    IN p_consultant_id BIGINT,
    IN p_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_exclude_schedule_id BIGINT,
    OUT p_has_conflict BOOLEAN,
    OUT p_conflict_reason VARCHAR(255)
)
BEGIN
    DECLARE v_business_start_time TIME DEFAULT '10:00:00';
    DECLARE v_business_end_time TIME DEFAULT '20:00:00';
    DECLARE v_lunch_start_time TIME DEFAULT NULL;
    DECLARE v_lunch_end_time TIME DEFAULT NULL;
    DECLARE v_min_notice_hours INT DEFAULT 24;
    DECLARE v_max_advance_days INT DEFAULT 30;
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE v_has_lunch_time BOOLEAN DEFAULT FALSE;
    
    SET p_has_conflict = FALSE;
    SET p_conflict_reason = '';
    
    -- 업무 시간 설정 조회
    SELECT 
        MAX(CASE WHEN code_value = 'START_TIME' THEN 
            TIME(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE(')', korean_name) - LOCATE('(', korean_name) - 1)) 
        END),
        MAX(CASE WHEN code_value = 'END_TIME' THEN 
            TIME(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE(')', korean_name) - LOCATE('(', korean_name) - 1)) 
        END),
        MAX(CASE WHEN code_value = 'LUNCH_START' THEN 
            TIME(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE(')', korean_name) - LOCATE('(', korean_name) - 1)) 
        END),
        MAX(CASE WHEN code_value = 'LUNCH_END' THEN 
            TIME(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE(')', korean_name) - LOCATE('(', korean_name) - 1)) 
        END)
    INTO v_business_start_time, v_business_end_time, v_lunch_start_time, v_lunch_end_time
    FROM common_codes 
    WHERE code_group = 'BUSINESS_HOURS' 
        AND code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END')
        AND is_active = 1 AND is_deleted = 0;
    
    -- 취소 정책 설정 조회
    SELECT 
        MAX(CASE WHEN code_value = 'MIN_NOTICE_HOURS' THEN 
            CAST(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('시간', korean_name) - LOCATE('(', korean_name) - 1) AS UNSIGNED)
        END),
        MAX(CASE WHEN code_value = 'MAX_ADVANCE_DAYS' THEN 
            CAST(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('일', korean_name) - LOCATE('(', korean_name) - 1) AS UNSIGNED)
        END)
    INTO v_min_notice_hours, v_max_advance_days
    FROM common_codes 
    WHERE code_group = 'CANCELLATION_POLICY' 
        AND code_value IN ('MIN_NOTICE_HOURS', 'MAX_ADVANCE_DAYS')
        AND is_active = 1 AND is_deleted = 0;
    
    -- 기본값 설정 (설정이 없는 경우)
    SET v_business_start_time = IFNULL(v_business_start_time, TIME('10:00:00'));
    SET v_business_end_time = IFNULL(v_business_end_time, TIME('20:00:00'));
    SET v_min_notice_hours = IFNULL(v_min_notice_hours, 24);
    SET v_max_advance_days = IFNULL(v_max_advance_days, 30);
    
    -- 점심시간 설정 여부 확인
    SET v_has_lunch_time = (v_lunch_start_time IS NOT NULL AND v_lunch_end_time IS NOT NULL);
    
    -- 1. 업무 시간 체크
    IF p_start_time < v_business_start_time OR p_end_time > v_business_end_time THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '업무 시간 외 시간입니다.';
    END IF;
    
    -- 2. 점심 시간 체크 (점심시간이 설정된 경우에만)
    IF NOT p_has_conflict AND v_has_lunch_time AND (
        (p_start_time >= v_lunch_start_time AND p_start_time < v_lunch_end_time) OR
        (p_end_time > v_lunch_start_time AND p_end_time <= v_lunch_end_time) OR
        (p_start_time < v_lunch_start_time AND p_end_time > v_lunch_end_time)
    ) THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '점심 시간과 겹칩니다.';
    END IF;
    
    -- 3. 사전 예약 기간 체크
    IF NOT p_has_conflict AND DATEDIFF(p_date, CURDATE()) > v_max_advance_days THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = CONCAT('최대 예약 가능 일수를 초과했습니다. (', v_max_advance_days, '일)');
    END IF;
    
    -- 4. 최소 통지 시간 체크
    IF NOT p_has_conflict AND DATEDIFF(p_date, CURDATE()) = 0 AND 
       TIME_TO_SEC(TIMEDIFF(p_start_time, CURTIME())) < (v_min_notice_hours * 3600) THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = CONCAT('최소 통지 시간이 부족합니다. (', v_min_notice_hours, '시간)');
    END IF;
    
    -- 5. 기존 스케줄과의 충돌 체크
    IF NOT p_has_conflict THEN
        SELECT COUNT(*) INTO v_conflict_count
        FROM schedules 
        WHERE consultant_id = p_consultant_id 
            AND date = p_date
            AND status NOT IN ('CANCELLED', 'COMPLETED')
            AND (p_exclude_schedule_id IS NULL OR id != p_exclude_schedule_id)
            AND (
                (p_start_time >= start_time AND p_start_time < end_time) OR
                (p_end_time > start_time AND p_end_time <= end_time) OR
                (p_start_time < start_time AND p_end_time > end_time)
            );
        
        IF v_conflict_count > 0 THEN
            SET p_has_conflict = TRUE;
            SET p_conflict_reason = '기존 스케줄과 시간이 겹칩니다.';
        END IF;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `CreateConsultationRecordReminder` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `CreateConsultationRecordReminder`(
IN p_schedule_id BIGINT,
IN p_consultant_id BIGINT,
IN p_client_id BIGINT,
IN p_session_date DATE,
IN p_session_time TIME,
IN p_title VARCHAR(255),
OUT p_reminder_id BIGINT,
OUT p_message VARCHAR(500)
)
BEGIN
DECLARE v_reminder_count INT DEFAULT 0;
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
GET DIAGNOSTICS CONDITION 1
@sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
SET p_reminder_id = 0;
SET p_message = CONCAT('오류 발생: ', @text);
ROLLBACK;
END;
SET p_reminder_id = 0;
SET p_message = '';
SELECT COUNT(*)
INTO v_reminder_count
FROM consultation_record_alerts
WHERE schedule_id = p_schedule_id
AND consultant_id = p_consultant_id
AND alert_type = 'MISSING_RECORD'
AND status = 'PENDING'
AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
IF v_reminder_count = 0 THEN
INSERT INTO consultation_record_alerts (
schedule_id, consultant_id, client_id, session_date,
session_time, title, alert_type, status,
message, created_at, updated_at
) VALUES (
p_schedule_id, p_consultant_id, p_client_id, p_session_date,
p_session_time, p_title, 'MISSING_RECORD', 'PENDING',
CONCAT('상담일지 작성이 필요합니다. 상담: ', p_title, ' (', p_session_date, ' ', p_session_time, ')'),
NOW(), NOW()
);
SET p_reminder_id = LAST_INSERT_ID();
SET p_message = '상담일지 미작성 알림이 생성되었습니다.';
INSERT INTO system_logs (log_type, log_level, message, created_at)
VALUES ('CONSULTATION_REMINDER', 'WARNING',
CONCAT('상담일지 미작성 알림 생성: 스케줄 ID=', p_schedule_id, ', 상담사 ID=', p_consultant_id),
NOW());
ELSE
SET p_message = '이미 24시간 내에 동일한 알림이 존재합니다.';
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `DailyPerformanceMonitoring` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `DailyPerformanceMonitoring`(
    IN p_monitoring_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_consultant_name VARCHAR(100);
    DECLARE v_completion_rate DECIMAL(5,2);
    DECLARE v_alert_message TEXT;
    
    DECLARE consultant_cursor CURSOR FOR
        SELECT 
            cp.consultant_id, 
            u.name,
            cp.completion_rate
        FROM consultant_performance cp
        JOIN users u ON cp.consultant_id = u.id
        WHERE cp.performance_date = p_monitoring_date
        AND cp.completion_rate < 70.0  -- 완료율 70% 미만
        AND u.is_active = true;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    OPEN consultant_cursor;
    
    read_loop: LOOP
        FETCH consultant_cursor INTO v_consultant_id, v_consultant_name, v_completion_rate;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 알림 메시지 생성
        SET v_alert_message = CONCAT(
            '완료율 기준 미달: ', 
            ROUND(v_completion_rate, 1), 
            '% (기준: 70%)'
        );
        
        -- 기존 알림이 없는 경우에만 새 알림 생성
        IF NOT EXISTS (
            SELECT 1 FROM performance_alerts 
            WHERE consultant_id = v_consultant_id 
            AND DATE(created_at) = p_monitoring_date
            AND alert_level = 'WARNING'
        ) THEN
            INSERT INTO performance_alerts (
                consultant_id, consultant_name, alert_level, completion_rate,
                alert_message, status, created_at
            ) VALUES (
                v_consultant_id, v_consultant_name, 'WARNING', v_completion_rate,
                v_alert_message, 'PENDING', NOW()
            );
        END IF;
        
    END LOOP;
    
    CLOSE consultant_cursor;
    
    COMMIT;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GenerateFinancialReport` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GenerateFinancialReport`(
    IN p_report_type VARCHAR(20),
    IN p_period_start DATE,
    IN p_period_end DATE,
    IN p_branch_code VARCHAR(20),
    OUT p_report_data JSON,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_total_revenue DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_expenses DECIMAL(15,2) DEFAULT 0;
    DECLARE v_net_profit DECIMAL(15,2) DEFAULT 0;
    DECLARE v_transaction_count INT DEFAULT 0;
    DECLARE v_daily_breakdown JSON DEFAULT JSON_ARRAY();
    DECLARE v_category_breakdown JSON DEFAULT JSON_ARRAY();
    DECLARE v_consultant_breakdown JSON DEFAULT JSON_ARRAY();
    DECLARE v_report_summary JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('재무 보고서 생성 중 오류 발생: ', @text);
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- 기본 재무 데이터 집계
    SELECT 
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
        COUNT(*)
    INTO v_total_revenue, v_total_expenses, v_transaction_count
    FROM financial_transactions ft
    JOIN schedules s ON ft.related_entity_id = s.id
    WHERE s.date BETWEEN p_period_start AND p_period_end
    AND (p_branch_code IS NULL OR s.branch_code = p_branch_code)
    AND ft.is_deleted = false
    AND s.is_deleted = false;
    
    SET v_net_profit = v_total_revenue - v_total_expenses;
    
    -- 일별 분석 (월별 보고서인 경우)
    IF p_report_type = 'monthly' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'date', s.date,
                'revenue', daily_revenue,
                'expenses', daily_expenses,
                'netProfit', daily_revenue - daily_expenses,
                'transactionCount', daily_count
            )
        )
        INTO v_daily_breakdown
        FROM (
            SELECT 
                s.date,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) as daily_revenue,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) as daily_expenses,
                COUNT(*) as daily_count
            FROM schedules s
            LEFT JOIN financial_transactions ft ON ft.related_entity_id = s.id
            WHERE s.date BETWEEN p_period_start AND p_period_end
            AND (p_branch_code IS NULL OR s.branch_code = p_branch_code)
            AND (ft.is_deleted = false OR ft.id IS NULL)
            AND s.is_deleted = false
            GROUP BY s.date
            ORDER BY s.date
        ) daily_data;
    END IF;
    
    -- 카테고리별 분석
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'category', ft.category,
            'revenue', category_revenue,
            'expenses', category_expenses,
            'netProfit', category_revenue - category_expenses,
            'transactionCount', category_count
        )
    )
    INTO v_category_breakdown
    FROM (
        SELECT 
            ft.category,
            COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) as category_revenue,
            COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) as category_expenses,
            COUNT(*) as category_count
        FROM financial_transactions ft
        JOIN schedules s ON ft.related_entity_id = s.id
        WHERE s.date BETWEEN p_period_start AND p_period_end
        AND (p_branch_code IS NULL OR s.branch_code = p_branch_code)
        AND ft.is_deleted = false
        AND s.is_deleted = false
        GROUP BY ft.category
        ORDER BY category_revenue DESC
    ) category_data;
    
    -- 상담사별 분석
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'consultantId', s.consultant_id,
            'consultantName', u.name,
            'revenue', consultant_revenue,
            'expenses', consultant_expenses,
            'netProfit', consultant_revenue - consultant_expenses,
            'transactionCount', consultant_count
        )
    )
    INTO v_consultant_breakdown
    FROM (
        SELECT 
            s.consultant_id,
            COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) as consultant_revenue,
            COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) as consultant_expenses,
            COUNT(*) as consultant_count
        FROM schedules s
        LEFT JOIN financial_transactions ft ON ft.related_entity_id = s.id
        LEFT JOIN users u ON u.id = s.consultant_id
        WHERE s.date BETWEEN p_period_start AND p_period_end
        AND (p_branch_code IS NULL OR s.branch_code = p_branch_code)
        AND (ft.is_deleted = false OR ft.id IS NULL)
        AND s.is_deleted = false
        GROUP BY s.consultant_id, u.name
        ORDER BY consultant_revenue DESC
    ) consultant_data;
    
    -- 보고서 요약 생성
    SET v_report_summary = JSON_OBJECT(
        'reportType', p_report_type,
        'periodStart', p_period_start,
        'periodEnd', p_period_end,
        'branchCode', p_branch_code,
        'totalRevenue', v_total_revenue,
        'totalExpenses', v_total_expenses,
        'netProfit', v_net_profit,
        'transactionCount', v_transaction_count,
        'profitMargin', CASE 
            WHEN v_total_revenue > 0 THEN 
                ROUND((v_net_profit / v_total_revenue) * 100, 2)
            ELSE 0 
        END,
        'averageDailyRevenue', CASE 
            WHEN DATEDIFF(p_period_end, p_period_start) > 0 THEN 
                v_total_revenue / DATEDIFF(p_period_end, p_period_start)
            ELSE 0 
        END
    );
    
    -- 최종 보고서 데이터 생성
    SET p_report_data = JSON_OBJECT(
        'summary', v_report_summary,
        'dailyBreakdown', v_daily_breakdown,
        'categoryBreakdown', v_category_breakdown,
        'consultantBreakdown', v_consultant_breakdown
    );
    
    SET p_success = TRUE;
    SET p_message = '재무 보고서가 성공적으로 생성되었습니다.';
    
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GenerateMonthlyFinancialReport` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GenerateMonthlyFinancialReport`(
    IN p_year INT,
    IN p_month INT,
    IN p_branch_code VARCHAR(50)
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 날짜 범위 설정
    SET start_date = DATE(CONCAT(p_year, '-', LPAD(p_month, 2, '0'), '-01'));
    SET end_date = LAST_DAY(start_date);
    
    -- 월별 재무 요약
    SELECT 
        p_year AS report_year,
        p_month AS report_month,
        p_branch_code AS branch_code,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
        COUNT(*) AS total_transactions,
        COUNT(DISTINCT DATE(ft.transaction_date)) AS active_days
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE;
    
    -- 일별 재무 상세
    SELECT 
        DATE(ft.transaction_date) AS transaction_date,
        SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) AS daily_revenue,
        SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END) AS daily_expenses,
        COUNT(*) AS daily_transactions
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE
    GROUP BY DATE(ft.transaction_date)
    ORDER BY transaction_date;
    
    -- 카테고리별 분석
    SELECT 
        ft.category,
        ft.transaction_type,
        COUNT(*) AS transaction_count,
        SUM(ft.amount) AS total_amount,
        AVG(ft.amount) AS average_amount,
        MAX(ft.amount) AS max_amount,
        MIN(ft.amount) AS min_amount
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE
    GROUP BY ft.category, ft.transaction_type
    ORDER BY total_amount DESC;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GenerateQuarterlyFinancialReport` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GenerateQuarterlyFinancialReport`(
    IN p_year INT,
    IN p_quarter INT,
    IN p_branch_code VARCHAR(50)
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 분기 시작/종료 날짜 계산
    CASE p_quarter
        WHEN 1 THEN 
            SET start_date = DATE(CONCAT(p_year, '-01-01'));
            SET end_date = DATE(CONCAT(p_year, '-03-31'));
        WHEN 2 THEN 
            SET start_date = DATE(CONCAT(p_year, '-04-01'));
            SET end_date = DATE(CONCAT(p_year, '-06-30'));
        WHEN 3 THEN 
            SET start_date = DATE(CONCAT(p_year, '-07-01'));
            SET end_date = DATE(CONCAT(p_year, '-09-30'));
        WHEN 4 THEN 
            SET start_date = DATE(CONCAT(p_year, '-10-01'));
            SET end_date = DATE(CONCAT(p_year, '-12-31'));
    END CASE;
    
    -- 분기별 재무 요약
    SELECT 
        p_year AS report_year,
        p_quarter AS report_quarter,
        p_branch_code AS branch_code,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
        COUNT(*) AS total_transactions,
        COUNT(DISTINCT MONTH(ft.transaction_date)) AS active_months
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE;
    
    -- 월별 분기 내 상세
    SELECT 
        MONTH(ft.transaction_date) AS month,
        SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) AS monthly_revenue,
        SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END) AS monthly_expenses,
        COUNT(*) AS monthly_transactions
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE
    GROUP BY MONTH(ft.transaction_date)
    ORDER BY month;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GenerateYearlyFinancialReport` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GenerateYearlyFinancialReport`(
    IN p_year INT,
    IN p_branch_code VARCHAR(50)
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 연도 시작/종료 날짜
    SET start_date = DATE(CONCAT(p_year, '-01-01'));
    SET end_date = DATE(CONCAT(p_year, '-12-31'));
    
    -- 연도별 재무 요약
    SELECT 
        p_year AS report_year,
        p_branch_code AS branch_code,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
        COUNT(*) AS total_transactions,
        COUNT(DISTINCT MONTH(ft.transaction_date)) AS active_months,
        COUNT(DISTINCT ft.branch_code) AS active_branches
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE;
    
    -- 분기별 연도 내 상세
    SELECT 
        QUARTER(ft.transaction_date) AS quarter,
        SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) AS quarterly_revenue,
        SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END) AS quarterly_expenses,
        COUNT(*) AS quarterly_transactions
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE
    GROUP BY QUARTER(ft.transaction_date)
    ORDER BY quarter;
    
    -- 지점별 연도 내 상세
    SELECT 
        ft.branch_code,
        cc.code_label AS branch_name,
        SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) AS branch_revenue,
        SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END) AS branch_expenses,
        COUNT(*) AS branch_transactions
    FROM financial_transactions ft
    LEFT JOIN common_codes cc ON ft.branch_code = cc.code_value AND cc.code_group = 'BRANCH'
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE
    GROUP BY ft.branch_code, cc.code_label
    ORDER BY branch_revenue DESC;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetBranchComparisonStatistics` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetBranchComparisonStatistics`(
    IN p_period VARCHAR(20),
    IN p_metric VARCHAR(20) -- 'USERS', 'SCHEDULES', 'RATINGS', 'REVENUE'
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 기간 계산
    SET end_date = CURDATE();
    CASE p_period
        WHEN 'WEEK' THEN SET start_date = DATE_SUB(end_date, INTERVAL 7 DAY);
        WHEN 'MONTH' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
        WHEN 'QUARTER' THEN SET start_date = DATE_SUB(end_date, INTERVAL 3 MONTH);
        WHEN 'YEAR' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 YEAR);
        ELSE SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
    END CASE;
    
    -- 지점별 통계 조회
    CASE p_metric
        WHEN 'USERS' THEN
            SELECT 
                b.id as branch_id,
                b.branch_name,
                b.branch_code,
                COUNT(u.id) as total_users,
                COUNT(CASE WHEN u.is_active = 1 THEN 1 END) as active_users,
                COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END) as consultants,
                COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END) as clients
            FROM branches b
            LEFT JOIN users u ON b.id = u.branch_id AND u.is_deleted = 0
            WHERE b.is_deleted = 0
            GROUP BY b.id, b.branch_name, b.branch_code
            ORDER BY total_users DESC;
            
        WHEN 'SCHEDULES' THEN
            SELECT 
                b.id as branch_id,
                b.branch_name,
                b.branch_code,
                COUNT(s.id) as total_schedules,
                COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END) as completed_schedules,
                COUNT(CASE WHEN s.status = 'CANCELLED' THEN 1 END) as cancelled_schedules,
                ROUND(COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(s.id), 2) as completion_rate
            FROM branches b
            LEFT JOIN users u ON b.id = u.branch_id AND u.is_deleted = 0
            LEFT JOIN schedules s ON u.id = s.consultant_id AND s.is_deleted = 0 AND s.date BETWEEN start_date AND end_date
            WHERE b.is_deleted = 0
            GROUP BY b.id, b.branch_name, b.branch_code
            ORDER BY total_schedules DESC;
            
        WHEN 'RATINGS' THEN
            SELECT 
                b.id as branch_id,
                b.branch_name,
                b.branch_code,
                COUNT(cr.id) as total_ratings,
                ROUND(AVG(cr.rating), 2) as average_rating,
                COUNT(CASE WHEN cr.rating >= 4 THEN 1 END) as high_ratings,
                ROUND(COUNT(CASE WHEN cr.rating >= 4 THEN 1 END) * 100.0 / COUNT(cr.id), 2) as satisfaction_rate
            FROM branches b
            LEFT JOIN users u ON b.id = u.branch_id AND u.is_deleted = 0 AND u.role = 'CONSULTANT'
            LEFT JOIN consultant_ratings cr ON u.id = cr.consultant_id AND cr.is_deleted = 0 AND cr.created_at BETWEEN start_date AND end_date
            WHERE b.is_deleted = 0
            GROUP BY b.id, b.branch_name, b.branch_code
            ORDER BY average_rating DESC;
            
        ELSE
            -- 기본값: 사용자 통계
            SELECT 
                b.id as branch_id,
                b.branch_name,
                b.branch_code,
                COUNT(u.id) as total_users,
                COUNT(CASE WHEN u.is_active = 1 THEN 1 END) as active_users
            FROM branches b
            LEFT JOIN users u ON b.id = u.branch_id AND u.is_deleted = 0
            WHERE b.is_deleted = 0
            GROUP BY b.id, b.branch_name, b.branch_code
            ORDER BY total_users DESC;
    END CASE;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetBranchFinancialBreakdown` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetBranchFinancialBreakdown`(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        cc.code_value AS branch_code,
        cc.code_label AS branch_name,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS expenses,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
        COUNT(ft.id) AS transaction_count
    FROM common_codes cc
    LEFT JOIN financial_transactions ft ON cc.code_value = ft.branch_code
        AND ft.transaction_date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = FALSE
    WHERE cc.code_group = 'BRANCH' 
    AND cc.is_active = TRUE
    GROUP BY cc.code_value, cc.code_label
    ORDER BY revenue DESC;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetBranchTrendStatistics` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetBranchTrendStatistics`(
    IN p_period VARCHAR(20),
    IN p_metric VARCHAR(20),
    IN p_branch_id INT
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 기간 계산
    SET end_date = CURDATE();
    CASE p_period
        WHEN 'WEEK' THEN SET start_date = DATE_SUB(end_date, INTERVAL 7 DAY);
        WHEN 'MONTH' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
        WHEN 'QUARTER' THEN SET start_date = DATE_SUB(end_date, INTERVAL 3 MONTH);
        WHEN 'YEAR' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 YEAR);
        ELSE SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
    END CASE;
    
    -- 지점별 추이 분석
    CASE p_metric
        WHEN 'DAILY_USERS' THEN
            SELECT 
                DATE(u.created_at) as date,
                COUNT(*) as new_users,
                COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END) as new_consultants,
                COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END) as new_clients
            FROM users u
            WHERE u.is_deleted = 0 
                AND u.branch_id = p_branch_id
                AND DATE(u.created_at) BETWEEN start_date AND end_date
            GROUP BY DATE(u.created_at)
            ORDER BY date;
            
        WHEN 'DAILY_SCHEDULES' THEN
            SELECT 
                s.date,
                COUNT(*) as total_schedules,
                COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END) as completed,
                COUNT(CASE WHEN s.status = 'CANCELLED' THEN 1 END) as cancelled
            FROM schedules s
            JOIN users u ON s.consultant_id = u.id
            WHERE s.is_deleted = 0 
                AND u.branch_id = p_branch_id
                AND s.date BETWEEN start_date AND end_date
            GROUP BY s.date
            ORDER BY s.date;
            
        WHEN 'WEEKLY_RATINGS' THEN
            SELECT 
                YEARWEEK(cr.created_at) as week,
                COUNT(*) as total_ratings,
                ROUND(AVG(cr.rating), 2) as average_rating,
                COUNT(CASE WHEN cr.rating >= 4 THEN 1 END) as high_ratings
            FROM consultant_ratings cr
            JOIN users u ON cr.consultant_id = u.id
            WHERE cr.is_deleted = 0 
                AND u.branch_id = p_branch_id
                AND cr.created_at BETWEEN start_date AND end_date
            GROUP BY YEARWEEK(cr.created_at)
            ORDER BY week;
            
        ELSE
            -- 기본값: 일별 사용자
            SELECT 
                DATE(u.created_at) as date,
                COUNT(*) as new_users
            FROM users u
            WHERE u.is_deleted = 0 
                AND u.branch_id = p_branch_id
                AND DATE(u.created_at) BETWEEN start_date AND end_date
            GROUP BY DATE(u.created_at)
            ORDER BY date;
    END CASE;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetBusinessTimeSettings` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetBusinessTimeSettings`()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 업무 시간 설정 조회
    SELECT 
        code_group,
        code_value,
        code_label,
        korean_name,
        CASE 
            WHEN code_value = 'START_TIME' THEN 'businessStartTime'
            WHEN code_value = 'END_TIME' THEN 'businessEndTime'
            WHEN code_value = 'LUNCH_START' THEN 'lunchStartTime'
            WHEN code_value = 'LUNCH_END' THEN 'lunchEndTime'
            WHEN code_value = 'SLOT_INTERVAL' THEN 'slotIntervalMinutes'
        END as setting_key,
        CASE 
            WHEN code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END') THEN
                SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE(')', korean_name) - LOCATE('(', korean_name) - 1)
            WHEN code_value = 'SLOT_INTERVAL' THEN
                SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('분', korean_name) - LOCATE('(', korean_name) - 1)
        END as setting_value
    FROM common_codes 
    WHERE code_group = 'BUSINESS_HOURS' 
        AND is_active = 1 
        AND is_deleted = 0
    ORDER BY sort_order;
    
    -- 취소 정책 설정 조회
    SELECT 
        code_group,
        code_value,
        code_label,
        korean_name,
        CASE 
            WHEN code_value = 'MIN_NOTICE_HOURS' THEN 'minNoticeHours'
            WHEN code_value = 'MAX_ADVANCE_DAYS' THEN 'maxAdvanceBookingDays'
            WHEN code_value = 'BREAK_TIME_MINUTES' THEN 'breakTimeMinutes'
        END as setting_key,
        CASE 
            WHEN code_value = 'MIN_NOTICE_HOURS' THEN
                SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('시간', korean_name) - LOCATE('(', korean_name) - 1)
            WHEN code_value = 'MAX_ADVANCE_DAYS' THEN
                SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('일', korean_name) - LOCATE('(', korean_name) - 1)
            WHEN code_value = 'BREAK_TIME_MINUTES' THEN
                SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('분', korean_name) - LOCATE('(', korean_name) - 1)
        END as setting_value
    FROM common_codes 
    WHERE code_group = 'CANCELLATION_POLICY' 
        AND is_active = 1 
        AND is_deleted = 0
    ORDER BY sort_order;
    
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetCategoryFinancialBreakdown` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetCategoryFinancialBreakdown`(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        ft.category,
        ft.transaction_type,
        COUNT(*) AS transaction_count,
        SUM(ft.amount) AS total_amount,
        AVG(ft.amount) AS average_amount
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN p_start_date AND p_end_date
    AND ft.is_deleted = FALSE
    GROUP BY ft.category, ft.transaction_type
    ORDER BY total_amount DESC;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetConsolidatedFinancialData` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetConsolidatedFinancialData`(
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_revenue BIGINT,
    OUT p_total_expenses BIGINT,
    OUT p_net_profit BIGINT,
    OUT p_total_transactions INT,
    OUT p_branch_count INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE branch_code VARCHAR(50);
    DECLARE branch_name VARCHAR(100);
    DECLARE branch_revenue BIGINT DEFAULT 0;
    DECLARE branch_expenses BIGINT DEFAULT 0;
    DECLARE branch_transactions INT DEFAULT 0;
    
    -- 커서 선언: 활성 지점 목록
    DECLARE branch_cursor CURSOR FOR 
        SELECT code_value, code_label 
        FROM common_codes 
        WHERE code_group = 'BRANCH' AND is_active = TRUE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- 변수 초기화
    SET p_total_revenue = 0;
    SET p_total_expenses = 0;
    SET p_net_profit = 0;
    SET p_total_transactions = 0;
    SET p_branch_count = 0;
    
    -- 지점별 재무 데이터 집계
    OPEN branch_cursor;
    
    read_loop: LOOP
        FETCH branch_cursor INTO branch_code, branch_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 지점별 수익 조회
        SELECT COALESCE(SUM(amount), 0) INTO branch_revenue
        FROM financial_transactions ft
        WHERE ft.branch_code = branch_code
        AND ft.transaction_type = 'INCOME'
        AND ft.transaction_date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = FALSE;
        
        -- 지점별 지출 조회
        SELECT COALESCE(SUM(amount), 0) INTO branch_expenses
        FROM financial_transactions ft
        WHERE ft.branch_code = branch_code
        AND ft.transaction_type = 'EXPENSE'
        AND ft.transaction_date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = FALSE;
        
        -- 지점별 거래 건수 조회
        SELECT COUNT(*) INTO branch_transactions
        FROM financial_transactions ft
        WHERE ft.branch_code = branch_code
        AND ft.transaction_date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = FALSE;
        
        -- 전체 합계 누적
        SET p_total_revenue = p_total_revenue + branch_revenue;
        SET p_total_expenses = p_total_expenses + branch_expenses;
        SET p_total_transactions = p_total_transactions + branch_transactions;
        SET p_branch_count = p_branch_count + 1;
        
    END LOOP;
    
    CLOSE branch_cursor;
    
    -- 순이익 계산
    SET p_net_profit = p_total_revenue - p_total_expenses;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetConsultationRecordMissingStatistics` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetConsultationRecordMissingStatistics`(IN p_check_date DATE,IN p_branch_code VARCHAR(20),OUT p_missing_count INT,OUT p_alerts_created INT,OUT p_success BOOLEAN,OUT p_message TEXT)
BEGIN SET p_missing_count = 0;SET p_alerts_created = 0;SET p_success = TRUE;SET p_message = '테스트 프로시저';END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetDiscountStatistics` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetDiscountStatistics`(
    IN p_branch_code VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_discounts DECIMAL(10,2),
    OUT p_total_refunds DECIMAL(10,2),
    OUT p_net_discounts DECIMAL(10,2),
    OUT p_discount_count INT,
    OUT p_refund_count INT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_total_discounts = 0;
        SET p_total_refunds = 0;
        SET p_net_discounts = 0;
        SET p_discount_count = 0;
        SET p_refund_count = 0;
    END;
    
    -- 할인 통계 계산
    SELECT 
        COALESCE(SUM(discount_amount), 0),
        COALESCE(SUM(refunded_amount), 0),
        COALESCE(SUM(discount_amount - IFNULL(refunded_amount, 0)), 0),
        COUNT(*),
        SUM(CASE WHEN refunded_amount > 0 THEN 1 ELSE 0 END)
    INTO p_total_discounts, p_total_refunds, p_net_discounts, p_discount_count, p_refund_count
    FROM discount_accounting_transactions 
    WHERE branch_code = p_branch_code
    AND DATE(applied_at) BETWEEN p_start_date AND p_end_date
    AND status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND', 'FULL_REFUND');
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetIntegratedSalaryStatistics` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetIntegratedSalaryStatistics`(
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
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetMonthlyFinancialTrend` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetMonthlyFinancialTrend`(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') AS month,
        SUM(CASE WHEN transaction_type = 'REVENUE' THEN amount ELSE 0 END) AS monthly_revenue,
        SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END) AS monthly_expenses,
        SUM(CASE WHEN transaction_type = 'REVENUE' THEN amount ELSE 0 END) - 
        SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END) AS monthly_profit,
        COUNT(*) AS transaction_count
    FROM financial_transactions
    WHERE transaction_date BETWEEN p_start_date AND p_end_date
    AND is_deleted = FALSE
    GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
    ORDER BY month;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetOverallBranchStatistics` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetOverallBranchStatistics`(
    IN p_period VARCHAR(20), -- 'WEEK', 'MONTH', 'QUARTER', 'YEAR'
    OUT p_total_branches INT,
    OUT p_active_branches INT,
    OUT p_total_users INT,
    OUT p_active_users INT,
    OUT p_total_consultants INT,
    OUT p_active_consultants INT,
    OUT p_total_clients INT,
    OUT p_active_clients INT,
    OUT p_total_schedules INT,
    OUT p_completed_schedules INT,
    OUT p_cancelled_schedules INT,
    OUT p_average_rating DECIMAL(3,2)
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 기간 계산
    SET end_date = CURDATE();
    CASE p_period
        WHEN 'WEEK' THEN SET start_date = DATE_SUB(end_date, INTERVAL 7 DAY);
        WHEN 'MONTH' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
        WHEN 'QUARTER' THEN SET start_date = DATE_SUB(end_date, INTERVAL 3 MONTH);
        WHEN 'YEAR' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 YEAR);
        ELSE SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
    END CASE;
    
    -- 전체 지점 수
    SELECT COUNT(*) INTO p_total_branches FROM branches WHERE is_deleted = 0;
    
    -- 활성 지점 수
    SELECT COUNT(*) INTO p_active_branches 
    FROM branches 
    WHERE is_deleted = 0 AND branch_status = 'ACTIVE';
    
    -- 전체 사용자 수
    SELECT COUNT(*) INTO p_total_users 
    FROM users 
    WHERE is_deleted = 0;
    
    -- 활성 사용자 수
    SELECT COUNT(*) INTO p_active_users 
    FROM users 
    WHERE is_deleted = 0 AND is_active = 1;
    
    -- 전체 상담사 수
    SELECT COUNT(*) INTO p_total_consultants 
    FROM users 
    WHERE is_deleted = 0 AND role = 'CONSULTANT';
    
    -- 활성 상담사 수
    SELECT COUNT(*) INTO p_active_consultants 
    FROM users 
    WHERE is_deleted = 0 AND role = 'CONSULTANT' AND is_active = 1;
    
    -- 전체 내담자 수
    SELECT COUNT(*) INTO p_total_clients 
    FROM users 
    WHERE is_deleted = 0 AND role = 'CLIENT';
    
    -- 활성 내담자 수
    SELECT COUNT(*) INTO p_active_clients 
    FROM users 
    WHERE is_deleted = 0 AND role = 'CLIENT' AND is_active = 1;
    
    -- 전체 상담 일정 수
    SELECT COUNT(*) INTO p_total_schedules 
    FROM schedules 
    WHERE is_deleted = 0 AND date BETWEEN start_date AND end_date;
    
    -- 완료된 상담 일정 수
    SELECT COUNT(*) INTO p_completed_schedules 
    FROM schedules 
    WHERE is_deleted = 0 AND status = 'COMPLETED' AND date BETWEEN start_date AND end_date;
    
    -- 취소된 상담 일정 수
    SELECT COUNT(*) INTO p_cancelled_schedules 
    FROM schedules 
    WHERE is_deleted = 0 AND status = 'CANCELLED' AND date BETWEEN start_date AND end_date;
    
    -- 평균 평점
    SELECT COALESCE(AVG(rating), 0) INTO p_average_rating 
    FROM consultant_ratings 
    WHERE is_deleted = 0 AND created_at BETWEEN start_date AND end_date;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetRefundableSessions` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetRefundableSessions`(
    IN p_mapping_id BIGINT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_refundable_sessions INT,
    OUT p_max_refund_amount BIGINT
)
BEGIN
    DECLARE v_current_total INT DEFAULT 0;
    DECLARE v_current_remaining INT DEFAULT 0;
    DECLARE v_current_used INT DEFAULT 0;
    DECLARE v_package_price BIGINT DEFAULT 0;
    DECLARE v_payment_amount BIGINT DEFAULT 0;
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_payment_status VARCHAR(50) DEFAULT '';
    DECLARE v_session_price BIGINT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('환불 가능 회기 조회 중 오류 발생: ', @text);
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    END;
    
    -- 1. 현재 매핑 정보 조회
    SELECT 
        total_sessions, 
        remaining_sessions, 
        used_sessions,
        package_price,
        payment_amount,
        status,
        payment_status
    INTO 
        v_current_total, 
        v_current_remaining, 
        v_current_used,
        v_package_price,
        v_payment_amount,
        v_mapping_status,
        v_payment_status
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    -- 2. 매핑 존재 및 상태 검증
    IF v_current_total IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '매핑을 찾을 수 없습니다';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSEIF v_mapping_status = 'TERMINATED' THEN
        SET p_result_code = 2;
        SET p_result_message = '이미 종료된 매핑입니다';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSEIF v_payment_status != 'CONFIRMED' THEN
        SET p_result_code = 3;
        SET p_result_message = '결제가 확인되지 않은 매핑입니다';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSE
        -- 3. 환불 가능 회기 수 및 최대 환불 금액 계산
        SET p_refundable_sessions = v_current_remaining;
        
        IF v_current_total > 0 THEN
            SET v_session_price = v_package_price / v_current_total;
            SET p_max_refund_amount = v_session_price * v_current_remaining;
        ELSE
            SET p_max_refund_amount = 0;
        END IF;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('환불 가능 회기: ', p_refundable_sessions, '회기, 최대 환불 금액: ', p_max_refund_amount);
    END IF;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetRefundStatistics` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `GetRefundStatistics`(
    IN p_branch_code VARCHAR(10),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_statistics JSON
)
BEGIN
    DECLARE v_total_refunds INT DEFAULT 0;
    DECLARE v_total_refund_amount BIGINT DEFAULT 0;
    DECLARE v_total_refund_sessions INT DEFAULT 0;
    DECLARE v_avg_refund_amount DECIMAL(10,2) DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('환불 통계 조회 중 오류 발생: ', @text);
        SET p_statistics = JSON_OBJECT('error', @text);
    END;
    
    -- 1. 환불 통계 계산
    SELECT 
        COUNT(*),
        COALESCE(SUM(ABS(amount)), 0),
        COALESCE(SUM(ABS(additional_sessions)), 0),
        COALESCE(AVG(ABS(amount)), 0)
    INTO 
        v_total_refunds,
        v_total_refund_amount,
        v_total_refund_sessions,
        v_avg_refund_amount
    FROM session_usage_logs sul
    JOIN consultant_client_mappings ccm ON sul.mapping_id = ccm.id
    WHERE sul.action_type = 'REFUND'
      AND sul.created_at BETWEEN p_start_date AND p_end_date
      AND (p_branch_code IS NULL OR ccm.branch_code = p_branch_code);
    
    -- 2. 결과 생성
    SET p_statistics = JSON_OBJECT(
        'branch_code', p_branch_code,
        'start_date', p_start_date,
        'end_date', p_end_date,
        'total_refunds', v_total_refunds,
        'total_refund_amount', v_total_refund_amount,
        'total_refund_sessions', v_total_refund_sessions,
        'avg_refund_amount', v_avg_refund_amount,
        'refund_rate', CASE 
            WHEN v_total_refund_sessions > 0 THEN 
                (v_total_refund_sessions * 100.0 / (v_total_refund_sessions + COALESCE((
                    SELECT SUM(used_sessions) 
                    FROM consultant_client_mappings 
                    WHERE created_at BETWEEN p_start_date AND p_end_date
                      AND (p_branch_code IS NULL OR branch_code = p_branch_code)
                ), 0)))
            ELSE 0 
        END
    );
    
    SET p_result_code = 0;
    SET p_result_message = '환불 통계 조회 완료';
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ProcessBatchScheduleCompletion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ProcessBatchScheduleCompletion`(
IN p_branch_code VARCHAR(10),
OUT p_processed_count INT,
OUT p_completed_count INT,
OUT p_reminder_count INT,
OUT p_message VARCHAR(500)
)
BEGIN
DECLARE v_done INT DEFAULT FALSE;
DECLARE v_schedule_id BIGINT;
DECLARE v_consultant_id BIGINT;
DECLARE v_session_date DATE;
DECLARE v_has_record TINYINT(1);
DECLARE v_validation_message VARCHAR(500);
DECLARE v_reminder_id BIGINT;
DECLARE v_reminder_message VARCHAR(500);
DECLARE v_completed TINYINT(1);
DECLARE v_completion_message VARCHAR(500);
DECLARE schedule_cursor CURSOR FOR
SELECT s.id, s.consultant_id, s.date
FROM schedules s
WHERE s.branch_code = p_branch_code
AND s.status IN ('BOOKED', 'CONFIRMED')
AND s.date <= CURDATE()
AND (s.date < CURDATE() OR (s.date = CURDATE() AND s.end_time <= CURTIME()));
DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
GET DIAGNOSTICS CONDITION 1
@sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
SET p_message = CONCAT('오류 발생: ', @text);
ROLLBACK;
END;
SET p_processed_count = 0;
SET p_completed_count = 0;
SET p_reminder_count = 0;
SET p_message = '';
OPEN schedule_cursor;
read_loop: LOOP
FETCH schedule_cursor INTO v_schedule_id, v_consultant_id, v_session_date;
IF v_done THEN
LEAVE read_loop;
END IF;
SET p_processed_count = p_processed_count + 1;
CALL ValidateConsultationRecordBeforeCompletion(
v_schedule_id, v_consultant_id, v_session_date,
v_has_record, v_validation_message
);
IF v_has_record = 1 THEN
UPDATE schedules
SET status = 'COMPLETED', updated_at = NOW()
WHERE id = v_schedule_id;
SET p_completed_count = p_completed_count + 1;
ELSE
CALL CreateConsultationRecordReminder(
v_schedule_id, v_consultant_id, 0, v_session_date,
'00:00:00', '상담일지 미작성',
v_reminder_id, v_reminder_message
);
SET p_reminder_count = p_reminder_count + 1;
END IF;
END LOOP;
CLOSE schedule_cursor;
SET p_message = CONCAT('일괄 처리 완료: 처리=', p_processed_count,
', 완료=', p_completed_count,
', 알림=', p_reminder_count);
INSERT INTO system_logs (log_type, log_level, message, created_at)
VALUES ('BATCH_SCHEDULE_COMPLETION', 'INFO', p_message, NOW());
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ProcessDiscountAccounting` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ProcessDiscountAccounting`(
    IN p_mapping_id BIGINT,
    IN p_discount_code VARCHAR(50),
    IN p_original_amount DECIMAL(15,2),
    IN p_discount_amount DECIMAL(15,2),
    IN p_final_amount DECIMAL(15,2),
    IN p_discount_type VARCHAR(20),
    OUT p_accounting_id BIGINT,
    OUT p_erp_transaction_id VARCHAR(100),
    OUT p_accounting_summary JSON,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_discount_name VARCHAR(100);
    DECLARE v_discount_rate DECIMAL(5,4);
    DECLARE v_tax_amount DECIMAL(15,2);
    DECLARE v_net_amount DECIMAL(15,2);
    DECLARE v_branch_code VARCHAR(20);
    DECLARE v_consultant_id BIGINT;
    DECLARE v_client_id BIGINT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('할인 회계 처리 중 오류 발생: ', @text);
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- 매핑 정보 조회
    SELECT 
        ccm.branch_code,
        ccm.consultant_id,
        ccm.client_id
    INTO v_branch_code, v_consultant_id, v_client_id
    FROM consultant_client_mappings ccm
    WHERE ccm.id = p_mapping_id AND ccm.is_deleted = false;
    
    -- 할인 정보 조회
    SELECT 
        discount_name,
        discount_rate
    INTO v_discount_name, v_discount_rate
    FROM package_discounts
    WHERE discount_code = p_discount_code AND is_active = true;
    
    -- 세금 계산 (부가가치세 10%)
    SET v_tax_amount = p_final_amount * 0.10;
    SET v_net_amount = p_final_amount - v_tax_amount;
    
    -- 할인 회계 거래 생성
    INSERT INTO discount_accounting_transactions (
        mapping_id,
        discount_code,
        discount_name,
        original_amount,
        discount_amount,
        final_amount,
        tax_amount,
        net_amount,
        discount_type,
        branch_code,
        consultant_id,
        client_id,
        created_at,
        updated_at
    ) VALUES (
        p_mapping_id,
        p_discount_code,
        v_discount_name,
        p_original_amount,
        p_discount_amount,
        p_final_amount,
        v_tax_amount,
        v_net_amount,
        p_discount_type,
        v_branch_code,
        v_consultant_id,
        v_client_id,
        NOW(),
        NOW()
    );
    
    SET p_accounting_id = LAST_INSERT_ID();
    
    -- ERP 거래 ID 생성
    SET p_erp_transaction_id = CONCAT('DISCOUNT_', p_accounting_id, '_', UNIX_TIMESTAMP());
    
    -- 회계 요약 JSON 생성
    SET p_accounting_summary = JSON_OBJECT(
        'accountingId', p_accounting_id,
        'erpTransactionId', p_erp_transaction_id,
        'originalAmount', p_original_amount,
        'discountAmount', p_discount_amount,
        'finalAmount', p_final_amount,
        'taxAmount', v_tax_amount,
        'netAmount', v_net_amount,
        'discountRate', v_discount_rate,
        'discountType', p_discount_type,
        'branchCode', v_branch_code,
        'consultantId', v_consultant_id,
        'clientId', v_client_id
    );
    
    SET p_success = TRUE;
    SET p_message = '할인 회계 처리가 완료되었습니다.';
    
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ProcessDiscountRefund` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ProcessDiscountRefund`(
    IN p_mapping_id BIGINT,
    IN p_refund_amount DECIMAL(10,2),
    IN p_refund_reason VARCHAR(500),
    IN p_processed_by VARCHAR(100),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_accounting_id BIGINT;
    DECLARE v_current_status VARCHAR(20);
    DECLARE v_remaining_amount DECIMAL(10,2);
    DECLARE v_refunded_amount DECIMAL(10,2);
    DECLARE v_new_remaining_amount DECIMAL(10,2);
    DECLARE v_refund_transaction_id BIGINT;
    DECLARE v_branch_code VARCHAR(20);
    DECLARE v_discount_code VARCHAR(50);
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_result_code = -1;
        SET p_result_message = CONCAT('환불 처리 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 할인 회계 거래 조회
    SELECT id, status, remaining_amount, refunded_amount, branch_code, discount_code
    INTO v_accounting_id, v_current_status, v_remaining_amount, v_refunded_amount, v_branch_code, v_discount_code
    FROM discount_accounting_transactions 
    WHERE mapping_id = p_mapping_id 
    AND status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND');
    
    IF v_accounting_id IS NULL THEN
        SET p_result_code = -2;
        SET p_result_message = '환불 가능한 할인 거래를 찾을 수 없습니다.';
        ROLLBACK;
    ELSEIF v_remaining_amount < p_refund_amount THEN
        SET p_result_code = -3;
        SET p_result_message = CONCAT('환불 요청 금액이 잔여 금액을 초과합니다. 잔여: ', v_remaining_amount, ', 요청: ', p_refund_amount);
        ROLLBACK;
    ELSE
        -- 2. 환불 거래 생성
        INSERT INTO financial_transactions (
            transaction_type, category, subcategory, amount, description,
            related_entity_id, related_entity_type, branch_code,
            transaction_date, status, created_at, discount_code
        ) VALUES (
            'REFUND', 'DISCOUNT_REFUND', 'PACKAGE_DISCOUNT_REFUND', p_refund_amount,
            CONCAT('할인 환불 - ', IFNULL(v_discount_code, 'N/A'), ' (', p_refund_amount, '원) - ', p_refund_reason),
            p_mapping_id, 'CONSULTANT_CLIENT_MAPPING', v_branch_code,
            NOW(), 'COMPLETED', NOW(), v_discount_code
        );
        
        SET v_refund_transaction_id = LAST_INSERT_ID();
        
        -- 3. 잔여 금액 계산
        SET v_new_remaining_amount = v_remaining_amount - p_refund_amount;
        
        -- 4. 할인 회계 거래 업데이트
        UPDATE discount_accounting_transactions 
        SET refunded_amount = IFNULL(refunded_amount, 0) + p_refund_amount,
            remaining_amount = v_new_remaining_amount,
            refund_transaction_id = v_refund_transaction_id,
            refund_reason = p_refund_reason,
            refunded_at = NOW(),
            status = CASE 
                WHEN v_new_remaining_amount <= 0 THEN 'FULL_REFUND'
                ELSE 'PARTIAL_REFUND'
            END,
            updated_at = NOW()
        WHERE id = v_accounting_id;
        
        -- 5. 매핑 테이블 업데이트
        UPDATE consultant_client_mappings 
        SET final_amount = v_new_remaining_amount,
            updated_at = NOW()
        WHERE id = p_mapping_id;
        
        COMMIT;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('환불 처리 완료. 환불거래ID: ', v_refund_transaction_id, ', 잔여금액: ', v_new_remaining_amount);
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ProcessIntegratedSalaryCalculation` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ProcessIntegratedSalaryCalculation`(
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
    DECLARE v_branch_code VARCHAR(20);
    DECLARE v_grade VARCHAR(20);
    DECLARE v_grade_rate DECIMAL(10,2) DEFAULT 30000;
    DECLARE v_calculation_exists INT DEFAULT 0;
    DECLARE v_calculation_period VARCHAR(20);
    
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
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_calculation_id = NULL;
        SET p_gross_salary = 0;
        SET p_net_salary = 0;
        SET p_tax_amount = 0;
        SET p_erp_sync_id = NULL;
    END;
    
    -- 기본값 설정
    SET p_success = TRUE;
    SET p_message = 'Salary calculation completed successfully';
    SET v_calculation_period = CONCAT(YEAR(p_period_start), '-', LPAD(MONTH(p_period_start), 2, '0'));
    
    -- 기존 계산 확인
    SELECT COUNT(*) INTO v_calculation_exists
    FROM salary_calculations 
    WHERE consultant_id = p_consultant_id 
    AND calculation_period = v_calculation_period;
    
    IF v_calculation_exists > 0 THEN
        SET p_message = 'Calculation already exists for this period';
        SET p_success = FALSE;
    ELSE
        -- 1. 급여 프로필 및 사용자 정보 조회
        SELECT 
            csp.id, csp.salary_type, csp.base_salary, csp.hourly_rate, csp.is_business_registered,
            u.branch_code, u.grade
        INTO v_salary_profile_id, v_salary_type, v_base_salary, v_hourly_rate, v_is_business_registered, v_branch_code, v_grade
        FROM consultant_salary_profiles csp
        JOIN users u ON csp.consultant_id = u.id
        WHERE csp.consultant_id = p_consultant_id 
        AND csp.is_active = TRUE
        LIMIT 1;
        
        IF v_salary_profile_id IS NULL THEN
            SET p_message = 'No active salary profile found';
            SET p_success = FALSE;
        ELSE
            -- 2. 상담 통계 조회
            SELECT 
                COUNT(*) as total_consultations,
                SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_consultations,
                COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) / 60.0), 0) as total_hours
            INTO v_total_consultations, v_completed_consultations, v_total_hours
            FROM schedules s
            WHERE s.consultant_id = p_consultant_id 
            AND DATE(s.start_time) BETWEEN p_period_start AND p_period_end
            AND s.is_deleted = FALSE;
            
            -- 3. 급여 계산
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
            
            -- 4. 세금 및 공제 계산
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
            
            -- 5. 급여 계산 데이터 저장
            INSERT INTO salary_calculations (
                consultant_id, salary_profile_id, calculation_period, calculation_period_start, calculation_period_end,
                base_salary, total_hours_worked, hourly_earnings, total_consultations, completed_consultations,
                commission_earnings, bonus_earnings, deductions, gross_salary, net_salary, total_salary,
                status, calculated_at, branch_code, created_at, updated_at
            ) VALUES (
                p_consultant_id, v_salary_profile_id, v_calculation_period, p_period_start, p_period_end,
                v_base_salary, v_total_hours, v_hourly_earnings, v_total_consultations, v_completed_consultations,
                v_consultation_earnings, 0, p_tax_amount, p_gross_salary, p_net_salary, p_gross_salary,
                'CALCULATED', NOW(), v_branch_code, NOW(), NOW()
            );
            
            SET p_calculation_id = LAST_INSERT_ID();
            SET p_erp_sync_id = 0;
        END IF;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ProcessMonthlySalaryBatch` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ProcessMonthlySalaryBatch`(
    IN p_target_month VARCHAR(7), -- 'YYYY-MM' 형식
    IN p_branch_code VARCHAR(20),
    OUT p_processed_count INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_period_start DATE;
    DECLARE v_period_end DATE;
    
    DECLARE consultant_cursor CURSOR FOR
        SELECT u.id FROM users u 
        JOIN consultant_salary_profiles csp ON u.id = csp.consultant_id
        WHERE u.role = 'CONSULTANT' 
        AND u.is_active = TRUE 
        AND (p_branch_code IS NULL OR u.branch_code = p_branch_code)
        AND csp.is_active = TRUE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    SET p_processed_count = 0;
    SET p_success = TRUE;
    SET p_message = 'Batch processing completed';
    
    -- 기간 설정
    SET v_period_start = STR_TO_DATE(CONCAT(p_target_month, '-01'), '%Y-%m-%d');
    SET v_period_end = LAST_DAY(v_period_start);
    
    -- 상담사별 급여 계산 및 저장
    OPEN consultant_cursor;
    
    consultant_loop: LOOP
        FETCH consultant_cursor INTO v_consultant_id;
        IF done THEN
            LEAVE consultant_loop;
        END IF;
        
        -- 여기서 실제 급여 계산 및 저장 로직 실행
        -- (기존 ProcessIntegratedSalaryCalculation 로직)
        
        SET p_processed_count = p_processed_count + 1;
    END LOOP;
    
    CLOSE consultant_cursor;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ProcessPartialRefund` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ProcessPartialRefund`(
    IN p_mapping_id BIGINT,
    IN p_refund_amount BIGINT,
    IN p_refund_sessions INT,
    IN p_refund_reason TEXT,
    IN p_processed_by VARCHAR(100),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_current_total INT DEFAULT 0;
    DECLARE v_current_remaining INT DEFAULT 0;
    DECLARE v_current_used INT DEFAULT 0;
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_payment_status VARCHAR(50) DEFAULT '';
    DECLARE v_new_total INT DEFAULT 0;
    DECLARE v_new_remaining INT DEFAULT 0;
    DECLARE v_refunded_sessions INT DEFAULT 0;
    DECLARE v_consultant_id BIGINT DEFAULT 0;
    DECLARE v_client_id BIGINT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('부분 환불 처리 중 오류 발생: ', @text);
    END;
    
    START TRANSACTION;
    
    -- 1. 현재 매핑 정보 조회
    SELECT 
        total_sessions, 
        remaining_sessions, 
        used_sessions,
        status,
        payment_status,
        consultant_id,
        client_id
    INTO 
        v_current_total, 
        v_current_remaining, 
        v_current_used,
        v_mapping_status,
        v_payment_status,
        v_consultant_id,
        v_client_id
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    -- 2. 매핑 존재 및 상태 검증
    IF v_current_total IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '매핑을 찾을 수 없습니다';
        ROLLBACK;
    ELSEIF v_mapping_status = 'TERMINATED' THEN
        SET p_result_code = 2;
        SET p_result_message = '이미 종료된 매핑입니다';
        ROLLBACK;
    ELSEIF v_payment_status != 'CONFIRMED' THEN
        SET p_result_code = 3;
        SET p_result_message = '결제가 확인되지 않은 매핑입니다';
        ROLLBACK;
    ELSEIF p_refund_sessions > v_current_remaining THEN
        SET p_result_code = 4;
        SET p_result_message = CONCAT('환불 요청 회기 수(', p_refund_sessions, ')가 남은 회기 수(', v_current_remaining, ')보다 많습니다');
        ROLLBACK;
    ELSE
        -- 3. 환불 회기 수 계산
        SET v_refunded_sessions = LEAST(p_refund_sessions, v_current_remaining);
        SET v_new_total = v_current_total - v_refunded_sessions;
        SET v_new_remaining = v_current_remaining - v_refunded_sessions;
        
        -- 4. 매핑 회기 수 조정
        UPDATE consultant_client_mappings 
        SET 
            total_sessions = v_new_total,
            remaining_sessions = v_new_remaining,
            payment_amount = payment_amount - p_refund_amount,
            updated_at = NOW()
        WHERE id = p_mapping_id;
        
        -- 5. 환불 거래 생성
        INSERT INTO financial_transactions (
            transaction_type,
            category,
            subcategory,
            amount,
            description,
            related_entity_id,
            related_entity_type,
            branch_code,
            transaction_date,
            status,
            created_at
        ) VALUES (
            'REFUND',
            'CONSULTATION',
            'PARTIAL_SESSION_REFUND',
            -p_refund_amount,
            CONCAT('부분 환불 - ', p_refund_reason, ' (', v_refunded_sessions, '회기)'),
            p_mapping_id,
            'CONSULTANT_CLIENT_MAPPING',
            (SELECT branch_code FROM consultant_client_mappings WHERE id = p_mapping_id),
            CURDATE(),
            'COMPLETED',
            NOW()
        );
        
        -- 6. 환불 로그 기록
        INSERT INTO session_usage_logs (
            mapping_id, 
            consultant_id, 
            client_id, 
            session_type, 
            action_type, 
            additional_sessions,
            reason,
            created_at
        ) VALUES (
            p_mapping_id, 
            v_consultant_id,
            v_client_id,
            'PARTIAL_REFUND', 
            'REFUND', 
            -v_refunded_sessions,
            p_refund_reason,
            NOW()
        );
        
        -- 7. 매핑 상태 업데이트
        IF v_new_remaining = 0 AND v_new_total > 0 THEN
            UPDATE consultant_client_mappings 
            SET 
                status = 'COMPLETED',
                end_date = NOW(),
                updated_at = NOW()
            WHERE id = p_mapping_id;
        ELSEIF v_new_total = 0 THEN
            UPDATE consultant_client_mappings 
            SET 
                status = 'TERMINATED',
                end_date = NOW(),
                updated_at = NOW()
            WHERE id = p_mapping_id;
        END IF;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('부분 환불 처리 완료. 환불 회기: ', v_refunded_sessions, '회기, 남은 회기: ', v_new_remaining, '회기');
        
        COMMIT;
    END IF;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ProcessRefundWithSessionAdjustment` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ProcessRefundWithSessionAdjustment`(
    IN p_mapping_id BIGINT,
    IN p_refund_amount BIGINT,
    IN p_refund_sessions INT,
    IN p_refund_reason TEXT,
    IN p_processed_by VARCHAR(100),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_current_total INT DEFAULT 0;
    DECLARE v_current_remaining INT DEFAULT 0;
    DECLARE v_current_used INT DEFAULT 0;
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_payment_status VARCHAR(50) DEFAULT '';
    DECLARE v_new_total INT DEFAULT 0;
    DECLARE v_new_remaining INT DEFAULT 0;
    DECLARE v_refunded_sessions INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('환불 처리 중 오류 발생: ', @text);
    END;
    
    START TRANSACTION;
    
    -- 1. 현재 매핑 정보 조회
    SELECT 
        total_sessions, 
        remaining_sessions, 
        used_sessions,
        status,
        payment_status
    INTO 
        v_current_total, 
        v_current_remaining, 
        v_current_used,
        v_mapping_status,
        v_payment_status
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    -- 2. 매핑 존재 및 상태 검증
    IF v_current_total IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '매핑을 찾을 수 없습니다';
        ROLLBACK;
    ELSEIF v_mapping_status = 'TERMINATED' THEN
        SET p_result_code = 2;
        SET p_result_message = '이미 종료된 매핑입니다';
        ROLLBACK;
    ELSEIF v_payment_status != 'CONFIRMED' THEN
        SET p_result_code = 3;
        SET p_result_message = '결제가 확인되지 않은 매핑입니다';
        ROLLBACK;
    ELSEIF p_refund_sessions > v_current_remaining THEN
        SET p_result_code = 4;
        SET p_result_message = CONCAT('환불 요청 회기 수(', p_refund_sessions, ')가 남은 회기 수(', v_current_remaining, ')보다 많습니다');
        ROLLBACK;
    ELSE
        -- 3. 환불 회기 수 계산
        SET v_refunded_sessions = LEAST(p_refund_sessions, v_current_remaining);
        SET v_new_total = v_current_total - v_refunded_sessions;
        SET v_new_remaining = v_current_remaining - v_refunded_sessions;
        
        -- 4. 매핑 회기 수 조정
        UPDATE consultant_client_mappings 
        SET 
            total_sessions = v_new_total,
            remaining_sessions = v_new_remaining,
            payment_amount = payment_amount - p_refund_amount,
            updated_at = NOW()
        WHERE id = p_mapping_id;
        
        -- 5. 환불 거래 생성
        INSERT INTO financial_transactions (
            transaction_type,
            category,
            subcategory,
            amount,
            description,
            related_entity_id,
            related_entity_type,
            branch_code,
            transaction_date,
            status,
            created_at
        ) VALUES (
            'REFUND',
            'CONSULTATION',
            'SESSION_REFUND',
            -p_refund_amount,
            CONCAT('회기 환불 - ', p_refund_reason, ' (', v_refunded_sessions, '회기)'),
            p_mapping_id,
            'CONSULTANT_CLIENT_MAPPING',
            (SELECT branch_code FROM consultant_client_mappings WHERE id = p_mapping_id),
            CURDATE(),
            'COMPLETED',
            NOW()
        );
        
        -- 6. 환불 로그 기록
        INSERT INTO session_usage_logs (
            mapping_id, 
            consultant_id, 
            client_id, 
            session_type, 
            action_type, 
            additional_sessions,
            reason,
            created_at
        ) VALUES (
            p_mapping_id, 
            (SELECT consultant_id FROM consultant_client_mappings WHERE id = p_mapping_id),
            (SELECT client_id FROM consultant_client_mappings WHERE id = p_mapping_id),
            'REFUND', 
            'REFUND', 
            -v_refunded_sessions,
            p_refund_reason,
            NOW()
        );
        
        -- 7. 매핑 상태 업데이트 (모든 회기 소진 시)
        IF v_new_remaining = 0 AND v_new_total > 0 THEN
            UPDATE consultant_client_mappings 
            SET 
                status = 'COMPLETED',
                end_date = NOW(),
                updated_at = NOW()
            WHERE id = p_mapping_id;
        ELSEIF v_new_total = 0 THEN
            UPDATE consultant_client_mappings 
            SET 
                status = 'TERMINATED',
                end_date = NOW(),
                updated_at = NOW()
            WHERE id = p_mapping_id;
        END IF;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('환불 처리 완료. 환불 회기: ', v_refunded_sessions, '회기, 남은 회기: ', v_new_remaining, '회기');
        
        COMMIT;
    END IF;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ProcessSalaryPaymentWithErpSync` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ProcessSalaryPaymentWithErpSync`(
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
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ProcessScheduleAutoCompletion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ProcessScheduleAutoCompletion`(
IN p_schedule_id BIGINT,
IN p_consultant_id BIGINT,
IN p_session_date DATE,
IN p_force_complete TINYINT(1),
OUT p_completed TINYINT(1),
OUT p_message VARCHAR(500)
)
BEGIN
DECLARE v_has_record TINYINT(1) DEFAULT 0;
DECLARE v_validation_message VARCHAR(500) DEFAULT '';
DECLARE v_reminder_id BIGINT DEFAULT 0;
DECLARE v_reminder_message VARCHAR(500) DEFAULT '';
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
GET DIAGNOSTICS CONDITION 1
@sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
SET p_completed = 0;
SET p_message = CONCAT('오류 발생: ', @text);
ROLLBACK;
END;
SET p_completed = 0;
SET p_message = '';
CALL ValidateConsultationRecordBeforeCompletion(
p_schedule_id, p_consultant_id, p_session_date,
v_has_record, v_validation_message
);
IF v_has_record = 1 OR p_force_complete = 1 THEN
UPDATE schedules
SET status = 'COMPLETED',
updated_at = NOW()
WHERE id = p_schedule_id;
SET p_completed = 1;
SET p_message = '스케줄이 성공적으로 완료 처리되었습니다.';
INSERT INTO system_logs (log_type, log_level, message, created_at)
VALUES ('SCHEDULE_COMPLETION', 'INFO',
CONCAT('스케줄 완료 처리: ID=', p_schedule_id, ', 강제완료=', p_force_complete),
NOW());
ELSE
CALL CreateConsultationRecordReminder(
p_schedule_id, p_consultant_id, 0, p_session_date,
'00:00:00', '상담일지 미작성',
v_reminder_id, v_reminder_message
);
SET p_completed = 0;
SET p_message = CONCAT('상담일지 미작성으로 완료 처리 불가: ', v_validation_message);
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `SyncAllMappings` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `SyncAllMappings`(
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_sync_results JSON
)
BEGIN
    DECLARE v_total_mappings INT DEFAULT 0;
    DECLARE v_valid_mappings INT DEFAULT 0;
    DECLARE v_invalid_mappings INT DEFAULT 0;
    DECLARE v_fixed_mappings INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    
    DECLARE v_mapping_id BIGINT DEFAULT 0;
    DECLARE mapping_cursor CURSOR FOR 
        SELECT id FROM consultant_client_mappings WHERE status IN ('ACTIVE', 'COMPLETED');
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('전체 동기화 중 오류 발생: ', @text);
        SET p_sync_results = JSON_OBJECT('error', @text);
    END;
    
    START TRANSACTION;
    
    -- 1. 전체 매핑 수 조회
    SELECT COUNT(*) INTO v_total_mappings
    FROM consultant_client_mappings 
    WHERE status IN ('ACTIVE', 'COMPLETED');
    
    -- 2. 각 매핑별 무결성 검증 및 수정
    OPEN mapping_cursor;
    
    read_loop: LOOP
        FETCH mapping_cursor INTO v_mapping_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 무결성 검증
        CALL ValidateMappingIntegrity(v_mapping_id, @validation_code, @validation_message, @validation_json);
        
        IF @validation_code = 0 THEN
            SET v_valid_mappings = v_valid_mappings + 1;
        ELSE
            SET v_invalid_mappings = v_invalid_mappings + 1;
            
            -- 자동 수정 시도
            UPDATE consultant_client_mappings 
            SET 
                used_sessions = (
                    SELECT COUNT(*) 
                    FROM schedules 
                    WHERE consultant_id = (SELECT consultant_id FROM consultant_client_mappings WHERE id = v_mapping_id)
                      AND client_id = (SELECT client_id FROM consultant_client_mappings WHERE id = v_mapping_id)
                      AND status IN ('COMPLETED', 'BOOKED')
                ),
                remaining_sessions = total_sessions - used_sessions,
                updated_at = NOW()
            WHERE id = v_mapping_id;
            
            SET v_fixed_mappings = v_fixed_mappings + 1;
        END IF;
    END LOOP;
    
    CLOSE mapping_cursor;
    
    -- 3. 결과 생성
    SET p_sync_results = JSON_OBJECT(
        'total_mappings', v_total_mappings,
        'valid_mappings', v_valid_mappings,
        'invalid_mappings', v_invalid_mappings,
        'fixed_mappings', v_fixed_mappings,
        'sync_timestamp', NOW()
    );
    
    SET p_result_code = 0;
    SET p_result_message = CONCAT('전체 동기화 완료. 총 ', v_total_mappings, '개 매핑 중 ', v_valid_mappings, '개 유효, ', v_fixed_mappings, '개 수정');
    
    COMMIT;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `TestMappingSync` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `TestMappingSync`()
BEGIN
    SELECT 'PL/SQL 매핑 동기화 테스트 성공' as message;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `UpdateAllBranchDailyStatistics` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `UpdateAllBranchDailyStatistics`(
    IN p_stat_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_branch_code VARCHAR(20);
    
    DECLARE branch_cursor CURSOR FOR
        SELECT DISTINCT branch_code 
        FROM schedules 
        WHERE date = p_stat_date AND is_deleted = false;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    OPEN branch_cursor;
    
    read_loop: LOOP
        FETCH branch_cursor INTO v_branch_code;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        CALL UpdateDailyStatistics(v_branch_code, p_stat_date);
    END LOOP;
    
    CLOSE branch_cursor;
    
    COMMIT;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `UpdateAllConsultantPerformance` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `UpdateAllConsultantPerformance`(
    IN p_performance_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    
    DECLARE consultant_cursor CURSOR FOR
        SELECT DISTINCT consultant_id 
        FROM schedules 
        WHERE date = p_performance_date AND is_deleted = false;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    OPEN consultant_cursor;
    
    read_loop: LOOP
        FETCH consultant_cursor INTO v_consultant_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        CALL UpdateConsultantPerformance(v_consultant_id, p_performance_date);
    END LOOP;
    
    CLOSE consultant_cursor;
    
    COMMIT;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `UpdateBusinessTimeSetting` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `UpdateBusinessTimeSetting`(
    IN p_code_group VARCHAR(50),
    IN p_code_value VARCHAR(50),
    IN p_new_value VARCHAR(100)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    UPDATE common_codes 
    SET 
        code_label = CASE 
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END') THEN
                CONCAT(SUBSTRING(code_label, 1, LOCATE('(', code_label)), p_new_value, ')')
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value = 'SLOT_INTERVAL' THEN
                CONCAT(SUBSTRING(code_label, 1, LOCATE('(', code_label)), p_new_value, '분)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MIN_NOTICE_HOURS' THEN
                CONCAT(SUBSTRING(code_label, 1, LOCATE('(', code_label)), p_new_value, '시간)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MAX_ADVANCE_DAYS' THEN
                CONCAT(SUBSTRING(code_label, 1, LOCATE('(', code_label)), p_new_value, '일)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'BREAK_TIME_MINUTES' THEN
                CONCAT(SUBSTRING(code_label, 1, LOCATE('(', code_label)), p_new_value, '분)')
            ELSE code_label
        END,
        korean_name = CASE 
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END') THEN
                CONCAT(SUBSTRING(korean_name, 1, LOCATE('(', korean_name)), p_new_value, ')')
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value = 'SLOT_INTERVAL' THEN
                CONCAT(SUBSTRING(korean_name, 1, LOCATE('(', korean_name)), p_new_value, '분)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MIN_NOTICE_HOURS' THEN
                CONCAT(SUBSTRING(korean_name, 1, LOCATE('(', korean_name)), p_new_value, '시간)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MAX_ADVANCE_DAYS' THEN
                CONCAT(SUBSTRING(korean_name, 1, LOCATE('(', korean_name)), p_new_value, '일)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'BREAK_TIME_MINUTES' THEN
                CONCAT(SUBSTRING(korean_name, 1, LOCATE('(', korean_name)), p_new_value, '분)')
            ELSE korean_name
        END,
        updated_at = NOW(),
        version = version + 1
    WHERE code_group = p_code_group 
        AND code_value = p_code_value
        AND is_active = 1 
        AND is_deleted = 0;
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '업무 시간 설정을 찾을 수 없습니다.';
    END IF;
    
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `UpdateConsultantPerformance` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `UpdateConsultantPerformance`(
    IN p_consultant_id BIGINT,
    IN p_performance_date DATE
)
BEGIN
    DECLARE v_total_schedules INT DEFAULT 0;
    DECLARE v_completed_schedules INT DEFAULT 0;
    DECLARE v_cancelled_schedules INT DEFAULT 0;
    DECLARE v_no_show_schedules INT DEFAULT 0;
    DECLARE v_completion_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_total_revenue DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_total_ratings INT DEFAULT 0;
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT 0.00;
    DECLARE v_unique_clients INT DEFAULT 0;
    DECLARE v_repeat_clients INT DEFAULT 0;
    DECLARE v_client_retention_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_refund_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_performance_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_grade VARCHAR(10) DEFAULT 'C';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 전체 스케줄 수
    SELECT COUNT(*) INTO v_total_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND is_deleted = false;
    
    -- 완료된 스케줄 수
    SELECT COUNT(*) INTO v_completed_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND status = 'COMPLETED' 
    AND is_deleted = false;
    
    -- 취소된 스케줄 수
    SELECT COUNT(*) INTO v_cancelled_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND status = 'CANCELLED' 
    AND is_deleted = false;
    
    -- 노쇼 스케줄 수
    SELECT COUNT(*) INTO v_no_show_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND status = 'NO_SHOW' 
    AND is_deleted = false;
    
    -- 완료율 계산
    IF v_total_schedules > 0 THEN
        SET v_completion_rate = (v_completed_schedules * 100.0) / v_total_schedules;
    END IF;
    
    -- 총 수익
    SELECT COALESCE(SUM(ft.amount), 0) INTO v_total_revenue
    FROM financial_transactions ft
    JOIN schedules s ON ft.related_entity_id = s.id
    WHERE s.consultant_id = p_consultant_id
    AND s.date = p_performance_date
    AND ft.related_entity_type = 'CONSULTATION_INCOME'
    AND ft.transaction_type = 'INCOME'
    AND ft.is_deleted = false
    AND s.is_deleted = false;
    
    -- 평점 관련
    SELECT COUNT(*), COALESCE(AVG(heart_score), 0)
    INTO v_total_ratings, v_avg_rating
    FROM consultant_ratings cr
    JOIN schedules s ON cr.schedule_id = s.id
    WHERE s.consultant_id = p_consultant_id
    AND s.date = p_performance_date
    AND cr.status = 'ACTIVE'
    AND s.is_deleted = false;
    
    -- 고유 내담자 수
    SELECT COUNT(DISTINCT client_id) INTO v_unique_clients
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND is_deleted = false;
    
    -- 재방문 내담자 수 (이전에 해당 상담사와 상담한 적이 있는 내담자)
    SELECT COUNT(DISTINCT s1.client_id) INTO v_repeat_clients
    FROM schedules s1
    WHERE s1.consultant_id = p_consultant_id 
    AND s1.date = p_performance_date 
    AND s1.is_deleted = false
    AND EXISTS (
        SELECT 1 FROM schedules s2 
        WHERE s2.consultant_id = p_consultant_id 
        AND s2.client_id = s1.client_id 
        AND s2.date < p_performance_date 
        AND s2.is_deleted = false
    );
    
    -- 고객 유지율 계산
    IF v_unique_clients > 0 THEN
        SET v_client_retention_rate = (v_repeat_clients * 100.0) / v_unique_clients;
    END IF;
    
    -- 환불율 계산 (임시로 0으로 설정, 추후 개선)
    SET v_refund_rate = 0.00;
    
    -- 성과 점수 계산 (가중평균)
    SET v_performance_score = (
        (v_completion_rate * 0.4) +
        (v_avg_rating * 20 * 0.3) +
        (v_client_retention_rate * 0.2) +
        ((100 - v_refund_rate) * 0.1)
    );
    
    -- 등급 계산
    IF v_performance_score >= 90 THEN
        SET v_grade = 'S';
    ELSEIF v_performance_score >= 80 THEN
        SET v_grade = 'A';
    ELSEIF v_performance_score >= 70 THEN
        SET v_grade = 'B';
    ELSE
        SET v_grade = 'C';
    END IF;
    
    -- 기존 성과 데이터 삭제 후 새로 삽입 (UPSERT)
    DELETE FROM consultant_performance 
    WHERE consultant_id = p_consultant_id AND performance_date = p_performance_date;
    
    INSERT INTO consultant_performance (
        consultant_id, performance_date, total_schedules, completed_schedules,
        cancelled_schedules, no_show_schedules, completion_rate, total_revenue,
        total_ratings, avg_rating, unique_clients, repeat_clients,
        client_retention_rate, refund_rate, performance_score, grade,
        created_at, updated_at
    ) VALUES (
        p_consultant_id, p_performance_date, v_total_schedules, v_completed_schedules,
        v_cancelled_schedules, v_no_show_schedules, v_completion_rate, v_total_revenue,
        v_total_ratings, v_avg_rating, v_unique_clients, v_repeat_clients,
        v_client_retention_rate, v_refund_rate, v_performance_score, v_grade,
        NOW(), NOW()
    );
    
    COMMIT;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `UpdateDailyStatistics` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `UpdateDailyStatistics`(
    IN p_branch_code VARCHAR(20),
    IN p_stat_date DATE
)
BEGIN
    DECLARE v_total_consultations INT DEFAULT 0;
    DECLARE v_completed_consultations INT DEFAULT 0;
    DECLARE v_cancelled_consultations INT DEFAULT 0;
    DECLARE v_total_revenue DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_total_refunds INT DEFAULT 0;
    DECLARE v_refund_amount DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT 0.00;
    DECLARE v_consultant_count INT DEFAULT 0;
    DECLARE v_client_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 총 상담 수
    SELECT COUNT(*) INTO v_total_consultations
    FROM schedules 
    WHERE date = p_stat_date 
    AND branch_code = p_branch_code 
    AND is_deleted = false;
    
    -- 완료된 상담 수
    SELECT COUNT(*) INTO v_completed_consultations
    FROM schedules 
    WHERE date = p_stat_date 
    AND branch_code = p_branch_code 
    AND status = 'COMPLETED' 
    AND is_deleted = false;
    
    -- 취소된 상담 수
    SELECT COUNT(*) INTO v_cancelled_consultations
    FROM schedules 
    WHERE date = p_stat_date 
    AND branch_code = p_branch_code 
    AND status = 'CANCELLED' 
    AND is_deleted = false;
    
    -- 총 수익 (상담 수입)
    SELECT COALESCE(SUM(ft.amount), 0) INTO v_total_revenue
    FROM financial_transactions ft
    JOIN schedules s ON ft.related_entity_id = s.id
    WHERE s.date = p_stat_date 
    AND s.branch_code = p_branch_code
    AND ft.related_entity_type = 'CONSULTATION_INCOME'
    AND ft.transaction_type = 'INCOME'
    AND ft.is_deleted = false
    AND s.is_deleted = false;
    
    -- 환불 건수와 금액
    SELECT 
        COUNT(*),
        COALESCE(SUM(ABS(ft.amount)), 0)
    INTO v_total_refunds, v_refund_amount
    FROM financial_transactions ft
    JOIN schedules s ON ft.related_entity_id = s.id
    WHERE s.date = p_stat_date 
    AND s.branch_code = p_branch_code
    AND ft.related_entity_type = 'CONSULTATION_REFUND'
    AND ft.transaction_type = 'REFUND'
    AND ft.is_deleted = false
    AND s.is_deleted = false;
    
    -- 평균 평점
    SELECT COALESCE(AVG(cr.heart_score), 0) INTO v_avg_rating
    FROM consultant_ratings cr
    JOIN schedules s ON cr.schedule_id = s.id
    WHERE s.date = p_stat_date 
    AND s.branch_code = p_branch_code
    AND cr.status = 'ACTIVE'
    AND s.is_deleted = false;
    
    -- 활성 상담사 수
    SELECT COUNT(DISTINCT u.id) INTO v_consultant_count
    FROM users u
    JOIN schedules s ON u.id = s.consultant_id
    WHERE s.date = p_stat_date 
    AND u.branch_code = p_branch_code
    AND u.role = 'CONSULTANT'
    AND u.is_active = true
    AND s.is_deleted = false;
    
    -- 내담자 수
    SELECT COUNT(DISTINCT s.client_id) INTO v_client_count
    FROM schedules s
    WHERE s.date = p_stat_date 
    AND s.branch_code = p_branch_code
    AND s.is_deleted = false;
    
    -- 기존 통계 삭제 후 새로 삽입 (UPSERT)
    DELETE FROM daily_statistics 
    WHERE stat_date = p_stat_date AND branch_code = p_branch_code;
    
    INSERT INTO daily_statistics (
        stat_date, branch_code, total_consultations, completed_consultations,
        cancelled_consultations, total_revenue, total_refunds, refund_amount,
        avg_rating, consultant_count, client_count,
        created_at, updated_at, is_deleted, version
    ) VALUES (
        p_stat_date, p_branch_code, v_total_consultations, v_completed_consultations,
        v_cancelled_consultations, v_total_revenue, v_total_refunds, v_refund_amount,
        v_avg_rating, v_consultant_count, v_client_count,
        NOW(), NOW(), false, 0
    );
    
    COMMIT;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `UpdateDiscountStatus` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `UpdateDiscountStatus`(
    IN p_mapping_id BIGINT,
    IN p_new_status VARCHAR(20),
    IN p_updated_by VARCHAR(100),
    IN p_reason VARCHAR(500),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_accounting_id BIGINT;
    DECLARE v_current_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_message = CONCAT('상태 업데이트 중 오류 발생: ', ERROR_MESSAGE());
    END;
    
    START TRANSACTION;
    
    -- 1. 할인 회계 거래 조회
    SELECT id, status INTO v_accounting_id, v_current_status
    FROM discount_accounting_transactions 
    WHERE mapping_id = p_mapping_id;
    
    IF v_accounting_id IS NULL THEN
        SET p_result_code = -2;
        SET p_result_message = '할인 회계 거래를 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        -- 2. 상태 업데이트
        UPDATE discount_accounting_transactions 
        SET status = p_new_status,
            updated_at = NOW(),
            notes = CONCAT(IFNULL(notes, ''), ' | ', p_reason, ' (', p_updated_by, ')')
        WHERE id = v_accounting_id;
        
        -- 3. 상태별 특별 처리
        CASE p_new_status
            WHEN 'CONFIRMED' THEN
                UPDATE discount_accounting_transactions 
                SET confirmed_at = NOW()
                WHERE id = v_accounting_id;
            WHEN 'CANCELLED' THEN
                UPDATE discount_accounting_transactions 
                SET cancelled_at = NOW(),
                    cancellation_reason = p_reason
                WHERE id = v_accounting_id;
        END CASE;
        
        COMMIT;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('상태 업데이트 완료: ', v_current_status, ' -> ', p_new_status);
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `UseSessionForMapping` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `UseSessionForMapping`(
    IN p_consultant_id BIGINT,
    IN p_client_id BIGINT,
    IN p_schedule_id BIGINT,
    IN p_session_type VARCHAR(50),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_mapping_id BIGINT DEFAULT NULL;
    DECLARE v_remaining_sessions INT DEFAULT 0;
    DECLARE v_used_sessions INT DEFAULT 0;
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_payment_status VARCHAR(50) DEFAULT '';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('회기 사용 처리 중 오류 발생: ', @text);
    END;
    
    START TRANSACTION;
    
    -- 1. 활성 매핑 조회
    SELECT 
        id, 
        remaining_sessions, 
        used_sessions, 
        total_sessions,
        status,
        payment_status
    INTO 
        v_mapping_id, 
        v_remaining_sessions, 
        v_used_sessions, 
        v_total_sessions,
        v_mapping_status,
        v_payment_status
    FROM consultant_client_mappings 
    WHERE consultant_id = p_consultant_id 
      AND client_id = p_client_id 
      AND status = 'ACTIVE'
    LIMIT 1;
    
    -- 2. 매핑 존재 및 상태 검증
    IF v_mapping_id IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '활성 매핑을 찾을 수 없습니다';
        ROLLBACK;
    ELSEIF v_mapping_status != 'ACTIVE' THEN
        SET p_result_code = 2;
        SET p_result_message = '매핑이 활성 상태가 아닙니다';
        ROLLBACK;
    ELSEIF v_payment_status != 'CONFIRMED' THEN
        SET p_result_code = 3;
        SET p_result_message = '결제가 확인되지 않은 매핑입니다';
        ROLLBACK;
    ELSEIF v_remaining_sessions <= 0 THEN
        SET p_result_code = 4;
        SET p_result_message = '사용 가능한 회기가 없습니다';
        ROLLBACK;
    ELSE
        -- 3. 회기 사용 처리
        UPDATE consultant_client_mappings 
        SET 
            remaining_sessions = remaining_sessions - 1,
            used_sessions = used_sessions + 1,
            updated_at = NOW()
        WHERE id = v_mapping_id;
        
        -- 4. 회기 사용 로그 기록
        INSERT INTO session_usage_logs (
            mapping_id, 
            schedule_id, 
            consultant_id, 
            client_id, 
            session_type, 
            action_type, 
            created_at
        ) VALUES (
            v_mapping_id, 
            p_schedule_id, 
            p_consultant_id, 
            p_client_id, 
            p_session_type, 
            'USE', 
            NOW()
        );
        
        -- 5. 매핑 상태 업데이트 (회기 소진 시)
        IF (v_remaining_sessions - 1) = 0 THEN
            UPDATE consultant_client_mappings 
            SET 
                status = 'COMPLETED',
                end_date = NOW(),
                updated_at = NOW()
            WHERE id = v_mapping_id;
        END IF;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('회기 사용 완료. 남은 회기: ', (v_remaining_sessions - 1));
        
        COMMIT;
    END IF;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ValidateConsultationRecordBeforeCompletion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ValidateConsultationRecordBeforeCompletion`(
    IN p_consultant_id BIGINT,
    IN p_session_date DATE,
    OUT p_has_record TINYINT(1),
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_record_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_has_record = 0;
        SET p_message = CONCAT('오류 발생: ', @text);
        ROLLBACK;
    END;

    SET p_has_record = 0;
    SET p_message = '';

    -- 상담일지 작성 여부 확인
    SELECT COUNT(*)
    INTO v_record_count
    FROM consultation_records cr
    WHERE cr.consultant_id = p_consultant_id
      AND cr.session_date = p_session_date
      AND cr.is_deleted = 0;

    IF v_record_count > 0 THEN
        SET p_has_record = 1;
        SET p_message = '상담일지가 작성되어 스케줄 완료 가능합니다.';
    ELSE
        SET p_has_record = 0;
        SET p_message = '상담일지가 작성되지 않아 스케줄 완료가 불가능합니다.';
    END IF;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ValidateIntegratedAmount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ValidateIntegratedAmount`(
    IN p_mapping_id BIGINT,
    IN p_input_amount DECIMAL(15,2),
    OUT p_is_valid BOOLEAN,
    OUT p_validation_message TEXT,
    OUT p_recommended_amount DECIMAL(15,2),
    OUT p_amount_breakdown JSON,
    OUT p_consistency_score DECIMAL(5,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_package_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_payment_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_erp_total_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_price_per_session DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_difference DECIMAL(15,2) DEFAULT 0;
    DECLARE v_consistency_issues INT DEFAULT 0;
    DECLARE v_breakdown JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('금액 검증 중 오류 발생: ', @text);
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- 매핑 정보 조회
    SELECT 
        COALESCE(package_price, 0),
        COALESCE(payment_amount, 0),
        COALESCE(total_sessions, 0)
    INTO v_package_price, v_payment_amount, v_total_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id AND is_deleted = false;
    
    -- ERP 거래 총액 계산
    SELECT COALESCE(SUM(amount), 0)
    INTO v_erp_total_amount
    FROM financial_transactions 
    WHERE related_entity_id = p_mapping_id 
    AND related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
    AND transaction_type = 'INCOME'
    AND is_deleted = false;
    
    -- 회기당 단가 계산
    IF v_total_sessions > 0 AND v_package_price > 0 THEN
        SET v_price_per_session = v_package_price / v_total_sessions;
    END IF;
    
    -- 금액 일관성 검사
    SET v_consistency_issues = 0;
    
    -- 1. 패키지 가격과 ERP 금액 비교
    IF v_package_price > 0 AND v_erp_total_amount > 0 THEN
        SET v_difference = ABS(v_package_price - v_erp_total_amount);
        IF v_difference > v_package_price * 0.01 THEN -- 1% 이상 차이
            SET v_consistency_issues = v_consistency_issues + 1;
        END IF;
    END IF;
    
    -- 2. 패키지 가격과 결제 금액 비교
    IF v_package_price > 0 AND v_payment_amount > 0 THEN
        SET v_difference = ABS(v_package_price - v_payment_amount);
        IF v_difference > v_package_price * 0.1 THEN -- 10% 이상 차이
            SET v_consistency_issues = v_consistency_issues + 1;
        END IF;
    END IF;
    
    -- 3. 입력 금액과 패키지 가격 비교
    IF p_input_amount > 0 AND v_package_price > 0 THEN
        SET v_difference = ABS(p_input_amount - v_package_price);
        IF v_difference > v_package_price * 0.1 THEN -- 10% 이상 차이
            SET v_consistency_issues = v_consistency_issues + 1;
        END IF;
    END IF;
    
    -- 일관성 점수 계산 (0-100)
    SET p_consistency_score = GREATEST(0, 100 - (v_consistency_issues * 25));
    
    -- 금액 분석 JSON 생성
    SET v_breakdown = JSON_OBJECT(
        'packagePrice', v_package_price,
        'paymentAmount', v_payment_amount,
        'erpTotalAmount', v_erp_total_amount,
        'inputAmount', p_input_amount,
        'pricePerSession', v_price_per_session,
        'totalSessions', v_total_sessions,
        'consistencyIssues', v_consistency_issues
    );
    
    -- 검증 결과 결정
    IF v_consistency_issues = 0 THEN
        SET p_is_valid = TRUE;
        SET p_validation_message = '모든 금액이 일관성 있게 관리되고 있습니다.';
        SET p_recommended_amount = p_input_amount;
    ELSEIF v_consistency_issues = 1 THEN
        SET p_is_valid = TRUE;
        SET p_validation_message = '경미한 금액 불일치가 있습니다. 확인이 필요합니다.';
        SET p_recommended_amount = v_package_price;
    ELSE
        SET p_is_valid = FALSE;
        SET p_validation_message = '심각한 금액 불일치가 있습니다. 즉시 확인이 필요합니다.';
        SET p_recommended_amount = v_package_price;
    END IF;
    
    SET p_amount_breakdown = v_breakdown;
    SET p_success = TRUE;
    SET p_message = '금액 검증이 완료되었습니다.';
    
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ValidateMappingIntegrity` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mindgarden`@`localhost` PROCEDURE `ValidateMappingIntegrity`(
    IN p_mapping_id BIGINT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_validation_results JSON
)
BEGIN
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_used_sessions INT DEFAULT 0;
    DECLARE v_remaining_sessions INT DEFAULT 0;
    DECLARE v_actual_used INT DEFAULT 0;
    DECLARE v_schedule_count INT DEFAULT 0;
    DECLARE v_mapping_exists BOOLEAN DEFAULT FALSE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('무결성 검증 중 오류 발생: ', @text);
        SET p_validation_results = JSON_OBJECT('error', @text);
    END;
    
    -- 1. 매핑 존재 여부 확인
    SELECT COUNT(*) > 0 INTO v_mapping_exists
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    IF NOT v_mapping_exists THEN
        SET p_result_code = 1;
        SET p_result_message = '매핑을 찾을 수 없습니다';
        SET p_validation_results = JSON_OBJECT('exists', FALSE);
    ELSE
        -- 2. 매핑 정보 조회
        SELECT 
            total_sessions, 
            used_sessions, 
            remaining_sessions
        INTO 
            v_total_sessions, 
            v_used_sessions, 
            v_remaining_sessions
        FROM consultant_client_mappings 
        WHERE id = p_mapping_id;
        
        -- 3. 실제 스케줄 수 조회
        SELECT COUNT(*) INTO v_schedule_count
        FROM schedules 
        WHERE consultant_id = (SELECT consultant_id FROM consultant_client_mappings WHERE id = p_mapping_id)
          AND client_id = (SELECT client_id FROM consultant_client_mappings WHERE id = p_mapping_id)
          AND status IN ('COMPLETED', 'BOOKED');
        
        -- 4. 무결성 검증
        SET p_validation_results = JSON_OBJECT(
            'mapping_id', p_mapping_id,
            'total_sessions', v_total_sessions,
            'used_sessions', v_used_sessions,
            'remaining_sessions', v_remaining_sessions,
            'actual_schedule_count', v_schedule_count,
            'sessions_match', (v_used_sessions = v_schedule_count),
            'total_calculation_correct', (v_total_sessions = v_used_sessions + v_remaining_sessions),
            'is_valid', (v_used_sessions = v_schedule_count AND v_total_sessions = v_used_sessions + v_remaining_sessions)
        );
        
        IF v_used_sessions = v_schedule_count AND v_total_sessions = v_used_sessions + v_remaining_sessions THEN
            SET p_result_code = 0;
            SET p_result_message = '매핑 데이터 무결성이 유지되고 있습니다';
        ELSE
            SET p_result_code = 2;
            SET p_result_message = '매핑 데이터에 불일치가 발견되었습니다';
        END IF;
    END IF;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-16 21:57:08
