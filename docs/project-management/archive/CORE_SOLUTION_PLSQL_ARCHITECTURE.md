# 코어 솔루션 PL/SQL 아키텍처

**작성일:** 2025-01-XX  
**목적:** 코어 솔루션 시스템의 모든 핵심 비즈니스 로직을 PL/SQL로 구현하여 정확한 데이터 바탕으로 동적으로 동작하도록 설계

## 1. 핵심 원칙

### 1.1 PL/SQL 코어 로직 원칙
- ✅ **모든 핵심 비즈니스 로직은 PL/SQL 프로시저로 구현**
- ✅ **데이터 정확성 보장**: 트랜잭션 내에서 데이터 일관성 유지
- ✅ **동적 처리**: 데이터 기반으로 동적으로 로직 실행
- ✅ **중앙화**: 모든 코어 로직은 중앙 DB에 저장
- ✅ **재사용성**: 공통 로직은 프로시저로 재사용
- ✅ **성능 최적화**: DB 레벨에서 최적화된 처리

### 1.2 데이터 중앙화 원칙
- **모든 데이터는 `core_solution` DB에 저장**
- **모든 코어 로직은 PL/SQL 프로시저로 중앙화**
- **테넌트별 데이터는 `tenant_id`로 구분**
- **공통 로직은 재사용 가능한 프로시저로 구현**

## 2. 코어 솔루션 PL/SQL 프로시저 구조

### 2.1 온보딩 시스템 PL/SQL 프로시저

#### 2.1.1 온보딩 승인 프로시저 (메인)

