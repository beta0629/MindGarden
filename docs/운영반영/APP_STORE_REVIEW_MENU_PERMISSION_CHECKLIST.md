# App Store 심사 — Apple 가이드라인 준수 확인 체크리스트

> SSOT 기획: `docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`  
> iOS/AOS 이중 Switch(운영 도구): `docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md`  
> Individual 재제출·준수 확인: `docs/project-management/INDIVIDUAL_ACCOUNT_IOS_MENU_PRESET_ORCHESTRATION_20260912.md`  
> **금지**: `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / 빌드 extra 심사 플래그 / 소스 하드코딩 hide.  
> **정책(2026-09-12 개정)**: **기능을 사전 차단하지 않는다.** 심사·재제출 전에는 **Apple 가이드라인 준수 여부만 미리 확인**한다.  
> **철회**: 「커뮤니티 OFF 시드 / 위험 메뉴 일괄 숨김」전략 — **사용 금지**.

---

## 준수 확인 항목 (심사 전 · 필수)

출시·재제출 전 아래만 확인한다. **메뉴를 미리 끄거나 시드로 숨기지 않는다.**

### EULA · 콘텐츠 정책

- [ ] 인앱 **EULA · 콘텐츠 정책** (`/legal/eula`) 링크·화면 동작
- [ ] zero-tolerance(학대·혐오 등)·신고·조치 문구가 약관/EULA에 반영
- [ ] 필요 시 동의 게이트(무관용·24h 등) 동작 확인

### 연령 · ASC 메타 (17+)

- [ ] ASC 연령 **17+**(정책상 18+면 그에 따름)
- [ ] Privacy URL · EULA URL · Review Notes 기재
- [ ] 앱 설명·스크린샷이 실제 기능과 일치(과장·의료 오인 카피 점검)

### iPad (Guideline 4 / G4)

- [ ] `supportsTablet` / letterbox / `requireFullScreen` / portrait 정책 확인
- [ ] iPad Air 11" 계열 등 대상 기기에서 레이아웃·크래시 스모크

### UGC 안전장치 (1.2 Safety · 커뮤니티 노출 유지 전제)

- [ ] 커뮤니티(UGC)가 **노출되는 상태**에서 차단·신고·검수·딥링크 가드 등 안전장치 동작
- [ ] EULA zero-tolerance와 UGC 플로우 연결 확인
- [ ] **사전 OFF로 우회하지 않음** — 준수는 안전장치·약관으로 확인

### Organization · 5.1.1(ix) 리스크 (정직성)

- [ ] Apple Developer가 **Individual**이면 Guideline **5.1.1(ix)** 재거절 리스크가 **잔존**함을 인지
- [ ] 메뉴 숨김·시드는 **Org 요구의 대체재가 아님**(완전 회피 보장 불가)
- [ ] Org 전환은 코드 밖 절차 — 준비되면 별도 트랙

---

## 메뉴 이중 Switch (운영 도구 · 기본 숨김 시드 금지)

| 항목 | 정책 |
|------|------|
| **역할** | Admin `/admin/menu-permissions`의 **iOS \| Android 이중 Switch**는 **운영 중 필요할 때만** 끄는 도구 |
| **기본값** | Flyway·시드로 커뮤니티 등 **기본 숨김(ios=0 등) 금지**. 신규·마이그레이션 시 기존 `can_view`를 플랫폼 컬럼에 **동일 복사** |
| **심사 대응** | 심사 전 **일괄 OFF / Individual 프리셋 원클릭 숨김 금지**. 준수 확인 항목만 수행 |
| **하드코딩** | `Platform.OS`로 메뉴 hide · `APP_STORE_REVIEW_MODE` **금지** |

운영 예시(필요 시에만):

1. 통합 사용자 관리 → **앱 메뉴 노출** (`/admin/menu-permissions`)
2. 역할·메뉴별 **iOS / Android Switch**를 운영 판단에 따라 토글(즉시 grant)
3. Expo는 `X-Client-Platform`으로 **자기 플랫폼 플래그만** 적용

---

## ASC / Org (코드로 fake 금지)

- **5.1.1(ix) Organization 전환** — Individual 유지 시 재거절 리스크 **잔존**
- ASC 메타·Review Notes는 코드 밖

## 하드 게이트 금지 (deprecated)

- `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / EAS production 플래그 **사용 금지**
- 심사마다 소스에서 메뉴 hide **금지** — Admin RoleMenuPermission 플랫폼별 canView만 사용(운영 시)
- 구 문서: `APP_STORE_REVIEW_MODE_PLAN_20260911.md` · `APPLE_FOLLOWUP_ORCHESTRATION_20260912.md`(리다이렉트)
- **구 전략** 「출시 전 iOS OFF 목록 · 커뮤니티 시드 OFF」는 **철회됨** — 본 문서 준수 확인 섹션만 사용
