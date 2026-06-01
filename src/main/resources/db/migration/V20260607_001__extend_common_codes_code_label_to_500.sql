-- =============================================================================
-- common_codes.code_label 컬럼 VARCHAR(100) → VARCHAR(500) 확장
--   (2026-06-01, P0 hotfix — 어드민 SMS 템플릿 본문 저장 실패 대응)
--
-- 배경:
--   • 운영 https://mindgarden.core-solution.co.kr/admin/sms-templates 에서
--     RESERVATION_REMINDER_D2 본문을 100자 초과로 수정·저장 시
--     400 "데이터 제약 위반입니다." 응답 발생.
--   • 사용자 콘솔 로그 (2026-06-01):
--       PUT /api/v1/admin/sms-templates/RESERVATION_REMINDER_D2 → 400 Bad Request
--   • 근본 원인:
--     - SmsTemplateService 는 common_codes 테이블의 code_label 컬럼에 SMS 본문을
--       저장한다 (code_group='SMS_TEMPLATE').
--     - 그러나 common_codes.code_label 은 본래 "코드 라벨"(짧은 표시명) 용도로 정의되어
--       VARCHAR(100) NOT NULL 제약.
--     - V20260529_004 시드 본문 중 INITIAL_GUIDE_OFFLINE 이 이미 정확히 100자,
--       RESERVATION_REMINDER_D2 가 93자로 한도 임박.
--     - 어드민이 본문에 변수/안내 문구를 더 추가하여 100자 초과 시 MariaDB error 1406
--       "Data too long for column" → DataIntegrityViolationException → 400.
--   • SmsTemplateUpdateRequest DTO 에 @Size(max=500) 이 이미 존재 — 즉 백엔드 의도는
--     "최대 500자" 였으나 DB 컬럼이 이를 지원하지 못한 정합성 결함.
--
-- 정책:
--   • code_label 컬럼을 VARCHAR(500) 으로 확장한다.
--   • 다른 NULL 가능 여부·기본값·인덱스는 유지.
--   • common_codes 의 다른 사용처(다수 — 코드그룹별 라벨)는 100자 이하이므로 호환.
--   • 컬럼 확장은 MariaDB 에서 메타데이터 변경만 — 인덱스 재구성 불요, 락 최소.
--
-- 멀티테넌트 격리:
--   • 컬럼 정의 변경 — 모든 테넌트 영향 동일.
--   • core_solution DB 단독 적용, mind_garden DB 미접촉.
--
-- 멱등성:
--   • CHARACTER_MAXIMUM_LENGTH < 500 일 때만 MODIFY 실행. 재실행 시 0 변경.
--
-- 가드:
--   • code_label 의 NOT NULL 제약 유지.
--   • 데이터 손실 위험 0 (확장 방향).
--   • V20260608_001 슬롯 이후 보존.
--
-- 검증 쿼리:
--   SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
--    WHERE TABLE_NAME='common_codes' AND COLUMN_NAME='code_label';
--   -- 기대: varchar(500)
-- =============================================================================

SET @dbname = (SELECT DATABASE());

SET @stmt = (SELECT IF(
    (SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME = 'common_codes'
         AND COLUMN_NAME = 'code_label') >= 500,
    'SELECT ''code_label already >= 500 — no change'' AS info',
    'ALTER TABLE common_codes MODIFY COLUMN code_label VARCHAR(500) NOT NULL'
));
PREPARE st FROM @stmt;
EXECUTE st;
DEALLOCATE PREPARE st;