```sql
DELIMITER //

-- 온보딩 승인 시 전체 프로세스 처리 (코어 로직)
CREATE PROCEDURE ProcessOnboardingApproval(
    IN p_request_id BIGINT,
    IN p_tenant_id VARCHAR(36),
    IN p_tenant_name VARCHAR(255),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    IN p_decision_note TEXT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_tenant_status VARCHAR(20);
    DECLARE v_subscription_id BIGINT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('온보딩 승인 처리 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 온보딩 요청 상태 업데이트
    UPDATE ops_onboarding_request
    SET status = 'APPROVED',
        decided_by = p_approved_by,
        decision_at = NOW(),
        decision_note = p_decision_note,
        updated_at = NOW()
    WHERE id = p_request_id AND status = 'PENDING';
    
    IF ROW_COUNT() = 0 THEN
        SET p_success = FALSE;
        SET p_message = '승인 가능한 온보딩 요청을 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        -- 2. 테넌트 생성 또는 활성화
        CALL CreateOrActivateTenant(
            p_tenant_id, p_tenant_name, p_business_type, 
            p_approved_by, @tenant_success, @tenant_message
        );
        
        IF @tenant_success = FALSE THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성 실패: ', @tenant_message);
            ROLLBACK;
        ELSE
            -- 3. 카테고리 매핑 자동 설정
            CALL SetupTenantCategoryMapping(
                p_tenant_id, p_business_type, 
                p_approved_by, @category_success, @category_message
            );
            
            -- 4. 기본 컴포넌트 자동 활성화
            CALL ActivateDefaultComponents(
                p_tenant_id, p_business_type, 
                p_approved_by, @component_success, @component_message
            );
            
            -- 5. 기본 요금제 구독 생성
            CALL CreateDefaultSubscription(
                p_tenant_id, p_business_type, 
                p_approved_by, @subscription_success, @subscription_message, v_subscription_id
            );
            
            -- 6. 기본 역할 템플릿 적용
            CALL ApplyDefaultRoleTemplates(
                p_tenant_id, p_business_type, 
                p_approved_by, @role_success, @role_message
            );
            
            -- 7. ERD 자동 생성
            CALL GenerateErdOnOnboardingApproval(
                p_tenant_id, p_tenant_name, p_business_type, 
                p_approved_by, @erd_success, @erd_message
            );
            
            -- 8. 온보딩 완료 알림 발송 (비동기)
            CALL SendOnboardingCompletionNotification(
                p_tenant_id, p_tenant_name, 
                p_approved_by, @notification_success, @notification_message
            );
            
            -- 9. 감사 로그 기록
            INSERT INTO ops_audit_log (
                event_type, entity_type, entity_id, actor_id, actor_role,
                action, metadata_json, created_at
            ) VALUES (
                'ONBOARDING_APPROVED', 'ONBOARDING_REQUEST', p_request_id,
                p_approved_by, 'HQ_ADMIN', '온보딩 승인 완료',
                JSON_OBJECT(
                    'tenant_id', p_tenant_id,
                    'tenant_name', p_tenant_name,
                    'business_type', p_business_type,
                    'subscription_id', v_subscription_id
                ),
                NOW()
            );
            
            COMMIT;
            SET p_success = TRUE;
            SET p_message = '온보딩 승인이 완료되었습니다.';
        END IF;
    END IF;
    
END //

-- 테넌트 생성 또는 활성화 프로시저
CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(36),
    IN p_tenant_name VARCHAR(255),
    IN p_business_type VARCHAR(50),
    IN p_created_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_exists BOOLEAN DEFAULT FALSE;
    
    -- 테넌트 존재 여부 확인
    SELECT COUNT(*) > 0 INTO v_exists
    FROM tenants
    WHERE tenant_id = p_tenant_id;
    
    IF v_exists THEN
        -- 기존 테넌트 활성화
        UPDATE tenants
        SET status = 'ACTIVE',
            business_type = p_business_type,
            updated_at = NOW(),
            updated_by = p_created_by
        WHERE tenant_id = p_tenant_id;
        
        SET p_success = TRUE;
        SET p_message = '기존 테넌트가 활성화되었습니다.';
    ELSE
        -- 신규 테넌트 생성
        INSERT INTO tenants (
            tenant_id, name, business_type, status,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            p_tenant_id, p_tenant_name, p_business_type, 'ACTIVE',
            NOW(), NOW(), p_created_by, p_created_by
        );
        
        SET p_success = TRUE;
        SET p_message = '신규 테넌트가 생성되었습니다.';
    END IF;
    
END //

-- 카테고리 매핑 자동 설정 프로시저
CREATE PROCEDURE SetupTenantCategoryMapping(
    IN p_tenant_id VARCHAR(36),
    IN p_business_type VARCHAR(50),
    IN p_created_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_category_item_id VARCHAR(36);
    DECLARE done INT DEFAULT FALSE;
    
    DECLARE cur_categories CURSOR FOR
        SELECT item_id
        FROM business_category_items
        WHERE business_type = p_business_type
            AND is_active = TRUE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur_categories;
    read_loop: LOOP
        FETCH cur_categories INTO v_category_item_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 카테고리 매핑 생성
        INSERT INTO tenant_category_mappings (
            tenant_id, category_item_id, is_primary, created_at
        ) VALUES (
            p_tenant_id, v_category_item_id, 
            (SELECT COUNT(*) = 0 FROM tenant_category_mappings WHERE tenant_id = p_tenant_id),
            NOW()
        )
        ON DUPLICATE KEY UPDATE updated_at = NOW();
        
    END LOOP;
    CLOSE cur_categories;
    
    SET p_success = TRUE;
    SET p_message = '카테고리 매핑이 설정되었습니다.';
    
END //

-- 기본 컴포넌트 자동 활성화 프로시저
CREATE PROCEDURE ActivateDefaultComponents(
    IN p_tenant_id VARCHAR(36),
    IN p_business_type VARCHAR(50),
    IN p_activated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_component_id VARCHAR(36);
    DECLARE v_default_components JSON;
    DECLARE done INT DEFAULT FALSE;
    DECLARE i INT DEFAULT 0;
    
    -- 업종별 기본 컴포넌트 조회
    SELECT default_components_json INTO v_default_components
    FROM business_category_items
    WHERE business_type = p_business_type
        AND is_active = TRUE
    LIMIT 1;
    
    IF v_default_components IS NOT NULL THEN
        -- JSON 배열에서 컴포넌트 ID 추출하여 활성화
        WHILE i < JSON_LENGTH(v_default_components) DO
            SET v_component_id = JSON_UNQUOTE(JSON_EXTRACT(v_default_components, CONCAT('$[', i, ']')));
            
            -- 컴포넌트 활성화
            INSERT INTO tenant_components (
                tenant_component_id, tenant_id, component_id, status,
                activated_at, activated_by, created_at
            ) VALUES (
                UUID(), p_tenant_id, v_component_id, 'ACTIVE',
                NOW(), p_activated_by, NOW()
            )
            ON DUPLICATE KEY UPDATE 
                status = 'ACTIVE',
                activated_at = NOW(),
                activated_by = p_activated_by,
                updated_at = NOW();
            
            SET i = i + 1;
        END WHILE;
    END IF;
    
    SET p_success = TRUE;
    SET p_message = '기본 컴포넌트가 활성화되었습니다.';
    
END //

-- 기본 요금제 구독 생성 프로시저
CREATE PROCEDURE CreateDefaultSubscription(
    IN p_tenant_id VARCHAR(36),
    IN p_business_type VARCHAR(50),
    IN p_created_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_subscription_id BIGINT
)
BEGIN
    DECLARE v_plan_id BIGINT;
    DECLARE v_recommended_plans JSON;
    
    -- 업종별 추천 요금제 조회
    SELECT recommended_plan_ids_json INTO v_recommended_plans
    FROM business_category_items
    WHERE business_type = p_business_type
        AND is_active = TRUE
    LIMIT 1;
    
    -- 첫 번째 추천 요금제 선택 (또는 기본 Starter 플랜)
    IF v_recommended_plans IS NOT NULL AND JSON_LENGTH(v_recommended_plans) > 0 THEN
        SET v_plan_id = JSON_UNQUOTE(JSON_EXTRACT(v_recommended_plans, '$[0]'));
    ELSE
        -- 기본 Starter 플랜 선택
        SELECT plan_id INTO v_plan_id
        FROM pricing_plans
        WHERE plan_code = 'STARTER'
            AND is_active = TRUE
        LIMIT 1;
    END IF;
    
    IF v_plan_id IS NOT NULL THEN
        -- 구독 생성
        INSERT INTO tenant_subscriptions (
            subscription_id, tenant_id, plan_id, status,
            effective_from, billing_cycle, created_at
        ) VALUES (
            UUID(), p_tenant_id, v_plan_id, 'ACTIVE',
            CURDATE(), 'MONTHLY', NOW()
        );
        
        SET p_subscription_id = LAST_INSERT_ID();
        SET p_success = TRUE;
        SET p_message = '기본 요금제 구독이 생성되었습니다.';
    ELSE
        SET p_success = FALSE;
        SET p_message = '적용 가능한 요금제를 찾을 수 없습니다.';
    END IF;
    
END //

-- 기본 역할 템플릿 적용 프로시저
CREATE PROCEDURE ApplyDefaultRoleTemplates(
    IN p_tenant_id VARCHAR(36),
    IN p_business_type VARCHAR(50),
    IN p_created_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_template_id VARCHAR(36);
    DECLARE v_tenant_role_id VARCHAR(36);
    DECLARE done INT DEFAULT FALSE;
    
    DECLARE cur_templates CURSOR FOR
        SELECT rt.role_template_id
        FROM role_templates rt
        INNER JOIN role_template_mappings rtm ON rt.role_template_id = rtm.role_template_id
        WHERE rtm.business_type = p_business_type
            AND rtm.is_default = TRUE
            AND rt.is_active = TRUE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur_templates;
    read_loop: LOOP
        FETCH cur_templates INTO v_template_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 테넌트 역할 생성 (템플릿 기반)
        SET v_tenant_role_id = UUID();
        INSERT INTO tenant_roles (
            tenant_role_id, tenant_id, role_template_id, name,
            description, is_active, created_at
        )
        SELECT 
            v_tenant_role_id, p_tenant_id, v_template_id,
            rt.name, rt.description, TRUE, NOW()
        FROM role_templates rt
        WHERE rt.role_template_id = v_template_id;
        
        -- 템플릿 권한 복제
        INSERT INTO role_permissions (
            tenant_role_id, permission_code, policy_json, granted_by
        )
        SELECT 
            v_tenant_role_id, rtp.permission_code, 
            JSON_OBJECT('scope', rtp.scope), p_created_by
        FROM role_template_permissions rtp
        WHERE rtp.role_template_id = v_template_id;
        
    END LOOP;
    CLOSE cur_templates;
    
    SET p_success = TRUE;
    SET p_message = '기본 역할 템플릿이 적용되었습니다.';
    
END //

DELIMITER ;
```

