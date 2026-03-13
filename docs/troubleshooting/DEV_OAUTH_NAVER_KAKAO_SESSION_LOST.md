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

### 방식 A: 루트 도메인 콜백 + 세션 쿠키 Domain 설정 (현재 적용)

- **콜백 URL**: `https://dev.core-solution.co.kr/api/auth/naver/callback` (그대로 루트 도메인)
- **세션 쿠키**: `Domain=dev.core-solution.co.kr` 로 설정 (RFC 6265: 선행 점 불허) → `dev.core-solution.co.kr` 및 **모든 서브도메인**(mindgarden 등)에서 동일 쿠키 전송
- **장점**: 네이버/카카오 개발자 콘솔에 **기존 루트 도메인 콜백만** 등록하면 됨. 서브도메인용 URL 추가 불필요.
- **설정**: `config/environments/development/dev.env` 에 `SESSION_COOKIE_DOMAIN=dev.core-solution.co.kr` (선행 점 없음), `NAVER_REDIRECT_URI`/`KAKAO_REDIRECT_URI` 는 `https://dev.core-solution.co.kr/...` 유지.  
  `application-dev.yml` 에 `server.servlet.session.cookie.domain: ${SESSION_COOKIE_DOMAIN:dev.core-solution.co.kr}` 반영됨.

### 방식 B: 서브도메인 콜백 (콜백과 프론트 동일 호스트)

- **콜백 URL**: `https://mindgarden.dev.core-solution.co.kr/api/auth/naver/callback`
- **세션 쿠키**: Domain 설정 없음. 콜백과 로그인 후 리다이렉트가 같은 호스트(mindgarden)이므로 쿠키 자동 전송.
- **장점**: 쿠키 도메인 설정 불필요.
- **단점**: 네이버/카카오 개발자 콘솔에 **서브도메인 콜백 URL**을 추가로 등록해야 함.

**현재 저장소 설정**: **방식 A** (루트 도메인 콜백 + `SESSION_COOKIE_DOMAIN=dev.core-solution.co.kr`, RFC 6265 준수로 선행 점 없음) 로 통일해 두었습니다.

---

## 조치 (반영됨)

1. **config/environments/development/dev.env**
   - `SESSION_COOKIE_DOMAIN=dev.core-solution.co.kr` 로 **세션 쿠키를 서브도메인과 공유** (선행 점 없음: RFC 6265/Chrome invalid 방지)
   - `NAVER_REDIRECT_URI`, `KAKAO_REDIRECT_URI` 는 **루트 도메인** 유지:  
     `https://dev.core-solution.co.kr/api/auth/naver/callback`,  
     `https://dev.core-solution.co.kr/api/auth/kakao/callback`
   - `OAUTH2_BASE_URL` = 로그인 성공 후 리다이렉트할 프론트(mindgarden 등)

2. **src/main/resources/application-dev.yml**
   - `server.servlet.session.cookie.domain: ${SESSION_COOKIE_DOMAIN:}` 추가 (dev 프로파일에서만 적용)

3. **네이버/Kakao 개발자 콘솔**
   - **방식 A** 사용 시: 기존처럼 **루트 도메인**만 등록하면 됨.  
     `https://dev.core-solution.co.kr/api/auth/naver/callback`,  
     `https://dev.core-solution.co.kr/api/auth/kakao/callback`
   - (방식 B로 바꿀 경우에만) 서브도메인 URL 추가 등록

4. **서버 반영**
   - 개발 서버 env에 `SESSION_COOKIE_DOMAIN=dev.core-solution.co.kr` 및 위 redirect URI 반영 후 **앱 재시작**  
     `sudo systemctl restart mindgarden-dev`

## OAuth 진입 경로 (참고)

- **존재하지 않는 경로** (404): `/api/auth/naver`, `/api/auth/kakao`
- **실제 진입 경로**: `/api/auth/oauth2/naver/authorize`, `/api/auth/oauth2/kakao/authorize`
- 프론트 로그인 버튼은 위 **authorize** 경로로 연결해야 함.

## 관련

- 서버 로그: `journalctl -u mindgarden-dev.service -f` 또는 `/var/www/mindgarden-dev/logs/`
- Nginx: auth 경로 302 정상, 5xx 없음 (세션 문제는 앱/도메인·쿠키 설정 이슈)
