# EAS OTA Update Guide (expo-updates)

> 위치: `docs/deployment/EAS_OTA_UPDATE_GUIDE.md`
> 대상: `expo-app/` (React Native + Expo SDK 54)
> 도입 PR: `feat/ota-update-infra` (v1.0.7 부터 OTA 가능)

## 1. 무엇이 OTA 로 가능한가

`expo-updates` 가 적재된 빌드는 **JS·TS·이미지·스타일·런타임 설정 등 JS 번들로 표현되는 모든 변경**을 EAS Update 채널 push 만으로 사용자 앱에 반영한다. 별도 EAS Build, App Store / Play 심사 없이 다음 cold start 에서 자동 적용된다.

**OTA 로 안 되는 변경 (반드시 새 EAS Build):**

- iOS / Android 네이티브 코드 (`ios/`, `android/`)
- 새 native module 추가 / 버전 업
- `app.config.ts` 의 native 영역 변경 — `ios.*`, `android.*`, `plugins.*` 의 native 영향
- `package.json` 의 native 모듈 (`expo-*`, `react-native-*`) 추가·제거·major upgrade
- `runtimeVersion` 변경 (의도적으로 OTA 호환 cut 을 만들 때)

## 2. 사전 조건

| 항목 | 값 |
|------|----|
| Expo SDK | 54 |
| `expo-updates` | `~29.0.18` (SDK 54 호환) |
| EAS Project ID | `EAS_PROJECT_ID` / `EXPO_PUBLIC_EAS_PROJECT_ID` env (`eas.json` build 프로필 또는 EAS Secret) |
| `runtimeVersion.policy` | `appVersion` (`package.json` `version` 단위) |
| OTA 가능 첫 빌드 | **v1.0.7** (v1.0.6 이전 빌드는 `expo-updates` 인프라가 포함되지 않아 OTA 불가) |

## 3. 채널 ↔ 빌드 프로필 매핑 (`expo-app/eas.json`)

| 빌드 프로필 (`eas build --profile`) | EAS Update 채널 | 용도 |
|---|---|---|
| `production` | `production` | App Store / Play 출시 빌드 |
| `preview` | `preview` | 내부 배포 (TestFlight·Firebase) |
| `internal-dev` | `internal-dev` | 사내 개발 APK |
| `development` | `development` | dev-client 빌드 |

각 빌드는 자기 채널에서만 update 를 fetch 한다 — production 빌드는 preview update 를 받지 않음.

## 4. OTA push 절차 (운영 채널)

```bash
cd /Users/mind/mindGarden/expo-app

# 1) 현재 main 동기화·CI 통과 확인
git checkout main
git pull --ff-only origin main

# 2) JS·TS 변경만 들어있는지 확인 (native 변경 있으면 OTA 금지 — 새 빌드 필요)
git log v1.0.7..HEAD --name-only -- expo-app/ \
  | grep -E '^(expo-app/(ios|android|plugins|metro\.config|app\.config|package(-lock)?\.json))' \
  && echo "❌ native 변경 감지 — OTA 불가, 새 EAS Build 필요" \
  || echo "✅ JS-only 변경 — OTA 가능"

# 3) OTA publish (production 채널)
#
# ⚠️ `--environment production` 필수.
# EAS CLI v16+ 는 `eas update` 시 `--environment` 가 없으면 EAS Project Environment Variables 를
# inject 하지 않는다. 그 결과 `app.config.ts` 가 빈 `process.env` 로 평가되어
# `extra.googleClientId = { ios:"", web:"", android:"" }` 등 빈 값으로 manifest 가 publish 되고,
# 사용자 앱에서 `isGoogleConfigured=false` ("Google 로그인 준비 중" Disabled) 가 된다.
# P0 (2026-06-10) — TestFlight 1.0.7 (#16) + OTA group `608da58e` 에서 실제 발생.
npx eas update \
  --environment production \
  --branch production \
  --channel production \
  --message "<이슈/PR 번호와 한 줄 요약>"

# 예시
npx eas update --environment production --branch production --channel production \
  --message "fix(p1): 결제 성공 후 상세 페이지로 라우팅 오류 수정 (#172)"
```

검증:

```bash
# publish 직후 새 update id 의 manifest 에 EXPO_PUBLIC_GOOGLE_*_CLIENT_ID 가 살아 있는지 확인
npx eas update:view <publish-id> --json | jq '.manifest.extra.googleClientId'
# → { "web": "...", "ios": "...", "android": "..." } 모두 채워져 있어야 한다 (빈 값 금지).
```

