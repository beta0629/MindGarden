-- 비즈니스 규칙 매핑 테이블 생성
-- 메타 시스템: 하드코딩된 비즈니스 로직을 DB로 전환

CREATE TABLE IF NOT EXISTS business_rule_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_code VARCHAR(50) NOT NULL COMMENT '규칙 코드 (예: ROLE_CHECK_ADMIN, STATUS_TRANSITION_ORDER)',
    rule_type VARCHAR(50) NOT NULL COMMENT '규칙 타입 (ROLE_CHECK, STATUS_TRANSITION, CALCULATION, VALIDATION 등)',
    tenant_id VARCHAR(36) COMMENT '테넌트 ID (NULL이면 글로벌 규칙)',
    business_type VARCHAR(50) COMMENT '업종 타입 (NULL이면 모든 업종)',
    condition_json JSON COMMENT '조건 정의 (JSON)',
    action_json JSON COMMENT '실행할 액션 (JSON)',
    priority INT DEFAULT 0 COMMENT '우선순위 (높을수록 우선)',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    description TEXT COMMENT '규칙 설명',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    created_by VARCHAR(100) COMMENT '생성자',
    updated_by VARCHAR(100) COMMENT '수정자',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '삭제 여부',
    deleted_at TIMESTAMP NULL COMMENT '삭제일시',
    version BIGINT DEFAULT 0 COMMENT '버전 (낙관적 잠금)',
    
    INDEX idx_rule_code (rule_code),
    INDEX idx_rule_type (rule_type),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_business_type (business_type),
    INDEX idx_is_active (is_active),
    INDEX idx_priority (priority),
    INDEX idx_is_deleted (is_deleted),
    
    UNIQUE KEY uk_rule_code_tenant (rule_code, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='비즈니스 규칙 매핑 테이블 - 메타 시스템을 위한 규칙 정의';

-- 기본 규칙 타입 정의 (공통코드에 추가할 수도 있음)
-- ROLE_CHECK: 역할 체크 규칙
-- STATUS_TRANSITION: 상태 전이 규칙
-- CALCULATION: 계산 규칙
-- VALIDATION: 검증 규칙
-- PERMISSION: 권한 규칙
-- ROUTING: 라우팅 규칙

-- 예시 데이터 (선택사항)
-- INSERT INTO business_rule_mappings (rule_code, rule_type, condition_json, action_json, priority, description) VALUES
-- ('ROLE_CHECK_ADMIN', 'ROLE_CHECK', 
--  '{"field": "user.role", "operator": "in", "values": ["ADMIN", "SUPER_ADMIN"]}',
--  '{"allow": true, "message": "관리자 권한"}',
--  100, '관리자 역할 체크 규칙');

