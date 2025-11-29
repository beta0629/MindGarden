-- ============================================
-- V59: ProcessOnboardingApproval 프로시저 request_id 타입 수정
-- ============================================
-- 목적: p_request_id를 BIGINT에서 BINARY(16)로 변경하여 UUID 지원
-- 작성일: 2025-11-29
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS ProcessOnboardingApproval //

CREATE PROCEDURE ProcessOnboardingApproval(
    IN p_request_id BINARY(16),  -- BIGINT -> BINARY(16) 변경
    IN p_tenant_id VARCHAR(64),
    IN p_tenant_name VARCHAR(255),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    IN p_decision_note TEXT,
    IN p_contact_email VARCHAR(100),  
    IN p_admin_password_hash VARCHAR(100),  
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_subscription_id BIGINT;
    DECLARE v_template_tenant_id VARCHAR(64) DEFAULT 'tenant-seoul-consultation-002'; -- 기본 템플릿 테넌트
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('온보딩 승인 프로세스 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 테넌트 생성/활성화
    CALL CreateOrActivateTenant(
        p_tenant_id, p_tenant_name, p_business_type, 
        p_approved_by, @tenant_success, @tenant_message
    );
    
    IF @tenant_success = FALSE THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성 실패: ', @tenant_message);
        ROLLBACK;
    ELSE
        -- 2. 기본 테넌트 코드 복사
        CALL CopyDefaultTenantCodes(
            p_tenant_id,
            v_template_tenant_id,
            p_approved_by,
            @copy_success, @copy_message
        );
        
        IF @copy_success = FALSE THEN
            -- 코드 복사 실패는 경고로 처리 (온보딩 프로세스 중단하지 않음)
            SET @copy_warning = CONCAT('기본 코드 복사 경고: ', @copy_message);
        ELSE
            SET @copy_warning = NULL;
        END IF;
        
        -- 3. 카테고리 매핑 설정
        CALL SetupTenantCategoryMapping(
            p_tenant_id, p_business_type, 
            p_approved_by, @category_success, @category_message
        );
        
        IF @category_success = FALSE THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('카테고리 매핑 실패: ', @category_message);
            ROLLBACK;
        ELSE
            -- 4. 기본 컴포넌트 활성화
            CALL ActivateDefaultComponents(
                p_tenant_id, p_business_type, 
                p_approved_by, @component_success, @component_message
            );
            
            IF @component_success = FALSE THEN
                SET p_success = FALSE;
                SET p_message = CONCAT('컴포넌트 활성화 실패: ', @component_message);
                ROLLBACK;
            ELSE
                -- 5. 기본 요금제 구독 생성
                CALL CreateDefaultSubscription(
                    p_tenant_id, p_business_type, 
                    p_approved_by, @subscription_success, @subscription_message, v_subscription_id
                );
                
                IF @subscription_success = FALSE THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('요금제 구독 생성 실패: ', @subscription_message);
                    ROLLBACK;
                ELSE
                    -- 6. 기본 역할 템플릿 적용
                    CALL ApplyDefaultRoleTemplates(
                        p_tenant_id, p_business_type, 
                        p_approved_by, @role_success, @role_message
                    );
                    
                    IF @role_success = FALSE THEN
                        SET p_success = FALSE;
                        SET p_message = CONCAT('역할 템플릿 적용 실패: ', @role_message);
                        ROLLBACK;
                    ELSE
                        -- 7. ERD 자동 생성
                        CALL GenerateErdOnOnboardingApproval(
                            p_tenant_id, p_tenant_name, p_business_type, 
                            p_approved_by, @erd_success, @erd_message
                        );
                        
                        -- 8. 관리자 계정 생성 (선택적)
                        IF p_contact_email IS NOT NULL AND p_contact_email != '' 
                           AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
                            CALL CreateTenantAdminAccount(
                                p_tenant_id, p_contact_email, p_tenant_name, 
                                p_admin_password_hash, p_approved_by, 
                                @admin_success, @admin_message
                            );
                            
                            IF @admin_success = FALSE THEN
                                -- 관리자 계정 생성 실패는 경고로 처리
                                SET p_success = TRUE;
                                SET p_message = CONCAT(
                                    '온보딩 승인 완료 (관리자 계정 생성 경고: ', @admin_message, '): ',
                                    '테넌트=', @tenant_message, ', ',
                                    IF(@copy_warning IS NOT NULL, CONCAT('코드복사=', @copy_warning, ', '), ''),
                                    '카테고리=', @category_message, ', ',
                                    '컴포넌트=', @component_message, ', ',
                                    '구독=', @subscription_message, ', ',
                                    '역할=', @role_message, ', ',
                                    'ERD=', IF(@erd_success, @erd_message, '생성 실패')
                                );
                            ELSE
                                -- 모든 단계 성공
                                IF @erd_success = FALSE THEN
                                    SET p_success = TRUE;
                                    SET p_message = CONCAT(
                                        '온보딩 승인 완료 (ERD 생성 경고: ', @erd_message, '): ',
                                        '테넌트=', @tenant_message, ', ',
                                        IF(@copy_warning IS NOT NULL, CONCAT('코드복사=', @copy_warning, ', '), '코드복사=성공, '),
                                        '카테고리=', @category_message, ', ',
                                        '컴포넌트=', @component_message, ', ',
                                        '구독=', @subscription_message, ', ',
                                        '역할=', @role_message, ', ',
                                        '관리자=', @admin_message
                                    );
                                ELSE
                                    SET p_success = TRUE;
                                    SET p_message = CONCAT(
                                        '온보딩 승인 완료: ',
                                        '테넌트=', @tenant_message, ', ',
                                        IF(@copy_warning IS NOT NULL, CONCAT('코드복사=', @copy_warning, ', '), '코드복사=성공, '),
                                        '카테고리=', @category_message, ', ',
                                        '컴포넌트=', @component_message, ', ',
                                        '구독=', @subscription_message, ', ',
                                        '역할=', @role_message, ', ',
                                        'ERD=', @erd_message, ', ',
                                        '관리자=', @admin_message
                                    );
                                END IF;
                            END IF;
                        ELSE
                            -- 관리자 계정 생성 없이 완료
                            IF @erd_success = FALSE THEN
                                SET p_success = TRUE;
                                SET p_message = CONCAT(
                                    '온보딩 승인 완료 (ERD 생성 경고: ', @erd_message, '): ',
                                    IF(@copy_warning IS NOT NULL, CONCAT('코드복사=', @copy_warning), '코드복사=성공')
                                );
                            ELSE
                                SET p_success = TRUE;
                                SET p_message = CONCAT(
                                    '온보딩 승인 완료: ',
                                    '테넌트=', @tenant_message, ', ',
                                    IF(@copy_warning IS NOT NULL, CONCAT('코드복사=', @copy_warning, ', '), '코드복사=성공, '),
                                    '카테고리=', @category_message, ', ',
                                    '컴포넌트=', @component_message, ', ',
                                    '구독=', @subscription_message, ', ',
                                    '역할=', @role_message, ', ',
                                    'ERD=', @erd_message
                                );
                            END IF;
                        END IF;
                        
                        COMMIT;
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
END //

DELIMITER ;

