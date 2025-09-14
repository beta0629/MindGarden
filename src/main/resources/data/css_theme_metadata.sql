-- CSS 테마 시스템을 위한 메타데이터 테이블 생성
-- Phase 4: CSS 동적화 시스템 구현

-- 1. CSS 테마 메타데이터 테이블 생성
CREATE TABLE IF NOT EXISTS css_theme_metadata (
    theme_name VARCHAR(50) NOT NULL PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL COMMENT '테마 표시명',
    description VARCHAR(500) COMMENT '테마 설명',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성 여부',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT '기본 테마 여부',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CSS 테마 메타데이터';

-- 2. CSS 색상 설정 테이블 생성
CREATE TABLE IF NOT EXISTS css_color_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    theme_name VARCHAR(50) NOT NULL COMMENT '테마명',
    color_key VARCHAR(50) NOT NULL COMMENT '색상 키 (예: PRIMARY, SUCCESS)',
    color_value VARCHAR(50) NOT NULL COMMENT '색상 값 (예: #667eea)',
    color_type ENUM('hex', 'rgb', 'rgba', 'gradient') NOT NULL DEFAULT 'hex' COMMENT '색상 타입',
    color_category VARCHAR(30) NOT NULL COMMENT '색상 카테고리 (PRIMARY, SECONDARY, STATUS, FUNCTIONAL)',
    description VARCHAR(200) COMMENT '색상 설명',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_theme_color (theme_name, color_key),
    KEY idx_theme_name (theme_name),
    KEY idx_color_category (color_category),
    
    FOREIGN KEY (theme_name) REFERENCES css_theme_metadata(theme_name) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CSS 색상 설정';

-- 3. 기본 테마 메타데이터 추가
INSERT INTO css_theme_metadata (theme_name, display_name, description, is_active, is_default, display_order) VALUES
('default', '기본 테마', 'MindGarden 기본 테마 (보라-파랑 그라데이션)', true, true, 1),
('corporate', '기업 테마', '기업용 블루 테마', true, false, 2),
('warm', '따뜻한 테마', '따뜻한 오렌지-빨강 테마', true, false, 3),
('cool', '시원한 테마', '시원한 청록-파랑 테마', true, false, 4)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    description = VALUES(description),
    is_active = VALUES(is_active),
    is_default = VALUES(is_default),
    display_order = VALUES(display_order);

-- 4. 기본 테마 색상 설정 추가 (기본 테마)
INSERT INTO css_color_settings (theme_name, color_key, color_value, color_type, color_category, description) VALUES
-- Primary Colors (핵심 브랜드 색상)
('default', 'PRIMARY', '#667eea', 'hex', 'PRIMARY', '주요 브랜드 색상'),
('default', 'PRIMARY_DARK', '#764ba2', 'hex', 'PRIMARY', '주요 브랜드 어두운 색상'),
('default', 'PRIMARY_GRADIENT', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'gradient', 'PRIMARY', '주요 브랜드 그라데이션'),

-- Secondary Colors (보조 색상)
('default', 'SECONDARY', '#6c757d', 'hex', 'SECONDARY', '보조 색상'),
('default', 'SECONDARY_LIGHT', '#e9ecef', 'hex', 'SECONDARY', '보조 색상 밝은 버전'),

-- Status Colors (상태 색상)
('default', 'SUCCESS', '#00b894', 'hex', 'STATUS', '성공 상태 색상'),
('default', 'SUCCESS_LIGHT', '#d4edda', 'hex', 'STATUS', '성공 상태 밝은 색상'),
('default', 'SUCCESS_DARK', '#00a085', 'hex', 'STATUS', '성공 상태 어두운 색상'),
('default', 'SUCCESS_GRADIENT', 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 'gradient', 'STATUS', '성공 상태 그라데이션'),

('default', 'DANGER', '#ff6b6b', 'hex', 'STATUS', '위험 상태 색상'),
('default', 'DANGER_LIGHT', '#f8d7da', 'hex', 'STATUS', '위험 상태 밝은 색상'),
('default', 'DANGER_DARK', '#ee5a24', 'hex', 'STATUS', '위험 상태 어두운 색상'),
('default', 'DANGER_GRADIENT', 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', 'gradient', 'STATUS', '위험 상태 그라데이션'),

('default', 'INFO', '#74b9ff', 'hex', 'STATUS', '정보 상태 색상'),
('default', 'INFO_LIGHT', '#d1ecf1', 'hex', 'STATUS', '정보 상태 밝은 색상'),
('default', 'INFO_DARK', '#0984e3', 'hex', 'STATUS', '정보 상태 어두운 색상'),
('default', 'INFO_GRADIENT', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 'gradient', 'STATUS', '정보 상태 그라데이션'),

('default', 'WARNING', '#f093fb', 'hex', 'STATUS', '경고 상태 색상'),
('default', 'WARNING_LIGHT', '#fff3cd', 'hex', 'STATUS', '경고 상태 밝은 색상'),
('default', 'WARNING_DARK', '#f5576c', 'hex', 'STATUS', '경고 상태 어두운 색상'),
('default', 'WARNING_GRADIENT', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'gradient', 'STATUS', '경고 상태 그라데이션'),

-- Functional Colors (기능별 색상)
('default', 'CONSULTANT', '#a29bfe', 'hex', 'FUNCTIONAL', '상담사 관련 색상'),
('default', 'CONSULTANT_DARK', '#6c5ce7', 'hex', 'FUNCTIONAL', '상담사 관련 어두운 색상'),
('default', 'CONSULTANT_GRADIENT', 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)', 'gradient', 'FUNCTIONAL', '상담사 관련 그라데이션'),

('default', 'CLIENT', '#00b894', 'hex', 'FUNCTIONAL', '내담자 관련 색상'),
('default', 'CLIENT_DARK', '#00a085', 'hex', 'FUNCTIONAL', '내담자 관련 어두운 색상'),
('default', 'CLIENT_GRADIENT', 'linear-gradient(135deg, #00b894 0%, #00a085 100%)', 'gradient', 'FUNCTIONAL', '내담자 관련 그라데이션'),

('default', 'FINANCE', '#f39c12', 'hex', 'FUNCTIONAL', '재정 관련 색상'),
('default', 'FINANCE_DARK', '#e67e22', 'hex', 'FUNCTIONAL', '재정 관련 어두운 색상'),
('default', 'FINANCE_GRADIENT', 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)', 'gradient', 'FUNCTIONAL', '재정 관련 그라데이션')
ON DUPLICATE KEY UPDATE
    color_value = VALUES(color_value),
    color_type = VALUES(color_type),
    color_category = VALUES(color_category),
    description = VALUES(description),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

-- 5. 기업 테마 색상 설정 추가
INSERT INTO css_color_settings (theme_name, color_key, color_value, color_type, color_category, description) VALUES
-- Primary Colors
('corporate', 'PRIMARY', '#1e3a8a', 'hex', 'PRIMARY', '기업용 주요 색상 (네이비)'),
('corporate', 'PRIMARY_DARK', '#1e40af', 'hex', 'PRIMARY', '기업용 주요 어두운 색상'),
('corporate', 'PRIMARY_GRADIENT', 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 'gradient', 'PRIMARY', '기업용 주요 그라데이션'),

-- Status Colors
('corporate', 'SUCCESS', '#059669', 'hex', 'STATUS', '기업용 성공 색상'),
('corporate', 'DANGER', '#dc2626', 'hex', 'STATUS', '기업용 위험 색상'),
('corporate', 'INFO', '#0284c7', 'hex', 'STATUS', '기업용 정보 색상'),
('corporate', 'WARNING', '#d97706', 'hex', 'STATUS', '기업용 경고 색상'),

-- Functional Colors
('corporate', 'CONSULTANT', '#7c3aed', 'hex', 'FUNCTIONAL', '기업용 상담사 색상'),
('corporate', 'CLIENT', '#059669', 'hex', 'FUNCTIONAL', '기업용 내담자 색상'),
('corporate', 'FINANCE', '#ea580c', 'hex', 'FUNCTIONAL', '기업용 재정 색상')
ON DUPLICATE KEY UPDATE
    color_value = VALUES(color_value),
    color_type = VALUES(color_type),
    color_category = VALUES(color_category),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP;

-- 6. 따뜻한 테마 색상 설정 추가
INSERT INTO css_color_settings (theme_name, color_key, color_value, color_type, color_category, description) VALUES
-- Primary Colors
('warm', 'PRIMARY', '#ea580c', 'hex', 'PRIMARY', '따뜻한 주요 색상 (오렌지)'),
('warm', 'PRIMARY_DARK', '#c2410c', 'hex', 'PRIMARY', '따뜻한 주요 어두운 색상'),
('warm', 'PRIMARY_GRADIENT', 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', 'gradient', 'PRIMARY', '따뜻한 주요 그라데이션'),

-- Status Colors
('warm', 'SUCCESS', '#16a34a', 'hex', 'STATUS', '따뜻한 성공 색상'),
('warm', 'DANGER', '#dc2626', 'hex', 'STATUS', '따뜻한 위험 색상'),
('warm', 'INFO', '#0891b2', 'hex', 'STATUS', '따뜻한 정보 색상'),
('warm', 'WARNING', '#ca8a04', 'hex', 'STATUS', '따뜻한 경고 색상'),

-- Functional Colors
('warm', 'CONSULTANT', '#9333ea', 'hex', 'FUNCTIONAL', '따뜻한 상담사 색상'),
('warm', 'CLIENT', '#16a34a', 'hex', 'FUNCTIONAL', '따뜻한 내담자 색상'),
('warm', 'FINANCE', '#dc2626', 'hex', 'FUNCTIONAL', '따뜻한 재정 색상')
ON DUPLICATE KEY UPDATE
    color_value = VALUES(color_value),
    color_type = VALUES(color_type),
    color_category = VALUES(color_category),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP;

-- 7. 시원한 테마 색상 설정 추가
INSERT INTO css_color_settings (theme_name, color_key, color_value, color_type, color_category, description) VALUES
-- Primary Colors
('cool', 'PRIMARY', '#0891b2', 'hex', 'PRIMARY', '시원한 주요 색상 (청록)'),
('cool', 'PRIMARY_DARK', '#0e7490', 'hex', 'PRIMARY', '시원한 주요 어두운 색상'),
('cool', 'PRIMARY_GRADIENT', 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', 'gradient', 'PRIMARY', '시원한 주요 그라데이션'),

-- Status Colors
('cool', 'SUCCESS', '#059669', 'hex', 'STATUS', '시원한 성공 색상'),
('cool', 'DANGER', '#dc2626', 'hex', 'STATUS', '시원한 위험 색상'),
('cool', 'INFO', '#0284c7', 'hex', 'STATUS', '시원한 정보 색상'),
('cool', 'WARNING', '#d97706', 'hex', 'STATUS', '시원한 경고 색상'),

-- Functional Colors
('cool', 'CONSULTANT', '#7c3aed', 'hex', 'FUNCTIONAL', '시원한 상담사 색상'),
('cool', 'CLIENT', '#059669', 'hex', 'FUNCTIONAL', '시원한 내담자 색상'),
('cool', 'FINANCE', '#0891b2', 'hex', 'FUNCTIONAL', '시원한 재정 색상')
ON DUPLICATE KEY UPDATE
    color_value = VALUES(color_value),
    color_type = VALUES(color_type),
    color_category = VALUES(color_category),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP;

-- 8. 테마 메타데이터 조회 쿼리 예시
-- SELECT * FROM css_theme_metadata WHERE is_active = true ORDER BY display_order;

-- 9. 특정 테마의 색상 설정 조회 쿼리 예시
-- SELECT color_key, color_value, color_type, color_category FROM css_color_settings 
-- WHERE theme_name = 'default' AND is_active = true ORDER BY color_category, color_key;
