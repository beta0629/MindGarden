-- =============================================================================
-- V20260605_002 — 자발 탈퇴 30일 유예 (Q3 결정)
-- Phase 2-α: WITHDRAWAL_PENDING 상태의 유예 만료 시각 기록
--
-- 입력 보고서: docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md (v1.1)
--   §2.3 #4 — 자발 탈퇴 30일 유예
--   §10 Q3 결정 = 30일
--   §6.2 — WITHDRAWAL_PENDING 30일 경과 후 자동 ANONYMIZED 전이
--
-- 본 마이그레이션은:
--   1. users 테이블에 withdrawal_requested_at TIMESTAMP NULL 컬럼 추가
--   2. WITHDRAWAL_PENDING 진입 시각 stamp — 30일 유예 만료 cron 의 기준점
--   3. 인덱스 idx_users_withdrawal_pending (lifecycle_state, withdrawal_requested_at)
--      — WithdrawalGracePeriodScheduler 의 30일 만료 검색 가속화
--
-- 운영 안전성:
--   - 운영 users 행 28건 모두 WITHDRAWAL_PENDING 상태 0건 → 영향 행 = 0
--   - NULL 허용 — 기존 행 영향 없음
--
-- FK 정합: 컬럼만 추가. FK 신설 없음.
--
-- 위임 출처: core-planner v1.1 합의서 §11.3 Phase 2-α + 사용자 결정 "B 일괄" 채택.
--
-- @author CoreSolution
-- @since 2026-06-05
-- =============================================================================

ALTER TABLE users
    ADD COLUMN withdrawal_requested_at TIMESTAMP NULL
    COMMENT 'WITHDRAWAL_PENDING 진입 시각 — 30일 유예 만료 검색용 (Q3 결정)';

CREATE INDEX idx_users_withdrawal_pending
    ON users (lifecycle_state, withdrawal_requested_at);
