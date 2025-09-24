-- ============================================================================
-- PL/SQL 프로시저 생성 스크립트
-- 기존 Java Stream 기반 통계 처리를 PL/SQL로 대체하여 성능 향상
-- ============================================================================

-- 1. 일별 통계 업데이트 프로시저
DROP PROCEDURE IF EXISTS UpdateDailyStatistics;

DELIMITER $$

CREATE PROCEDURE UpdateDailyStatistics(
    IN p_branch_code VARCHAR(20),
    IN p_stat_date DATE
)
BEGIN
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
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 총 상담 수
    SELECT COUNT(*) INTO v_total_consultations
    FROM schedules 
    WHERE date = p_stat_date 
    AND branch_code = p_branch_code 
    AND is_deleted = false;
    
    -- 완료된 상담 수
    SELECT COUNT(*) INTO v_completed_consultations
    FROM schedules 
    WHERE date = p_stat_date 
    AND branch_code = p_branch_code 
    AND status = 'COMPLETED' 
    AND is_deleted = false;
    
    -- 취소된 상담 수
    SELECT COUNT(*) INTO v_cancelled_consultations
    FROM schedules 
    WHERE date = p_stat_date 
    AND branch_code = p_branch_code 
    AND status = 'CANCELLED' 
    AND is_deleted = false;
    
    -- 총 수익 (상담 수입)
    SELECT COALESCE(SUM(ft.amount), 0) INTO v_total_revenue
    FROM financial_transactions ft
    JOIN schedules s ON ft.related_entity_id = s.id
    WHERE s.date = p_stat_date 
    AND s.branch_code = p_branch_code
    AND ft.related_entity_type = 'CONSULTATION_INCOME'
    AND ft.transaction_type = 'INCOME'
    AND ft.is_deleted = false
    AND s.is_deleted = false;
    
    -- 환불 건수와 금액
    SELECT 
        COUNT(*),
        COALESCE(SUM(ABS(ft.amount)), 0)
    INTO v_total_refunds, v_refund_amount
    FROM financial_transactions ft
    JOIN schedules s ON ft.related_entity_id = s.id
    WHERE s.date = p_stat_date 
    AND s.branch_code = p_branch_code
    AND ft.related_entity_type = 'CONSULTATION_REFUND'
    AND ft.transaction_type = 'REFUND'
    AND ft.is_deleted = false
    AND s.is_deleted = false;
    
    -- 평균 평점
    SELECT COALESCE(AVG(cr.heart_score), 0) INTO v_avg_rating
    FROM consultant_ratings cr
    JOIN schedules s ON cr.schedule_id = s.id
    WHERE s.date = p_stat_date 
    AND s.branch_code = p_branch_code
    AND cr.status = 'ACTIVE'
    AND s.is_deleted = false;
    
    -- 활성 상담사 수
    SELECT COUNT(DISTINCT u.id) INTO v_consultant_count
    FROM users u
    JOIN schedules s ON u.id = s.consultant_id
    WHERE s.date = p_stat_date 
    AND u.branch_code = p_branch_code
    AND u.role = 'CONSULTANT'
    AND u.is_active = true
    AND s.is_deleted = false;
    
    -- 내담자 수
    SELECT COUNT(DISTINCT s.client_id) INTO v_client_count
    FROM schedules s
    WHERE s.date = p_stat_date 
    AND s.branch_code = p_branch_code
    AND s.is_deleted = false;
    
    -- 기존 통계 삭제 후 새로 삽입 (UPSERT)
    DELETE FROM daily_statistics 
    WHERE stat_date = p_stat_date AND branch_code = p_branch_code;
    
    INSERT INTO daily_statistics (
        stat_date, branch_code, total_consultations, completed_consultations,
        cancelled_consultations, total_revenue, total_refunds, refund_amount,
        avg_rating, consultant_count, client_count,
        created_at, updated_at, is_deleted, version
    ) VALUES (
        p_stat_date, p_branch_code, v_total_consultations, v_completed_consultations,
        v_cancelled_consultations, v_total_revenue, v_total_refunds, v_refund_amount,
        v_avg_rating, v_consultant_count, v_client_count,
        NOW(), NOW(), false, 0
    );
    
    COMMIT;
    
END$$

DELIMITER ;

-- ============================================================================
-- 2. 모든 지점 일별 통계 업데이트 프로시저
-- ============================================================================

DROP PROCEDURE IF EXISTS UpdateAllBranchDailyStatistics;

DELIMITER $$