### 2.2 코어 솔루션 동적 처리 프로시저

#### 2.2.1 동적 컴포넌트 활성화/비활성화

```sql
DELIMITER //

-- 동적 컴포넌트 활성화 프로시저
CREATE PROCEDURE ActivateTenantComponent(
    IN p_tenant_id VARCHAR(36),
    IN p_component_id VARCHAR(36),
    IN p_subscription_id BIGINT,
    IN p_activated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_component_exists BOOLEAN;
    DECLARE v_dependencies JSON;
    DECLARE v_required_component_id VARCHAR(36);
    DECLARE v_dependency_satisfied BOOLEAN;
    DECLARE i INT DEFAULT 0;
    
    -- 컴포넌트 존재 여부 확인
    SELECT COUNT(*) > 0 INTO v_component_exists
    FROM component_catalog
    WHERE component_id = p_component_id AND is_active = TRUE;
    
    IF NOT v_component_exists THEN
        SET p_success = FALSE;
        SET p_message = '활성화할 수 있는 컴포넌트를 찾을 수 없습니다.';
    ELSE
        -- 의존성 확인
        SELECT required_components_json INTO v_dependencies
        FROM component_dependencies
        WHERE component_id = p_component_id;
        
        IF v_dependencies IS NOT NULL THEN
            WHILE i < JSON_LENGTH(v_dependencies) DO
                SET v_required_component_id = JSON_UNQUOTE(
                    JSON_EXTRACT(v_dependencies, CONCAT('$[', i, ']'))
                );
                
                -- 필수 컴포넌트 활성화 여부 확인
                SELECT COUNT(*) > 0 INTO v_dependency_satisfied
                FROM tenant_components
                WHERE tenant_id = p_tenant_id
                    AND component_id = v_required_component_id
                    AND status = 'ACTIVE';
                
                IF NOT v_dependency_satisfied THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('필수 컴포넌트가 활성화되지 않았습니다: ', v_required_component_id);
                    LEAVE read_loop;
                END IF;
                
                SET i = i + 1;
            END WHILE;
        END IF;
        
        IF p_success IS NULL OR p_success = TRUE THEN
            -- 컴포넌트 활성화
            INSERT INTO tenant_components (
                tenant_component_id, tenant_id, component_id, subscription_id,
                status, activated_at, activated_by, created_at
            ) VALUES (
                UUID(), p_tenant_id, p_component_id, p_subscription_id,
                'ACTIVE', NOW(), p_activated_by, NOW()
            )
            ON DUPLICATE KEY UPDATE
                status = 'ACTIVE',
                activated_at = NOW(),
                activated_by = p_activated_by,
                updated_at = NOW();
            
            SET p_success = TRUE;
            SET p_message = '컴포넌트가 활성화되었습니다.';
        END IF;
    END IF;
    
END //

DELIMITER ;
```

