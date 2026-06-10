# Android EAS Submit 자동화 셋업 가이드 (Google Play Console internal track)

**문서 유형**: 운영 셋업 가이드 · 사용자 콘솔 작업 안내
**작성일**: 2026-06-10
**대상**: Core Solution(MindGarden) Expo App — `expo-app/`
**목표**: EAS Build 결과 Android AAB 를 Play Console `internal` track 으로 **자동** 업로드(`--auto-submit`).
**SSOT**:
- `expo-app/eas.json` (`submit.production.android`)
- 본 문서 §Step 1~3 (사용자 콘솔 작업 → JSON 키 회수)
- `.github/workflows/eas-android-submit.yml` (워크플로 자동화)
- EAS Submit docs: https://docs.expo.dev/submit/android/

---

## 0. 한 줄 결론

**Google Cloud Console 에서 Service Account JSON 키 1개 만들고 → Play Console 에서 권한 부여 → JSON 파일을 본 워커(또는 GitHub Secret) 에 전달**하면, 이후 모든 `production` Android 빌드는 internal track 으로 **자동 submit** 됩니다.

| 단계 | 주체 | 액션 |
|---|---|---|
| Step 1 | **사용자** | Google Cloud Console → Service Account 생성 → JSON 키 다운로드 |
| Step 2 | **사용자** | Play Console → 위 Service Account 이메일에 권한 부여 |
| Step 3 | **사용자** | JSON 키 파일 경로/내용 본 워커에 전달 (안전 채널) |
| Step 4 | core-deployer | `expo-app/google-play-service-account.json` 로 배치 + `eas credentials --platform android` 등록 |
| Step 5 | core-deployer | `EAS_GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` GitHub Secret 등록 + 워크플로 활성화 |
| Step 6 | core-deployer | 빌드 #16 Android AAB 로 테스트 submit → Play Console 결과 확인 |

---

## Step 1. Google Cloud Console — Service Account 생성

> 약 3~5분 소요. 한 번만 진행하면 됩니다.

1. https://console.cloud.google.com/iam-admin/serviceaccounts 접속
2. 상단에서 **MindGarden 프로젝트(또는 Play 콘솔과 연동된 프로젝트)** 선택
3. **+ 서비스 계정 만들기** 클릭
4. 입력:
   - **이름**: `eas-submit-android`
   - **서비스 계정 ID**: (자동 생성, 그대로) — 결과 이메일 예: `eas-submit-android@<project-id>.iam.gserviceaccount.com`
   - **설명**: `EAS 빌드 결과 AAB 를 Play Console 에 자동 업로드`
5. **만들기 및 계속** 클릭
6. **이 서비스 계정에 프로젝트 액세스 권한 부여(선택사항)** — **건너뛰기** (Play Console 측에서 권한 부여)
7. **사용자에게 이 서비스 계정에 대한 액세스 권한 부여(선택사항)** — **건너뛰기**
8. **완료** 클릭

### Step 1-1. JSON 키 발급

1. 방금 만든 서비스 계정(`eas-submit-android@...`) 클릭
2. 상단 탭 **키** 클릭
3. **키 추가** → **새 키 만들기** → **JSON** 선택 → **만들기**
4. JSON 파일이 자동 다운로드됨 (예: `mindgarden-12345-abcdef.json`)
5. **이 파일을 절대 git 에 commit 하지 말 것** — 본 가이드 §Step 3 참고

> 키 파일을 분실하면 동일 절차로 재발급 후 기존 키는 삭제하세요.

---

## Step 2. Google Play Console — Service Account 권한 부여

> 약 2~3분 소요. 한 번만 진행하면 됩니다.

1. https://play.google.com/console/u/0/developers/ 접속
2. 좌측 메뉴 하단 **사용자 및 권한** 클릭
3. **새 사용자 초대** 클릭
4. 입력:
   - **이메일 주소**: Step 1 의 Service Account 이메일 (예: `eas-submit-android@<project-id>.iam.gserviceaccount.com`)
   - **액세스 만료**: 만료되지 않음 (또는 정책에 따라)
