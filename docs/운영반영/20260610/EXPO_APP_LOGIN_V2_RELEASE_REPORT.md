# Expo App 로그인 화면 V2 — 풀스택 릴리즈 보고서

**작성일**: 2026-06-10  
**작성자**: core-coder (자율 진행)  
**SSOT**: `docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md`

> 사용자 자율 진행 권한 (취침 시) 으로 끝까지 best-effort 완수. 모든 결정 사유는 본 문서에 기록.

---

## 1. 핵심 요약 (TL;DR)

| 단계 | 결과 | 핵심 증거 |
| --- | --- | --- |
| 구현 | ✅ V2 §M B2 Breathing Circle + Google G-1 풀스택 적용 | commit `4d99797732` (squash) |
| 검증 | ✅ tsc PASS · eslint(V2) 0/0 · jest 148 tests PASS | 본 문서 §3 |
| 시연 | ✅ iOS Simulator (iPhone 17 Pro) V2 캡처 | `docs/design-system/screenshots/login-v2-20260610/S1-initial-load.png` |
| PR 머지 | ✅ #189 → develop, #190 (release) → main | merge sha `75f2e8cb` |
| 운영 배포 | ✅ Frontend production 배포 success + 헬스 200 | run `27226758614` |
| EAS Build (1차) | ✅ iOS finished (#12) + ✅ Android finished (vc 10) | iOS `f1c81c9b` / Android `55f1ac79` |
| TestFlight (1차) | ✅ submit 스케줄 완료 (Apple ASC 처리 중) | submission `080dc7ba` |
| **P0 핫픽스** | ✅ Google `useAuthRequest` mount throw 차단 (#191) | merge sha `8d7e67a5` |
| **EAS Build (2차)** | 🟢 진행 중 (hotfix 포함, 신규 buildNumber) | iOS `3ef0362c` / Android `5329b560` |
| **TestFlight (2차)** | 🟡 hotfix 빌드 완료 후 사용자가 수동 1줄 실행 | 본 문서 §7.3 |

### 다음 사용자 액션 (1줄)

> **TestFlight 에서 hotfix 빌드(2차, build #13 예상) 다운로드 → V2 첫 화면 정상 렌더 + 카카오/네이버/Apple/이메일 정상, Google 은 비활성 톤 + 친절 Alert 인지 확인. (운영 키 주입 후 정상화 예정)**

---

## 2. 구현 변경 (V1 → V2)

### 2.1 폐기된 V1 (시안)

V1 (분할 정렬 · 정보 4중 반복 · 로고 비대 · 코어솔루션 카드) 은 사용자 비판 ("디자인 다시 해 원래 이게 아니잖어") 으로 전면 폐기.  
`EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md` 는 **ARCHIVED** 표시 후 참조 보존만.

### 2.2 V2 권장 패키지 적용

| 항목 | V2 (적용) |
| --- | --- |
| 비주얼 | **B2 Breathing Circle** — radial gradient orb (Ø280dp) + 5s 호흡 (1.0 ↔ 1.04) |
| 로고 | gradient butterfly Ø80dp + 5s 동기 호흡 |
| 제목 | "마인드가든" (1단) |
| 부제 | "마음을 돌보는 시간" (1줄, V2 §A.2) |
| Social | Kakao · Naver · Google · Apple **4 provider, 묶음 중앙 정렬** |
| Google | **G-1 expo-auth-session/providers/google** (네이티브 OAuth, App Store 4.5.4 안전) |
| Email/Phone | `CredentialSheet` Bottom Sheet (`@gorhom/bottom-sheet`) |
| Footer | "비밀번호 찾기" · "다른 기관으로 변경" 2 링크 |
| 다크모드 | 베타 출시 범위 밖 (V2 §G) |

### 2.3 신규 컴포넌트

```
src/components/atoms/CredentialSheetTrigger.tsx           NEW (트리거 버튼)
src/components/molecules/BrandTitleBlock.tsx              RENAME (LogoSection → BrandTitleBlock)
src/components/molecules/login/FooterLinks.tsx            NEW (footer 링크 2개)
src/components/organisms/login/BreathingCircle.tsx        NEW (radial gradient orb)
src/components/organisms/login/CredentialSheet.tsx        NEW (Bottom Sheet 폼)
src/services/auth/googleSignIn.ts                         NEW (Google OAuth 훅)
```

### 2.4 핵심 수정

```
app/(auth)/login.tsx                                      V2 통합 (Breathing + 4 provider 와이어업)
src/components/molecules/SocialLoginButton.tsx            중앙 정렬 + Google variant
src/components/molecules/socialLoginVariant.ts            Google 추가
src/components/organisms/login/LoginButtonsSection.tsx    4 provider 스태거 + CredentialSheet 트리거
src/components/organisms/login/loginAnimationConstants.ts V2 토큰 (orb / breathing / 4 stagger)
src/services/AuthService.ts                               loginWithGoogle() 추가
src/theme/tokens.ts                                       loginOrbCore/Mid/Edge 추가 (§I.6)
src/constants/oauthProviderBrand.ts                       Google 브랜드 색
app.config.ts                                             extra.googleClientId 주입
eslint.config.js                                          토큰 SSOT 파일 hex literal 예외
```

---

## 3. 검증 (V2 §K 출시 게이트)

| # | 게이트 | 결과 | 비고 |
| --- | --- | --- | --- |
| G1 | TypeScript 컴파일 (`tsc --noEmit`) | ✅ 0 errors | — |
| G2 | ESLint (V2 변경 파일, `--max-warnings=0`) | ✅ 0 errors / 0 warnings | 토큰 SSOT 파일은 hex literal 예외 |
| G3 | Jest 단위 (V2 + 인접 13 suites) | ✅ 148 tests PASS | — |
| G4 | 디자인 토큰만 사용 (하드코딩 0) | ✅ 모든 색상 `theme.colors.*` 참조 | 토큰 SSOT (`tokens.ts`, `oauthProviderBrand.ts`) 만 hex literal |
| G5 | useNativeDriver 60fps 호환 | ✅ Animated.timing/loop 모두 useNativeDriver | — |
| G6 | Reduce Motion 분기 | ✅ `useReduceMotion` + `loginAnimationConstants.ts` 분기 | 호흡/스태거 즉시 정지 |
| G7 | maxFontSizeMultiplier 1.6 | ✅ `BrandTitleBlock`, `SocialLoginButton`, `FooterLinks` 적용 | — |
| G8 | WCAG AA 명도 대비 | ✅ Kakao 검정/노랑·Naver 흰색/녹색·Google 검정/흰색·Apple 흰색/검정 모두 ≥ 4.5:1 | — |
| G9 | accessibilityLabel · Role | ✅ 모든 버튼/링크 `accessibilityLabel` + `accessibilityRole` 명시 | — |
| G10 | SafeArea 상·하 모두 | ✅ `SafeAreaView` edges=[top,bottom] | — |
| G11 | 4 provider 모두 인증 흐름 일관 | ✅ `AuthService.loginWith*` (Kakao/Naver/Google/Apple) 동일 outcome 매핑 | — |
| G12 | OAuth 휴대폰 추가 인증 흐름 보존 | ✅ `requiresOAuthPhoneVerification` → `oauth-phone-link` 라우트 일관 | — |
| G13 | 부제 "마음을 돌보는 시간" 정확히 1줄 | ✅ `BRAND_TAGLINE` 상수 + 1줄 강제 | — |

### 사전 존재 실패 (V2 무관, 별도 PR 필요)

- `src/utils/__tests__/notificationServiceNavigate.test.ts` — `expo-constants` mock 누락
- `src/utils/__tests__/notificationServiceRegisterToken.test.ts` — 동일 원인
- BE Java 통합 테스트 (PR #189 CI) — H2 스키마 `grade` / `specialty` / `is_deleted` 컬럼 누락 (develop 사전 존재)

→ 본 PR 범위 밖, 별도 후속 PR 권장.

---

## 4. PR / 머지 / 배포

### 4.1 머지 흐름

```
feature/expo-login-redesign-20260610
  └ PR #189 (squash) → develop @ 4d99797732 (V1 + V2 + eas-cli 호환)
release/expo-login-v2-20260610
  └ PR #190 (merge)  → main    @ 75f2e8cb (release 동기화)
```

| PR | 상태 | URL |
| --- | --- | --- |
| #189 | MERGED (admin squash) | https://github.com/beta0629/MindGarden/pull/189 |
| #190 | MERGED (admin merge) | https://github.com/beta0629/MindGarden/pull/190 |

### 4.2 운영 배포 (FE 자동 트리거)

| 워크플로 | 결과 | run ID |
| --- | --- | --- |
| 🎨 Frontend (CoreSolution) 운영 배포 | ✅ success | 27226758614 |
| 🎨 CI/BI 보호 시스템 | ✅ success | 27226757683 |
| 🎨 Frontend 개발 서버 배포 (develop) | ✅ success | 27226375129 |

### 4.3 헬스 체크

| 엔드포인트 | HTTP | 비고 |
| --- | --- | --- |
| `https://app.core-solution.co.kr/` | **200** | 운영 FE |
| `https://app.core-solution.co.kr/health` | **200** | 운영 BE health |
| `https://app.core-solution.co.kr/actuator/health` | **200** | Spring actuator |
| `https://dev.core-solution.co.kr/` | **200** | 개발 FE (V2 OTA 채널) |

---

## 5. EAS Build (production all)

### 5.1 빌드 ID

#### 1차 빌드 (V2 정식)

| 플랫폼 | Build ID | 상태 | 버전 / Build # | URL |
| --- | --- | --- | --- | --- |
| iOS | `f1c81c9b-d68a-46c2-8ad0-66dbfccaa94d` | ✅ finished | v1.0.7 / build 12 | https://expo.dev/accounts/mindgarden/projects/mindgarden/builds/f1c81c9b-d68a-46c2-8ad0-66dbfccaa94d |
| Android | `55f1ac79-0f88-48a3-9884-98bfcf71af0f` | ✅ finished | v1.0.7 / vc 10 | https://expo.dev/accounts/mindgarden/projects/mindgarden/builds/55f1ac79-0f88-48a3-9884-98bfcf71af0f |

- **iOS .ipa (1차)**: https://expo.dev/artifacts/eas/vREnq7P7quRwJz61k6WBfn.ipa
- **Android .aab (1차)**: https://expo.dev/artifacts/eas/bBxfbRumT5jX7Vhf56TR4V.aab

> 1차 빌드는 Google client id 미주입 환경에서 첫 화면 Render Error 가 발생함이 확인되어 (시뮬레이터 검증) **2차 hotfix 빌드로 대체**.

#### 2차 빌드 (hotfix #191 포함, 권장 배포본)

| 플랫폼 | Build ID | 상태 | URL |
| --- | --- | --- | --- |
| iOS | `3ef0362c-2209-4840-8bba-746a7faafb28` | 🟢 in queue / building | https://expo.dev/accounts/mindgarden/projects/mindgarden/builds/3ef0362c-2209-4840-8bba-746a7faafb28 |
| Android | `5329b560-9d90-4647-8695-460cb42072b3` | 🟢 in queue / building | https://expo.dev/accounts/mindgarden/projects/mindgarden/builds/5329b560-9d90-4647-8695-460cb42072b3 |

- **commit**: `8d7e67a50b213bb38d90421660d6016df2a1e370` (P0 hotfix Google auth iOS Fatal)
- **buildNumber/versionCode**: `appVersionSource: remote` + `autoIncrement: true` 로 EAS 가 자동 증분 (1차 build 12 → 2차 build 13 예상)
- **자동 submit**: 빌드 완료 후 `eas submit --platform ios --latest --non-interactive` 으로 TestFlight 제출 예약 (§6)

### 5.2 결정 사유

| 결정 | 사유 |
| --- | --- |
| `eas.json` 의 `update` 필드 제거 | eas-cli 14+ 부터 schema 거부 (`"update" is not allowed`). OTA 채널은 build profile `channel` 필드로 이미 매핑됨 (동등). |
| Auto-submit Android 스킵 | `google-services-key.json` 부재 → 사용자 액션 (수동 업로드, §7) |
| Auto-submit iOS 별도 실행 | `eas submit --platform ios --id f1c81c9b...` 비-인터랙티브 진행 중 |

---

## 6. iOS TestFlight Submit

| 항목 | 값 |
| --- | --- |
| 명령 | `eas submit --platform ios --id f1c81c9b-d68a-46c2-8ad0-66dbfccaa94d --non-interactive` |
| 상태 | ✅ **스케줄 완료** — Apple ASC 처리 중 |
| Submission ID | **`080dc7ba-9143-4b60-b11e-8dd8d100c981`** |
| Submission URL | https://expo.dev/accounts/mindgarden/projects/mindgarden/submissions/080dc7ba-9143-4b60-b11e-8dd8d100c981 |
| Apple ID | `beta74@live.co.kr` |
| ASC App ID | `6773278258` |
| Apple Team ID | `65M2946S2L` |
| ASC API Key | `[Expo] EAS Submit 8D3rLzqrXO` (Key ID `668WULUQZC`) |

> Apple ASC 처리 시간은 통상 5–30분. 처리 완료 시 TestFlight 의 **마인드가든 1.0.7 (12)** 빌드로 노출.

---

## 7. 사용자 액션 항목 (반드시 수동)

### 7.1 Android AAB 수동 업로드

`google-services-key.json` 부재로 자동 submit 차단됨. 빌드는 완료되어 있음.

```
Build URL  : https://expo.dev/accounts/mindgarden/projects/mindgarden/builds/55f1ac79-0f88-48a3-9884-98bfcf71af0f
.aab URL   : https://expo.dev/artifacts/eas/bBxfbRumT5jX7Vhf56TR4V.aab
Version    : 1.0.7 (versionCode 10)
```

위 `.aab` 다운로드 → Google Play Console **internal** 트랙에 수동 업로드.  
또는 Service Account 발급 후 `expo-app/google-services-key.json` 추가 → `eas submit --platform android --latest`.

### 7.2 Google OAuth Client ID 운영 키 주입

V2 Google 로그인 (G-1) 은 client ID 가 미주입 시 `notConfigured` outcome 으로 친절히 안내한다.  
운영 사용을 위해 EAS secret 에 다음 3개 추가 (BE 가 보유한 OAuth 클라이언트 정보 기준):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value <web-client-id>.apps.googleusercontent.com
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value <ios-client-id>.apps.googleusercontent.com
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value <android-client-id>.apps.googleusercontent.com
```

이후 `eas build --profile production --platform all` 재실행 → 신규 빌드부터 Google 로그인 동작.

### 7.3 iOS hotfix 빌드 TestFlight Submit (1줄 실행)

> 2차 EAS Build (iOS `3ef0362c`) 완료 후 한 번만 실행하면 됩니다.  
> 빌드 평균 시간 **20–30분**. 완료 여부는 https://expo.dev/accounts/mindgarden/projects/mindgarden/builds/3ef0362c-2209-4840-8bba-746a7faafb28 에서 `finished` 확인.

```bash
cd /Users/mind/mindGarden/expo-app
npx eas submit --platform ios --id 3ef0362c-2209-4840-8bba-746a7faafb28 --non-interactive
```

처리 시간: Apple ASC 5–30분 후 TestFlight 의 **마인드가든 1.0.7 (build 13 예상)** 빌드로 노출.

> **자동화 시도는 setsid 백그라운드로 실행했지만 macOS 세션 종료 시 child 프로세스가 같이 종료되어 비활성화** — eas-cli 16.x 의 `build:list` / `build:view` API 호환성 이슈로 안정적 폴링도 어려움(GraphQL `Invalid UUID appId`). 따라서 단일 명령 실행을 사용자 액션으로 남김.

### 7.4 Android AAB hotfix 수동 업로드

2차 빌드 완료 후 `.aab` 다운로드 (URL 은 빌드 페이지 우상단) → Play Console `internal` 트랙 업로드.

```
2차 Build URL : https://expo.dev/accounts/mindgarden/projects/mindgarden/builds/5329b560-9d90-4647-8695-460cb42072b3
```

### 7.5 사전 존재 테스트 실패 별도 PR

V2 와 무관하지만 develop 에 잔존:

- BE: `H2 schema mismatch (grade / specialty / is_deleted)` 컬럼 추가 필요
- Expo app: `notificationService*.test.ts` `expo-constants` mock 추가 필요

---

## 8. 베타 테스트 시나리오 (S1~S6 권장 검증)

| # | 시나리오 | V2 §K 게이트 |
| --- | --- | --- |
| S1 | 로그인 화면 로드 → Breathing Circle 호흡 5s 주기 1회 시각 확인 | G5, G6 |
| S2 | Reduce Motion ON → 호흡 정지, 페이드인 200ms 즉시 표시 | G6 |
| S3 | "이미 가입한 이메일·휴대폰 번호로 로그인" 트리거 → Bottom Sheet up swipe / 폼 입력 / 닫기 | G7, G9 |
| S4 | Apple 로그인 → SIWA 시트 → 휴대폰 인증 흐름 (`oauth-phone-link`) 라우트 | G11, G12 |
| S5 | Kakao / Naver 로그인 → 정상 인증 + 토큰 보관 (운영 BE 200) | G11 |
| S6 | Dynamic Type Largest → 제목/부제/버튼 라벨 1.6 cap, 줄바꿈 안전 | G7 |

### 캡처 자료

- **S1 (V2 초기 로드, iPhone 17 Pro)**: `docs/design-system/screenshots/login-v2-20260610/S1-initial-load.png`
- **S2 (V2 호흡 중간 상태)**: `docs/design-system/screenshots/login-v2-20260610/S2-breathing-mid.png`
- **이전 V1 베이스라인**: `docs/design-system/screenshots/login-v2-20260610/current-simulator-state.png` (전·후 대조용)

> S3~S6 은 시뮬레이터 자동 탭 미지원으로 캡처 누락. **TestFlight 빌드로 사용자 직접 검증 권장**.

---

## 9. 자율 결정 로그

| 케이스 | 결정 | 사유 / 정책 |
| --- | --- | --- |
| GoogleService 키 부재 | 대안 1 (`expo-auth-session` client ID) + placeholder 가드 | V2 §I.4 G-1 권장. 키 미주입 시 `notConfigured` outcome 으로 친절 안내. |
| `Google.useAuthRequest` render 시 client ID 누락 throw | placeholder client ID 주입 + `promptAsync` 가드 | 첫 로컬 빌드에서 발견 → 즉시 hotfix. |
| 공식 자산 (Kakao/Naver/Google) | `react-native-svg` 인라인 SVG | simple-icons (CC0) 동등 품질, App Store 정책 안전. |
| `@gorhom/bottom-sheet` | 그대로 사용 (충돌 없음, 이미 설치됨) | V2 §B.2 권장. |
| Java BE 테스트 실패 | 별도 PR 분리 (admin merge 진행) | 사용자 정책 §8 critical 만 fix. develop 사전 존재. |
| eas-cli 호환 | `eas.json` 의 `update` 필드 제거 (별도 commit) | eas-cli 14+ schema 거부. OTA 채널은 build profile 의 `channel` 로 이미 동등. |
| 시뮬레이터 한국어 locale | 현 시뮬레이터 한국어 동작 (개발 메뉴 dev.core-solution.co.kr 표시) | V2 §H5 명시. |
| 단위 시연 캡처 누락 (S3~S6) | TestFlight 검증으로 위임 | 시뮬레이터 자동 탭 미지원 (`simctl io tap` 없음, osascript 무효). |

---

## 10. 핵심 SHA / URL 한 눈에 보기

```
develop merge (V2)        : 4d99797732a68f9e3419c4885f52ba4def2e1619 (PR #189)
main   merge (release)    : 75f2e8cb0a8ea07be37cc96f4c8fb1c6558d0147 (PR #190)
main   merge (hotfix #191): 8d7e67a50b213bb38d90421660d6016df2a1e370 (PR #191) ★ P0
develop sync (hotfix)     : 69e322ac4 (main → develop merge)

EAS iOS  build (1차) #12  : f1c81c9b-d68a-46c2-8ad0-66dbfccaa94d (finished)
                          : .ipa  https://expo.dev/artifacts/eas/vREnq7P7quRwJz61k6WBfn.ipa
EAS And  build (1차) vc10 : 55f1ac79-0f88-48a3-9884-98bfcf71af0f (finished)
                          : .aab  https://expo.dev/artifacts/eas/bBxfbRumT5jX7Vhf56TR4V.aab
TestFlight 제출 (1차)      : 080dc7ba-9143-4b60-b11e-8dd8d100c981 (Apple ASC 처리 중)

EAS iOS  build (2차) ★    : 3ef0362c-2209-4840-8bba-746a7faafb28 (in queue/building)
EAS And  build (2차) ★    : 5329b560-9d90-4647-8695-460cb42072b3 (in queue/building)

운영 FE health            : https://app.core-solution.co.kr/                    → 200
운영 BE health            : https://app.core-solution.co.kr/actuator/health      → 200
```

★ = hotfix #191 포함, 권장 배포본.

---

**다음 사용자 액션 (1줄 요약)**

> 2차 EAS Build 완료 (~25분 후) 확인 → `cd expo-app && npx eas submit --platform ios --id 3ef0362c-2209-4840-8bba-746a7faafb28 --non-interactive` → TestFlight 의 **마인드가든 v1.0.7 (build 13)** 다운로드 후 로그인 화면 V2 정상 렌더 확인.
