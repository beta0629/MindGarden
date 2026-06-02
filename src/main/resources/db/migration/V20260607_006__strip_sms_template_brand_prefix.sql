-- =============================================================================
-- SMS 템플릿 본문에서 `[마인드가든]` brand prefix 일괄 제거 — 2026-06-02 P0
--
-- 배경:
--   • 사용자 요청: "문자 메세지 제목은 안나가게 해줘"
--   • 솔라피 LMS API 는 본문 90byte 초과 시 자동 LMS 전환 + subject 미지정 시
--     본문 첫 줄 또는 default 를 자동 subject 로 추출. 본문 첫 줄에 brand prefix
--     `[마인드가든]` 이 있으면 사용자 폰의 LMS 메시지 헤더에 "제목" 처럼 표시됨.
--   • 글로벌 시드 15종 중 7종이 `[마인드가든] ` 으로 시작 (운영 DB 실측 2026-06-02):
--       - CONSULTATION_CANCELLED
--       - CONSULTATION_CONFIRMED
--       - CONSULTATION_REMINDER
--       - DEPOSIT_PENDING_REMINDER
--       - PAYMENT_COMPLETED
--       - REFUND_COMPLETED
--       - SCHEDULE_CHANGED
--
-- 정책:
--   • 본문 첫 머리의 `[마인드가든] ` (공백 1자 포함) 또는 `[마인드가든]` 패턴만 제거.
--   • 본문 중간/끝에 등장하는 `[마인드가든]` 은 의도된 reference 일 수 있어 보존.
--   • 테넌트 override (tenant_id IS NOT NULL) 는 운영자가 직접 작성한 본문이므로
--     본 마이그 범위에서 제외. 어드민 UI 에서 직접 수정 권장.
--
-- 멱등성:
--   • LIKE prefix 매칭이므로 두 번 실행해도 매칭 0건 → NO-OP.
--   • 발신자 본문이 동일 prefix 로 재시드되지 않는 한 후속 마이그 영향 없음.
--
-- 멀티테넌트 가드:
--   • code_group='SMS_TEMPLATE' AND tenant_id IS NULL 글로벌 시드만 변경.
-- =============================================================================

UPDATE common_codes
SET code_label = SUBSTRING(code_label, CHAR_LENGTH('[마인드가든] ') + 1),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE'
  AND tenant_id IS NULL
  AND code_label LIKE '[마인드가든] %';

UPDATE common_codes
SET code_label = SUBSTRING(code_label, CHAR_LENGTH('[마인드가든]') + 1),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE'
  AND tenant_id IS NULL
  AND code_label LIKE '[마인드가든]%';

-- 영향 받는 시드 (운영 DB 2026-06-02 실측):
--   • 글로벌 7종 — CONSULTATION_CANCELLED / CONSULTATION_CONFIRMED /
--     CONSULTATION_REMINDER / DEPOSIT_PENDING_REMINDER / PAYMENT_COMPLETED /
--     REFUND_COMPLETED / SCHEDULE_CHANGED
--   • 변경 후 본문은 `{{...}}` 변수 또는 사용자 안내 문장으로 시작 — LMS 자동
--     subject 가 brand 라벨 대신 안내 본문 첫 줄을 사용함.
