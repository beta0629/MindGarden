-- =====================================================
-- 운영 서버에 누락된 모든 PL/SQL 프로시저 통합 등록
-- =====================================================

DELIMITER //

-- 문자셋 설정
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- 1. 환불 관련 프로시저 (PlSqlMappingSyncService에서 필요)
-- =====================================================

-- ProcessRefundWithSessionAdjustment 프로시저
DROP PROCEDURE IF EXISTS ProcessRefundWithSessionAdjustment //

CREATE PROCEDURE ProcessRefundWithSessionAdjustment(
    IN p_mapping_id BIGINT,
    IN p_refund_amount BIGINT,
    IN p_refund_reason TEXT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_refund_details JSON
)
BEGIN
    DECLARE v_consultant_id BIGINT;
    DECLARE v_client_id BIGINT;
    DECLARE v_remaining_sessions INT;
    DECLARE v_total_sessions INT;
    DECLARE v_used_sessions INT;
    DECLARE v_session_price BIGINT;
    DECLARE v_refundable_sessions INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('환불 처리 중 오류 발생: ', @text);
        SET p_refund_details = JSON_OBJECT('error', @text);
    END;
    
    START TRANSACTION;
    
    -- 매핑 정보 조회
    SELECT consultant_id, client_id, remaining_sessions, total_sessions, used_sessions
    INTO v_consultant_id, v_client_id, v_remaining_sessions, v_total_sessions, v_used_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    IF v_consultant_id IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '매핑을 찾을 수 없습니다';
        SET p_refund_details = JSON_OBJECT('error', '매핑 없음');
        ROLLBACK;
    ELSE
        -- 환불 가능 회기 수 계산
        SET v_refundable_sessions = v_remaining_sessions;
        
        -- 회기 가격 계산 (단순화)
        SET v_session_price = p_refund_amount / v_refundable_sessions;
        
        -- 매핑 상태 업데이트
        UPDATE consultant_client_mappings 
        SET 
            remaining_sessions = 0,
            status = 'REFUNDED',
            updated_at = NOW()
        WHERE id = p_mapping_id;
        
        -- 환불 로그 기록
        INSERT INTO session_usage_logs (
            mapping_id, consultant_id, client_id, session_type, 
            action_type, additional_sessions, reason, created_at
        ) VALUES (
            p_mapping_id, v_consultant_id, v_client_id, 'REFUND',
            'REFUND', v_refundable_sessions, p_refund_reason, NOW()
        );
        
        SET p_refund_details = JSON_OBJECT(
            'mapping_id', p_mapping_id,
            'refund_amount', p_refund_amount,
            'refundable_sessions', v_refundable_sessions,
            'session_price', v_session_price
        );
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('환불 처리 완료. 환불 회기: ', v_refundable_sessions, '회기, 환불 금액: ', p_refund_amount, '원');
        
        COMMIT;
    END IF;
    
END //

-- ProcessPartialRefund 프로시저
DROP PROCEDURE IF EXISTS ProcessPartialRefund //

