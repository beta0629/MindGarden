-- V20251223_002: CreateOrActivateTenant 프로시저 오류 로깅 강화
-- 목적: 락 타임아웃 및 기타 오류를 더 명확하게 감지하고 상세 정보 반환
-- 문제: 프로시저가 50초 후 "알 수 없는 오류"로 실패 (innodb_lock_wait_timeout=50초)

DROP PROCEDURE IF EXISTS CreateOrActivateTenant;

DELIMITER //

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
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_code = MYSQL_ERRNO,
            v_error_state = RETURNED_SQLSTATE,
            v_error_message = MESSAGE_TEXT;
        
        IF v_error_code = 1205 THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성/활성화 실패: 락 타임아웃 발생. Error Code: ', v_error_code, ', SQL State: ', IFNULL(v_error_state, 'UNKNOWN'));
        ELSEIF v_error_code = 1213 THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성/활성화 실패: 데드락 발생. Error Code: ', v_error_code, ', SQL State: ', IFNULL(v_error_state, 'UNKNOWN'));
        ELSEIF v_error_message IS NOT NULL AND v_error_message != '' THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성/활성화 중 오류 발생: ', v_error_message, ' [Error Code: ', v_error_code, ', SQL State: ', IFNULL(v_error_state, 'UNKNOWN'), ']');
        ELSE
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성/활성화 중 알 수 없는 오류 발생. Error Code: ', IFNULL(v_error_code, 'NULL'), ', SQL State: ', IFNULL(v_error_state, 'NULL'));
        END IF;
    END;
    
    SET p_success = FALSE;
    SET p_message = '';
    
    START TRANSACTION;
    
    SELECT COUNT(*) > 0 INTO v_exists
    FROM tenants
    WHERE tenant_id = p_tenant_id
    FOR UPDATE;
    
    IF v_exists THEN
        SELECT settings_json INTO v_settings_json
        FROM tenants
        WHERE tenant_id = p_tenant_id;
        
        IF p_subdomain IS NOT NULL AND p_subdomain != '' THEN
            SET v_subdomain = LOWER(TRIM(p_subdomain));
        ELSEIF v_settings_json IS NULL OR JSON_EXTRACT(v_settings_json, '$.subdomain') IS NULL THEN
            SET v_subdomain = LOWER(p_tenant_name);
            SET v_subdomain = REPLACE(v_subdomain, ' ', '-');
            SET v_subdomain = REPLACE(v_subdomain, '가든', 'garden');
            SET v_subdomain = REPLACE(v_subdomain, '마인드', 'mind');
            SET v_subdomain = REPLACE(v_subdomain, '상담', 'consultation');
            SET v_subdomain = REPLACE(v_subdomain, '학원', 'academy');
            SET v_subdomain = REGEXP_REPLACE(v_subdomain, '[^a-z0-9-]', '');
            IF LENGTH(v_subdomain) > 63 THEN
                SET v_subdomain = LEFT(v_subdomain, 63);
            END IF;
            IF v_subdomain = '' OR v_subdomain IS NULL THEN
                SET v_subdomain = CONCAT('tenant-', SUBSTRING(p_tenant_id, 1, 8));
            END IF;
            
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
            SET v_subdomain = JSON_UNQUOTE(JSON_EXTRACT(v_settings_json, '$.subdomain'));
        END IF;
        
        SET v_domain = CONCAT(v_subdomain, '.dev.core-solution.co.kr');
        
        IF v_settings_json IS NULL THEN
            SET v_settings_json = JSON_OBJECT('subdomain', v_subdomain, 'domain', v_domain);
        ELSE
            SET v_settings_json = JSON_SET(v_settings_json, '$.subdomain', v_subdomain, '$.domain', v_domain);
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
        IF p_subdomain IS NOT NULL AND p_subdomain != '' THEN
            SET v_subdomain = LOWER(TRIM(p_subdomain));
        ELSE
            SET v_subdomain = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(p_tenant_name, ' ', '-'), '가든', 'garden'), '마인드', 'mind'), '상담', 'consultation'), '학원', 'academy'));
            SET v_subdomain = REGEXP_REPLACE(v_subdomain, '[^a-z0-9-]', '');
            IF LENGTH(v_subdomain) > 63 THEN
                SET v_subdomain = LEFT(v_subdomain, 63);
            END IF;
            IF v_subdomain = '' OR v_subdomain IS NULL THEN
                SET v_subdomain = CONCAT('tenant-', SUBSTRING(p_tenant_id, 1, 8));
            END IF;
        END IF;
        
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
        
        SET v_domain = CONCAT(v_subdomain, '.dev.core-solution.co.kr');
        
        IF p_business_type = 'CONSULTATION' THEN
            SET v_consultation_enabled = TRUE;
        ELSEIF p_business_type = 'ACADEMY' THEN
            SET v_academy_enabled = TRUE;
        END IF;
        
        SET v_settings_json = JSON_OBJECT('subdomain', v_subdomain, 'domain', v_domain, 'features', JSON_OBJECT('consultation', v_consultation_enabled, 'academy', v_academy_enabled));
        
        INSERT INTO tenants (
            tenant_id, name, business_type, status, subscription_status,
            settings_json, subdomain, created_at, updated_at,
            created_by, updated_by, is_deleted, version, lang_code
        ) VALUES (
            p_tenant_id, p_tenant_name, p_business_type, 'ACTIVE', 'ACTIVE',
            v_settings_json, v_subdomain, NOW(), NOW(),
            p_approved_by, p_approved_by, FALSE, 0, 'ko'
        );
        
        SET p_success = TRUE;
        SET p_message = CONCAT('테넌트 생성 완료 (서브도메인: ', v_subdomain, '): ', p_tenant_id);
    END IF;
    
    COMMIT;
END //

DELIMITER ;
