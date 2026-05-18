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
- **`expo-app/**`만 변경**하면 위 백엔드 워크플로는 **실행되지 않음**. APK는 로컬/EAS 스크립트 (`expo-app/scripts/build-android-apk-dev.sh` 등).
- 레거시 `.github/workflows/deploy-mobile.yml`은 `mobile/**` + `main`만 — **`expo-app`과 무관**.

---

## 2. 환경 변수·설정 체크리스트

GitHub Actions **Repository Secrets에 `EXPO_ACCESS_TOKEN` 없음** (워크플로 미참조). 푸시·버전 정책은 **서버 호스트 env** 또는 JAR에 포함된 `application.yml` 기본값.

| 항목 | 주입 위치 | dev | prod | 점검 방법 |
|------|-----------|-----|------|-----------|
| **`EXPO_ACCESS_TOKEN`** | `/etc/mindgarden/dev.env` · `/etc/mindgarden/prod.env` (`deployment/mindgarden.prod-env.example` §Expo) | ☐ 설정됨 | ☐ 설정됨 | 미설정 시 로그: `푸시 발송 생략: Expo access token 미설정` (`MobilePushDispatchServiceImpl`) |
| **`EXPO_PUSH_API_URL`** | 동일 (선택) | ☐ 비움 또는 기본 | ☐ | 기본 `https://exp.host/--/api/v2/push/send` |
| **`mindgarden.mobile.app-version`** | `application.yml` 또는 Spring env (`MINDGARDEN_MOBILE_APP_VERSION_*`) | ☐ | ☐ | 아래 API curl |
| **`min-android-version` / `min-android-version-code`** | 운영 반영 시 APK `expo-app/releases/manifest.json`·`package.json`과 **정합** | — | ☐ | 강제 업데이트 시 **코드 ≥ 배포 APK `androidVersionCode`** |
| **`force-update-enabled`** | yml / env | — | ☐ | `true`면 `updateRequired` 시 전면 게이트 |
| **`android-apk-url`** | yml / env (강제 업데이트 다운로드) | — | ☐ HTTPS 공개 URL | Expo `ForceUpdateGate` — Store URL 없을 때 APK 링크 |
| **`android-store-url` / `ios-store-url`** | yml / env | — | ☐ | 스토어 배포 후 채움 |

**Expo 앱(EAS·빌드)** — 서버와 별도: `EAS_PROJECT_ID` / `EXPO_PUBLIC_EAS_PROJECT_ID`, `EXPO_PUBLIC_API_BASE_URL` (`expo-app/eas.json`, `app.config.ts`). 푸시 **발송**은 서버 `EXPO_ACCESS_TOKEN`만 필수.

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
