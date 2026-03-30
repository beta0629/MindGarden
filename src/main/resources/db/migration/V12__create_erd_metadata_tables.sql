-- ============================================
-- Week 3 Day 1: ERD 메타데이터 테이블 생성
-- ============================================
-- 목적: ERD 다이어그램 정보 및 변경 이력 저장
-- 작성일: 2025-01-XX
-- ============================================

-- ============================================
-- 1. ERD 다이어그램 정보 테이블
-- ============================================
CREATE TABLE erd_diagrams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    diagram_id VARCHAR(36) UNIQUE NOT NULL COMMENT 'ERD 다이어그램 UUID',
    tenant_id VARCHAR(36) COMMENT '테넌트 UUID (NULL이면 전체 시스템 ERD)',
    name VARCHAR(255) NOT NULL COMMENT 'ERD 이름',
    description TEXT COMMENT 'ERD 설명',
    diagram_type VARCHAR(50) NOT NULL COMMENT 'ERD 타입: FULL, MODULE, CUSTOM, TENANT',
    module_type VARCHAR(50) COMMENT '모듈 타입 (ACADEMY, FOOD_SERVICE 등)',
    mermaid_code TEXT NOT NULL COMMENT 'Mermaid ERD 코드',
    text_erd TEXT COMMENT '텍스트 ERD',
    version INT NOT NULL DEFAULT 1 COMMENT 'ERD 버전',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    is_public BOOLEAN DEFAULT FALSE COMMENT '공개 여부 (테넌트 포털에서 조회 가능)',
    trigger_source VARCHAR(50) COMMENT '생성 트리거: ONBOARDING_APPROVAL, MANUAL, SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    INDEX idx_diagram_id (diagram_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_diagram_type (diagram_type),
    INDEX idx_module_type (module_type),
    INDEX idx_is_active (is_active),
    INDEX idx_is_public (is_public),
    INDEX idx_trigger_source (trigger_source),
    
    CONSTRAINT chk_erd_diagram_type CHECK (diagram_type IN ('FULL', 'MODULE', 'CUSTOM', 'TENANT')),
    CONSTRAINT fk_erd_diagrams_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ERD 다이어그램 정보 테이블 (테넌트별)';

-- ============================================
-- 2. ERD 변경 이력 테이블
-- ============================================
CREATE TABLE erd_diagram_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    diagram_id VARCHAR(36) NOT NULL COMMENT 'ERD 다이어그램 UUID',
    version INT NOT NULL COMMENT 'ERD 버전',
    change_type VARCHAR(50) NOT NULL COMMENT '변경 타입: CREATED, UPDATED, DELETED',
    change_description TEXT COMMENT '변경 설명',
    mermaid_code TEXT COMMENT '변경된 Mermaid ERD 코드',
    diff_summary TEXT COMMENT '변경 사항 요약',
    changed_by VARCHAR(100) NOT NULL COMMENT '변경자',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '변경 시각',
    
    INDEX idx_diagram_id (diagram_id),
    INDEX idx_version (version),
    INDEX idx_change_type (change_type),
    INDEX idx_changed_at (changed_at),
    INDEX idx_diagram_version (diagram_id, version),
    
    CONSTRAINT chk_erd_history_change_type CHECK (change_type IN ('CREATED', 'UPDATED', 'DELETED')),
    CONSTRAINT fk_erd_diagram_history_diagram 
    FOREIGN KEY (diagram_id) REFERENCES erd_diagrams(diagram_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ERD 다이어그램 변경 이력 테이블';

-- ============================================
-- 3. ERD 테이블 매핑 테이블
-- ============================================
CREATE TABLE erd_table_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    diagram_id VARCHAR(36) NOT NULL COMMENT 'ERD 다이어그램 UUID',
    table_name VARCHAR(255) NOT NULL COMMENT '테이블명',
    display_name VARCHAR(255) COMMENT '표시명',
    position_x INT COMMENT 'ERD에서 X 위치',
    position_y INT COMMENT 'ERD에서 Y 위치',
    is_visible BOOLEAN DEFAULT TRUE COMMENT '표시 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_diagram_id (diagram_id),
    INDEX idx_table_name (table_name),
    UNIQUE KEY unique_diagram_table (diagram_id, table_name),
    
    CONSTRAINT fk_erd_table_mappings_diagram 
    FOREIGN KEY (diagram_id) REFERENCES erd_diagrams(diagram_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ERD 테이블 매핑 테이블';

