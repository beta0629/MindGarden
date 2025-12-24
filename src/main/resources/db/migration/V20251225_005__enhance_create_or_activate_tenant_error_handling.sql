-- ============================================
-- V20251225_005: CreateOrActivateTenant 프로시저 오류 처리 개선
-- ============================================
-- 목적: CreateOrActivateTenant 프로시저의 오류 핸들러에서 오류 코드(MYSQL_ERRNO)를 포함하도록 개선
-- 작성일: 2025-12-25
-- ============================================

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
    DECLARE v_error_code INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_subdomain VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE v_domain VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE v_settings_json JSON DEFAULT NULL;
    DECLARE v_counter INT DEFAULT 0;
    
    -- 치명적 오류 시 롤백 및 종료
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_code = MYSQL_ERRNO,
            v_error_message = MESSAGE_TEXT;
        
        -- 오류 코드별 메시지 개선
        IF v_error_code = 1205 THEN
            SET p_message = CONCAT('Lock wait timeout exceeded: ', IFNULL(v_error_message, '알 수 없는 오류'));
        ELSEIF v_error_code = 1213 THEN
            SET p_message = CONCAT('Deadlock found: ', IFNULL(v_error_message, '알 수 없는 오류'));
        ELSEIF v_error_code = 1062 THEN
            SET p_message = CONCAT('Duplicate entry: ', IFNULL(v_error_message, '알 수 없는 오류'));
        ELSEIF v_error_code = 1452 THEN
            SET p_message = CONCAT('Foreign key constraint fails: ', IFNULL(v_error_message, '알 수 없는 오류'));
        ELSE
            SET p_message = CONCAT('테넌트 생성/활성화 중 오류 발생 [', v_error_code, ']: ', IFNULL(v_error_message, '알 수 없는 오류'));
        END IF;
        
        SET p_success = FALSE;
    END;
    
    -- 초기값 설정
    SET p_success = FALSE;
    SET p_message = '';
    
    START TRANSACTION;
    
    -- 테넌트 존재 확인
    SELECT COUNT(*) > 0 INTO v_exists
    FROM tenants
    WHERE tenant_id = p_tenant_id;
    
    IF v_exists THEN
        -- 기존 테넌트 활성화
        -- 서브도메인 처리: 전달받은 서브도메인이 있으면 사용, 없으면 기존 서브도메인 유지 또는 자동 생성
        SELECT settings_json INTO v_settings_json
        FROM tenants
        WHERE tenant_id = p_tenant_id;
        
        -- 전달받은 서브도메인이 있으면 사용
        IF p_subdomain IS NOT NULL AND p_subdomain != '' THEN
            SET v_subdomain = p_subdomain;
        ELSEIF v_settings_json IS NULL OR JSON_EXTRACT(v_settings_json, '$.subdomain') IS NULL THEN
            -- 서브도메인 자동 생성
            SET v_subdomain = LOWER(p_tenant_name);
            SET v_subdomain = REPLACE(v_subdomain, ' ', '-');
            SET v_subdomain = REPLACE(v_subdomain, '가든', 'garden');
            SET v_subdomain = REPLACE(v_subdomain, '마인드', 'mind');
            SET v_subdomain = REPLACE(v_subdomain, '상담', 'consultation');
            SET v_subdomain = REPLACE(v_subdomain, '학원', 'academy');
            -- 영문/숫자/하이픈만 남기기 (MySQL 8.0+ REGEXP_REPLACE 사용)
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
                WHERE JSON_EXTRACT(COALESCE(settings_json, '{}'), '$.subdomain') = v_subdomain
                AND is_deleted = FALSE
                AND tenant_id != p_tenant_id;
                IF NOT v_exists THEN
                    LEAVE;
                END IF;
                SET v_counter = v_counter + 1;
                SET v_subdomain = CONCAT(v_subdomain, '-', v_counter);
            END WHILE;
            
            SET v_domain = CONCAT(v_subdomain, '.dev.core-solution.co.kr');
            
            UPDATE tenants
            SET status = 'ACTIVE',
                settings_json = JSON_SET(
                    COALESCE(settings_json, '{}'),
                    '$.subdomain', v_subdomain,
                    '$.domain', v_domain
                ),
                updated_at = NOW(),
                updated_by = p_approved_by
            WHERE tenant_id = p_tenant_id;
            
            SET p_success = TRUE;
            SET p_message = CONCAT('테넌트 활성화 완료 (서브도메인: ', v_subdomain, '): ', p_tenant_id);
        ELSE
            UPDATE tenants
            SET status = 'ACTIVE',
            updated_at = NOW(),
            updated_by = p_approved_by
            WHERE tenant_id = p_tenant_id;
            
            SET p_success = TRUE;
            SET p_message = CONCAT('테넌트 활성화 완료: ', p_tenant_id);
        END IF;
    ELSE
        -- 새 테넌트 생성
        -- 서브도메인 자동 생성 (테넌트명 기반)
        IF p_subdomain IS NOT NULL AND p_subdomain != '' THEN
            SET v_subdomain = p_subdomain;
        ELSE
            SET v_subdomain = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                p_tenant_name,
                ' ', '-'),
                '가든', 'garden'),
                '마인드', 'mind'),
                '상담', 'consultation'),
                '학원', 'academy'
            )));
            
            -- 영문/숫자/하이픈만 남기기 (MySQL 8.0+ REGEXP_REPLACE 사용)
            SET v_subdomain = REGEXP_REPLACE(v_subdomain, '[^a-z0-9-]', '');
            
            -- 최대 길이 제한 (63자, DNS 제약)
            IF LENGTH(v_subdomain) > 63 THEN
                SET v_subdomain = LEFT(v_subdomain, 63);
            END IF;
            
            -- 빈 문자열 체크
            IF v_subdomain = '' OR v_subdomain IS NULL THEN
                SET v_subdomain = CONCAT('tenant-', SUBSTRING(p_tenant_id, 1, 8));
            END IF;
            
            -- 중복 체크 및 고유성 보장
            SET v_counter = 0;
            WHILE v_counter < 100 DO
                SELECT COUNT(*) > 0 INTO v_exists
                FROM tenants
                WHERE JSON_EXTRACT(COALESCE(settings_json, '{}'), '$.subdomain') = v_subdomain
                AND is_deleted = FALSE
                AND tenant_id != p_tenant_id;
                
                IF NOT v_exists THEN
                    LEAVE;
                END IF;
                
                SET v_counter = v_counter + 1;
                SET v_subdomain = CONCAT(v_subdomain, '-', v_counter);
            END WHILE;
        END IF;
        
        -- 도메인 생성
        SET v_domain = CONCAT(v_subdomain, '.dev.core-solution.co.kr');
        
        -- settings_json에 서브도메인 정보 저장
        SET v_settings_json = JSON_OBJECT(
            'subdomain', v_subdomain,
            'domain', v_domain
        );
        
        INSERT INTO tenants (
            tenant_id,
            name,
            business_type,
            status,
            subscription_status,
            settings_json,
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
            NOW(),
            NOW(),
            p_approved_by,
            p_approved_by,
            FALSE,
            0,
            'ko'
        );
        
        -- 새 테넌트 생성 시 기본 테넌트 코드 자동 복사
        -- 기존 테넌트에서 기본 코드 복사 (첫 번째 활성 테넌트 사용)
        CALL CopyDefaultTenantCodes(
            p_tenant_id,
            (SELECT tenant_id FROM tenants WHERE is_deleted = FALSE AND status = 'ACTIVE' LIMIT 1),
            @copy_success,
            @copy_message
        );
        
        -- 새 테넌트 생성 시 기본 사용자 데이터 자동 생성
        CALL CreateDefaultTenantUsers(
            p_tenant_id,
            p_business_type,
            p_approved_by,
            @user_success,
            @user_message
        );
        
        IF @copy_success = TRUE AND @user_success = TRUE THEN
            SET p_success = TRUE;
            SET p_message = CONCAT('테넌트 생성 완료 (서브도메인: ', v_subdomain, ', 코드 복사: ', @copy_message, ', 사용자 생성: ', @user_message, '): ', p_tenant_id);
        ELSEIF @copy_success = TRUE AND @user_success = FALSE THEN
            SET p_success = TRUE;  -- 사용자 생성 실패해도 테넌트 생성은 성공으로 처리
            SET p_message = CONCAT('테넌트 생성 완료 (서브도메인: ', v_subdomain, ', 코드 복사: ', @copy_message, ', 사용자 생성 실패: ', @user_message, '): ', p_tenant_id);
        ELSEIF @copy_success = FALSE AND @user_success = TRUE THEN
            SET p_success = TRUE;  -- 코드 복사 실패해도 테넌트 생성은 성공으로 처리
            SET p_message = CONCAT('테넌트 생성 완료 (서브도메인: ', v_subdomain, ', 코드 복사 실패: ', @copy_message, ', 사용자 생성: ', @user_message, '): ', p_tenant_id);
        ELSE
            SET p_success = TRUE;  -- 둘 다 실패해도 테넌트 생성은 성공으로 처리
            SET p_message = CONCAT('테넌트 생성 완료 (서브도메인: ', v_subdomain, ', 코드 복사 실패: ', @copy_message, ', 사용자 생성 실패: ', @user_message, '): ', p_tenant_id);
        END IF;
    END IF;
    
    COMMIT;
END //

DELIMITER ;

