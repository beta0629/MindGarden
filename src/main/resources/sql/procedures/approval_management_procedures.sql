-- =====================================================
-- 통합 승인 관리 PL/SQL 프로시저
-- 급여, 구매, 예산, 거래 등 모든 승인 프로세스 통합 관리
-- =====================================================

DELIMITER //

-- 문자셋 설정
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- 1. 통합 승인 요청 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS CreateApprovalRequest//
CREATE PROCEDURE CreateApprovalRequest(
    IN p_entity_type VARCHAR(50),
    IN p_entity_id BIGINT,
    IN p_approval_type VARCHAR(50),
    IN p_requested_by VARCHAR(100),
    IN p_branch_code VARCHAR(20),
    IN p_priority VARCHAR(20),
    IN p_description TEXT,
    OUT p_approval_id BIGINT,
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
        SET p_message = CONCAT('승인 요청 생성 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 승인 요청 생성
    INSERT INTO approval_requests (
        entity_type, entity_id, approval_type, status, priority,
        requested_by, branch_code, description, created_at, updated_at
    ) VALUES (
        p_entity_type, p_entity_id, p_approval_type, 'PENDING', p_priority,
        p_requested_by, p_branch_code, p_description, NOW(), NOW()
    );
    
    SET p_approval_id = LAST_INSERT_ID();
    SET p_success = TRUE;
    SET p_message = '승인 요청이 생성되었습니다.';
    
    COMMIT;
    
END//

-- =====================================================
-- 2. 승인 처리 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS ProcessApproval//
CREATE PROCEDURE ProcessApproval(
    IN p_approval_id BIGINT,
    IN p_approved_by VARCHAR(100),
    IN p_approval_decision VARCHAR(20),
    IN p_approval_comment TEXT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_entity_type VARCHAR(50);
    DECLARE v_entity_id BIGINT;
    DECLARE v_approval_type VARCHAR(50);
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('승인 처리 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 승인 요청 정보 조회
    SELECT entity_type, entity_id, approval_type
    INTO v_entity_type, v_entity_id, v_approval_type
    FROM approval_requests 
    WHERE id = p_approval_id AND status = 'PENDING';
    
    IF v_entity_type IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '승인 가능한 요청을 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        -- 승인 요청 상태 업데이트
        UPDATE approval_requests 
        SET status = p_approval_decision,
            approved_by = p_approved_by,
            approval_comment = p_approval_comment,
            approved_at = NOW(),
            updated_at = NOW()
        WHERE id = p_approval_id;
        
        -- 승인 유형별 후속 처리
        IF p_approval_decision = 'APPROVED' THEN
            -- 급여 승인
            IF v_approval_type = 'SALARY' THEN
                CALL ApproveSalaryCalculation(v_entity_id, p_approved_by, @salary_success, @salary_message);
                IF @salary_success = FALSE THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('급여 승인 실패: ', @salary_message);
                    ROLLBACK;
                END IF;
            -- 구매 승인
            ELSEIF v_approval_type = 'PURCHASE' THEN
                CALL ApprovePurchaseRequest(v_entity_id, p_approved_by, p_approval_comment, @purchase_success, @purchase_message);
                IF @purchase_success = FALSE THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('구매 승인 실패: ', @purchase_message);
                    ROLLBACK;
                END IF;
            -- 예산 승인
            ELSEIF v_approval_type = 'BUDGET' THEN
                -- 예산 승인 로직 (필요시 구현)
                SET p_success = TRUE;
                SET p_message = '예산 승인이 완료되었습니다.';
            -- 거래 승인
            ELSEIF v_approval_type = 'TRANSACTION' THEN
                -- 거래 승인 로직 (필요시 구현)
                SET p_success = TRUE;
                SET p_message = '거래 승인이 완료되었습니다.';
            END IF;
        ELSE
            -- 거부 처리
            SET p_success = TRUE;
            SET p_message = '승인이 거부되었습니다.';
        END IF;
        
        IF p_success = TRUE THEN
            COMMIT;
        END IF;
    END IF;
    
END//

-- =====================================================
-- 3. 승인 대기 목록 조회 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS GetPendingApprovals//
CREATE PROCEDURE GetPendingApprovals(
    IN p_branch_code VARCHAR(20),
    IN p_approval_type VARCHAR(50),
    IN p_priority VARCHAR(20),
    OUT p_pending_count INT,
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
        SET p_message = CONCAT('승인 대기 목록 조회 중 오류 발생: ', v_error_message);
    END;
    
    -- 대기 중인 승인 요청 수 조회
    SELECT COUNT(*) INTO p_pending_count
    FROM approval_requests 
    WHERE branch_code = p_branch_code 
    AND status = 'PENDING'
    AND (p_approval_type IS NULL OR approval_type = p_approval_type)
    AND (p_priority IS NULL OR priority = p_priority);
    
    SET p_success = TRUE;
    SET p_message = CONCAT('대기 중인 승인 요청: ', p_pending_count, '건');
    
END//

-- =====================================================
-- 4. 승인 통계 조회 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS GetApprovalStatistics//
CREATE PROCEDURE GetApprovalStatistics(
    IN p_branch_code VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_requests INT,
    OUT p_approved_count INT,
    OUT p_rejected_count INT,
    OUT p_pending_count INT,
    OUT p_approval_rate DECIMAL(5,2),
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
        SET p_message = CONCAT('승인 통계 조회 중 오류 발생: ', v_error_message);
    END;
    
    -- 총 요청 수
    SELECT COUNT(*) INTO p_total_requests
    FROM approval_requests 
    WHERE branch_code = p_branch_code 
    AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- 승인된 요청 수
    SELECT COUNT(*) INTO p_approved_count
    FROM approval_requests 
    WHERE branch_code = p_branch_code 
    AND status = 'APPROVED'
    AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- 거부된 요청 수
    SELECT COUNT(*) INTO p_rejected_count
    FROM approval_requests 
    WHERE branch_code = p_branch_code 
    AND status = 'REJECTED'
    AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- 대기 중인 요청 수
    SELECT COUNT(*) INTO p_pending_count
    FROM approval_requests 
    WHERE branch_code = p_branch_code 
    AND status = 'PENDING'
    AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- 승인률 계산
    IF p_total_requests > 0 THEN
        SET p_approval_rate = (p_approved_count / p_total_requests) * 100;
    ELSE
        SET p_approval_rate = 0;
    END IF;
    
    SET p_success = TRUE;
    SET p_message = '승인 통계 조회가 완료되었습니다.';
    
END//

-- =====================================================
-- 5. 승인 우선순위 업데이트 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS UpdateApprovalPriority//
CREATE PROCEDURE UpdateApprovalPriority(
    IN p_approval_id BIGINT,
    IN p_new_priority VARCHAR(20),
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
        SET p_message = CONCAT('승인 우선순위 업데이트 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 우선순위 업데이트
    UPDATE approval_requests 
    SET priority = p_new_priority,
        updated_at = NOW()
    WHERE id = p_approval_id AND status = 'PENDING';
    
    IF ROW_COUNT() = 0 THEN
        SET p_success = FALSE;
        SET p_message = '업데이트할 승인 요청을 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        SET p_success = TRUE;
        SET p_message = '승인 우선순위가 업데이트되었습니다.';
        COMMIT;
    END IF;
    
END//

-- =====================================================
-- 6. 승인 이력 조회 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS GetApprovalHistory//
CREATE PROCEDURE GetApprovalHistory(
    IN p_branch_code VARCHAR(20),
    IN p_approval_type VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT,
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
        SET p_message = CONCAT('승인 이력 조회 중 오류 발생: ', v_error_message);
    END;
    
    -- 승인 이력 조회
    SELECT 
        ar.id,
        ar.entity_type,
        ar.entity_id,
        ar.approval_type,
        ar.status,
        ar.priority,
        ar.requested_by,
        ar.approved_by,
        ar.approval_comment,
        ar.created_at,
        ar.approved_at
    FROM approval_requests ar
    WHERE ar.branch_code = p_branch_code 
    AND (p_approval_type IS NULL OR ar.approval_type = p_approval_type)
    AND ar.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY ar.created_at DESC
    LIMIT p_limit;
    
    SET p_success = TRUE;
    SET p_message = '승인 이력 조회가 완료되었습니다.';
    
END//

DELIMITER ;
