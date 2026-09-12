# App Store 심사 — 메뉴 권한(RBAC) 운영 체크리스트

> SSOT 기획: `docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`  
> UX: `docs/project-management/MENU_VISIBILITY_IOS_REVIEW_ONE_BUTTON_ORCHESTRATION_20260912.md`  
> 팔로우업: `docs/project-management/APPLE_FOLLOWUP_ORCHESTRATION_20260912.md`  
> **금지**: `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / 빌드 extra 심사 플래그 / 소스 하드코딩 hide / Flyway 커뮤니티 사전 OFF 시드.

## 심사 전

1. Admin으로 로그인 → 통합 사용자 관리 → **앱 메뉴 노출** (`/admin/menu-permissions`)
2. 가이드라인(UGC 1.2 등) 준수 확인 후, 필요 시에만 **「iOS에서 커뮤니티 숨기기」** 원버튼 클릭  
   → CLIENT(`CLT_COMMUNITY`)·CONSULTANT(`CST_COMMUNITY`)의 **iOS만** OFF. Android·웹 불변.
3. (세밀 조정 시) 역할 칩에서 행별 iOS|Android Switch로 개별 조정 — 일괄 저장 없음(즉시 적용)
4. `X-Client-Platform: ios` 로 LNB 조회 시 커뮤니티 없음 · `android`/`web` 은 정책대로 유지 확인
5. Expo iOS 더보기에서 커뮤니티 미노출, `/community` 딥링크는 더보기/대시보드로 복귀
6. 로그인 후 **EULA 동의** 화면(무관용·24h·학대 금지) 및 `/legal/eula` 링크 확인
7. iPad Air 11" 시뮬: portrait letterbox · `supportsTablet` + `requireFullScreen` + `TabletContentShell` · 가로 회전 잠금 확인

> **금지**: Flyway/시드로 `CLT_COMMUNITY`/`CST_COMMUNITY` 사전 OFF (#988).  
> 심사 시 숨김은 Admin 원버튼(또는 행 Switch)만 사용.

## 심사 후

1. 동일 Admin 화면에서 **「iOS에서 커뮤니티 다시 보이기」** 원버튼 클릭
2. iOS LNB/더보기에 커뮤니티 복귀 확인 (Android·웹은 원버튼 영향 없음)

## ASC / Org / 권한 무관 유지 항목 (코드로 fake 금지)

- Guideline **5.1.1(ix)**: Apple Developer **Individual → Organization** 계정 전환 후 재제출 (코드·빌드 플래그로 우회 불가)
- ASC 연령 등급 **17+**(또는 정책상 18+) 메타 갱신
- ASC EULA URL · Privacy Policy URL · Review Notes(동의·신고·차단·메뉴 OFF 동선)
- 인앱 EULA 게이트 + `/legal/eula` zero-tolerance 문구
- iPad: `supportsTablet` + `requireFullScreen` + letterbox/`TabletContentShell`

## 하드 게이트 금지 (deprecated)

- `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / EAS production 플래그 **사용 금지**
- 심사마다 소스에서 메뉴 hide **금지** — Admin RoleMenuPermission(원버튼 또는 행 Switch)만 사용
- 구 문서: `APP_STORE_REVIEW_MODE_PLAN_20260911.md` (폐기 안내만 유지)
