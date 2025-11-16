-- 운영 DB에 DEPOSIT_PENDING 상태 추가
-- 실행일: 2025-01-17
-- 목적: 입금확인 400 에러 해결

-- 1. status ENUM에 DEPOSIT_PENDING 추가
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
