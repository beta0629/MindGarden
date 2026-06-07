# Apple T1 SIWA — 운영 env 주입 가이드 (5종)

> **작성일**: 2026-06-07
> **트랙**: T1 (Sign in with Apple) — Apple App Store 4.8 (Login Services)
> **선행 문서**: `docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md`,
> `docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md`
> **대상**: 운영 반영 담당 (배포·시스템 관리자)

## 0. TL;DR

Apple Sign in with Apple 의 **백엔드 5종 운영 env** 를 다음 두 위치에 주입한다.
실제 값은 절대 저장소에 커밋하지 않는다 (`.env.example`, `application.yml` 은 placeholder 만 보관).

| Env Key | 위치 | 의미 |
|---|---|---|
| `APPLE_CLIENT_ID`     | Service ID (예: `co.kr.coresolution.app.signin`) | identityToken `aud` 검증 기준 |
| `APPLE_TEAM_ID`       | Apple Developer Team ID (10자리) | client_secret JWT `iss` |
| `APPLE_KEY_ID`        | Sign in with Apple Key ID (10자리) | client_secret JWT header `kid` |
| `APPLE_PRIVATE_KEY`   | .p8 PEM 파일 내용 (멀티라인) | client_secret JWT ES256 서명용 |
| `APPLE_REDIRECT_URI`  | Service ID 에 등록한 Return URL (예: `https://api.core-solution.co.kr/oauth/apple/callback`) | `/auth/token` 호출의 redirect_uri |

> Apple Developer Console 의 등록 절차는 `APPLE_DEVELOPER_CONSOLE_SETUP_GUIDE.md` 를 참조.

## 1. 주입 대상 위치

### 1.1 백엔드 운영 서버 (`.env.prod` 또는 systemd EnvironmentFile)

운영 백엔드는 SSH 배포(`/.github/workflows/deploy-backend-dev.yml`, `deploy-production.yml`) 후
`/opt/coresolution/.env.prod` (혹은 systemd unit 의 `EnvironmentFile=`) 에서 환경 변수를 읽는다.
다음 명령을 운영 서버에서 1회만 실행 (관리자 권한 필요):

```bash
# 1) PEM 파일 업로드 (로컬→운영 서버) — 권한 600 으로 저장
scp ~/Downloads/AuthKey_XXXXXXXXXX.p8 deployer@<운영-서버>:/opt/coresolution/secrets/apple-siwa.p8
ssh deployer@<운영-서버> 'chmod 600 /opt/coresolution/secrets/apple-siwa.p8'

# 2) .env.prod 에 5종 env 추가 (heredoc 으로 PEM 인라인 — Spring `${APPLE_PRIVATE_KEY:}` 가 멀티라인 OK)
ssh deployer@<운영-서버> bash <<'EOF'
sudo -u coresolution tee -a /opt/coresolution/.env.prod >/dev/null <<EOENV
APPLE_CLIENT_ID=co.kr.coresolution.app.signin
APPLE_TEAM_ID=ABCDEFGHIJ
APPLE_KEY_ID=KEYIDABCDE
APPLE_REDIRECT_URI=https://api.core-solution.co.kr/api/v1/auth/oauth/apple/callback
APPLE_PRIVATE_KEY="$(cat /opt/coresolution/secrets/apple-siwa.p8)"
EOENV
sudo chown coresolution:coresolution /opt/coresolution/.env.prod
sudo chmod 600 /opt/coresolution/.env.prod
EOF

# 3) systemd 재시작 (Spring Boot)
ssh deployer@<운영-서버> 'sudo systemctl restart coresolution-backend'
```

> **검증**: 재시작 직후 `journalctl -u coresolution-backend -n 100 --no-pager` 로
> `AppleOAuth2Properties` 바인딩이 비어 있지 않은지(`clientId=co.kr...`) 확인.

### 1.2 GitHub Actions Secrets (CI/CD)

CI 단계에서 `mvn test` 가 통합 테스트(Apple 라이브 호출 없음)만 실행하므로 **CI 단계에는 주입 불필요**.
운영 반영 워크플로(`deploy-production.yml`)가 .env.prod 파일을 새로 덮어쓰는 패턴이라면
다음 5종 Secret 을 GitHub 저장소 Settings → Secrets → Actions 에 추가 후 워크플로 step 에 매핑한다.

GitHub UI: <https://github.com/coresolution-co/mindGarden/settings/secrets/actions>

```
APPLE_CLIENT_ID          = co.kr.coresolution.app.signin
APPLE_TEAM_ID            = (Apple Developer Team ID 10자리)
APPLE_KEY_ID             = (SIWA Key ID 10자리)
APPLE_PRIVATE_KEY        = (.p8 PEM 전체 — 헤더/푸터 포함 멀티라인 그대로 붙여넣기)
APPLE_REDIRECT_URI       = https://api.core-solution.co.kr/api/v1/auth/oauth/apple/callback
```

