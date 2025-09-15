-- 회기 추가 요청 테이블 생성
CREATE TABLE IF NOT EXISTS session_extension_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mapping_id BIGINT NOT NULL,
    requester_id BIGINT NOT NULL,
    additional_sessions INT NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    package_price DECIMAL(15,2) NOT NULL,
    status ENUM('PENDING', 'PAYMENT_CONFIRMED', 'ADMIN_APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    reason VARCHAR(500),
    admin_comment VARCHAR(1000),
    approved_by BIGINT,
    approved_at DATETIME(6),
    rejected_at DATETIME(6),
    rejection_reason VARCHAR(1000),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    INDEX idx_mapping_id (mapping_id),
    INDEX idx_requester_id (requester_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (mapping_id) REFERENCES consultant_client_mappings(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 테이블 코멘트 추가
ALTER TABLE session_extension_requests 
COMMENT = '회기 추가 요청 테이블 - 입금 확인 및 관리자 승인 워크플로우 관리';

-- 컬럼 코멘트 추가
ALTER TABLE session_extension_requests 
MODIFY COLUMN mapping_id BIGINT NOT NULL COMMENT '매핑 ID',
MODIFY COLUMN requester_id BIGINT NOT NULL COMMENT '요청자 ID',
MODIFY COLUMN additional_sessions INT NOT NULL COMMENT '추가할 회기 수',
MODIFY COLUMN package_name VARCHAR(100) NOT NULL COMMENT '패키지명',
MODIFY COLUMN package_price DECIMAL(15,2) NOT NULL COMMENT '패키지 가격',
MODIFY COLUMN status ENUM('PENDING', 'PAYMENT_CONFIRMED', 'ADMIN_APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING' COMMENT '요청 상태',
MODIFY COLUMN reason VARCHAR(500) COMMENT '요청 사유',
MODIFY COLUMN admin_comment VARCHAR(1000) COMMENT '관리자 코멘트',
MODIFY COLUMN approved_by BIGINT COMMENT '승인한 관리자 ID',
MODIFY COLUMN approved_at DATETIME(6) COMMENT '승인일시',
MODIFY COLUMN rejected_at DATETIME(6) COMMENT '거부일시',
MODIFY COLUMN rejection_reason VARCHAR(1000) COMMENT '거부 사유',
MODIFY COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '생성일시',
MODIFY COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '수정일시';
