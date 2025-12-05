-- =====================================================
-- CheckTimeConflict 프로시저 (배포용 - 기존 형식 적용)
-- =====================================================

DROP PROCEDURE IF EXISTS CheckTimeConflict;

CREATE PROCEDURE CheckTimeConflict(
    IN p_consultant_id BIGINT,
    IN p_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_exclude_schedule_id BIGINT,
    IN p_tenant_id VARCHAR(100),
    OUT p_has_conflict BOOLEAN,
    OUT p_conflict_reason VARCHAR(255)
)
BEGIN
    DECLARE v_business_start_time TIME DEFAULT '10:00:00';
    DECLARE v_business_end_time TIME DEFAULT '20:00:00';
    DECLARE v_lunch_start_time TIME DEFAULT NULL;
    DECLARE v_lunch_end_time TIME DEFAULT NULL;
    DECLARE v_min_notice_hours INT DEFAULT 24;
    DECLARE v_max_advance_days INT DEFAULT 30;
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE v_has_lunch_time BOOLEAN DEFAULT FALSE;
    
    SET p_has_conflict = FALSE;
    SET p_conflict_reason = '';
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '테넌트 ID는 필수입니다.';
    ELSEIF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '상담사 ID는 필수입니다.';
    ELSEIF p_date IS NULL OR p_start_time IS NULL OR p_end_time IS NULL THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '날짜 및 시간 정보는 필수입니다.';
    ELSEIF p_start_time >= p_end_time THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '시작 시간은 종료 시간보다 빨라야 합니다.';
    ELSE
        -- 2. 업무 시간 설정 조회 (테넌트 격리)
        SELECT 
            MAX(CASE WHEN code_value = 'START_TIME' THEN 
                TIME(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE(')', korean_name) - LOCATE('(', korean_name) - 1)) 
            END),
            MAX(CASE WHEN code_value = 'END_TIME' THEN 
                TIME(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE(')', korean_name) - LOCATE('(', korean_name) - 1)) 
            END),
            MAX(CASE WHEN code_value = 'LUNCH_START' THEN 
                TIME(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE(')', korean_name) - LOCATE('(', korean_name) - 1)) 
            END),
            MAX(CASE WHEN code_value = 'LUNCH_END' THEN 
                TIME(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE(')', korean_name) - LOCATE('(', korean_name) - 1)) 
            END)
        INTO v_business_start_time, v_business_end_time, v_lunch_start_time, v_lunch_end_time
        FROM common_codes 
        WHERE code_group = 'BUSINESS_HOURS' 
          AND code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END')
          AND tenant_id = p_tenant_id
          AND is_active = TRUE 
          AND is_deleted = FALSE;
        
        -- 3. 취소 정책 설정 조회 (테넌트 격리)
        SELECT 
            MAX(CASE WHEN code_value = 'MIN_NOTICE_HOURS' THEN 
                CAST(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('시간', korean_name) - LOCATE('(', korean_name) - 1) AS UNSIGNED)
            END),
            MAX(CASE WHEN code_value = 'MAX_ADVANCE_DAYS' THEN 
                CAST(SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('일', korean_name) - LOCATE('(', korean_name) - 1) AS UNSIGNED)
            END)
        INTO v_min_notice_hours, v_max_advance_days
        FROM common_codes 
        WHERE code_group = 'CANCELLATION_POLICY' 
          AND code_value IN ('MIN_NOTICE_HOURS', 'MAX_ADVANCE_DAYS')
          AND tenant_id = p_tenant_id
          AND is_active = TRUE 
          AND is_deleted = FALSE;
        
        -- 4. 기본값 설정 (설정이 없는 경우)
        SET v_business_start_time = IFNULL(v_business_start_time, TIME('10:00:00'));
        SET v_business_end_time = IFNULL(v_business_end_time, TIME('20:00:00'));
        SET v_min_notice_hours = IFNULL(v_min_notice_hours, 24);
        SET v_max_advance_days = IFNULL(v_max_advance_days, 30);
        
        -- 5. 점심시간 설정 여부 확인
        SET v_has_lunch_time = (v_lunch_start_time IS NOT NULL AND v_lunch_end_time IS NOT NULL);
        
        -- 6. 업무 시간 체크
        IF p_start_time < v_business_start_time OR p_end_time > v_business_end_time THEN
            SET p_has_conflict = TRUE;
            SET p_conflict_reason = '업무 시간 외 시간입니다.';
        END IF;
        
        -- 7. 점심 시간 체크 (점심시간이 설정된 경우에만)
        IF NOT p_has_conflict AND v_has_lunch_time AND (
            (p_start_time >= v_lunch_start_time AND p_start_time < v_lunch_end_time) OR
            (p_end_time > v_lunch_start_time AND p_end_time <= v_lunch_end_time) OR
            (p_start_time < v_lunch_start_time AND p_end_time > v_lunch_end_time)
        ) THEN
            SET p_has_conflict = TRUE;
            SET p_conflict_reason = '점심 시간과 겹칩니다.';
        END IF;
        
        -- 8. 사전 예약 기간 체크
        IF NOT p_has_conflict AND DATEDIFF(p_date, CURDATE()) > v_max_advance_days THEN
            SET p_has_conflict = TRUE;
            SET p_conflict_reason = CONCAT('최대 예약 가능 일수를 초과했습니다. (', v_max_advance_days, '일)');
        END IF;
        
        -- 9. 최소 통지 시간 체크
        IF NOT p_has_conflict AND DATEDIFF(p_date, CURDATE()) = 0 AND 
           TIME_TO_SEC(TIMEDIFF(p_start_time, CURTIME())) < (v_min_notice_hours * 3600) THEN
            SET p_has_conflict = TRUE;
            SET p_conflict_reason = CONCAT('최소 통지 시간이 부족합니다. (', v_min_notice_hours, '시간)');
        END IF;
        
        -- 10. 기존 스케줄과의 충돌 체크 (테넌트 격리)
        IF NOT p_has_conflict THEN
            SELECT COUNT(*) INTO v_conflict_count
            FROM schedules 
            WHERE consultant_id = p_consultant_id 
              AND tenant_id = p_tenant_id
              AND date = p_date
              AND status NOT IN ('CANCELLED', 'COMPLETED')
              AND is_deleted = FALSE
              AND (p_exclude_schedule_id IS NULL OR id != p_exclude_schedule_id)
              AND (
                  (p_start_time >= start_time AND p_start_time < end_time) OR
                  (p_end_time > start_time AND p_end_time <= end_time) OR
                  (p_start_time < start_time AND p_end_time > end_time)
              );
            
            IF v_conflict_count > 0 THEN
                SET p_has_conflict = TRUE;
                SET p_conflict_reason = '기존 스케줄과 시간이 겹칩니다.';
            END IF;
        END IF;
    END IF;
    
END;

