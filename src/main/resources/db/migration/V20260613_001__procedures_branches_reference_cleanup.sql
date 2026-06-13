-- =============================================================================
-- PR-A — PL/SQL 프로시저 branches 참조 정리 + 시그니처 정합 (PR-7 회귀 근본 해결)
--
-- 작성 일자 : 2026-06-13
-- 브랜치   : refactor/user-branch-mapping-removal
-- 근거 보고: PR-7 (#284) V20260612_002 마이그 후 6/13 자정 batch 실패 4건
--          ① 06-13 00:01 UpdateAllBranchDailyStatistics 실패
--          ② 06-13 00:03 UpdateAllConsultantPerformance 실패
--          ③ 06-13 04:00 PlSqlFinancialServiceImpl 통합 재무 조회 실패
--          ④ expo-app 내담자 "지난상담" 빈 결과 (User.branch LAZY proxy)
--
-- 배경:
--   • PR-7 에서 `branches` 테이블을 `branches_dropped_20260612` 로 RENAME 했고,
--     운영 안전망으로 10:50:51 KST 에 `branches` VIEW alias 를 임시 복구함.
--   • 운영 BE 가 호출하는 batch 프로시저 일부가 (a) `branches` 테이블 직접 조회,
--     (b) deprecated `users.branch_code` 커서 기반 시그니처를 유지 → 신규 표준화
--     본 (`*_deploy.sql` SSOT) 과 시그니처가 어긋나 SimpleJdbcCall 메타데이터
--     매칭 실패로 자정 batch 가 매일 NPE/Parameter mismatch 로 죽음.
--
-- 변경 (DROP + CREATE):
--   1. UpdateAllBranchDailyStatistics
--      - 1 IN(p_stat_date) 시그니처 유지 (Java PlSqlStatisticsServiceImpl 정합)
--      - 본문 : `users.branch_code` 커서 → `users.tenant_id` 커서로 전환,
--               각 tenantId 마다 `UpdateDailyStatistics(tenantId, statDate, '__system__', OUT, OUT)` 호출
--      - branches 참조 0건
--   2. UpdateAllConsultantPerformance
--      - 1 IN(p_performance_date) 시그니처 유지 (Java 정합)
--      - 본문 : `schedules.tenant_id + consultant_id` 커서로 전환,
--               각 (tenantId, consultantId) 마다
--               `UpdateConsultantPerformance(consultantId, performanceDate, tenantId, '__system__', OUT, OUT)` 호출
--      - branches 참조 0건
--   3. GetOverallBranchStatistics (PlSqlFinancialServiceImpl 통합 재무 04:00 의존)
--      - 본문에서 `FROM branches` 직접 조회 제거 → `tenants` 기반 카운트로 전환
--      - 시그니처 불변(기존 호출자 호환).
--
-- 안전성:
--   • 운영 사용자 branch_id 0건 (PR-3/9 마이그 후) — 결과 빈 통계 OK.
--   • DROP IF EXISTS 후 CREATE → idempotent. 재실행 안전.
--   • H2 인메모리(통합 테스트) 는 이 migration 을 스킵하지 않으나, BEGIN/END 블록
--     문법은 H2 MODE=MySQL 에서 호환 (동일 패턴 V20260606_009, V20260531_004 사용 중).
--
-- 게이트 / 검증:
--   (1) flyway info → V20260613_001 SUCCESS
--   (2) SHOW PROCEDURE STATUS WHERE Db=DATABASE()
--           AND Name IN ('UpdateAllBranchDailyStatistics',
--                        'UpdateAllConsultantPerformance',
--                        'GetOverallBranchStatistics')
--       → 3 행, ROUTINE_DEFINITION 안에 'branches' 0건
--   (3) D+1 00:01 / 00:03 / 04:00 KST 스케줄러 로그 → 3종 ERROR 0건
--   (4) BE 로그 grep 'branches' 0건 (User.branch ManyToOne 매핑 제거 동시 적용)
-- =============================================================================

DELIMITER $$

-- ─────────────────────────────────────────────────────────────────────────
-- 1. UpdateAllBranchDailyStatistics (1 IN, branches 미참조)
-- ─────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS UpdateAllBranchDailyStatistics$$
CREATE PROCEDURE UpdateAllBranchDailyStatistics(
    IN p_stat_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_tenant_id VARCHAR(100);
    DECLARE v_processed_count INT DEFAULT 0;
    DECLARE v_update_success BOOLEAN;
    DECLARE v_update_message TEXT;

    -- 활성 테넌트 커서 (운영 schedules 기반 — branches 참조 없음)
    DECLARE tenant_cursor CURSOR FOR
        SELECT DISTINCT tenant_id
        FROM schedules
        WHERE date = p_stat_date
          AND tenant_id IS NOT NULL
          AND tenant_id <> ''
          AND is_deleted = FALSE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    OPEN tenant_cursor;

    read_loop: LOOP
        FETCH tenant_cursor INTO v_tenant_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- 신규 표준화 시그니처 (테넌트 격리)
        CALL UpdateDailyStatistics(
            v_tenant_id,
            p_stat_date,
            '__system__',
            v_update_success,
            v_update_message
        );

        IF v_update_success = TRUE THEN
            SET v_processed_count = v_processed_count + 1;
        END IF;
    END LOOP;

    CLOSE tenant_cursor;

    COMMIT;
END$$

-- ─────────────────────────────────────────────────────────────────────────
-- 2. UpdateAllConsultantPerformance (1 IN, branches 미참조)
-- ─────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS UpdateAllConsultantPerformance$$
CREATE PROCEDURE UpdateAllConsultantPerformance(
    IN p_performance_date DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_tenant_id VARCHAR(100);
    DECLARE v_consultant_id BIGINT;
    DECLARE v_processed_count INT DEFAULT 0;
    DECLARE v_update_success BOOLEAN;
    DECLARE v_update_message TEXT;

    -- 활성 (테넌트, 상담사) 커서 (schedules 기반 — branches 참조 없음)
    DECLARE consultant_cursor CURSOR FOR
        SELECT DISTINCT s.tenant_id, s.consultant_id
        FROM schedules s
        WHERE s.date = p_performance_date
          AND s.tenant_id IS NOT NULL
          AND s.tenant_id <> ''
          AND s.consultant_id IS NOT NULL
          AND s.is_deleted = FALSE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    OPEN consultant_cursor;

    read_loop: LOOP
        FETCH consultant_cursor INTO v_tenant_id, v_consultant_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- 신규 표준화 시그니처 (테넌트 격리)
        CALL UpdateConsultantPerformance(
            v_consultant_id,
            p_performance_date,
            v_tenant_id,
            '__system__',
            v_update_success,
            v_update_message
        );

        IF v_update_success = TRUE THEN
            SET v_processed_count = v_processed_count + 1;
        END IF;
    END LOOP;

    CLOSE consultant_cursor;

    COMMIT;
END$$

-- ─────────────────────────────────────────────────────────────────────────
-- 3. GetOverallBranchStatistics (branches 미참조 — tenants 기반)
--    PlSqlFinancialServiceImpl 의 04:00 통합 재무 사이클이 의존.
-- ─────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS GetOverallBranchStatistics$$
CREATE PROCEDURE GetOverallBranchStatistics(
    OUT p_total_branches INT,
    OUT p_total_consultants INT,
    OUT p_total_clients INT,
    OUT p_total_schedules INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
overall_proc: BEGIN
    DECLARE v_error_message VARCHAR(500);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('전체 통계 조회 중 오류 발생: ', v_error_message);
    END;

    -- 1. 총 테넌트 수 (branches 테이블 미참조 — tenants 기반)
    SELECT COUNT(*) INTO p_total_branches
    FROM tenants
    WHERE is_deleted = FALSE;

    -- 2. 총 상담사 수
    SELECT COUNT(*) INTO p_total_consultants
    FROM users
    WHERE role = 'CONSULTANT'
      AND is_active = TRUE
      AND is_deleted = FALSE;

    -- 3. 총 내담자 수
    SELECT COUNT(*) INTO p_total_clients
    FROM users
    WHERE role = 'CLIENT'
      AND is_active = TRUE
      AND is_deleted = FALSE;

    -- 4. 총 스케줄 수
    SELECT COUNT(*) INTO p_total_schedules
    FROM schedules
    WHERE is_deleted = FALSE;

    SET p_success = TRUE;
    SET p_message = '전체 통계 조회 완료 (branches 미참조).';
END$$

DELIMITER ;
