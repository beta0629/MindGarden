-- V20251212_003: ProcessOnboardingApproval 및 CreateOrActivateTenant 프로시저에 서브도메인 파라미터 추가
-- 목적: 온보딩 요청에서 입력한 서브도메인을 테넌트에 저장

-- 1. ProcessOnboardingApproval 프로시저에 서브도메인 파라미터 추가
DROP PROCEDURE IF EXISTS ProcessOnboardingApproval;

DELIMITER //

CREATE PROCEDURE ProcessOnboardingApproval(
    IN p_request_id BINARY(16),
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_decision_note TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_contact_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_password_hash VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_subdomain VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
proc_label: BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_result_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('온보딩 승인 프로세스 중 오류 발생: ', IFNULL(v_error_message, '알 수 없는 오류'));
    END;
    
    -- 초기값 설정
    SET p_success = FALSE;
    SET p_message = '프로세스 시작';
    
    START TRANSACTION;
    
    -- 1. 테넌트 생성/활성화 (필수)
    -- CreateOrActivateTenant에 서브도메인 전달
    SET @tenant_success = NULL;
    SET @tenant_message = NULL;
    
    CALL CreateOrActivateTenant(
        p_tenant_id, p_tenant_name, p_business_type, 
        p_approved_by, NULL, NULL, p_subdomain, @tenant_success, @tenant_message
    );
    
    -- 변수 값 확인 및 처리
    IF @tenant_success IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 생성 실패: 프로시저가 성공 값을 반환하지 않았습니다.';
        ROLLBACK;
        LEAVE proc_label;
    ELSEIF @tenant_success = FALSE THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성 실패: ', IFNULL(@tenant_message, '알 수 없는 오류'));
        ROLLBACK;
        LEAVE proc_label;
    ELSE
        SET v_result_message = CONCAT(v_result_message, '테넌트=OK');
        
        -- 2. 기본 역할 템플릿 적용 (필수)
        SET @role_success = NULL;
        SET @role_message = NULL;
        
        CALL ApplyDefaultRoleTemplates(
            p_tenant_id, p_business_type, p_approved_by,
            @role_success, @role_message
        );
        
        IF @role_success IS NULL OR @role_success = FALSE THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('역할 템플릿 적용 실패: ', IFNULL(@role_message, '알 수 없는 오류'));
            ROLLBACK;
            LEAVE proc_label;
        ELSE
            SET v_result_message = CONCAT(v_result_message, ', 역할=OK');
            
            -- 3. 관리자 계정 생성 (필수)
            IF p_contact_email IS NOT NULL AND p_contact_email != ''
               AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
                SET @admin_success = NULL;
                SET @admin_message = NULL;
                
                CALL CreateTenantAdminAccount(
                    p_tenant_id, p_contact_email, p_tenant_name,
                    p_admin_password_hash, p_approved_by,
                    @admin_success, @admin_message
                );
                
                IF @admin_success IS NULL OR @admin_success = FALSE THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('관리자 계정 생성 실패: ', IFNULL(@admin_message, '알 수 없는 오류'));
                    ROLLBACK;
                    LEAVE proc_label;
                ELSE
                    SET v_result_message = CONCAT(v_result_message, ', 관리자=OK');
                END IF;
            END IF;
            
            -- 모든 필수 단계 성공
            SET p_success = TRUE;
            SET p_message = CONCAT('온보딩 승인 완료: ', v_result_message);
            COMMIT;
        END IF;
    END IF;
END //

DELIMITER ;

-- 2. CreateOrActivateTenant 프로시저에 서브도메인 파라미터 추가
DROP PROCEDURE IF EXISTS CreateOrActivateTenant;

DELIMITER //

CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(64),
    IN p_tenant_name VARCHAR(255),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    IN p_admin_email VARCHAR(100),
    IN p_admin_password_hash VARCHAR(100),
    IN p_subdomain VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_exists BOOLEAN DEFAULT FALSE;
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_subdomain VARCHAR(100) DEFAULT '';
    DECLARE v_domain VARCHAR(255) DEFAULT '';
    DECLARE v_settings_json JSON DEFAULT NULL;
    DECLARE v_counter INT DEFAULT 0;
    DECLARE v_consultation_enabled BOOLEAN DEFAULT FALSE;
    DECLARE v_academy_enabled BOOLEAN DEFAULT FALSE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성/활성화 중 오류 발생: ', v_error_message);
    END;
    
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
                AND tenant_id != p_tenant_id;
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
            AND tenant_id != p_tenant_id;
            
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

