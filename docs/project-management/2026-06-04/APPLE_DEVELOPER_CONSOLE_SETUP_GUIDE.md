# Apple Developer Console 설정 가이드 — Sign in with Apple (SIWA)

> **작성일**: 2026-06-07
> **대상 빌드**: 1.0.6 / buildNumber 9 (재제출용)
> **목적**: Apple App Store 거절 대응 (Guideline 4.8) 의 T1 SIWA 트랙을 실가동 하기 위해 Apple Developer Console 에서 **사용자가 직접 수행해야 하는** 단계별 설정 절차. 코드 구현(T1-Coder) 이전·이후 어느 시점에도 시작 가능 — env 주입은 코드 머지 직전까지 완료 필요.
> **상위 문서**: `docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md` §1 T1, §7 T1-Coder 위임 프롬프트

---

## 0. 사전 준비

| 항목 | 확인값 |
|---|---|
| Apple Developer Program 가입 | 활성 (USD 99/년) |
| 권한 | **Account Holder** 또는 **Admin** 역할 (Service ID·Key 생성에 필수) |
| Bundle ID | `com.coresolution.mindgarden` (확정값은 `expo-app/app.config.ts` 의 `ios.bundleIdentifier` 와 일치 확인) |
| 운영 도메인 | `core-solution.co.kr` / `app.core-solution.co.kr` |
| 개발 도메인 | `dev.core-solution.co.kr` |

> 권한 부족 시: 조직 Team Agent 에게 Admin 권한 위임 요청 후 진행.

---

## 1. App ID 에 Sign In with Apple capability 활성화

1. <https://developer.apple.com/account/resources/identifiers/list> 접속
2. 좌측 **Identifiers** → 상단 필터 **App IDs**
3. `com.coresolution.mindgarden` (또는 실제 Bundle ID) 클릭
4. **Capabilities** 영역에서 `Sign In with Apple` 체크 → **Configure** → **Enable as a primary App ID** 선택 → **Save**
5. 변경 확인 후 우상단 **Save**

> 이 단계 후 Apple 이 기존 provisioning profile 을 invalidate 한다. §6 의 Profile 재발급 단계에서 갱신.

---

## 2. Service ID 생성 (= `APPLE_CLIENT_ID`)

웹 OAuth2 콜백을 위한 별도 Service ID. 백엔드 `AppleOAuth2ServiceImpl` 의 `client_id` 로 사용.

1. **Identifiers** → 우상단 **+** → **Services IDs** 선택 → **Continue**
2. 입력:
   - **Description**: `MindGarden Sign in with Apple` (자유)
   - **Identifier**: `com.coresolution.mindgarden.siwa` (역도메인 표기, 운영 권장. 개발 분리 시 `.dev` 접미)
3. **Continue** → **Register**
4. 등록된 Service ID 클릭 → `Sign In with Apple` 체크 → **Configure** 클릭

### Service ID Configure — Domain + Return URL 등록

| 환경 | Domains and Subdomains | Return URLs |
|---|---|---|
| **운영** | `core-solution.co.kr`, `app.core-solution.co.kr` | `https://app.core-solution.co.kr/api/v1/oauth2/apple/callback` |
| **개발** | `dev.core-solution.co.kr` | `https://dev.core-solution.co.kr/api/v1/oauth2/apple/callback` |
| **로컬 (선택)** | `<ngrok 도메인>` | `https://<ngrok>/api/v1/oauth2/apple/callback` |

> Return URL 은 실제 백엔드 `OAuth2Controller` 의 Apple 콜백 엔드포인트와 1:1. 코드 구현 단계에서 경로가 다르면 다시 동기화 필요.

> 운영·개발 Service ID 분리 권장 (예: `.siwa` / `.siwa.dev`). 동일 Service ID 에 운영·개발 도메인 함께 등록도 가능하나, 운영 비밀키 회전 시 영향 분리를 위해 분리 권장.

5. **Save** → Service ID 메인 화면 **Continue** → **Register**

