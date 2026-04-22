# SNS(OAuth) 로그인 성공 후 `POST /api/v1/auth/login` 400 — 비밀번호 요구 메시지

**우선순위**: P3  
**범위**: 프론트 OAuth 콜백 경로와 `SessionContext` 연동. (본 문서는 **코드 직수정 없음**, 원인·수정 방향·검증만 정리.)

---

## 증상

- SNS 로그인 플로우는 **성공**한 것처럼 보이나, 브라우저 개발자 도구에서 다음이 관찰됨.
  - `POST /api/v1/auth/login` → **HTTP 400**
  - 응답 메시지에 **「비밀번호를 입력해주세요.」** (또는 동일 의미의 사용자 메시지)

즉, OAuth로 이미 식별된 사용자인데도 **비밀번호 로그인 API**가 호출되고, 비밀번호가 없어 실패하는 패턴이다.

---

## 원인

- `OAuth2Callback` 처리 분기에서 **`SessionContext.login`**(이메일·**비밀번호 로그인 전용** 경로)에 **`userInfo`만** 넘기고, OAuth에서 확보한 **토큰 등 인자를 반영하지 않음**.
- 그 결과 세션/컨텍스트 정리는 OAuth 성공 기준으로 진행되나, 이어지는 API 호출이 **일반 로그인 엔드포인트**로 붙으면서 비밀번호 검증 단계에서 400이 발생한다.

---

## 수정 방향 (구현 시)

- 해당 OAuth 콜백 분기에서는 **전화번호 계정 선택 등에서 쓰는 `testLogin` 패턴**과 동일하게, **OAuth·소셜 로그인에 맞는 로그인 진입점**을 사용한다.
- 목표: OAuth 완료 후 **불필요한 `POST /api/v1/auth/login`(비밀번호 로그인)** 호출이 발생하지 않도록 분기를 정리한다.

---

## 배포 후 확인 체크리스트

| 단계 | 확인 |
|------|------|
| OAuth 로그인 | 제공자(카카오/네이버/구글 등) 선택 → 인증 완료 |
| 콜백 | 콜백 URL 처리 후 에러 없이 진행 |
| 대시보드 | 로그인 사용자 화면 정상 진입 |
| 네트워크 | DevTools **Network**에서 **`/api/v1/auth/login` 요청이 없음**(또는 OAuth 플로에 불필요하게 붙지 않음) |

---

## 회귀 검증

- **이메일 + 비밀번호 로그인** 기존 플로가 그대로 동작하는지 확인한다. (OAuth 수정이 비밀번호 로그인 경로에 영향을 주지 않도록 분리 유지.)

---

## 참고

- OAuth·세션 관련 다른 이슈: [DEV_OAUTH_NAVER_KAKAO_SESSION_LOST.md](./DEV_OAUTH_NAVER_KAKAO_SESSION_LOST.md) (쿠키·호스트 불일치 등)
- 문서 위치·인덱스 규칙: [.cursor/skills/core-solution-documentation/SKILL.md](../../.cursor/skills/core-solution-documentation/SKILL.md)
