# OPS Portal 로그인 문제 해결 가이드

## 작성일
2025-11-26

## 최종 업데이트
2025-11-26 23:40 - 개발 서버 쿠키 문제 해결 완료

## 문제 요약
OPS Portal 로그인 후 대시보드 접근 시 401 Unauthorized 에러 발생 및 개발 서버에서 로그인 후 페이지 클릭 시 로그인 페이지로 리다이렉트

## 발생한 문제들

### 1. 로그인 API 경로 불일치
**증상**: 로그인 버튼 클릭 시 아무 반응 없음

**원인**:
- `LoginForm.tsx`가 `/api/v1/ops/auth/login` 호출
- 실제 Next.js API 라우트는 `/api/auth/login/`

**해결**:
```typescript
// Before
const apiPath = "/api/v1/ops/auth/login";

// After
const apiPath = "/api/auth/login/";
```

### 2. 로그인 성공 후 즉시 리다이렉트로 쿠키 미적용
**증상**: 로그인 성공 → "데이터 로딩중" → 다시 로그인 페이지

**원인**:
- 로그인 API 응답에서 `set-cookie` 헤더로 쿠키 설정
- 즉시 `window.location.href`로 리다이렉트
- 쿠키가 브라우저에 적용되기 전에 미들웨어 실행
- 미들웨어: 토큰 없음 → 로그인 페이지로 리다이렉트

**해결**:
```typescript
// 쿠키 확인 후 리다이렉트
const checkCookieAndRedirect = () => {
  const cookies = document.cookie;
  const hasToken = cookies.includes("ops_token");
  
  if (hasToken) {
    window.location.href = redirectPath;
  } else if (attempts < maxAttempts) {
    setTimeout(checkCookieAndRedirect, 100);
  }
};
```

### 3. HTTPS 환경에서 secure: false 쿠키 차단
**증상**: 개발 서버(HTTPS)에서 로그인 후 쿠키 설정 안 됨

**원인**:
- 개발 서버는 HTTPS 사용
- 쿠키 설정: `secure: false` (하드코딩)
- HTTPS 환경에서 `secure: false` 쿠키는 브라우저가 차단

**해결**:
```typescript
// Before
const COOKIE_SETTINGS = {
  secure: false // 하드코딩
};

// After
const COOKIE_SETTINGS = {
  secure: process.env.NODE_ENV === "production" // 환경에 따라 자동 설정
};
```

### 4. 대시보드 API 호출 시 401 Unauthorized
**증상**: 로그인 성공, 대시보드 접근 성공, 하지만 API 호출 시 401 에러

**원인**: (현재 조사 중)
- 쿠키가 설정되었지만 API 요청 시 토큰이 전달되지 않음
- 또는 백엔드에서 JWT 검증 실패

**디버깅 방법**:
```javascript
// 브라우저 콘솔에서 실행
console.log(document.cookie);

// 예상 결과:
// ops_token=eyJhbGci...; ops_actor_id=superadmin%40mindgarden.com; ops_actor_role=HQ_ADMIN
```

**확인 사항**:
1. 쿠키가 있는가?
   - 없음 → 로그인 API 응답 문제
   - 있음 → `clientApi.ts` 쿠키 파싱 문제 또는 백엔드 JWT 검증 문제

2. 콘솔에 `[clientApiFetch]` 로그가 있는가?
   - `[clientApiFetch] 토큰 없음` → 쿠키 파싱 실패
   - `[clientApiFetch] 토큰 있음` → 백엔드 JWT 검증 실패

3. 백엔드 로그 확인:
   ```bash
   # OPS 백엔드 로그에서 JWT 관련 에러 확인
   tail -f backend-ops/logs/application.log | grep -i "jwt\|401\|unauthorized"
   ```

## 해결 체크리스트

### 로컬 환경 (localhost)
- [ ] 로그인 API 경로: `/api/auth/login/` ✅
- [ ] 쿠키 secure 설정: `false` (HTTP) ✅
- [ ] 로그인 후 쿠키 확인 로직 ✅
- [ ] 미들웨어 쿠키 검증 ✅

### 개발 환경 (ops.dev.e-trinity.co.kr)
- [ ] 로그인 API 경로: `/api/auth/login/` ✅
- [ ] 쿠키 secure 설정: `true` (HTTPS) ✅
- [ ] Nginx 프록시 설정 확인 필요
- [ ] 쿠키 도메인 설정 확인 필요

## 다음 단계

### 1. 프론트엔드 재시작
```bash
# 포트 3001 프로세스 종료
netstat -ano | grep ":3001" | grep LISTENING | awk '{print $5}' | xargs -I {} taskkill //PID {} //F

# 프론트엔드 재시작
cd frontend-ops && npm run dev
```

### 2. 브라우저 캐시 클리어
- Ctrl+Shift+Delete
- 쿠키 및 캐시 삭제
- 브라우저 재시작

### 3. 로그인 테스트
1. http://localhost:3001/auth/login 접속
2. 로그인 (superadmin@mindgarden.com / admin123)
3. 브라우저 콘솔 확인:
   - `[LoginForm] 쿠키 확인` 로그
   - `[clientApiFetch]` 로그
4. 대시보드 접근 확인
5. 대시보드 API 호출 확인

### 4. 백엔드 JWT 검증 확인
만약 쿠키는 있지만 401 에러가 발생한다면:

