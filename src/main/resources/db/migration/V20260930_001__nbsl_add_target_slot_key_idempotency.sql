-- =============================================================================
-- notification_batch_send_log — 예약 리마인드(D-2/D-1) 멱등 키에 일정 시작 일시(슬롯) 추가
--
-- 배경: 기존 UNIQUE (tenant_id, template_code, target_type, target_id, recipient_user_id) 는
--   스케줄 ID 단위 "평생 1회" 키라, 일정 일시가 바뀌어도 새 일시의 D-2/D-1 리마인드가
--   SKIPPED_DUPLICATE 로 차단되었다. (기존 우회: 슬롯 변경 시 발송 이력 물리 삭제)
-- 변경: target_slot_key 컬럼 추가(예약 리마인드만 'yyyy-MM-ddTHH:mm', 그 외 '') 후
--   UNIQUE 를 6튜플 (… , target_slot_key) 로 교체한다. 동일 슬롯 1통 멱등은 유지된다.
--
-- 호환성:
--   - ADD COLUMN NOT NULL DEFAULT '' — 기존 행은 기본값만 가지며 데이터 UPDATE/DELETE 없음.
--   - 신규 UNIQUE 는 기존 UNIQUE 의 상위집합 키 → 기존 데이터로 위반 불가.
--   - 롤백 코드(컬럼 미인지)는 '' 로 INSERT → 기존과 동일한 멱등 동작.
--   - 모든 키에 tenant_id 포함(테넌트 격리 유지).
-- 멱등 패턴: INFORMATION_SCHEMA 가드 (V20260527_001 / V20260528_004 동일). 재실행 NO-OP.
-- =============================================================================

SET @dbname = DATABASE();

-- 1) target_slot_key 컬럼 추가
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'notification_batch_send_log'
       AND COLUMN_NAME = 'target_slot_key'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE notification_batch_send_log ADD COLUMN target_slot_key VARCHAR(32) NOT NULL DEFAULT '''' COMMENT ''예약 리마인드 멱등 슬롯(일정 시작 일시 yyyy-MM-ddTHH:mm). 그 외 템플릿은 빈 문자열'' AFTER recipient_user_id',
    'SELECT "target_slot_key already exists"'
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

-- 2) 슬롯 포함 6튜플 UNIQUE 추가 (기존 UNIQUE 제거 전에 먼저 생성 — 멱등 공백 없음)
SET @uq_slot_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'notification_batch_send_log'
       AND INDEX_NAME = 'uq_nbsl_dispatch_idempotency_slot'
);
SET @uq_slot_sql = IF(@uq_slot_exists = 0,
    'ALTER TABLE notification_batch_send_log ADD UNIQUE KEY uq_nbsl_dispatch_idempotency_slot (tenant_id, template_code, target_type, target_id, recipient_user_id, target_slot_key)',
    'SELECT "uq_nbsl_dispatch_idempotency_slot already exists"'
);
PREPARE stmt_uq_slot FROM @uq_slot_sql; EXECUTE stmt_uq_slot; DEALLOCATE PREPARE stmt_uq_slot;

-- 3) 기존 5튜플 UNIQUE 제거 (신규 UNIQUE 존재 확인 후에만)
SET @uq_old_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'notification_batch_send_log'
       AND INDEX_NAME = 'uq_nbsl_dispatch_idempotency'
);
SET @uq_slot_ready = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'notification_batch_send_log'
       AND INDEX_NAME = 'uq_nbsl_dispatch_idempotency_slot'
);
SET @uq_old_sql = IF(@uq_old_exists > 0 AND @uq_slot_ready > 0,
    'ALTER TABLE notification_batch_send_log DROP INDEX uq_nbsl_dispatch_idempotency',
    'SELECT "uq_nbsl_dispatch_idempotency already dropped or slot unique missing"'
);
PREPARE stmt_uq_old FROM @uq_old_sql; EXECUTE stmt_uq_old; DEALLOCATE PREPARE stmt_uq_old;
