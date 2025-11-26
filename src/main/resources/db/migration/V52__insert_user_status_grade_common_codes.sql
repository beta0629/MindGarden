-- 사용자 상태 및 등급 공통 코드 삽입
-- V52: USER_STATUS, USER_GRADE 공통 코드 추가

-- 사용자 상태 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, sort_order, is_deleted, version, created_at, updated_at) VALUES
('USER_STATUS', 'ACTIVE', '활성', '활성', '활성 상태의 사용자', 1, 1, 0, 0, NOW(), NOW()),
('USER_STATUS', 'INACTIVE', '비활성', '비활성', '비활성 상태의 사용자', 1, 2, 0, 0, NOW(), NOW()),
('USER_STATUS', 'SUSPENDED', '일시정지', '일시정지', '일시정지된 사용자', 1, 3, 0, 0, NOW(), NOW()),
('USER_STATUS', 'PENDING', '대기중', '대기중', '대기 중인 사용자', 1, 4, 0, 0, NOW(), NOW()),
('USER_STATUS', 'APPROVED', '승인됨', '승인됨', '승인된 사용자', 1, 5, 0, 0, NOW(), NOW()),
('USER_STATUS', 'REJECTED', '거부됨', '거부됨', '거부된 사용자', 1, 6, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    updated_at = NOW();

-- 사용자 등급 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, sort_order, is_deleted, version, created_at, updated_at) VALUES
('USER_GRADE', 'BRONZE', '브론즈', '브론즈', '브론즈 등급', 1, 1, 0, 0, NOW(), NOW()),
('USER_GRADE', 'SILVER', '실버', '실버', '실버 등급', 1, 2, 0, 0, NOW(), NOW()),
('USER_GRADE', 'GOLD', '골드', '골드', '골드 등급', 1, 3, 0, 0, NOW(), NOW()),
('USER_GRADE', 'PLATINUM', '플래티넘', '플래티넘', '플래티넘 등급', 1, 4, 0, 0, NOW(), NOW()),
('USER_GRADE', 'DIAMOND', '다이아몬드', '다이아몬드', '다이아몬드 등급', 1, 5, 0, 0, NOW(), NOW()),
('USER_GRADE', 'CLIENT_BRONZE', '브론즈', '브론즈', '브론즈 등급 클라이언트', 1, 6, 0, 0, NOW(), NOW()),
('USER_GRADE', 'CLIENT_SILVER', '실버', '실버', '실버 등급 클라이언트', 1, 7, 0, 0, NOW(), NOW()),
('USER_GRADE', 'CLIENT_GOLD', '골드', '골드', '골드 등급 클라이언트', 1, 8, 0, 0, NOW(), NOW()),
('USER_GRADE', 'CONSULTANT_JUNIOR', '주니어', '주니어', '주니어 상담사', 1, 9, 0, 0, NOW(), NOW()),
('USER_GRADE', 'CONSULTANT_SENIOR', '시니어', '시니어', '시니어 상담사', 1, 10, 0, 0, NOW(), NOW()),
('USER_GRADE', 'CONSULTANT_EXPERT', '전문가', '전문가', '전문가 상담사', 1, 11, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    updated_at = NOW();

