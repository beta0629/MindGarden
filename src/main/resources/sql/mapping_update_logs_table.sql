-- =====================================================
-- 매핑 수정 로그 테이블 생성
-- =====================================================

-- 매핑 수정 로그 테이블
CREATE TABLE IF NOT EXISTS mapping_update_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mapping_id BIGINT NOT NULL,
    old_package_name VARCHAR(100),
    new_package_name VARCHAR(100),
    old_package_price DECIMAL(10,2),
    new_package_price DECIMAL(10,2),
    old_total_sessions INT,
    new_total_sessions INT,
    updated_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_mapping_id (mapping_id),
    INDEX idx_updated_by (updated_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 세션 사용 로그 테이블 (이미 존재할 수 있음)
CREATE TABLE IF NOT EXISTS session_usage_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mapping_id BIGINT NOT NULL,
    schedule_id BIGINT,
    consultant_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    session_type VARCHAR(50),
    action_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_mapping_id (mapping_id),
    INDEX idx_consultant_id (consultant_id),
    INDEX idx_client_id (client_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
