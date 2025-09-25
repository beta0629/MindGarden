-- =====================================================
-- 예산 관리 PL/SQL 프로시저
-- 예산 설정, 사용량 추적, 초과 알림, 통계 생성
-- =====================================================

DELIMITER //

-- 문자셋 설정
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- 1. 예산 설정 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS CreateBudget//
CREATE PROCEDURE CreateBudget(
    IN p_branch_code VARCHAR(20),
    IN p_category VARCHAR(100),
    IN p_total_budget DECIMAL(15,2),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_created_by VARCHAR(100),
    OUT p_budget_id BIGINT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_existing_budget INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('예산 생성 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 기존 예산 확인
    SELECT COUNT(*) INTO v_existing_budget
    FROM financial_transactions 
    WHERE branch_code = p_branch_code 
    AND category = p_category
    AND transaction_type = 'INCOME'
    AND transaction_date BETWEEN p_start_date AND p_end_date
    AND is_deleted = FALSE;
    
    IF v_existing_budget > 0 THEN
        SET p_success = FALSE;
        SET p_message = '해당 기간에 이미 예산이 설정되어 있습니다.';
        ROLLBACK;
    ELSE
        -- 예산 거래 생성
        INSERT INTO financial_transactions (
            transaction_type, category, subcategory, amount, description,
            transaction_date, branch_code, status, created_at, updated_at, is_deleted
        ) VALUES (
            'INCOME', p_category, 'BUDGET_ALLOCATION', p_total_budget, 
            CONCAT('예산 할당: ', p_category, ' (', p_start_date, ' ~ ', p_end_date, ')'),
            p_start_date, p_branch_code, 'APPROVED', NOW(), NOW(), FALSE
        );
        
        SET p_budget_id = LAST_INSERT_ID();
        SET p_success = TRUE;
        SET p_message = '예산이 성공적으로 생성되었습니다.';
        
        COMMIT;
    END IF;
    
END//

-- =====================================================
-- 2. 예산 사용량 추적 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS TrackBudgetUsage//
CREATE PROCEDURE TrackBudgetUsage(
    IN p_branch_code VARCHAR(20),
    IN p_category VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_budget DECIMAL(15,2),
    OUT p_used_budget DECIMAL(15,2),
    OUT p_remaining_budget DECIMAL(15,2),
    OUT p_usage_percentage DECIMAL(5,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('예산 사용량 추적 중 오류 발생: ', v_error_message);
    END;
    
    -- 총 예산 조회
    SELECT COALESCE(SUM(amount), 0) INTO p_total_budget
    FROM financial_transactions 
    WHERE branch_code = p_branch_code 
    AND category = p_category
    AND transaction_type = 'INCOME'
    AND subcategory = 'BUDGET_ALLOCATION'
    AND transaction_date BETWEEN p_start_date AND p_end_date
    AND is_deleted = FALSE;
    
    -- 사용된 예산 조회
    SELECT COALESCE(SUM(amount), 0) INTO p_used_budget
    FROM financial_transactions 
    WHERE branch_code = p_branch_code 
    AND category = p_category
    AND transaction_type = 'EXPENSE'
    AND transaction_date BETWEEN p_start_date AND p_end_date
    AND is_deleted = FALSE;
    
    -- 잔여 예산 계산
    SET p_remaining_budget = p_total_budget - p_used_budget;
    
    -- 사용률 계산
    IF p_total_budget > 0 THEN
        SET p_usage_percentage = (p_used_budget / p_total_budget) * 100;
    ELSE
        SET p_usage_percentage = 0;
    END IF;
    
    SET p_success = TRUE;
    SET p_message = '예산 사용량 추적이 완료되었습니다.';
    
END//

-- =====================================================
-- 3. 예산 초과 알림 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS CheckBudgetOverrun//
CREATE PROCEDURE CheckBudgetOverrun(
    IN p_branch_code VARCHAR(20),
    IN p_category VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_warning_threshold DECIMAL(5,2),
    OUT p_is_overrun BOOLEAN,
    OUT p_overrun_amount DECIMAL(15,2),
    OUT p_usage_percentage DECIMAL(5,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_total_budget DECIMAL(15,2);
    DECLARE v_used_budget DECIMAL(15,2);
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('예산 초과 확인 중 오류 발생: ', v_error_message);
    END;
    
    -- 예산 사용량 조회
    CALL TrackBudgetUsage(p_branch_code, p_category, p_start_date, p_end_date, 
                         v_total_budget, v_used_budget, @remaining, p_usage_percentage, 
                         @success, @message);
    
    -- 초과 여부 확인
    SET p_is_overrun = FALSE;
    SET p_overrun_amount = 0;
    
    IF p_usage_percentage > p_warning_threshold THEN
        SET p_is_overrun = TRUE;
        SET p_overrun_amount = v_used_budget - v_total_budget;
    END IF;
    
    SET p_success = TRUE;
    SET p_message = CONCAT('예산 사용률: ', p_usage_percentage, '%');
    
END//

-- =====================================================
-- 4. 예산 통계 조회 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS GetBudgetStatistics//
CREATE PROCEDURE GetBudgetStatistics(
    IN p_branch_code VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_budgets INT,
    OUT p_total_allocated DECIMAL(15,2),
    OUT p_total_used DECIMAL(15,2),
    OUT p_total_remaining DECIMAL(15,2),
    OUT p_average_usage DECIMAL(5,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('예산 통계 조회 중 오류 발생: ', v_error_message);
    END;
    
    -- 총 예산 수
    SELECT COUNT(DISTINCT category) INTO p_total_budgets
    FROM financial_transactions 
    WHERE branch_code = p_branch_code 
    AND transaction_type = 'INCOME'
    AND subcategory = 'BUDGET_ALLOCATION'
    AND transaction_date BETWEEN p_start_date AND p_end_date
    AND is_deleted = FALSE;
    
    -- 총 할당 예산
    SELECT COALESCE(SUM(amount), 0) INTO p_total_allocated
    FROM financial_transactions 
    WHERE branch_code = p_branch_code 
    AND transaction_type = 'INCOME'
    AND subcategory = 'BUDGET_ALLOCATION'
    AND transaction_date BETWEEN p_start_date AND p_end_date
    AND is_deleted = FALSE;
    
    -- 총 사용 예산
    SELECT COALESCE(SUM(amount), 0) INTO p_total_used
    FROM financial_transactions 
    WHERE branch_code = p_branch_code 
    AND transaction_type = 'EXPENSE'
    AND transaction_date BETWEEN p_start_date AND p_end_date
    AND is_deleted = FALSE;
    
    -- 잔여 예산
    SET p_total_remaining = p_total_allocated - p_total_used;
    
    -- 평균 사용률
    IF p_total_allocated > 0 THEN
        SET p_average_usage = (p_total_used / p_total_allocated) * 100;
    ELSE
        SET p_average_usage = 0;
    END IF;
    
    SET p_success = TRUE;
    SET p_message = '예산 통계 조회가 완료되었습니다.';
    
END//

-- =====================================================
-- 5. 예산 수정 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS UpdateBudget//
CREATE PROCEDURE UpdateBudget(
    IN p_budget_id BIGINT,
    IN p_new_amount DECIMAL(15,2),
    IN p_updated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('예산 수정 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 예산 수정
    UPDATE financial_transactions 
    SET amount = p_new_amount,
        description = CONCAT(description, ' (수정: ', p_updated_by, ')'),
        updated_at = NOW()
    WHERE id = p_budget_id 
    AND transaction_type = 'INCOME'
    AND subcategory = 'BUDGET_ALLOCATION'
    AND is_deleted = FALSE;
    
    IF ROW_COUNT() = 0 THEN
        SET p_success = FALSE;
        SET p_message = '수정할 예산을 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        SET p_success = TRUE;
        SET p_message = '예산이 성공적으로 수정되었습니다.';
        COMMIT;
    END IF;
    
END//

DELIMITER ;
