-- ============================================
-- 마이그레이션: DEPOSIT_CONFIRMED 상태 추가
-- 날짜: 2025-10-17
-- 목적: 매핑 입금 확인 단계 추가
-- ============================================

-- 1. 백업 테이블 생성 (안전장치)
CREATE TABLE IF NOT EXISTS consultant_client_mappings_backup_20251017 AS 
SELECT * FROM consultant_client_mappings;

-- 2. status ENUM에 DEPOSIT_CONFIRMED 추가
ALTER TABLE consultant_client_mappings 
MODIFY COLUMN status ENUM(
    'PENDING_PAYMENT',
    'PAYMENT_CONFIRMED', 
    'DEPOSIT_CONFIRMED',    -- 새로 추가
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'TERMINATED',
    'SESSIONS_EXHAUSTED'
) NOT NULL;

-- 3. deposit_confirmed 컬럼 추가 (이미 있는지 확인 후)
ALTER TABLE consultant_client_mappings 
ADD COLUMN IF NOT EXISTS deposit_confirmed BOOLEAN DEFAULT FALSE;

-- 4. 기존 데이터 업데이트 (deposit_confirmed = false로 초기화)
UPDATE consultant_client_mappings 
SET deposit_confirmed = FALSE 
WHERE deposit_confirmed IS NULL;

-- 5. 마이그레이션 완료 로그
INSERT INTO migration_log (migration_name, executed_at, status, notes) 
VALUES (
    'add_deposit_confirmed_status', 
    NOW(), 
    'SUCCESS', 
    'DEPOSIT_CONFIRMED 상태 및 deposit_confirmed 컬럼 추가 완료'
);

-- ============================================
-- 롤백 스크립트 (필요시 실행)
-- ============================================
/*
-- 롤백: DEPOSIT_CONFIRMED 상태 제거
ALTER TABLE consultant_client_mappings 
MODIFY COLUMN status ENUM(
    'PENDING_PAYMENT',
    'PAYMENT_CONFIRMED', 
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'TERMINATED',
    'SESSIONS_EXHAUSTED'
) NOT NULL;

-- deposit_confirmed 컬럼 제거
ALTER TABLE consultant_client_mappings 
DROP COLUMN deposit_confirmed;

-- 백업 테이블에서 데이터 복원
TRUNCATE consultant_client_mappings;
INSERT INTO consultant_client_mappings SELECT * FROM consultant_client_mappings_backup_20251017;
*/
