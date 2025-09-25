-- =====================================================
-- 상담일지 미작성 알림 PL/SQL 프로시저
-- =====================================================

DELIMITER //

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1. 상담일지 미작성 확인 및 알림 생성 프로시저
DROP PROCEDURE IF EXISTS CheckMissingConsultationRecords//
CREATE PROCEDURE CheckMissingConsultationRecords(
    IN p_check_date DATE,
    IN p_branch_code VARCHAR(20),
    OUT p_missing_count INT,
    OUT p_alerts_created INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message TEXT;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_consultant_name VARCHAR(100);
    DECLARE v_client_id BIGINT;
    DECLARE v_client_name VARCHAR(100);
    DECLARE v_consultation_id BIGINT;
    DECLARE v_session_time VARCHAR(50);
    DECLARE v_missing_count INT DEFAULT 0;
    DECLARE v_alerts_created INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    
    -- 커서: 해당 날짜에 상담이 있었지만 상담일지가 없는 경우
    DECLARE missing_records_cursor CURSOR FOR
        SELECT DISTINCT
            c.consultant_id,
            u1.name as consultant_name,
            c.client_id,
            u2.name as client_name,
            c.id as consultation_id,
            CONCAT(TIME_FORMAT(c.start_time, '%H:%i'), ' - ', TIME_FORMAT(c.end_time, '%H:%i')) as session_time
        FROM consultations c
        INNER JOIN users u1 ON c.consultant_id = u1.id
        INNER JOIN users u2 ON c.client_id = u2.id
        LEFT JOIN consultation_records cr ON c.id = cr.consultation_id AND cr.is_deleted = FALSE
        WHERE DATE(c.start_time) = p_check_date
          AND c.status = 'COMPLETED'
          AND cr.id IS NULL
          AND (p_branch_code IS NULL OR p_branch_code = '' OR u1.branch_code = p_branch_code)
          AND c.is_deleted = FALSE
          AND u1.is_deleted = FALSE
          AND u2.is_deleted = FALSE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('상담일지 미작성 확인 중 오류 발생: ', v_error_message);
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 1. 미작성 상담일지 개수 확인
    SELECT COUNT(DISTINCT c.id)
    INTO v_missing_count
    FROM consultations c
    INNER JOIN users u1 ON c.consultant_id = u1.id
    LEFT JOIN consultation_records cr ON c.id = cr.consultation_id AND cr.is_deleted = FALSE
    WHERE DATE(c.start_time) = p_check_date
      AND c.status = 'COMPLETED'
      AND cr.id IS NULL
      AND (p_branch_code IS NULL OR p_branch_code = '' OR u1.branch_code = p_branch_code)
      AND c.is_deleted = FALSE
      AND u1.is_deleted = FALSE;

    SET p_missing_count = v_missing_count;

    -- 2. 미작성 상담일지에 대한 알림 생성
    OPEN missing_records_cursor;
    
    read_loop: LOOP
        FETCH missing_records_cursor INTO 
            v_consultant_id, v_consultant_name, v_client_id, v_client_name, 
            v_consultation_id, v_session_time;
        
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- 알림 테이블에 미작성 상담일지 알림 추가
        INSERT INTO performance_alerts (
            consultant_id,
            alert_type,
            alert_level,
            title,
            message,
            related_entity_type,
            related_entity_id,
            branch_code,
            is_resolved,
            created_at,
            updated_at
        ) VALUES (
            v_consultant_id,
            'MISSING_CONSULTATION_RECORD',
            'HIGH',
            CONCAT('상담일지 미작성 알림 - ', p_check_date),
            CONCAT(
                '상담사: ', v_consultant_name, '\n',
                '내담자: ', v_client_name, '\n',
                '상담시간: ', v_session_time, '\n',
                '상담일지 작성을 완료해주세요.'
            ),
            'CONSULTATION',
            v_consultation_id,
            p_branch_code,
            FALSE,
            NOW(),
            NOW()
        );

        SET v_alerts_created = v_alerts_created + 1;
    END LOOP;
    
    CLOSE missing_records_cursor;

    SET p_alerts_created = v_alerts_created;
    SET p_success = TRUE;
    SET p_message = CONCAT('상담일지 미작성 확인 완료. 미작성: ', v_missing_count, '건, 알림 생성: ', v_alerts_created, '건');
    
    COMMIT;
END//

-- 2. 상담일지 미작성 알림 조회 프로시저
DROP PROCEDURE IF EXISTS GetMissingConsultationRecordAlerts//
CREATE PROCEDURE GetMissingConsultationRecordAlerts(
    IN p_branch_code VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_alerts JSON,
    OUT p_total_count INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_alerts_array JSON DEFAULT JSON_ARRAY();
    DECLARE v_error_message TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('상담일지 미작성 알림 조회 중 오류 발생: ', v_error_message);
        ROLLBACK;
    END;

    SET p_success = TRUE;
    SET p_message = '상담일지 미작성 알림 조회가 완료되었습니다.';

    -- 1. 총 알림 개수 조회
    SELECT COUNT(*)
    INTO p_total_count
    FROM performance_alerts pa
    WHERE pa.alert_type = 'MISSING_CONSULTATION_RECORD'
      AND (p_branch_code IS NULL OR p_branch_code = '' OR pa.branch_code = p_branch_code)
      AND pa.created_at BETWEEN p_start_date AND p_end_date
      AND pa.is_deleted = FALSE;

    -- 2. 알림 목록 조회
    SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                   'id', pa.id,
                   'consultantId', pa.consultant_id,
                   'consultantName', u.name,
                   'alertType', pa.alert_type,
                   'alertLevel', pa.alert_level,
                   'title', pa.title,
                   'message', pa.message,
                   'relatedEntityType', pa.related_entity_type,
                   'relatedEntityId', pa.related_entity_id,
                   'branchCode', pa.branch_code,
                   'isResolved', pa.is_resolved,
                   'createdAt', pa.created_at,
                   'updatedAt', pa.updated_at
               )
           )
    INTO v_alerts_array
    FROM performance_alerts pa
    INNER JOIN users u ON pa.consultant_id = u.id
    WHERE pa.alert_type = 'MISSING_CONSULTATION_RECORD'
      AND (p_branch_code IS NULL OR p_branch_code = '' OR pa.branch_code = p_branch_code)
      AND pa.created_at BETWEEN p_start_date AND p_end_date
      AND pa.is_deleted = FALSE
    ORDER BY pa.created_at DESC;

    SET p_alerts = v_alerts_array;

    IF p_total_count = 0 THEN
        SET p_message = '상담일지 미작성 알림이 없습니다.';
    END IF;
