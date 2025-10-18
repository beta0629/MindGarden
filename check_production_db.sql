-- 운영 데이터베이스 상태 확인
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'mind_garden' 
  AND TABLE_NAME = 'consultant_client_mappings' 
  AND COLUMN_NAME IN ('status', 'deposit_confirmed')
ORDER BY ORDINAL_POSITION;

-- 현재 매핑 상태 분포 확인
SELECT 
    status,
    COUNT(*) as count
FROM consultant_client_mappings 
GROUP BY status
ORDER BY status;
