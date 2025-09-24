-- =====================================================
-- 환불-회기 통합 관리 PL/SQL 프로시저
-- =====================================================

DELIMITER //

-- 문자셋 설정
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- 1. 환불 시 회기 수 조절 처리
-- =====================================================
CREATE PROCEDURE ProcessRefundWithSessionAdjustment(
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
    
END //

-- =====================================================
-- 2. 부분 환불 처리 (최근 회기만 환불)
-- =====================================================
CREATE PROCEDURE ProcessPartialRefund(
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
    
END //

-- =====================================================
-- 3. 환불 가능 회기 수 조회
-- =====================================================
CREATE PROCEDURE GetRefundableSessions(
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
    
END //

-- =====================================================
-- 4. 환불 통계 조회
-- =====================================================
CREATE PROCEDURE GetRefundStatistics(
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
    
END //

DELIMITER ;
