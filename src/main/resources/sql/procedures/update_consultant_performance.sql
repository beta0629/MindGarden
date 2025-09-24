-- ====================================================================
-- 상담사별 성과 분석 업데이트 프로시저
-- 매일 실행되어 상담사별 성과 데이터를 실시간 업데이트
-- ====================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS UpdateConsultantPerformance//

CREATE PROCEDURE UpdateConsultantPerformance(
    IN p_consultant_id BIGINT,
    IN p_performance_date DATE
)
BEGIN
    DECLARE v_total_schedules INT DEFAULT 0;
    DECLARE v_completed_schedules INT DEFAULT 0;
    DECLARE v_cancelled_schedules INT DEFAULT 0;
    DECLARE v_no_show_schedules INT DEFAULT 0;
    DECLARE v_completion_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT 0.00;
    DECLARE v_total_revenue DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_client_retention_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_refund_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_total_ratings INT DEFAULT 0;
    DECLARE v_unique_clients INT DEFAULT 0;
    DECLARE v_repeat_clients INT DEFAULT 0;
    DECLARE v_performance_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_grade VARCHAR(10) DEFAULT 'D급';
    
    -- 공통코드에서 성과 평가 기준 조회
    DECLARE v_completion_weight DECIMAL(5,2) DEFAULT 30.0;
    DECLARE v_rating_weight DECIMAL(5,2) DEFAULT 20.0;
    DECLARE v_retention_weight DECIMAL(5,2) DEFAULT 20.0;
    DECLARE v_cancellation_bonus DECIMAL(5,2) DEFAULT 15.0;
    DECLARE v_noshow_bonus DECIMAL(5,2) DEFAULT 15.0;
    
    -- 등급 기준
    DECLARE v_grade_s_threshold DECIMAL(5,2) DEFAULT 90.0;
    DECLARE v_grade_a_threshold DECIMAL(5,2) DEFAULT 80.0;
    DECLARE v_grade_b_threshold DECIMAL(5,2) DEFAULT 70.0;
    DECLARE v_grade_c_threshold DECIMAL(5,2) DEFAULT 60.0;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        INSERT INTO system_logs (log_level, log_message, created_at)
        VALUES ('ERROR', 
                CONCAT('상담사 성과 업데이트 실패: ', p_consultant_id, ', 날짜: ', p_performance_date), 
                NOW());
        RESIGNAL;
    END;

    START TRANSACTION;
    
    -- 로그 시작
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', 
            CONCAT('상담사 성과 업데이트 시작: ', p_consultant_id, ', 날짜: ', p_performance_date), 
            NOW());
    
    -- 1. 공통코드에서 성과 평가 기준 조회
    SELECT COALESCE(CAST(code_description AS DECIMAL(5,2)), 30.0)
    INTO v_completion_weight
    FROM common_codes 
    WHERE code_group = 'PERFORMANCE_WEIGHT' AND code_value = 'COMPLETION_RATE' AND is_active = TRUE
    LIMIT 1;
    
    SELECT COALESCE(CAST(code_description AS DECIMAL(5,2)), 20.0)
    INTO v_rating_weight
    FROM common_codes 
    WHERE code_group = 'PERFORMANCE_WEIGHT' AND code_value = 'AVERAGE_RATING' AND is_active = TRUE
    LIMIT 1;
    
    SELECT COALESCE(CAST(code_description AS DECIMAL(5,2)), 20.0)
    INTO v_retention_weight
    FROM common_codes 
    WHERE code_group = 'PERFORMANCE_WEIGHT' AND code_value = 'CLIENT_RETENTION' AND is_active = TRUE
    LIMIT 1;
    
    -- 2. 스케줄 기반 성과 데이터 집계
    SELECT 
        COUNT(*) as total_schedules,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_schedules,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_schedules,
        SUM(CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END) as no_show_schedules,
        COUNT(DISTINCT client_id) as unique_clients
    INTO 
        v_total_schedules,
        v_completed_schedules,
        v_cancelled_schedules,
        v_no_show_schedules,
        v_unique_clients
    FROM schedules
    WHERE consultant_id = p_consultant_id
      AND DATE(date) = p_performance_date
      AND is_deleted = FALSE;
    
    -- 3. 완료율 계산
    IF v_total_schedules > 0 THEN
        SET v_completion_rate = (v_completed_schedules / v_total_schedules) * 100;
    END IF;
    
    -- 4. 평균 평점 및 총 평점 수 계산
    SELECT 
        COALESCE(AVG(cr.rating), 0),
        COUNT(*)
    INTO 
        v_avg_rating,
        v_total_ratings
    FROM consultant_ratings cr
    INNER JOIN schedules s ON cr.consultation_id = s.id
    WHERE s.consultant_id = p_consultant_id
      AND DATE(s.date) = p_performance_date
      AND s.status = 'COMPLETED'
      AND cr.is_deleted = FALSE
      AND s.is_deleted = FALSE;
    
    -- 5. 수익 계산 (완료된 스케줄 * 기본 세션비 50,000원)
    SET v_total_revenue = v_completed_schedules * 50000;
    
    -- 6. 재방문 고객 수 계산 (해당 상담사와 이전에도 상담한 고객)
    SELECT COUNT(DISTINCT s.client_id)
    INTO v_repeat_clients
    FROM schedules s
    WHERE s.consultant_id = p_consultant_id
      AND DATE(s.date) = p_performance_date
      AND s.status = 'COMPLETED'
      AND s.is_deleted = FALSE
      AND EXISTS (
          SELECT 1 FROM schedules s2 
          WHERE s2.consultant_id = p_consultant_id
            AND s2.client_id = s.client_id
            AND DATE(s2.date) < p_performance_date
            AND s2.status = 'COMPLETED'
            AND s2.is_deleted = FALSE
      );
    
    -- 7. 고객 유지율 계산
    IF v_unique_clients > 0 THEN
        SET v_client_retention_rate = (v_repeat_clients / v_unique_clients) * 100;
    END IF;
    
    -- 8. 환불율 계산 (해당 상담사의 환불 건수 / 완료된 상담)
    IF v_completed_schedules > 0 THEN
        SELECT 
            (COUNT(*) / v_completed_schedules) * 100
        INTO v_refund_rate
        FROM financial_transactions ft
        INNER JOIN schedules s ON ft.related_entity_id = s.id
        WHERE s.consultant_id = p_consultant_id
          AND DATE(s.date) = p_performance_date
          AND ft.transaction_type = 'REFUND'
          AND ft.related_entity_type = 'SCHEDULE'
          AND ft.is_deleted = FALSE
          AND s.is_deleted = FALSE;
    END IF;
    
    -- 9. 성과 점수 계산 (가중치 기반)
    SET v_performance_score = 0;
    
    -- 완료율 점수
    SET v_performance_score = v_performance_score + (v_completion_rate * v_completion_weight / 100);
    
    -- 평균 평점 점수 (5점 만점을 100점 만점으로 환산)
    SET v_performance_score = v_performance_score + ((v_avg_rating / 5) * 100 * v_rating_weight / 100);
    
    -- 고객 유지율 점수
    SET v_performance_score = v_performance_score + (v_client_retention_rate * v_retention_weight / 100);
    
    -- 취소율 보너스 (10% 미만이면 보너스 점수)
    IF v_total_schedules > 0 AND (v_cancelled_schedules / v_total_schedules * 100) < 10 THEN
        SET v_performance_score = v_performance_score + v_cancellation_bonus;
    END IF;
    
    -- 노쇼율 보너스 (5% 미만이면 보너스 점수)
    IF v_total_schedules > 0 AND (v_no_show_schedules / v_total_schedules * 100) < 5 THEN
        SET v_performance_score = v_performance_score + v_noshow_bonus;
    END IF;
    
    -- 10. 등급 계산
    IF v_performance_score >= v_grade_s_threshold THEN
        SET v_grade = 'S급';
    ELSEIF v_performance_score >= v_grade_a_threshold THEN
        SET v_grade = 'A급';
    ELSEIF v_performance_score >= v_grade_b_threshold THEN
        SET v_grade = 'B급';
    ELSEIF v_performance_score >= v_grade_c_threshold THEN
        SET v_grade = 'C급';
    ELSE
        SET v_grade = 'D급';
    END IF;
    
    -- 11. 기존 성과 데이터 삭제 후 새로 삽입 (UPSERT)
    DELETE FROM consultant_performance 
    WHERE consultant_id = p_consultant_id 
      AND performance_date = p_performance_date;
    
    INSERT INTO consultant_performance (
        consultant_id,
        performance_date,
        completion_rate,
        avg_rating,
        total_revenue,
        client_retention_rate,
        performance_score,
        grade,
        refund_rate,
        total_schedules,
        completed_schedules,
        cancelled_schedules,
        no_show_schedules,
        total_ratings,
        unique_clients,
        repeat_clients,
        created_at,
        updated_at
    ) VALUES (
        p_consultant_id,
        p_performance_date,
        v_completion_rate,
        v_avg_rating,
        v_total_revenue,
        v_client_retention_rate,
        v_performance_score,
        v_grade,
        v_refund_rate,
        v_total_schedules,
        v_completed_schedules,
        v_cancelled_schedules,
        v_no_show_schedules,
        v_total_ratings,
        v_unique_clients,
        v_repeat_clients,
        NOW(),
        NOW()
    );
    
    COMMIT;
    
    -- 로그 완료
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', 
            CONCAT('상담사 성과 업데이트 완료: ', p_consultant_id, 
                   ', 날짜: ', p_performance_date,
                   ', 점수: ', v_performance_score,
                   ', 등급: ', v_grade), 
            NOW());
            
