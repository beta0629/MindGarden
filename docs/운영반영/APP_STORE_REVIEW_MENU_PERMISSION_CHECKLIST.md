# App Store 심사 — 메뉴 권한(RBAC) 운영 체크리스트

> SSOT 기획: `docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`  
> UX: `docs/project-management/MENU_VISIBILITY_IOS_REVIEW_ONE_BUTTON_ORCHESTRATION_20260912.md`  
> **금지**: `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / 빌드 extra 심사 플래그 / 소스 하드코딩 hide / Flyway 커뮤니티 사전 OFF 시드.

## 심사 전

1. Admin으로 로그인 → `/admin/menu-permissions`
2. 가이드라인(UGC 1.2 등) 준수 확인 후, 필요 시에만 **「iOS에서 커뮤니티 숨기기」** 원버튼 클릭  
   → CLIENT(`CLT_COMMUNITY`)·CONSULTANT(`CST_COMMUNITY`)의 **iOS만** OFF. Android·웹 불변.
3. (세밀 조정 시) 역할 칩에서 행별 iOS|Android Switch로 개별 조정 — 일괄 저장 없음(즉시 적용)
4. `X-Client-Platform: ios` 로 LNB 조회 시 커뮤니티 없음 · `android`/`web` 은 정책대로 유지 확인
5. Expo iOS 더보기에서 커뮤니티 미노출, `/community` 딥링크는 더보기/대시보드로 복귀
6. 앱 설정에서 **EULA · 콘텐츠 정책** 및 이용약관(zero-tolerance 조항) 링크 확인

## 심사 후

1. 동일 Admin 화면에서 **「iOS에서 커뮤니티 다시 보이기」** 원버튼 클릭
2. iOS LNB/더보기에 커뮤니티 복귀 확인 (Android·웹은 원버튼 영향 없음)

## ASC / Org / 권한 무관 유지 항목

- Guideline **5.1.1(ix)**: Individual → **Organization** 계정 전환 (코드 밖)
- 해당 시 ASC 연령 **18+** 메타 확인
- 인앱 **EULA · 콘텐츠 정책** (`/legal/eula`) · zero-tolerance 문구
- iPad: `supportsTablet` + `TabletContentShell` (메뉴 권한과 무관)

## 하드 게이트 금지 (deprecated)

- `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / EAS production 플래그 **사용 금지**
- 심사마다 소스에서 메뉴 hide **금지** — Admin RoleMenuPermission(원버튼 또는 행 Switch)만 사용
- 구 문서: `APP_STORE_REVIEW_MODE_PLAN_20260911.md` (폐기 안내만 유지)
