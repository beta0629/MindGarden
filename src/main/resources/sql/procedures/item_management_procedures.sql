-- =====================================================
-- 아이템 관리 PL/SQL 프로시저
-- 아이템 등록, 재고 관리, 구매 요청, 입고/출고 처리
-- =====================================================

DELIMITER //

-- 문자셋 설정
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- 1. 아이템 등록 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS CreateItem//
CREATE PROCEDURE CreateItem(
    IN p_item_name VARCHAR(200),
    IN p_category VARCHAR(100),
    IN p_description TEXT,
    IN p_unit_price DECIMAL(10,2),
    IN p_unit VARCHAR(50),
    IN p_min_stock INT,
    IN p_max_stock INT,
    IN p_branch_code VARCHAR(20),
    IN p_created_by VARCHAR(100),
    OUT p_item_id BIGINT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_existing_item INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('아이템 등록 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 중복 아이템 확인
    SELECT COUNT(*) INTO v_existing_item
    FROM items 
    WHERE item_name = p_item_name 
    AND branch_code = p_branch_code
    AND is_deleted = FALSE;
    
    IF v_existing_item > 0 THEN
        SET p_success = FALSE;
        SET p_message = '이미 등록된 아이템입니다.';
        ROLLBACK;
    ELSE
        -- 아이템 등록
        INSERT INTO items (
            item_name, category, description, unit_price, unit,
            min_stock, max_stock, current_stock, branch_code,
            created_by, created_at, updated_at, is_deleted
        ) VALUES (
            p_item_name, p_category, p_description, p_unit_price, p_unit,
            p_min_stock, p_max_stock, 0, p_branch_code,
            p_created_by, NOW(), NOW(), FALSE
        );
        
        SET p_item_id = LAST_INSERT_ID();
        SET p_success = TRUE;
        SET p_message = '아이템이 성공적으로 등록되었습니다.';
        
        COMMIT;
    END IF;
    
END//

-- =====================================================
-- 2. 재고 업데이트 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS UpdateItemStock//
CREATE PROCEDURE UpdateItemStock(
    IN p_item_id BIGINT,
    IN p_quantity_change INT,
    IN p_transaction_type VARCHAR(50),
    IN p_reason TEXT,
    IN p_processed_by VARCHAR(100),
    OUT p_new_stock INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_current_stock INT DEFAULT 0;
    DECLARE v_min_stock INT DEFAULT 0;
    DECLARE v_max_stock INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('재고 업데이트 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 현재 재고 조회
    SELECT current_stock, min_stock, max_stock
    INTO v_current_stock, v_min_stock, v_max_stock
    FROM items 
    WHERE id = p_item_id AND is_deleted = FALSE;
    
    IF v_current_stock IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '아이템을 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        -- 재고 계산
        SET p_new_stock = v_current_stock + p_quantity_change;
        
        -- 최대 재고 초과 확인
        IF p_new_stock > v_max_stock THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('최대 재고(', v_max_stock, ')를 초과합니다.');
            ROLLBACK;
        ELSE
            -- 재고 업데이트
            UPDATE items 
            SET current_stock = p_new_stock,
                updated_at = NOW()
            WHERE id = p_item_id;
            
            -- 재고 변동 이력 기록
            INSERT INTO item_stock_transactions (
                item_id, transaction_type, quantity_change, 
                previous_stock, new_stock, reason, processed_by, created_at
            ) VALUES (
                p_item_id, p_transaction_type, p_quantity_change,
                v_current_stock, p_new_stock, p_reason, p_processed_by, NOW()
            );
            
            SET p_success = TRUE;
            SET p_message = CONCAT('재고가 업데이트되었습니다. (', v_current_stock, ' → ', p_new_stock, ')');
            
            COMMIT;
        END IF;
    END IF;
    
END//

-- =====================================================
-- 3. 구매 요청 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS CreatePurchaseRequest//
CREATE PROCEDURE CreatePurchaseRequest(
    IN p_item_id BIGINT,
    IN p_requested_quantity INT,
    IN p_reason TEXT,
    IN p_requested_by VARCHAR(100),
    IN p_branch_code VARCHAR(20),
    OUT p_request_id BIGINT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_item_name VARCHAR(200);
    DECLARE v_unit_price DECIMAL(10,2);
    DECLARE v_total_amount DECIMAL(15,2);
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('구매 요청 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 아이템 정보 조회
    SELECT item_name, unit_price
    INTO v_item_name, v_unit_price
    FROM items 
    WHERE id = p_item_id AND branch_code = p_branch_code AND is_deleted = FALSE;
    
    IF v_item_name IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '아이템을 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        -- 총 금액 계산
        SET v_total_amount = p_requested_quantity * v_unit_price;
        
        -- 구매 요청 생성
        INSERT INTO purchase_requests (
            item_id, item_name, requested_quantity, unit_price, total_amount,
            reason, status, requested_by, branch_code, created_at, updated_at
        ) VALUES (
            p_item_id, v_item_name, p_requested_quantity, v_unit_price, v_total_amount,
            p_reason, 'PENDING', p_requested_by, p_branch_code, NOW(), NOW()
        );
        
        SET p_request_id = LAST_INSERT_ID();
        SET p_success = TRUE;
        SET p_message = '구매 요청이 생성되었습니다.';
        
        COMMIT;
    END IF;
    
END//

-- =====================================================
-- 4. 구매 승인 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS ApprovePurchaseRequest//
CREATE PROCEDURE ApprovePurchaseRequest(
    IN p_request_id BIGINT,
    IN p_approved_by VARCHAR(100),
    IN p_approval_comment TEXT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_item_id BIGINT;
    DECLARE v_requested_quantity INT;
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('구매 승인 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 구매 요청 정보 조회
    SELECT item_id, requested_quantity
    INTO v_item_id, v_requested_quantity
    FROM purchase_requests 
    WHERE id = p_request_id AND status = 'PENDING';
    
    IF v_item_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '승인 가능한 구매 요청을 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        -- 구매 요청 승인
        UPDATE purchase_requests 
        SET status = 'APPROVED',
            approved_by = p_approved_by,
            approval_comment = p_approval_comment,
            approved_at = NOW(),
            updated_at = NOW()
        WHERE id = p_request_id;
        
        -- 재고 업데이트 (입고)
        CALL UpdateItemStock(v_item_id, v_requested_quantity, 'PURCHASE', 
                            '구매 승인에 의한 입고', p_approved_by, 
                            @new_stock, @stock_success, @stock_message);
        
        IF @stock_success = FALSE THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('재고 업데이트 실패: ', @stock_message);
            ROLLBACK;
        ELSE
            SET p_success = TRUE;
            SET p_message = '구매 요청이 승인되었습니다.';
            COMMIT;
        END IF;
    END IF;
    
END//

-- =====================================================
-- 5. 재고 부족 알림 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS CheckLowStock//
CREATE PROCEDURE CheckLowStock(
    IN p_branch_code VARCHAR(20),
    OUT p_low_stock_items INT,
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
        SET p_message = CONCAT('재고 부족 확인 중 오류 발생: ', v_error_message);
    END;
    
    -- 재고 부족 아이템 수 조회
    SELECT COUNT(*) INTO p_low_stock_items
    FROM items 
    WHERE branch_code = p_branch_code 
    AND current_stock <= min_stock
    AND is_deleted = FALSE;
    
    SET p_success = TRUE;
    SET p_message = CONCAT('재고 부족 아이템: ', p_low_stock_items, '개');
    
END//

-- =====================================================
-- 6. 아이템 통계 조회 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS GetItemStatistics//
CREATE PROCEDURE GetItemStatistics(
    IN p_branch_code VARCHAR(20),
    OUT p_total_items INT,
    OUT p_total_value DECIMAL(15,2),
    OUT p_low_stock_items INT,
    OUT p_out_of_stock_items INT,
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
        SET p_message = CONCAT('아이템 통계 조회 중 오류 발생: ', v_error_message);
    END;
    
    -- 총 아이템 수
    SELECT COUNT(*) INTO p_total_items
    FROM items 
    WHERE branch_code = p_branch_code AND is_deleted = FALSE;
    
    -- 총 재고 가치
    SELECT COALESCE(SUM(current_stock * unit_price), 0) INTO p_total_value
    FROM items 
    WHERE branch_code = p_branch_code AND is_deleted = FALSE;
    
    -- 재고 부족 아이템 수
    SELECT COUNT(*) INTO p_low_stock_items
    FROM items 
    WHERE branch_code = p_branch_code 
    AND current_stock <= min_stock
    AND current_stock > 0
    AND is_deleted = FALSE;
    
    -- 품절 아이템 수
    SELECT COUNT(*) INTO p_out_of_stock_items
    FROM items 
    WHERE branch_code = p_branch_code 
    AND current_stock = 0
    AND is_deleted = FALSE;
    
    SET p_success = TRUE;
    SET p_message = '아이템 통계 조회가 완료되었습니다.';
    
END//

DELIMITER ;