5. **앱 권한** 탭 → **앱 추가** 클릭 → **마인드가든** 앱 선택 → 다음 권한 체크:
   - ✅ **앱 정보 보기 및 다운로드** (View app information and download bulk reports)
   - ✅ **출시 관리** (Release manager) — track 별 업로드/롤아웃에 필요
   - ✅ **앱 액세스 권한 확인** (View app access) — selective
   - (필요 시) ✅ **테스트 트랙 출시** (Release to testing tracks)
6. **적용** → **사용자 초대** → **초대 보내기**

> 권한 변경 후 EAS Submit 가 인식하기까지 수 분 지연될 수 있습니다. 첫 submit 실패 시 5~10분 후 재시도.

---

## Step 3. JSON 키 안전 전달

본 워커(또는 GitHub Secrets) 에 다음 중 **하나** 의 방법으로 전달:

### 방법 A — 로컬 파일 경로 (개발 머신)

다운로드한 JSON 파일을 다음 경로에 배치 후 본 워커에 알려주세요:

```
expo-app/google-play-service-account.json
```

> 이미 `.gitignore` 에 `**/google-play-service-account*.json` 패턴 추가됨 → git 추적 대상 아님. 본 워커가 `git status` 로 재확인 후 진행.

### 방법 B — JSON 내용 직접 전달 (채팅)

JSON 파일 내용 전체를 채팅으로 붙여넣기. 본 워커가 로컬 파일로 저장 후 `eas credentials` 에 등록.

### 방법 C — GitHub Secret 으로 직접 등록 (사용자가 직접)

CI/CD 자동화만 사용할 거라면 본 워커 거치지 않고 직접 등록 가능:

```bash
# JSON 파일을 base64 인코딩
base64 -i /path/to/eas-submit-android-key.json -o /tmp/eas-sa.b64

# GitHub Secret 등록 (저장소 owner/repo 기준)
gh secret set EAS_GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 \
  --repo beta0629/MindGarden \
  --body "$(cat /tmp/eas-sa.b64)"

# 안전 삭제
shred -uvz /tmp/eas-sa.b64
```

추가로 EAS 자체 토큰도 필요:

```bash
# EAS access token (이미 등록되어 있을 수 있음 — 확인)
gh secret list --repo beta0629/MindGarden | grep -i expo
# 없으면:
# https://expo.dev/accounts/[account]/settings/access-tokens 에서 발급 후
gh secret set EXPO_TOKEN --repo beta0629/MindGarden --body "exp_*****"
```

---

## Step 4. 본 워커 자동화 (JSON 키 회수 후)

JSON 키가 도착하면 본 워커가 다음을 수행 (사용자 추가 작업 없음):

1. `expo-app/google-play-service-account.json` 로 파일 배치
2. `git status` 로 추적 대상이 **아닌지** 재확인
3. `cd expo-app && npx eas credentials --platform android` interactive 실행:
   - Production → Google Service Account → **Set up a Google Service Account Key for Play Store submissions** → 파일 경로 `./google-play-service-account.json` 입력
4. `npx eas submit --profile production --platform android --id <빌드 #16 Android AAB build-id> --non-interactive` 로 첫 자동 submit
5. Play Console **internal track** 에 빌드 14 가 `draft` 로 업로드되는지 확인
6. base64 인코딩 → `EAS_GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` GitHub Secret 등록
7. 결과 보고

---

## 5. eas.json 갱신 (본 PR 에 포함)

`expo-app/eas.json` → `submit.production.android` 항목:

```json
"android": {
  "serviceAccountKeyPath": "./google-play-service-account.json",
  "track": "internal",
  "releaseStatus": "draft"
}
```

- `track: "internal"` — Play Console internal testing track 으로 업로드
- `releaseStatus: "draft"` — **자동 rollout 안 함**, 사용자가 콘솔에서 검토 후 수동 publish (안전장치)
  - 안정화 후 `"completed"` 로 변경하면 internal testers 에게 즉시 배포

---

## 6. 워크플로 자동화 (`.github/workflows/eas-android-submit.yml`)

본 PR 에 포함된 워크플로:

- **트리거**: `workflow_dispatch` (수동) — Production EAS Build + auto-submit
- **입력**: `profile` (기본 `production`), `submit-id` (기존 빌드 재submit 시 사용)
- **Secret 의존**:
  - `EXPO_TOKEN` — Expo 계정 access token
  - `EAS_GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` — base64 인코딩된 JSON 키