END//

DELIMITER ;

-- ====================================================================
-- 모든 상담사 성과 업데이트 프로시저
-- ====================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS UpdateAllConsultantPerformance//

CREATE PROCEDURE UpdateAllConsultantPerformance(
    IN p_performance_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_processed_count INT DEFAULT 0;
    
    -- 활성 상담사 커서
    DECLARE consultant_cursor CURSOR FOR 
        SELECT id 
        FROM users 
        WHERE role = 'CONSULTANT' 
          AND is_active = TRUE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        INSERT INTO system_logs (log_level, log_message, created_at)
        VALUES ('ERROR', 
                CONCAT('모든 상담사 성과 업데이트 실패: ', p_performance_date, ', 오류: ', @@error_count), 
                NOW());
        RESIGNAL;
    END;

    START TRANSACTION;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('모든 상담사 성과 업데이트 시작: ', p_performance_date), NOW());
    
    OPEN consultant_cursor;
    
    read_loop: LOOP
        FETCH consultant_cursor INTO v_consultant_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 각 상담사별 성과 업데이트
        CALL UpdateConsultantPerformance(v_consultant_id, p_performance_date);
        SET v_processed_count = v_processed_count + 1;
        
    END LOOP;
    
    CLOSE consultant_cursor;
    
    COMMIT;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', 
            CONCAT('모든 상담사 성과 업데이트 완료: ', p_performance_date, 
                   ', 처리된 상담사 수: ', v_processed_count), 
            NOW());
            
END//

DELIMITER ;
