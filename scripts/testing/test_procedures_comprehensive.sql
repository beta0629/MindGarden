-- 프로시저 표준화 종합 테스트 스크립트
-- 기존 테스트 파일을 기반으로 확장된 버전
-- 표준화 작업 후 프로시저가 표준을 준수하는지 종합 검증

-- 사용법:
-- mysql -h beta0629.cafe24.com -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution < test_procedures_comprehensive.sql

SET @test_count = 0;
SET @pass_count = 0;
SET @fail_count = 0;
SET @warning_count = 0;

-- 테스트 결과 저장용 임시 테이블
CREATE TEMPORARY TABLE IF NOT EXISTS test_results (
    test_name VARCHAR(255),
    status VARCHAR(20),
    message TEXT,
    priority VARCHAR(20)
);

-- ============================================
-- 테스트 1: 프로시저 목록 확인
-- ============================================
SELECT '============================================' AS '';
SELECT '테스트 1: 프로시저 목록 확인' AS '';
SELECT '============================================' AS '';

SELECT COUNT(*) INTO @test_count
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_TYPE = 'PROCEDURE';

INSERT INTO test_results VALUES ('프로시저 목록', 'INFO', 
    CONCAT('총 ', @test_count, '개 프로시저 발견'), 'INFO');

SELECT CONCAT('총 ', @test_count, '개 프로시저 발견') AS result;

-- ============================================
-- 테스트 2: p_tenant_id 파라미터 존재 확인
-- ============================================
SELECT '============================================' AS '';
SELECT '테스트 2: p_tenant_id 파라미터 존재 확인' AS '';
SELECT '============================================' AS '';

SELECT COUNT(DISTINCT ROUTINE_NAME) INTO @test_count
FROM INFORMATION_SCHEMA.PARAMETERS
WHERE ROUTINE_SCHEMA = DATABASE()
  AND PARAMETER_NAME = 'p_tenant_id'
  AND PARAMETER_MODE = 'IN';

IF @test_count > 0 THEN
    SET @pass_count = @pass_count + 1;
    INSERT INTO test_results VALUES ('p_tenant_id 파라미터 존재', 'PASS', 
        CONCAT(@test_count, '개 프로시저에 p_tenant_id 파라미터 존재'), 'HIGH');
ELSE
    SET @fail_count = @fail_count + 1;
    INSERT INTO test_results VALUES ('p_tenant_id 파라미터 존재', 'FAIL', 
        'p_tenant_id 파라미터를 가진 프로시저가 없습니다 (Critical)', 'CRITICAL');
END IF;

-- ============================================
-- 테스트 3: branch_code 파라미터 없음 확인
-- ============================================
SELECT '============================================' AS '';
SELECT '테스트 3: branch_code 파라미터 없음 확인' AS '';
SELECT '============================================' AS '';

SELECT COUNT(*) INTO @test_count
FROM INFORMATION_SCHEMA.PARAMETERS
WHERE ROUTINE_SCHEMA = DATABASE()
  AND (PARAMETER_NAME LIKE '%branch_code%' OR PARAMETER_NAME LIKE '%branchCode%');

IF @test_count = 0 THEN
    SET @pass_count = @pass_count + 1;
    INSERT INTO test_results VALUES ('branch_code 파라미터 없음', 'PASS', 
        'branch_code 파라미터가 없습니다 (표준 준수)', 'HIGH');
ELSE
    SET @fail_count = @fail_count + 1;
    INSERT INTO test_results VALUES ('branch_code 파라미터 없음', 'FAIL', 
        CONCAT(@test_count, '개 프로시저에 branch_code 파라미터가 남아있습니다'), 'CRITICAL');
END IF;

-- ============================================
-- 테스트 4: 프로시저 정의에서 branch_code 사용 없음 확인
-- ============================================
SELECT '============================================' AS '';
SELECT '테스트 4: 프로시저 정의에서 branch_code 사용 없음 확인' AS '';
SELECT '============================================' AS '';

SELECT COUNT(*) INTO @test_count
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_TYPE = 'PROCEDURE'
  AND (
    ROUTINE_DEFINITION LIKE '%branch_code%'
    OR ROUTINE_DEFINITION LIKE '%branchCode%'
    OR ROUTINE_DEFINITION LIKE '%p_branch_code%'
    OR ROUTINE_DEFINITION LIKE '%v_branch_code%'
  )
  AND ROUTINE_DEFINITION NOT LIKE '%--%branch_code%'  -- 주석 제외
  AND ROUTINE_DEFINITION NOT LIKE '%/*%branch_code%*/'  -- 주석 제외
  AND ROUTINE_DEFINITION NOT LIKE '%--%branchCode%'  -- 주석 제외
  AND ROUTINE_DEFINITION NOT LIKE '%/*%branchCode%*/';  -- 주석 제외

IF @test_count = 0 THEN
    SET @pass_count = @pass_count + 1;
    INSERT INTO test_results VALUES ('프로시저 정의에서 branch_code 사용 없음', 'PASS', 
        '프로시저 정의에 branch_code 사용이 없습니다 (표준 준수)', 'HIGH');
