-- V20251223_002: CreateOrActivateTenant 프로시저 오류 로깅 강화
-- 목적: 락 타임아웃 및 기타 오류를 더 명확하게 감지하고 상세 정보 반환
-- 문제: 프로시저가 50초 후 "알 수 없는 오류"로 실패 (innodb_lock_wait_timeout=50초)

DELIMITER //

DROP PROCEDURE IF EXISTS CreateOrActivateTenant //

CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_password_hash VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_subdomain VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_exists BOOLEAN DEFAULT FALSE;
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_error_code INT DEFAULT 0;
    DECLARE v_error_state VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_subdomain VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE v_domain VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE v_settings_json JSON DEFAULT NULL;
    DECLARE v_counter INT DEFAULT 0;
    DECLARE v_consultation_enabled BOOLEAN DEFAULT FALSE;
    DECLARE v_academy_enabled BOOLEAN DEFAULT FALSE;
    DECLARE v_start_time BIGINT DEFAULT UNIX_TIMESTAMP(NOW(3)) * 1000;
    DECLARE v_end_time BIGINT;
    DECLARE v_duration_ms BIGINT;
    
    -- 치명적 오류 시 롤백 및 상세 정보 반환
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        
        -- 상세 오류 정보 수집
        GET DIAGNOSTICS CONDITION 1
            v_error_code = MYSQL_ERRNO,
            v_error_state = RETURNED_SQLSTATE,
            v_error_message = MESSAGE_TEXT;
        
        -- 실행 시간 계산
        SET v_end_time = UNIX_TIMESTAMP(NOW(3)) * 1000;
        SET v_duration_ms = v_end_time - v_start_time;
        
        -- 락 타임아웃 감지 (Error Code 1205: Lock wait timeout exceeded)
        IF v_error_code = 1205 THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성/활성화 실패: 락 타임아웃 발생 (', v_duration_ms, 'ms 경과). ',
                '다른 트랜잭션이 테넌트 테이블을 사용 중일 수 있습니다. ',
                'Error Code: ', v_error_code, ', SQL State: ', IFNULL(v_error_state, 'UNKNOWN'));
        -- 데드락 감지 (Error Code 1213: Deadlock found)
        ELSEIF v_error_code = 1213 THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성/활성화 실패: 데드락 발생 (', v_duration_ms, 'ms 경과). ',
                'Error Code: ', v_error_code, ', SQL State: ', IFNULL(v_error_state, 'UNKNOWN'));
        -- 기타 SQL 오류
        ELSEIF v_error_message IS NOT NULL AND v_error_message != '' THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성/활성화 중 오류 발생 (', v_duration_ms, 'ms 경과): ', 
                v_error_message, 
                ' [Error Code: ', v_error_code, ', SQL State: ', IFNULL(v_error_state, 'UNKNOWN'), ']');
        -- 오류 정보가 없는 경우 (락 타임아웃 등)
        ELSE
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성/활성화 중 알 수 없는 오류 발생 (', v_duration_ms, 'ms 경과). ',
                '락 타임아웃 또는 트랜잭션 충돌 가능성. ',
                'Error Code: ', IFNULL(v_error_code, 'NULL'), ', SQL State: ', IFNULL(v_error_state, 'NULL'));
        END IF;
    END;
    
    -- 초기값 설정
    SET p_success = FALSE;
    SET p_message = '';
    
    START TRANSACTION;
    
    -- 테넌트 존재 확인 (락을 걸어서 동시성 문제 방지)
    SELECT COUNT(*) > 0 INTO v_exists
    FROM tenants
    WHERE tenant_id = p_tenant_id
    FOR UPDATE;
    
    IF v_exists THEN
        -- 기존 테넌트 활성화
        -- 서브도메인 처리: 전달받은 서브도메인이 있으면 사용, 없으면 기존 서브도메인 유지 또는 자동 생성
        SELECT settings_json INTO v_settings_json
        FROM tenants
        WHERE tenant_id = p_tenant_id;
        
        -- 전달받은 서브도메인이 있으면 사용
        IF p_subdomain IS NOT NULL AND p_subdomain != '' THEN
            SET v_subdomain = LOWER(TRIM(p_subdomain));
        ELSEIF v_settings_json IS NULL OR JSON_EXTRACT(v_settings_json, '$.subdomain') IS NULL THEN
            -- 서브도메인 자동 생성
            SET v_subdomain = LOWER(p_tenant_name);
            SET v_subdomain = REPLACE(v_subdomain, ' ', '-');
            SET v_subdomain = REPLACE(v_subdomain, '가든', 'garden');
            SET v_subdomain = REPLACE(v_subdomain, '마인드', 'mind');
            SET v_subdomain = REPLACE(v_subdomain, '상담', 'consultation');
            SET v_subdomain = REPLACE(v_subdomain, '학원', 'academy');
            -- 영문/숫자/하이픈만 남기기
            SET v_subdomain = REGEXP_REPLACE(v_subdomain, '[^a-z0-9-]', '');
            IF LENGTH(v_subdomain) > 63 THEN
                SET v_subdomain = LEFT(v_subdomain, 63);
            END IF;
            IF v_subdomain = '' OR v_subdomain IS NULL THEN
                SET v_subdomain = CONCAT('tenant-', SUBSTRING(p_tenant_id, 1, 8));
            END IF;
            
            -- 중복 체크
            SET v_counter = 0;
            WHILE v_counter < 100 DO
                SELECT COUNT(*) > 0 INTO v_exists
                FROM tenants
                WHERE (subdomain = v_subdomain OR JSON_EXTRACT(COALESCE(settings_json, '{}'), '$.subdomain') = v_subdomain)
                AND is_deleted = FALSE
                AND tenant_id != p_tenant_id
                FOR UPDATE;
                IF NOT v_exists THEN
                    LEAVE;
                END IF;
                SET v_counter = v_counter + 1;
                SET v_subdomain = CONCAT(v_subdomain, '-', v_counter);
            END WHILE;
        ELSE
            -- 기존 서브도메인 유지
            SET v_subdomain = JSON_UNQUOTE(JSON_EXTRACT(v_settings_json, '$.subdomain'));
        END IF;
        
        SET v_domain = CONCAT(v_subdomain, '.dev.core-solution.co.kr');
        
        -- settings_json 업데이트
        IF v_settings_json IS NULL THEN
            SET v_settings_json = JSON_OBJECT(
                'subdomain', v_subdomain,
                'domain', v_domain
            );
        ELSE
            SET v_settings_json = JSON_SET(
                v_settings_json,
                '$.subdomain', v_subdomain,
                '$.domain', v_domain
            );
        END IF;
        
        UPDATE tenants
        SET status = 'ACTIVE',
            subscription_status = 'ACTIVE',
            settings_json = v_settings_json,
            subdomain = v_subdomain,
            updated_at = NOW(),
            updated_by = p_approved_by
        WHERE tenant_id = p_tenant_id;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('테넌트 활성화 완료 (서브도메인: ', v_subdomain, '): ', p_tenant_id);
    ELSE
        -- 새 테넌트 생성
        -- 서브도메인 처리: 전달받은 서브도메인이 있으면 사용, 없으면 자동 생성
        IF p_subdomain IS NOT NULL AND p_subdomain != '' THEN
            SET v_subdomain = LOWER(TRIM(p_subdomain));
        ELSE
            -- 서브도메인 자동 생성 (테넌트명 기반)
            SET v_subdomain = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                p_tenant_name,
                ' ', '-'),
                '가든', 'garden'),
                '마인드', 'mind'),
                '상담', 'consultation'),
                '학원', 'academy'
            )));
            
            -- 영문/숫자/하이픈만 남기기
            SET v_subdomain = REGEXP_REPLACE(v_subdomain, '[^a-z0-9-]', '');
            
            -- 최대 길이 제한 (63자, DNS 제약)
            IF LENGTH(v_subdomain) > 63 THEN
                SET v_subdomain = LEFT(v_subdomain, 63);
            END IF;
            
            -- 빈 문자열 체크
            IF v_subdomain = '' OR v_subdomain IS NULL THEN
                SET v_subdomain = CONCAT('tenant-', SUBSTRING(p_tenant_id, 1, 8));
            END IF;
        END IF;
        
        -- 중복 체크 및 고유성 보장
        SET v_counter = 0;
        WHILE v_counter < 100 DO
            SELECT COUNT(*) > 0 INTO v_exists
            FROM tenants
            WHERE (subdomain = v_subdomain OR JSON_EXTRACT(COALESCE(settings_json, '{}'), '$.subdomain') = v_subdomain)
            AND is_deleted = FALSE
            AND tenant_id != p_tenant_id
            FOR UPDATE;
            
            IF NOT v_exists THEN
                LEAVE;
            END IF;
            
            SET v_counter = v_counter + 1;
            SET v_subdomain = CONCAT(v_subdomain, '-', v_counter);
        END WHILE;
        
        -- 도메인 생성
        SET v_domain = CONCAT(v_subdomain, '.dev.core-solution.co.kr');
        
        -- 업종별 기능 활성화 설정
        IF p_business_type = 'CONSULTATION' THEN
            SET v_consultation_enabled = TRUE;
        ELSEIF p_business_type = 'ACADEMY' THEN
            SET v_academy_enabled = TRUE;
        END IF;
        
        -- settings_json에 서브도메인 및 기능 활성화 정보 저장
        SET v_settings_json = JSON_OBJECT(
            'subdomain', v_subdomain,
            'domain', v_domain,
            'features', JSON_OBJECT(
                'consultation', v_consultation_enabled,
                'academy', v_academy_enabled
            )
        );
        
        INSERT INTO tenants (
            tenant_id,
            name,
            business_type,
            status,
            subscription_status,
            settings_json,
            subdomain,
            created_at,
            updated_at,
            created_by,
            updated_by,
            is_deleted,
            version,
            lang_code
        ) VALUES (
            p_tenant_id,
            p_tenant_name,
            p_business_type,
            'ACTIVE',
            'ACTIVE',
            v_settings_json,
            v_subdomain,
            NOW(),
            NOW(),
            p_approved_by,
            p_approved_by,
            FALSE,
            0,
            'ko'
        );
        
        SET p_success = TRUE;
        SET p_message = CONCAT('테넌트 생성 완료 (서브도메인: ', v_subdomain, '): ', p_tenant_id);
    END IF;
    
    COMMIT;
END //

DELIMITER ;

