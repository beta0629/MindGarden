# MindGarden Expo 앱 (`expo-app`)

Cursor에서 `expo-app/**` 파일을 주로 다룰 때는 프로젝트 규칙 **`.cursor/rules/expo-app-metro-handoff.mdc`** 가 자동 적용될 수 있다.

## 빠른 시작

```bash
cd expo-app
npm install
npm run start:clean
```

`expo start`는 **`expo-app` 루트**에서 실행한다.

## 소셜 로그인·네이티브 키 (카카오 + 네이버)

`app.config.ts`는 **빌드·prebuild 시점**에 `process.env`로 **카카오·네이버 네이티브 플러그인** 값을 넣습니다.  
둘 중 하나라도 비어 있으면 해당 SDK만 오류가 납니다 (예: 카카오 iOS `SdkError error 2`, 네이버는 초기화·로그인 실패).

### 로컬 (`expo run:ios` / `prebuild`)

1. `cp .env.example .env`
2. `.env`에 **아래를 모두** 채움 (레거시와 맞출 때: `mobile/ios/MindGardenMobile/Info.plist`의 `KAKAO_APP_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 참고).
   - **카카오(네이티브):** `KAKAO_APP_KEY`
   - **네이버(네이티브 플러그인):** `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
   - **네이버(JS — `AuthService`):** `EXPO_PUBLIC_NAVER_CLIENT_ID`, `EXPO_PUBLIC_NAVER_CLIENT_SECRET` (보통 위 네이버 클라이언트 ID/Secret과 동일 값)
3. 네이티브를 다시 만들 때: `npx expo prebuild --clean` 후 `npx expo run:ios` (또는 Android).

Expo CLI는 프로젝트 루트의 `.env`를 읽어 `app.config` 평가에 반영합니다.

### EAS Build (클라우드)

저장소에 키를 커밋하지 말고, **EAS 프로젝트 시크릿**(또는 Expo 대시보드 **Environment variables**)으로 **카카오·네이버 항목을 모두** 넣습니다. 이름이 `process.env`와 같아야 빌드에 주입됩니다.

```bash
cd expo-app
eas login
# 카카오 + 네이버 — 값은 본인 키로 교체 (아래 5개 모두 권장)
eas secret:create --scope project --name KAKAO_APP_KEY --type string --value "<카카오_네이티브_앱_키>"
eas secret:create --scope project --name NAVER_CLIENT_ID --type string --value "<네이버_client_id>"
eas secret:create --scope project --name NAVER_CLIENT_SECRET --type string --value "<네이버_client_secret>"
eas secret:create --scope project --name EXPO_PUBLIC_NAVER_CLIENT_ID --type string --value "<네이버_client_id_동일_권장>"
eas secret:create --scope project --name EXPO_PUBLIC_NAVER_CLIENT_SECRET --type string --value "<네이버_client_secret_동일_권장>"
```

또는 [Expo 대시보드](https://expo.dev) → 해당 프로젝트 → **Environment variables**에서 **위와 동일한 변수 이름**으로 추가합니다.

### DEV APK / iOS + 푸시 토큰 (`EAS_PROJECT_ID` + 플랫폼 Credentials)

```bash
cd expo-app && npx eas-cli login && npx eas-cli init --id da41eca0-daad-4825-baf7-16cd3c71e6cd && npx eas-cli project:info
# .env: EAS_PROJECT_ID=da41eca0-daad-4825-baf7-16cd3c71e6cd (및 EXPO_PUBLIC_EAS_PROJECT_ID 동일)
EAS_PROJECT_ID='da41eca0-daad-4825-baf7-16cd3c71e6cd' npm run android:apk:dev   # Android: google-services.json + Expo FCM V1
bash ./scripts/build-ios-eas-internal-dev.sh   # iOS: Expo 대시보드 APNs Push Key + 실기기/TestFlight
```

- **Android**: `google-services.json`(로컬 prebuild) + Expo **FCM V1** — §2.2.
- **iOS**: Apple App ID Push ON + **APNs Auth Key(.p8)** → Expo **Push Key** — §2.3. `aps-environment`는 EAS가 관리.
- **서버 발송**: Android·iOS 공통 `EXPO_ACCESS_TOKEN`(iOS 전용 env 없음).

`.env`·`.p8`·토큰 값은 **git에 커밋하지 않음**. 상세: [`MOBILE_PUSH_EXPO_DEPLOYMENT_CHECKLIST.md`](../docs/project-management/MOBILE_PUSH_EXPO_DEPLOYMENT_CHECKLIST.md) §2.

### GitHub Actions에서 빌드할 때만

Repository **Secrets**에 `KAKAO_APP_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `EXPO_PUBLIC_NAVER_CLIENT_ID`, `EXPO_PUBLIC_NAVER_CLIENT_SECRET`을 저장하고, 워크플로 `env`로 넘깁니다. (EAS만 쓰면 GitHub 시크릿은 필수 아님.)

## Metro·`@/`·MMKV — 다음 작업·에이전트 필독

모듈 해석(`getMmkv`, `@/lib/...`) 이슈는 **TypeScript paths와 Metro가 분리**되어 있어, 잘못 손대면 같은 수정이 반복된다.  
**규칙·체크리스트·금지 사항**은 아래 문서에만 둔다.

→ **[EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md](../docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md)**

위임 시 `core-coder` 프롬프트에 위 문서 경로를 넣고, 문서 §5 체크리스트를 완료 조건에 포함한다.
