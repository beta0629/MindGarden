-- 운영 서버 프로시저 등록 상태 확인 및 수동 등록
-- 사용법: mysql -u root -p mindgarden < manual_procedure_check.sql

-- 1. 현재 등록된 프로시저 목록 확인
SELECT '현재 등록된 프로시저 목록' AS STATUS;
SELECT 
    ROUTINE_NAME as 'Procedure Name',
    CREATED as 'Created At',
    LAST_ALTERED as 'Last Modified'
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_TYPE = 'PROCEDURE' 
ORDER BY ROUTINE_NAME;

-- 2. 필요한 프로시저들 확인
SELECT '필요한 프로시저 존재 여부 확인' AS STATUS;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.ROUTINES WHERE ROUTINE_NAME = 'UseSessionForMapping' AND ROUTINE_SCHEMA = DATABASE()) 
        THEN '✅ UseSessionForMapping'
        ELSE '❌ UseSessionForMapping'
    END as '매핑-회기 프로시저',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.ROUTINES WHERE ROUTINE_NAME = 'ProcessRefundWithSessionAdjustment' AND ROUTINE_SCHEMA = DATABASE()) 
        THEN '✅ ProcessRefundWithSessionAdjustment'
        ELSE '❌ ProcessRefundWithSessionAdjustment'
    END as '환불 처리 프로시저',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.ROUTINES WHERE ROUTINE_NAME = 'GetConsolidatedFinancialData' AND ROUTINE_SCHEMA = DATABASE()) 
        THEN '✅ GetConsolidatedFinancialData'
        ELSE '❌ GetConsolidatedFinancialData'
    END as '재무 데이터 프로시저',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.ROUTINES WHERE ROUTINE_NAME = 'UpdateDailyStatistics' AND ROUTINE_SCHEMA = DATABASE()) 
        THEN '✅ UpdateDailyStatistics'
        ELSE '❌ UpdateDailyStatistics'
    END as '통계 업데이트 프로시저';

-- 3. 총 프로시저 개수 확인
SELECT '총 프로시저 개수' AS STATUS;
SELECT COUNT(*) as 'Total Procedures' 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_TYPE = 'PROCEDURE';