`eas update` 가 완료되면 production 채널의 **모든 v1.0.7+ 빌드**가 다음 cold start 에서 새 번들을 자동 다운로드한다 (현재 설정: `checkAutomatically: "ON_LOAD"`, `fallbackToCacheTimeout: 0` — 첫 부팅은 캐시 즉시 실행 후 새 번들 백그라운드 다운로드 → 다음 부팅에 적용).

## 5. 즉시(강제) 반영이 필요한 critical fix

`fallbackToCacheTimeout: 0` 정책상 일반 OTA 는 “다음 부팅에 적용” 이다. 보안 fix 등 즉시 반영이 필요하면 **앱 측에 fetch + reload 트리거 코드**가 있어야 한다. 본 PR 범위 외이며, 별도 후속에서 `app/_layout.tsx` 진입점에 다음을 도입한다:

```ts
import * as Updates from 'expo-updates';

const update = await Updates.fetchUpdateAsync();
if (update.isNew) {
  await Updates.reloadAsync();
}
```

도입 전까지는 OTA push 후 사용자가 앱을 한 번 닫았다 켜야 새 번들이 적용된다.

## 6. Rollback

publish 한 update 가 잘못되었을 때 두 가지 옵션:

### 6.1 rollback to embedded (가장 안전)

```bash
npx eas update:rollback --branch production
```

→ 해당 채널 사용자가 다음 cold start 에서 **빌드에 내장된 번들**로 복귀 (= EAS Build 시점 코드).

### 6.2 새 update push (수정본)

```bash
npx eas update --branch production --channel production \
  --message "revert: <이슈> 롤백 — <원래 동작으로 되돌림>"
```

→ 이전 안정 커밋에서 다시 publish. 채널 사용자가 다음 cold start 에 적용.

## 7. `runtimeVersion` 정책 — `appVersion`

- `package.json` `version` (= `app.config.ts` `version`) 이 같은 빌드끼리만 update 호환.
- 예: v1.0.7 빌드는 v1.0.7 채널에 push 된 update 만 받음. v1.0.8 에서 native 변경이 들어가면 자동으로 OTA 호환 cut 생성.
- `version` 을 올리지 않은 채로 OTA 가 동작하므로, JS-only 패치를 위한 별도 사전 작업은 불필요.

## 8. 검증 체크리스트

PR 머지 후 / 새 EAS Build 직전:

- [ ] `cd expo-app && npx tsc --noEmit` 통과
- [ ] `cd expo-app && npx expo-doctor` — 본 작업으로 신규 실패 없음
- [ ] `expo-app/app.config.ts` `runtimeVersion.policy === 'appVersion'`
- [ ] `expo-app/app.config.ts` `updates.url === https://u.expo.dev/<EAS_PROJECT_ID>` (env 값으로 해석)
- [ ] `expo-app/eas.json` 각 build 프로필에 `channel` 명시
- [ ] `expo-app/eas.json` `update` 섹션에 동일 channel 정의
- [ ] EAS 콘솔에서 첫 v1.0.7+ 빌드 생성 시 update endpoint 가 빌드 manifest 에 포함되었는지 확인

## 9. 자주 하는 실수

| 실수 | 결과 | 회피 |
|---|---|---|
| native 변경 후 OTA push | crash / silent failure (모듈 mismatch) | §4 의 git log 검사 step 필수 |
| `runtimeVersion` 변경 후 OTA push | 모든 기존 빌드가 update 못 받음 | runtime cut 은 EAS Build 와 함께만 |
| 채널 오타 (`prod` vs `production`) | publish 됐지만 사용자 단말이 못 가져감 | `eas.json` 의 channel 값 그대로 사용 |
| EAS_PROJECT_ID env 누락 | `updates.url` 미설정 → OTA 비활성 | EAS Build 프로필 `env` 또는 EAS Secret 에 항상 주입 |
| `eas update` 시 `--environment production` 누락 | EAS Project Environment Variables 미주입 → `process.env.EXPO_PUBLIC_*` 빈 값 → `extra.googleClientId` 빈 객체로 publish → Google 로그인 Disabled | §4 의 명령 그대로 사용 (`--environment production` 필수). 발행 후 §4 검증 step 으로 manifest 의 `extra.googleClientId` 가 채워져 있는지 확인 |

## 10. 참고

- 공식 문서: <https://docs.expo.dev/eas-update/getting-started/>
- 핸드오프: `docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md`
- 위임 순서: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
