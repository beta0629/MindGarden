-- =============================================================================
-- ALIMTALK_BIZ_TEMPLATE_CODE 8종 활성화 (옵션 C — 솔라피/카카오 검수 통과 후 단일 토글)
--
-- 사전 작성 PR: 검수 통과 통지 수신 직후 develop 머지로 즉시 매핑 모드 발화시키기 위함.
--               (커밋·푸시 시점은 사용자가 검수 결과 확인 후 별도 위임으로 수행)
--
-- 시드/UPDATE 체인:
--   • V20260528_001__seed_alimtalk_biz_template_code_8types.sql       (스켈레톤 시드, code_label='')
--   • V20260528_002__update_alimtalk_biz_template_code_solapi_ids.sql (실 templateId 주입 + is_active=false)
--   • V20260528_003 (본 파일)                                          (is_active=true 토글 + extra_data 활성화 메타)
--
-- 본 마이그레이션 동작:
--   1) 8종 row 의 is_active 를 FALSE → TRUE 로 전환
--   2) extra_data 의 approval_status 를 'pending_verified' → 'approved' 갱신
--   3) extra_data 에 activated_at = NOW() (KST ISO8601) 추가 (운영 감사 추적)
--   4) updated_at = CURRENT_TIMESTAMP
--
-- 매핑 정책 (참조):
--   • AlimtalkTemplateMappingResolver.resolveSolapiTemplateId(...)
--       → CommonCodeRepository.findCoreCodeByGroupAndValue (...AND c.isActive = true)
--       → is_active=true 로 전환되면 templateId 매핑 즉시 발화
--   • BatchNotificationDispatchServiceImpl: resolver non-null → 알림톡 발송
--   • AdminTestNotificationServiceImpl / AdminManualNotificationServiceImpl:
--       resolver non-null → ERROR_CODE_TEMPLATE_NOT_MAPPED 해제 (어드민 발송 가능)
--
-- 멱등성·안전 가드:
--   • AND is_active = FALSE                  → 이미 활성 row 재실행 시 0 rows affected
--   • AND code_label LIKE 'KA01TP%'          → templateId 미주입 row 활성화 차단 (안전망)
--   • 8건 each statement 동일 가드 적용 (V20260528_002 와 동일 분리 UPDATE 패턴)
--
-- extra_data 컬럼 타입: VARCHAR(1000) (CommonCode.extraData)
--   → JSON 함수 대신 CONCAT + DATE_FORMAT(CURRENT_TIMESTAMP) 으로 문자열 전체 교체.
--     activated_at 은 마이그레이션 실 적용 시각이 KST(서버 timezone Asia/Seoul) 기준으로 기록된다.
--
-- 운영 절차 문서:
--   docs/project-management/2026-05-23/ALIMTALK_TEMPLATE_ID_ROTATION.md §4.2 / §7
-- =============================================================================

