# OPS Portal 로그인 문제 해결 TODO (2025-11-27)

## 📋 현재 상황

### ✅ 완료된 작업 (2025-11-26)
1. ✅ 백엔드 `AuthController`에서 `Set-Cookie` 헤더 추가
2. ✅ `HttpServletResponse.addHeader()`로 여러 쿠키 설정
3. ✅ 프론트엔드에서 응답 JSON의 토큰으로 `document.cookie` 설정
4. ✅ JWT `issuer` 통일 (`mindgarden-ops`)
5. ✅ CORS 설정 추가 (백엔드)
6. ✅ 로그인 API 정상 작동 확인 (200 OK, 토큰 반환)

### ❌ 미해결 문제
**증상**: 로그인 후 대시보드로 이동 → 다시 로그인 페이지로 리다이렉트

**원인 추정**:
1. 쿠키가 설정되지 않음 (가장 유력)
2. 쿠키가 설정되었지만 middleware가 읽지 못함
3. JWT 검증 실패 (issuer, secret 불일치)

---

## 🔧 내일 해야 할 작업

### 1단계: 문제 진단 ✅
- [ ] 개발 서버 로그인 후 Console 로그 확인
  - `[LoginForm] 쿠키 확인: {hasCookie: true/false, ...}`
  - `[resolveClientRuntimeConfig] 쿠키 파싱: {...}`
  - `[clientApiFetch] 토큰이 없습니다` 또는 `토큰 있음`
- [ ] Application 탭에서 쿠키 확인
  - `ops_token` 존재 여부
  - `ops_actor_id` 존재 여부
  - `ops_actor_role` 존재 여부
- [ ] Network 탭에서 로그인 응답 헤더 확인
  - `Set-Cookie` 헤더가 3개 있는지 확인
  - 쿠키 속성 확인 (`Secure`, `SameSite`, `Path`)

### 2단계: 쿠키 설정 문제 해결
#### 시나리오 A: 쿠키가 설정되지 않음
- [ ] `document.cookie` 설정 시 `Secure` 속성 문제 확인
  - HTTPS 환경에서 `Secure` 없이 설정하면 무시됨
  - 현재 코드: `const isHttps = window.location.protocol === "https:";`
  - 확인: `isHttps` 값이 제대로 설정되는지
- [ ] 쿠키 `SameSite` 속성 문제
  - 현재: `samesite=lax`
  - 크로스 도메인 문제 가능성 (Nginx 프록시)
- [ ] 쿠키 `Domain` 속성 추가 필요 여부
  - 현재: `Domain` 미설정 (현재 도메인으로 자동 설정)
  - 필요 시: `domain=.e-trinity.co.kr` 추가

#### 시나리오 B: 쿠키는 설정되었지만 middleware가 읽지 못함
- [ ] Next.js middleware가 정적 빌드에서 작동하는지 확인
  - 정적 빌드(`output: "export"`)에서는 middleware가 **클라이언트 사이드**에서만 실행
  - 서버 사이드 쿠키 읽기 불가능
- [ ] Middleware 제거 또는 클라이언트 사이드 인증으로 변경
  - Option 1: Middleware 제거, 각 페이지에서 `useEffect`로 인증 체크
  - Option 2: 정적 빌드 포기, Next.js 서버 모드 사용

#### 시나리오 C: JWT 검증 실패
- [ ] 백엔드 로그 확인 (개발 서버)
  - JWT 검증 실패 로그 확인
  - `issuer`, `secret` 불일치 확인
- [ ] 로컬에서 JWT 디코딩하여 `issuer` 확인
  ```javascript
  const token = document.cookie.match(/ops_token=([^;]+)/)[1];
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('JWT Payload:', payload);
  ```

### 3단계: 해결 방안 적용
#### 방안 1: 쿠키 설정 수정 (가장 빠름)
```typescript
// LoginForm.tsx
const isHttps = window.location.protocol === "https:";
const domain = isHttps ? "; domain=.e-trinity.co.kr" : "";
const cookieOptions = `path=/; max-age=${maxAge}; samesite=lax${isHttps ? "; secure" : ""}${domain}`;

document.cookie = `ops_token=${token}; ${cookieOptions}`;
document.cookie = `ops_actor_id=${encodeURIComponent(actorId)}; ${cookieOptions}`;
document.cookie = `ops_actor_role=${actorRole}; ${cookieOptions}`;
```

#### 방안 2: Middleware 제거, 클라이언트 사이드 인증
```typescript
// app/dashboard/page.tsx
useEffect(() => {
  const token = document.cookie.match(/ops_token=([^;]+)/)?.[1];
  if (!token) {
    router.push('/auth/login?redirect=/dashboard');
  }
}, [router]);
```

#### 방안 3: Next.js API Route로 쿠키 설정 (로컬 전용)
- 로컬 개발 환경에서만 Next.js API Route 사용
- 개발/운영 서버에서는 백엔드 직접 호출

### 4단계: 대시보드 카드 클릭 문제 해결
- [ ] 로그인 성공 후 대시보드 카드 클릭 테스트
- [ ] Console 로그 확인 (401/403 에러)
- [ ] Network 탭에서 API 요청 확인
  - Authorization 헤더 포함 여부
  - 토큰 값 확인
- [ ] 백엔드 Security 설정 확인
  - 모든 `/api/v1/ops/**` 경로가 인증 필요한지 확인

---

## 📝 체크리스트

### 진단 단계
- [ ] Console 로그 캡처
- [ ] Application 탭 쿠키 스크린샷
- [ ] Network 탭 로그인 응답 헤더 확인

### 수정 단계
- [ ] 쿠키 설정 코드 수정
- [ ] 테스트 (로그인 → 대시보드 → 카드 클릭)
- [ ] 커밋 및 푸시
- [ ] 개발 서버 배포 확인

### 검증 단계
- [ ] 로그인 성공
- [ ] 대시보드 진입 성공
- [ ] 대시보드 카드 클릭 성공
- [ ] 온보딩 페이지 진입 성공
- [ ] 요금제 페이지 진입 성공
- [ ] Feature Flag 페이지 진입 성공

---

## 🔍 디버깅 명령어

### Console에서 쿠키 확인
```javascript
// 모든 쿠키 출력
console.log(document.cookie);

// ops_token만 추출
const token = document.cookie.match(/ops_token=([^;]+)/)?.[1];
console.log('Token:', token);

// JWT 디코딩
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('JWT Payload:', payload);
  console.log('Issuer:', payload.iss);
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

### Network 탭에서 확인할 사항
1. 로그인 요청 (`POST /api/v1/ops/auth/login`)
   - Response Headers에 `Set-Cookie` 3개 있는지
   - Response Body에 `token`, `actorId`, `actorRole` 있는지
2. 대시보드 메트릭 요청 (`GET /api/v1/ops/dashboard/metrics`)
   - Request Headers에 `Authorization: Bearer ...` 있는지
   - 상태 코드 (200? 401? 403?)

---

## 📚 참고 문서
- `docs/mgsb/2025-11-26/OPS_PORTAL_LOGIN_TROUBLESHOOTING.md`
- `docs/mgsb/2025-11-26/OPS_PORTAL_FIX_COMPLETE.md`

---

## 🎯 목표
**내일 오전 중으로 OPS Portal 로그인 및 대시보드 카드 클릭 문제 완전 해결!** 🚀

