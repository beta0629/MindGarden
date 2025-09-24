-- ====================================================================
-- 일별 통계 업데이트 프로시저
-- 매일 자정에 실행되어 전날의 통계를 집계
-- ====================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS UpdateDailyStatistics//

CREATE PROCEDURE UpdateDailyStatistics(
    IN p_stat_date DATE,
    IN p_branch_code VARCHAR(20)
)
BEGIN
    DECLARE v_total_consultations INT DEFAULT 0;
    DECLARE v_completed_consultations INT DEFAULT 0;
    DECLARE v_cancelled_consultations INT DEFAULT 0;
    DECLARE v_total_revenue DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT 0.00;
    DECLARE v_consultant_count INT DEFAULT 0;
    DECLARE v_client_count INT DEFAULT 0;
    DECLARE v_total_refunds INT DEFAULT 0;
    DECLARE v_refund_amount DECIMAL(15,2) DEFAULT 0.00;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    -- 로그 시작
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', 
            CONCAT('일별 통계 업데이트 시작: ', p_stat_date, ', 지점: ', COALESCE(p_branch_code, 'ALL')), 
            NOW());
    
    -- 1. 스케줄 기반 통계 계산
    SELECT 
        COUNT(*) as total_schedules,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_schedules,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_schedules,
        COUNT(DISTINCT consultant_id) as consultant_count,
        COUNT(DISTINCT client_id) as client_count
    INTO 
        v_total_consultations,
        v_completed_consultations, 
        v_cancelled_consultations,
        v_consultant_count,
        v_client_count
    FROM schedules s
    WHERE DATE(s.date) = p_stat_date
      AND (p_branch_code IS NULL OR s.branch_code = p_branch_code)
      AND s.is_deleted = FALSE;
    
    -- 2. 수익 계산 (완료된 스케줄 기준, 기본 세션비 50,000원)
    SET v_total_revenue = v_completed_consultations * 50000;
    
    -- 3. 평균 평점 계산 (해당 날짜에 완료된 상담의 평점)
    SELECT COALESCE(AVG(cr.rating), 0)
    INTO v_avg_rating
    FROM consultant_ratings cr
    INNER JOIN schedules s ON cr.consultation_id = s.id
    WHERE DATE(s.date) = p_stat_date
      AND s.status = 'COMPLETED'
      AND (p_branch_code IS NULL OR s.branch_code = p_branch_code)
      AND cr.is_deleted = FALSE
      AND s.is_deleted = FALSE;
    
    -- 4. 환불 통계 계산 (해당 날짜에 발생한 환불)
    SELECT 
        COUNT(*) as refund_count,
        COALESCE(SUM(amount), 0) as refund_amount
    INTO 
        v_total_refunds,
        v_refund_amount
    FROM financial_transactions ft
    WHERE DATE(ft.transaction_date) = p_stat_date
      AND ft.transaction_type = 'REFUND'
      AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
      AND ft.is_deleted = FALSE;
    
    -- 5. 기존 통계 삭제 후 새로 삽입 (UPSERT)
    DELETE FROM daily_statistics 
    WHERE stat_date = p_stat_date 
      AND (p_branch_code IS NULL OR branch_code = p_branch_code);
    
    INSERT INTO daily_statistics (
        stat_date,
        branch_code,
        total_consultations,
        completed_consultations,
        cancelled_consultations,
        total_revenue,
        avg_rating,
        consultant_count,
        client_count,
        total_refunds,
        refund_amount,
        created_at,
        updated_at,
        is_deleted,
        version
    ) VALUES (
        p_stat_date,
        p_branch_code,
        v_total_consultations,
        v_completed_consultations,
        v_cancelled_consultations,
        v_total_revenue,
        v_avg_rating,
        v_consultant_count,
        v_client_count,
        v_total_refunds,
        v_refund_amount,
        NOW(),
        NOW(),
        FALSE,
        0
    );
    
    COMMIT;
    
    -- 로그 완료
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', 
            CONCAT('일별 통계 업데이트 완료: ', p_stat_date, 
                   ', 지점: ', COALESCE(p_branch_code, 'ALL'),
                   ', 총상담: ', v_total_consultations,
                   ', 완료: ', v_completed_consultations,
                   ', 수익: ', v_total_revenue), 
            NOW());
            
END//

DELIMITER ;

-- ====================================================================
-- 모든 지점 일별 통계 업데이트 프로시저
-- ====================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS UpdateAllBranchDailyStatistics//

CREATE PROCEDURE UpdateAllBranchDailyStatistics(
    IN p_stat_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_branch_code VARCHAR(20);
    DECLARE v_processed_count INT DEFAULT 0;
    
    -- 활성 지점 코드 커서
    DECLARE branch_cursor CURSOR FOR 
        SELECT DISTINCT branch_code 
        FROM users 
        WHERE branch_code IS NOT NULL 
          AND branch_code != '' 
          AND is_active = TRUE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        INSERT INTO system_logs (log_level, log_message, created_at)
        VALUES ('ERROR', 
                CONCAT('모든 지점 통계 업데이트 실패: ', p_stat_date, ', 오류: ', @@error_count), 
                NOW());
        RESIGNAL;
    END;

    START TRANSACTION;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('모든 지점 일별 통계 업데이트 시작: ', p_stat_date), NOW());
    
    OPEN branch_cursor;
    
    read_loop: LOOP
        FETCH branch_cursor INTO v_branch_code;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 각 지점별 통계 업데이트
        CALL UpdateDailyStatistics(p_stat_date, v_branch_code);
        SET v_processed_count = v_processed_count + 1;
        
    END LOOP;
    
    CLOSE branch_cursor;
    
    COMMIT;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', 
            CONCAT('모든 지점 일별 통계 업데이트 완료: ', p_stat_date, 
                   ', 처리된 지점 수: ', v_processed_count), 
            NOW());
            
END//

DELIMITER ;
