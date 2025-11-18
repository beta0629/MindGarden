-- ============================================
-- Week 3 Day 4: 온보딩 승인 PL/SQL 프로시저 생성
-- ============================================
-- 목적: 온보딩 승인 시 전체 프로세스를 PL/SQL로 처리 (코어 로직)
-- 작성일: 2025-01-XX
-- 주의: 개발 서버 DB에 직접 적용
-- ============================================

DELIMITER //

-- ============================================
-- 1. 테넌트 생성 또는 활성화 프로시저
-- ============================================
CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(36),
    IN p_tenant_name VARCHAR(255),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
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
        -- 서브도메인이 없으면 생성
        SELECT settings_json INTO v_settings_json
        FROM tenants
        WHERE tenant_id = p_tenant_id;
        
        IF v_settings_json IS NULL OR JSON_EXTRACT(v_settings_json, '$.subdomain') IS NULL THEN
            -- 서브도메인 자동 생성
            SET v_subdomain = LOWER(p_tenant_name);
            SET v_subdomain = REPLACE(v_subdomain, ' ', '-');
            SET v_subdomain = REPLACE(v_subdomain, '가든', 'garden');
            SET v_subdomain = REPLACE(v_subdomain, '마인드', 'mind');
            SET v_subdomain = REPLACE(v_subdomain, '상담', 'consultation');
            SET v_subdomain = REPLACE(v_subdomain, '학원', 'academy');
            -- 영문/숫자/하이픈만 남기기 (MySQL 8.0+ REGEXP_REPLACE 사용)
            SET v_subdomain = REGEXP_REPLACE(v_subdomain, '[^a-z0-9\\-]', '');
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
        -- 예: "마인드가든" → "mindgarden"
        SET v_subdomain = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            p_tenant_name,
            ' ', '-'),
            '가든', 'garden'),
            '마인드', 'mind'),
            '상담', 'consultation'),
            '학원', 'academy'
        ));
        
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
        
        SET p_success = TRUE;
        SET p_message = CONCAT('테넌트 생성 완료 (서브도메인: ', v_subdomain, '): ', p_tenant_id);
    END IF;
    
    COMMIT;
END //

