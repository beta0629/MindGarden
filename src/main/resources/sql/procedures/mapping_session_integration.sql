-- =====================================================
-- 매칭-회기 통합 관리 PL/SQL 프로시저
-- =====================================================

DELIMITER //

-- 문자셋 설정
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- 1. 회기 사용 처리 (스케줄 생성 시)
-- =====================================================
CREATE PROCEDURE UseSessionForMapping(
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
    
    -- 1. 활성 매칭 조회
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
    
    -- 2. 매칭 존재 및 상태 검증
    IF v_mapping_id IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '활성 매칭을 찾을 수 없습니다';
        ROLLBACK;
    ELSEIF v_mapping_status != 'ACTIVE' THEN
        SET p_result_code = 2;
        SET p_result_message = '매칭이 활성 상태가 아닙니다';
        ROLLBACK;
    ELSEIF v_payment_status != 'CONFIRMED' THEN
        SET p_result_code = 3;
        SET p_result_message = '결제가 확인되지 않은 매칭입니다';
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
        
        -- 5. 매칭 상태 업데이트 (회기 소진 시)
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
    
END //

-- =====================================================
-- 2. 회기 추가 처리 (연장 요청 시)
-- =====================================================
CREATE PROCEDURE AddSessionsToMapping(
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
    
    -- 1. 현재 매칭 정보 조회
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
    
    -- 2. 매칭 존재 및 상태 검증
    IF v_current_total IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '매칭을 찾을 수 없습니다';
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
    
END //

-- =====================================================
-- 3. 매칭 데이터 무결성 검증
-- =====================================================
CREATE PROCEDURE ValidateMappingIntegrity(
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
    
    -- 1. 매칭 존재 여부 확인
    SELECT COUNT(*) > 0 INTO v_mapping_exists
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    IF NOT v_mapping_exists THEN
        SET p_result_code = 1;
        SET p_result_message = '매칭을 찾을 수 없습니다';
        SET p_validation_results = JSON_OBJECT('exists', FALSE);
    ELSE
        -- 2. 매칭 정보 조회
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
            SET p_result_message = '매칭 데이터 무결성이 유지되고 있습니다';
        ELSE
            SET p_result_code = 2;
            SET p_result_message = '매칭 데이터에 불일치가 발견되었습니다';
        END IF;
    END IF;
    
END //

-- =====================================================
-- 4. 전체 시스템 매칭 동기화
-- =====================================================
CREATE PROCEDURE SyncAllMappings(
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
    
    -- 1. 전체 매칭 수 조회
    SELECT COUNT(*) INTO v_total_mappings
    FROM consultant_client_mappings 
    WHERE status IN ('ACTIVE', 'COMPLETED');
    
    -- 2. 각 매칭별 무결성 검증 및 수정
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
    SET p_result_message = CONCAT('전체 동기화 완료. 총 ', v_total_mappings, '개 매칭 중 ', v_valid_mappings, '개 유효, ', v_fixed_mappings, '개 수정');
    
    COMMIT;
    
END //

-- =====================================================
-- 5. 회기 사용 로그 테이블 생성
-- =====================================================
CREATE TABLE IF NOT EXISTS session_usage_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mapping_id BIGINT NOT NULL,
    schedule_id BIGINT,
    consultant_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- 'USE', 'ADD', 'REFUND'
    additional_sessions INT DEFAULT 0,
    package_name VARCHAR(100),
    package_price BIGINT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mapping_id (mapping_id),
    INDEX idx_consultant_client (consultant_id, client_id),
    INDEX idx_created_at (created_at)
);
