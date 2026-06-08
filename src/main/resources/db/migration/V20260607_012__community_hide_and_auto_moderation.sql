-- =============================================================================
-- Apple T2 — Guideline 1.2 UGC 안전장치: 콘텐츠 숨김 + 자동 모더레이션
--   `community_posts` / `community_comments` 양쪽에 동일 컬럼 추가
--
-- 정책 (오케스트레이션 §7 T2-Coder + 디자이너 §11 자동 필터):
--   • hidden_at / hidden_by_user_id / hidden_reason: 어드민 또는 자동 격리에 의한 숨김
--   • auto_moderated (TINYINT): 자동 필터(금칙어) 매칭 여부
--   • auto_moderated_reason_code: 어떤 필터가 작동했는지 (PROFANITY|SPAM|...)
--
-- 조회 영향:
--   • 사용자 피드: WHERE hidden_at IS NULL 필터
--   • 어드민 큐: 어드민은 모든 상태(숨김 포함) 조회 가능
--
-- 멱등성:
--   • INFORMATION_SCHEMA 가드 — 컬럼 미존재 시에만 ADD
--   • 신규 컬럼 모두 NULL 또는 DEFAULT (회귀 0)
--
-- @author MindGarden
-- @since 2026-06-07
-- =============================================================================

SET @dbname = (SELECT DATABASE());

-- ----------------------------------------------------------------------------
-- community_posts
-- ----------------------------------------------------------------------------

-- 1. hidden_at
SET @cp_hidden_at = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_posts'
         AND COLUMN_NAME = 'hidden_at') = 0,
    'ALTER TABLE community_posts ADD COLUMN hidden_at DATETIME(6) NULL COMMENT ''Apple T2 1.2: 콘텐츠 숨김 시각''',
    'SELECT ''community_posts.hidden_at already present — no add'' AS info'
));
PREPARE st_cph FROM @cp_hidden_at;
EXECUTE st_cph;
DEALLOCATE PREPARE st_cph;

-- 2. hidden_by_user_id
SET @cp_hidden_by = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_posts'
         AND COLUMN_NAME = 'hidden_by_user_id') = 0,
    'ALTER TABLE community_posts ADD COLUMN hidden_by_user_id BIGINT NULL COMMENT ''Apple T2 1.2: 숨김 처리자 users.id''',
    'SELECT ''community_posts.hidden_by_user_id already present — no add'' AS info'
));
PREPARE st_cphb FROM @cp_hidden_by;
EXECUTE st_cphb;
DEALLOCATE PREPARE st_cphb;

-- 3. hidden_reason
SET @cp_hidden_reason = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_posts'
         AND COLUMN_NAME = 'hidden_reason') = 0,
    'ALTER TABLE community_posts ADD COLUMN hidden_reason VARCHAR(200) NULL COMMENT ''Apple T2 1.2: 숨김 사유 메모''',
    'SELECT ''community_posts.hidden_reason already present — no add'' AS info'
));
PREPARE st_cphr FROM @cp_hidden_reason;
EXECUTE st_cphr;
DEALLOCATE PREPARE st_cphr;

-- 4. auto_moderated
SET @cp_auto_mod = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_posts'
         AND COLUMN_NAME = 'auto_moderated') = 0,
    'ALTER TABLE community_posts ADD COLUMN auto_moderated TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Apple T2 1.2: 자동 필터 매칭 여부''',
    'SELECT ''community_posts.auto_moderated already present — no add'' AS info'
));
PREPARE st_cpam FROM @cp_auto_mod;
EXECUTE st_cpam;
DEALLOCATE PREPARE st_cpam;

-- 5. auto_moderated_reason_code
SET @cp_auto_reason = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_posts'
         AND COLUMN_NAME = 'auto_moderated_reason_code') = 0,
    'ALTER TABLE community_posts ADD COLUMN auto_moderated_reason_code VARCHAR(64) NULL COMMENT ''Apple T2 1.2: 자동 필터 코드 (PROFANITY|SEXUAL|VIOLENCE)''',
    'SELECT ''community_posts.auto_moderated_reason_code already present — no add'' AS info'
));
PREPARE st_cpar FROM @cp_auto_reason;
EXECUTE st_cpar;
DEALLOCATE PREPARE st_cpar;

