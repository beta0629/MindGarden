-- =====================================================
-- 상담사 성과 업데이트 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS UpdateConsultantPerformance //

CREATE PROCEDURE UpdateConsultantPerformance(
    IN p_consultant_id BIGINT,
    IN p_performance_date DATE,
    IN p_tenant_id VARCHAR(100),
    IN p_updated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_total_schedules INT DEFAULT 0;
    DECLARE v_completed_schedules INT DEFAULT 0;
    DECLARE v_cancelled_schedules INT DEFAULT 0;
    DECLARE v_no_show_schedules INT DEFAULT 0;
    DECLARE v_completion_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_total_revenue DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_total_ratings INT DEFAULT 0;
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT 0.00;
    DECLARE v_unique_clients INT DEFAULT 0;
    DECLARE v_repeat_clients INT DEFAULT 0;
    DECLARE v_client_retention_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_refund_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_performance_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_grade VARCHAR(10) DEFAULT 'C';
    DECLARE v_consultant_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('성과 업데이트 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '상담사 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_performance_date IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '성과 날짜는 필수입니다.';
        ROLLBACK;
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
        SET p_success = FALSE;
        SET p_message = '상담사를 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 3. 전체 스케줄 수 (테넌트 격리)
    SELECT COUNT(*) INTO v_total_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
      AND tenant_id = p_tenant_id
      AND date = p_performance_date 
      AND is_deleted = FALSE;
    
    -- 4. 완료된 스케줄 수 (테넌트 격리)
    SELECT COUNT(*) INTO v_completed_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
      AND tenant_id = p_tenant_id
      AND date = p_performance_date 
      AND status = 'COMPLETED' 
      AND is_deleted = FALSE;
    
    -- 5. 취소된 스케줄 수 (테넌트 격리)
    SELECT COUNT(*) INTO v_cancelled_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
      AND tenant_id = p_tenant_id
      AND date = p_performance_date 
      AND status = 'CANCELLED' 
      AND is_deleted = FALSE;
    
    -- 6. 노쇼 스케줄 수 (테넌트 격리)
    SELECT COUNT(*) INTO v_no_show_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
      AND tenant_id = p_tenant_id
      AND date = p_performance_date 
      AND status = 'NO_SHOW' 
      AND is_deleted = FALSE;
    
    -- 7. 완료율 계산
    IF v_total_schedules > 0 THEN
        SET v_completion_rate = (v_completed_schedules * 100.0) / v_total_schedules;
    END IF;
    
    -- 8. 총 수익 (테넌트 격리)
    SELECT COALESCE(SUM(ft.amount), 0) INTO v_total_revenue
    FROM financial_transactions ft
    JOIN schedules s ON ft.related_entity_id = s.id
    WHERE s.consultant_id = p_consultant_id
      AND s.tenant_id = p_tenant_id
      AND ft.tenant_id = p_tenant_id
      AND s.date = p_performance_date
      AND ft.related_entity_type = 'CONSULTATION_INCOME'
      AND ft.transaction_type = 'INCOME'
      AND ft.is_deleted = FALSE
      AND s.is_deleted = FALSE;
    
    -- 9. 평점 관련 (테넌트 격리)
    SELECT COUNT(*), COALESCE(AVG(heart_score), 0)
    INTO v_total_ratings, v_avg_rating
    FROM consultant_ratings cr
    JOIN schedules s ON cr.schedule_id = s.id
    WHERE s.consultant_id = p_consultant_id
      AND s.tenant_id = p_tenant_id
      AND cr.tenant_id = p_tenant_id
      AND s.date = p_performance_date
      AND cr.status = 'ACTIVE'
      AND cr.is_deleted = FALSE
      AND s.is_deleted = FALSE;
    
    -- 10. 고유 내담자 수 (테넌트 격리)
    SELECT COUNT(DISTINCT client_id) INTO v_unique_clients
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
      AND tenant_id = p_tenant_id
      AND date = p_performance_date 
      AND is_deleted = FALSE;
    
    -- 11. 재방문 내담자 수 (테넌트 격리)
    SELECT COUNT(DISTINCT s1.client_id) INTO v_repeat_clients
    FROM schedules s1
    WHERE s1.consultant_id = p_consultant_id 
      AND s1.tenant_id = p_tenant_id
      AND s1.date = p_performance_date 
      AND s1.is_deleted = FALSE
      AND EXISTS (
          SELECT 1 FROM schedules s2 
          WHERE s2.consultant_id = p_consultant_id 
            AND s2.tenant_id = p_tenant_id
            AND s2.client_id = s1.client_id 
            AND s2.date < p_performance_date 
            AND s2.is_deleted = FALSE
      );
    
    -- 12. 고객 유지율 계산
    IF v_unique_clients > 0 THEN
        SET v_client_retention_rate = (v_repeat_clients * 100.0) / v_unique_clients;
    END IF;
    
    -- 13. 환불율 계산 (임시로 0으로 설정, 추후 개선)
    SET v_refund_rate = 0.00;
    
    -- 14. 성과 점수 계산 (가중평균)
    SET v_performance_score = (
        (v_completion_rate * 0.4) +
        (v_avg_rating * 20 * 0.3) +
        (v_client_retention_rate * 0.2) +
        ((100 - v_refund_rate) * 0.1)
    );
    
    -- 15. 등급 계산
    IF v_performance_score >= 90 THEN
        SET v_grade = 'S';
    ELSEIF v_performance_score >= 80 THEN
        SET v_grade = 'A';
    ELSEIF v_performance_score >= 70 THEN
        SET v_grade = 'B';
    ELSE
        SET v_grade = 'C';
    END IF;
    
    -- 16. 기존 성과 데이터 삭제 후 새로 삽입 (UPSERT, 테넌트 격리)
    DELETE FROM consultant_performance 
    WHERE consultant_id = p_consultant_id 
      AND tenant_id = p_tenant_id
      AND performance_date = p_performance_date;
    
    INSERT INTO consultant_performance (
        consultant_id, 
        performance_date, 
        total_schedules, 
        completed_schedules,
        cancelled_schedules, 
        no_show_schedules, 
        completion_rate, 
        total_revenue,
        total_ratings, 
        avg_rating, 
        unique_clients, 
        repeat_clients,
        client_retention_rate, 
        refund_rate, 
        performance_score, 
        grade,
        tenant_id,
        created_at, 
        created_by,
        updated_at,
        updated_by,
        is_deleted
    ) VALUES (
        p_consultant_id, 
        p_performance_date, 
        v_total_schedules, 
        v_completed_schedules,
        v_cancelled_schedules, 
        v_no_show_schedules, 
        v_completion_rate, 
        v_total_revenue,
        v_total_ratings, 
        v_avg_rating, 
        v_unique_clients, 
        v_repeat_clients,
        v_client_retention_rate, 
        v_refund_rate, 
        v_performance_score, 
        v_grade,
        p_tenant_id,
        NOW(), 
        p_updated_by,
        NOW(),
        p_updated_by,
        FALSE
    );
    
    SET p_success = TRUE;
    SET p_message = CONCAT('상담사 성과 업데이트 완료. 성과 점수: ', v_performance_score, ', 등급: ', v_grade);
    
    COMMIT;
    
END //

DELIMITER ;

