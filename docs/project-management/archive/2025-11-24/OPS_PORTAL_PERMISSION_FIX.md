# Ops Portal 권한 문제 해결

**작성일**: 2025-11-24  
**문제**: 로그인 성공 후 모든 메뉴에서 403 Forbidden 오류 발생

---

## 🔍 문제 분석

### 증상
- 로그인은 성공 (대시보드까지 이동)
- 온보딩, 테넌트, 요금제 등 모든 메뉴에서 403 Forbidden 오류
- 에러 메시지: "접근 권한이 없습니다."

### 원인 추정
1. **쿠키에서 토큰을 읽지 못함**: `clientApi.ts`에서 쿠키 파싱 실패
2. **토큰이 Authorization 헤더에 포함되지 않음**: 빈 토큰으로 요청
3. **쿠키 설정 문제**: SameSite, Secure 설정으로 인한 쿠키 전송 실패

---

## 🔧 수정 사항

### 1. clientApi.ts 수정 ✅

**추가된 내용**:
- `credentials: "include"` 추가 (쿠키 전송 보장)
- 쿠키 파싱 디버깅 로그 추가
- 토큰이 없을 때 에러 로그 출력

**변경 전**:
```typescript
const response = await fetch(fullUrl, {
  ...options,
  headers
});
```

**변경 후**:
```typescript
const response = await fetch(fullUrl, {
  ...options,
  headers,
  credentials: "include" // 쿠키 포함
});
```

### 2. 쿠키 설정 수정 ✅

**Next.js API Route 쿠키 설정**:
- `secure: false`로 변경 (개발 서버 HTTPS 환경에서도 쿠키 전송 보장)

**변경 전**:
```typescript
secure: process.env.NODE_ENV === "production"
```

**변경 후**:
```typescript
secure: false // 개발 서버는 HTTPS이지만 쿠키 전송을 위해 false로 설정
```

### 3. 디버깅 로그 추가 ✅

**쿠키 파싱 로그**:
```typescript
console.debug("[resolveClientRuntimeConfig] 쿠키 파싱:", {
  cookieString: cookieString.substring(0, 200),
  hasOpsToken: cookieMap.has("ops_token"),
  opsTokenLength: cookieMap.get("ops_token")?.length || 0,
  opsTokenPreview: cookieMap.get("ops_token")?.substring(0, 20) || "없음",
  allCookies: Array.from(cookieMap.keys())
});
```

---

## 🧪 테스트 방법

### 1. 브라우저 개발자 도구 확인

**Console 탭**:
```javascript
// 쿠키 확인
console.log(document.cookie);

// 토큰 확인
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=');
  acc[key] = value;
  return acc;
}, {});
console.log('ops_token:', cookies.ops_token);
```

**Network 탭**:
1. 온보딩 페이지 접근
2. `/api/v1/onboarding/requests` 요청 확인
3. Request Headers에서 `Authorization: Bearer {token}` 확인
4. 토큰이 없으면 쿠키 문제, 있으면 권한 문제

### 2. 쿠키 수동 설정 테스트

**브라우저 Console에서**:
```javascript
// 로그인 API 직접 호출
const response = await fetch('/api/v1/ops/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'superadmin@mindgarden.com',
    password: 'admin123'
  })
});

const data = await response.json();
console.log('Login response:', data);

// 쿠키 수동 설정
if (data.success && data.data.token) {
  document.cookie = `ops_token=${data.data.token}; path=/; max-age=3600; SameSite=Lax`;
  document.cookie = `ops_actor_id=${data.data.actorId}; path=/; max-age=3600; SameSite=Lax`;
  document.cookie = `ops_actor_role=${data.data.actorRole}; path=/; max-age=3600; SameSite=Lax`;
  
  console.log('쿠키 설정 완료:', document.cookie);
  
  // 페이지 새로고침
  window.location.reload();
}
```

---

## 📋 확인 체크리스트

### 쿠키 확인
- [ ] 로그인 후 브라우저 개발자 도구 → Application → Cookies에서 `ops_token` 확인
- [ ] 쿠키 값이 존재하는지 확인
- [ ] 쿠키 Domain이 올바른지 확인 (`ops.dev.e-trinity.co.kr`)

### API 호출 확인
- [ ] Network 탭에서 API 요청 확인
- [ ] Request Headers에 `Authorization: Bearer {token}` 포함 여부
- [ ] 토큰이 올바른지 확인 (JWT 형식)

### 권한 확인
- [ ] 백엔드 로그에서 권한 체크 로그 확인
- [ ] `SecurityContext`에 인증 정보가 있는지 확인
- [ ] `authorities`에 `ROLE_ADMIN` 또는 `ROLE_OPS`가 있는지 확인

---

## 🔧 추가 수정 필요 사항

### 1. 쿠키 파싱 문제 해결

**문제**: `parseCookie` 함수가 쿠키를 제대로 파싱하지 못할 수 있음

**해결책**: 쿠키 파싱 로직 개선 또는 브라우저 네이티브 API 사용

### 2. CORS 설정 확인

**문제**: CORS 설정으로 인해 쿠키가 전송되지 않을 수 있음

**확인 필요**:
- 백엔드 CORS 설정에서 `allowCredentials: true` 확인
- 프론트엔드에서 `credentials: "include"` 사용 확인

### 3. SameSite 쿠키 정책

**문제**: SameSite=Lax는 일부 경우에 쿠키를 전송하지 않음

**해결책**: 
- 개발 환경에서는 `SameSite=None; Secure` 사용 고려
- 또는 서버 사이드에서 쿠키 설정

---

## 📝 다음 단계

1. ✅ 코드 수정 완료
2. ⏳ 배포 대기 (GitHub Actions)
3. ⏳ 브라우저에서 쿠키 확인
4. ⏳ Network 탭에서 Authorization 헤더 확인
5. ⏳ 백엔드 로그에서 권한 체크 로그 확인

---

**작성자**: AI Assistant  
**상태**: 수정 완료, 배포 대기

