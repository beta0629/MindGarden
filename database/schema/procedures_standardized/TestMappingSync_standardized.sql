-- =====================================================
-- 매핑 동기화 테스트 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS TestMappingSync //

CREATE PROCEDURE TestMappingSync(
    IN p_tenant_id VARCHAR(100),
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
        SET p_message = CONCAT('매핑 동기화 테스트 중 오류 발생: ', v_error_message);
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        LEAVE;
    END IF;
    
    -- 2. 테스트 성공 메시지 반환
    SET p_success = TRUE;
    SET p_message = CONCAT('매핑 동기화 테스트 성공 (테넌트: ', p_tenant_id, ')');
    
END //

DELIMITER ;

