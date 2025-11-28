-- ============================================
-- ProcessOnboardingApproval 프로시저 업데이트
-- 관리자 계정 생성 단계 추가
-- ============================================
-- 목적: 온보딩 승인 시 관리자 계정 생성까지 처리
-- 작성일: 2025-11-24
-- 주의: 개발 서버 DB에 직접 적용
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS ProcessOnboardingApproval //

CREATE PROCEDURE ProcessOnboardingApproval(
    IN p_request_id BIGINT,
    IN p_tenant_id VARCHAR(64),
    IN p_tenant_name VARCHAR(255),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    IN p_decision_note TEXT,
    IN p_contact_email VARCHAR(100),  -- 추가: 연락 이메일
    IN p_admin_password_hash VARCHAR(100),  -- 추가: BCrypt 해시된 비밀번호
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_subscription_id BIGINT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('온보딩 승인 프로세스 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 테넌트 생성 또는 활성화
    CALL CreateOrActivateTenant(
        p_tenant_id, p_tenant_name, p_business_type, 
        p_approved_by, @tenant_success, @tenant_message
    );
    
    IF @tenant_success = FALSE THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성 실패: ', @tenant_message);
        ROLLBACK;
    ELSE
        -- 2. 카테고리 매핑 자동 설정
        CALL SetupTenantCategoryMapping(
            p_tenant_id, p_business_type, 
            p_approved_by, @category_success, @category_message
        );
        
        IF @category_success = FALSE THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('카테고리 매핑 실패: ', @category_message);
            ROLLBACK;
        ELSE
            -- 3. 기본 컴포넌트 자동 활성화
            CALL ActivateDefaultComponents(
                p_tenant_id, p_business_type, 
                p_approved_by, @component_success, @component_message
            );
            
            IF @component_success = FALSE THEN
                SET p_success = FALSE;
                SET p_message = CONCAT('컴포넌트 활성화 실패: ', @component_message);
                ROLLBACK;
            ELSE
                -- 4. 기본 요금제 구독 생성
                CALL CreateDefaultSubscription(
                    p_tenant_id, p_business_type, 
                    p_approved_by, @subscription_success, @subscription_message, v_subscription_id
                );
                
                IF @subscription_success = FALSE THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('요금제 구독 생성 실패: ', @subscription_message);
                    ROLLBACK;
                ELSE
                    -- 5. 기본 역할 템플릿 적용
                    CALL ApplyDefaultRoleTemplates(
                        p_tenant_id, p_business_type, 
                        p_approved_by, @role_success, @role_message
                    );
                    
                    IF @role_success = FALSE THEN
                        SET p_success = FALSE;
                        SET p_message = CONCAT('역할 템플릿 적용 실패: ', @role_message);
                        ROLLBACK;
                    ELSE
                        -- 6. ERD 자동 생성
                        CALL GenerateErdOnOnboardingApproval(
                            p_tenant_id, p_tenant_name, p_business_type, 
                            p_approved_by, @erd_success, @erd_message
                        );
                        
                        -- 7. 관리자 계정 생성 (ERD 생성 실패해도 계속 진행)
                        IF p_contact_email IS NOT NULL AND p_contact_email != '' 
                           AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
                            CALL CreateTenantAdminAccount(
                                p_tenant_id, p_contact_email, p_tenant_name, 
                                p_admin_password_hash, p_approved_by, 
                                @admin_success, @admin_message
                            );
                            
                            IF @admin_success = FALSE THEN
                                -- 관리자 계정 생성 실패는 경고만 (온보딩 프로세스는 계속 진행)
                                SET p_success = TRUE;
                                SET p_message = CONCAT(
                                    '온보딩 승인 완료 (관리자 계정 생성 경고: ', @admin_message, '): ',
                                    '테넌트=', @tenant_message, ', ',
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
                            -- 관리자 계정 생성 정보가 없으면 스킵
                            IF @erd_success = FALSE THEN
                                SET p_success = TRUE;
                                SET p_message = CONCAT('온보딩 승인 완료 (ERD 생성 경고: ', @erd_message, ')');
                            ELSE
                                SET p_success = TRUE;
                                SET p_message = CONCAT(
                                    '온보딩 승인 완료: ',
                                    '테넌트=', @tenant_message, ', ',
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

