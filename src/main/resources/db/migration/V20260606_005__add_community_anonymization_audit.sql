-- =============================================================================
-- V20260606_005 — Phase 4: 커뮤니티 작성자 익명화 (옵션 b) + audit
--
-- 입력 보고서: docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md v1.2
--   §10.12 Q12 — 옵션 b 채택 (본문 유지 + 작성자만 익명화)
--   §11 법령 매트릭스 — 정보통신망법 §44의2 (게시물 책임)
--
-- 본 마이그레이션은:
--   1. community_anonymization_audit 테이블 신설
--      — 누가/언제/어떤 community 행이 익명화되었는지 추적
--      — body_hash 보관 (본문 자체는 보존, 변경 추적용)
--   2. community_posts / community_comments 에 author_anonymized 플래그 + 시각 컬럼 추가
--      — 옵션 b 핵심: 본문은 그대로 두고 작성자 표시만 "[삭제된 사용자]" 로 전환
--      — UI 표시 분기 SSOT
--
-- 기존 테이블 (V20260515_002 BW-4) 와 정합:
--   • community_posts.tenant_id VARCHAR(36) — audit 컬럼도 VARCHAR(36) 으로 정렬
--   • community_replies 테이블은 미존재 — 본 PR 에서는 처리 대상 외 (도입 시 후속 PR)
--
-- 충돌 평가:
--   • PR #35 (V20260606_003) — Phase 2-β
--   • PR #40 (V20260606_004) — Phase 3
--   • 본 PR 은 V20260606_005 채번 — conflict-free
--
-- 멱등성: 본 PR 의 anonymize 흐름은 community 행마다 (community_table, record_id) 단일 키로
--   audit 기록 1회만 수행. 멱등 보장은 application layer 의 author_anonymized=true 가드.
--
-- @author CoreSolution
-- @since 2026-06-06
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. community_anonymization_audit — 작성자 익명화 추적 (옵션 b 필수)
-- -----------------------------------------------------------------------------
CREATE TABLE community_anonymization_audit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID (community_posts.tenant_id 와 정합)',
    original_user_id BIGINT NOT NULL COMMENT '익명화 전 작성자 users.id',
    community_table VARCHAR(64) NOT NULL COMMENT 'community_posts | community_comments',
    record_id BIGINT NOT NULL COMMENT '해당 community 테이블의 PK',
    anonymized_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    anonymization_reason VARCHAR(64) NOT NULL COMMENT 'SELF_WITHDRAWAL | DELETED_BY_ADMIN | DORMANT_AUTO_4Y | ADMIN_FORCED',
    body_hash CHAR(64) NOT NULL COMMENT '본문 SHA-256 (변경 추적용, 본문 자체는 옵션 b 로 보존)',
    actor_user_id BIGINT NULL COMMENT '익명화 수행 actor users.id — SYSTEM batch 면 NULL',
    actor_role VARCHAR(32) NULL COMMENT 'SYSTEM | ADMIN | CLIENT (자발 본인 익명화 시)',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_caa_tenant (tenant_id),
    INDEX idx_caa_original_user (original_user_id),
    INDEX idx_caa_anonymized_at (anonymized_at),
    INDEX idx_caa_record (community_table, record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Phase 4 커뮤니티 작성자 익명화 audit (옵션 b — 본문 유지 + 작성자만 익명)';

-- -----------------------------------------------------------------------------
-- 2. community_posts / community_comments 에 작성자 익명화 플래그 추가
-- -----------------------------------------------------------------------------
ALTER TABLE community_posts
    ADD COLUMN author_anonymized TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '작성자 익명화 여부 (옵션 b — true 면 UI 에 [삭제된 사용자] 표시)';

ALTER TABLE community_posts
    ADD COLUMN author_anonymized_at DATETIME(6) NULL
        COMMENT '작성자 익명화 시각 (audit 보조 — NULL = 미익명)';

ALTER TABLE community_comments
    ADD COLUMN author_anonymized TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '작성자 익명화 여부 (옵션 b — true 면 UI 에 [삭제된 사용자] 표시)';

ALTER TABLE community_comments
    ADD COLUMN author_anonymized_at DATETIME(6) NULL
        COMMENT '작성자 익명화 시각 (audit 보조 — NULL = 미익명)';
