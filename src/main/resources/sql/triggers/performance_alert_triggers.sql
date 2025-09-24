-- ====================================================================
-- 성과 알림 자동화 트리거
-- 상담사 성과 업데이트 시 자동으로 알림 생성
-- ====================================================================

DELIMITER //

-- 성과 알림 자동 생성 함수
DROP FUNCTION IF EXISTS CreatePerformanceAlert//

CREATE FUNCTION CreatePerformanceAlert(
    p_consultant_id BIGINT,
    p_performance_date DATE,
    p_completion_rate DECIMAL(5,2),
    p_performance_score DECIMAL(5,2),
    p_grade VARCHAR(10)
) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_alert_count INT DEFAULT 0;
    DECLARE v_consultant_name VARCHAR(100);
    DECLARE v_alert_level ENUM('CRITICAL', 'WARNING', 'INFO');
    DECLARE v_alert_message TEXT;
    
    -- 중복 알림 방지 (최근 1시간 내 동일 레벨 알림 체크)
    DECLARE v_recent_alert_count INT DEFAULT 0;
    
    -- 알림 기준 (공통코드에서 조회)
    DECLARE v_critical_threshold DECIMAL(5,2) DEFAULT 50.0;
    DECLARE v_warning_threshold DECIMAL(5,2) DEFAULT 70.0;
    
    -- 상담사 이름 조회
    SELECT name INTO v_consultant_name
    FROM users 
    WHERE id = p_consultant_id;
    
    -- 공통코드에서 알림 기준 조회
    SELECT COALESCE(CAST(code_description AS DECIMAL(5,2)), 50.0)
    INTO v_critical_threshold
    FROM common_codes 
    WHERE code_group = 'PERFORMANCE_THRESHOLD' AND code_value = 'CRITICAL' AND is_active = TRUE
    LIMIT 1;
    
    SELECT COALESCE(CAST(code_description AS DECIMAL(5,2)), 70.0)
    INTO v_warning_threshold
    FROM common_codes 
    WHERE code_group = 'PERFORMANCE_THRESHOLD' AND code_value = 'WARNING' AND is_active = TRUE
    LIMIT 1;
    
    -- 알림 레벨 및 메시지 결정
    IF p_completion_rate < v_critical_threshold THEN
        SET v_alert_level = 'CRITICAL';
        SET v_alert_message = CONCAT('상담사 ', v_consultant_name, '의 ', p_performance_date, ' 완료율이 ', 
                                   p_completion_rate, '%로 위험 수준입니다. 즉시 조치가 필요합니다.');
    ELSEIF p_completion_rate < v_warning_threshold THEN
        SET v_alert_level = 'WARNING';
        SET v_alert_message = CONCAT('상담사 ', v_consultant_name, '의 ', p_performance_date, ' 완료율이 ', 
                                   p_completion_rate, '%로 기준(', v_warning_threshold, '%) 미달입니다.');
    ELSEIF p_performance_score >= 90 AND p_grade = 'S급' THEN
        SET v_alert_level = 'INFO';
        SET v_alert_message = CONCAT('상담사 ', v_consultant_name, '의 성과 점수가 ', 
                                   p_performance_score, '점으로 우수합니다. (등급: ', p_grade, ')');
    ELSE
        -- 알림 생성 조건에 해당하지 않음
        RETURN 0;
    END IF;
    
    -- 중복 알림 방지 체크 (최근 1시간 내 동일 레벨)
    SELECT COUNT(*)
    INTO v_recent_alert_count
    FROM performance_alerts
    WHERE consultant_id = p_consultant_id
      AND alert_level = v_alert_level
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
    
    IF v_recent_alert_count > 0 THEN
        -- 중복 알림이므로 생성하지 않음
        RETURN 0;
    END IF;
    
    -- 알림 생성
    INSERT INTO performance_alerts (
        consultant_id,
        consultant_name,
        alert_level,
        completion_rate,
        alert_message,
        status,
        created_at
    ) VALUES (
        p_consultant_id,
        v_consultant_name,
        v_alert_level,
        p_completion_rate,
        v_alert_message,
        'PENDING',
        NOW()
    );
    
    -- 로그 기록
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', 
            CONCAT('성과 알림 생성: ', v_consultant_name, ', 레벨: ', v_alert_level, ', 완료율: ', p_completion_rate, '%'), 
            NOW());
    
    RETURN 1;
    
END//

DELIMITER ;

-- ====================================================================
-- 상담사 성과 업데이트 후 알림 자동 생성 트리거
-- ====================================================================

DELIMITER //

DROP TRIGGER IF EXISTS tr_consultant_performance_alert//

CREATE TRIGGER tr_consultant_performance_alert
    AFTER INSERT ON consultant_performance
    FOR EACH ROW