-- 1) RESERVATION_REMINDER_D2 — D-2 09:00 KST 배치 (정보성)
UPDATE common_codes
   SET is_active = TRUE,
       extra_data = CONCAT(
           '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime","remainingSessions"],"trigger":"D-2 09:00 KST scheduler","fallback":"sms","approval_status":"approved","template_id_received_at":"2026-05-23T03:47:00+09:00","activated_at":"',
           DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%dT%H:%i:%s+09:00'),
           '"}'
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'RESERVATION_REMINDER_D2'
   AND is_active = FALSE
   AND code_label LIKE 'KA01TP%';

-- 2) RESERVATION_IMMEDIATE_SINGLE — 단발성(1회기) 결제 예약 즉시 (정보성)
UPDATE common_codes
   SET is_active = TRUE,
       extra_data = CONCAT(
           '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime"],"trigger":"ScheduleServiceImpl.notifyScheduleCreated (single session)","fallback":"sms","approval_status":"approved","template_id_received_at":"2026-05-23T03:47:00+09:00","activated_at":"',
           DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%dT%H:%i:%s+09:00'),
           '"}'
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'RESERVATION_IMMEDIATE_SINGLE'
   AND is_active = FALSE
   AND code_label LIKE 'KA01TP%';

-- 3) RESERVATION_IMMEDIATE_LATE — D-2 미달 즉시 예약 (정보성)
UPDATE common_codes
   SET is_active = TRUE,
       extra_data = CONCAT(
           '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime"],"trigger":"ScheduleServiceImpl.notifyScheduleCreated (within D-2)","fallback":"sms","approval_status":"approved","template_id_received_at":"2026-05-23T03:47:00+09:00","activated_at":"',
           DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%dT%H:%i:%s+09:00'),
           '"}'
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'RESERVATION_IMMEDIATE_LATE'
   AND is_active = FALSE
   AND code_label LIKE 'KA01TP%';

-- 4) SESSION_ENDING_SOON — 잔여 1회기 진입 예고 (정보성)
UPDATE common_codes
   SET is_active = TRUE,
       extra_data = CONCAT(
           '{"category":"informational","variables":["clientName","consultantName","remainingSessions"],"trigger":"session decrement event (remaining=1)","fallback":"sms","approval_status":"approved","template_id_received_at":"2026-05-23T03:47:00+09:00","activated_at":"',
           DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%dT%H:%i:%s+09:00'),
           '"}'
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'SESSION_ENDING_SOON'
   AND is_active = FALSE
   AND code_label LIKE 'KA01TP%';

-- 5) SESSION_RENEW_PROMPT — 회기 갱신 유도 (마케팅, 수신동의 필수 / F2 SMS 폴백 미수행)
UPDATE common_codes
   SET is_active = TRUE,
       extra_data = CONCAT(
           '{"category":"marketing","variables":["clientName","consultantName","lastSessionDate"],"trigger":"session end event (final session completed)","fallback":"none (F2 skip_marketing)","approval_status":"approved","template_id_received_at":"2026-05-23T03:47:00+09:00","marketing_consent_required":true,"activated_at":"',
           DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%dT%H:%i:%s+09:00'),
           '"}'
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'SESSION_RENEW_PROMPT'
   AND is_active = FALSE
   AND code_label LIKE 'KA01TP%';

-- 6) CLIENT_WELCOME_FIRST — 신규 매칭 환영 (정보성, user 영구 1회)
UPDATE common_codes
   SET is_active = TRUE,
       extra_data = CONCAT(
           '{"category":"informational","variables":["clientName","consultantName","contactPhone"],"trigger":"consultant_client_mapping create (first per user)","fallback":"sms","approval_status":"approved","template_id_received_at":"2026-05-23T03:47:00+09:00","activated_at":"',
           DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%dT%H:%i:%s+09:00'),
           '"}'
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'CLIENT_WELCOME_FIRST'
   AND is_active = FALSE
   AND code_label LIKE 'KA01TP%';

-- 7) INITIAL_GUIDE_OFFLINE — 첫 상담 안내(오프라인, 정보성)
UPDATE common_codes
   SET is_active = TRUE,
       extra_data = CONCAT(
           '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime","branchAddress"],"trigger":"first schedule create (consultation_method != ONLINE)","fallback":"sms","approval_status":"approved","template_id_received_at":"2026-05-23T03:47:00+09:00","activated_at":"',
           DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%dT%H:%i:%s+09:00'),
           '"}'
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'INITIAL_GUIDE_OFFLINE'
   AND is_active = FALSE
   AND code_label LIKE 'KA01TP%';

-- 8) INITIAL_GUIDE_ONLINE — 첫 상담 안내(온라인, 정보성)
UPDATE common_codes
   SET is_active = TRUE,
       extra_data = CONCAT(
           '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime","onlineLink"],"trigger":"first schedule create (consultation_method = ONLINE)","fallback":"sms","approval_status":"approved","template_id_received_at":"2026-05-23T03:47:00+09:00","activated_at":"',
           DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%dT%H:%i:%s+09:00'),
           '"}'
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'INITIAL_GUIDE_ONLINE'
   AND is_active = FALSE
   AND code_label LIKE 'KA01TP%';
