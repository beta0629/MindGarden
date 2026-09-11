# App Store 심사 — 메뉴 권한(RBAC) 운영 체크리스트

> SSOT 기획: `docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`  
> **금지**: `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / 빌드 extra 심사 플래그 / 소스 하드코딩 hide.

## 심사 전

1. Admin으로 로그인 → `/admin/menu-permissions`
2. 역할 칩 **내담자(CLIENT)** 선택 → 메뉴명 **커뮤니티** (`CLT_COMMUNITY`) 토글 **OFF** → 저장
3. 역할 칩 **상담사(CONSULTANT)** 선택 → **커뮤니티** (`CST_COMMUNITY`) 토글 **OFF** → 저장
4. 내담자/상담사 계정으로 `GET /api/v1/menus/lnb` 확인 — `CLT_COMMUNITY` / `CST_COMMUNITY` 없음
5. Expo 더보기·웹 더보기에서 커뮤니티 미노출, `/community` 딥링크는 더보기/대시보드로 복귀
6. 앱 설정에서 **EULA · 콘텐츠 정책** 및 이용약관(zero-tolerance 조항) 링크 확인

## 심사 후

1. 동일 Admin 화면에서 CLIENT/CONSULTANT 커뮤니티 토글 **ON** → 저장
2. LNB/더보기에 커뮤니티 복귀 확인

## ASC / Org / 권한 무관 유지 항목

- Guideline **5.1.1(ix)**: Individual → **Organization** 계정 전환 (코드 밖)
- 해당 시 ASC 연령 **18+** 메타 확인
- 인앱 **EULA · 콘텐츠 정책** (`/legal/eula`) · zero-tolerance 문구
- iPad: `supportsTablet` + `TabletContentShell` (메뉴 권한과 무관)

## 하드 게이트 금지 (deprecated)

- `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / EAS production 플래그 **사용 금지**
- 심사마다 소스에서 메뉴 hide **금지** — Admin RoleMenuPermission만 사용
- 구 문서: `APP_STORE_REVIEW_MODE_PLAN_20260911.md` (폐기 안내만 유지)
