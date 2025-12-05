-- =====================================================
-- 상담일지 작성 여부 검증 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ValidateConsultationRecordBeforeCompletion //

CREATE PROCEDURE ValidateConsultationRecordBeforeCompletion(
    IN p_consultant_id BIGINT,
    IN p_session_date DATE,
    IN p_tenant_id VARCHAR(100),
    OUT p_has_record BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_record_count INT DEFAULT 0;
    DECLARE v_consultant_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_has_record = FALSE;
        SET p_message = CONCAT('검증 중 오류 발생: ', v_error_message);
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_has_record = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        LEAVE;
    END IF;
    
    IF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_has_record = FALSE;
        SET p_message = '상담사 ID는 필수입니다.';
        LEAVE;
    END IF;
    
    IF p_session_date IS NULL THEN
        SET p_has_record = FALSE;
        SET p_message = '상담 날짜는 필수입니다.';
        LEAVE;
    END IF;
    
    -- 2. 상담사 존재 여부 확인 (테넌트 격리)
    SELECT COUNT(*) INTO v_consultant_count
    FROM users
    WHERE id = p_consultant_id 
      AND tenant_id = p_tenant_id
      AND role = 'CONSULTANT'
      AND is_active = TRUE
      AND is_deleted = FALSE;
    
    IF v_consultant_count = 0 THEN
        SET p_has_record = FALSE;
        SET p_message = '상담사를 찾을 수 없습니다.';
        LEAVE;
    END IF;
    
    -- 3. 상담일지 작성 여부 확인 (테넌트 격리)
    SELECT COUNT(*)
    INTO v_record_count
    FROM consultation_records cr
    WHERE cr.consultant_id = p_consultant_id
      AND cr.tenant_id = p_tenant_id
      AND cr.session_date = p_session_date
      AND cr.is_deleted = FALSE;
    
    -- 4. 결과 설정
    IF v_record_count > 0 THEN
        SET p_has_record = TRUE;
        SET p_message = '상담일지가 작성되어 스케줄 완료 가능합니다.';
    ELSE
        SET p_has_record = FALSE;
        SET p_message = '상담일지가 작성되지 않아 스케줄 완료가 불가능합니다.';
    END IF;
    
END //

DELIMITER ;

