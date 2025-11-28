# Ops Portal 전체 점검 진단 보고서

**작성일**: 2025-11-24  
**목적**: Ops Portal 로그인부터 전체 플로우 점검 및 문제점 파악

---

## 🔑 테스트 계정 정보

### Ops Portal 로그인 계정

**아이디**: `superadmin@mindgarden.com`  
**비밀번호**: `admin123`  
**역할**: `HQ_ADMIN`

**설정 위치**:
- 백엔드: `src/main/java/com/coresolution/core/controller/OpsAuthController.java`
- 환경 변수: `ops.admin.username`, `ops.admin.password`, `ops.admin.role`
- 기본값: 위 계정 정보 (환경 변수 미설정 시)

**참고**: 
- 이 계정은 Ops Portal 전용 계정입니다.
- 일반 테넌트 관리자 계정과는 별개입니다.
- 환경 변수로 변경 가능합니다.

---

## 🔍 발견된 문제점

### 1. 로그인 플로우 불일치 ⚠️ **중요**

**문제**: 두 가지 로그인 방식이 혼재되어 있음

#### 방식 A: LoginForm.tsx에서 직접 백엔드 API 호출
```typescript
// frontend-ops/src/components/auth/LoginForm.tsx
const apiBaseUrl = process.env.NEXT_PUBLIC_OPS_API_BASE_URL || "/api/v1";
const response = await fetch(`${apiBaseUrl}/ops/auth/login`, {
  method: "POST",
  // ...
});
// 쿠키 직접 설정
document.cookie = `ops_token=${responseData.token}; ${cookieOptions}`;
```

#### 방식 B: Next.js API Route 사용
```typescript
// frontend-ops/app/api/auth/login/route.ts
// Next.js API Route가 백엔드를 호출하고 쿠키 설정
```

**영향**:
- CORS 문제 가능성
- 환경 변수 설정 불일치
- 쿠키 설정 방식 불일치
- 디버깅 어려움

**권장 해결책**: Next.js API Route를 통한 통일된 로그인 플로우 사용

---

### 2. 환경 변수 설정 누락 ⚠️

**문제**: `.env.local` 파일이 없음

**현재 상태**:
- `env.local.example` 파일만 존재
- `NEXT_PUBLIC_OPS_API_BASE_URL` 환경 변수가 설정되지 않음
- 기본값으로 `/api/v1` (상대 경로) 사용

**영향**:
- 개발 환경에서 백엔드 API 접근 실패 가능
- 프로덕션 환경에서 올바른 API URL 설정 필요

**권장 해결책**: 
- `.env.local` 파일 생성
- 개발/프로덕션 환경별 환경 변수 설정

---

### 3. 대시보드 API 엔드포인트 확인 필요 ⚠️

**문제**: 백엔드에 `/ops/dashboard/metrics` 엔드포인트 존재 여부 불명확

**현재 코드**:
```typescript
// frontend-ops/src/services/dashboardService.ts
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return clientApiFetch<DashboardMetrics>("/ops/dashboard/metrics");
}
```

**확인 필요**:
- 백엔드 컨트롤러에 해당 엔드포인트 존재 여부
- API 응답 형식 일치 여부

---

### 4. 토큰 검증 로직 확인 필요 ⚠️

**현재 구조**:
- 미들웨어: 쿠키에서 `ops_token` 존재 여부만 확인
- API 클라이언트: `Authorization: Bearer ${token}` 헤더 전송
- 백엔드: JWT 토큰 검증 및 권한 체크

**확인 필요**:
- JWT 토큰 유효성 검증 로직
- 권한 체크 로직 (`OpsPermissionUtils`)
- 토큰 만료 처리

---

### 5. 클라이언트/서버 API 클라이언트 분리 ✅

**현재 구조** (정상):
- `apiClient.ts`: 서버 사이드 (Server Components)
- `clientApi.ts`: 클라이언트 사이드 (Client Components)

**대시보드 페이지**: 클라이언트 컴포넌트이므로 `clientApi.ts` 사용 ✅

---

## 📋 점검 체크리스트

### 로그인 플로우
- [ ] LoginForm.tsx에서 Next.js API Route 사용하도록 변경
- [ ] 쿠키 설정 방식 통일 (Next.js API Route에서만 설정)
- [ ] 로그인 성공 후 리다이렉트 로직 확인

### 환경 변수
- [ ] `.env.local` 파일 생성
- [ ] `NEXT_PUBLIC_OPS_API_BASE_URL` 설정
- [ ] 개발/프로덕션 환경별 설정 확인

### API 엔드포인트
- [ ] `/ops/dashboard/metrics` 엔드포인트 존재 확인
- [ ] API 응답 형식 확인
- [ ] 에러 처리 로직 확인

### 토큰 및 권한
- [ ] JWT 토큰 생성 로직 확인
- [ ] 토큰 검증 로직 확인
- [ ] 권한 체크 로직 확인
- [ ] 토큰 만료 처리 확인

### 미들웨어
- [ ] 토큰 존재 여부 체크 확인
- [ ] 공개 경로 설정 확인
- [ ] 리다이렉트 로직 확인

---

## 🔧 권장 수정 사항

### 1. LoginForm.tsx 수정

**현재**:
```typescript
const apiBaseUrl = process.env.NEXT_PUBLIC_OPS_API_BASE_URL || "/api/v1";
const response = await fetch(`${apiBaseUrl}/ops/auth/login`, {
  // ...
});
```

**수정 후**:
```typescript
// Next.js API Route 사용
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword })
});
// 쿠키는 Next.js API Route에서 설정되므로 제거
```

### 2. .env.local 파일 생성

```bash
# frontend-ops/.env.local
NEXT_PUBLIC_OPS_API_BASE_URL=http://localhost:8080/api/v1
# 또는 프로덕션
# NEXT_PUBLIC_OPS_API_BASE_URL=https://beta0629.cafe24.com:8080/api/v1
```

### 3. 대시보드 API 엔드포인트 확인

백엔드에 다음 엔드포인트가 있는지 확인:
- `GET /api/v1/ops/dashboard/metrics`

없다면 생성 필요.

---

## 🧪 테스트 시나리오

### 1. 로그인 테스트
1. `/auth/login` 페이지 접근
2. **테스트 계정 입력**:
   - 아이디: `superadmin@mindgarden.com`
   - 비밀번호: `admin123`
3. 로그인 버튼 클릭
4. 쿠키 설정 확인 (`ops_token`, `ops_actor_id`, `ops_actor_role`)
5. `/dashboard`로 리다이렉트 확인

**테스트 계정**:
- 아이디: `superadmin@mindgarden.com`
- 비밀번호: `admin123`

### 2. 대시보드 접근 테스트
1. 로그인 후 `/dashboard` 접근
2. 대시보드 메트릭 로드 확인
3. API 호출 성공 여부 확인

### 3. 권한 테스트
1. 토큰 없이 보호된 페이지 접근 시도
2. 로그인 페이지로 리다이렉트 확인
3. 잘못된 토큰으로 API 호출 시도
4. 401/403 에러 처리 확인

---

## 📝 다음 단계

1. **즉시 수정**: LoginForm.tsx에서 Next.js API Route 사용
2. **환경 변수 설정**: `.env.local` 파일 생성
3. **API 엔드포인트 확인**: 백엔드에 대시보드 API 존재 여부 확인
4. **통합 테스트**: 전체 플로우 테스트
5. **문서화**: 수정 사항 문서화

---

**작성자**: AI Assistant  
**상태**: 점검 완료, 수정 필요

