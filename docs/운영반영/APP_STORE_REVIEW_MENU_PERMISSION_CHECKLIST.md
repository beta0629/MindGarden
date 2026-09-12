# App Store 심사 — 메뉴 권한(RBAC) 운영 체크리스트

> SSOT 기획: `docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`  
> iOS/AOS 이중 스위치: `docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md`  
> Individual 재제출 전략: `docs/project-management/INDIVIDUAL_ACCOUNT_IOS_MENU_PRESET_ORCHESTRATION_20260912.md`  
> **금지**: `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / 빌드 extra 심사 플래그 / 소스 하드코딩 hide.

---

## Individual 계정 재제출 — iOS 메뉴 OFF 목록

### 정직성 고지 (필독)

Guideline **5.1.1(ix)**는 Apple Developer가 **Individual**인 한, 앱이 **심리상담·민감 건강 서비스**로 인식되면 **메뉴 숨김만으로 재거절될 수 있다**.  
Admin 플랫폼 게이트는 **UGC·부가 민감 표면을 줄여 리스크를 낮추는 운영 전략**이며, **Organization 전환의 법적·심사 대체재가 아니다**.  
Organization을 당장 진행할 수 없어 Individual로 재제출할 때, **메뉴로 막을 수 있는 범위만** 아래 절차로 준비한다.

### 전제

1. iOS / Android **이중** `canView`(또는 `can_view_ios` / `can_view_android`)가 배포되어 있어야 한다.  
2. Expo는 `X-Client-Platform`으로 **자기 플랫폼 플래그만** 적용한다. (`Platform.OS`로 메뉴 hide 금지.)

### 최소 — iOS OFF / Android ON (필수)

| 역할 | 메뉴 | menuCode | iOS | Android | 웹(권장) |
|------|------|----------|-----|---------|----------|
| CLIENT | 커뮤니티 (UGC) | `CLT_COMMUNITY` | **OFF** | **ON** | ON |
| CONSULTANT | 커뮤니티 (UGC) | `CST_COMMUNITY` | **OFF** | **ON** | ON |

Admin 절차:

1. 통합 사용자 관리 → **앱 메뉴 노출** (`/admin/menu-permissions`)
2. **내담자(CLIENT)** → **커뮤니티** → **iOS Switch OFF**, **Android Switch ON** (즉시 적용)
3. **상담사(CONSULTANT)** → 동일
4. (프리셋 UI가 있으면) 「Individual 심사 프리셋」으로 위 목록만 일괄 적용 — **Android는 끄지 않음**
5. 검증: `X-Client-Platform: ios` LNB에 커뮤니티 없음 · `android` LNB에는 있음

### 코어 유지 — 끄지 말 것

예약 · 홈 · 내 상담/회기 · 스케줄 · 메시지 · 알림 · 프로필/설정 등 **코어 비즈·운영 메뉴**.  
끄면 심사 계정에 앱이 **빈 껍데기**로 보인다.

### 추가 OFF 후보

explore 확정 표(`INDIVIDUAL_ACCOUNT_…` §4)를 따른다. 웰니스 등 **건강 인식 가중** 표면은 함부로 OFF하지 않는다.  
메뉴로 못 막는 항목(ASC 메타·온보딩 카피)은 별도 운영 판단.

### 심사 후 / Organization 준비 후

1. Admin에서 해당 메뉴 **iOS만 다시 ON** (Android는 이미 ON 유지)
2. Org 계정 전환 후 재제출 시에도 동일 화면에서 iOS 노출을 복구하면 된다

---

## 심사 전 (공통 · EULA · iPad)

1. 위 Individual iOS OFF 목록 적용(이중 스위치 미배포 시에는 레거시 단일 OFF로 커뮤니티만 — **임시**, AOS까지 죽을 수 있음 → 이중 스위치 우선 배포)
2. EULA 동의(무관용·24h·학대 금지) 및 `/legal/eula` 확인
3. iPad Air 11" 계열: letterbox / `requireFullScreen` / portrait 정책 확인
4. ASC: 연령 **17+**(또는 정책상 18+), EULA·Privacy URL, Review Notes

## 심사 후

1. 커뮤니티 등 **iOS Switch ON** (필요 시)
2. LNB/더보기 복귀 확인

## ASC / Org (코드로 fake 금지)

- **5.1.1(ix) Organization 전환** — Individual 유지 시 재거절 리스크 **잔존**(정직성 고지)
- ASC 메타·Review Notes는 코드 밖

## 하드 게이트 금지 (deprecated)

- `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / EAS production 플래그 **사용 금지**
- 심사마다 소스에서 메뉴 hide **금지** — Admin RoleMenuPermission 플랫폼별 canView만 사용
- 구 문서: `APP_STORE_REVIEW_MODE_PLAN_20260911.md` · `APPLE_FOLLOWUP_ORCHESTRATION_20260912.md`(리다이렉트)
