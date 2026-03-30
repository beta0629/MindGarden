-- 운영 데이터베이스 수동 수정
-- 1. status ENUM에 DEPOSIT_CONFIRMED 추가
ALTER TABLE consultant_client_mappings 
MODIFY COLUMN status ENUM(
    'PENDING_PAYMENT',
    'PAYMENT_CONFIRMED', 
    'DEPOSIT_CONFIRMED',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'TERMINATED',
    'SESSIONS_EXHAUSTED'
) NOT NULL;

-- 2. deposit_confirmed 컬럼 추가
ALTER TABLE consultant_client_mappings 
ADD COLUMN IF NOT EXISTS deposit_confirmed BOOLEAN DEFAULT FALSE;

-- 3. 기존 데이터 업데이트
UPDATE consultant_client_mappings 
SET deposit_confirmed = FALSE 
WHERE deposit_confirmed IS NULL;

-- 4. 결과 확인
SELECT 'Migration completed successfully' as status;
