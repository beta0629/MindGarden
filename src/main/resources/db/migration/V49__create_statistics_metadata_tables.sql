-- 통계 메타데이터 시스템 테이블 생성
-- 하드코딩 없이 메타데이터 기반으로 통계를 관리하기 위한 테이블

-- 통계 정의 테이블
CREATE TABLE IF NOT EXISTS statistics_definitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NULL COMMENT '테넌트 ID (NULL이면 시스템 기본 통계)',
    statistic_code VARCHAR(100) NOT NULL COMMENT '통계 코드 (예: TOTAL_CONSULTATIONS_TODAY)',
    statistic_name_ko VARCHAR(200) NOT NULL COMMENT '통계 이름 (한글)',
    statistic_name_en VARCHAR(200) COMMENT '통계 이름 (영문)',
    category VARCHAR(50) NOT NULL COMMENT '카테고리 (SCHEDULE, CONSULTANT, CLIENT, REVENUE 등)',
    calculation_type VARCHAR(50) NOT NULL COMMENT '계산 타입 (COUNT, SUM, AVG, CUSTOM)',
    data_source_type VARCHAR(50) NOT NULL COMMENT '데이터 소스 타입 (SCHEDULE, MAPPING, CONSULTATION, ERP)',
    calculation_rule JSON NOT NULL COMMENT '계산 규칙 (메타데이터 JSON)',
    aggregation_period VARCHAR(20) DEFAULT 'DAILY' COMMENT '집계 기간 (DAILY, WEEKLY, MONTHLY, YEARLY)',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    description TEXT COMMENT '설명',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_tenant_code (tenant_id, statistic_code),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_tenant_category (tenant_id, category),
    UNIQUE KEY uk_tenant_statistic_code (tenant_id, statistic_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='통계 정의 메타데이터';

-- 통계 생성 이력 테이블
CREATE TABLE IF NOT EXISTS statistics_generation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    statistic_code VARCHAR(100) NOT NULL COMMENT '통계 코드',
    generation_date DATE NOT NULL COMMENT '생성 날짜',
    period_start DATE COMMENT '기간 시작일',
    period_end DATE COMMENT '기간 종료일',
    calculated_value DECIMAL(20, 2) COMMENT '계산된 값',
    raw_data JSON COMMENT '계산에 사용된 원본 데이터',
    calculation_time_ms INT COMMENT '계산 소요 시간 (밀리초)',
    status VARCHAR(20) DEFAULT 'SUCCESS' COMMENT '상태 (SUCCESS, FAILED, PARTIAL)',
    error_message TEXT COMMENT '에러 메시지',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_date (tenant_id, generation_date),
    INDEX idx_statistic (statistic_code, generation_date),
    INDEX idx_status (status),
    INDEX idx_tenant_statistic_date (tenant_id, statistic_code, generation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='통계 생성 이력';

-- 통계 값 캐시 테이블 (성능 최적화용)
CREATE TABLE IF NOT EXISTS statistics_values (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    statistic_code VARCHAR(100) NOT NULL COMMENT '통계 코드',
    calculation_date DATE NOT NULL COMMENT '계산 날짜',
    calculated_value DECIMAL(20, 2) NOT NULL COMMENT '계산된 값',
    metadata JSON COMMENT '추가 메타데이터',
    expires_at TIMESTAMP COMMENT '캐시 만료 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_code_date (tenant_id, statistic_code, calculation_date),
    INDEX idx_expires (expires_at),
    UNIQUE KEY uk_tenant_code_date (tenant_id, statistic_code, calculation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='통계 값 캐시';


