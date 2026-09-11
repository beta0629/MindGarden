# DEPRECATED — App Store Review Mode 하드 게이트 (폐기)

> **상태**: 폐기 (2026-09-11)  
> **대체 SSOT**: `docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`  
> **운영 절차**: `docs/운영반영/APP_STORE_REVIEW_MENU_PERMISSION_CHECKLIST.md`

`EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / 빌드 extra / 소스 하드코딩 hide로 커뮤니티·UGC 메뉴를 막는 방식은 **사용하지 않는다**.

심사 시에는 Admin `/admin/menu-permissions`에서 역할별 메뉴 `canView`를 OFF 한다.
