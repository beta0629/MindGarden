-- 지점 통계 관련 PL/SQL 프로시저들
-- 복잡한 통계 계산을 위한 저장 프로시저

DELIMITER $$

-- 1. 전체 지점 현황 통계 프로시저
DROP PROCEDURE IF EXISTS GetOverallBranchStatistics$$
CREATE PROCEDURE GetOverallBranchStatistics(
    IN p_period VARCHAR(20), -- 'WEEK', 'MONTH', 'QUARTER', 'YEAR'
    OUT p_total_branches INT,
    OUT p_active_branches INT,
    OUT p_total_users INT,
    OUT p_active_users INT,
    OUT p_total_consultants INT,
    OUT p_active_consultants INT,
    OUT p_total_clients INT,
    OUT p_active_clients INT,
    OUT p_total_schedules INT,
    OUT p_completed_schedules INT,
    OUT p_cancelled_schedules INT,
    OUT p_average_rating DECIMAL(3,2)
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 기간 계산
    SET end_date = CURDATE();
    CASE p_period
        WHEN 'WEEK' THEN SET start_date = DATE_SUB(end_date, INTERVAL 7 DAY);
        WHEN 'MONTH' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
        WHEN 'QUARTER' THEN SET start_date = DATE_SUB(end_date, INTERVAL 3 MONTH);
        WHEN 'YEAR' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 YEAR);
        ELSE SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
    END CASE;
    
    -- 전체 지점 수
    SELECT COUNT(*) INTO p_total_branches FROM branches WHERE is_deleted = 0;
    
    -- 활성 지점 수
    SELECT COUNT(*) INTO p_active_branches 
    FROM branches 
    WHERE is_deleted = 0 AND branch_status = 'ACTIVE';
    
    -- 전체 사용자 수
    SELECT COUNT(*) INTO p_total_users 
    FROM users 
    WHERE is_deleted = 0;
    
    -- 활성 사용자 수
    SELECT COUNT(*) INTO p_active_users 
    FROM users 
    WHERE is_deleted = 0 AND is_active = 1;
    
    -- 전체 상담사 수
    SELECT COUNT(*) INTO p_total_consultants 
    FROM users 
    WHERE is_deleted = 0 AND role = 'CONSULTANT';
    
    -- 활성 상담사 수
    SELECT COUNT(*) INTO p_active_consultants 
    FROM users 
    WHERE is_deleted = 0 AND role = 'CONSULTANT' AND is_active = 1;
    
    -- 전체 내담자 수
    SELECT COUNT(*) INTO p_total_clients 
    FROM users 
    WHERE is_deleted = 0 AND role = 'CLIENT';
    
    -- 활성 내담자 수
    SELECT COUNT(*) INTO p_active_clients 
    FROM users 
    WHERE is_deleted = 0 AND role = 'CLIENT' AND is_active = 1;
    
    -- 전체 상담 일정 수
    SELECT COUNT(*) INTO p_total_schedules 
    FROM schedules 
    WHERE is_deleted = 0 AND date BETWEEN start_date AND end_date;
    
    -- 완료된 상담 일정 수
    SELECT COUNT(*) INTO p_completed_schedules 
    FROM schedules 
    WHERE is_deleted = 0 AND status = 'COMPLETED' AND date BETWEEN start_date AND end_date;
    
    -- 취소된 상담 일정 수
    SELECT COUNT(*) INTO p_cancelled_schedules 
    FROM schedules 
    WHERE is_deleted = 0 AND status = 'CANCELLED' AND date BETWEEN start_date AND end_date;
    
    -- 평균 평점
    SELECT COALESCE(AVG(rating), 0) INTO p_average_rating 
    FROM consultant_ratings 
    WHERE is_deleted = 0 AND created_at BETWEEN start_date AND end_date;
    
END$$

