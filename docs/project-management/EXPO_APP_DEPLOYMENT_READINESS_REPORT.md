# Expo 네이티브 앱 배포 준비 점검 보고서

**문서 유형**: 배포 준비 · Go/No-Go 판정  
**버전**: 1.0.0  
**점검일**: 2026-05-26  
**점검 주체**: core-planner (코드·커밋·EAS 빌드 트리거 없음)  
**기준 커밋 맥락**: develop 최신(홈 로딩·프로필·일지 등 `53d5188e1`, `cc3e577b1` 등), iOS EAS `51723ae3` (base `53d5188e1`) FINISHED

---

## 요약 판정

| 범위 | 판정 | 한 줄 근거 |
|------|------|-----------|
| **개발·내부 배포** (dev API, internal-dev / 로컬 APK) | **CONDITIONAL GO** | 로컬 게이트(tsc·bundle·utils) 통과, `eas.json` internal-dev·APK 스크립트 정합; 서버 `EXPO_ACCESS_TOKEN`·푸시 E2E·Maestro는 본 배치 미실행 |
| **운영 스토어 Go-Live** (App Store / Play Store) | **NO-GO** | `EXPO_NATIVE_APP_PLAN` Phase 5·6 미완, `eas.json` submit 플레이스홀더, production API URL·스토어 URL·강제업데이트 운영값 미정 |

**종합**: **CONDITIONAL GO** — **dev 내부 배포만** 진행 가능. 운영 스토어 반영은 별도 Phase 5·6·운영 env 게이트 통과 후 재판정.

---

## 1. SSOT 체크리스트 점검표

범례: ✅ 통과 · ❌ 미통과 · ⏸ 보류(현장·별도 배치 필요)

### 1.1 `PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` (Expo 관련 추출)

| # | 항목 | 판정 | 근거 (1줄) |
|---|------|------|-----------|
| G1 | 모바일 API Base URL이 환경과 일치 | ✅ (dev) / ⏸ (prod) | `internal-dev`·APK 스크립트는 `https://dev.core-solution.co.kr`; `production` 프로필에 `EXPO_PUBLIC_API_BASE_URL` 없음 |
| G2 | OAuth·소셜 로그인 운영 키가 저장소에 없음 | ⏸ | `app.config.ts`에 dev 폴백 키 존재; EAS Secrets·운영 키는 현장 주입 전제 |
| G3 | JWT·외부 API 키 GitHub Secrets / 호스트 env만 | ✅ | `EXPO_ACCESS_TOKEN` 등은 `mindgarden.prod-env.example` §Expo·`.gitignore` 정책 준수 |
| G4 | 결제·웹훅 URL 운영 도메인 | ⏸ | Expo 결제는 `EXPO_PUBLIC_TOSS_*` env 주입; 운영값은 스토어 배포 Phase 6에서 확정 |
| G5 | 배포 직후 스모크(S1~S6) | ⏸ | 웹·API 중심 항목; 모바일 실기기 스모크는 §3 Maestro·푸시 E2E로 별도 |
| G6 | Go/No-Go §10 (TLS/OAuth/CORS/백업) | ⏸ | 백엔드·인프라 종합 체크; Expo 앱 단독 범위 밖 |

### 1.2 `MOBILE_PUSH_EXPO_DEPLOYMENT_CHECKLIST.md`

