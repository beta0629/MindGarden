-- =============================================================================
-- SMS 템플릿 audience 메타데이터 시드 — 상담사/내담자 시각 구분 디자인 변경 P1
--   (2026-06-01, 사용자 결정 — 옵션 A 메인 직접 핫픽스, 옵션 badge Pill)
--
-- 배경:
--   • 사용자 요청: "SMS 발송 템플릿에서 상담사에게만 문자 할것과 내담자들 한테 발송할 내용
--     구분 해야 될것같아 디자인 변경 부탁해 색상으로 나뉘던지 해야 될것 같아"
--   • 현재 SMS_TEMPLATE common_codes 15종 모두 extra_data.audience 키 없음.
--   • 한글명 추정 분류: 15종 모두 내담자 대상. 상담사 대상 템플릿 0건 (향후 추가 예정).
--
-- 정책 (SSOT):
--   • extra_data.audience 값 집합:
--       - 'CLIENT'     — 내담자 (default, 현재 15종)
--       - 'CONSULTANT' — 상담사 (향후 추가, 예: 상담일지 미작성 알림 등)
--       - 'ADMIN'      — 운영 관리자 (시스템 공지 등)
--       - 'SYSTEM'     — 시스템 자동 (인증 OTP 등; 일반 어드민 SMS 템플릿 외)
--   • 어드민 UI: 우측 상단 Pill 배지로 시각 구분 (색상 토큰 분기).
--
-- 변경:
--   • SMS_TEMPLATE 코드 15종 (tenant_id IS NULL 글로벌 시드) 의 extra_data 에
--     audience='CLIENT' 키 머지. 기존 키 (category/variables/dispatch_enabled 등) 보존.
--   • JSON_MERGE_PATCH 사용 — 멱등 (이미 audience 키 있으면 덮어쓰기).
--
-- 멱등성:
--   • JSON_MERGE_PATCH 는 동일 키 입력 시 NO-OP 와 동일한 효과 (이미 'CLIENT' 면 변화 없음).
--   • code_group + tenant_id IS NULL 한정 — 테넌트 override 미접촉.
--
-- 멀티테넌트 가드:
--   • tenant_id IS NULL 만 처리 (글로벌 시드).
--   • 테넌트 override 의 audience 는 글로벌 default 상속 (DTO 매핑 단계에서 global 우선 노출).
-- =============================================================================

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('audience', 'CLIENT')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE'
  AND tenant_id IS NULL
  AND (
      extra_data IS NULL
      OR JSON_EXTRACT(extra_data, '$.audience') IS NULL
      OR JSON_UNQUOTE(JSON_EXTRACT(extra_data, '$.audience')) <> 'CLIENT'
  );

-- 영향 받는 시드 (V20260529_004 + V20260607_003 정착 기준 15종):
--   A) NotificationServiceImpl 트랜잭션 7종 (audience='CLIENT')
--   B) BatchNotificationDispatchServiceImpl 배치 8종 (audience='CLIENT')
--
-- 향후 상담사 대상 SMS 템플릿 신설 시:
--   • 별도 Flyway 마이그 (예: V20260608_xxx) 로 신규 SMS_TEMPLATE 코드 INSERT 시
--     extra_data.audience='CONSULTANT' 명시.
--   • 디자이너 핸드오프 + 코더 위임 (별도 기획서).
