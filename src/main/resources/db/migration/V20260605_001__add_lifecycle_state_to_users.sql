-- =============================================================================
-- V20260605_001 — 회원 lifecycle 통합 정책 (USER_LIFECYCLE_TERMINATION_POLICY)
-- Phase 1: lifecycle_state SSOT 마이그레이션 (Q1 결정)
--
-- 입력 보고서: docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md (v1.1)
--   §3.6 SSOT 통일 — `lifecycle_state` 단일 컬럼
--   §10 Q1 결정 = 단일 enum 채택 확정
--   §11.3 Phase 1 입력 사양
--
-- 본 마이그레이션은:
--   1. users 테이블에 lifecycle_state ENUM 컬럼 추가 (NOT NULL DEFAULT 'ACTIVE')
--   2. 기존 데이터 1회 매핑 cron (운영 0행 안전 — §0.2 골든 윈도우)
--      - is_deleted=TRUE                       → ANONYMIZED
--      - is_active=FALSE AND is_deleted=FALSE  → SUSPENDED
--      - 그 외                                 → ACTIVE (DEFAULT)
--   3. 인덱스 idx_users_lifecycle_state (tenant_id, lifecycle_state) 추가
--
-- ⚠ is_active / is_deleted / deleted_at 컬럼은 본 마이그레이션에서 DROP 하지 않는다.
--    @Deprecated stamp 만 entity 측에서 부여하고, Phase 5 종료 후 별도 마이그레이션으로 제거.
--    (점진적 마이그레이션 — backward compat 보존)
--
-- 운영 안전성:
--   - 운영 users 행 28건 모두 is_deleted=FALSE / is_active=TRUE → 매핑 cron 영향 행 = 0
--   - DEFAULT 'ACTIVE' 로 컬럼 추가만 하면 모든 기존 행이 정상 ACTIVE 로 진입
--   - SELECT COUNT(*) FROM users WHERE lifecycle_state IS NULL; 운영 적용 후 0 이어야 함
--   - 매핑 UPDATE 의 영향 행 수도 0 (골든 윈도우 — §0.2)
--
-- FK 정합: 본 마이그레이션은 컬럼·인덱스만 추가. FK 신설 없음 (ENUM 컬럼은 자체 무결성).
--
-- 위임 출처: core-planner v1.1 합의서 §11.3 Phase 1 + 사용자 결정 "B (Phase 1 + 2-α 일괄)" 채택.
--
-- @author CoreSolution
-- @since 2026-06-05
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. lifecycle_state ENUM 컬럼 추가
-- -----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN lifecycle_state VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
    COMMENT 'SSOT 회원 lifecycle 단계 — ACTIVE / SUSPENDED / WITHDRAWAL_PENDING / DORMANT / ANONYMIZED / DELETED_BY_ADMIN / HARD_DELETED (USER_LIFECYCLE_TERMINATION_POLICY §3.6)';

-- -----------------------------------------------------------------------------
-- 2. 기존 데이터 매핑 (운영 0행 안전 윈도우 — §0.2 골든 윈도우)
-- -----------------------------------------------------------------------------
-- is_deleted=TRUE → ANONYMIZED (운영 0건 — 안전)
UPDATE users
   SET lifecycle_state = 'ANONYMIZED'
 WHERE is_deleted = TRUE;

-- is_active=FALSE AND is_deleted=FALSE → SUSPENDED (운영 0건 — 안전)
UPDATE users
   SET lifecycle_state = 'SUSPENDED'
 WHERE is_active = FALSE
   AND is_deleted = FALSE;

-- 그 외는 DEFAULT 'ACTIVE' 로 자동 진입 (별도 UPDATE 불필요)

-- -----------------------------------------------------------------------------
-- 3. 인덱스 추가 — 테넌트별 lifecycle 단계 조회 + 30일 유예 cron 인덱스
-- -----------------------------------------------------------------------------
CREATE INDEX idx_users_lifecycle_state ON users (tenant_id, lifecycle_state);