CREATE PROCEDURE UpdateAllBranchDailyStatistics(
    IN p_stat_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_branch_code VARCHAR(20);
    
    DECLARE branch_cursor CURSOR FOR
        SELECT DISTINCT branch_code 
        FROM schedules 
        WHERE date = p_stat_date AND is_deleted = false;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    OPEN branch_cursor;
    
    read_loop: LOOP
        FETCH branch_cursor INTO v_branch_code;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        CALL UpdateDailyStatistics(v_branch_code, p_stat_date);
    END LOOP;
    
    CLOSE branch_cursor;
    
    COMMIT;
    
END$$

DELIMITER ;

-- ============================================================================
-- 3. 상담사별 성과 업데이트 프로시저
-- ============================================================================

DROP PROCEDURE IF EXISTS UpdateConsultantPerformance;

DELIMITER $$

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
    DECLARE v_total_revenue DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_total_ratings INT DEFAULT 0;
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT 0.00;
    DECLARE v_unique_clients INT DEFAULT 0;
    DECLARE v_repeat_clients INT DEFAULT 0;
    DECLARE v_client_retention_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_refund_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_performance_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_grade VARCHAR(10) DEFAULT 'C';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 전체 스케줄 수
    SELECT COUNT(*) INTO v_total_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND is_deleted = false;
    
    -- 완료된 스케줄 수
    SELECT COUNT(*) INTO v_completed_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND status = 'COMPLETED' 
    AND is_deleted = false;
    
    -- 취소된 스케줄 수
    SELECT COUNT(*) INTO v_cancelled_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND status = 'CANCELLED' 
    AND is_deleted = false;
    
    -- 노쇼 스케줄 수
    SELECT COUNT(*) INTO v_no_show_schedules
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND status = 'NO_SHOW' 
    AND is_deleted = false;
    
    -- 완료율 계산
    IF v_total_schedules > 0 THEN
        SET v_completion_rate = (v_completed_schedules * 100.0) / v_total_schedules;
    END IF;
    
    -- 총 수익
    SELECT COALESCE(SUM(ft.amount), 0) INTO v_total_revenue
    FROM financial_transactions ft
    JOIN schedules s ON ft.related_entity_id = s.id
    WHERE s.consultant_id = p_consultant_id
    AND s.date = p_performance_date
    AND ft.related_entity_type = 'CONSULTATION_INCOME'
    AND ft.transaction_type = 'INCOME'
    AND ft.is_deleted = false
    AND s.is_deleted = false;
    
    -- 평점 관련
    SELECT COUNT(*), COALESCE(AVG(heart_score), 0)
    INTO v_total_ratings, v_avg_rating
    FROM consultant_ratings cr
    JOIN schedules s ON cr.schedule_id = s.id
    WHERE s.consultant_id = p_consultant_id
    AND s.date = p_performance_date
    AND cr.status = 'ACTIVE'
    AND s.is_deleted = false;
    
    -- 고유 내담자 수
    SELECT COUNT(DISTINCT client_id) INTO v_unique_clients
    FROM schedules 
    WHERE consultant_id = p_consultant_id 
    AND date = p_performance_date 
    AND is_deleted = false;
    
    -- 재방문 내담자 수 (이전에 해당 상담사와 상담한 적이 있는 내담자)
    SELECT COUNT(DISTINCT s1.client_id) INTO v_repeat_clients
    FROM schedules s1
    WHERE s1.consultant_id = p_consultant_id 
    AND s1.date = p_performance_date 
    AND s1.is_deleted = false
    AND EXISTS (
        SELECT 1 FROM schedules s2 
        WHERE s2.consultant_id = p_consultant_id 
        AND s2.client_id = s1.client_id 
        AND s2.date < p_performance_date 
        AND s2.is_deleted = false
    );
    
    -- 고객 유지율 계산
    IF v_unique_clients > 0 THEN
        SET v_client_retention_rate = (v_repeat_clients * 100.0) / v_unique_clients;
    END IF;
    
    -- 환불율 계산 (임시로 0으로 설정, 추후 개선)
    SET v_refund_rate = 0.00;
    
    -- 성과 점수 계산 (가중평균)
    SET v_performance_score = (
        (v_completion_rate * 0.4) +
        (v_avg_rating * 20 * 0.3) +
        (v_client_retention_rate * 0.2) +
        ((100 - v_refund_rate) * 0.1)
    );
    
    -- 등급 계산
    IF v_performance_score >= 90 THEN
        SET v_grade = 'S';
    ELSEIF v_performance_score >= 80 THEN
        SET v_grade = 'A';
    ELSEIF v_performance_score >= 70 THEN
        SET v_grade = 'B';
    ELSE
        SET v_grade = 'C';
    END IF;
    
    -- 기존 성과 데이터 삭제 후 새로 삽입 (UPSERT)
    DELETE FROM consultant_performance 
    WHERE consultant_id = p_consultant_id AND performance_date = p_performance_date;
    
    INSERT INTO consultant_performance (
        consultant_id, performance_date, total_schedules, completed_schedules,
        cancelled_schedules, no_show_schedules, completion_rate, total_revenue,
        total_ratings, avg_rating, unique_clients, repeat_clients,
        client_retention_rate, refund_rate, performance_score, grade,
        created_at, updated_at
    ) VALUES (
        p_consultant_id, p_performance_date, v_total_schedules, v_completed_schedules,
        v_cancelled_schedules, v_no_show_schedules, v_completion_rate, v_total_revenue,
        v_total_ratings, v_avg_rating, v_unique_clients, v_repeat_clients,
        v_client_retention_rate, v_refund_rate, v_performance_score, v_grade,
        NOW(), NOW()
    );
    
    COMMIT;
    
END$$

DELIMITER ;

-- ============================================================================
-- 4. 모든 상담사 성과 업데이트 프로시저
-- ============================================================================

DROP PROCEDURE IF EXISTS UpdateAllConsultantPerformance;

DELIMITER $$

CREATE PROCEDURE UpdateAllConsultantPerformance(
    IN p_performance_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    
    DECLARE consultant_cursor CURSOR FOR
        SELECT DISTINCT consultant_id 
        FROM schedules 
        WHERE date = p_performance_date AND is_deleted = false;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    OPEN consultant_cursor;
    
    read_loop: LOOP
        FETCH consultant_cursor INTO v_consultant_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        CALL UpdateConsultantPerformance(v_consultant_id, p_performance_date);
    END LOOP;
    
    CLOSE consultant_cursor;
    
    COMMIT;
    
END$$

DELIMITER ;

-- ============================================================================
-- 5. 일일 성과 모니터링 프로시저 (알림 생성)
-- ============================================================================

DROP PROCEDURE IF EXISTS DailyPerformanceMonitoring;

DELIMITER $$

CREATE PROCEDURE DailyPerformanceMonitoring(
    IN p_monitoring_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_consultant_name VARCHAR(100);
    DECLARE v_completion_rate DECIMAL(5,2);
    DECLARE v_alert_message TEXT;
    
    DECLARE consultant_cursor CURSOR FOR
        SELECT 
            cp.consultant_id, 
            u.name,
            cp.completion_rate
        FROM consultant_performance cp
        JOIN users u ON cp.consultant_id = u.id
        WHERE cp.performance_date = p_monitoring_date
        AND cp.completion_rate < 70.0  -- 완료율 70% 미만
        AND u.is_active = true;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    OPEN consultant_cursor;
    
    read_loop: LOOP
        FETCH consultant_cursor INTO v_consultant_id, v_consultant_name, v_completion_rate;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 알림 메시지 생성
        SET v_alert_message = CONCAT(
            '완료율 기준 미달: ', 
            ROUND(v_completion_rate, 1), 
            '% (기준: 70%)'
        );
        
        -- 기존 알림이 없는 경우에만 새 알림 생성
        IF NOT EXISTS (
            SELECT 1 FROM performance_alerts 
            WHERE consultant_id = v_consultant_id 
            AND DATE(created_at) = p_monitoring_date
            AND alert_level = 'WARNING'
        ) THEN
            INSERT INTO performance_alerts (
                consultant_id, consultant_name, alert_level, completion_rate,
                alert_message, status, created_at
            ) VALUES (
                v_consultant_id, v_consultant_name, 'WARNING', v_completion_rate,
                v_alert_message, 'PENDING', NOW()
            );
        END IF;
        
    END LOOP;
    
    CLOSE consultant_cursor;
    
    COMMIT;
    
END$$

DELIMITER ;

-- ============================================================================
-- 프로시저 생성 완료 로그
-- ============================================================================

SELECT 'PL/SQL 프로시저 생성 완료' AS STATUS;
SELECT 
    ROUTINE_NAME as 'Created Procedures',
    CREATED as 'Created At'
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_TYPE = 'PROCEDURE' 
AND ROUTINE_NAME IN (
    'UpdateDailyStatistics', 
    'UpdateAllBranchDailyStatistics',
    'UpdateConsultantPerformance', 
    'UpdateAllConsultantPerformance',
    'DailyPerformanceMonitoring'
)
ORDER BY CREATED;
