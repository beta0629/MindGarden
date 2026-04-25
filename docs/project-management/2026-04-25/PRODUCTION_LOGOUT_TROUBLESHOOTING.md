# 운영 환경 “곧바로 로그아웃” 증상 구분·트러블슈팅

운영 담당자가 **Network 탭·백엔드 로그**로 증상을 재현·구분할 수 있도록 정리한 문서다. (코드 경로는 파일·함수명만 기술하며, 토큰·세션 ID 등 민감값은 기록하지 않는다.)

---

## 1. 증상 정의

| 구분 | 설명 | 전형적 질문 |
|------|------|-------------|
| **A. 로그인 직후 튕김** | 로그인 성공 직후 대시보드·내부 화면으로 갔다가 곧 `/login`으로 돌아감. 특정 **첫 API**가 401이거나, `current-user`가 401. | “한 계정만?” “같은 시간대 반복?” |
| **B. 배포·재시작 직후 전원** | 릴리스/인스턴스 재기동/세션 스토어 초기화 직후 **다수 계정**이 동시에 로그인 풀림. | “배포 직전엔 괜찮았나?” “세션 Redis/DB만 재시작했나?” |

- **A**는 대개 **개별 요청(헤더·쿠키·테넌트·타이밍)** 문제.
- **B**는 대개 **서버 측 세션 저장소 무효화** 또는 **전역 배포**와 연관된 경우가 많다.

---

## 2. Network 우선순위 (캡처 순서)

1. **첫 실패 요청**  
   - Preserve log 켜고, **시간순**으로 **가장 먼저** 실패(4xx/5xx)한 요청을 식별한다.  
   - 이 요청이 “왜 401/403/400이었는지”가 루트에 가장 가깝다.

2. **`/api/v1/auth/current-user`**  
   - **상태 코드**: 200(세션·인식됨) vs 401(미인증).  
   - **Request Headers → Cookie**: `JSESSIONID` 등 **세션 쿠키가 붙었는지**, SameSite/Domain이 기대와 맞는지(오리진·서브도메인 일치 여부).

3. **Request Cookie vs API Base URL**  
   - 프론트의 API 호스트와 **Set-Cookie Domain**이 맞지 않으면, 브라우저가 `current-user`에 쿠키를 안 보내 401이 난다.  
   - (구현: `getApiBaseUrl()` / `API_BASE_URL`·`fetch(..., credentials: 'include')` — 엔지니어 확인용)

운영 캡처 시 **URL 전체(도메인), 상태 코드, Cookie 유무(값은 마스킹)** 만으로도 1차 구분이 가능하다.

---

## 3. 코드 경로 요약 (참고)

| 영역 | 파일 | 핵심 |
|------|------|------|
| AJAX 401/403 시 세션 재검증 후 로그인 이동 | `frontend/src/utils/ajax.js` | `checkSessionAndRedirect` — `getApiBaseUrl()` + `/api/v1/auth/current-user`로 재확인, `redirectToLoginPageOnce` |
| 400 + 테넌트/세션 관련 본문 시 로그인 이동 | `frontend/src/utils/ajax.js` | `apiGet` 등 — `TENANT_ID_REQUIRED` 등과 매칭 시 `redirectToLoginPageOnce` |
| 일반 401 UNAUTHORIZED 처리 | `frontend/src/utils/ajax.js` | `handleError` — (로컬이 아니면) `redirectToLoginPageOnce` |
| 마운트 시 세션 검증 | `frontend/src/contexts/SessionContext.js` | `SessionProvider` — `sessionManager.checkSession(true)` |
| `current-user` fetch·401 처리 | `frontend/src/utils/sessionManager.js` | `SessionManager.checkSession` — `redirectToLoginPageOnce` (`sessionRedirect`) |
| 로그인으로 한 번만 이동 | `frontend/src/utils/sessionRedirect.js` | `redirectToLoginPageOnce` |
| `current-user` 401 로그 | `AuthController` (`getCurrentUser`) | `current-user 401: 세션존재=...` |

---

## 4. 가설 표

| 가설 | 증상과의 연결 | 확인 방법 |
|------|----------------|-----------|
| **세션 스토어 리셋** | B에 가깝다. 배포/Redis flush/톰캣만 재시작으로 서버 측 세션이 사라짐. | 배포·인프라 이벤트 시각과 401 시각이 일치하는지. `current-user` 401 + 백엔드에 `세션존재=false` 류 로그. |
| **크로스 오리진 / 쿠키 미전송** | A에 가깝다. API는 A 도메인, UI는 B 도메인(또는 www vs apex)이면 `credentials: 'include'`여도 쿠키가 안 붙을 수 있음. | Network에서 **동일 요청**에 Cookie 헤더 유무, API 요청 **전체 URL 호스트**와 **페이지 origin** 비교. |
| **5xx 오탐 → 로그인으로 오인 (코드 개선 전)** | 일시적 502/503/게이트웨이와 **401 구분**이 안 되거나, 예전 로직이 5xx 뒤에도 인증 실패 흐름을 탄 경우(논의/패치 대상). | **첫 실패**가 5xx인지 401인지. `ajax.js`의 `checkSessionAndRedirect`는 **500대에서는 세션 재검증을 스킵**하는 설계(현행 코드 기준). 이슈는 **다른 경로**의 `handleError`/게이트웨이 401 위장 등과 구분. |
| **400 + 테넌트·세션 문구 → 로그인 리다이렉트** | A. 특정 API가 400이고 `errorCode`/`message`에 tenant·세션·로그인 필요가 포함. | Network **Response** 본문의 `TENANT_ID_REQUIRED` 등. 콘솔에 `400 오류 (Tenant ID 부족) - 로그인 페이지로` 유사 로그. |

---

## 5. 백엔드 grep·로그 키워드

- **Auth / current-user 401**  
  - `current-user 401`  
  - `세션존재`  
- **엔트리·보안(환경에 따라)**  
  - `401`, `Unauthorized`  
- **테넌트**  
  - `current-user: 테넌트 컨텍스트 없음` (경로상 경고)  
- **API 호출 흐름(디버그)**  
  - `/api/v1/auth/current-user` 또는 로그에 남는 `current-user` 문자열

예시(저장소 루트에서, 서버가 아닌 **코드 검색**용):

```bash
rg "current-user 401" src/main/java
```

---

## 6. core-coder 패치와 연계 — Revision (완화 이력)

- **5xx 시 로그인 리다이렉트 방지** 등이 머지되면, 아래에 **한 줄**로 “완화됨”을 남기면 된다. **버전/커밋 해시는 운영 문서에 비워 둔다** (필요 시 릴리스 노트에만 기입).

> **Revision:** (예) 5xx 응답에 대해 로그인 강제 이동을 하지 않도록 `ajax.js` / 세션 흐름이 조정됨 → **완화됨** (상세: 릴리스 노트)

---

*문의 시: 캡처 1) 첫 실패 요청 URL·상태, 2) `current-user` 요청·응답 코드, 3) Request Cookie 유무(마스킹)를 함께 전달하면 원인 범위를 좁히기 쉽다.*
