-- =============================================================================
-- Apple T2 — Guideline 1.2 UGC 안전장치: 신고 처리 큐 + 24h SLA
--   `community_reports` 테이블에 처리 상태·SLA·결과 액션 컬럼 추가
--
-- 정책 (디자이너 핸드오프 §8 + 오케스트레이션 §7 T2-Coder):
--   • status: OPEN | UNDER_REVIEW | RESOLVED | REJECTED (기본 OPEN)
--   • resolved_at / resolved_by_admin_id / resolution_action: 어드민 처리 감사
--   • priority: AUTO_QUARANTINE / NORMAL / HIGH (3건 누적 신고 자동 격리용)
--   • created_at 기준 24h SLA → 어드민 큐에서 매 분 갱신
--
-- 멱등성:
--   • INFORMATION_SCHEMA 가드 — 컬럼 미존재 시에만 ADD
--   • 기존 row 의 status 는 OPEN 으로 백필 (어드민 큐 진입 보장)
--
-- @author MindGarden
-- @since 2026-06-07
-- =============================================================================

SET @dbname = (SELECT DATABASE());

-- 1. status (PENDING/OPEN 처리 상태)
SET @add_status = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'community_reports'
         AND COLUMN_NAME  = 'status') = 0,
    'ALTER TABLE community_reports ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT ''OPEN'' COMMENT ''Apple T2 1.2: OPEN|UNDER_REVIEW|RESOLVED|REJECTED'' AFTER detail_message',
    'SELECT ''community_reports.status already present — no add'' AS info'
));
PREPARE st_status FROM @add_status;
EXECUTE st_status;
DEALLOCATE PREPARE st_status;

-- 2. priority (자동 격리/우선순위)
SET @add_priority = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'community_reports'
         AND COLUMN_NAME  = 'priority') = 0,
    'ALTER TABLE community_reports ADD COLUMN priority VARCHAR(32) NOT NULL DEFAULT ''NORMAL'' COMMENT ''Apple T2 1.2: NORMAL|HIGH|AUTO_QUARANTINE'' AFTER status',
    'SELECT ''community_reports.priority already present — no add'' AS info'
));
PREPARE st_priority FROM @add_priority;
EXECUTE st_priority;
DEALLOCATE PREPARE st_priority;

-- 3. resolved_at (처리 시각)
SET @add_resolved_at = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'community_reports'
         AND COLUMN_NAME  = 'resolved_at') = 0,
    'ALTER TABLE community_reports ADD COLUMN resolved_at DATETIME(6) NULL COMMENT ''Apple T2 1.2: 어드민 처리 시각''',
    'SELECT ''community_reports.resolved_at already present — no add'' AS info'
));
PREPARE st_ra FROM @add_resolved_at;
EXECUTE st_ra;
DEALLOCATE PREPARE st_ra;

-- 4. resolved_by_admin_id (처리자)
SET @add_resolved_by = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'community_reports'
         AND COLUMN_NAME  = 'resolved_by_admin_id') = 0,
    'ALTER TABLE community_reports ADD COLUMN resolved_by_admin_id BIGINT NULL COMMENT ''Apple T2 1.2: 처리한 관리자 users.id''',
    'SELECT ''community_reports.resolved_by_admin_id already present — no add'' AS info'
));
PREPARE st_rb FROM @add_resolved_by;
EXECUTE st_rb;
DEALLOCATE PREPARE st_rb;

-- 5. resolution_action (처리 액션)
SET @add_action = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'community_reports'
         AND COLUMN_NAME  = 'resolution_action') = 0,
    'ALTER TABLE community_reports ADD COLUMN resolution_action VARCHAR(64) NULL COMMENT ''Apple T2 1.2: HIDE_CONTENT|REJECT|SUSPEND_USER|BAN_USER''',
    'SELECT ''community_reports.resolution_action already present — no add'' AS info'
));
PREPARE st_act FROM @add_action;
EXECUTE st_act;
DEALLOCATE PREPARE st_act;

-- 6. 어드민 큐 조회 인덱스 (status + tenant + created_at)
SET @add_status_index = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'community_reports'
         AND INDEX_NAME   = 'idx_cr_tenant_status_created') = 0,
    'ALTER TABLE community_reports ADD INDEX idx_cr_tenant_status_created (tenant_id, status, created_at)',
    'SELECT ''idx_cr_tenant_status_created already present — no add'' AS info'
));
PREPARE st_idx FROM @add_status_index;
EXECUTE st_idx;
DEALLOCATE PREPARE st_idx;
