-- =====================================================
-- 일일 통계 업데이트 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS UpdateDailyStatistics //

CREATE PROCEDURE UpdateDailyStatistics(
    IN p_tenant_id VARCHAR(100),
    IN p_stat_date DATE,
    IN p_updated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_total_consultations INT DEFAULT 0;
    DECLARE v_completed_consultations INT DEFAULT 0;
    DECLARE v_cancelled_consultations INT DEFAULT 0;
    DECLARE v_total_revenue DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_total_refunds INT DEFAULT 0;
    DECLARE v_refund_amount DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT 0.00;
    DECLARE v_consultant_count INT DEFAULT 0;
    DECLARE v_client_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('일일 통계 업데이트 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        ROLLBACK;
    ELSEIF p_stat_date IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '통계 날짜는 필수입니다.';
        ROLLBACK;
    ELSE
        -- 2. 총 상담 수 (테넌트 격리)
        SELECT COUNT(*) INTO v_total_consultations
        FROM schedules 
        WHERE date = p_stat_date 
        AND tenant_id = p_tenant_id
        AND is_deleted = FALSE;
        
        -- 3. 완료된 상담 수 (테넌트 격리)
        SELECT COUNT(*) INTO v_completed_consultations
        FROM schedules 
        WHERE date = p_stat_date 
        AND tenant_id = p_tenant_id
        AND status = 'COMPLETED' 
        AND is_deleted = FALSE;
        
        -- 4. 취소된 상담 수 (테넌트 격리)
        SELECT COUNT(*) INTO v_cancelled_consultations
        FROM schedules 
        WHERE date = p_stat_date 
        AND tenant_id = p_tenant_id
        AND status = 'CANCELLED' 
        AND is_deleted = FALSE;
        
        -- 5. 총 수익 (상담 수입, 테넌트 격리)
        SELECT COALESCE(SUM(ft.amount), 0) INTO v_total_revenue
        FROM financial_transactions ft
        JOIN schedules s ON ft.related_entity_id = s.id
        WHERE s.date = p_stat_date 
        AND s.tenant_id = p_tenant_id
        AND ft.tenant_id = p_tenant_id
        AND ft.related_entity_type = 'CONSULTATION_INCOME'
        AND ft.transaction_type = 'INCOME'
        AND ft.is_deleted = FALSE
        AND s.is_deleted = FALSE;
        
        -- 6. 환불 건수와 금액 (테넌트 격리)
        SELECT 
        COUNT(*),
        COALESCE(SUM(ABS(ft.amount)), 0)
        INTO v_total_refunds, v_refund_amount
        FROM financial_transactions ft
        JOIN schedules s ON ft.related_entity_id = s.id
        WHERE s.date = p_stat_date 
        AND s.tenant_id = p_tenant_id
        AND ft.tenant_id = p_tenant_id
        AND ft.related_entity_type = 'CONSULTATION_REFUND'
        AND ft.transaction_type = 'REFUND'
        AND ft.is_deleted = FALSE
        AND s.is_deleted = FALSE;
        
        -- 7. 평균 평점 (테넌트 격리)
        SELECT COALESCE(AVG(cr.heart_score), 0) INTO v_avg_rating
        FROM consultant_ratings cr
        JOIN schedules s ON cr.schedule_id = s.id
        WHERE s.date = p_stat_date 
        AND s.tenant_id = p_tenant_id
        AND cr.tenant_id = p_tenant_id
        AND cr.status = 'ACTIVE'
        AND cr.is_deleted = FALSE
        AND s.is_deleted = FALSE;
        
        -- 8. 활성 상담사 수 (테넌트 격리)
        SELECT COUNT(DISTINCT u.id) INTO v_consultant_count
        FROM users u
        JOIN schedules s ON u.id = s.consultant_id
        WHERE s.date = p_stat_date 
        AND u.tenant_id = p_tenant_id
        AND s.tenant_id = p_tenant_id
        AND u.role = 'CONSULTANT'
        AND u.is_active = TRUE
        AND u.is_deleted = FALSE
        AND s.is_deleted = FALSE;
        
        -- 9. 내담자 수 (테넌트 격리)
        SELECT COUNT(DISTINCT s.client_id) INTO v_client_count
        FROM schedules s
        WHERE s.date = p_stat_date 
        AND s.tenant_id = p_tenant_id
        AND s.is_deleted = FALSE;
        
        -- 10. 기존 통계 삭제 후 새로 삽입 (UPSERT, 테넌트 격리)
        DELETE FROM daily_statistics 
        WHERE stat_date = p_stat_date 
        AND tenant_id = p_tenant_id;
        
        INSERT INTO daily_statistics (
            stat_date, 
            tenant_id,
            total_consultations, 
            completed_consultations,
            cancelled_consultations, 
            total_revenue, 
            total_refunds, 
            refund_amount,
            avg_rating, 
            consultant_count, 
            client_count,
            created_at, 
            created_by,
            updated_at, 
            updated_by,
            is_deleted, 
            version
        ) VALUES (
            p_stat_date, 
            p_tenant_id,
            v_total_consultations, 
            v_completed_consultations,
            v_cancelled_consultations, 
            v_total_revenue, 
            v_total_refunds, 
            v_refund_amount,
            v_avg_rating, 
            v_consultant_count, 
            v_client_count,
            NOW(), 
            p_updated_by,
            NOW(), 
            p_updated_by,
            FALSE, 
            0
        );
        
        SET p_success = TRUE;
        SET p_message = CONCAT('일일 통계 업데이트 완료. 총 상담: ', v_total_consultations, ', 완료: ', v_completed_consultations);
        
        COMMIT;
    END IF;
    
END //

DELIMITER ;

