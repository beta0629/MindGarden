-- =============================================================================
-- V20260609_003__phone_otp_attempts_oauth_provider_index.sql
-- OAuth 휴대폰 매칭(OTP) provider-agnostic 일반화에 따른 인덱스 보강.
--
-- 배경
-- - Apple SIWA P1 (PR #158/#161) 에서 phone_otp_attempts 테이블을 도입.
--   provider, provider_user_id, phone_hash, status 등 컬럼은 이미 존재한다.
-- - 본 PR 에서 동일 인프라를 Apple/Google/Kakao/Naver 4 종 provider 에 일반화한다
--   (docs/project-management/2026-06-09/OAUTH_PHONE_SSOT_OTP_UNIFICATION_HANDOFF.md).
-- - provider 별 (provider, phone_hash, created_at) 조회 빈도가 높아질 것으로 예상되므로
--   해당 컬럼 조합 인덱스를 추가해 멀티 provider 동시 트래픽 시 풀스캔 회귀를 차단한다.
--
-- 컬럼 추가는 하지 않는다 (provider 컬럼 재사용)
-- - 기존 PhoneOtpAttempt.provider VARCHAR(32) 가 이미 provider 격리 역할을 수행.
--   OAuthProvider.name() 결과(APPLE/GOOGLE/KAKAO/NAVER) 를 그대로 저장한다.
-- - 중복 컬럼(oauth_provider) 추가 시 동기화 부담·이중 진실 위험으로 의도적으로 제외.
--
-- 회귀 위험
-- - CREATE INDEX IF NOT EXISTS 동등 패턴(존재 여부 검사 후 동적 SQL) 으로 멱등 처리.
-- - 기존 인덱스(idx_phone_otp_attempts_provider_user) 와 컬럼 순서가 달라 별도 인덱스.
--
-- 참조
-- - docs/project-management/2026-06-09/OAUTH_PHONE_SSOT_OTP_UNIFICATION_HANDOFF.md §4.1
-- - src/main/java/com/coresolution/consultation/entity/auth/PhoneOtpAttempt.java
-- =============================================================================

SET @index_exists := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'phone_otp_attempts'
      AND INDEX_NAME = 'idx_phone_otp_attempts_provider_phone_hash'
);

SET @stmt := IF(
    @index_exists = 0,
    'CREATE INDEX idx_phone_otp_attempts_provider_phone_hash ON phone_otp_attempts (provider, phone_hash, created_at)',
    'DO 0'
);

PREPARE create_index_stmt FROM @stmt;
EXECUTE create_index_stmt;
DEALLOCATE PREPARE create_index_stmt;
