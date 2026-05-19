# 모바일 푸시·Expo·강제 업데이트 운영 게이트 체크리스트

**작성**: 2026-05-18 · **SSOT**: `MobilePushDispatchServiceImpl`, `mindgarden.mobile.*` (`application.yml`), Expo `expo-app/`

관련: [`MOBILE_PUSH_PERMISSION_AND_FORCE_UPDATE_ORCHESTRATION.md`](./MOBILE_PUSH_PERMISSION_AND_FORCE_UPDATE_ORCHESTRATION.md), [`PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md`](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md), [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)

---

## 1. CI/CD — 백엔드 배포 트리거 (paths)

| 환경 | 워크플로 | 브랜치 | 트리거 요지 |
|------|----------|--------|-------------|
| **개발** | `.github/workflows/deploy-backend-dev.yml` | `develop` **push** | `src/main/java/com/coresolution/consultation/**`, `core/**`(온보딩 제외), `application.yml`, `application-dev.yml`, `db/migration/**`, `pom.xml` 등 (파일 내 `paths` 전체 참조) |
| **운영** | `.github/workflows/deploy-production.yml` | `main` **push** | 개발과 동일 코어 paths + `deployment/application-production.yml`, `sql/**` 등 |
| **수동** | 위 두 워크플로 | — | `workflow_dispatch` 지원 |

**주의**

- 커밋 `5d5e16433` 등은 `consultation/**`·`application.yml` 포함 → **develop/main push 시 백엔드 배포 paths에 해당하면 Actions 자동 실행**.
- **`expo-app/**`만 변경**하면 위 백엔드 워크플로는 **실행되지 않음**. APK는 로컬/EAS 스크립트 (`expo-app/scripts/build-android-apk-dev.sh`, iOS는 `build-ios-eas-internal-dev.sh` 등).
- 레거시 `.github/workflows/deploy-mobile.yml`은 `mobile/**` + `main`만 — **`expo-app`과 무관**.

---

## 2. 환경 변수·설정 체크리스트

GitHub Actions **Repository Secrets에 `EXPO_ACCESS_TOKEN` 없음** (워크플로 미참조). 푸시·버전 정책은 **서버 호스트 env** 또는 JAR에 포함된 `application.yml` 기본값.

| 항목 | 주입 위치 | dev | prod | 점검 방법 |
|------|-----------|-----|------|-----------|
| **`EXPO_ACCESS_TOKEN`** | `/etc/mindgarden/dev.env` · `/etc/mindgarden/prod.env` (`deployment/mindgarden.prod-env.example` §Expo) | ☐ 설정됨 | ☐ 설정됨 | 기동 로그: `Expo push access token configured: true/false` (`ExpoPushProperties`, 값·길이 미노출). 미설정 시 발송 스킵: `푸시 발송 생략: Expo access token 미설정` |
| **`EXPO_PUSH_API_URL`** | 동일 (선택) | ☐ 비움 또는 기본 | ☐ | 기본 `https://exp.host/--/api/v2/push/send` |
| **`mindgarden.mobile.app-version`** | `application.yml` 또는 Spring env (`MINDGARDEN_MOBILE_APP_VERSION_*`) | ☐ | ☐ | 아래 API curl |
| **`min-android-version` / `min-android-version-code`** | 운영 반영 시 APK `expo-app/releases/manifest.json`·`package.json`과 **정합** | — | ☐ | 강제 업데이트 시 **코드 ≥ 배포 APK `androidVersionCode`** |
| **`force-update-enabled`** | yml / env | — | ☐ | `true`면 `updateRequired` 시 전면 게이트 |
| **`android-apk-url`** | yml / env (강제 업데이트 다운로드) | — | ☐ HTTPS 공개 URL | Expo `ForceUpdateGate` — Store URL 없을 때 APK 링크 |
| **`android-store-url` / `ios-store-url`** | yml / env | — | ☐ | 스토어 배포 후 채움 |

**Expo 앱(EAS·빌드)** — 서버와 별도: `EAS_PROJECT_ID` / `EXPO_PUBLIC_EAS_PROJECT_ID`, `EXPO_PUBLIC_API_BASE_URL` (`expo-app/eas.json`, `app.config.ts`). 푸시 **발송**은 서버 `EXPO_ACCESS_TOKEN`만 필수. APK 빌드 시 `expo-app/scripts/build-android-apk-dev.sh` 가 위 EAS env 를 **설정된 경우에만** prebuild 에 전달한다.

**Expo 대시보드 — `projectId`·Access Token (로컬·CI, 저장소 커밋 금지)**