BEGIN
    DECLARE v_alert_created INT;
    
    -- 성과 알림 자동 생성 (조건에 맞는 경우에만)
    SET v_alert_created = CreatePerformanceAlert(
        NEW.consultant_id,
        NEW.performance_date,
        NEW.completion_rate,
        NEW.performance_score,
        NEW.grade
    );
    
    -- 추가 로직: 성과 개선 알림
    IF NEW.performance_score >= 90 AND NEW.grade IN ('S급', 'A급') THEN
        -- 우수 성과 알림 (INFO 레벨)
        INSERT INTO performance_alerts (
            consultant_id,
            consultant_name,
            alert_level,
            completion_rate,
            alert_message,
            status,
            created_at
        ) SELECT 
            NEW.consultant_id,
            u.name,
            'INFO',
            NEW.completion_rate,
            CONCAT('축하합니다! ', u.name, '님의 성과가 우수합니다. (점수: ', NEW.performance_score, ', 등급: ', NEW.grade, ')'),
            'PENDING',
            NOW()
        FROM users u
        WHERE u.id = NEW.consultant_id
          AND NOT EXISTS (
              SELECT 1 FROM performance_alerts pa
              WHERE pa.consultant_id = NEW.consultant_id
                AND pa.alert_level = 'INFO'
                AND pa.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
          );
    END IF;
    
END//

DELIMITER ;

-- ====================================================================
-- 성과 업데이트 시 알림 자동 생성 트리거 (UPDATE)
-- ====================================================================

DELIMITER //

DROP TRIGGER IF EXISTS tr_consultant_performance_update_alert//

CREATE TRIGGER tr_consultant_performance_update_alert
    AFTER UPDATE ON consultant_performance
    FOR EACH ROW
BEGIN
    DECLARE v_alert_created INT;
    
    -- 성과가 악화된 경우에만 알림 생성
    IF NEW.completion_rate < OLD.completion_rate 
       OR NEW.performance_score < OLD.performance_score THEN
        
        SET v_alert_created = CreatePerformanceAlert(
            NEW.consultant_id,
            NEW.performance_date,
            NEW.completion_rate,
            NEW.performance_score,
            NEW.grade
        );
        
    -- 성과가 개선된 경우 긍정적 알림
    ELSEIF NEW.performance_score > OLD.performance_score 
           AND NEW.performance_score >= 80 THEN
        
        INSERT INTO performance_alerts (
            consultant_id,
            consultant_name,
            alert_level,
            completion_rate,
            alert_message,
            status,
            created_at
        ) SELECT 
            NEW.consultant_id,
            u.name,
            'INFO',
            NEW.completion_rate,
            CONCAT(u.name, '님의 성과가 개선되었습니다! 이전: ', OLD.performance_score, '점 → 현재: ', NEW.performance_score, '점'),
            'PENDING',
            NOW()
        FROM users u
        WHERE u.id = NEW.consultant_id
          AND NOT EXISTS (
              SELECT 1 FROM performance_alerts pa
              WHERE pa.consultant_id = NEW.consultant_id
                AND pa.alert_level = 'INFO'
                AND pa.created_at >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
          );
    END IF;
    
END//

DELIMITER ;

-- ====================================================================
-- 일일 성과 모니터링 프로시저
-- 매일 실행되어 모든 상담사의 성과를 모니터링하고 필요시 알림 생성
-- ====================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS DailyPerformanceMonitoring//

CREATE PROCEDURE DailyPerformanceMonitoring(
    IN p_monitoring_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_completion_rate DECIMAL(5,2);
    DECLARE v_performance_score DECIMAL(5,2);
    DECLARE v_grade VARCHAR(10);
    DECLARE v_alert_count INT DEFAULT 0;
    
    -- 해당 날짜의 모든 상담사 성과 커서
    DECLARE performance_cursor CURSOR FOR 
        SELECT 
            cp.consultant_id,
            cp.completion_rate,
            cp.performance_score,
            cp.grade
        FROM consultant_performance cp
        WHERE cp.performance_date = p_monitoring_date;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        INSERT INTO system_logs (log_level, log_message, created_at)
        VALUES ('ERROR', 
                CONCAT('일일 성과 모니터링 실패: ', p_monitoring_date, ', 오류: ', @@error_count), 
                NOW());
        RESIGNAL;
    END;

    START TRANSACTION;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('일일 성과 모니터링 시작: ', p_monitoring_date), NOW());
    
    OPEN performance_cursor;
    
    monitoring_loop: LOOP
        FETCH performance_cursor INTO v_consultant_id, v_completion_rate, v_performance_score, v_grade;
        IF done THEN
            LEAVE monitoring_loop;
        END IF;
        
        -- 성과 알림 생성 (조건에 맞는 경우)
        IF CreatePerformanceAlert(v_consultant_id, p_monitoring_date, v_completion_rate, v_performance_score, v_grade) = 1 THEN
            SET v_alert_count = v_alert_count + 1;
        END IF;
        
    END LOOP;
    
    CLOSE performance_cursor;
    
    COMMIT;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', 
            CONCAT('일일 성과 모니터링 완료: ', p_monitoring_date, 
                   ', 생성된 알림 수: ', v_alert_count), 
            NOW());
            
END//

DELIMITER ;