**산출**: `APPLE_CLIENT_ID = com.coresolution.mindgarden.siwa` (운영) / `com.coresolution.mindgarden.siwa.dev` (개발)

---

## 3. Key (.p8) 생성 + 다운로드 (= `APPLE_KEY_ID` + `APPLE_PRIVATE_KEY`)

ES256 client_secret JWT 서명용 비공개 키.

1. <https://developer.apple.com/account/resources/authkeys/list> 접속
2. 우상단 **+** 또는 **Create a key**
3. **Key Name**: `MindGarden SIWA Key` (자유)
4. **Enable** 체크:
   - `Sign In with Apple` 체크 → **Configure**
   - Primary App ID 에 §1 의 App ID 선택 → **Save**
5. **Continue** → **Register**
6. **다운로드 (.p8 파일, 단 1회만)** — 키 ID 확인 (예: `7K8XYZ1A23`) — **Done**

> ⚠️ `.p8` 파일은 **다운로드 직후 분실 시 재발급 불가**. 반드시 **즉시 안전한 시크릿 저장소(1Password / AWS Secrets Manager / GitHub Secrets / 운영 KMS)** 에 백업.

**산출**:
- `APPLE_KEY_ID = 7K8XYZ1A23` (Apple 이 발급한 10자리 키 ID)
- `APPLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nMIGTAg...\n-----END PRIVATE KEY-----` (`.p8` 파일 내용)

---

## 4. Team ID 확인 (= `APPLE_TEAM_ID`)

1. <https://developer.apple.com/account> 우상단 또는 **Membership Details** 페이지
2. **Team ID** 10자리 영숫자 확인 (예: `A1B2C3D4E5`)

**산출**: `APPLE_TEAM_ID = A1B2C3D4E5`

---

## 5. env 변수 매핑

T1-Coder 가 백엔드 구현 시 사용하는 환경 변수. 운영 / 개발 / 로컬 분리.

### 5-1. 백엔드 (`application-prod.yml`, `application-dev.yml`, env)

```yaml
# application-prod.yml (예시)
spring:
  security:
    oauth2:
      client:
        registration:
          apple:
            client-id: ${APPLE_CLIENT_ID}
            client-authentication-method: private_key_jwt
            authorization-grant-type: authorization_code
            redirect-uri: https://app.core-solution.co.kr/api/v1/oauth2/apple/callback
            scope: name,email
            client-name: Apple

apple:
  oauth2:
    client-id: ${APPLE_CLIENT_ID}
    team-id: ${APPLE_TEAM_ID}
    key-id: ${APPLE_KEY_ID}
    private-key: ${APPLE_PRIVATE_KEY}  # PEM 텍스트 직주입 또는 파일 경로
```

### 5-2. 운영 서버 env 주입

#### systemd unit 환경변수 (예시)
```
[Service]
Environment="APPLE_CLIENT_ID=com.coresolution.mindgarden.siwa"
Environment="APPLE_TEAM_ID=A1B2C3D4E5"
Environment="APPLE_KEY_ID=7K8XYZ1A23"
EnvironmentFile=/etc/mindgarden/apple.env  # APPLE_PRIVATE_KEY (PEM, multi-line) 별도 파일
```

> `APPLE_PRIVATE_KEY` 는 PEM 줄바꿈을 포함하므로 systemd `Environment=` 한 줄로 주입하기 어렵다. 별도 `EnvironmentFile` 또는 `${file:/etc/mindgarden/apple.p8}` 패턴 권장.

