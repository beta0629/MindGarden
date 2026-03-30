-- =====================================================
-- 통계 비교 조회 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetBranchComparisonStatistics //

CREATE PROCEDURE GetBranchComparisonStatistics(
    IN p_tenant_id VARCHAR(100),
    IN p_period VARCHAR(20),
    IN p_metric VARCHAR(20), -- 'USERS', 'SCHEDULES', 'RATINGS', 'REVENUE'
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_statistics_data JSON
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    DECLARE v_users_data JSON;
    DECLARE v_schedules_data JSON;
    DECLARE v_ratings_data JSON;
    DECLARE v_revenue_data JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('통계 비교 조회 중 오류 발생: ', v_error_message);
        SET p_statistics_data = JSON_OBJECT('error', v_error_message);
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_statistics_data = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
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
    
    -- 3. 메트릭별 통계 조회 (테넌트 격리)
    CASE p_metric
        WHEN 'USERS' THEN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'total_users', COUNT(u.id),
                    'active_users', COUNT(CASE WHEN u.is_active = TRUE THEN 1 END),
                    'consultants', COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END),
                    'clients', COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END)
                )
            )
            INTO v_users_data
            FROM users u
            WHERE u.tenant_id = p_tenant_id
              AND u.is_deleted = FALSE
              AND DATE(u.created_at) BETWEEN start_date AND end_date;
            
            SET p_statistics_data = JSON_OBJECT('metric', 'USERS', 'data', IFNULL(v_users_data, JSON_ARRAY()));
            
        WHEN 'SCHEDULES' THEN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'date', s.date,
                    'total_schedules', COUNT(s.id),
                    'completed_schedules', COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END),
                    'cancelled_schedules', COUNT(CASE WHEN s.status = 'CANCELLED' THEN 1 END),
                    'completion_rate', ROUND(COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(s.id), 2)
                )
            )
            INTO v_schedules_data
            FROM schedules s
            WHERE s.tenant_id = p_tenant_id
              AND s.is_deleted = FALSE
              AND s.date BETWEEN start_date AND end_date
            GROUP BY s.date
            ORDER BY s.date;
            
            SET p_statistics_data = JSON_OBJECT('metric', 'SCHEDULES', 'data', IFNULL(v_schedules_data, JSON_ARRAY()));
            
        WHEN 'RATINGS' THEN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'total_ratings', COUNT(cr.id),
                    'average_rating', ROUND(AVG(cr.heart_score), 2),
                    'high_ratings', COUNT(CASE WHEN cr.heart_score >= 4 THEN 1 END),
                    'satisfaction_rate', ROUND(COUNT(CASE WHEN cr.heart_score >= 4 THEN 1 END) * 100.0 / COUNT(cr.id), 2)
                )
            )
            INTO v_ratings_data
            FROM consultant_ratings cr
            WHERE cr.tenant_id = p_tenant_id
              AND cr.is_deleted = FALSE
              AND cr.created_at BETWEEN start_date AND end_date;
            
            SET p_statistics_data = JSON_OBJECT('metric', 'RATINGS', 'data', IFNULL(v_ratings_data, JSON_ARRAY()));
            
        WHEN 'REVENUE' THEN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'date', DATE(ft.transaction_date),
                    'revenue', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0),
                    'expenses', COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
                    'net_profit', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                        SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0)
                )
            )
            INTO v_revenue_data
            FROM financial_transactions ft
            WHERE ft.tenant_id = p_tenant_id
              AND ft.is_deleted = FALSE
              AND ft.transaction_date BETWEEN start_date AND end_date
            GROUP BY DATE(ft.transaction_date)
            ORDER BY DATE(ft.transaction_date);
            
            SET p_statistics_data = JSON_OBJECT('metric', 'REVENUE', 'data', IFNULL(v_revenue_data, JSON_ARRAY()));
            
        ELSE
            -- 기본값: 사용자 통계
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'total_users', COUNT(u.id),
                    'active_users', COUNT(CASE WHEN u.is_active = TRUE THEN 1 END)
                )
            )
            INTO v_users_data
            FROM users u
            WHERE u.tenant_id = p_tenant_id
              AND u.is_deleted = FALSE
              AND DATE(u.created_at) BETWEEN start_date AND end_date;
            
            SET p_statistics_data = JSON_OBJECT('metric', 'USERS', 'data', IFNULL(v_users_data, JSON_ARRAY()));
    END CASE;
    
    SET p_success = TRUE;
    SET p_message = CONCAT('통계 비교 조회가 완료되었습니다. (메트릭: ', p_metric, ')');
    
END //

DELIMITER ;