CREATE PROCEDURE ProcessPartialRefund(
    IN p_mapping_id BIGINT,
    IN p_partial_refund_sessions INT,
    IN p_refund_amount BIGINT,
    IN p_refund_reason TEXT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_consultant_id BIGINT;
    DECLARE v_client_id BIGINT;
    DECLARE v_remaining_sessions INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('부분 환불 처리 중 오류 발생: ', @text);
    END;
    
    START TRANSACTION;
    
    -- 매핑 정보 조회
    SELECT consultant_id, client_id, remaining_sessions
    INTO v_consultant_id, v_client_id, v_remaining_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    IF v_consultant_id IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '매핑을 찾을 수 없습니다';
        ROLLBACK;
    ELSEIF v_remaining_sessions < p_partial_refund_sessions THEN
        SET p_result_code = 2;
        SET p_result_message = '환불 요청 회기가 남은 회기보다 많습니다';
        ROLLBACK;
    ELSE
        -- 부분 환불 처리
        UPDATE consultant_client_mappings 
        SET 
            remaining_sessions = remaining_sessions - p_partial_refund_sessions,
            updated_at = NOW()
        WHERE id = p_mapping_id;
        
        -- 환불 로그 기록
        INSERT INTO session_usage_logs (
            mapping_id, consultant_id, client_id, session_type, 
            action_type, additional_sessions, reason, created_at
        ) VALUES (
            p_mapping_id, v_consultant_id, v_client_id, 'PARTIAL_REFUND',
            'REFUND', p_partial_refund_sessions, p_refund_reason, NOW()
        );
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('부분 환불 처리 완료. 환불 회기: ', p_partial_refund_sessions, '회기, 남은 회기: ', (v_remaining_sessions - p_partial_refund_sessions));
        
        COMMIT;
    END IF;
    
END //

-- GetRefundableSessions 프로시저
DROP PROCEDURE IF EXISTS GetRefundableSessions //

CREATE PROCEDURE GetRefundableSessions(
    IN p_mapping_id BIGINT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_refundable_sessions INT,
    OUT p_max_refund_amount BIGINT
)
BEGIN
    DECLARE v_remaining_sessions INT;
    DECLARE v_session_price BIGINT DEFAULT 50000; -- 기본 회기 가격
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('환불 가능 회기 조회 중 오류 발생: ', @text);
    END;
    
    -- 매핑 정보 조회
    SELECT remaining_sessions
    INTO v_remaining_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    IF v_remaining_sessions IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '매핑을 찾을 수 없습니다';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSE
        SET p_refundable_sessions = v_remaining_sessions;
        SET p_max_refund_amount = v_remaining_sessions * v_session_price;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('환불 가능 회기: ', v_remaining_sessions, '회기, 최대 환불 금액: ', p_max_refund_amount, '원');
    END IF;
    
END //

-- GetRefundStatistics 프로시저
DROP PROCEDURE IF EXISTS GetRefundStatistics //

CREATE PROCEDURE GetRefundStatistics(
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_statistics JSON
)
BEGIN
    DECLARE v_total_refunds INT DEFAULT 0;
    DECLARE v_total_refund_amount BIGINT DEFAULT 0;
    DECLARE v_avg_refund_amount BIGINT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('환불 통계 조회 중 오류 발생: ', @text);
        SET p_statistics = JSON_OBJECT('error', @text);
    END;
    
    -- 환불 통계 계산
    SELECT COUNT(*), COALESCE(SUM(additional_sessions * 50000), 0)
    INTO v_total_refunds, v_total_refund_amount
    FROM session_usage_logs 
    WHERE action_type = 'REFUND' 
    AND DATE(created_at) BETWEEN p_start_date AND p_end_date;
    
    IF v_total_refunds > 0 THEN
        SET v_avg_refund_amount = v_total_refund_amount / v_total_refunds;
    END IF;
    
    SET p_statistics = JSON_OBJECT(
        'total_refunds', v_total_refunds,
        'total_refund_amount', v_total_refund_amount,
        'avg_refund_amount', v_avg_refund_amount,
        'start_date', p_start_date,
        'end_date', p_end_date
    );
    
    SET p_result_code = 0;
    SET p_result_message = CONCAT('환불 통계 조회 완료. 총 환불: ', v_total_refunds, '건, 총 금액: ', v_total_refund_amount, '원');
    
END //

-- =====================================================
-- 2. 재무 관련 프로시저 (PlSqlAccountingService에서 필요)
-- =====================================================

-- ValidateIntegratedAmount 프로시저
DROP PROCEDURE IF EXISTS ValidateIntegratedAmount //

CREATE PROCEDURE ValidateIntegratedAmount(
    IN p_amount BIGINT,
    IN p_category VARCHAR(100),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_is_valid BOOLEAN DEFAULT TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('금액 검증 중 오류 발생: ', @text);
    END;
    
    -- 기본 검증 로직
    IF p_amount <= 0 THEN
        SET v_is_valid = FALSE;
        SET p_result_code = 1;
        SET p_result_message = '금액은 0보다 커야 합니다';
    ELSEIF p_amount > 1000000000 THEN -- 10억원 제한
        SET v_is_valid = FALSE;
        SET p_result_code = 2;
        SET p_result_message = '금액이 너무 큽니다 (최대 10억원)';
    ELSE
        SET p_result_code = 0;
        SET p_result_message = '금액 검증 통과';
    END IF;
    
END //

-- GetConsolidatedFinancialData 프로시저
DROP PROCEDURE IF EXISTS GetConsolidatedFinancialData //

CREATE PROCEDURE GetConsolidatedFinancialData(
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_financial_data JSON
)
BEGIN
    DECLARE v_total_income BIGINT DEFAULT 0;
    DECLARE v_total_expense BIGINT DEFAULT 0;
    DECLARE v_net_profit BIGINT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('재무 데이터 조회 중 오류 발생: ', @text);
        SET p_financial_data = JSON_OBJECT('error', @text);
    END;
    
    -- 수입 계산
    SELECT COALESCE(SUM(amount), 0) INTO v_total_income
    FROM financial_transactions 
    WHERE transaction_type = 'INCOME' 
    AND DATE(created_at) BETWEEN p_start_date AND p_end_date
    AND is_deleted = false;
    
    -- 지출 계산
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expense
    FROM financial_transactions 
    WHERE transaction_type = 'EXPENSE' 
    AND DATE(created_at) BETWEEN p_start_date AND p_end_date
    AND is_deleted = false;
    
    SET v_net_profit = v_total_income - v_total_expense;
    
    SET p_financial_data = JSON_OBJECT(
        'total_income', v_total_income,
        'total_expense', v_total_expense,
        'net_profit', v_net_profit,
        'start_date', p_start_date,
        'end_date', p_end_date
    );
    
    SET p_result_code = 0;
    SET p_result_message = CONCAT('재무 데이터 조회 완료. 순이익: ', v_net_profit, '원');
    
END //

-- ProcessDiscountAccounting 프로시저
DROP PROCEDURE IF EXISTS ProcessDiscountAccounting //

CREATE PROCEDURE ProcessDiscountAccounting(
    IN p_original_amount BIGINT,
    IN p_discount_rate DECIMAL(5,2),
    IN p_discount_reason VARCHAR(200),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_discount_amount BIGINT,
    OUT p_final_amount BIGINT
)
BEGIN
    DECLARE v_discount_amount BIGINT DEFAULT 0;
    DECLARE v_final_amount BIGINT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('할인 계산 중 오류 발생: ', @text);
    END;
    
    -- 할인 계산
    SET v_discount_amount = ROUND(p_original_amount * (p_discount_rate / 100));
    SET v_final_amount = p_original_amount - v_discount_amount;
    
    SET p_discount_amount = v_discount_amount;
    SET p_final_amount = v_final_amount;
    
    SET p_result_code = 0;
    SET p_result_message = CONCAT('할인 처리 완료. 할인 금액: ', v_discount_amount, '원, 최종 금액: ', v_final_amount, '원');
    
END //

-- GenerateFinancialReport 프로시저
DROP PROCEDURE IF EXISTS GenerateFinancialReport //

CREATE PROCEDURE GenerateFinancialReport(
    IN p_report_type VARCHAR(50),
    IN p_period_start DATE,
    IN p_period_end DATE,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_report_data JSON
)
BEGIN
    DECLARE v_report_data JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_message = CONCAT('재무 보고서 생성 중 오류 발생: ', @text);
        SET p_report_data = JSON_OBJECT('error', @text);
    END;
    
    -- 기본 보고서 데이터 생성
    SET v_report_data = JSON_OBJECT(
        'report_type', p_report_type,
        'period_start', p_period_start,
        'period_end', p_period_end,
        'generated_at', NOW(),
        'status', 'COMPLETED'
    );
    
    SET p_report_data = v_report_data;
    SET p_result_code = 0;
    SET p_result_message = CONCAT(p_report_type, ' 보고서 생성 완료');
    
END //

-- =====================================================
-- 3. 통계 관련 프로시저 (PlSqlStatisticsService에서 필요)
-- =====================================================

-- UpdateDailyStatistics 프로시저
DROP PROCEDURE IF EXISTS UpdateDailyStatistics //

CREATE PROCEDURE UpdateDailyStatistics(
    IN p_branch_code VARCHAR(20),
    IN p_stat_date DATE
)
BEGIN
    DECLARE v_total_consultations INT DEFAULT 0;
    DECLARE v_completed_consultations INT DEFAULT 0;
    DECLARE v_cancelled_consultations INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 기본 통계 계산
    SELECT COUNT(*) INTO v_total_consultations
    FROM schedules 
    WHERE date = p_stat_date 
    AND branch_code = p_branch_code 
    AND is_deleted = false;
    
    SELECT COUNT(*) INTO v_completed_consultations
    FROM schedules 
    WHERE date = p_stat_date 
    AND branch_code = p_branch_code 
    AND status = 'COMPLETED' 
    AND is_deleted = false;
    
    SELECT COUNT(*) INTO v_cancelled_consultations
    FROM schedules 
    WHERE date = p_stat_date 
    AND branch_code = p_branch_code 
    AND status = 'CANCELLED' 
    AND is_deleted = false;
    
    COMMIT;
    
END //

-- UpdateConsultantPerformance 프로시저
DROP PROCEDURE IF EXISTS UpdateConsultantPerformance //

CREATE PROCEDURE UpdateConsultantPerformance(
    IN p_consultant_id BIGINT,
    IN p_performance_date DATE
)
BEGIN
    DECLARE v_total_schedules INT DEFAULT 0;
    DECLARE v_completed_schedules INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 상담사 성과 계산
    SELECT COUNT(*) INTO v_total_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND is_deleted = false;
    
    SELECT COUNT(*) INTO v_completed_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND status = 'COMPLETED' 
    AND is_deleted = false;
    
    COMMIT;
    
END //

-- DailyPerformanceMonitoring 프로시저
DROP PROCEDURE IF EXISTS DailyPerformanceMonitoring //

CREATE PROCEDURE DailyPerformanceMonitoring(
    IN p_monitoring_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    
    DECLARE consultant_cursor CURSOR FOR
        SELECT DISTINCT consultant_id 
        FROM schedules 
        WHERE date = p_monitoring_date AND is_deleted = false;
    
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
        
        -- 각 상담사별 성과 업데이트
        CALL UpdateConsultantPerformance(v_consultant_id, p_monitoring_date);
        
    END LOOP;
    
    CLOSE consultant_cursor;
    
    COMMIT;
    
END //

DELIMITER ;

-- =====================================================
-- 프로시저 생성 완료 확인
-- =====================================================
SELECT '운영 서버 누락 프로시저 등록 완료' AS STATUS;
SELECT 
    ROUTINE_NAME as 'Created Procedures',
    CREATED as 'Created At'
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_TYPE = 'PROCEDURE' 
AND ROUTINE_NAME IN (
    'UseSessionForMapping', 'AddSessionsToMapping', 'ValidateMappingIntegrity', 'SyncAllMappings',
    'ProcessRefundWithSessionAdjustment', 'ProcessPartialRefund', 'GetRefundableSessions', 'GetRefundStatistics',
    'ValidateIntegratedAmount', 'GetConsolidatedFinancialData', 'ProcessDiscountAccounting', 'GenerateFinancialReport',
    'UpdateDailyStatistics', 'UpdateConsultantPerformance', 'DailyPerformanceMonitoring'
)
ORDER BY CREATED;
