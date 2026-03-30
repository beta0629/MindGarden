-- ============================================
-- V15__create_process_onboarding_approval_procedure.sql: Flyway 호환 형식으로 변환
-- 원본 파일: V15__create_process_onboarding_approval_procedure.sql.backup
-- 변환일: 1766801923.9424293
-- ============================================
-- 주의: DELIMITER를 제거하고 프로시저 본문을 동적으로 생성하여 실행
-- ============================================

-- 프로시저 본문 (세미콜론 포함)
-- 주의: Flyway가 세미콜론으로 구문을 분리하므로, 
--       이 프로시저는 Java 코드(PlSqlInitializer)에서 실행됩니다.
--       또는 allowMultiQueries=true로 Connection을 설정하여 실행해야 합니다.

CREATE PROCEDURE ProcessOnboardingApproval(
    IN p_request_id BIGINT,
    IN p_tenant_id VARCHAR(64),
    IN p_tenant_name VARCHAR(255),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    IN p_decision_note TEXT,
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
                        
                        IF @erd_success = FALSE THEN
                            -- ERD 생성 실패는 경고만 (온보딩 프로세스는 계속 진행)
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
                        
                        COMMIT;
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
END;

-- ============================================
-- 참고: 이 프로시저는 다음 방법 중 하나로 실행됩니다:
-- 1. Java 코드에서 Connection을 직접 사용하여 실행 (PlSqlInitializer)
-- 2. allowMultiQueries=true로 Connection을 설정하여 실행
-- 3. mysql 클라이언트에서 직접 실행
-- ============================================
