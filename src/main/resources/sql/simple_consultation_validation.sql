-- 간단한 상담일지 검증 프로시저 (테스트용)
DELIMITER $$

DROP PROCEDURE IF EXISTS ValidateConsultationRecordBeforeCompletion$$

CREATE PROCEDURE ValidateConsultationRecordBeforeCompletion(
    IN p_consultant_id BIGINT,
    IN p_session_date DATE,
    OUT p_has_record TINYINT(1),
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_record_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_has_record = 0;
        SET p_message = CONCAT('오류 발생: ', @text);
        ROLLBACK;
    END;
    
    SET p_has_record = 0;
    SET p_message = '';
    
    -- 상담일지 작성 여부 확인 (단순화)
    SELECT COUNT(*)
    INTO v_record_count
    FROM consultation_records cr
    WHERE cr.consultant_id = p_consultant_id
      AND cr.session_date = p_session_date
      AND cr.is_deleted = 0;
    
    IF v_record_count > 0 THEN
        SET p_has_record = 1;
        SET p_message = '상담일지가 작성되어 스케줄 완료 가능합니다.';
    ELSE
        SET p_has_record = 0;
        SET p_message = '상담일지가 작성되지 않아 스케줄 완료가 불가능합니다.';
    END IF;
    
END$$

DELIMITER ;
