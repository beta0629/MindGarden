-- =====================================================
-- 매핑 권한 관리 PL/SQL 프로시저
-- =====================================================

DELIMITER //

-- 문자셋 설정
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- 1. 매핑 수정 권한 확인 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS CheckMappingUpdatePermission//
CREATE PROCEDURE CheckMappingUpdatePermission(
    IN p_mapping_id BIGINT,
    IN p_user_id BIGINT,
    IN p_user_role VARCHAR(50),
    OUT p_can_update BOOLEAN,
    OUT p_reason VARCHAR(500)
)
BEGIN
    DECLARE v_mapping_branch_code VARCHAR(20) DEFAULT NULL;
    DECLARE v_user_branch_code VARCHAR(20) DEFAULT NULL;
    DECLARE v_mapping_consultant_id BIGINT DEFAULT NULL;
    DECLARE v_mapping_client_id BIGINT DEFAULT NULL;
    DECLARE v_user_role_level INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_can_update = FALSE;
        SET p_reason = '권한 확인 중 오류가 발생했습니다';
    END;
    
    START TRANSACTION;
    
    -- 1. 매핑 정보 조회
    SELECT 
        branch_code,
        consultant_id,
        client_id
    INTO 
        v_mapping_branch_code,
        v_mapping_consultant_id,
        v_mapping_client_id
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    -- 2. 매핑이 존재하지 않는 경우
    IF v_mapping_branch_code IS NULL THEN
        SET p_can_update = FALSE;
        SET p_reason = '매핑을 찾을 수 없습니다';
        ROLLBACK;
    ELSE
        -- 3. 사용자 정보 조회
        SELECT branch_code
        INTO v_user_branch_code
        FROM users 
        WHERE id = p_user_id;
        
        -- 4. 역할별 권한 레벨 설정
        CASE p_user_role
            WHEN 'HQ_MASTER' THEN SET v_user_role_level = 100;
            WHEN 'SUPER_HQ_ADMIN' THEN SET v_user_role_level = 90;
            WHEN 'HQ_ADMIN' THEN SET v_user_role_level = 80;
            WHEN 'ADMIN' THEN SET v_user_role_level = 70;
            WHEN 'BRANCH_SUPER_ADMIN' THEN SET v_user_role_level = 60;
            WHEN 'BRANCH_ADMIN' THEN SET v_user_role_level = 50;
            WHEN 'BRANCH_MANAGER' THEN SET v_user_role_level = 40;
            WHEN 'CONSULTANT' THEN SET v_user_role_level = 30;
            WHEN 'CLIENT' THEN SET v_user_role_level = 20;
            ELSE SET v_user_role_level = 0;
        END CASE;
        
        -- 5. 권한 확인 로직
        IF v_user_role_level >= 70 THEN
            -- 본사 관리자 이상: 모든 매핑 수정 가능
            SET p_can_update = TRUE;
            SET p_reason = '본사 관리자 권한으로 수정 가능합니다';
        ELSEIF v_user_role_level >= 50 AND v_mapping_branch_code = v_user_branch_code THEN
            -- 지점 관리자: 자신의 지점 매핑만 수정 가능
            SET p_can_update = TRUE;
            SET p_reason = '지점 관리자 권한으로 수정 가능합니다';
        ELSEIF v_user_role_level >= 30 AND p_user_id = v_mapping_consultant_id THEN
            -- 상담사: 자신의 매핑만 수정 가능
            SET p_can_update = TRUE;
            SET p_reason = '상담사 권한으로 수정 가능합니다';
        ELSEIF v_user_role_level >= 20 AND p_user_id = v_mapping_client_id THEN
            -- 내담자: 자신의 매핑만 수정 가능
            SET p_can_update = TRUE;
            SET p_reason = '내담자 권한으로 수정 가능합니다';
        ELSE
            SET p_can_update = FALSE;
            SET p_reason = '매핑을 수정할 권한이 없습니다';
        END IF;
    END IF;
    
    COMMIT;
END//

-- =====================================================
-- 2. 매핑 정보 수정 프로시저 (권한 확인 후)
-- =====================================================
DROP PROCEDURE IF EXISTS UpdateMappingInfo//
CREATE PROCEDURE UpdateMappingInfo(
    IN p_mapping_id BIGINT,
    IN p_package_name VARCHAR(100),
    IN p_package_price DECIMAL(10,2),
    IN p_total_sessions INT,
    IN p_updated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_old_remaining_sessions INT DEFAULT 0;
    DECLARE v_old_used_sessions INT DEFAULT 0;
    DECLARE v_old_total_sessions INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('매핑 정보 수정 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 기존 매핑 정보 조회
    SELECT 
        total_sessions,
        used_sessions,
        remaining_sessions
    INTO 
        v_old_total_sessions,
        v_old_used_sessions,
        v_old_remaining_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;
    
    -- 2. 매핑이 존재하지 않는 경우
    IF v_old_total_sessions IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '매핑을 찾을 수 없습니다';
        ROLLBACK;
    ELSE
        -- 3. 매핑 정보 수정
        UPDATE consultant_client_mappings 
        SET 
            package_name = p_package_name,
            package_price = p_package_price,
            total_sessions = p_total_sessions,
            remaining_sessions = p_total_sessions - v_old_used_sessions,
            updated_at = NOW()
        WHERE id = p_mapping_id;
        
        -- 4. 수정 이력 기록
        INSERT INTO mapping_update_logs (
            mapping_id,
            old_package_name,
            new_package_name,
            old_package_price,
            new_package_price,
            old_total_sessions,
            new_total_sessions,
            updated_by,
            created_at
        ) VALUES (
            p_mapping_id,
            (SELECT package_name FROM consultant_client_mappings WHERE id = p_mapping_id),
            p_package_name,
            (SELECT package_price FROM consultant_client_mappings WHERE id = p_mapping_id),
            p_package_price,
            v_old_total_sessions,
            p_total_sessions,
            p_updated_by,
            NOW()
        );
        
        SET p_success = TRUE;
        SET p_message = '매핑 정보가 성공적으로 수정되었습니다';
    END IF;
    
    COMMIT;
END//

DELIMITER ;