#### GitHub Actions Secrets (CI/배포 트리거 시)
- `APPLE_CLIENT_ID_PROD` / `APPLE_CLIENT_ID_DEV`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY` (PEM 텍스트, base64 encode 권장)

### 5-3. Expo iOS (별도 env 불요)

`expo-apple-authentication` 패키지는 클라이언트 측에서 Apple ID 토큰을 직접 받아 백엔드로 전달. 클라이언트 측에 비밀키 주입 **금지**. 운영 변수는 백엔드만.

---

## 6. Provisioning Profile 재발급

§1 단계에서 SIWA capability 활성화로 기존 profile 이 invalidate 됨.

### 6-1. EAS 빌드 (권장 — 운영 빌드 1.0.6 / buildNumber 9)

```bash
cd expo-app
eas credentials
# → iOS → production → "Update Provisioning Profile" 선택
# 또는 자동 재발급:
eas build -p ios --profile production --clear-cache --non-interactive
```

EAS 가 Apple Connect API 통해 자동 재발급. 별도 수동 작업 없음.

### 6-2. Xcode (로컬 빌드 시)

1. Xcode → Preferences → Accounts → Apple ID 로그인
2. 좌측 Team 선택 → **Download Manual Profiles**
3. Target → Signing & Capabilities → Provisioning Profile 갱신 확인

---

## 7. Apple App Site Association (선택, 딥링크 필요 시만)

Apple 표준 SIWA 는 별도 AASA 등록 불필요. 그러나 `expo-apple-authentication` 의 web fallback(Service ID 경유) 사용 시 Return URL 도메인에 다음 파일 호스팅 가능:

```
GET https://app.core-solution.co.kr/.well-known/apple-app-site-association
Content-Type: application/json
```

본 가이드 범위 밖 — Universal Link 트랙 별도 PR.

---

## 8. 검증 체크리스트

| 항목 | 확인 |
|---|---|
| §1 App ID `Sign In with Apple` capability 체크 + Saved | [ ] |
| §2 Service ID 생성 + Domain/Return URL 등록 (운영·개발 분리 권장) | [ ] |
| §3 Key (.p8) 생성 + `.p8` 파일 안전 저장 + KEY_ID 메모 | [ ] |
| §4 Team ID 확인 | [ ] |
| §5 운영/개발 env 변수 4종 주입 준비 (`APPLE_CLIENT_ID/TEAM_ID/KEY_ID/PRIVATE_KEY`) | [ ] |
| §5 GitHub Actions Secrets 등록 (CI 배포 시) | [ ] |
| §6 Provisioning Profile 재발급 (EAS 또는 Xcode) | [ ] |
| `expo-app/app.config.ts` 에 `usesAppleSignIn: true` + entitlement 플러그인 추가 (T1-Coder 가 코드로 처리) | [ ] |
| T1-Coder 위임 후 백엔드 통합 테스트 (`AppleOAuth2ServiceImplJwksVerifyTest` 등) PASS | [ ] |
| 1.0.6 EAS 빌드 후 TestFlight 에서 Apple 버튼 → 가입 → 메인 진입 실기 검증 | [ ] |

---

## 9. 운영 변수 핸드오프 시 주의

- **`APPLE_PRIVATE_KEY`는 절대 git 에 커밋 금지** — `.gitignore` 의 `*.p8`, `application-local.yml`, `apple.env` 패턴 사전 확인
- 키 노출 의심 시 §3 페이지에서 즉시 **Revoke** 후 신규 Key 발급 — Service ID·Team ID 는 그대로 유지
- 6개월 client_secret JWT 만료는 백엔드가 자체 갱신 (T1-Coder 가 cron 또는 lazy refresh 구현). 운영자는 .p8 만 안전 보관

---

## 10. 다음 단계 (메인 어시스턴트가 위임)

1. 본 가이드 §1~§4 단계 사용자 직접 완료 → §5 운영 변수 4종 확보
2. T1-Coder 위임 (`docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md` §7 T1-Coder 프롬프트)
3. T1-Tester 위임 (E2E + JWKS 단위)
4. §6 Provisioning Profile 재발급 → 1.0.6 EAS 빌드 → TestFlight 내부 베타
5. ASC 제출 + 어필 메시지 (`APPLE_REVIEW_REPLY_DRAFT.md`) 발송

---

> **상위 문서**: `docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md`
> **관련 문서**: `APPLE_T1_SIWA_DESIGN_HANDOFF.md`, `APPLE_EAS_BUILD_GUIDE.md`, `APPLE_ASC_METADATA_CHANGES.md`
