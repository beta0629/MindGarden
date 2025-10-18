-- 운영 DB 상태 확인
-- 실행일: 2025-01-17
-- 목적: 로컬과 운영 DB 상태 비교

-- 1. status 컬럼 정의 확인
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mind_garden' 
  AND TABLE_NAME = 'consultant_client_mappings' 
  AND COLUMN_NAME = 'status';

-- 2. deposit_confirmed 컬럼 확인
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mind_garden' 
  AND TABLE_NAME = 'consultant_client_mappings' 
  AND COLUMN_NAME = 'deposit_confirmed';

-- 3. 실제 사용 중인 상태들 확인
SELECT DISTINCT status 
FROM consultant_client_mappings 
ORDER BY status;

-- 4. 매핑 수 확인
SELECT COUNT(*) as total_mappings 
FROM consultant_client_mappings;

-- 5. 상태별 매핑 수 확인
SELECT status, COUNT(*) as count 
FROM consultant_client_mappings 
GROUP BY status 
ORDER BY status;
