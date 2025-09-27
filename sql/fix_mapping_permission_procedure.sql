-- 매핑 수정 권한 확인 프로시저 수정
-- BRANCH_SUPER_ADMIN 권한 추가

DELIMITER //

DROP PROCEDURE IF EXISTS CheckMappingUpdatePermission;

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
    
    
    SELECT status, payment_status, used_sessions
    INTO v_mapping_status, v_payment_status, v_used_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id;

    SET p_can_update = FALSE;
    
    
    IF v_mapping_status IS NULL THEN
        SET p_reason = '매핑을 찾을 수 없습니다.';
    ELSEIF v_mapping_status = 'CANCELLED' THEN
        SET p_reason = '취소된 매핑은 수정할 수 없습니다.';
    ELSEIF v_mapping_status = 'TERMINATED' THEN
        SET p_reason = '종료된 매핑은 수정할 수 없습니다.';
    ELSEIF v_used_sessions > 0 THEN
        SET p_reason = '이미 사용된 세션이 있는 매핑은 수정할 수 없습니다.';
    ELSEIF p_user_role NOT IN ('ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER', 'BRANCH_SUPER_ADMIN') THEN
        SET p_reason = '매핑 수정 권한이 없습니다.';
    ELSE
        SET p_can_update = TRUE;
        SET p_reason = '수정 가능합니다.';
    END IF;
END //

DELIMITER ;