#### 2.2.2 동적 권한 관리

```sql
DELIMITER //

-- 동적 권한 부여 프로시저
CREATE PROCEDURE GrantPermissionToRole(
    IN p_tenant_role_id VARCHAR(36),
    IN p_permission_code VARCHAR(100),
    IN p_policy_json JSON,
    IN p_granted_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    -- 권한 부여
    INSERT INTO role_permissions (
        tenant_role_id, permission_code, policy_json, granted_by, created_at
    ) VALUES (
        p_tenant_role_id, p_permission_code, p_policy_json, p_granted_by, NOW()
    )
    ON DUPLICATE KEY UPDATE
        policy_json = p_policy_json,
        granted_by = p_granted_by,
        updated_at = NOW();
    
    SET p_success = TRUE;
    SET p_message = '권한이 부여되었습니다.';
    
END //

-- 동적 권한 검증 프로시저
CREATE PROCEDURE CheckUserPermission(
    IN p_user_id VARCHAR(36),
    IN p_tenant_id VARCHAR(36),
    IN p_permission_code VARCHAR(100),
    IN p_resource_id VARCHAR(36),
    OUT p_has_permission BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_role_id VARCHAR(36);
    DECLARE v_policy_json JSON;
    DECLARE v_scope VARCHAR(50);
    
    -- 사용자 역할 조회
    SELECT tenant_role_id INTO v_role_id
    FROM user_role_assignments
    WHERE user_id = p_user_id
        AND tenant_id = p_tenant_id
        AND effective_from <= CURDATE()
        AND (effective_to IS NULL OR effective_to >= CURDATE())
    LIMIT 1;
    
    IF v_role_id IS NULL THEN
        SET p_has_permission = FALSE;
        SET p_message = '사용자에게 할당된 역할이 없습니다.';
    ELSE
        -- 권한 확인
        SELECT policy_json INTO v_policy_json
        FROM role_permissions
        WHERE tenant_role_id = v_role_id
            AND permission_code = p_permission_code;
        
        IF v_policy_json IS NULL THEN
            SET p_has_permission = FALSE;
            SET p_message = '권한이 없습니다.';
        ELSE
            -- 정책 기반 권한 검증 (ABAC)
            SET v_scope = JSON_UNQUOTE(JSON_EXTRACT(v_policy_json, '$.scope'));
            
            IF v_scope = 'ALL' THEN
                SET p_has_permission = TRUE;
                SET p_message = '권한이 있습니다.';
            ELSEIF v_scope = 'BRANCH' THEN
                -- 지점별 권한 검증 로직
                SET p_has_permission = TRUE; -- 예시
                SET p_message = '지점 권한이 있습니다.';
            ELSE
                SET p_has_permission = FALSE;
                SET p_message = '권한 범위를 벗어났습니다.';
            END IF;
        END IF;
    END IF;
    
END //

DELIMITER ;
```

