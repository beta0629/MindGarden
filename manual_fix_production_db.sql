-- 운영 DB 수동 수정 스크립트
-- 실행 방법: 운영 서버에서 직접 실행

-- 1. DEPOSIT_PENDING 상태 추가
ALTER TABLE consultant_client_mappings 
MODIFY COLUMN status ENUM(
    'PENDING_PAYMENT',
    'PAYMENT_CONFIRMED', 
    'DEPOSIT_PENDING',    -- 새로 추가
    'DEPOSIT_CONFIRMED',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'TERMINATED',
    'SESSIONS_EXHAUSTED'
) NOT NULL;

-- 2. 변경사항 확인
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'core_solution' 
  AND TABLE_NAME = 'consultant_client_mappings' 
  AND COLUMN_NAME = 'status';
