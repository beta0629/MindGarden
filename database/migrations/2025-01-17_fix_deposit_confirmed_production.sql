-- 운영 환경 DEPOSIT_CONFIRMED 상태 추가
-- 실행일: 2025-01-17
-- 목적: 상담사 API 500 에러 해결

-- 1. deposit_confirmed 컬럼 추가 (이미 있을 수 있음)
ALTER TABLE consultant_client_mappings 
ADD COLUMN IF NOT EXISTS deposit_confirmed BOOLEAN DEFAULT FALSE;

-- 2. 기존 레코드 업데이트
UPDATE consultant_client_mappings 
SET deposit_confirmed = FALSE 
WHERE deposit_confirmed IS NULL;

-- 3. DEPOSIT_CONFIRMED 상태를 ENUM에 추가
-- 주의: 이 작업은 기존 데이터에 영향을 줄 수 있으므로 신중하게 실행
ALTER TABLE consultant_client_mappings 
MODIFY COLUMN status ENUM(
    'PENDING_PAYMENT',
    'PAYMENT_CONFIRMED', 
    'DEPOSIT_CONFIRMED',  -- 새로 추가
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'TERMINATED',
    'SESSIONS_EXHAUSTED'
) NOT NULL;

-- 4. 변경사항 확인
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mindgarden' 
  AND TABLE_NAME = 'consultant_client_mappings' 
  AND COLUMN_NAME = 'status';

-- 5. deposit_confirmed 컬럼 확인
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mindgarden' 
  AND TABLE_NAME = 'consultant_client_mappings' 
  AND COLUMN_NAME = 'deposit_confirmed';
