-- =============================================================================
-- SMS 템플릿 본문 길이 한도 확장 — code_label VARCHAR(500) → VARCHAR(2000)
--   (2026-06-01, 사용자 결정 — 옵션 B 2,000자 안전 여유분)
--
-- 배경:
--   • V20260607_001 에서 100자 → 500자 1차 확장 (P0 hotfix).
--   • 운영 사용자가 SMS 본문 작성 중 500자도 초과하여 SmsTemplateUpdateRequest 의
--     @Size(max=500) 검증 fail / DataIntegrityViolationException 재발.
--   • 솔라피 LMS 표준 한도는 한글 1000자 (2000바이트). 안전 여유분 2배 = 2,000자 채택.
--     2,000자 초과는 어차피 솔라피가 reject 하므로 프론트 구간에서 차단하면 됨.
--
-- 변경:
--   • common_codes.code_label 컬럼: VARCHAR(500) NOT NULL → VARCHAR(2000) NOT NULL.
--
-- 영향:
--   • 다른 코드 그룹의 라벨은 100자 이내이므로 호환 영향 없음.
--   • CommonCode 엔티티 @Column(length=500) → length=2000 동반 갱신.
--   • SmsTemplateUpdateRequest @Size(max=500) → @Size(max=2000) 동반 갱신.
--
-- 멱등성:
--   • 컬럼이 이미 ≥ 2000 이면 NO-OP, 미만이면 MODIFY.
--   • V20260607_001 과 동일 패턴.
-- =============================================================================

SET @dbname = (SELECT DATABASE());

SET @stmt = (SELECT IF(
    (SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'common_codes'
         AND COLUMN_NAME = 'code_label') >= 2000,
    'SELECT ''code_label already >= 2000 — no change'' AS info',
    'ALTER TABLE common_codes MODIFY COLUMN code_label VARCHAR(2000) NOT NULL'
));
PREPARE st FROM @stmt;
EXECUTE st;
DEALLOCATE PREPARE st;
