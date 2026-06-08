-- =============================================================================
-- Apple T2 — Guideline 1.2 UGC 안전장치: 사용자 차단 테이블
--   `community_user_blocks` — 사용자 ↔ 사용자 단방향 차단 관계
--
-- 정책 (디자이너 핸드오프 §5.3):
--   • A 가 B 차단 → A 의 피드/댓글 목록에서 B 작성물 비노출 (단방향)
--   • B 의 피드는 영향 없음 (B 는 차단 사실 모름)
--   • 멀티테넌트 격리: tenant_id + blocker_id + blocked_id UNIQUE
--   • 차단 사유 메모 옵션(어드민 통계용)
--
-- @author MindGarden
-- @since 2026-06-07
-- =============================================================================

CREATE TABLE IF NOT EXISTS community_user_blocks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    blocker_user_id BIGINT NOT NULL COMMENT '차단을 한 사용자 users.id',
    blocked_user_id BIGINT NOT NULL COMMENT '차단당한 사용자 users.id',
    reason VARCHAR(500) NULL COMMENT '차단 사유 메모(선택, 통계용)',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_cub_tenant_blocker_blocked (tenant_id, blocker_user_id, blocked_user_id),
    INDEX idx_cub_tenant_blocker (tenant_id, blocker_user_id, is_deleted),
    INDEX idx_cub_tenant_blocked (tenant_id, blocked_user_id, is_deleted),
    CONSTRAINT fk_cub_blocker FOREIGN KEY (blocker_user_id) REFERENCES users (id),
    CONSTRAINT fk_cub_blocked FOREIGN KEY (blocked_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Apple T2 1.2 UGC — 커뮤니티 사용자 차단 (단방향)';