## 3. 데이터 중앙화 체크리스트

### 3.1 온보딩 시스템
- [ ] 모든 온보딩 로직은 PL/SQL 프로시저로 구현
- [ ] 온보딩 데이터는 `core_solution` DB에 저장
- [ ] 테넌트 생성/활성화는 PL/SQL 프로시저로 처리
- [ ] 카테고리 매핑은 PL/SQL 프로시저로 자동 설정
- [ ] 컴포넌트 활성화는 PL/SQL 프로시저로 처리
- [ ] 요금제 구독은 PL/SQL 프로시저로 생성
- [ ] 역할 템플릿 적용은 PL/SQL 프로시저로 처리
- [ ] ERD 생성은 PL/SQL 프로시저로 처리

### 3.2 코어 솔루션 시스템
- [ ] 모든 핵심 비즈니스 로직은 PL/SQL 프로시저로 구현
- [ ] 동적 컴포넌트 활성화/비활성화는 PL/SQL 프로시저로 처리
- [ ] 동적 권한 관리는 PL/SQL 프로시저로 처리
- [ ] 데이터 기반 동적 처리는 PL/SQL 프로시저로 구현
- [ ] 모든 데이터는 `core_solution` DB에 저장
- [ ] 테넌트별 데이터는 `tenant_id`로 구분

## 4. PL/SQL 프로시저 관리 전략

### 4.1 프로시저 버전 관리
- Flyway 마이그레이션으로 프로시저 버전 관리
- 프로시저 변경 시 버전 번호 증가
- 프로시저 변경 이력 추적

### 4.2 프로시저 테스트
- 단위 테스트: 각 프로시저별 테스트
- 통합 테스트: 프로시저 간 연계 테스트
- 성능 테스트: 대용량 데이터 처리 테스트

### 4.3 프로시저 모니터링
- 프로시저 실행 시간 모니터링
- 프로시저 오류 로깅
- 프로시저 성능 최적화

## 5. 연계 문서

- `DATA_CORE_AND_PL_SQL.md`: 데이터 중앙화 및 PL/SQL 전략
- `ERD_SYSTEM_TENANT_ENHANCEMENT_PLAN.md`: ERD 시스템 고도화 (PL/SQL 기반)
- `CORE_SOLUTION_EVOLUTION_PLAN.md`: 코어 솔루션 진화 계획
- `MASTER_IMPLEMENTATION_SCHEDULE.md`: 전체 구현 일정

