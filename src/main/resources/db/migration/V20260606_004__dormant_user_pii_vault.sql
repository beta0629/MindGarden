-- =============================================================================
-- V20260606_004 — Phase 3: 휴면 사용자 PII vault + 사전 통지 추적
--
-- 입력 보고서: docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md v1.2 §10.9 (Q9)
--   - 1년 비활성 → DORMANT 전환 → 4년 안정 보관 → ANONYMIZED 전환
--   - 비의료 모드(NON_MEDICAL) default — 의료법 §22 미적용
--   - 사전 통지: ANONYMIZED 전환 30일 전 이메일/카톡 알림 (개인정보보호법 §29)
--   - Phase 5 mindgarden.lifecycle.cutoff.user-data-years: 1 정합
--
-- 본 마이그레이션은:
--   1. dormant_user_pii_vault 테이블 생성 — DORMANT 진입 시 PII AES-256-GCM 암호화 보관
--   2. anonymize_scheduled_at / pre_notice_sent_at 인덱스 — 배치 cron 가속화
--   3. (userId, tenantId) UNIQUE — 동일 사용자 중복 vault 방지 (멀티테넌트 격리 보장)
--   4. users.last_login_at + lifecycle_state 복합 인덱스 — 1년 비활성 후보 조회 가속화
--      (정책서 v1.2 §10.9 의 'last_active_at' 은 본 코드베이스에서 last_login_at 컬럼 매핑)
--
-- FK 정합:
--   - dormant_user_pii_vault.user_id → users(id) — FK 미생성 (운영 사용자 행 삭제 시점에
--     DELETE 카스케이드 대신 ANONYMIZE/HARD_DELETE 경로 SSOT 의 명시 정리 권장).
--     V20260605_001 / _002 와 동일한 컬럼-only 정책 (Phase 5 종료 후 FK 일괄 검토).
--
-- 운영 안전성:
--   - 운영 DORMANT 행 0건 — 신규 테이블 생성만 영향, 기존 데이터 변경 없음
--   - users.last_login_at 인덱스 추가만 — DDL 시간 (수만 행 미만 환경 < 1초)
--
-- 충돌 회피:
--   - V20260606_003 (PR #35 Phase 2-β) 점유 → 본 PR 은 V20260606_004 사용
--   - PR #35 머지 시 conflict-free
--
-- 위임 출처: core-planner v1.2 §10.9 + USER_LIFECYCLE_POLICY_V1_2_DECISION_REQUEST.
--
-- @author CoreSolution
-- @since 2026-06-06
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. dormant_user_pii_vault 테이블 — DORMANT 사용자 PII 안전 보관
-- -----------------------------------------------------------------------------
CREATE TABLE dormant_user_pii_vault (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'users.id 참조 (FK 미생성 — 운영 정리 SSOT 경로 명시)',
    tenant_id VARCHAR(50) NOT NULL COMMENT '멀티테넌트 격리 키',
    encrypted_pii JSON NOT NULL COMMENT 'AES-256-GCM {v,nonce,ciphertext,tag} JSON (mindgarden.lifecycle.dormant-pii-encryption-key)',
    dormant_entered_at TIMESTAMP NOT NULL COMMENT 'DORMANT 진입 시각 (4년 anonymize 카운트 기준)',
    anonymize_scheduled_at TIMESTAMP NOT NULL COMMENT '4년 후 익명화 예정 시각 (dormant_entered_at + INTERVAL 4 YEAR)',
    pre_notice_sent_at TIMESTAMP NULL COMMENT '30일 사전 통지 발송 시각 (NULL = 미발송)',
    pre_notice_channel VARCHAR(50) NULL COMMENT '발송 채널 — EMAIL / KAKAO / SMS',
    pre_notice_acknowledged_at TIMESTAMP NULL COMMENT '사용자 활성 복귀 인지 시각 (reactivate 시 NULL→stamp)',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_dormant_pii_user_tenant UNIQUE (user_id, tenant_id),
    INDEX idx_dormant_pii_anonymize_scheduled_at (anonymize_scheduled_at),
    INDEX idx_dormant_pii_pre_notice_sent_at (pre_notice_sent_at),
    INDEX idx_dormant_pii_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Phase 3 휴면 사용자 PII 안전 보관 (정책서 v1.2 §10.9)';

-- -----------------------------------------------------------------------------
-- 2. users 인덱스 — 1년 비활성 + lifecycle_state 복합 (DormantUserBatchService 가속화)
-- -----------------------------------------------------------------------------
-- 정책서 v1.2 §10.9 의 'last_active_at' 은 본 코드베이스의 users.last_login_at 컬럼 매핑.
-- (별도 last_active_at 컬럼 도입 시 후속 Phase 에서 마이그레이션 확장 검토.)
CREATE INDEX idx_users_last_login_lifecycle ON users (last_login_at, lifecycle_state);