ELSE
    SET @fail_count = @fail_count + 1;
    INSERT INTO test_results VALUES ('프로시저 정의에서 branch_code 사용 없음', 'FAIL', 
        CONCAT(@test_count, '개 프로시저에서 branch_code를 사용하고 있습니다'), 'CRITICAL');
    
    -- 문제가 있는 프로시저 목록 출력
    SELECT 
        ROUTINE_NAME AS '문제 프로시저',
        'branch_code 사용 발견' AS '문제'
    FROM INFORMATION_SCHEMA.ROUTINES
    WHERE ROUTINE_SCHEMA = DATABASE()
      AND ROUTINE_TYPE = 'PROCEDURE'
      AND (
        ROUTINE_DEFINITION LIKE '%branch_code%'
        OR ROUTINE_DEFINITION LIKE '%branchCode%'
        OR ROUTINE_DEFINITION LIKE '%p_branch_code%'
        OR ROUTINE_DEFINITION LIKE '%v_branch_code%'
      )
      AND ROUTINE_DEFINITION NOT LIKE '%--%branch_code%'
      AND ROUTINE_DEFINITION NOT LIKE '%/*%branch_code%*/';
END IF;

-- ============================================
-- 테스트 5: 프로시저별 상세 검증
-- ============================================
SELECT '============================================' AS '';
SELECT '테스트 5: 프로시저별 상세 검증' AS '';
SELECT '============================================' AS '';

-- 주요 프로시저별 표준 준수 여부 확인
SELECT 
    ROUTINE_NAME AS '프로시저명',
    CASE 
        WHEN ROUTINE_DEFINITION LIKE '%p_tenant_id%' THEN '✅'
        ELSE '❌'
    END AS 'tenant_id 사용',
    CASE 
        WHEN ROUTINE_DEFINITION LIKE '%branch_code%' 
          OR ROUTINE_DEFINITION LIKE '%branchCode%' 
          OR ROUTINE_DEFINITION LIKE '%p_branch_code%' 
          OR ROUTINE_DEFINITION LIKE '%v_branch_code%' THEN '❌'
        ELSE '✅'
    END AS 'branch_code 제거',
    CASE 
        WHEN ROUTINE_DEFINITION LIKE '%is_deleted%' THEN '✅'
        ELSE '⚠️'
    END AS 'Soft Delete',
    CASE 
        WHEN ROUTINE_DEFINITION LIKE '%p_success%' AND ROUTINE_DEFINITION LIKE '%p_message%' THEN '✅'
        ELSE '⚠️'
    END AS '표준 OUT 파라미터'
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_TYPE = 'PROCEDURE'
  AND ROUTINE_NAME IN (
    'UpdateMappingInfo',
    'UpdateMappingStatistics',
    'CheckMappingUpdatePermission',
    'AddSessionsToMapping',
    'ApplyDiscountAccounting',
    'ProcessRefundWithSessionAdjustment',
    'ProcessIntegratedSalaryCalculation',
    'ProcessSalaryPaymentWithErpSync',
    'ValidateIntegratedAmount',
    'GetConsolidatedFinancialData',
    'GenerateFinancialReport',
    'GetRefundableSessions',
    'GetRefundStatistics',
    'GetIntegratedSalaryStatistics',
    'UseSessionForMapping',
    'CheckTimeConflict',
    'ProcessScheduleAutoCompletion'
  )
ORDER BY ROUTINE_NAME;

-- ============================================
-- 테스트 6: 필수 프로시저 존재 확인
-- ============================================
SELECT '============================================' AS '';
SELECT '테스트 6: 필수 프로시저 존재 확인' AS '';
SELECT '============================================' AS '';

-- 필수 프로시저 목록
CREATE TEMPORARY TABLE IF NOT EXISTS required_procedures (
    procedure_name VARCHAR(255)
);

INSERT INTO required_procedures VALUES 
    ('UpdateMappingInfo'),
    ('UpdateMappingStatistics'),
    ('CheckMappingUpdatePermission'),
    ('AddSessionsToMapping'),
    ('ApplyDiscountAccounting'),
    ('ProcessRefundWithSessionAdjustment'),
    ('ProcessIntegratedSalaryCalculation'),
    ('ProcessSalaryPaymentWithErpSync'),
    ('ValidateIntegratedAmount'),
    ('GetConsolidatedFinancialData'),
    ('GenerateFinancialReport'),
    ('GetRefundableSessions'),
    ('GetRefundStatistics'),
    ('GetIntegratedSalaryStatistics');

SELECT 
    rp.procedure_name AS '필수 프로시저',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_SCHEMA = DATABASE()
              AND ROUTINE_NAME = rp.procedure_name
              AND ROUTINE_TYPE = 'PROCEDURE'
        ) THEN '✅ 존재'
        ELSE '❌ 없음'
    END AS '상태'
FROM required_procedures rp
ORDER BY rp.procedure_name;

DROP TEMPORARY TABLE IF EXISTS required_procedures;

-- ============================================
-- 테스트 결과 요약
-- ============================================
SELECT '============================================' AS '';
SELECT '테스트 결과 요약' AS '';
SELECT '============================================' AS '';

SELECT * FROM test_results ORDER BY 
    CASE priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
        WHEN 'INFO' THEN 5
    END,
    status DESC;

SELECT 
    @pass_count AS '통과',
    @fail_count AS '실패',
    @warning_count AS '경고',
    (@pass_count + @fail_count + @warning_count) AS '전체',
    CASE 
        WHEN (@pass_count + @fail_count + @warning_count) > 0 
        THEN ROUND(@pass_count / (@pass_count + @fail_count + @warning_count) * 100, 2)
        ELSE 0
    END AS '통과률(%)';

-- Critical 오류가 있으면 경고
IF @fail_count > 0 THEN
    SELECT '============================================' AS '';
    SELECT '⚠️ 경고: Critical 오류 발견!' AS '';
    SELECT '표준화 작업을 다시 확인하세요.' AS '';
    SELECT '============================================' AS '';
END IF;

-- 임시 테이블 정리
DROP TEMPORARY TABLE IF EXISTS test_results;

