-- ===========================================================================
-- V20260606_007__admin_request_idempotency.sql
-- ---------------------------------------------------------------------------
-- ⚠️ 원본 버전: V20260528_007 (옵션 B v2.0 Path 1 P0 핫픽스)
-- ⚠️ rename 사유: dev/운영 MySQL flyway_schema_history MAX 버전이 이미
--                20260606.006 이라 20260528.007 은 out-of-order silently skip.
--                Flyway 9.22.3 + Spring Boot 3.x out-of-order 기본 동작.
-- ⚠️ 동일 사이트 선례: V20260510_005, V20260519_001, V20260526_001~003.
-- ⚠️ SQL 내용은 원본과 100% 동일 — out-of-order 회피 timestamp 리네이밍만.
-- ⚠️ 진단 보고서: docs/project-management/2026-05-28/OPTION_B_V2_DEV_CHECKOUT_FAILURE_DEBUG.md §3·§4 옵션 B.
-- ---------------------------------------------------------------------------
-- =============================================================================
-- Admin Request Idempotency — 옵션 B v2.0 멱등성 가드 SSOT 테이블
-- 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md §4·§6 Q11
-- 결함: debugger Agent fd1163c4 1차 보고 → AdminServiceImpl.runInNewTransaction
--       의 무조건 TenantContextHolder.clear() 가 confirmDeposit 단계에서
--       IllegalStateException → 401 응답으로 누출 + dev 매칭 #98 transactionId=109 부분 commit
--       사용자 재시도 시 회계 거래 중복 위험.
--
-- 본 테이블: 클라이언트 X-Request-Id 헤더 (Idempotency Key) 1건을 (tenant_id, request_id) 단위로
-- 저장해 5분 윈도우 내 동일 요청 재실행을 차단한다. UNIQUE 제약이 race-condition 을
-- 데이터 계층에서 보장하며, AdminServiceImpl.checkoutSameDayCard 진입 직전
-- AdminRequestIdempotencyService.reserve(...) 가 호출된다.
--
-- TTL: expires_at < NOW() 인 row 는 별도 cleanup 스케줄러로 hard delete (후속 PR — P0 범위 밖).
--
-- 운영 영향: 신규 테이블 1건만 추가 (기존 데이터 무변경). 멱등 패턴: CREATE TABLE IF NOT EXISTS.
-- 보존: V20260528_001~006 미변경 (본 슬롯 _007 사용).
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_request_idempotency (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id       VARCHAR(36)  NULL,
    request_id      VARCHAR(100) NOT NULL,
    operation       VARCHAR(64)  NOT NULL,
    mapping_id      BIGINT       NULL,
    result_status   VARCHAR(32)  NULL,
    expires_at      TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP    NULL,
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    version         BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_request_idempotency_tenant_request (tenant_id, request_id),
    KEY idx_admin_request_idempotency_created_at (created_at),
    KEY idx_admin_request_idempotency_operation_mapping (tenant_id, operation, mapping_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='어드민 멱등성 가드 (X-Request-Id) — 옵션 B v2.0 §4·§6 Q11';

-- TODO: TTL cleanup 스케줄러 — `DELETE FROM admin_request_idempotency WHERE expires_at < NOW()`.
--       본 마이그레이션 범위 외 (P0 → P1 후속 PR 분리).
