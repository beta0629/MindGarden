-- 간소화된 스케줄 상태 코드 추가

-- 기존 STATUS 그룹의 스케줄 관련 코드들을 비활성화
UPDATE code_values SET is_active = false, is_deleted = true, updated_at = NOW()
WHERE code_group_id = (SELECT id FROM code_groups WHERE code = 'STATUS')
AND code IN (
    'MAINTENANCE', 'APPROVED', 'REJECTED', 'PAYMENT_CONFIRMED', 'PAYMENT_PENDING', 
    'PAYMENT_REJECTED', 'TERMINATED', 'REQUESTED', 'INACTIVE', 'SUSPENDED', 
    'WAITING', 'EXPIRED', 'NO_SHOW', 'RESCHEDULED', 'BLOCKED', 'DELETED'
);

-- 새로운 간소화된 스케줄 상태 코드 추가
INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'AVAILABLE', '가능', '예약 가능한 시간대', '#28a745', '✅', true, false, 1, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'STATUS'
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    is_active = true,
    is_deleted = false,
    updated_at = NOW();

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'BOOKED', '예약됨', '상담 예약됨', '#007bff', '📅', true, false, 2, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'STATUS'
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    is_active = true,
    is_deleted = false,
    updated_at = NOW();

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'VACATION', '휴가', '휴가로 인한 비활성', '#ffc107', '🏖️', true, false, 3, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'STATUS'
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    is_active = true,
    is_deleted = false,
    updated_at = NOW();

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'COMPLETED', '완료', '상담 완료', '#6c757d', '✅', true, false, 4, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'STATUS'
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    is_active = true,
    is_deleted = false,
    updated_at = NOW();

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'CANCELLED', '취소됨', '예약 취소됨', '#dc3545', '❌', true, false, 5, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'STATUS'
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    is_active = true,
    is_deleted = false,
    updated_at = NOW();
