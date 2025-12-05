-- =====================================================
-- 전체 일일 통계 업데이트 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS UpdateAllBranchDailyStatistics //

CREATE PROCEDURE UpdateAllBranchDailyStatistics(
    IN p_tenant_id VARCHAR(100),
    IN p_stat_date DATE,
    IN p_updated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_processed_count INT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_update_success BOOLEAN;
    DECLARE v_update_message TEXT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('전체 일일 통계 업데이트 중 오류 발생: ', v_error_message);
        SET p_processed_count = 0;
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_processed_count = 0;
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_stat_date IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '통계 날짜는 필수입니다.';
        SET p_processed_count = 0;
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 일일 통계 업데이트 (테넌트 단위로 처리)
    CALL UpdateDailyStatistics(
        p_tenant_id,
        p_stat_date,
        p_updated_by,
        v_update_success,
        v_update_message
    );
    
    IF v_update_success = TRUE THEN
        SET p_processed_count = 1;
        SET p_success = TRUE;
        SET p_message = CONCAT('전체 일일 통계 업데이트 완료. 처리된 테넌트: ', p_tenant_id);
    ELSE
        SET p_processed_count = 0;
        SET p_success = FALSE;
        SET p_message = CONCAT('일일 통계 업데이트 실패: ', v_update_message);
    END IF;
    
    COMMIT;
    
END //

DELIMITER ;

