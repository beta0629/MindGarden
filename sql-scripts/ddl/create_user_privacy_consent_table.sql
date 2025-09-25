-- 사용자 개인정보 동의 테이블 생성
-- 작성일: 2025-01-17
-- 설명: 사용자의 개인정보 처리방침 및 이용약관 동의 상태를 관리하는 테이블

CREATE TABLE IF NOT EXISTS user_privacy_consent (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    privacy_consent BOOLEAN NOT NULL DEFAULT FALSE COMMENT '개인정보 처리방침 동의 여부',
    terms_consent BOOLEAN NOT NULL DEFAULT FALSE COMMENT '이용약관 동의 여부',
    marketing_consent BOOLEAN DEFAULT FALSE COMMENT '마케팅 정보 수신 동의 여부',
    consent_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '동의 일시',
    ip_address VARCHAR(45) COMMENT '동의 시 IP 주소',
    user_agent TEXT COMMENT '동의 시 User-Agent',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    INDEX idx_user_id (user_id),
    INDEX idx_consent_date (consent_date),
    INDEX idx_user_consent_date (user_id, consent_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 개인정보 동의 관리';

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO user_privacy_consent (user_id, privacy_consent, terms_consent, marketing_consent, consent_date, ip_address, user_agent) VALUES
(1, TRUE, TRUE, TRUE, NOW(), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(2, TRUE, TRUE, FALSE, NOW(), '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
(3, FALSE, FALSE, FALSE, NOW(), '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15');
