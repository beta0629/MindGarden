# Web Google OAuth A-2 server-side auth-code 마이그레이션 운영 가이드

> **상태**: 코드 마이그레이션 완료(PR #211, 2026-06-10). 본 문서는 운영자가 Google Cloud Console에서 수행해야 할 등록 정책과 검증 절차를 명문화한다.
> **개정**: 2026-06-11 — apex 단일 redirect URI 정책 정정 및 JavaScript origins 불필요 사유 명시.

## 1. 배경 (현재 상태)

Web Google 로그인은 **이미 A-2 server-side authorization code 흐름**으로 동작하고 있다. 카카오/네이버/Apple과 100% 동일 패턴이며, FE는 access_token 또는 id_token을 직접 보유하지 않는다.

```text
[FE] /login (Google 버튼 클릭)
  → BE GET /api/v1/auth/oauth2/google/authorize       ← state=base64url(tenantId)+nonce, redirect_uri=apex
  → window.location.href = authUrl
[Google 동의 화면]
  → 302 redirect → BE GET /api/v1/auth/google/callback?code=&state=
[BE]
  1) state.prefix → tenantId 복원 + TenantContextHolder
  2) Google token endpoint POST (client_id + client_secret + code + redirect_uri=apex)
     → access_token (+ scope 에 openid 가 있으면 id_token)
  3) Google userinfo / tokeninfo API 로 사용자 정보 조회
  4) 휴대폰 OTP 매칭 / 회원가입 / 계정 선택 분기
  5) JWT 발급 → 302 redirect → 테넌트 SPA `/auth/oauth2/callback`
```

**과거 폐기 흐름**:
- `useGoogleLogin({ flow: 'implicit' })` + GIS popup → 멀티테넌트 와일드카드(`*.core-solution.co.kr`) 환경에서 Google JavaScript origin 와일드카드 미지원으로 `origin_mismatch` 차단 발생 → PR #211(2026-06-10) 에서 폐기됨.

## 2. Google Cloud Console 등록 정책 (운영자 수행)

### 2.1 위치

1. https://console.cloud.google.com/ 접속
2. 프로젝트 선택 → **APIs & Services → Credentials**
3. **OAuth 2.0 Client IDs** 섹션에서 운영용 Web Client (예: `CoreSolution-Web-Production`) 선택

### 2.2 Authorized redirect URIs (필수)

다음 **apex 호스트 2개만** 등록한다. 서브도메인 등록은 불필요하다.

| 환경 | redirect URI |
| --- | --- |
| 운영 | `https://core-solution.co.kr/api/v1/auth/google/callback` |
| 개발 | `https://dev.core-solution.co.kr/api/v1/auth/google/callback` |

> **이유**: BE `OAuth2Controller#buildGoogleCallbackUrl(HttpServletRequest)` 가 모든 테넌트 서브도메인 콜백을 apex 메인 도메인으로 정규화한다. 테넌트 식별은 `state` 의 base64url prefix(tenantId)로 복원되므로 서브도메인별 redirect URI를 등록할 필요가 없다(카카오/네이버/Apple 동일 패턴).

> **로컬 디버깅**: 필요 시 `http://localhost:8080/api/v1/auth/google/callback` 도 추가할 수 있으나, 일반 개발자는 `dev.core-solution.co.kr` 환경을 사용하므로 강제 사항은 아니다.

### 2.3 Authorized JavaScript origins (사실상 불필요)

A-2 server-side 흐름은 **전체 페이지 redirect**로 BE authorize URL → Google 동의 화면 → BE callback 으로 진행하며, GIS popup/IFrame 또는 `gapi.auth2` 클라이언트 라이브러리를 사용하지 않는다. 따라서 JavaScript origins 등록은 토큰 발급/검증 어디에도 사용되지 않는다.

다만 로컬 개발에서 `<GoogleOAuthProvider>` 진입 자체를 시뮬레이션하고 싶다면 다음 1개만 등록한다.

| 용도 | JavaScript origin |
| --- | --- |
| 로컬 개발(선택) | `http://localhost:3000` |

> 운영/개발 호스트(`https://core-solution.co.kr`, `https://dev.core-solution.co.kr` 등) 는 JavaScript origins에 **등록할 필요가 없다**. 등록되어 있으면 그대로 두어도 무해하지만, 신규 등록은 불필요하다.

> 과거 가이드(서브도메인+apex 모두 등록 권장) 은 폐기된 implicit popup 흐름의 잔재이다. 본 가이드의 §2.2 redirect URIs만 충족하면 운영 흐름은 정상 동작한다.

### 2.4 적용 시점

저장 직후 Google 측에 반영된다. 단, Google CDN 캐시로 인해 최대 5분 정도 지연이 발생할 수 있다. BE 배포 직후 즉시 검증하면 일시적으로 `redirect_uri_mismatch`가 보고될 수 있으므로 5분 후 재시도한다.

## 3. 환경변수 / GitHub Secrets

운영/개발 환경 모두 다음 환경변수가 BE에 주입되어야 한다.

| Key | 값 |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google Cloud Console 의 Web Client ID |
| `GOOGLE_CLIENT_SECRET` | Web Client Secret |
| `GOOGLE_REDIRECT_URI` | (선택) 동적 apex 정규화가 실패할 때의 fallback. 운영=`https://core-solution.co.kr/api/v1/auth/google/callback`, 개발=`https://dev.core-solution.co.kr/api/v1/auth/google/callback` |
| `GOOGLE_REGISTERED_URLS` | (PR #216, 옵션 B′) 등록된 redirect URI 화이트리스트. 콤마 구분. 미주입 시 graceful skip(검증 우회). 예) `https://core-solution.co.kr/api/v1/auth/google/callback,https://dev.core-solution.co.kr/api/v1/auth/google/callback` |

FE 환경변수 `REACT_APP_GOOGLE_CLIENT_ID` 는 UI 분기(GIS 로고 표시 여부)에만 사용되며 인증 자체에는 영향이 없다. 미주입 환경에서도 Google 버튼은 노출된다.

## 4. 검증 체크리스트

운영 배포 직후 다음을 실행한다.

- [ ] **운영 로그인 페이지** (`https://<tenant>.core-solution.co.kr/login`) → Google 버튼 클릭
- [ ] Network 패널에서 `GET /api/v1/auth/oauth2/google/authorize` → 200 + `data.authUrl` 응답 확인
- [ ] `Location` redirect → `https://accounts.google.com/o/oauth2/v2/auth?...&redirect_uri=https%3A%2F%2Fcore-solution.co.kr%2Fapi%2Fv1%2Fauth%2Fgoogle%2Fcallback&...`
- [ ] Google 동의 후 `GET https://core-solution.co.kr/api/v1/auth/google/callback?code=...&state=...` → 302
- [ ] `Location` 의 최종 SPA URL이 테넌트 서브도메인(`https://<tenant>.core-solution.co.kr/auth/oauth2/callback?...`) 인지 확인
- [ ] BE 로그(`Google OAuth2 콜백 - state 검증`, `tenantId 를 TenantContextHolder 에 설정`) 확인
- [ ] **개발 환경** (`https://<tenant>.dev.core-solution.co.kr/login`) 도 동일 검증
- [ ] 회귀 검증: 카카오/네이버/Apple 로그인 모두 정상 동작 확인 (영역 격리됨)

문제 발생 시:

| 증상 | 원인/조치 |
| --- | --- |
| Google 동의 화면에서 `redirect_uri_mismatch` | Console redirect URI 미등록 또는 캐시 → §2.4 5분 대기 후 재시도. 그래도 발생하면 BE 로그 `Google OAuth2 인증 URL 생성: redirect_uri=...` 와 Console 등록값을 1글자 단위로 대조 |
| 콜백 후 `/login?error=MSG_TENANT_NOT_REGISTERED` | state 의 tenantId 가 비어있거나 미등록 → BE 로그 `Google OAuth2 콜백 - tenant_id 를 찾을 수 없습니다` 의 `unresolvedReason` 확인 |
| 콜백 후 `/login?error=SECURITY_VERIFICATION_FAILED` | state mismatch → 세션 쿠키(JSESSIONID) 가 cross-origin 으로 보존되는지 확인. FE fetch 호출에 `credentials: 'include'` 필수 |

## 5. 절대 금지 사항

- 운영 Console redirect URI를 자동화 스크립트로 변경하지 않는다(본 가이드만 따른다).
- raw `access_token` 또는 `id_token` 을 FE에 노출하지 않는다(server-side 흐름의 핵심 — BE만 token 보유).
- Apple/Naver/Kakao 콜백 로직은 본 문서 범위 밖이다. 변경 시 별도 PR로 분리.
- 와일드카드 redirect URI (`https://*.core-solution.co.kr/api/v1/auth/google/callback`) 는 Google이 지원하지 않으므로 시도하지 않는다.

## 6. 참고

- PR #211(2026-06-10): implicit popup → server-side auth-code (A-2) 마이그레이션
- PR #216(2026-06-11): OAuth 4종 `REGISTERED_URLS` 검증 표준화 (옵션 B′)
- PR #218(2026-06-11): OAuth tenant 결락 분기 ERROR → WARN 강등 + Micrometer Counter
- `OAuth2Controller#googleAuthorize`, `OAuth2Controller#googleCallback`, `OAuth2Controller#buildGoogleCallbackUrl`
- `GoogleOAuth2ServiceImpl#getAccessToken(code, redirectUri)`, `#exchangeCodeForTokens(code, redirectUri)`, `#getUserInfo(accessToken)`, `#getUserInfoFromIdToken(idToken)`
- `frontend/src/utils/socialLogin.js` § `googleLogin` (server-side redirect 호출부)
- `frontend/src/constants/oauth2.js` § `GOOGLE_WEB_CLIENT_ID` (UI 분기 가이드)

