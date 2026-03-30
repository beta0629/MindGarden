-- 권한 관리 전용 화면 제거: LNB에서 항목 비활성화 (역할·권한은 사용자 관리에서 처리)
-- 기존 북마크 /admin/permissions 는 프론트에서 /admin/user-management 로 리다이렉트

UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_PERMISSIONS';
