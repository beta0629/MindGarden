-- 일정당 활성 상담일지 1건 — DB 유니크 (회기권 consultation_records · 타기관 institution_link_consultation_logs)
--
-- 활성 행(is_deleted = 0)만 일정 ID 를 갖는 가상 생성 컬럼을 추가하고 (tenant_id, 그 컬럼) 유니크 인덱스를 건다.
-- 삭제 행은 NULL 이라 여러 건이어도 제약에 걸리지 않는다.
--
-- 안전 장치:
--   - 데이터 UPDATE/DELETE 없음. 가상 컬럼이라 기존 행 값을 쓰지 않는다.
--   - 기존 중복(같은 테넌트·같은 일정의 활성 행 2건 이상)이 1건이라도 있으면 해당 테이블의 유니크 인덱스는
--     만들지 않고 넘어간다(마이그레이션 실패 금지). 중복 건수는 읽기 전용 COUNT 워크플로로 보고한다.
--     인덱스는 정리 후 별도 마이그레이션으로 다시 시도한다.
--   - 컬럼·인덱스 존재 여부를 information_schema 로 확인하므로 재실행해도 안전하다.
--
-- @author CoreSolution
-- @since 2026-10-04

SET @db := DATABASE();

-- 1) consultation_records.active_schedule_id
SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'consultation_records' AND COLUMN_NAME = 'active_schedule_id') = 0,
    'ALTER TABLE consultation_records ADD COLUMN active_schedule_id BIGINT GENERATED ALWAYS AS (CASE WHEN is_deleted = 0 THEN consultation_id ELSE NULL END) VIRTUAL COMMENT ''활성 일지만 일정 ID (일정당 1건 유니크용)''',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;

SET @cr_dup := (
    SELECT COUNT(*) FROM (
        SELECT tenant_id, consultation_id
        FROM consultation_records
        WHERE is_deleted = 0 AND consultation_id IS NOT NULL
        GROUP BY tenant_id, consultation_id
        HAVING COUNT(*) > 1
    ) dup_cr
);
SET @cr_idx := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'consultation_records'
      AND INDEX_NAME = 'uk_consultation_records_active_schedule'
);
SELECT IF(
    @cr_dup = 0 AND @cr_idx = 0,
    'ALTER TABLE consultation_records ADD UNIQUE INDEX uk_consultation_records_active_schedule (tenant_id, active_schedule_id)',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;

-- 2) institution_link_consultation_logs.active_schedule_id (schedule_id NULL 인 계약 단위 일지는 제약 밖)
SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'institution_link_consultation_logs'
       AND COLUMN_NAME = 'active_schedule_id') = 0,
    'ALTER TABLE institution_link_consultation_logs ADD COLUMN active_schedule_id BIGINT GENERATED ALWAYS AS (CASE WHEN is_deleted = 0 THEN schedule_id ELSE NULL END) VIRTUAL COMMENT ''활성 일지만 일정 ID (일정당 1건 유니크용)''',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;

SET @il_dup := (
    SELECT COUNT(*) FROM (
        SELECT tenant_id, schedule_id
        FROM institution_link_consultation_logs
        WHERE is_deleted = 0 AND schedule_id IS NOT NULL
        GROUP BY tenant_id, schedule_id
        HAVING COUNT(*) > 1
    ) dup_il
);
SET @il_idx := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'institution_link_consultation_logs'
      AND INDEX_NAME = 'uk_ilcl_active_schedule'
);
SELECT IF(
    @il_dup = 0 AND @il_idx = 0,
    'ALTER TABLE institution_link_consultation_logs ADD UNIQUE INDEX uk_ilcl_active_schedule (tenant_id, active_schedule_id)',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;
