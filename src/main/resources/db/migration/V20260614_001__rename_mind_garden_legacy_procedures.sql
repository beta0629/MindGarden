-- =============================================================================
-- PR-C — mind_garden 스키마 잔존 PROC 4종을 OBSOLETE 접미사 stub 으로 치환
--
-- 작성 일자 : 2026-06-14
-- 브랜치    : fix/db-pr-c-mind-garden-procs-obsolete-rename
-- 표준      : docs/standards/DATABASE_MIGRATION_STANDARD.md 준수
-- 근거 보고 :
--   • docs/운영반영/CRON_SQL_ERROR_TRIAGE_20260614.md §6 PR 분리 (PR-C 항목)
--   • docs/운영반영/MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md §4.1 옵션 A (RENAME)
--   • deployer fb010938 운영 DB 점검 결과 (mind_garden 잔존 PROC 4종 식별)
--
-- 배경 (one-liner):
--   • 06-11 P0 hotfix (PR #217) 이후에도 mind_garden 스키마에 core_solution 과
--     동명 PROC 4종이 잔존 → PR-A(.withSchemaName 제거) 단독으로는 catalog
--     미명시 분기·메타 lookup 에서 'multiple signatures' 회귀 가능성 잔존.
--   • mind_garden 잔존 4종 (deployer fb010938):
--       (1) UpdateDailyStatistics
--       (2) UpdateAllBranchDailyStatistics
--       (3) UpdateConsultantPerformance
--       (4) DailyPerformanceMonitoring
--   • UpdateAllConsultantPerformance 는 V20260606_009 에서 이미 DROP 완료.
--
-- 변경 (DROP 원본 + stub CREATE):
--   • 4종 모두 mind_garden 측에서 OBSOLETE_<원이름>_20260614 stub 으로 치환.
--   • 원본 PROC 는 DROP. stub 는 호출 시 SIGNAL SQLSTATE '45000' 으로 차단 +
--     모니터링 마커 (정리 시점·SSOT 안내) 역할만 수행.
--   • core_solution 스키마 PROC 는 무변경 (SSOT 단일화 유지).
--   • MySQL 8 은 RENAME PROCEDURE 를 지원하지 않으므로 DROP + 스텁 CREATE 패턴 채택
--     (MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md §4.1.2 우회 절차).
--
-- 사전 가드:
--   • CREATE SCHEMA IF NOT EXISTS mind_garden — H2 인메모리(MODE=MySQL) 안전
--     (V20260606_009 동일 패턴). 운영은 이미 존재 → NO-OP.
--   • DROP PROCEDURE IF EXISTS — 부재 시 NO-OP (idempotent, 재실행 안전).
--   • stub 도 동일 IF EXISTS 가드.
--
-- 본 PR 의 명시적 비범위 (반드시 별도 PR):
--   • mind_garden.OBSOLETE_* stub 의 완전 DROP → V20260621_001 (1주 모니터링 후).
--   • core_solution 스키마 PROC 의 변경 → 본 PR 에서 일절 손대지 않음.
--   • 운영 DB 직접 실행 → 금지. Flyway migration 으로만 적용.
--
-- 게이트 / 검증 (운영 배포 후):
--   (1) flyway info → V20260614_001 SUCCESS
--   (2) SELECT ROUTINE_SCHEMA, ROUTINE_NAME
--         FROM information_schema.ROUTINES
--         WHERE ROUTINE_TYPE='PROCEDURE'
--           AND ROUTINE_NAME IN (
--             'UpdateDailyStatistics',
--             'UpdateAllBranchDailyStatistics',
--             'UpdateConsultantPerformance',
--             'DailyPerformanceMonitoring'
--           )
--         ORDER BY 2,1;
--       → 각 PROC 마다 ROUTINE_SCHEMA='core_solution' 1행만 (mind_garden 행 0).
--   (3) SELECT COUNT(*) FROM information_schema.ROUTINES
--         WHERE ROUTINE_SCHEMA='mind_garden'
--           AND ROUTINE_NAME LIKE 'OBSOLETE\_%\_20260614' ESCAPE '\\';
--       → 4 (4종 stub 잔존 확인 — 1주 모니터링 마커).
--   (4) D+1 00:01 / 00:03 / 00:05 KST 스케줄러 로그
--       → 'multiple signatures' / 'BadSqlGrammar' / 'MetaDataAccessException' 0건.
-- =============================================================================

-- ─── 사전 보장: H2 인메모리(MODE=MySQL) 테스트 환경 호환 ─────────────────
-- 운영 MySQL 에는 mind_garden 이 이미 존재 → IF NOT EXISTS NO-OP.
-- H2 통합 테스트에서는 스키마 부재 시 후속 DROP/CREATE 가 실패하므로 사전 보장.
CREATE SCHEMA IF NOT EXISTS mind_garden;

DELIMITER $$

-- ─────────────────────────────────────────────────────────────────────────
-- 1. UpdateDailyStatistics → OBSOLETE_UpdateDailyStatistics_20260614 stub
-- ─────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS mind_garden.OBSOLETE_UpdateDailyStatistics_20260614$$
CREATE PROCEDURE mind_garden.OBSOLETE_UpdateDailyStatistics_20260614()
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'OBSOLETE 20260614: mind_garden.UpdateDailyStatistics 사용 중지. SSOT 는 core_solution.UpdateDailyStatistics. 본 stub 는 1주 모니터링 후 V20260621_001 에서 완전 DROP 예정.';
END$$

DROP PROCEDURE IF EXISTS mind_garden.UpdateDailyStatistics$$

-- ─────────────────────────────────────────────────────────────────────────
-- 2. UpdateAllBranchDailyStatistics → OBSOLETE_..._20260614 stub
-- ─────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS mind_garden.OBSOLETE_UpdateAllBranchDailyStatistics_20260614$$
CREATE PROCEDURE mind_garden.OBSOLETE_UpdateAllBranchDailyStatistics_20260614()
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'OBSOLETE 20260614: mind_garden.UpdateAllBranchDailyStatistics 사용 중지. SSOT 는 core_solution.UpdateAllBranchDailyStatistics. 본 stub 는 1주 모니터링 후 V20260621_001 에서 완전 DROP 예정.';
END$$

DROP PROCEDURE IF EXISTS mind_garden.UpdateAllBranchDailyStatistics$$

-- ─────────────────────────────────────────────────────────────────────────
-- 3. UpdateConsultantPerformance → OBSOLETE_..._20260614 stub
-- ─────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS mind_garden.OBSOLETE_UpdateConsultantPerformance_20260614$$
CREATE PROCEDURE mind_garden.OBSOLETE_UpdateConsultantPerformance_20260614()
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'OBSOLETE 20260614: mind_garden.UpdateConsultantPerformance 사용 중지. SSOT 는 core_solution.UpdateConsultantPerformance. 본 stub 는 1주 모니터링 후 V20260621_001 에서 완전 DROP 예정.';
END$$

DROP PROCEDURE IF EXISTS mind_garden.UpdateConsultantPerformance$$

-- ─────────────────────────────────────────────────────────────────────────
-- 4. DailyPerformanceMonitoring → OBSOLETE_..._20260614 stub
-- ─────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS mind_garden.OBSOLETE_DailyPerformanceMonitoring_20260614$$
CREATE PROCEDURE mind_garden.OBSOLETE_DailyPerformanceMonitoring_20260614()
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'OBSOLETE 20260614: mind_garden.DailyPerformanceMonitoring 사용 중지. SSOT 는 core_solution.DailyPerformanceMonitoring. 본 stub 는 1주 모니터링 후 V20260621_001 에서 완전 DROP 예정.';
END$$

DROP PROCEDURE IF EXISTS mind_garden.DailyPerformanceMonitoring$$

DELIMITER ;
