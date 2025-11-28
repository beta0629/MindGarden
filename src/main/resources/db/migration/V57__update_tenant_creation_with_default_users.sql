-- ============================================
-- V57: 테넌트 생성 시 기본 사용자 데이터 자동 생성 기능 추가
-- ============================================
-- 목적: 새 테넌트 생성 시 샘플 상담사, 내담자, 매칭 데이터 자동 생성
-- 작성일: 2025-11-28
-- ============================================

DELIMITER //

-- ============================================
-- CreateDefaultTenantUsers 프로시저 생성
-- ============================================
DROP PROCEDURE IF EXISTS CreateDefaultTenantUsers //

CREATE PROCEDURE CreateDefaultTenantUsers(
    IN p_tenant_id VARCHAR(64),
    IN p_business_type VARCHAR(50),
    IN p_created_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_consultant1_id BIGINT DEFAULT 0;
    DECLARE v_consultant2_id BIGINT DEFAULT 0;
    DECLARE v_consultant3_id BIGINT DEFAULT 0;
    DECLARE v_client1_id BIGINT DEFAULT 0;
    DECLARE v_client2_id BIGINT DEFAULT 0;
    DECLARE v_client3_id BIGINT DEFAULT 0;
    DECLARE v_client4_id BIGINT DEFAULT 0;
    DECLARE v_client5_id BIGINT DEFAULT 0;
    DECLARE v_branch_code VARCHAR(20) DEFAULT 'MAIN_BRANCH';
    DECLARE v_password_hash VARCHAR(100) DEFAULT '$2a$10$dummyHashForSampleUsers';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('기본 사용자 생성 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 상담 업종이 아닌 경우 기본 사용자 생성 건너뛰기
    IF p_business_type != 'CONSULTATION' THEN
        SET p_success = TRUE;
        SET p_message = CONCAT('업종 ', p_business_type, '는 기본 사용자 생성을 건너뜁니다.');
        COMMIT;
    ELSE
        
        -- 1. 샘플 상담사 생성
        INSERT INTO users (
            email, name, nickname, password, role, tenant_id, branch_code,
            social_provider, created_at, updated_at, is_active, username, 
            is_email_verified, is_social_account, is_deleted, version,
            created_by, updated_by
        ) VALUES 
        -- 상담사 1
        (CONCAT('consultant1@', SUBSTRING(p_tenant_id, 1, 20), '.sample'), 
         '김상담', '김상담사', v_password_hash, 'CONSULTANT', p_tenant_id, v_branch_code,
         'LOCAL', NOW(), NOW(), TRUE, CONCAT('consultant1_', SUBSTRING(p_tenant_id, -8)), 
         TRUE, FALSE, FALSE, 0, p_created_by, p_created_by),
         
        -- 상담사 2  
        (CONCAT('consultant2@', SUBSTRING(p_tenant_id, 1, 20), '.sample'), 
         '이상담', '이상담사', v_password_hash, 'CONSULTANT', p_tenant_id, v_branch_code,
         'LOCAL', NOW(), NOW(), TRUE, CONCAT('consultant2_', SUBSTRING(p_tenant_id, -8)), 
         TRUE, FALSE, FALSE, 0, p_created_by, p_created_by),
         
        -- 상담사 3
        (CONCAT('consultant3@', SUBSTRING(p_tenant_id, 1, 20), '.sample'), 
         '박상담', '박상담사', v_password_hash, 'CONSULTANT', p_tenant_id, v_branch_code,
         'LOCAL', NOW(), NOW(), TRUE, CONCAT('consultant3_', SUBSTRING(p_tenant_id, -8)), 
         TRUE, FALSE, FALSE, 0, p_created_by, p_created_by);
         
        -- 생성된 상담사 ID 가져오기
        SELECT id INTO v_consultant1_id FROM users 
        WHERE tenant_id = p_tenant_id AND role = 'CONSULTANT' 
        AND email LIKE CONCAT('consultant1@', SUBSTRING(p_tenant_id, 1, 20), '.sample') LIMIT 1;
        
        SELECT id INTO v_consultant2_id FROM users 
        WHERE tenant_id = p_tenant_id AND role = 'CONSULTANT' 
        AND email LIKE CONCAT('consultant2@', SUBSTRING(p_tenant_id, 1, 20), '.sample') LIMIT 1;
        
        SELECT id INTO v_consultant3_id FROM users 
        WHERE tenant_id = p_tenant_id AND role = 'CONSULTANT' 
        AND email LIKE CONCAT('consultant3@', SUBSTRING(p_tenant_id, 1, 20), '.sample') LIMIT 1;
        
        -- 2. 샘플 내담자 생성
        INSERT INTO users (
            email, name, nickname, password, role, tenant_id, branch_code,
            social_provider, created_at, updated_at, is_active, username, 
            is_email_verified, is_social_account, is_deleted, version,
            created_by, updated_by
        ) VALUES 
        -- 내담자 1
        (CONCAT('client1@', SUBSTRING(p_tenant_id, 1, 20), '.sample'), 
         '김내담', '김내담자', v_password_hash, 'CLIENT', p_tenant_id, v_branch_code,
         'LOCAL', NOW(), NOW(), TRUE, CONCAT('client1_', SUBSTRING(p_tenant_id, -8)), 
         TRUE, FALSE, FALSE, 0, p_created_by, p_created_by),
         
        -- 내담자 2
        (CONCAT('client2@', SUBSTRING(p_tenant_id, 1, 20), '.sample'), 
         '이내담', '이내담자', v_password_hash, 'CLIENT', p_tenant_id, v_branch_code,
         'LOCAL', NOW(), NOW(), TRUE, CONCAT('client2_', SUBSTRING(p_tenant_id, -8)), 
         TRUE, FALSE, FALSE, 0, p_created_by, p_created_by),
         
        -- 내담자 3
        (CONCAT('client3@', SUBSTRING(p_tenant_id, 1, 20), '.sample'), 
         '박내담', '박내담자', v_password_hash, 'CLIENT', p_tenant_id, v_branch_code,
         'LOCAL', NOW(), NOW(), TRUE, CONCAT('client3_', SUBSTRING(p_tenant_id, -8)), 
         TRUE, FALSE, FALSE, 0, p_created_by, p_created_by),
         
        -- 내담자 4
        (CONCAT('client4@', SUBSTRING(p_tenant_id, 1, 20), '.sample'), 
         '최내담', '최내담자', v_password_hash, 'CLIENT', p_tenant_id, v_branch_code,
         'LOCAL', NOW(), NOW(), TRUE, CONCAT('client4_', SUBSTRING(p_tenant_id, -8)), 
         TRUE, FALSE, FALSE, 0, p_created_by, p_created_by),
         
        -- 내담자 5
        (CONCAT('client5@', SUBSTRING(p_tenant_id, 1, 20), '.sample'), 
         '정내담', '정내담자', v_password_hash, 'CLIENT', p_tenant_id, v_branch_code,
         'LOCAL', NOW(), NOW(), TRUE, CONCAT('client5_', SUBSTRING(p_tenant_id, -8)), 
         TRUE, FALSE, FALSE, 0, p_created_by, p_created_by);
         
        -- 생성된 내담자 ID 가져오기
        SELECT id INTO v_client1_id FROM users 
        WHERE tenant_id = p_tenant_id AND role = 'CLIENT' 
        AND email LIKE CONCAT('client1@', SUBSTRING(p_tenant_id, 1, 20), '.sample') LIMIT 1;
        
        SELECT id INTO v_client2_id FROM users 
        WHERE tenant_id = p_tenant_id AND role = 'CLIENT' 
        AND email LIKE CONCAT('client2@', SUBSTRING(p_tenant_id, 1, 20), '.sample') LIMIT 1;
        
        SELECT id INTO v_client3_id FROM users 
        WHERE tenant_id = p_tenant_id AND role = 'CLIENT' 
        AND email LIKE CONCAT('client3@', SUBSTRING(p_tenant_id, 1, 20), '.sample') LIMIT 1;
        
        SELECT id INTO v_client4_id FROM users 
        WHERE tenant_id = p_tenant_id AND role = 'CLIENT' 
        AND email LIKE CONCAT('client4@', SUBSTRING(p_tenant_id, 1, 20), '.sample') LIMIT 1;
        
        SELECT id INTO v_client5_id FROM users 
        WHERE tenant_id = p_tenant_id AND role = 'CLIENT' 
        AND email LIKE CONCAT('client5@', SUBSTRING(p_tenant_id, 1, 20), '.sample') LIMIT 1;
        
        -- 3. 기본 매칭 관계 생성 (각 상담사당 2-3명의 내담자)
        INSERT INTO consultant_client_mappings (
            consultant_id, client_id, tenant_id, branch_code, 
            status, start_date, created_at, updated_at, is_deleted, version,
            payment_status, remaining_sessions, total_sessions, used_sessions
        ) VALUES 
        -- 상담사1 - 내담자1,2
        (v_consultant1_id, v_client1_id, p_tenant_id, v_branch_code, 
         'ACTIVE', NOW(), NOW(), NOW(), FALSE, 0, 'CONFIRMED', 8, 10, 2),
        (v_consultant1_id, v_client2_id, p_tenant_id, v_branch_code, 
         'ACTIVE', NOW(), NOW(), NOW(), FALSE, 0, 'CONFIRMED', 9, 10, 1),
         
        -- 상담사2 - 내담자3,4  
        (v_consultant2_id, v_client3_id, p_tenant_id, v_branch_code, 
         'ACTIVE', NOW(), NOW(), NOW(), FALSE, 0, 'CONFIRMED', 7, 10, 3),
        (v_consultant2_id, v_client4_id, p_tenant_id, v_branch_code, 
         'ACTIVE', NOW(), NOW(), NOW(), FALSE, 0, 'CONFIRMED', 10, 10, 0),
         
        -- 상담사3 - 내담자5
        (v_consultant3_id, v_client5_id, p_tenant_id, v_branch_code, 
         'ACTIVE', NOW(), NOW(), NOW(), FALSE, 0, 'CONFIRMED', 6, 10, 4);
        
        -- 4. 샘플 상담 기록 생성 (최근 활동 시뮬레이션)
        INSERT INTO consultation_records (
            consultant_id, client_id, tenant_id, branch_code,
            consultation_date, consultation_type, duration_minutes,
            status, notes, created_at, updated_at
        ) VALUES 
        -- 최근 1주일 내 상담 기록들
        (v_consultant1_id, v_client1_id, p_tenant_id, v_branch_code,
         DATE_SUB(NOW(), INTERVAL 2 DAY), 'INDIVIDUAL', 60,
         'COMPLETED', '초기 상담 - 상황 파악 및 목표 설정', NOW(), NOW()),
         
        (v_consultant1_id, v_client1_id, p_tenant_id, v_branch_code,
         DATE_SUB(NOW(), INTERVAL 5 DAY), 'INDIVIDUAL', 50,
         'COMPLETED', '2회차 상담 - 감정 조절 기법 연습', NOW(), NOW()),
         
        (v_consultant2_id, v_client3_id, p_tenant_id, v_branch_code,
         DATE_SUB(NOW(), INTERVAL 1 DAY), 'INDIVIDUAL', 45,
         'COMPLETED', '진행 상담 - 스트레스 관리 방법 논의', NOW(), NOW()),
         
        (v_consultant2_id, v_client3_id, p_tenant_id, v_branch_code,
         DATE_SUB(NOW(), INTERVAL 3 DAY), 'INDIVIDUAL', 55,
         'COMPLETED', '2회차 상담 - 대인관계 개선 전략', NOW(), NOW()),
         
        (v_consultant2_id, v_client3_id, p_tenant_id, v_branch_code,
         DATE_SUB(NOW(), INTERVAL 7 DAY), 'INDIVIDUAL', 60,
         'COMPLETED', '초기 상담 - 문제 상황 분석', NOW(), NOW()),
         
        (v_consultant3_id, v_client5_id, p_tenant_id, v_branch_code,
         DATE_SUB(NOW(), INTERVAL 1 DAY), 'FAMILY', 90,
         'COMPLETED', '가족 상담 - 의사소통 패턴 개선', NOW(), NOW()),
         
        (v_consultant3_id, v_client5_id, p_tenant_id, v_branch_code,
         DATE_SUB(NOW(), INTERVAL 4 DAY), 'FAMILY', 75,
         'COMPLETED', '가족 상담 - 갈등 해결 방법 모색', NOW(), NOW()),
         
        (v_consultant3_id, v_client5_id, p_tenant_id, v_branch_code,
         DATE_SUB(NOW(), INTERVAL 6 DAY), 'FAMILY', 80,
         'COMPLETED', '가족 상담 - 현재 상황 점검', NOW(), NOW()),
         
        (v_consultant3_id, v_client5_id, p_tenant_id, v_branch_code,
         DATE_SUB(NOW(), INTERVAL 10 DAY), 'INDIVIDUAL', 60,
         'COMPLETED', '개별 상담 - 초기 면담', NOW(), NOW());
        
        SET p_success = TRUE;
        SET p_message = CONCAT('기본 사용자 생성 완료 - 상담사: 3명, 내담자: 5명, 매칭: 5건, 상담기록: 9건');
        
        COMMIT;
    END IF;
END //

-- ============================================
-- CreateOrActivateTenant 프로시저 업데이트
-- ============================================
DROP PROCEDURE IF EXISTS CreateOrActivateTenant //

CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(64),
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
    
    -- 업종별 기능 활성화 설정
    IF p_business_type = 'CONSULTATION' THEN
        SET v_consultation_enabled = TRUE;
        SET v_academy_enabled = FALSE;
    ELSEIF p_business_type = 'ACADEMY' THEN
        SET v_consultation_enabled = FALSE;
        SET v_academy_enabled = TRUE;
    ELSE
        -- 기타 업종은 기본적으로 상담 기능 활성화
        SET v_consultation_enabled = TRUE;
        SET v_academy_enabled = FALSE;
    END IF;
    
    -- 테넌트 존재 확인
    SELECT COUNT(*) > 0 INTO v_exists
    FROM tenants
    WHERE tenant_id = p_tenant_id;
    
    IF v_exists THEN
        -- 기존 테넌트 활성화
        UPDATE tenants 
        SET status = 'ACTIVE',
            subscription_status = 'ACTIVE',
            updated_at = NOW(),
            updated_by = p_approved_by
        WHERE tenant_id = p_tenant_id;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('기존 테넌트 활성화 완료: ', p_tenant_id);
    ELSE
        -- 새 테넌트 생성
        
        -- 서브도메인 생성 (중복 방지)
        SET v_counter = 0;
        SET v_subdomain = LOWER(REPLACE(REPLACE(p_tenant_name, ' ', '-'), '_', '-'));
        
        -- 서브도메인 중복 체크 및 고유화
        WHILE (SELECT COUNT(*) FROM tenants WHERE settings_json->'$.subdomain' = v_subdomain) > 0 DO
            SET v_counter = v_counter + 1;
            SET v_subdomain = CONCAT(LOWER(REPLACE(REPLACE(p_tenant_name, ' ', '-'), '_', '-')), '-', v_counter);
        END WHILE;
        
        -- 도메인 설정
        SET v_domain = CONCAT(v_subdomain, '.m-garden.co.kr');
        
        -- settings_json 구성
        SET v_settings_json = JSON_OBJECT(
            'features', JSON_OBJECT(
                'consultation', v_consultation_enabled,
                'academy', v_academy_enabled,
                'wellness', TRUE,
                'payment', TRUE,
                'notification', TRUE
            ),
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
