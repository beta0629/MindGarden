# App Store 심사 — 메뉴 권한(RBAC) 운영 체크리스트

> SSOT 기획: `docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`  
> iOS/AOS 이중 스위치: `docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md`  
> Individual 재제출 전략: `docs/project-management/INDIVIDUAL_ACCOUNT_IOS_MENU_PRESET_ORCHESTRATION_20260912.md`  
> **금지**: `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / 빌드 extra 심사 플래그 / 소스 하드코딩 hide.  
> **정책(2026-09-12 확정)**: 위험한 건 다 막고 → 출시 → 이후에 기능 추가 검토. iOS만 조이되 AOS는 끄지 않음.

---

## 출시 전 iOS OFF 목록 (확정 · 시드)

### 정직성 고지 (필독)

Guideline **5.1.1(ix)**는 Apple Developer가 **Individual**인 한, 앱이 **심리상담·민감 건강 서비스**로 인식되면 **메뉴 숨김만으로 재거절될 수 있다**.  
Admin 플랫폼 게이트는 **UGC·부가 민감 표면을 줄여 출시 가능성을 극대화**하는 운영 전략이며, **Organization 전환의 법적·심사 대체재가 아니다**(완전 회피 보장 불가).

### 전제

1. iOS / Android **이중** `can_view_ios` / `can_view_android`가 배포되어 있어야 한다. (`cursor/menu-visibility-ios-android-96b3`)
2. Expo는 `X-Client-Platform`으로 **자기 플랫폼 플래그만** 적용한다. (`Platform.OS`로 메뉴 hide 금지.)
3. **Android는 이미 통과** → `can_view_android`는 기존/true 유지. iOS만 OFF.

### 시드 확정 — iOS OFF / Android ON / 웹 ON

| 역할 (`name_en`) | 메뉴 | menuCode | can_view_ios | can_view_android | can_view(웹) | 근거 |
|------------------|------|----------|--------------|------------------|--------------|------|
| CLIENT | 커뮤니티 (UGC) | `CLT_COMMUNITY` | **0 (OFF)** | **1 (ON)** | **1** | 공개 피드·게시/댓글 — Apple 1.2 UGC |
| CONSULTANT | 커뮤니티 (UGC) | `CST_COMMUNITY` | **0 (OFF)** | **1 (ON)** | **1** | 동일 |

커뮤니티 부속(차단 사용자·딥링크)은 별도 menuCode 없음 → `CommunityFeatureGate`로 커뮤니티와 **동묶음 숨김**.

Admin 절차:

1. 통합 사용자 관리 → **앱 메뉴 노출** (`/admin/menu-permissions`)
2. **내담자(CLIENT)** → **커뮤니티** → **iOS Switch OFF**, **Android Switch ON**
3. **상담사(CONSULTANT)** → 동일
4. (프리셋 UI가 있으면) 「Individual 심사 프리셋」— **위 목록만**, Android는 건드리지 않음
5. 검증: `X-Client-Platform: ios` LNB에 커뮤니티 없음 · `android` LNB에는 있음

Flyway 시드 참고: `V20260912_002__role_menu_permissions_can_view_ios_android.sql`  
(#986 양쪽 OFF 시드가 있으면 본 시드가 **ios=0 / android=1 / web=1** 로 정정)

### 코어 유지 — 끄지 말 것 (시드에 넣지 않음)

| 표면 | 역할 | 비고 |
|------|------|------|
| 홈 | CLIENT / CONSULTANT | 탭 |
| 예약 / 상담신청 | CLIENT | `(booking)` |
| 내 상담 · 회기 · 결제 | CLIENT | 탭 + 더보기 |
| 스케줄 · 내담자 · 기록 · 가능시간 | CONSULTANT | 탭·더보기 |
| 메시지 · 알림 센터 | CLIENT / CONSULTANT | 필수 운영 통신 |
| 프로필 · 앱 설정 · 로그인 | 동일 | EULA·계정 경로 |
| 온라인 쇼핑 | CLIENT | 테넌트 플래그 별도. 본 배치 RoleMenu 시드 **제외**(유지) |
| 상담사 수신함·KPI·급여 | CONSULTANT | 1:1 운영 도구. 공개 UGC 아님 → **유지** |

### 출시 후 재개 검토 (TODO · OPS)

| 우선 | 표면 | 현재 | 재개 조건 |
|------|------|------|-----------|
| P0 | `CLT_COMMUNITY` / `CST_COMMUNITY` | iOS OFF | Admin에서 **iOS Switch ON** (Android는 이미 ON) |
| P1 | 웰니스 탭 허브(명상·심리교육·마음날씨·무드·자가점검·힐링피드) | **menuCode 없음** → RBAC로 못 끔 | 출시 후 `CLT_WELLNESS`(가칭) 등 menuCode·탭 게이트 도입 후 **iOS OFF 후보로 재검토** |
| P2 | ASC 메타·온보딩 카피 | 메뉴 밖 | 카피·스크린샷 완화는 별 트랙 |
| — | Organization 계정 | 코드 밖 | 준비되면 Org 전환 후 재제출 + iOS 메뉴 재ON |

---

## 심사 전 (공통 · EULA · iPad)

1. 위 **출시 전 iOS OFF 목록** 적용(이중 스위치 미배포 시 레거시 단일 OFF는 AOS까지 죽을 수 있음 → **이중 스위치 우선 배포**)
2. EULA 동의(무관용·24h·학대 금지) 및 `/legal/eula` 확인
3. iPad Air 11" 계열: letterbox / `requireFullScreen` / portrait 정책 확인
4. ASC: 연령 **17+**(또는 정책상 18+), EULA·Privacy URL, Review Notes

## 심사 후 / 기능 재개

1. 위 **출시 후 재개 검토** 표에 따라 Admin에서 **iOS만 ON**
2. LNB/더보기 복귀 확인 (`X-Client-Platform: ios`)

## ASC / Org (코드로 fake 금지)

- **5.1.1(ix) Organization 전환** — Individual 유지 시 재거절 리스크 **잔존**(정직성 고지)
- ASC 메타·Review Notes는 코드 밖

## 하드 게이트 금지 (deprecated)

- `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / EAS production 플래그 **사용 금지**
- 심사마다 소스에서 메뉴 hide **금지** — Admin RoleMenuPermission 플랫폼별 canView만 사용
- 구 문서: `APP_STORE_REVIEW_MODE_PLAN_20260911.md` · `APPLE_FOLLOWUP_ORCHESTRATION_20260912.md`(리다이렉트)
