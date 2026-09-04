-- =============================================================================
-- LNB: ADM_PUSH_MONITORING 을 콘텐츠·커뮤니티 → 시스템·설정(ADM_SETTINGS) 하위로 이동
-- - 표시명: 「푸시 설정 모니터링」 → 「메시지 발송」
-- - path `/admin/push-monitoring` 유지
-- - required_role / min_required_role / is_admin_only / menu_location 변경 없음
-- - sort_order: SMS 템플릿(11) 다음 · 컴플라이언스 앞 (알림/SMS 클러스터)
-- - 멱등: menu_code 기준 UPDATE 만 (기존 V20260606_008 INSERT 는 수정하지 않음)
-- =============================================================================

-- ADM_PUSH_MONITORING: 부모·라벨·정렬만 갱신
UPDATE menus
SET parent_menu_id = (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p),
    menu_name = '메시지 발송',
    menu_name_en = 'Message Send',
    sort_order = 12,
    description = '문자/푸시 발송 현황 (메시지 발송)',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_PUSH_MONITORING';

-- ADM_SETTINGS 하위 sort_order: 메시지 발송(12) 이후 한 칸씩 뒤로
UPDATE menus SET sort_order = 13, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_REPORTS_COMP';
UPDATE menus SET sort_order = 14, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_SETTINGS_AI_PROVIDER';
UPDATE menus SET sort_order = 15, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_PACKAGE_PRICING';
