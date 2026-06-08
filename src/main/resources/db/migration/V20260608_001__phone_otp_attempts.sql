-- =============================================================================
-- V20260608_001 — Apple SIWA 휴대폰 매칭 흐름용 OTP 시도 추적 테이블
--
-- 배경:
--   사용자 결정 — Apple SIWA 분기 재정렬: 이메일 매칭 제거 → 휴대폰 번호가 SSOT.
--   1) apple_sub 매칭 → 즉시 로그인 (기존 동일)
--   2) 매칭 없음 → phoneVerificationToken 발급 + 휴대폰 입력 단계 진입
--   3) Apple 전용 OTP send/verify endpoint 로 휴대폰 인증 → phone 매칭 / 신규 가입
--
-- 본 테이블은:
--   - OTP 코드의 bcrypt 해시 보관 (평문 저장 금지)
--   - 시도 횟수(attempts) 추적 → 5회 초과 시 row 무효화
--   - 일일 발송 한도(daily_count) 추적 → 일 5회 한도
--   - 재발송 1분 쿨다운 — created_at 기준
--   - 실시간 검색 인덱스 (tenant_id, phone_hash, status), expires_at 청소용
--
-- 정책:
--   - D2: JWT phoneVerificationToken + DB 시도카운터 테이블 조합
--   - D3: 재발송 쿨다운 1분 / 일 5회 / 검증 시도 5회
--
-- 운영 안전성:
--   - 신규 테이블 생성만 — 기존 데이터 변경 없음
--   - 멀티테넌트: tenant_id 컬럼 필수 (NOT NULL) + 인덱스 첫 키
--   - 자동 만료: expires_at 인덱스로 daily 청소 cron 가속화
--   - 재실행 안전: CREATE TABLE IF NOT EXISTS
--
-- 참고 문서:
--   - docs/project-management/2026-04-23/PHONE_VERIFICATION_POLICY.md (휴대폰 인증 정책 초안)
--   - docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md (위임 순서)
--
-- =============================================================================

CREATE TABLE IF NOT EXISTS phone_otp_attempts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(64) NOT NULL COMMENT '테넌트 ID — 멀티테넌트 격리',
    provider VARCHAR(32) NOT NULL DEFAULT 'APPLE'
        COMMENT 'OAuth provider — 현재 Apple SIWA 한정. 차후 다른 provider 확장 시 사용.',
    provider_user_id VARCHAR(255) NOT NULL
        COMMENT 'Apple SIWA 의 경우 apple_sub. 다른 provider 면 해당 provider 의 사용자 ID.',
    phone_hash VARCHAR(64) NOT NULL
        COMMENT '정규화 phone(01012345678) 의 SHA-256 hex (소문자, 64자). PII 평문 저장 금지.',
    code_hash VARCHAR(255) NOT NULL
        COMMENT '6자리 OTP 의 bcrypt 해시 (스트랭스 10). 평문 저장 금지.',
    attempts INT NOT NULL DEFAULT 0
        COMMENT '검증 시도 횟수. 5회 초과 시 row 를 status=FAILED 로 무효화하고 새 발송 강제.',
    daily_count INT NOT NULL DEFAULT 1
        COMMENT '같은 (provider_user_id, phone_hash) 의 오늘 발송 누적 횟수. 일 5회 한도.',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        COMMENT 'PENDING (발송 후 검증 대기) / VERIFIED (성공) / FAILED (시도 초과) / EXPIRED (시간 초과)',
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL
        COMMENT '발송 시점 + 3분. 이를 넘으면 검증 실패 및 status=EXPIRED 처리.',
    verified_at DATETIME NULL
        COMMENT '검증 성공 시점. status=VERIFIED 와 동시 갱신.',
    PRIMARY KEY (id),
    INDEX idx_phone_otp_attempts_lookup (tenant_id, phone_hash, status),
    INDEX idx_phone_otp_attempts_provider_user (provider, provider_user_id, created_at),
    INDEX idx_phone_otp_attempts_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Apple SIWA 휴대폰 매칭 OTP 시도/한도 추적 (V20260608_001).';
