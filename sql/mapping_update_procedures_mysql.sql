-- 매핑 수정 관련 MySQL 프로시저
-- 매핑 정보 수정 시 ERP 시스템과 연동하여 모든 관련 데이터를 일괄 업데이트

DELIMITER //

-- 기존 프로시저 삭제 (있다면)
DROP PROCEDURE IF EXISTS UpdateMappingInfo //
DROP PROCEDURE IF EXISTS UpdateMappingStatistics //
DROP PROCEDURE IF EXISTS CheckMappingUpdatePermission //

-- 매핑 정보 수정 프로시저
CREATE PROCEDURE UpdateMappingInfo(
    IN p_mapping_id BIGINT,
    IN p_new_package_name VARCHAR(255),
    IN p_new_package_price DECIMAL(15,2),
    IN p_new_total_sessions INT,
    IN p_updated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_old_package_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_old_total_sessions INT DEFAULT 0;
    DECLARE v_consultant_id BIGINT DEFAULT 0;
    DECLARE v_client_id BIGINT DEFAULT 0;
    DECLARE v_branch_code VARCHAR(50) DEFAULT '';
    DECLARE v_payment_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_price_difference DECIMAL(15,2) DEFAULT 0;
    DECLARE v_session_difference INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = '매핑 정보 수정 중 오류가 발생했습니다.';
    END;

    START TRANSACTION;

    -- 1. 기존 매핑 정보 조회
    SELECT 
        package_price,
        total_sessions,
        consultant_id,
        client_id,
        branch_code,
        payment_amount
    INTO 
        v_old_package_price,
        v_old_total_sessions,
        v_consultant_id,
        v_client_id,
        v_branch_code,
        v_payment_amount
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;

    -- 2. 매핑이 존재하는지 확인
    IF v_consultant_id = 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑을 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        -- 3. 가격 및 세션 차이 계산
        SET v_price_difference = p_new_package_price - v_old_package_price;
        SET v_session_difference = p_new_total_sessions - v_old_total_sessions;

        -- 4. 매핑 정보 업데이트
        UPDATE consultant_client_mappings 
        SET 
            package_name = p_new_package_name,
            package_price = p_new_package_price,
            total_sessions = p_new_total_sessions,
            remaining_sessions = remaining_sessions + v_session_difference,
            payment_amount = p_new_package_price,
            updated_at = NOW(),
            version = version + 1
        WHERE id = p_mapping_id;

        -- 5. 매핑 변경 이력 기록
        INSERT INTO mapping_change_history (
            mapping_id,
            change_type,
            old_value,
            new_value,
            description,
            changed_at,
            changed_by
        ) VALUES (
            p_mapping_id,
            'PACKAGE_UPDATE',
            CONCAT('패키지: ', v_old_package_price, '원, 세션: ', v_old_total_sessions, '회'),
            CONCAT('패키지: ', p_new_package_price, '원, 세션: ', p_new_total_sessions, '회'),
            '패키지 정보 수정',
            NOW(),
            p_updated_by
        );

        -- 6. ERP 재무 거래 데이터 동기화
        -- 6-1. 기존 INCOME 거래 취소 처리 (여러 개일 수 있으므로 모두 처리)
        UPDATE financial_transactions 
        SET 
            status = 'CANCELLED',
            description = CONCAT('패키지 수정으로 인한 취소 - ', description),
            updated_at = NOW()
        WHERE 
            related_entity_type = 'CONSULTANT_CLIENT_MAPPING' 
            AND related_entity_id = p_mapping_id
            AND transaction_type = 'INCOME'
            AND category = 'CONSULTATION'
            AND status = 'COMPLETED';
        
        -- 6-2. 가격 차이에 따른 처리
        IF v_price_difference != 0 THEN
            IF v_price_difference > 0 THEN
                -- 가격이 올라간 경우: 차액만큼 추가 수입 거래 생성
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
                    created_at,
                    updated_at
                ) VALUES (
                    'INCOME',
                    'CONSULTATION',
                    'PACKAGE_PRICE_ADJUSTMENT',
                    v_price_difference,
                    CONCAT('패키지 수정 - 추가 금액: ', p_new_package_name, ' (', v_old_package_price, '원 → ', p_new_package_price, '원)'),
                    p_mapping_id,
                    'CONSULTANT_CLIENT_MAPPING',
                    v_branch_code,
                    NOW(),
                    'COMPLETED',
                    NOW(),
                    NOW()
                );
            ELSE
                -- 가격이 내려간 경우: 차액만큼 환불 거래 생성
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
                    created_at,
                    updated_at
                ) VALUES (
                    'EXPENSE',
                    'CONSULTATION',
                    'PACKAGE_PRICE_REFUND',
                    ABS(v_price_difference),
                    CONCAT('패키지 수정 - 환불 금액: ', p_new_package_name, ' (', v_old_package_price, '원 → ', p_new_package_price, '원)'),
                    p_mapping_id,
                    'CONSULTANT_CLIENT_MAPPING',
                    v_branch_code,
                    NOW(),
                    'COMPLETED',
                    NOW(),
                    NOW()
                );
            END IF;
        END IF;
        
        -- 6-3. 새로운 패키지 금액으로 수입 거래 생성
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
            created_at,
            updated_at
        ) VALUES (
            'INCOME',
            'CONSULTATION',
            'PACKAGE_SALE',
            p_new_package_price,
            CONCAT('상담료 입금 확인 - ', p_new_package_name, ' (', p_new_package_price, '원) - 패키지 수정 후'),
            p_mapping_id,
            'CONSULTANT_CLIENT_MAPPING',
            v_branch_code,
            NOW(),
            'COMPLETED',
            NOW(),
            NOW()
        );

        -- 7. 통계 데이터 갱신
        CALL UpdateMappingStatistics(p_mapping_id, v_consultant_id, v_client_id, v_branch_code);

        COMMIT;
        SET p_success = TRUE;
        SET p_message = '매핑 정보가 성공적으로 수정되었습니다.';
    END IF;
