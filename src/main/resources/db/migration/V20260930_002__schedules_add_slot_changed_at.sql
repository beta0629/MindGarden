-- =============================================================================
-- schedules — 일자·시작 시각(슬롯) 변경 시각 상한 컬럼 추가 (#1324 후속)
--
-- 배경: V20260930_001 이전 예약 리마인드 발송 이력(target_slot_key = '')은 발송 당시 슬롯을
--   알 수 없어, 변경 이력이 없으면 updated_at 으로 판정했다. 메모·상태만 수정해도 updated_at 이
--   바뀌어 같은 일시에 리마인드가 한 번 더 나갈 수 있었다.
-- 변경: slot_changed_at 컬럼 추가. 애플리케이션(JPA @PreUpdate)이 일시 변경 시 수정 시각,
--   일시 외 수정 시 (값이 없을 때만) 직전 updated_at 으로 채운다. 일시 외 수정은 값을 늦추지 않는다.
--
-- 호환성:
--   - ADD COLUMN NULL — 기존 행은 NULL 그대로. 데이터 UPDATE/DELETE·백필 없음.
--   - NULL 이면 기존(#1324) 판정 그대로 동작. 롤백 코드(컬럼 미인지)도 영향 없음.
--   - 컬럼 위치 미지정(맨 뒤) — MySQL 8 INSTANT ADD COLUMN 대상.
-- 멱등 패턴: INFORMATION_SCHEMA 가드 (V20260930_001 동일). 재실행 NO-OP.
-- =============================================================================

SET @dbname = DATABASE();

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'schedules'
       AND COLUMN_NAME = 'slot_changed_at'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE schedules ADD COLUMN slot_changed_at DATETIME NULL COMMENT ''일자·시작 시각(슬롯) 마지막 변경 시각 상한. NULL 이면 추적 전''',
    'SELECT "slot_changed_at already exists"'
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;