-- 2. 지점별 비교 통계 프로시저
DROP PROCEDURE IF EXISTS GetBranchComparisonStatistics$$
CREATE PROCEDURE GetBranchComparisonStatistics(
    IN p_period VARCHAR(20),
    IN p_metric VARCHAR(20) -- 'USERS', 'SCHEDULES', 'RATINGS', 'REVENUE'
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 기간 계산
    SET end_date = CURDATE();
    CASE p_period
        WHEN 'WEEK' THEN SET start_date = DATE_SUB(end_date, INTERVAL 7 DAY);
        WHEN 'MONTH' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
        WHEN 'QUARTER' THEN SET start_date = DATE_SUB(end_date, INTERVAL 3 MONTH);
        WHEN 'YEAR' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 YEAR);
        ELSE SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
    END CASE;
    
    -- 지점별 통계 조회
    CASE p_metric
        WHEN 'USERS' THEN
            SELECT 
                b.id as branch_id,
                b.branch_name,
                b.branch_code,
                COUNT(u.id) as total_users,
                COUNT(CASE WHEN u.is_active = 1 THEN 1 END) as active_users,
                COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END) as consultants,
                COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END) as clients
            FROM branches b
            LEFT JOIN users u ON b.id = u.branch_id AND u.is_deleted = 0
            WHERE b.is_deleted = 0
            GROUP BY b.id, b.branch_name, b.branch_code
            ORDER BY total_users DESC;
            
        WHEN 'SCHEDULES' THEN
            SELECT 
                b.id as branch_id,
                b.branch_name,
                b.branch_code,
                COUNT(s.id) as total_schedules,
                COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END) as completed_schedules,
                COUNT(CASE WHEN s.status = 'CANCELLED' THEN 1 END) as cancelled_schedules,
                ROUND(COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(s.id), 2) as completion_rate
            FROM branches b
            LEFT JOIN users u ON b.id = u.branch_id AND u.is_deleted = 0
            LEFT JOIN schedules s ON u.id = s.consultant_id AND s.is_deleted = 0 AND s.date BETWEEN start_date AND end_date
            WHERE b.is_deleted = 0
            GROUP BY b.id, b.branch_name, b.branch_code
            ORDER BY total_schedules DESC;
            
        WHEN 'RATINGS' THEN
            SELECT 
                b.id as branch_id,
                b.branch_name,
                b.branch_code,
                COUNT(cr.id) as total_ratings,
                ROUND(AVG(cr.rating), 2) as average_rating,
                COUNT(CASE WHEN cr.rating >= 4 THEN 1 END) as high_ratings,
                ROUND(COUNT(CASE WHEN cr.rating >= 4 THEN 1 END) * 100.0 / COUNT(cr.id), 2) as satisfaction_rate
            FROM branches b
            LEFT JOIN users u ON b.id = u.branch_id AND u.is_deleted = 0 AND u.role = 'CONSULTANT'
            LEFT JOIN consultant_ratings cr ON u.id = cr.consultant_id AND cr.is_deleted = 0 AND cr.created_at BETWEEN start_date AND end_date
            WHERE b.is_deleted = 0
            GROUP BY b.id, b.branch_name, b.branch_code
            ORDER BY average_rating DESC;
            
        ELSE
            -- 기본값: 사용자 통계
            SELECT 
                b.id as branch_id,
                b.branch_name,
                b.branch_code,
                COUNT(u.id) as total_users,
                COUNT(CASE WHEN u.is_active = 1 THEN 1 END) as active_users
            FROM branches b
            LEFT JOIN users u ON b.id = u.branch_id AND u.is_deleted = 0
            WHERE b.is_deleted = 0
            GROUP BY b.id, b.branch_name, b.branch_code
            ORDER BY total_users DESC;
    END CASE;
    
END$$

-- 3. 지점 추이 분석 프로시저
DROP PROCEDURE IF EXISTS GetBranchTrendStatistics$$
CREATE PROCEDURE GetBranchTrendStatistics(
    IN p_period VARCHAR(20),
    IN p_metric VARCHAR(20),
    IN p_branch_id INT
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 기간 계산
    SET end_date = CURDATE();
    CASE p_period
        WHEN 'WEEK' THEN SET start_date = DATE_SUB(end_date, INTERVAL 7 DAY);
        WHEN 'MONTH' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
        WHEN 'QUARTER' THEN SET start_date = DATE_SUB(end_date, INTERVAL 3 MONTH);
        WHEN 'YEAR' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 YEAR);
        ELSE SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
    END CASE;
    
    -- 지점별 추이 분석
    CASE p_metric
        WHEN 'DAILY_USERS' THEN
            SELECT 
                DATE(u.created_at) as date,
                COUNT(*) as new_users,
                COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END) as new_consultants,
                COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END) as new_clients
            FROM users u
            WHERE u.is_deleted = 0 
                AND u.branch_id = p_branch_id
                AND DATE(u.created_at) BETWEEN start_date AND end_date
            GROUP BY DATE(u.created_at)
            ORDER BY date;
            
        WHEN 'DAILY_SCHEDULES' THEN
            SELECT 
                s.date,
                COUNT(*) as total_schedules,
                COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END) as completed,
                COUNT(CASE WHEN s.status = 'CANCELLED' THEN 1 END) as cancelled
            FROM schedules s
            JOIN users u ON s.consultant_id = u.id
            WHERE s.is_deleted = 0 
                AND u.branch_id = p_branch_id
                AND s.date BETWEEN start_date AND end_date
            GROUP BY s.date
            ORDER BY s.date;
            
        WHEN 'WEEKLY_RATINGS' THEN
            SELECT 
                YEARWEEK(cr.created_at) as week,
                COUNT(*) as total_ratings,
                ROUND(AVG(cr.rating), 2) as average_rating,
                COUNT(CASE WHEN cr.rating >= 4 THEN 1 END) as high_ratings
            FROM consultant_ratings cr
            JOIN users u ON cr.consultant_id = u.id
            WHERE cr.is_deleted = 0 
                AND u.branch_id = p_branch_id
                AND cr.created_at BETWEEN start_date AND end_date
            GROUP BY YEARWEEK(cr.created_at)
            ORDER BY week;
            
        ELSE
            -- 기본값: 일별 사용자
            SELECT 
                DATE(u.created_at) as date,
                COUNT(*) as new_users
            FROM users u
            WHERE u.is_deleted = 0 
                AND u.branch_id = p_branch_id
                AND DATE(u.created_at) BETWEEN start_date AND end_date
            GROUP BY DATE(u.created_at)
            ORDER BY date;
    END CASE;
    
END$$

DELIMITER ;
