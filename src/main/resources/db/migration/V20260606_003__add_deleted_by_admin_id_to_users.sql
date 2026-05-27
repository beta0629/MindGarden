-- =============================================================================
-- V20260606_003 — Phase 2-β 어드민 강제 종료 (USER_LIFECYCLE_TERMINATION_POLICY)
-- (hotfix: PR #33 의 V20260606_002__add_withdrawal_options_to_users.sql 슬롯 충돌로 _002 → _003 rename)
--
-- 입력 보고서: docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md (v1.1)
--   §0.1 Q5 결정 = 어드민 강제 종료 7일 보존 윈도우 + 어드민 "되돌리기"
--   §2 흐름 표 — 트리거: AdminServiceImpl.deleteClient/deleteConsultant
--   §8 감사 — actor_id=admin_user_id, reason 필수
--
-- 본 마이그레이션은:
--   1. users 테이블에 deleted_by_admin_id BIGINT NULL 컬럼 추가
--      - DELETED_BY_ADMIN 진입 시 강제 종료를 수행한 어드민 user.id 기록 (조회용)
--      - NULL 허용 — 자발 탈퇴/자동 cron 진입 행은 비워둠
--   2. FK NO ACTION + INDEX 추가 — 운영 56/57 FK NO ACTION 정합
--
-- 운영 안전성:
--   - 추가 컬럼 + 기본값 NULL → 기존 행 전수 영향 없음
--   - V20260605_001 의 lifecycle_state 컬럼과 동기 진행 가능 (Phase 1 + 2-β 분리)
--
-- 위임 출처: core-planner v1.1 합의서 + 사용자 결정 Q5.
--
-- @author CoreSolution
-- @since 2026-06-06
-- =============================================================================

ALTER TABLE users
    ADD COLUMN deleted_by_admin_id BIGINT NULL
    COMMENT '어드민 강제 종료(DELETED_BY_ADMIN) 시점에 강제 종료를 수행한 어드민 users.id — 7일 보존 윈도우 조회 + audit 보강 (USER_LIFECYCLE_TERMINATION_POLICY §0.1 Q5)';

ALTER TABLE users
    ADD CONSTRAINT fk_users_deleted_by_admin
        FOREIGN KEY (deleted_by_admin_id) REFERENCES users (id);

CREATE INDEX idx_users_deleted_by_admin
    ON users (deleted_by_admin_id);

-- DELETED_BY_ADMIN + deleted_at 보존 윈도우 cron 인덱스
-- (lifecycle_state 인덱스는 V20260605_001 에서 (tenant_id, lifecycle_state) 으로 이미 존재)
CREATE INDEX idx_users_deleted_admin_window
    ON users (lifecycle_state, deleted_at);
