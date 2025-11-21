-- ============================================================
-- V33: tenant_dashboards 테이블 생성
-- 테넌트별 역할 기반 대시보드 관리 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS tenant_dashboards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 ID',
    dashboard_id VARCHAR(36) UNIQUE NOT NULL COMMENT '대시보드 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID (FK)',
    tenant_role_id VARCHAR(36) NOT NULL COMMENT '테넌트 역할 ID (FK)',
    dashboard_name VARCHAR(255) NOT NULL COMMENT '대시보드 이름',
    dashboard_name_ko VARCHAR(255) COMMENT '대시보드 이름 (한글)',
    dashboard_name_en VARCHAR(255) COMMENT '대시보드 이름 (영문)',
    description TEXT COMMENT '설명',
    dashboard_type VARCHAR(50) COMMENT '대시보드 타입 (STUDENT, TEACHER, ADMIN 등)',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT '기본 대시보드 여부',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성화 여부',
    display_order INT NOT NULL DEFAULT 0 COMMENT '표시 순서',
    dashboard_config JSON COMMENT '대시보드 설정 (위젯 구성, 레이아웃 등)',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at TIMESTAMP NULL COMMENT '삭제일시',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 여부',
    version BIGINT NOT NULL DEFAULT 0 COMMENT '버전 (낙관적 잠금)',

    -- 외래 키 제약 조건 (NO ACTION으로 설정하여 데이터 삭제 시 유연성 확보)
    CONSTRAINT fk_dashboard_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (tenant_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT fk_dashboard_tenant_role FOREIGN KEY (tenant_role_id) REFERENCES tenant_roles (tenant_role_id) ON DELETE NO ACTION ON UPDATE NO ACTION,

    -- 인덱스
    INDEX idx_tenant_dashboard_tenant_id (tenant_id),
    INDEX idx_tenant_dashboard_tenant_role_id (tenant_role_id),
    INDEX idx_tenant_dashboard_is_active (is_active),
    INDEX idx_tenant_dashboard_display_order (display_order),

    -- 유니크 제약: 한 역할당 하나의 대시보드만
    UNIQUE KEY uk_tenant_dashboard_role (tenant_id, tenant_role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트 대시보드 테이블';

