-- ============================================
-- V20251225_004__force_recreate_process_onboarding_approval.sql: Flyway 호환 형식으로 변환
-- 원본 파일: V20251225_004__force_recreate_process_onboarding_approval.sql.backup
-- 변환일: 1766801923.9424293
-- ============================================
-- 주의: DELIMITER를 제거하고 프로시저 본문을 동적으로 생성하여 실행
-- ============================================

-- 프로시저 본문 (세미콜론 포함)
-- 주의: Flyway가 세미콜론으로 구문을 분리하므로, 
--       이 프로시저는 Java 코드(PlSqlInitializer)에서 실행됩니다.
--       또는 allowMultiQueries=true로 Connection을 설정하여 실행해야 합니다.

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
    DECLARE v_error_code INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_result_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE v_step VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    
    -- 오류 처리 핸들러: 구체적인 오류 코드와 메시지 추출
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
        GET DIAGNOSTICS CONDITION 1
            v_error_code = MYSQL_ERRNO,
            v_error_message = MESSAGE_TEXT;
        
        -- 오류 코드별 구체적인 메시지
        IF v_error_code = 1205 THEN
            SET p_message = CONCAT('Lock wait timeout exceeded (', v_step, ' 단계에서 발생)');
        ELSEIF v_error_code = 1213 THEN
            SET p_message = CONCAT('Deadlock found (', v_step, ' 단계에서 발생)');
        ELSEIF v_error_code = 1062 THEN
            SET p_message = CONCAT('Duplicate entry (', v_step, ' 단계에서 발생): ', v_error_message);
        ELSEIF v_error_code = 1452 THEN
            SET p_message = CONCAT('Foreign key constraint fails (', v_step, ' 단계에서 발생): ', v_error_message);
        ELSE
            SET p_message = CONCAT('오류 발생 (', v_step, ' 단계): [', v_error_code, '] ', IFNULL(v_error_message, '알 수 없는 오류'));
        END IF;
        
        SET p_success = FALSE;
    END;
    
    -- 초기값 설정
    SET p_success = FALSE;
    SET p_message = '프로세스 시작';
    
    -- 주의: START TRANSACTION 제거 - Java 코드에서 @Transactional로 이미 트랜잭션이 시작됨
    -- 프로시저 내부에서 START TRANSACTION을 하면 중첩 트랜잭션이 되어 락 대기 및 타임아웃 발생
    
    -- 1. 테넌트 생성/활성화 (필수)
    SET v_step = '테넌트 생성/활성화';
    SET @tenant_success = NULL;
    SET @tenant_message = NULL;
    
    CALL CreateOrActivateTenant(
        p_tenant_id, p_tenant_name, p_business_type, 
        p_approved_by, NULL, NULL, p_subdomain, @tenant_success, @tenant_message
    );
    
    -- 변수 값 확인 및 처리
    IF @tenant_success IS NULL THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성 실패: 프로시저가 성공 값을 반환하지 않았습니다. (', IFNULL(@tenant_message, '메시지 없음'), ')');
        -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
        LEAVE proc_label;
    ELSEIF @tenant_success = FALSE THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성 실패: ', IFNULL(@tenant_message, '알 수 없는 오류'));
        -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
        LEAVE proc_label;
    ELSE
        SET v_result_message = CONCAT(v_result_message, '테넌트=OK');
        
        -- 2. 기본 역할 템플릿 적용 (필수)
        SET v_step = '역할 템플릿 적용';
        SET @role_success = NULL;
        SET @role_message = NULL;
        
        CALL ApplyDefaultRoleTemplates(
            p_tenant_id, p_business_type, p_approved_by,
            @role_success, @role_message
        );
        
        IF @role_success IS NULL THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('역할 템플릿 적용 실패: 프로시저가 성공 값을 반환하지 않았습니다. (', IFNULL(@role_message, '메시지 없음'), ')');
            -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
            LEAVE proc_label;
        ELSEIF @role_success = FALSE THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('역할 템플릿 적용 실패: ', IFNULL(@role_message, '알 수 없는 오류'));
            -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
            LEAVE proc_label;
        ELSE
            SET v_result_message = CONCAT(v_result_message, ', 역할=OK');
            
            -- 3. 관리자 계정 생성 (필수)
            SET v_step = '관리자 계정 생성';
            IF p_contact_email IS NOT NULL AND p_contact_email != ''
               AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
                SET @admin_success = NULL;
                SET @admin_message = NULL;
                
                CALL CreateTenantAdminAccount(
                    p_tenant_id, p_contact_email, p_tenant_name,
                    p_admin_password_hash, p_approved_by,
                    @admin_success, @admin_message
                );
                
                IF @admin_success IS NULL THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('관리자 계정 생성 실패: 프로시저가 성공 값을 반환하지 않았습니다. (', IFNULL(@admin_message, '메시지 없음'), ')');
                    -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
                    LEAVE proc_label;
                ELSEIF @admin_success = FALSE THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('관리자 계정 생성 실패: ', IFNULL(@admin_message, '알 수 없는 오류'));
                    -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
                    LEAVE proc_label;
                ELSE
                    SET v_result_message = CONCAT(v_result_message, ', 관리자=OK');
                END IF;
            ELSE
                SET p_success = FALSE;
                SET p_message = '관리자 계정 생성 실패: 이메일 또는 비밀번호 해시가 제공되지 않았습니다.';
                -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
                LEAVE proc_label;
            END IF;
            
            -- 모든 필수 단계 성공
            SET p_success = TRUE;
            SET p_message = CONCAT('온보딩 승인 완료: ', v_result_message);
            -- 주의: COMMIT 제거 - Java 코드에서 @Transactional로 트랜잭션 관리
            -- 프로시저 내부에서 COMMIT을 하면 Java 트랜잭션과 충돌
        END IF;
    END IF;
END;

-- ============================================
-- 참고: 이 프로시저는 다음 방법 중 하나로 실행됩니다:
-- 1. Java 코드에서 Connection을 직접 사용하여 실행 (PlSqlInitializer)
-- 2. allowMultiQueries=true로 Connection을 설정하여 실행
-- 3. mysql 클라이언트에서 직접 실행
-- ============================================
