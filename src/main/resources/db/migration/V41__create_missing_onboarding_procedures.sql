-- ============================================
-- V41: 온보딩 승인 프로세스에 필요한 누락된 프로시저 생성 (MVP)
-- ============================================
-- 목적: ProcessOnboardingApproval 프로시저가 호출하는 누락된 프로시저들 생성
-- 작성일: 2025-11-23
-- ============================================

DELIMITER //

-- ============================================
-- 1. 카테고리 매핑 자동 설정 프로시저 (단순화 버전)
-- ============================================
DROP PROCEDURE IF EXISTS SetupTenantCategoryMapping //

CREATE PROCEDURE SetupTenantCategoryMapping(
    IN p_tenant_id VARCHAR(64),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('카테고리 매핑 설정 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- MVP: 카테고리 매핑은 선택적 기능이므로 성공으로 처리
    -- 향후 business_category_items 테이블이 채워지면 실제 매핑 로직 추가
    SET p_success = TRUE;
    SET p_message = '카테고리 매핑 설정 완료 (MVP: 스킵됨)';
    
    COMMIT;
END //

-- ============================================
-- 2. 기본 컴포넌트 자동 활성화 프로시저 (단순화 버전)
-- ============================================
DROP PROCEDURE IF EXISTS ActivateDefaultComponents //

CREATE PROCEDURE ActivateDefaultComponents(
    IN p_tenant_id VARCHAR(64),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('컴포넌트 활성화 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- MVP: 컴포넌트 활성화는 선택적 기능이므로 성공으로 처리
    -- 향후 component_catalog 테이블이 채워지면 실제 활성화 로직 추가
    SET p_success = TRUE;
    SET p_message = '기본 컴포넌트 활성화 완료 (MVP: 스킵됨)';
    
    COMMIT;
END //

-- ============================================
-- 3. 기본 요금제 구독 생성 프로시저 (단순화 버전)
-- ============================================
DROP PROCEDURE IF EXISTS CreateDefaultSubscription //

CREATE PROCEDURE CreateDefaultSubscription(
    IN p_tenant_id VARCHAR(64),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_subscription_id BIGINT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_plan_id VARCHAR(36);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('구독 생성 중 오류 발생: ', v_error_message);
        SET p_subscription_id = NULL;
    END;
    
    START TRANSACTION;
    
    -- MVP: 기본 Starter 플랜 선택
    SELECT plan_id INTO v_plan_id
    FROM pricing_plans
    WHERE plan_code = 'STARTER'
        AND is_active = TRUE
    LIMIT 1;
    
    IF v_plan_id IS NOT NULL THEN
        -- 구독 생성
        INSERT INTO tenant_subscriptions (
            subscription_id, tenant_id, plan_id, status,
            effective_from, billing_cycle, created_at, created_by
        ) VALUES (
            UUID(), p_tenant_id, v_plan_id, 'ACTIVE',
            CURDATE(), 'MONTHLY', NOW(), p_approved_by
        );
        
        SET p_subscription_id = LAST_INSERT_ID();
        SET p_success = TRUE;
        SET p_message = CONCAT('기본 요금제 구독 생성 완료: ', v_plan_id);
    ELSE
        -- MVP: 플랜이 없어도 성공으로 처리 (구독은 선택적)
        SET p_subscription_id = NULL;
        SET p_success = TRUE;
        SET p_message = '기본 요금제 구독 생성 완료 (MVP: 플랜 없음, 스킵됨)';
    END IF;
    
    COMMIT;
END //

-- ============================================
-- 4. 기본 역할 템플릿 적용 프로시저 (단순화 버전)
-- ============================================
DROP PROCEDURE IF EXISTS ApplyDefaultRoleTemplates //

CREATE PROCEDURE ApplyDefaultRoleTemplates(
    IN p_tenant_id VARCHAR(64),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('역할 템플릿 적용 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- MVP: 역할 템플릿은 선택적 기능이므로 성공으로 처리
    -- 향후 role_templates 테이블이 채워지면 실제 템플릿 적용 로직 추가
    SET p_success = TRUE;
    SET p_message = '기본 역할 템플릿 적용 완료 (MVP: 스킵됨)';
    
    COMMIT;
END //

DELIMITER ;