END //

-- 매핑 통계 업데이트 프로시저
CREATE PROCEDURE UpdateMappingStatistics(
    IN p_mapping_id BIGINT,
    IN p_consultant_id BIGINT,
    IN p_client_id BIGINT,
    IN p_branch_code VARCHAR(50)
)
BEGIN
    DECLARE v_package_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_used_sessions INT DEFAULT 0;
    DECLARE v_remaining_sessions INT DEFAULT 0;
    
    -- 매핑 정보 조회
    SELECT package_price, total_sessions, used_sessions, remaining_sessions
    INTO v_package_price, v_total_sessions, v_used_sessions, v_remaining_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;

    -- 상담사별 통계 업데이트 (테이블이 있다면)
    INSERT IGNORE INTO consultant_statistics (
        consultant_id,
        total_revenue,
        total_sessions,
        used_sessions,
        remaining_sessions,
        last_updated
    ) VALUES (
        p_consultant_id,
        v_package_price,
        v_total_sessions,
        v_used_sessions,
        v_remaining_sessions,
        NOW()
    ) ON DUPLICATE KEY UPDATE
        total_revenue = total_revenue + v_package_price,
        total_sessions = total_sessions + v_total_sessions,
        used_sessions = used_sessions + v_used_sessions,
        remaining_sessions = remaining_sessions + v_remaining_sessions,
        last_updated = NOW();

    -- 지점별 통계 업데이트 (테이블이 있다면)
    INSERT IGNORE INTO branch_statistics (
        branch_code,
        total_revenue,
        total_sessions,
        used_sessions,
        remaining_sessions,
        last_updated
    ) VALUES (
        p_branch_code,
        v_package_price,
        v_total_sessions,
        v_used_sessions,
        v_remaining_sessions,
        NOW()
    ) ON DUPLICATE KEY UPDATE
        total_revenue = total_revenue + v_package_price,
        total_sessions = total_sessions + v_total_sessions,
        used_sessions = used_sessions + v_used_sessions,
        remaining_sessions = remaining_sessions + v_remaining_sessions,
        last_updated = NOW();
END //

-- 매핑 수정 권한 확인 프로시저
CREATE PROCEDURE CheckMappingUpdatePermission(
    IN p_mapping_id BIGINT,
    IN p_user_id BIGINT,
    IN p_user_role VARCHAR(50),
    OUT p_can_update BOOLEAN,
    OUT p_reason VARCHAR(500)
)
BEGIN
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_payment_status VARCHAR(50) DEFAULT '';
    DECLARE v_used_sessions INT DEFAULT 0;
    
    -- 매핑 상태 조회
    SELECT status, payment_status, used_sessions
    INTO v_mapping_status, v_payment_status, v_used_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;

    SET p_can_update = FALSE;
    
    -- 권한 확인 로직
    IF v_mapping_status IS NULL THEN
        SET p_reason = '매핑을 찾을 수 없습니다.';
    ELSEIF v_mapping_status = 'CANCELLED' THEN
        SET p_reason = '취소된 매핑은 수정할 수 없습니다.';
    ELSEIF v_mapping_status = 'TERMINATED' THEN
        SET p_reason = '종료된 매핑은 수정할 수 없습니다.';
    ELSEIF v_used_sessions > 0 THEN
        SET p_reason = '이미 사용된 세션이 있는 매핑은 수정할 수 없습니다.';
    ELSEIF p_user_role NOT IN ('ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER') THEN
        SET p_reason = '매핑 수정 권한이 없습니다.';
    ELSE
        SET p_can_update = TRUE;
        SET p_reason = '수정 가능합니다.';
    END IF;
END //

DELIMITER ;

-- 테이블 생성 (필요한 경우)
CREATE TABLE IF NOT EXISTS mapping_change_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mapping_id BIGINT NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100),
    INDEX idx_mapping_id (mapping_id),
    INDEX idx_change_type (change_type)
);

CREATE TABLE IF NOT EXISTS consultant_statistics (
    consultant_id BIGINT PRIMARY KEY,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_sessions INT DEFAULT 0,
    used_sessions INT DEFAULT 0,
    remaining_sessions INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branch_statistics (
    branch_code VARCHAR(50) PRIMARY KEY,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_sessions INT DEFAULT 0,
    used_sessions INT DEFAULT 0,
    remaining_sessions INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
