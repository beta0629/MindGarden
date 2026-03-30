-- 프로시저 표준화 테스트 스크립트
-- 표준화 작업 후 프로시저가 표준을 준수하는지 검증

-- 사용법:
-- mysql -u root -p mindgarden < test_procedure_standardization.sql

SET @test_count = 0;
SET @pass_count = 0;
SET @fail_count = 0;

-- 테스트 결과 저장용 임시 테이블
CREATE TEMPORARY TABLE IF NOT EXISTS test_results (
    test_name VARCHAR(255),
    status VARCHAR(20),
    message TEXT
);

-- ============================================
-- 테스트 1: p_tenant_id 파라미터 존재 확인
-- ============================================
SELECT '테스트 1: p_tenant_id 파라미터 존재 확인' AS test_name;

SELECT COUNT(*) INTO @test_count
FROM INFORMATION_SCHEMA.PARAMETERS
WHERE ROUTINE_SCHEMA = DATABASE()
  AND PARAMETER_NAME = 'p_tenant_id'
  AND PARAMETER_MODE = 'IN';

IF @test_count > 0 THEN
    SET @pass_count = @pass_count + 1;
    INSERT INTO test_results VALUES ('p_tenant_id 파라미터 존재', 'PASS', 
        CONCAT(@test_count, '개 프로시저에 p_tenant_id 파라미터 존재'));
ELSE
    SET @fail_count = @fail_count + 1;
    INSERT INTO test_results VALUES ('p_tenant_id 파라미터 존재', 'FAIL', 
        'p_tenant_id 파라미터를 가진 프로시저가 없습니다');
END IF;

-- ============================================
-- 테스트 2: branch_code 파라미터 없음 확인
-- ============================================
SELECT '테스트 2: branch_code 파라미터 없음 확인' AS test_name;

SELECT COUNT(*) INTO @test_count
FROM INFORMATION_SCHEMA.PARAMETERS
WHERE ROUTINE_SCHEMA = DATABASE()
  AND PARAMETER_NAME LIKE '%branch_code%';

IF @test_count = 0 THEN
    SET @pass_count = @pass_count + 1;
    INSERT INTO test_results VALUES ('branch_code 파라미터 없음', 'PASS', 
        'branch_code 파라미터가 없습니다 (표준 준수)');
ELSE
    SET @fail_count = @fail_count + 1;
    INSERT INTO test_results VALUES ('branch_code 파라미터 없음', 'FAIL', 
        CONCAT(@test_count, '개 프로시저에 branch_code 파라미터가 남아있습니다'));
END IF;

-- ============================================
-- 테스트 3: 프로시저 정의에서 branch_code 사용 없음 확인
-- ============================================
SELECT '테스트 3: 프로시저 정의에서 branch_code 사용 없음 확인' AS test_name;

SELECT COUNT(*) INTO @test_count
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_TYPE = 'PROCEDURE'
  AND ROUTINE_DEFINITION LIKE '%branch_code%'
  AND ROUTINE_DEFINITION NOT LIKE '%--%branch_code%'  -- 주석 제외
  AND ROUTINE_DEFINITION NOT LIKE '%/*%branch_code%*/';  -- 주석 제외

IF @test_count = 0 THEN
    SET @pass_count = @pass_count + 1;
    INSERT INTO test_results VALUES ('프로시저 정의에서 branch_code 사용 없음', 'PASS', 
        '프로시저 정의에 branch_code 사용이 없습니다 (표준 준수)');
ELSE
    SET @fail_count = @fail_count + 1;
    INSERT INTO test_results VALUES ('프로시저 정의에서 branch_code 사용 없음', 'FAIL', 
        CONCAT(@test_count, '개 프로시저에서 branch_code를 사용하고 있습니다'));
END IF;

-- ============================================
-- 테스트 4: 프로시저 목록 확인
-- ============================================
SELECT '테스트 4: 프로시저 목록 확인' AS test_name;

SELECT COUNT(*) INTO @test_count
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_TYPE = 'PROCEDURE';

INSERT INTO test_results VALUES ('프로시저 목록', 'INFO', 
    CONCAT('총 ', @test_count, '개 프로시저 발견'));

-- ============================================
-- 테스트 결과 출력
-- ============================================
SELECT '============================================' AS '';
SELECT '테스트 결과 요약' AS '';
SELECT '============================================' AS '';

SELECT * FROM test_results;

SELECT 
    @pass_count AS '통과',
    @fail_count AS '실패',
    (@pass_count + @fail_count) AS '전체',
    ROUND(@pass_count / (@pass_count + @fail_count) * 100, 2) AS '통과률(%)';

-- ============================================
-- 프로시저별 상세 검증 (선택적)
-- ============================================
-- 특정 프로시저의 표준 준수 여부를 확인하려면 아래 주석을 해제하세요

/*
SELECT 
    ROUTINE_NAME AS '프로시저명',
    CASE 
        WHEN ROUTINE_DEFINITION LIKE '%p_tenant_id%' THEN '✅'
        ELSE '❌'
    END AS 'tenant_id 사용',
    CASE 
        WHEN ROUTINE_DEFINITION LIKE '%branch_code%' THEN '❌'
        ELSE '✅'
    END AS 'branch_code 제거',
    CASE 
        WHEN ROUTINE_DEFINITION LIKE '%is_deleted%' THEN '✅'
        ELSE '⚠️'
    END AS 'Soft Delete'
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_TYPE = 'PROCEDURE'
ORDER BY ROUTINE_NAME;
*/

-- 임시 테이블 정리
DROP TEMPORARY TABLE IF EXISTS test_results;

