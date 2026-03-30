-- =====================================================
-- 추이 통계 조회 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetBranchTrendStatistics //

CREATE PROCEDURE GetBranchTrendStatistics(
    IN p_tenant_id VARCHAR(100),
    IN p_period VARCHAR(20),
    IN p_metric VARCHAR(20),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_trend_data JSON
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    DECLARE v_users_data JSON;
    DECLARE v_schedules_data JSON;
    DECLARE v_ratings_data JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('추이 통계 조회 중 오류 발생: ', v_error_message);
        SET p_trend_data = JSON_OBJECT('error', v_error_message);
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_trend_data = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        LEAVE;
    END IF;
    
    -- 2. 기간 계산
    SET end_date = CURDATE();
    CASE p_period
        WHEN 'WEEK' THEN SET start_date = DATE_SUB(end_date, INTERVAL 7 DAY);
        WHEN 'MONTH' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
        WHEN 'QUARTER' THEN SET start_date = DATE_SUB(end_date, INTERVAL 3 MONTH);
        WHEN 'YEAR' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 YEAR);
        ELSE SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
    END CASE;
    
    -- 3. 메트릭별 추이 분석 (테넌트 격리)
    CASE p_metric
        WHEN 'DAILY_USERS' THEN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'date', DATE(u.created_at),
                    'new_users', COUNT(*),
                    'new_consultants', COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END),
                    'new_clients', COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END)
                )
            )
            INTO v_users_data
            FROM users u
            WHERE u.tenant_id = p_tenant_id
              AND u.is_deleted = FALSE
              AND DATE(u.created_at) BETWEEN start_date AND end_date
            GROUP BY DATE(u.created_at)
            ORDER BY DATE(u.created_at);
            
            SET p_trend_data = JSON_OBJECT('metric', 'DAILY_USERS', 'data', IFNULL(v_users_data, JSON_ARRAY()));
            
        WHEN 'DAILY_SCHEDULES' THEN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'date', s.date,
                    'total_schedules', COUNT(*),
                    'completed', COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END),
                    'cancelled', COUNT(CASE WHEN s.status = 'CANCELLED' THEN 1 END)
                )
            )
            INTO v_schedules_data
            FROM schedules s
            WHERE s.tenant_id = p_tenant_id
              AND s.is_deleted = FALSE
              AND s.date BETWEEN start_date AND end_date
            GROUP BY s.date
            ORDER BY s.date;
            
            SET p_trend_data = JSON_OBJECT('metric', 'DAILY_SCHEDULES', 'data', IFNULL(v_schedules_data, JSON_ARRAY()));
            
        WHEN 'WEEKLY_RATINGS' THEN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'week', YEARWEEK(cr.created_at),
                    'total_ratings', COUNT(*),
                    'average_rating', ROUND(AVG(cr.heart_score), 2),
                    'high_ratings', COUNT(CASE WHEN cr.heart_score >= 4 THEN 1 END)
                )
            )
            INTO v_ratings_data
            FROM consultant_ratings cr
            WHERE cr.tenant_id = p_tenant_id
              AND cr.is_deleted = FALSE
              AND cr.created_at BETWEEN start_date AND end_date
            GROUP BY YEARWEEK(cr.created_at)
            ORDER BY YEARWEEK(cr.created_at);
            
            SET p_trend_data = JSON_OBJECT('metric', 'WEEKLY_RATINGS', 'data', IFNULL(v_ratings_data, JSON_ARRAY()));
            
        ELSE
            -- 기본값: 일별 사용자
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'date', DATE(u.created_at),
                    'new_users', COUNT(*)
                )
            )
            INTO v_users_data
            FROM users u
            WHERE u.tenant_id = p_tenant_id
              AND u.is_deleted = FALSE
              AND DATE(u.created_at) BETWEEN start_date AND end_date
            GROUP BY DATE(u.created_at)
            ORDER BY DATE(u.created_at);
            
            SET p_trend_data = JSON_OBJECT('metric', 'DAILY_USERS', 'data', IFNULL(v_users_data, JSON_ARRAY()));
    END CASE;
    
    SET p_success = TRUE;
    SET p_message = CONCAT('추이 통계 조회가 완료되었습니다. (메트릭: ', p_metric, ')');
    
END //

DELIMITER ;

