-- BW-4 커뮤니티 게시·댓글·좋아요·신고·검수(모더레이션) — Expo COMMUNITY_API·어드민 검수 큐 정합
-- @author MindGarden
-- @since 2026-05-15

CREATE TABLE IF NOT EXISTS community_posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    author_user_id BIGINT NOT NULL COMMENT '작성자 users.id',
    post_kind VARCHAR(32) NOT NULL COMMENT 'CLIENT_REVIEW | CONSULTANT_COLUMN',
    title VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    specialty VARCHAR(200) NULL COMMENT '상담사 칼럼 전문 분야(선택)',
    is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
    moderation_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | APPROVED | REJECTED',
    moderated_at DATETIME(6) NULL,
    moderated_by_user_id BIGINT NULL COMMENT '검수자 users.id',
    moderation_reason_code VARCHAR(64) NULL COMMENT '반려·승인 사유 코드(감사)',
    moderation_note VARCHAR(500) NULL COMMENT '운영자 메모(감사)',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_cp_tenant_status_created (tenant_id, moderation_status, created_at DESC),
    INDEX idx_cp_tenant_author (tenant_id, author_user_id),
    CONSTRAINT fk_cp_author FOREIGN KEY (author_user_id) REFERENCES users (id),
    CONSTRAINT fk_cp_moderator FOREIGN KEY (moderated_by_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='커뮤니티 게시글(검수 후 공개)';

CREATE TABLE IF NOT EXISTS community_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    post_id BIGINT NOT NULL,
    author_user_id BIGINT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_cc_tenant_post (tenant_id, post_id, created_at),
    CONSTRAINT fk_cc_post FOREIGN KEY (post_id) REFERENCES community_posts (id),
    CONSTRAINT fk_cc_author FOREIGN KEY (author_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='커뮤니티 댓글';

CREATE TABLE IF NOT EXISTS community_post_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_cpl_tenant_post_user (tenant_id, post_id, user_id),
    INDEX idx_cpl_post (tenant_id, post_id),
    CONSTRAINT fk_cpl_post FOREIGN KEY (post_id) REFERENCES community_posts (id),
    CONSTRAINT fk_cpl_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='게시글 좋아요(사용자당 1건)';

CREATE TABLE IF NOT EXISTS community_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    reporter_user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    comment_id BIGINT NULL,
    reason_code VARCHAR(64) NOT NULL,
    detail_message VARCHAR(1000) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_cr_tenant_post (tenant_id, post_id),
    CONSTRAINT fk_cr_reporter FOREIGN KEY (reporter_user_id) REFERENCES users (id),
    CONSTRAINT fk_cr_post FOREIGN KEY (post_id) REFERENCES community_posts (id),
    CONSTRAINT fk_cr_comment FOREIGN KEY (comment_id) REFERENCES community_comments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='게시글·댓글 신고';