-- 6. 인덱스 (hidden + moderation 조회 최적화)
SET @cp_hide_index = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_posts'
         AND INDEX_NAME = 'idx_cp_tenant_hidden_created') = 0,
    'ALTER TABLE community_posts ADD INDEX idx_cp_tenant_hidden_created (tenant_id, hidden_at, created_at)',
    'SELECT ''idx_cp_tenant_hidden_created already present — no add'' AS info'
));
PREPARE st_cphi FROM @cp_hide_index;
EXECUTE st_cphi;
DEALLOCATE PREPARE st_cphi;

-- ----------------------------------------------------------------------------
-- community_comments
-- ----------------------------------------------------------------------------

-- 7. comments.hidden_at
SET @cc_hidden_at = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_comments'
         AND COLUMN_NAME = 'hidden_at') = 0,
    'ALTER TABLE community_comments ADD COLUMN hidden_at DATETIME(6) NULL COMMENT ''Apple T2 1.2: 댓글 숨김 시각''',
    'SELECT ''community_comments.hidden_at already present — no add'' AS info'
));
PREPARE st_cch FROM @cc_hidden_at;
EXECUTE st_cch;
DEALLOCATE PREPARE st_cch;

-- 8. comments.hidden_by_user_id
SET @cc_hidden_by = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_comments'
         AND COLUMN_NAME = 'hidden_by_user_id') = 0,
    'ALTER TABLE community_comments ADD COLUMN hidden_by_user_id BIGINT NULL COMMENT ''Apple T2 1.2: 댓글 숨김 처리자''',
    'SELECT ''community_comments.hidden_by_user_id already present — no add'' AS info'
));
PREPARE st_cchb FROM @cc_hidden_by;
EXECUTE st_cchb;
DEALLOCATE PREPARE st_cchb;

-- 9. comments.hidden_reason
SET @cc_hidden_reason = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_comments'
         AND COLUMN_NAME = 'hidden_reason') = 0,
    'ALTER TABLE community_comments ADD COLUMN hidden_reason VARCHAR(200) NULL COMMENT ''Apple T2 1.2: 댓글 숨김 사유''',
    'SELECT ''community_comments.hidden_reason already present — no add'' AS info'
));
PREPARE st_cchr FROM @cc_hidden_reason;
EXECUTE st_cchr;
DEALLOCATE PREPARE st_cchr;

-- 10. comments.auto_moderated
SET @cc_auto_mod = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_comments'
         AND COLUMN_NAME = 'auto_moderated') = 0,
    'ALTER TABLE community_comments ADD COLUMN auto_moderated TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Apple T2 1.2: 댓글 자동 필터 매칭''',
    'SELECT ''community_comments.auto_moderated already present — no add'' AS info'
));
PREPARE st_ccam FROM @cc_auto_mod;
EXECUTE st_ccam;
DEALLOCATE PREPARE st_ccam;

-- 11. comments.auto_moderated_reason_code
SET @cc_auto_reason = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_comments'
         AND COLUMN_NAME = 'auto_moderated_reason_code') = 0,
    'ALTER TABLE community_comments ADD COLUMN auto_moderated_reason_code VARCHAR(64) NULL COMMENT ''Apple T2 1.2: 댓글 자동 필터 코드''',
    'SELECT ''community_comments.auto_moderated_reason_code already present — no add'' AS info'
));
PREPARE st_ccar FROM @cc_auto_reason;
EXECUTE st_ccar;
DEALLOCATE PREPARE st_ccar;

-- 12. comments index (hidden filter)
SET @cc_hide_index = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'community_comments'
         AND INDEX_NAME = 'idx_cc_tenant_hidden') = 0,
    'ALTER TABLE community_comments ADD INDEX idx_cc_tenant_hidden (tenant_id, hidden_at, post_id)',
    'SELECT ''idx_cc_tenant_hidden already present — no add'' AS info'
));
PREPARE st_cchi FROM @cc_hide_index;
EXECUTE st_cchi;
DEALLOCATE PREPARE st_cchi;
