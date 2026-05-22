-- =============================================================================
-- ALIMTALK_BIZ_TEMPLATE_CODE 8종 templateId UPDATE
--   (옵션 C — 검수진행중, is_active=false 비활성 / 검수 통과 후 단일 SQL 활성화)
--
-- 시드: V20260528_001__seed_alimtalk_biz_template_code_8types.sql
--       (code_label='' / is_active=true / approval_status='pending')
-- 본 마이그레이션:
--   1) code_label 을 솔라피 콘솔에서 회수한 실 templateId 8건으로 교체
--   2) is_active = FALSE 로 비활성 (검수진행중 동안 매핑 미발견 → SMS 폴백)
--   3) extra_data 의 approval_status 를 'pending' → 'pending_verified' 갱신
--      + template_id_received_at 타임스탬프 추가 (운영 추적용)
--
-- 매핑 정책 (참조):
--   • AlimtalkTemplateMappingResolver.resolveSolapiTemplateId(...)
--       → CommonCodeRepository.findCoreCodeByGroupAndValue (...AND c.isActive = true)
--       → is_active=false 일 때 row 미반환 → resolver null 반환
--   • BatchNotificationDispatchServiceImpl: resolver null → 알림톡 스킵 → SMS 폴백
--   • AdminTestNotificationServiceImpl / AdminManualNotificationServiceImpl:
--       resolver null → ERROR_CODE_TEMPLATE_NOT_MAPPED 차단 (어드민 명시적 가드)
--
-- 검수 통과 후 활성화 (단일 SQL — 별도 Flyway PR 권장):
--   UPDATE common_codes
--      SET is_active = TRUE,
--          updated_at = CURRENT_TIMESTAMP
--    WHERE tenant_id IS NULL
--      AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
--      AND code_value IN (
--          'RESERVATION_REMINDER_D2', 'RESERVATION_IMMEDIATE_SINGLE',
--          'RESERVATION_IMMEDIATE_LATE', 'SESSION_ENDING_SOON',
--          'SESSION_RENEW_PROMPT', 'CLIENT_WELCOME_FIRST',
--          'INITIAL_GUIDE_OFFLINE', 'INITIAL_GUIDE_ONLINE'
--      );
--
-- 멱등성:
--   • 각 UPDATE 에 가드 절: (code_label IS NULL OR code_label = '')
--     → 이미 templateId 가 들어간 row 재실행 시 0 rows affected
--   • V20260528_001 시드가 빈 문자열로 INSERT 했으므로 최초 실행만 매칭
--
-- extra_data 컬럼 타입: VARCHAR(1000) (CommonCode.extraData)
--   → JSON 함수 대신 단순 문자열 전체 교체로 처리 (가장 안전·단순)
--
-- 운영 절차 문서: docs/project-management/2026-05-23/ALIMTALK_TEMPLATE_ID_ROTATION.md
-- =============================================================================

-- 1) RESERVATION_REMINDER_D2 — D-2 09:00 KST 배치 (정보성)
UPDATE common_codes
   SET code_label = 'KA01TP260522184308591IIbyy4H3E8U',
       is_active = FALSE,
       extra_data = '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime","remainingSessions"],"trigger":"D-2 09:00 KST scheduler","fallback":"sms","approval_status":"pending_verified","template_id_received_at":"2026-05-23T03:47:00+09:00"}',
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'RESERVATION_REMINDER_D2'
   AND (code_label IS NULL OR code_label = '');

-- 2) RESERVATION_IMMEDIATE_SINGLE — 단발성(1회기) 결제 예약 즉시 (정보성)
UPDATE common_codes
   SET code_label = 'KA01TP260522184356741ccLBsS676ss',
       is_active = FALSE,
       extra_data = '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime"],"trigger":"ScheduleServiceImpl.notifyScheduleCreated (single session)","fallback":"sms","approval_status":"pending_verified","template_id_received_at":"2026-05-23T03:47:00+09:00"}',
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'RESERVATION_IMMEDIATE_SINGLE'
   AND (code_label IS NULL OR code_label = '');

-- 3) RESERVATION_IMMEDIATE_LATE — D-2 미달 즉시 예약 (정보성)
UPDATE common_codes
   SET code_label = 'KA01TP260522184425486nliMfICjHKT',
       is_active = FALSE,
       extra_data = '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime"],"trigger":"ScheduleServiceImpl.notifyScheduleCreated (within D-2)","fallback":"sms","approval_status":"pending_verified","template_id_received_at":"2026-05-23T03:47:00+09:00"}',
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'RESERVATION_IMMEDIATE_LATE'
   AND (code_label IS NULL OR code_label = '');

-- 4) SESSION_ENDING_SOON — 잔여 1회기 진입 예고 (정보성)
UPDATE common_codes
   SET code_label = 'KA01TP2605221844555544EY1FTbnzPF',
       is_active = FALSE,
       extra_data = '{"category":"informational","variables":["clientName","consultantName","remainingSessions"],"trigger":"session decrement event (remaining=1)","fallback":"sms","approval_status":"pending_verified","template_id_received_at":"2026-05-23T03:47:00+09:00"}',
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'SESSION_ENDING_SOON'
   AND (code_label IS NULL OR code_label = '');

-- 5) SESSION_RENEW_PROMPT — 회기 갱신 유도 (마케팅, 수신동의 필수 / F2 SMS 폴백 미수행)
UPDATE common_codes
   SET code_label = 'KA01TP260522184529370iMHGpu8lJx5',
       is_active = FALSE,
       extra_data = '{"category":"marketing","variables":["clientName","consultantName","lastSessionDate"],"trigger":"session end event (final session completed)","fallback":"none (F2 skip_marketing)","approval_status":"pending_verified","template_id_received_at":"2026-05-23T03:47:00+09:00","marketing_consent_required":true}',
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'SESSION_RENEW_PROMPT'
   AND (code_label IS NULL OR code_label = '');

-- 6) CLIENT_WELCOME_FIRST — 신규 매칭 환영 (정보성, user 영구 1회)
UPDATE common_codes
   SET code_label = 'KA01TP260522183559394LFIRKUfcteP',
       is_active = FALSE,
       extra_data = '{"category":"informational","variables":["clientName","consultantName","contactPhone"],"trigger":"consultant_client_mapping create (first per user)","fallback":"sms","approval_status":"pending_verified","template_id_received_at":"2026-05-23T03:47:00+09:00"}',
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'CLIENT_WELCOME_FIRST'
   AND (code_label IS NULL OR code_label = '');

-- 7) INITIAL_GUIDE_OFFLINE — 첫 상담 안내(오프라인, 정보성)
UPDATE common_codes
   SET code_label = 'KA01TP2605221836359933KXmooGxUDh',
       is_active = FALSE,
       extra_data = '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime","branchAddress"],"trigger":"first schedule create (consultation_method != ONLINE)","fallback":"sms","approval_status":"pending_verified","template_id_received_at":"2026-05-23T03:47:00+09:00"}',
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'INITIAL_GUIDE_OFFLINE'
   AND (code_label IS NULL OR code_label = '');

-- 8) INITIAL_GUIDE_ONLINE — 첫 상담 안내(온라인, 정보성)
UPDATE common_codes
   SET code_label = 'KA01TP260522183954962WPnr2gZSzjL',
       is_active = FALSE,
       extra_data = '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime","onlineLink"],"trigger":"first schedule create (consultation_method = ONLINE)","fallback":"sms","approval_status":"pending_verified","template_id_received_at":"2026-05-23T03:47:00+09:00"}',
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'INITIAL_GUIDE_ONLINE'
   AND (code_label IS NULL OR code_label = '');
