-- ============================================
-- CreateDefaultTenantUsers 프로시저
-- ============================================
-- 목적: 새 테넌트 생성 시 기본 사용자 데이터 자동 생성
-- - 테넌트 관리자 계정 (이미 OnboardingServiceImpl에서 생성됨)
-- - 샘플 상담사 2-3명
-- - 샘플 내담자 3-5명  
-- - 기본 매칭 관계
-- - 샘플 상담 기록
-- ============================================

DROP PROCEDURE IF EXISTS CreateDefaultTenantUsers;

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
END;
