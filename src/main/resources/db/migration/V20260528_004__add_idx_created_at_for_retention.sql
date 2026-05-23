-- =============================================================================
-- retention DELETE 성능 + 시간 범위 조회 인덱스 (멱등 마이그레이션)
-- 기획: NotificationLogRetentionScheduler — 매일 03:30 KST `DELETE … WHERE created_at < cutoff LIMIT N`
--   대상 테이블 2건의 `created_at` 인덱스가 부재하면 대용량 누적 시 DELETE 가 풀스캔.
-- 인벤토리(2026-05-23):
--   admin_test_notification_logs   — idx_atnl_sent_at / idx_atnl_tenant / idx_atnl_tenant_user_sent
--                                   / idx_atnl_tenant_user_success / idx_atnl_sent_by_user / idx_atnl_tenant_batch
--                                   → idx_atnl_created_at 부재 → 추가
--   notification_batch_send_log    — uq_nbsl_dispatch_idempotency / idx_nbsl_tenant_sent / idx_nbsl_tenant_template
--                                   → idx_nbsl_created_at 부재 → 추가
-- 멱등 패턴: INFORMATION_SCHEMA.STATISTICS 가드 (V20260526_003 / V20260527_001 동일 패턴)
-- 명명 규칙: idx_<table_alias>_<column> — alias atnl / nbsl
-- 운영 영향: 인덱스 추가 ALTER TABLE 만 (코드 변경 0). 재실행 NO-OP.
-- =============================================================================

SET @dbname = DATABASE();

-- ── admin_test_notification_logs ────────────────────────────────────────────
SET @tablename = 'admin_test_notification_logs';
SET @indexname = 'idx_atnl_created_at';
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = @tablename
       AND INDEX_NAME = @indexname
);
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE admin_test_notification_logs ADD INDEX idx_atnl_created_at (created_at)',
    'SELECT "idx_atnl_created_at already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── notification_batch_send_log ─────────────────────────────────────────────
SET @tablename2 = 'notification_batch_send_log';
SET @indexname2 = 'idx_nbsl_created_at';
SET @idx_exists2 = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = @tablename2
       AND INDEX_NAME = @indexname2
);
SET @sql2 = IF(@idx_exists2 = 0,
    'ALTER TABLE notification_batch_send_log ADD INDEX idx_nbsl_created_at (created_at)',
    'SELECT "idx_nbsl_created_at already exists"'
);
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;
