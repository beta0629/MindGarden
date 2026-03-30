-- =====================================================
-- 상담일지 누락 통계 조회 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetConsultationRecordMissingStatistics //

CREATE PROCEDURE GetConsultationRecordMissingStatistics(
    IN p_tenant_id VARCHAR(100),
    IN p_check_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_missing_count INT,
    OUT p_alerts_created INT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_schedule_count INT DEFAULT 0;
    DECLARE v_record_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('상담일지 누락 통계 조회 중 오류 발생: ', v_error_message);
        SET p_missing_count = 0;
        SET p_alerts_created = 0;
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_missing_count = 0;
        SET p_alerts_created = 0;
        LEAVE;
    END IF;
    
    IF p_check_date IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '확인 날짜는 필수입니다.';
        SET p_missing_count = 0;
        SET p_alerts_created = 0;
        LEAVE;
    END IF;
    
    -- 2. 완료된 스케줄 수 조회 (테넌트 격리)
    SELECT COUNT(*) INTO v_schedule_count
    FROM schedules
    WHERE tenant_id = p_tenant_id
      AND date = p_check_date
      AND status = 'COMPLETED'
      AND is_deleted = FALSE;
    
    -- 3. 작성된 상담일지 수 조회 (테넌트 격리)
    SELECT COUNT(*) INTO v_record_count
    FROM consultation_records
    WHERE tenant_id = p_tenant_id
      AND session_date = p_check_date
      AND is_deleted = FALSE;
    
    -- 4. 누락된 상담일지 수 계산
    SET p_missing_count = GREATEST(0, v_schedule_count - v_record_count);
    
    -- 5. 알림 생성 수 (이미 생성된 알림은 제외)
    SELECT COUNT(*) INTO p_alerts_created
    FROM consultation_record_alerts
    WHERE tenant_id = p_tenant_id
      AND session_date = p_check_date
      AND alert_type = 'MISSING_RECORD'
      AND status = 'PENDING'
      AND is_deleted = FALSE;
    
    SET p_success = TRUE;
    SET p_message = CONCAT('상담일지 누락 통계 조회 완료. 누락: ', p_missing_count, '건, 알림: ', p_alerts_created, '건');
    
END //

DELIMITER ;