| # | 항목 | 판정 | 근거 (1줄) |
|---|------|------|-----------|
| P1 | `expo-app/**` 변경 시 백엔드 CI 미트리거 | ✅ | 문서 §1: APK/iOS는 로컬·EAS 스크립트 경로 |
| P2 | dev/prod 호스트 `EXPO_ACCESS_TOKEN` export | ⏸ | `prod-env.example` 템플릿만 확인; dev JAR journal `configured: true` 미실측 |
| P3 | `mindgarden.mobile.app-version` API 정합 | ✅ (dev) | dev curl 기록(2026-05-18): min `1.0.0`/code `1`; 앱 `1.0.4`/code `5` → 강제업데이트 미발동 |
| P4 | `min-android-version-code` ↔ `releases/manifest.json` | ✅ | manifest `androidVersionCode: 5`, `package.json` `1.0.4` 일치 |
| P5 | Android FCM V1·`google-services.json` | ⏸ | `.gitignore` 대상; EAS Credentials 또는 로컬 prebuild 주입 필요 |
| P6 | iOS APNs·EAS Push Key | ⏸ | 사용자 보고 iOS EAS FINISHED; 실기기 `registerToken outcome=ok`는 본 배치 미확인 |
| P7 | `EAS_PROJECT_ID` / `projectId` | ✅ | `eas.json` 전 프로필 `da41eca0-daad-4825-baf7-16cd3c71e6cd` |
| P8 | 푸시 E2E (register + 발송 1건) | ⏸ | 서버 토큰·실기기 수신은 core-tester / 현장 검증 대기 |
| P9 | 운영 반영 순서 (main → prod JAR → APK → min/url) | ❌ (prod) | 운영 APK URL·스토어 URL·prod env 미설정 |

### 1.3 `EXPO_NATIVE_APP_PLAN.md` (배포·푸시 Phase 요지)

| Phase | 항목 | 판정 | 근거 (1줄) |
|-------|------|------|-----------|
| 0~3 | 스캐폴딩·핵심·P1 화면 | ✅ | 문서 상태 Phase 3-A~E 코딩 완료; develop 홈·프로필·일지 반영 맥락 |
| 3-F·3-G | 마음 날씨·마음 정원 | ⏸ | §11.1 게이트: core-tester Phase 3 스모크 후 착수 |
| 4 | 푸시 12종·오프라인·백그라운드 | ⏸ | `pushScenarios.ts`·NotificationService 존재; §11 Phase 4 체크리스트 미완 |
| 5 | 단위·E2E·디자인 퀄리티 80%+ | ⏸ | utils 243 tests 통과; Maestro·커버리지 80%·Phase 5 전체 미선언 |
| 6 | EAS production·스토어 제출 | ❌ | `eas.json` submit `YOUR_APPLE_ID` 등 플레이스홀더; 스크린샷·약관 URL 미정 |

### 1.4 `expo-app/eas.json`

| # | 항목 | 판정 | 근거 (1줄) |
|---|------|------|-----------|
| E1 | `internal-dev` (dev API, APK/iOS 실기기) | ✅ | `EXPO_PUBLIC_API_BASE_URL=https://dev.core-solution.co.kr`, `simulator: false`, Android `apk` |
| E2 | `development` / `preview` | ✅ | dev client·internal 분배 정의됨 |
| E3 | `production` autoIncrement | ⏸ | 프로필 존재; **운영 API URL env 없음** |
| E4 | `submit.production` | ❌ | `YOUR_APPLE_ID`, `YOUR_ASC_APP_ID`, `google-services-key.json` 플레이스홀더 |
| E5 | EAS 빌드 쿼터 | ⏸ | iOS 월간 빌드 소진 주의(사용자 맥락); 재빌드는 필요 시에만 |

### 1.5 `expo-app/releases/manifest.json`

| # | 항목 | 판정 | 근거 (1줄) |
|---|------|------|-----------|
| R1 | `androidVersionCode` | ✅ | `5` — `app.config.ts` `versionCode`와 연동 |
| R2 | 릴리스 노트 | ✅ | PATCH 1.0.4 로그인 refresh 정합 기록 |

### 1.6 `deployment/mindgarden.prod-env.example` §Expo

| # | 항목 | 판정 | 근거 (1줄) |
|---|------|------|-----------|
| X1 | `EXPO_ACCESS_TOKEN` 템플릿 | ✅ | §56–59 주석·빈 값; 호스트 전용 주입 정책 명시 |
| X2 | prod 호스트 실제 설정 | ⏸ | 저장소만 점검; `/etc/mindgarden/prod.env` 현장 미확인 |

