# Android Google OAuth Setup — `expo-auth-session/providers/google`

P0 (2026-06-10) — Android standalone Google 로그인 native 정합 가이드.

본 문서는 코드 워커가 다룰 수 없는 **사용자 액션 항목** (Google Cloud Console / EAS keystore SHA-1) 을 정리한다.
코드 변경 내역은 [Android intent filter — `expo-app/app.config.ts`](#3-코드-변경-내역) 절을 참고.

---

## 1. 사전 확인 (현황 요약)

| # | 항목 | 현재 값 / 위치 | 비고 |
|---|---|---|---|
| 1 | `android.package` | `com.mindgardenmobile` (expo-app/app.config.ts) | Google Play 등록·Maestro flow·install 스크립트 모두 이 값에 묶여 있어 변경 금지 |
| 2 | iOS `bundleIdentifier` | `com.mindgarden.MindGardenMobile` (참고용 — iOS 영역) | 의도적으로 Android 패키지명과 다름 |
| 3 | `google-services.json` | expo-app/google-services.json (project_id `mindgarden-960d3`) | Firebase 프로젝트 OK — Android client package_name 일치 (`com.mindgardenmobile`) |
| 4 | EAS env `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | `57509114463-85fkq5henq2teqdmtrvimbhq92lsncgl.apps.googleusercontent.com` (이미 등록됨) | Google Cloud Console Android OAuth Client ID |
| 5 | Android OAuth callback intent filter | `com.mindgardenmobile` scheme (app.config.ts §android.intentFilters) | 본 P0 에서 추가 — expo-auth-session 의 `${applicationId}:/oauthredirect` 콜백 라우팅 |

---

## 2. Google Cloud Console — 사용자 액션

### 2.1 Android OAuth Client 확인 (필수)

1. https://console.cloud.google.com/apis/credentials 접속
2. 프로젝트가 `mindgarden-960d3` (project number `107853970458`) 인지 확인
3. **OAuth 2.0 Client IDs** 목록에서 Android 타입 클라이언트 클릭
4. 다음 항목 확인:
   - **Package name**: `com.mindgardenmobile` (app.config.ts 의 `android.package` 와 동일)
   - **SHA-1 fingerprint**: §2.2 에서 추출한 release/debug keystore SHA-1 모두 등록되어 있는지

### 2.2 SHA-1 fingerprint 추출

EAS 가 관리하는 release/debug keystore 의 SHA-1 fingerprint 를 출력:

```bash
cd expo-app
eas credentials --platform android --profile production
# → Production keystore 선택 → SHA-1 fingerprint 표시

eas credentials --platform android --profile development
# → Debug keystore 선택 → SHA-1 fingerprint 표시
```

또는 keystore 파일을 직접 다운로드해 `keytool` 로 확인:

```bash
# EAS dashboard → Project credentials → Android → Keystore Download
keytool -list -v -keystore <downloaded.jks> -alias <key alias>
# 출력 중 "SHA1: AA:BB:CC:..." 줄 복사
```

추출한 SHA-1 값을 **Google Cloud Console Android OAuth Client → SHA-1 certificate fingerprint** 에 등록.
release / debug 둘 다 등록해야 한다 (각각 다른 SHA-1 값).

### 2.3 Web Client ID / iOS Client ID 병존 확인

`expo-auth-session/providers/google` 는 Web · iOS · Android 3 종 client ID 를 platform 별로 분기 사용한다. Google Cloud Console 에 다음 3 개가 모두 존재해야 한다:

| 타입 | 환경변수 | 비고 |
|---|---|---|
| Web | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | FE 웹 검증·Expo proxy 폴백 |
| iOS | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Bundle ID `com.mindgarden.MindGardenMobile` |
| Android | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Package `com.mindgardenmobile` + SHA-1 |

3 개 중 하나라도 누락되면 해당 플랫폼에서 `isGoogleConfiguredForPlatform()` 가 false 를 반환해 로그인 버튼이 비활성 분기로 빠진다.

---

## 3. 코드 변경 내역 (본 P0 후속에서 적용)

### 3.1 `expo-app/app.config.ts`

1. `ANDROID_PACKAGE_ID` 상수 추출 — `android.package` + `intentFilters[].data[].scheme` 단일 SSOT.
2. `android.intentFilters` 신규 추가:

   ```ts
   intentFilters: [
     {
       action: 'VIEW',
       autoVerify: false,
       data: [{ scheme: ANDROID_PACKAGE_ID }],
       category: ['BROWSABLE', 'DEFAULT'],
     },
   ];
   ```

   이유: `expo-auth-session/providers/google` 의 Android native 흐름은 redirect URI 를
   `${Application.applicationId}:/oauthredirect` (= `com.mindgardenmobile:/oauthredirect`) 로
   자동 생성한다 (`expo-auth-session/src/providers/Google.ts` L227). 안드로이드는 Chrome
   Custom Tabs 결과를 `Linking.addEventListener('url', ...)` 폴리필
   (`expo-web-browser/src/WebBrowser.ts` `_waitForRedirectAsync`) 로 받기 때문에, deep-link
   scheme 이 `AndroidManifest.xml` 에 intent-filter 로 등록되어 있지 않으면 콜백 URL 이
   앱으로 라우팅되지 않고 Custom Tab 만 닫히면서 토큰이 누락된다. iOS 의
   `params=empty,auth=empty` (#15) 케이스와 동일 패턴의 P0.

3. 변경하지 않은 항목:
   - `android.package` 값 자체 (`com.mindgardenmobile`) — 운영 의존성 다수.
   - `googleServicesFile` 경로 — 기존 동작 유지 (Firebase 사용 안 해도 영향 없음).

### 3.2 `expo-app/src/services/auth/googleSignIn.ts`

본 워커는 **수정하지 않는다**. iOS 워커 (별도 P0) 가 추가한 `diagnoseGoogleAuthResult` /
`formatGoogleAuthDiagnostics` 진단 헬퍼가 platform 무관(iOS + Android) 이라 Android 응답에도
그대로 적용된다.

---

## 4. 채택 가설 — H1 + H2 + H5 (복합)

| # | 가설 | 본 P0 에서의 처리 |
|---|---|---|
| H1 | `android.package` 가 Google Cloud Console Android Client Package name 과 다름 | 사용자 액션 — §2.1 |
| H2 | SHA-1 fingerprint 미등록 또는 잘못 등록 | 사용자 액션 — §2.2 |
| H3 | `extractGoogleAuthTokens` 가 Android 응답을 못 받음 | iOS 워커 fix 가 platform 무관 → 추가 작업 없음 |
| H4 | `google-services.json` 미존재 / 잘못된 패키지 | OK — §1 §3 |
| H5 | Android intent filter 미등록 → 콜백 URL 라우팅 실패 | **코드 변경 — §3.1** |

본 P0 코드 변경의 root cause 는 **H5** — `${Application.applicationId}:/oauthredirect` 콜백
intent filter 미등록. H1·H2 는 사용자 액션, H3·H4 는 이미 해소.

---

## 5. 검증

| 단계 | 명령 | 기대 |
|---|---|---|
| 1 | `cd expo-app && npx tsc --noEmit` | 0 오류 |
| 2 | `cd expo-app && npx jest src/services/auth` | googleSignIn suite pass |
| 3 | `cd expo-app && npx expo prebuild --platform android` (선택) | `android/app/src/main/AndroidManifest.xml` 에 `<intent-filter ... ><data android:scheme="com.mindgardenmobile" .../></intent-filter>` 포함 확인 |
| 4 | EAS Build #16 (Android) → 실기 또는 Internal track | Google 로그인 버튼 → Chrome Custom Tab → Google 로그인 완료 시 앱 복귀 + 토큰 수신 |

§3 단계는 prebuild 산출물이 저장소에 커밋되지 않도록 주의 (`expo-app/android/` 디렉터리는 .gitignore 대상).

---

## 6. 빌드 트리거 — NO (본 워커)

본 P0 후속은 **commit + push 만** 수행한다. EAS Android Build 는 다음 차수 #16 에서
iOS 워커 [c0a623af] 의 정정과 함께 통합 트리거 (`deferred-avatar-batch` todo 진행 시점).

빌드 트리거 시 사용자 확인 항목:
1. §2 Google Cloud Console 등록 완료
2. 본 commit 이 `feature/expo-login-redesign-20260610` 또는 통합 release 브랜치에 머지됨
3. iOS 워커의 `CFBundleURLTypes` commit 도 동일 브랜치에 머지됨 (build #15 의 iOS 토큰 미수신 fix)

---

## 7. 보고 형식 (오케스트레이터 인용용)

| 항목 | 값 |
|---|---|
| 채택 가설 | H5 (+ H1·H2 사용자 액션) |
| Root cause | `${Application.applicationId}:/oauthredirect` 콜백을 받을 intent-filter 미등록 → expo-web-browser 의 `_waitForRedirectAsync` 폴리필이 deep-link 이벤트를 받지 못해 토큰 누락 |
| 수정 파일 | `expo-app/app.config.ts` (android.intentFilters 추가), `docs/project-management/2026-06-10/GOOGLE_ANDROID_OAUTH_SETUP.md` (신규) |
| 빌드 트리거 | **NO** — 다음 차수 #16 에 iOS + Android 통합 |
| SHA-1 | §2.2 의 절차로 사용자 추출 (release + debug) → §2.1 에 등록 |
| 사용자 액션 | §2 (Google Cloud Console SHA-1·Package 등록 확인) |

---

## 8. 동시 진행 워커 충돌 회피

- 동일 브랜치 (`feature/expo-login-redesign-20260610`) 의 iOS 워커 [c0a623af] 와 `app.config.ts`
  를 함께 수정. iOS 영역 (`resolveGoogleIosReversedClientId`, `ios.infoPlist.CFBundleURLTypes`)
  과 Android 영역 (`ANDROID_PACKAGE_ID`, `android.intentFilters`) 만 각각 수정하고, 다른 줄은
  건드리지 않는다.
- rebase 충돌 발생 시 두 영역이 인접하지 않으므로 단순 hunk merge 로 해결 가능.

---

## 9. 참고 문헌

- `expo-auth-session/src/providers/Google.ts` — `redirectUri = ${Application.applicationId}:/oauthredirect`
- `expo-web-browser/src/WebBrowser.ts` — Android polyfill (`_openAuthSessionPolyfillAsync`, `_waitForRedirectAsync`)
- Google Identity for Android — https://developers.google.com/identity/protocols/oauth2/native-app
- Expo `android.intentFilters` schema — https://docs.expo.dev/versions/latest/config/app/#intentfilters