1. [expo.dev](https://expo.dev) 로그인 → **Projects** → MindGarden(`expo-app`) 프로젝트 선택.
2. **Project settings** → **General** 에서 **Project ID** UUID 복사 → `expo-app/.env` 에 `EAS_PROJECT_ID=<uuid>` (또는 `EXPO_PUBLIC_EAS_PROJECT_ID`) — **`.env`는 gitignore, 커밋하지 않음**.
3. **Access tokens** → **Create token** → 서버용 `EXPO_ACCESS_TOKEN` 은 `/etc/mindgarden/dev.env`·`prod.env` 에만 `export` (§2.1).
4. 로컬 확인: `cd expo-app && npx eas-cli login && npx eas-cli project:info` — `projectId` 가 위 UUID 와 일치하는지 확인.
5. DEV APK: `EAS_PROJECT_ID='<uuid>' npm run android:apk:dev` — 미설정 시 빌드는 진행되나 번들 `extra.eas.projectId` 는 `YOUR_EAS_PROJECT_ID` 플레이스홀더(기기 푸시 토큰 실패 가능).

### 2.1 개발 서버 JVM — `EXPO_ACCESS_TOKEN` export (수동)

`/opt/mindgarden/start.sh` 는 `source /etc/mindgarden/dev.env` 후 JVM 을 기동한다. `dev.env` 가 `KEY=value` 만 쓰면 자식 프로세스에 전달되지 않으므로 **반드시 export** 한다.

| 방법 | 절차 |
|------|------|
| **A (권장)** | `/etc/mindgarden/dev.env` 에 `export EXPO_ACCESS_TOKEN=...` (선택 `export EXPO_PUSH_API_URL=...`) — **토큰 값은 저장소·PR에 커밋 금지** |
| **B** | `start.sh` 에 `deployment/dev-start-env-fragment.sh` 와 동일한 `export EXPO_ACCESS_TOKEN` / `export EXPO_PUSH_API_URL` 블록 추가 |
| **패치 스크립트** | `scripts/deployment/patch-dev-expo-env-export.sh` (SSH에서 export 줄만 idempotent 삽입) |

적용 후: `systemctl restart mindgarden-dev` → journal 에 `Expo push access token configured: true` 확인.

### 2.2 Android — FCM V1·`google-services.json` (기기 `ExponentPushToken`)

로컬·CI **release APK**에서 `Notifications.getExpoPushTokenAsync`가 실패하면 서버 `POST /api/v1/mobile/push-token/register`가 **0건**일 수 있다. (`adb logcat` `ReactNativeJS`: `[NotificationService] registerToken` `outcome=failed` `reason=push_token_unavailable`)

| 점검 | 절차 |
|------|------|
| **Expo 대시보드 (권장)** | [expo.dev](https://expo.dev) → Project → **Credentials** → **Android** → **FCM V1** 서비스 계정 키 업로드 (EAS 빌드·OTA와 동일 프로젝트 `projectId`) |
| **로컬 prebuild** | `expo-app/android/app/google-services.json` 배치 후 `npx expo prebuild` / `npm run android:apk:dev` — 저장소에 커밋하지 않을 경우 빌드 머신·CI secret으로만 주입 |
| **앱 측** | 알림 설정 화면 포커스 시 권한·tenant 있으면 자동 `registerToken` 1회 + 「푸시 다시 등록」 수동 재시도 |

**앱 역할**: 내담자·상담사 셸은 로그인 후 `NotificationService.registerToken` → `POST /api/v1/mobile/push-token/register`. **관리자(ADMIN) 모바일 MVP 셸은 푸시 등록·수신 E2E 비대상**(운영·스모크는 client/consultant APK).

### 2.3 iOS — APNs·EAS Credentials (기기 `ExponentPushToken`, Android §2.2와 대칭)

시뮬레이터는 **ExponentPushToken이 불안정**하므로 **실기기·TestFlight·내부 배포 IPA**로 검증한다. 서버 발송은 Android와 동일하게 **`EXPO_ACCESS_TOKEN`만** 사용(iOS 전용 env 없음).

| 점검 | 절차 |
|------|------|
| **Apple Developer** | [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources) → **Identifiers** → App ID `com.mindgarden.MindGardenMobile` → **Push Notifications** **ON** (Capability 저장) |
| **APNs Auth Key (.p8)** | **Keys** → **+** → Apple Push Notifications service (APNs) → `.p8` 다운로드(1회) · Key ID·Team ID 기록 — **`.p8`는 저장소·PR에 커밋 금지** |
| **Expo Project Credentials** | [expo.dev](https://expo.dev) → Project → **Credentials** → **iOS** → **Push Key** → APNs Auth Key(.p8) 업로드 · Key ID·Team ID 입력 (`aps-environment` entitlements는 **EAS Credentials가 관리** — `app.config`에 수동 하드코딩 금지) |
| **EAS 빌드 (dev API)** | `cd expo-app && npx eas-cli login` 후 `eas build --profile internal-dev --platform ios` (또는 `bash ./scripts/build-ios-eas-internal-dev.sh`) — `eas.json` `internal-dev`는 `simulator: false`, `EXPO_PUBLIC_API_BASE_URL=https://dev.core-solution.co.kr` |
| **앱 네이티브** | `app.config.ts`: `UIBackgroundModes`에 `remote-notification`(기존 `audio` 유지), `expo-notifications` 플러그인 `enableBackgroundRemoteNotifications: true` |
| **projectId** | `.env`에 `EAS_PROJECT_ID` / `EXPO_PUBLIC_EAS_PROJECT_ID`(§2·§2.2와 동일 UUID) — 미설정 시 `getExpoPushTokenAsync` 실패 가능 |

**검증**

1. 실기기에 빌드 설치 → 로그인(내담자/상담사) → 알림 권한 허용.
2. Xcode **Console** 또는 앱 로그에서 `[NotificationService] registerToken` **`outcome=ok`** (Android의 `adb logcat` `ReactNativeJS`와 동일 필터).
3. API: `POST /api/v1/mobile/push-token/register` body **`platform=ios`**, `token=ExponentPushToken[...]` → HTTP 200.
4. 서버 `EXPO_ACCESS_TOKEN` 설정 후 테스트 푸시 1건 → 기기 수신.

**앱 역할**: Android와 동일 — `NotificationService.registerToken` → `POST /api/v1/mobile/push-token/register` (`MobilePushPlatform.IOS`).

---

## 3. API 스모크 (배포 후)

```bash
# 개발
curl -sS "https://dev.core-solution.co.kr/api/v1/mobile/app-version/check?platform=android&version=1.0.4&versionCode=5"

# 운영 (호스트는 환경에 맞게)
curl -sS "https://<prod-api-host>/api/v1/mobile/app-version/check?platform=android&version=<installed>&versionCode=<installed>"
```

**기대**: HTTP 200, `data.updateRequired` / `data.forceUpdate`가 정책과 일치.  
**2026-05-18 dev 실측** (`1.0.4` / `versionCode=5`): `updateRequired=false`, `forceUpdate=false` (서버 min `1.0.0` / code `1`).

---

## 4. 운영 반영 순서 (한 페이지)

코더·테스터 게이트 통과 후:

| 단계 | 작업 | 담당·근거 |
|------|------|-----------|
| **1** | `main` 머지 → **`deploy-production.yml`** 완료 (app-version·푸시·메시지 API 포함 JAR) | paths 또는 `workflow_dispatch` |
| **2** | 운영 서버 `/etc/mindgarden/prod.env`에 **`EXPO_ACCESS_TOKEN`**·필요 시 **`mindgarden.mobile.app-version`** 오버라이드 → **블루그린 슬롯 재기동** | 토큰만 변경 시 yml 재배포 없이 env+재시작 가능 |
| **3** | **`expo-app` release APK** 빌드·배포 (`npm run android:apk:dev` / 운영 URL 스크립트) → `android-apk-url`·min version/code를 **배포 APK와 맞춤** | `deploy-mobile.yml`은 `expo-app` 미대상 |

**푸시 E2E**: 앱 로그인 → `POST /api/v1/mobile/push-token/register` 성공 + 서버 토큰 설정 후 실기기 1건 발송.

---

## 5. 운영 Go-Live 게이트 (1회 인용)

- [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)
- [`docs/standards/DEPLOYMENT_STANDARD.md`](../standards/DEPLOYMENT_STANDARD.md)

---

## 6. 점검 기록 (수동)

| 일자 | 환경 | EXPO_ACCESS_TOKEN | app-version API | APK URL | 비고 |
|------|------|-------------------|-----------------|---------|------|
| 2026-05-18 | dev API | 호스트 미확인 (레포만 점검) | curl OK | — | min 1.0.0 / code 1 |
| 2026-05-18 | dev JAR | — | — | — | [deploy-backend-dev #26040614738](https://github.com/beta0629/MindGarden/actions/runs/26040614738) `f0d6b44ad` success (includes `75ecb9797`) |