### 1.7 `application.yml` `mindgarden.mobile.*`

| # | 항목 | 판정 | 근거 (1줄) |
|---|------|------|-----------|
| M1 | min version / code | ✅ | `1.0.0` / `1` — 현재 APK(1.0.4/5) 하회 없음 |
| M2 | `force-update-enabled: true` | ⏸ | prod에서 min 상향 시 `android-apk-url`·스토어 URL 필수(현재 빈 문자열) |
| M3 | `android-store-url` / `ios-store-url` | ❌ (prod) | 스토어 미배포 상태로 빈 값 |

---

## 2. 로컬 게이트 (본 배치 실행 결과)

`expo-app/` 디렉터리 기준. Maestro는 실기기·계정 env 필요로 **미실행**.

| 게이트 | 명령 | 결과 | 비고 |
|--------|------|------|------|
| TypeScript | `cd expo-app && npx tsc --noEmit` | ✅ exit 0 | `EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` §5-3 |
| Metro·MMKV 회귀 | `npm run verify:metro-mmkv` | ✅ (`verify:bundle:ci` 선행 포함) | prestart 훅과 동일 |
| CI 번들 export | `npm run verify:bundle:ci` | ✅ exit 0 | web export; Expo force-exit 경고만, 번들 성공 |
| Utils 단위 | `npm run test:utils` | ✅ 42 suites / 243 tests | worker graceful exit 경고(P2) |
| Maestro smoke | 아래 §2.1 | ⏸ 미실행 | ADMIN/STAFF/CONSULTANT 플로우 |

### 2.1 Maestro smoke 경로 (제안)

```bash
cd expo-app
# dev release APK 설치 후
npm run android:apk:dev:install   # 또는 기존 APK

export MAESTRO_ADMIN_EMAIL='...'
export MAESTRO_ADMIN_PASSWORD='...'
maestro test .maestro/flows/admin-mvp-smoke.yaml

export MAESTRO_CONSULTANT_EMAIL='...'
export MAESTRO_CONSULTANT_PASSWORD='...'
maestro test .maestro/flows/consultant-home-p0-smoke.yaml
```

참조: `expo-app/.maestro/README.md`, `docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md`

---

## 3. 블로커 · P1 · P2 분류

### 블로커 (배포/Go-Live 전 필수 해소)

| ID | 항목 | 담당 | 조치 요지 |
|----|------|------|-----------|
| B1 | 운영 스토어 제출 설정 미완 (`eas.json` submit 플레이스홀더) | **core-deployer** + **사용자** | Apple ID·ASC App ID·Play service account·개인정보처리방침 URL |
| B2 | `production` 빌드에 운영 API URL 미정의 | **core-coder** | `eas.json` production `env.EXPO_PUBLIC_API_BASE_URL` 또는 `APP_ENV=production` 해석 확정 |
| B3 | Phase 5·6 게이트 미통과 (`EXPO_NATIVE_APP_PLAN` §11) | **core-tester** → **core-deployer** | Maestro·실기기 UAT·스토어 에셋 후 Phase 6 |
| B4 | prod `android-apk-url` / 스토어 URL 빈 값 + `force-update-enabled: true` | **core-coder** + **core-deployer** | 운영 min 상향 전 URL 확정, 아니면 prod force-update 정책 재검토 |

### P1 (dev 내부 배포·푸시 품질 — 조속)

| ID | 항목 | 담당 | 조치 요지 |
|----|------|------|-----------|
| P1-1 | dev 서버 `EXPO_ACCESS_TOKEN` journal 확인 | **core-deployer** / **shell** | `Expo push access token configured: true` |
| P1-2 | Android FCM·iOS APNs 실기기 `registerToken` E2E | **core-tester** | §2.2·§2.3 MOBILE_PUSH 체크리스트 |
| P1-3 | Maestro smoke 3종 미실행 | **core-tester** | §2.1 플로우 + env |
| P1-4 | 푸시 알림 목록 UX | **core-coder** (별도 배치) | 사용자 지정 별도 배치 |
| P1-5 | EAS iOS 월간 쿼터 | **사용자** / **core-deployer** | `51723ae3` FINISHED 활용; 불필요 재빌드 금지 |

