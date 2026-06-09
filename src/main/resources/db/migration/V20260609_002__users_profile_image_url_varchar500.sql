-- =============================================================================
-- V20260609_002__users_profile_image_url_varchar500.sql
-- users.profile_image_url 컬럼 폭 축소: longtext → VARCHAR(500)
--
-- 배경
-- - PR #166/#167/#168 (P0 base64 핫픽스) 로 사용 시점 가드 도입 — 입력 단에서 차단.
-- - 그러나 컬럼 정의가 longtext 인 한 향후 회귀 시 또다시 300KB+ base64 가 저장될 수 있음.
-- - 구조적으로 차단: profile_image_url 은 URL 만 저장 (절대/상대 URL, max ~500자) →
--   varchar(500) 으로 폭 제한. 초과 입력 시 DB DataIntegrityViolationException 으로
--   상위 레이어 가드를 뚫고 와도 즉시 실패.
--
-- 사전 검증 (2026-06-09 KST 운영 스캔)
-- - SELECT SUM(CHAR_LENGTH(profile_image_url) > 500) AS over500 FROM users; → 0
-- - SELECT SUM(profile_image_url LIKE 'data:%') AS base64 FROM users; → 0
-- - SELECT SUM(CHAR_LENGTH(profile_image_url) > 2048) AS over2048 FROM users; → 0
-- - SELECT SUM(profile_image_url IS NOT NULL) AS nonnull FROM users; → 1 (전체)
-- - 즉, 운영 데이터 손실 없이 안전하게 ALTER 가능.
--
-- 안전 가드 (Flyway 마이그레이션 진입 직전 재검증)
-- - ALTER 전 dynamic SQL 로 over500_count 재검사. > 0 이면 SIGNAL SQLSTATE 로 마이그
--   레이션 실패 → schema_history success=0 → 다음 기동에서 자동 재시도 (영구 잠금 X).
-- - 운영자는 워크스트림 2 NULL 처리 절차 (PROFILE_IMAGE_UPLOAD_OPS_GUIDE.md §5) 로
--   정리 후 재배포.
--
-- 회귀 위험
-- - JPA Entity (User.java) 의 columnDefinition = "LONGTEXT" → length = 500 동시 변경.
--   불일치 시 Hibernate validate 모드에서 기동 실패할 수 있으나 운영은 ddl-auto=none
--   이므로 영향 없음.
-- - longtext → varchar 는 InnoDB row 포맷에 따라 in-place ALTER 가능 (DYNAMIC/COMPRESSED).
--   필요 시 ALGORITHM=INPLACE 명시 가능하나 default 도 안전.
--
-- 참조
-- - docs/project-management/2026-06-09/PROFILE_IMAGE_UPLOAD_OPS_GUIDE.md §5
-- - PR #166/#167/#168 (P0 base64 핫픽스)
-- =============================================================================

-- 1) 사전 검증: 500자 초과 row 존재 시 마이그레이션 중단
SET @over500_count := (
    SELECT COUNT(*)
    FROM users
    WHERE CHAR_LENGTH(profile_image_url) > 500
);

SET @msg := CONCAT(
    'users.profile_image_url 에 500자 초과 row ', @over500_count,
    ' 건 존재 — Flyway 마이그레이션 중단. ',
    'docs/project-management/2026-06-09/PROFILE_IMAGE_UPLOAD_OPS_GUIDE.md §5 NULL 처리 절차 적용 후 재배포 필요.'
);

-- IF 문은 마이그레이션 외부에서 동작하지 않으므로 동적 SQL 로 SIGNAL 처리.
-- @over500_count > 0 이면 invalid statement 실행 → 마이그레이션 실패.
SET @stmt := IF(
    @over500_count > 0,
    CONCAT('SIGNAL SQLSTATE ''45000'' SET MESSAGE_TEXT = ''', REPLACE(@msg, '''', ''''''), ''';'),
    'DO 0'
);
PREPARE check_stmt FROM @stmt;
EXECUTE check_stmt;
DEALLOCATE PREPARE check_stmt;

-- 2) 컬럼 폭 축소
ALTER TABLE users
    MODIFY COLUMN profile_image_url VARCHAR(500) NULL
    COMMENT 'Profile image URL only (no base64 dataURI). Max 500 chars (V20260609_002).';
