# 개발 서버 네이버/카카오 로그인 후 세션 유지 실패

## 증상

- 네이버/카카오 로그인 클릭 → 인증 완료 → **다시 로그인 화면** 또는 로그인 안 된 것처럼 보임
- 서버 로그: "네이버 OAuth2 로그인 성공" 후 "세션 ID는 일치하지만 세션에 사용자 정보가 없음", "데이터베이스에서 활성 세션을 찾을 수 없음"

## 원인

**콜백 도메인과 로그인 후 리다이렉트 도메인이 달라서** 세션 쿠키(JSESSIONID)가 전달되지 않음.

| 단계 | 도메인 | 설명 |
|------|--------|------|
| 1. 사용자 접속 | mindgarden.dev.core-solution.co.kr | 프론트 접속 |
| 2. Naver/Kakao 콜백 | dev.core-solution.co.kr | 콜백 URL이 루트 도메인 |
| 3. 서버가 Set-Cookie | (기본) 호스트만 적용 | 쿠키가 **dev.core-solution.co.kr** 에만 유효 |
| 4. 로그인 후 리다이렉트 | mindgarden.dev.core-solution.co.kr | **다른 호스트**로 이동 |
| 5. 다음 요청 | mindgarden.dev.core-solution.co.kr | 브라우저가 해당 쿠키 미전송 → 빈 세션 |

→ "로그인 성공" 직후 요청이 **빈 세션**으로 처리됨.

---

## 서브도메인 필수 여부 검토

**결론: 서브도메인 전용 콜백이 꼭 필요하지는 않습니다.** 두 가지 방식 모두 가능합니다.

### 방식 A: 루트 도메인 콜백 + parent 세션 쿠키 Domain (사용하지 않음)

- parent `Domain` 은 `*.dev` 테넌트 Host 가 같은 `JSESSIONID` 를 받게 한다. 다른 테넌트 접속이 이전 세션으로 이어진다.
- dev 프로파일은 이 Domain 을 **신규 쿠키에 넣지 않는다** (host-only).

### 방식 C: apex 콜백 + 일회용 oauthExchangeCode (현재 적용)

- **콜백 URL**: `https://dev.core-solution.co.kr/api/auth/naver/callback` (루트 도메인 유지)
- **세션 쿠키**: Domain 없음 (host-only). mindgarden 과 mindcare 는 `JSESSIONID` 를 공유하지 않는다.
- **OAuth**: 콜백이 `oauthExchangeCode` 를 테넌트 프론트 쿼리에 넣고, SPA 가 `POST /api/v1/auth/oauth2/web-session-tokens` 로 1회 교환한다. apex 의 host-only 쿠키가 없어도 JWT 를 받는다 (`OAUTH_WEB_SESSION_EXCHANGE_CODE_ENABLED` 기본 true).
- **설정**: `application-dev.yml` 에 `server.servlet.session.cookie.domain` 을 두지 않는다. `dev.env` 의 `SESSION_COOKIE_DOMAIN` 은 예전 parent 쿠키를 `Max-Age=0` 으로 지울 때만 쓴다.

### 방식 B: 서브도메인 콜백 (콜백과 프론트 동일 호스트)

- **콜백 URL**: `https://mindgarden.dev.core-solution.co.kr/api/auth/naver/callback`
- **세션 쿠키**: Domain 설정 없음. 콜백과 로그인 후 리다이렉트가 같은 호스트(mindgarden)이므로 쿠키 자동 전송.
- **장점**: 쿠키 도메인 설정 불필요.
- **단점**: 네이버/카카오 개발자 콘솔에 **서브도메인 콜백 URL**을 추가로 등록해야 함.

**현재 저장소 설정**: **방식 C** (apex 콜백 + host-only 세션 쿠키 + `oauthExchangeCode`). parent Domain 으로 서브도메인 세션을 공유하지 않는다.

---

## 조치 (반영됨)

1. **config/environments/development/dev.env**
   - `SESSION_COOKIE_DOMAIN` 은 신규 `Set-Cookie` Domain 이 아니다. 예전 parent 쿠키 만료용이다.
   - `NAVER_REDIRECT_URI`, `KAKAO_REDIRECT_URI` 는 **루트 도메인** 유지.
   - `OAUTH_WEB_SESSION_EXCHANGE_CODE_ENABLED=true` — 콜백 Host 와 테넌트 Host 가 달라도 JWT 교환.

2. **세션 쿠키 Domain**
   - `dev` 프로파일은 `SESSION_COOKIE_DOMAIN` 이 있어도 Domain 을 쓰지 않는다 (`SessionCookieSupport`).
   - Path / HttpOnly / SameSite / Secure 는 그대로다.
   - Host 테넌트와 세션 tenantId 가 다르면 세션을 끊고 그 Host 에서 다시 로그인한다. apex 는 테넌트 라벨이 없어 OAuth 콜백 세션을 유지한다.

3. **네이버/Kakao 개발자 콘솔**
   - **방식 C** 사용 시: 기존처럼 **루트 도메인**만 등록하면 됨.  
     `https://dev.core-solution.co.kr/api/auth/naver/callback`,  
     `https://dev.core-solution.co.kr/api/auth/kakao/callback`
   - (방식 B로 바꿀 경우에만) 서브도메인 URL 추가 등록

4. **서버 반영**
   - 개발 서버는 host-only 세션 쿠키로 기동한다. parent Domain 을 다시 넣지 않는다.
   - 반영은 앱 재시작 후 확인한다.

## OAuth 진입 경로 (참고)

- **존재하지 않는 경로** (404): `/api/auth/naver`, `/api/auth/kakao`
- **실제 진입 경로**: `/api/auth/oauth2/naver/authorize`, `/api/auth/oauth2/kakao/authorize`
- 프론트 로그인 버튼은 위 **authorize** 경로로 연결해야 함.

## 관련

- 서버 로그: `journalctl -u mindgarden-dev.service -f` 또는 `/var/www/mindgarden-dev/logs/`
- Nginx: auth 경로 302 정상, 5xx 없음 (세션 문제는 앱/도메인·쿠키 설정 이슈)