### P2 (개선·리스크 완화)

| ID | 항목 | 담당 | 조치 요지 |
|----|------|------|-----------|
| P2-1 | 기획서 SDK 53 vs 실제 Expo ~54 | **core-coder** | 문서·의존성 정합 또는 계획서 개정 |
| P2-2 | `app.config.ts` OAuth dev 폴백 키 | **core-coder** | 운영 빌드 EAS Secrets 전량 주입·폴백 제거 검토 |
| P2-3 | Jest worker graceful exit 경고 | **core-coder** | `--detectOpenHandles`로 타이머 누수 조사 |
| P2-4 | 쇼핑 임시 닫기 | **core-coder** (별도 배치) | 사용자 지정 별도 배치 |
| P2-5 | `expo-updates` OTA (Phase 4) | **core-coder** | 스토어 외 JS hotfix 경로 — Phase 4 착수 시 |

---

## 4. iOS / Android 배포 경로

| 목적 | 플랫폼 | 프로필 / 스크립트 | API Base | 산출물·배포 | 강제업데이트 |
|------|--------|-------------------|----------|-------------|--------------|
| **Dev 내부 QA** | Android | `npm run android:apk:dev` (`scripts/build-android-apk-dev.sh`) | `https://dev.core-solution.co.kr` | 로컬 `app-release.apk` → adb/install 스크립트 | `GET .../mobile/app-version/check` (dev min 1.0.0/code 1) |
| **Dev 내부 QA** | iOS | `npm run ios:eas:internal-dev` (`eas build --profile internal-dev`) | 동일 dev URL | EAS 내부 배포 IPA (실기기; 사용자: build `51723ae3` FINISHED) | 동일 API |
| **Dev Metro (개발자)** | Both | `npm run dev` / `dev:android` / `dev:ios` | Metro LAN + dev API | Dev Client | 해당 없음 |
| **Preview** | Both | `eas build --profile preview` | env 기본(미명시 시 `app.config` 해석) | internal distribution | dev와 동일 정책 unless prod API |
| **운영 스토어** | Android | `eas build --profile production` → Play Submit | **미설정** — `EXPO_PUBLIC_API_BASE_URL` 추가 필요 | AAB/APK + `android-store-url` 또는 `android-apk-url` | prod yml min/code·`force-update-enabled` |
| **운영 스토어** | iOS | `eas build --profile production` → `eas submit` | 동일 | TestFlight → App Store; `ios-store-url` | 동일 |

**운영 반영 순서** (MOBILE_PUSH §4): `main` → `deploy-production.yml` → prod env `EXPO_ACCESS_TOKEN` → Expo release 빌드 → min version/code·APK URL 정합 → 실기기 스모크.

---

## 5. 분배실행 (후속 — 본 배치는 문서만)

| 순서 | 서브에이전트 | 목표 | 병렬 |
|------|-------------|------|------|
| 1 | **core-tester** | Maestro 3종 + 푸시 register/수신 E2E 증적 | — |
| 2 | **core-deployer** | dev `EXPO_ACCESS_TOKEN` journal 확인; prod env 체크리스트 | 1과 병렬 가능 |
| 3 | **core-coder** | 푸시 목록 UX·쇼핑 임시 닫기 (별도 배치) | 1·2와 병렬 |
| 4 | **core-coder** + **core-deployer** | production `eas.json` env·submit·스토어 URL (Phase 6) | 1~3 완료 후 |

---

## 6. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-05-26 | 1.0.0 | 초판 — SSOT 체크리스트·로컬 게이트·배포 경로·CONDITIONAL GO 판정 |

---

**문서 끝.** 재점검 시 `eas.json`·`releases/manifest.json`·`MOBILE_PUSH_EXPO_DEPLOYMENT_CHECKLIST.md` §6 점검 기록 갱신.
