-- 기본 비즈니스 규칙 삽입
-- 메타 시스템: 하드코딩된 역할 체크 로직을 DB 규칙으로 전환

-- 1. 관리자 역할 체크 규칙
INSERT INTO business_rule_mappings (
    rule_code, rule_type, tenant_id, business_type, condition_json, action_json, priority, is_active, description
) VALUES (
    'ROLE_CHECK_ADMIN',
    'ROLE_CHECK',
    NULL, -- 글로벌 규칙
    NULL, -- 모든 업종
    '{
        "field": "user.role",
        "operator": "in",
        "values": ["ADMIN", "BRANCH_ADMIN", "BRANCH_SUPER_ADMIN", "BRANCH_MANAGER", "HQ_ADMIN", "SUPER_HQ_ADMIN", "HQ_MASTER", "HQ_SUPER_ADMIN"]
    }',
    '{
        "type": "return",
        "value": "true"
    }',
    100,
    TRUE,
    '관리자 역할 체크 규칙 (AdminRoleUtils.isAdmin 대체)'
);

-- 2. 본사 관리자 역할 체크 규칙
INSERT INTO business_rule_mappings (
    rule_code, rule_type, tenant_id, business_type, condition_json, action_json, priority, is_active, description
) VALUES (
    'ROLE_CHECK_HQ_ADMIN',
    'ROLE_CHECK',
    NULL,
    NULL,
    '{
        "field": "user.role",
        "operator": "in",
        "values": ["HQ_ADMIN", "SUPER_HQ_ADMIN", "HQ_MASTER", "HQ_SUPER_ADMIN"]
    }',
    '{
        "type": "return",
        "value": "true"
    }',
    100,
    TRUE,
    '본사 관리자 역할 체크 규칙 (AdminRoleUtils.isHqAdmin 대체)'
);

-- 3. 지점 관리자 역할 체크 규칙
INSERT INTO business_rule_mappings (
    rule_code, rule_type, tenant_id, business_type, condition_json, action_json, priority, is_active, description
) VALUES (
    'ROLE_CHECK_BRANCH_ADMIN',
    'ROLE_CHECK',
    NULL,
    NULL,
    '{
        "field": "user.role",
        "operator": "in",
        "values": ["BRANCH_ADMIN", "BRANCH_SUPER_ADMIN", "BRANCH_MANAGER", "ADMIN"]
    }',
    '{
        "type": "return",
        "value": "true"
    }',
    100,
    TRUE,
    '지점 관리자 역할 체크 규칙 (AdminRoleUtils.isBranchAdmin 대체)'
);

-- 4. 상담사 역할 체크 규칙
INSERT INTO business_rule_mappings (
    rule_code, rule_type, tenant_id, business_type, condition_json, action_json, priority, is_active, description
) VALUES (
    'ROLE_CHECK_CONSULTANT',
    'ROLE_CHECK',
    NULL,
    NULL,
    '{
        "field": "user.role",
        "operator": "equals",
        "value": "CONSULTANT"
    }',
    '{
        "type": "return",
        "value": "true"
    }',
    100,
    TRUE,
    '상담사 역할 체크 규칙 (AdminRoleUtils.isConsultant 대체)'
);

-- 5. 내담자 역할 체크 규칙
INSERT INTO business_rule_mappings (
    rule_code, rule_type, tenant_id, business_type, condition_json, action_json, priority, is_active, description
) VALUES (
    'ROLE_CHECK_CLIENT',
    'ROLE_CHECK',
    NULL,
    NULL,
    '{
        "field": "user.role",
        "operator": "equals",
        "value": "CLIENT"
    }',
    '{
        "type": "return",
        "value": "true"
    }',
    100,
    TRUE,
    '내담자 역할 체크 규칙 (AdminRoleUtils.isClient 대체)'
);

-- 6. 주문 상태 전이 규칙 예시 (향후 확장)
INSERT INTO business_rule_mappings (
    rule_code, rule_type, tenant_id, business_type, condition_json, action_json, priority, is_active, description
) VALUES (
    'STATUS_TRANSITION_ORDER_PENDING_TO_CONFIRMED',
    'STATUS_TRANSITION',
    NULL,
    'FOOD_SERVICE',
    '{
        "field": "order.status",
        "operator": "equals",
        "value": "PENDING"
    }',
    '{
        "type": "set",
        "field": "order.status",
        "value": "CONFIRMED"
    }',
    50,
    TRUE,
    '주문 상태 전이: PENDING → CONFIRMED (요식업)'
);