`gh` CLI 로 일괄 등록 (로컬 셸에서, gh 인증·write:secrets 권한 필요):

```bash
gh secret set APPLE_CLIENT_ID    --repo coresolution-co/mindGarden --body "co.kr.coresolution.app.signin"
gh secret set APPLE_TEAM_ID      --repo coresolution-co/mindGarden --body "ABCDEFGHIJ"
gh secret set APPLE_KEY_ID       --repo coresolution-co/mindGarden --body "KEYIDABCDE"
gh secret set APPLE_REDIRECT_URI --repo coresolution-co/mindGarden --body "https://api.core-solution.co.kr/api/v1/auth/oauth/apple/callback"
# PEM 은 파일 입력으로 — 줄바꿈 보존
gh secret set APPLE_PRIVATE_KEY  --repo coresolution-co/mindGarden < ~/Downloads/AuthKey_XXXXXXXXXX.p8
```

> 워크플로에서 사용 시:
>
> ```yaml
> env:
>   APPLE_CLIENT_ID:    ${{ secrets.APPLE_CLIENT_ID }}
>   APPLE_TEAM_ID:      ${{ secrets.APPLE_TEAM_ID }}
>   APPLE_KEY_ID:       ${{ secrets.APPLE_KEY_ID }}
>   APPLE_PRIVATE_KEY:  ${{ secrets.APPLE_PRIVATE_KEY }}
>   APPLE_REDIRECT_URI: ${{ secrets.APPLE_REDIRECT_URI }}
> ```

### 1.3 프론트엔드 (웹) — 공개 키 2종

웹 빌드(React 정적 산출물) 는 Apple JS SDK 가 사용하는 **공개** 키 2종만 주입한다.
민감한 .p8 / TEAM_ID 등은 웹 빌드에 절대 들어가지 않는다.

| Env (build-time) | 값 |
|---|---|
| `REACT_APP_APPLE_CLIENT_ID`    | Apple Service ID — 동일 값 |
| `REACT_APP_APPLE_REDIRECT_URI` | Service ID 등록 Return URL — 동일 값 |

`deploy-frontend-prod.yml` 의 `env:` 또는 빌드 단계 환경 변수에 매핑.

### 1.4 Expo iOS (EAS)

Apple `expo-apple-authentication` 은 디바이스의 Apple ID 기반이라 **클라이언트 키가 필요 없다**.
iOS Bundle ID(`com.mindgarden.MindGardenMobile`) 자체가 ASC 의 SIWA Capability 등록 키 역할.
따라서 EAS 환경변수 추가는 불필요. `app.config.ts` 의 `usesAppleSignIn: true` +
`com.apple.developer.applesignin` entitlement 만으로 충분.

## 2. 운영 검증 체크

1) 백엔드 운영 서버 재시작 후
```
curl -sS https://api.core-solution.co.kr/api/v1/auth/oauth/apple/login \
  -X POST -H 'Content-Type: application/json' \
  -d '{"identityToken":"deliberately-invalid"}' | jq .
```
응답 `success=false`, `message` 가 "Apple 로그인 검증에 실패했습니다." 면 컨트롤러 + Verifier 가 정상 부트.

2) Spring 로그에서 `AppleOAuth2Properties` 의 `clientId` 가 placeholder(빈 문자열)가 아닌지 확인.

3) Apple 실기기에서 SIWA 시트 → 가입/로그인 성공 → 두 번째 로그인 시 fullName/email 미수신
   상태에서도 `apple_sub` 으로 동일 사용자 매칭 확인 (디자이너 §4.1).

## 3. 보안 주의사항

- `.p8` 파일은 한 번만 다운로드 가능 — Apple Developer Console 에서 재발급 시 새 Key ID 가 발급되어
  `APPLE_KEY_ID` 도 함께 갱신해야 한다.
- `APPLE_PRIVATE_KEY` 는 운영 서버 외부로 절대 복사하지 않는다. 임시 노트북·메신저 전달 금지.
- GitHub Secret 은 한 번 등록되면 UI 에서 다시 읽을 수 없다. 백업은 별도 보안 보관함(1Password 등)에.
- client_secret JWT TTL 은 보안상 60일 권장(`APPLE_CLIENT_SECRET_TTL_SECONDS` 으로 조정 가능).
  Apple 정책 상한 6개월(15,777,000초) 도달 전 자동 갱신 cron 또는 모니터링 필수.

## 4. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-06-07 | 초기 작성 — Apple T1 운영 env 5종 주입 가이드 |