- **동작**:
  1. checkout + node setup
  2. `EAS_GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` → `expo-app/google-play-service-account.json` 디코드
  3. `npx eas build --platform android --profile <profile> --non-interactive --auto-submit` (신규 빌드 시)
     또는 `npx eas submit --platform android --profile <profile> --id <submit-id> --non-interactive` (기존 빌드 submit 시)
  4. 결과 로그 워크플로 summary 출력

> 워크플로는 정적으로 검증되었으나, **실제 실행은 GitHub Secret 등록 후** 가능합니다.

---

## 7. 운영 반영 체크리스트

- [ ] Step 1 완료: Service Account 생성 + JSON 키 다운로드 (사용자)
- [ ] Step 2 완료: Play Console 권한 부여 (사용자)
- [ ] Step 3 완료: JSON 키 본 워커 또는 GitHub Secret 에 전달 (사용자)
- [ ] `expo-app/eas.json` 갱신 — `serviceAccountKeyPath` + `releaseStatus: draft` (본 PR 에 포함)
- [ ] `.gitignore` 패턴 추가 — `**/google-play-service-account*.json`, `**/google-services-key.json` (본 PR 에 포함)
- [ ] `.github/workflows/eas-android-submit.yml` 추가 (본 PR 에 포함)
- [ ] `npx eas credentials --platform android` 등록 (워커 — JSON 회수 후)
- [ ] 빌드 #16 AAB 테스트 submit → Play Console internal track 업로드 확인 (워커)
- [ ] `EAS_GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`, `EXPO_TOKEN` GitHub Secret 등록 (워커 또는 사용자)
- [ ] 워크플로 1회 수동 실행 → 자동 submit 검증

---

## 8. 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| `403 Forbidden` (Google Play API) | Play Console 권한 미부여 또는 지연 | 5~10분 대기 후 재시도; Step 2 권한 재확인 |
| `serviceAccountKeyPath ... not found` | JSON 파일 경로 잘못됨 | `expo-app/google-play-service-account.json` 존재 확인; `eas.json` 의 path 가 expo-app 기준 상대경로인지 확인 |
| `Package not found` | Play Console 에 첫 release 가 없음 (신규 앱) | 최초 1회는 Play Console 에 **수동 업로드** 필요. 이후부터 자동 |
| EAS 빌드 도중 submit 단계 skip | `--auto-submit` 누락 또는 `submit.production.android` 누락 | `eas.json` `submit.production.android` 정합 확인 + 빌드 명령에 `--auto-submit` 명시 |
| GitHub Actions 에서 SA 키 디코드 실패 | base64 인코딩이 줄바꿈 포함 | `base64 -w 0` (Linux) 또는 `base64 -b 0` (macOS) 로 한 줄 인코딩 |

---

## 9. 보안 주의

- **JSON 키 내용을 절대 git 에 commit 하지 말 것**. 본 PR 에서 `.gitignore` 에 다음 패턴 추가:
  - `**/google-play-service-account*.json`
  - `**/google-services-key.json`
- 채팅으로 JSON 전달 시, 작업 완료 후 본 워커가 로컬 파일을 **`shred -uvz`** (또는 동등 안전 삭제) 로 제거.
- Service Account 권한은 **Release manager** + **View app information** 로 제한 (전체 관리자 권한 부여 금지).
- 키 노출 의심 시 즉시 Google Cloud Console 에서 키 삭제 + 신규 키 발급 + GitHub Secret 갱신.

---

## 10. 참고 문서

- `expo-app/eas.json`
- `.github/workflows/eas-android-submit.yml`
- `docs/project-management/EXPO_APP_DEPLOYMENT_READINESS_REPORT.md` §1.4 E4
- `docs/운영반영/20260610/EXPO_APP_LOGIN_V2_RELEASE_REPORT.md`
- `docs/standards/DEPLOYMENT_STANDARD.md`
- EAS Submit (Android): https://docs.expo.dev/submit/android/
- EAS Submit configuration: https://docs.expo.dev/eas/submit-configuration/