END//

-- 3. 상담일지 작성 완료시 알림 해제 프로시저
DROP PROCEDURE IF EXISTS ResolveConsultationRecordAlert//
CREATE PROCEDURE ResolveConsultationRecordAlert(
    IN p_consultation_id BIGINT,
    IN p_resolved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_updated_count INT;
    DECLARE v_error_message TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('상담일지 알림 해제 중 오류 발생: ', v_error_message);
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 해당 상담의 미작성 상담일지 알림을 해제
    UPDATE performance_alerts
    SET is_resolved = TRUE,
        resolved_at = NOW(),
        resolved_by = p_resolved_by,
        updated_at = NOW()
    WHERE alert_type = 'MISSING_CONSULTATION_RECORD'
      AND related_entity_type = 'CONSULTATION'
      AND related_entity_id = p_consultation_id
      AND is_resolved = FALSE
      AND is_deleted = FALSE;

    SET v_updated_count = ROW_COUNT();

    IF v_updated_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '해제할 상담일지 미작성 알림이 없습니다.';
        ROLLBACK;
    ELSE
        SET p_success = TRUE;
        SET p_message = CONCAT('상담일지 미작성 알림이 성공적으로 해제되었습니다. (', v_updated_count, '건)');
        COMMIT;
    END IF;
END//

-- 4. 상담일지 미작성 통계 조회 프로시저
DROP PROCEDURE IF EXISTS GetConsultationRecordMissingStatistics//
CREATE PROCEDURE GetConsultationRecordMissingStatistics(
    IN p_branch_code VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_consultations INT,
    OUT p_missing_records INT,
    OUT p_completion_rate DECIMAL(5,2),
    OUT p_consultant_breakdown JSON,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_consultant_breakdown JSON DEFAULT JSON_OBJECT();
    DECLARE v_error_message TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('상담일지 미작성 통계 조회 중 오류 발생: ', v_error_message);
        ROLLBACK;
    END;

    SET p_success = TRUE;
    SET p_message = '상담일지 미작성 통계 조회가 완료되었습니다.';

    -- 1. 전체 상담 수, 미작성 상담일지 수, 완성률 계산
    SELECT
        COUNT(c.id),
        COUNT(c.id) - COUNT(cr.id),
        CASE 
            WHEN COUNT(c.id) > 0 THEN 
                ROUND((COUNT(cr.id) / COUNT(c.id)) * 100, 2)
            ELSE 0 
        END
    INTO
        p_total_consultations,
        p_missing_records,
        p_completion_rate
    FROM consultations c
    INNER JOIN users u ON c.consultant_id = u.id
    LEFT JOIN consultation_records cr ON c.id = cr.consultation_id AND cr.is_deleted = FALSE
    WHERE DATE(c.start_time) BETWEEN p_start_date AND p_end_date
      AND c.status = 'COMPLETED'
      AND (p_branch_code IS NULL OR p_branch_code = '' OR u.branch_code = p_branch_code)
      AND c.is_deleted = FALSE
      AND u.is_deleted = FALSE;

    -- 2. 상담사별 상담일지 작성 현황
    SELECT JSON_OBJECTAGG(
               u.name,
               JSON_OBJECT(
                   'totalConsultations', COUNT(c.id),
                   'missingRecords', COUNT(c.id) - COUNT(cr.id),
                   'completionRate', CASE 
                       WHEN COUNT(c.id) > 0 THEN 
                           ROUND((COUNT(cr.id) / COUNT(c.id)) * 100, 2)
                       ELSE 0 
                   END
               )
           )
    INTO v_consultant_breakdown
    FROM consultations c
    INNER JOIN users u ON c.consultant_id = u.id
    LEFT JOIN consultation_records cr ON c.id = cr.consultation_id AND cr.is_deleted = FALSE
    WHERE DATE(c.start_time) BETWEEN p_start_date AND p_end_date
      AND c.status = 'COMPLETED'
      AND (p_branch_code IS NULL OR p_branch_code = '' OR u.branch_code = p_branch_code)
      AND c.is_deleted = FALSE
      AND u.is_deleted = FALSE
    GROUP BY u.id, u.name;

    SET p_consultant_breakdown = v_consultant_breakdown;
END//

-- 5. 상담일지 미작성 알림 자동 생성 스케줄러 프로시저
DROP PROCEDURE IF EXISTS AutoCreateMissingConsultationRecordAlerts//
CREATE PROCEDURE AutoCreateMissingConsultationRecordAlerts(
    IN p_days_back INT, -- 며칠 전까지 확인할지 (기본값: 1)
    OUT p_processed_days INT,
    OUT p_total_alerts_created INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_current_date DATE;
    DECLARE v_end_date DATE;
    DECLARE v_missing_count INT;
    DECLARE v_alerts_created INT;
    DECLARE v_total_alerts_created INT DEFAULT 0;
    DECLARE v_processed_days INT DEFAULT 0;
    DECLARE v_error_message TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('상담일지 미작성 알림 자동 생성 중 오류 발생: ', v_error_message);
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 날짜 범위 설정
    SET v_end_date = CURDATE() - INTERVAL 1 DAY; -- 어제까지
    SET v_current_date = v_end_date - INTERVAL (p_days_back - 1) DAY; -- 며칠 전부터

    -- 각 날짜별로 미작성 상담일지 확인 및 알림 생성
    WHILE v_current_date <= v_end_date DO
        -- 해당 날짜의 미작성 상담일지 확인 및 알림 생성
        CALL CheckMissingConsultationRecords(
            v_current_date, 
            NULL, -- 모든 지점
            v_missing_count, 
            v_alerts_created, 
            @temp_success, 
            @temp_message
        );

        SET v_total_alerts_created = v_total_alerts_created + v_alerts_created;
        SET v_processed_days = v_processed_days + 1;
        SET v_current_date = v_current_date + INTERVAL 1 DAY;
    END WHILE;

    SET p_processed_days = v_processed_days;
    SET p_total_alerts_created = v_total_alerts_created;
    SET p_success = TRUE;
    SET p_message = CONCAT('상담일지 미작성 알림 자동 생성 완료. 처리된 날짜: ', v_processed_days, '일, 생성된 알림: ', v_total_alerts_created, '건');
    
    COMMIT;
END//

DELIMITER ;