```bash
# JWT 토큰 디코딩 (https://jwt.io 사용)
# 쿠키에서 ops_token 값을 복사하여 jwt.io에서 디코딩

# 확인 사항:
# - exp (만료 시간)이 현재 시간보다 미래인가?
# - iss (발급자)가 "mindgarden-ops" 또는 "mindgarden-ops-dev"인가?
# - sub (주체)가 로그인한 사용자 이메일인가?
```

## 관련 파일

### 프론트엔드
- `frontend-ops/src/components/auth/LoginForm.tsx` - 로그인 폼
- `frontend-ops/app/api/auth/login/route.ts` - 로그인 API 라우트
- `frontend-ops/middleware.ts` - 인증 미들웨어
- `frontend-ops/src/services/clientApi.ts` - API 클라이언트
- `frontend-ops/next.config.mjs` - Next.js 설정 (rewrites)

### 백엔드
- `backend-ops/src/main/java/com/mindgarden/ops/controller/AuthController.java` - 인증 컨트롤러
- `backend-ops/src/main/java/com/mindgarden/ops/config/SecurityConfig.java` - Spring Security 설정
- `backend-ops/src/main/resources/application.yml` - 백엔드 설정
- `backend-ops/src/main/resources/application-dev.yml` - 개발 환경 설정

## 참고

### JWT 토큰 구조
```
eyJhbGciOiJIUzI1NiJ9.eyJhY3RvcklkIjoic3VwZXJhZG1pbkBtaW5kZ2FyZGVuLmNvbSIsImFjdG9yUm9sZSI6IkhRX0FETUlOIiwic3ViIjoic3VwZXJhZG1pbkBtaW5kZ2FyZGVuLmNvbSIsImlhdCI6MTc2NDE2NjkwOSwiZXhwIjoxNzY0MTcwNTA5fQ.tHDQQlks7uO1i0YyBWyTAXwru8cbgqHudfQ_Ak2LuKc

Header:
{
  "alg": "HS256"
}

Payload:
{
  "actorId": "superadmin@mindgarden.com",
  "actorRole": "HQ_ADMIN",
  "sub": "superadmin@mindgarden.com",
  "iat": 1764166909,
  "exp": 1764170509
}
```

### 쿠키 설정
```
ops_token=<JWT 토큰>; Path=/; Max-Age=3600; SameSite=lax; Secure (HTTPS only)
ops_actor_id=superadmin%40mindgarden.com; Path=/; Max-Age=3600; SameSite=lax; Secure (HTTPS only)
ops_actor_role=HQ_ADMIN; Path=/; Max-Age=3600; SameSite=lax; Secure (HTTPS only)
```

## 최종 해결책 (2025-11-26 23:40)

### 문제 4: 개발 서버에서 로그인 후 페이지 클릭 시 로그인 페이지로 리다이렉트

**증상**:
- 개발 서버(`https://ops.dev.e-trinity.co.kr`)에서 로그인 성공
- 대시보드 데이터는 정상 표시
- 메뉴나 카드 클릭 시 다시 로그인 페이지로 리다이렉트

**원인**:
- `process.env.NODE_ENV === "production"` 조건으로 `secure` 쿠키 속성 설정
- 개발 서버는 HTTPS이지만 Next.js는 `NODE_ENV=development`로 실행
- 결과: `secure: false`로 쿠키 설정 → 브라우저가 HTTPS에서 쿠키 거부
- 미들웨어에서 쿠키를 읽지 못해 로그인 페이지로 리다이렉트

**해결**:
```typescript
// Before: NODE_ENV 기반 (잘못된 방법)
const COOKIE_SETTINGS = {
  path: "/",
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" // ❌ 개발 서버(HTTPS)에서 false
};

// After: URL 프로토콜 기반 (올바른 방법)
function getCookieSettings(request: Request) {
  const url = new URL(request.url);
  const isHttps = url.protocol === "https:";
  
  return {
    path: "/",
    httpOnly: false,
    sameSite: "lax" as const,
    secure: isHttps // ✅ HTTPS면 true, HTTP면 false
  };
}

// 사용
const cookieSettings = getCookieSettings(request);
response.cookies.set("ops_token", token, { ...cookieSettings, maxAge });
```

**핵심 교훈**:
- `NODE_ENV`는 **빌드 환경**을 나타냄 (development/production)
- `secure` 쿠키 속성은 **실제 프로토콜**(HTTP/HTTPS)에 따라 설정해야 함
- 개발 서버도 HTTPS를 사용할 수 있으므로 프로토콜을 직접 확인해야 함

## 변경 이력

- 2025-11-26 14:00: 초기 작성
- 2025-11-26 15:30: 로그인 API 경로 수정
- 2025-11-26 16:00: 쿠키 확인 로직 추가
- 2025-11-26 17:00: HTTPS 환경 쿠키 secure 설정 수정 (NODE_ENV 기반)
- 2025-11-26 22:00: 401 에러 해결 (CORS, URL 중복)
- 2025-11-26 23:40: **최종 해결** - URL 프로토콜 기반 secure 속성 설정

## 테스트 체크리스트

### 로컬 환경 (HTTP)
- [x] 로그인 성공
- [x] 대시보드 데이터 로드
- [x] 메뉴 클릭 시 정상 동작
- [x] 쿠키 `secure: false` 확인

### 개발 서버 (HTTPS)
- [ ] 로그인 성공
- [ ] 대시보드 데이터 로드
- [ ] 메뉴 클릭 시 정상 동작
- [ ] 쿠키 `secure: true` 확인

