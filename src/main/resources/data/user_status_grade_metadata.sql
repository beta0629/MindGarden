-- 사용자 상태 및 등급 메타데이터 추가
-- ClientComprehensiveManagement.js의 하드코딩된 상태/등급 매핑을 동적 처리로 변경

-- 1. 사용자 상태 코드그룹 메타데이터 추가
INSERT INTO code_group_metadata (group_name, korean_name, description, icon, color_code, display_order, is_active) VALUES
('USER_STATUS', '사용자 상태', '사용자 계정 상태', '👤', '#6b7280', 33, true),
('USER_GRADE', '사용자 등급', '사용자 등급 구분', '⭐', '#f59e0b', 34, true);

-- 2. 사용자 상태별 한글명/아이콘 정보 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, icon, color_code, is_active, sort_order, is_deleted, version, created_at, updated_at) VALUES
('USER_STATUS', 'ACTIVE', '활성', '활성 상태의 사용자', '🟢', '#10b981', true, 1, false, 0, NOW(), NOW()),
('USER_STATUS', 'INACTIVE', '비활성', '비활성 상태의 사용자', '🔴', '#6b7280', true, 2, false, 0, NOW(), NOW()),
('USER_STATUS', 'SUSPENDED', '일시정지', '일시정지된 사용자', '⏸️', '#f59e0b', true, 3, false, 0, NOW(), NOW()),
('USER_STATUS', 'COMPLETED', '완료', '완료된 사용자', '✅', '#8b5cf6', true, 4, false, 0, NOW(), NOW()),
('USER_STATUS', 'PENDING', '대기중', '대기 중인 사용자', '⏳', '#6b7280', true, 5, false, 0, NOW(), NOW()),
('USER_STATUS', 'APPROVED', '승인됨', '승인된 사용자', '✅', '#10b981', true, 6, false, 0, NOW(), NOW()),
('USER_STATUS', 'REJECTED', '거부됨', '거부된 사용자', '❌', '#ef4444', true, 7, false, 0, NOW(), NOW()),
('USER_STATUS', 'PAYMENT_CONFIRMED', '결제확인', '결제가 확인된 사용자', '💰', '#17a2b8', true, 8, false, 0, NOW(), NOW()),
('USER_STATUS', 'PAYMENT_PENDING', '결제대기', '결제 대기 중인 사용자', '⏳', '#ffc107', true, 9, false, 0, NOW(), NOW()),
('USER_STATUS', 'PAYMENT_REJECTED', '결제거부', '결제가 거부된 사용자', '❌', '#dc3545', true, 10, false, 0, NOW(), NOW()),
('USER_STATUS', 'TERMINATED', '종료됨', '종료된 사용자', '🔚', '#6b7280', true, 11, false, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    icon = VALUES(icon),
    color_code = VALUES(color_code),
    code_label = VALUES(code_label),
    code_description = VALUES(code_description),
    updated_at = NOW();

-- 3. 사용자 등급별 한글명/아이콘 정보 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, icon, color_code, is_active, sort_order, is_deleted, version, created_at, updated_at) VALUES
('USER_GRADE', 'CLIENT_BRONZE', '브론즈', '브론즈 등급 클라이언트', '🥉', '#cd7f32', true, 1, false, 0, NOW(), NOW()),
('USER_GRADE', 'CLIENT_SILVER', '실버', '실버 등급 클라이언트', '🥈', '#c0c0c0', true, 2, false, 0, NOW(), NOW()),
('USER_GRADE', 'CLIENT_GOLD', '골드', '골드 등급 클라이언트', '🥇', '#ffd700', true, 3, false, 0, NOW(), NOW()),
('USER_GRADE', 'CLIENT_PLATINUM', '플래티넘', '플래티넘 등급 클라이언트', '💎', '#e5e4e2', true, 4, false, 0, NOW(), NOW()),
('USER_GRADE', 'CLIENT_DIAMOND', '다이아몬드', '다이아몬드 등급 클라이언트', '💠', '#b9f2ff', true, 5, false, 0, NOW(), NOW()),
('USER_GRADE', 'CONSULTANT_JUNIOR', '주니어', '주니어 상담사', '⭐', '#f59e0b', true, 6, false, 0, NOW(), NOW()),
('USER_GRADE', 'CONSULTANT_SENIOR', '시니어', '시니어 상담사', '⭐⭐', '#f59e0b', true, 7, false, 0, NOW(), NOW()),
('USER_GRADE', 'CONSULTANT_EXPERT', '전문가', '전문가 상담사', '⭐⭐⭐', '#f59e0b', true, 8, false, 0, NOW(), NOW()),
('USER_GRADE', 'ADMIN', '관리자', '일반 관리자', '👑', '#8b5cf6', true, 9, false, 0, NOW(), NOW()),
('USER_GRADE', 'BRANCH_SUPER_ADMIN', '수퍼관리자', '지점 수퍼 관리자', '👑👑', '#8b5cf6', true, 10, false, 0, NOW(), NOW()),
('USER_GRADE', 'HQ_ADMIN', '본사 관리자', '본사 관리자', '🏢', '#3b82f6', true, 11, false, 0, NOW(), NOW()),
('USER_GRADE', 'SUPER_HQ_ADMIN', '본사 수퍼 관리자', '본사 수퍼 관리자', '🏢👑', '#3b82f6', true, 12, false, 0, NOW(), NOW()),
('USER_GRADE', 'HQ_MASTER', '본사 총관리자', '본사 총관리자', '👑🏢', '#dc2626', true, 13, false, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    icon = VALUES(icon),
    color_code = VALUES(color_code),
    code_label = VALUES(code_label),
    code_description = VALUES(code_description),
    updated_at = NOW();
