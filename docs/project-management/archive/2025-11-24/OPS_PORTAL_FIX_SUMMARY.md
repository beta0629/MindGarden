# Ops Portal 로그인 문제 수정 요약

**작성일**: 2025-11-24  
**수정 내용**: 로그인 플로우 개선 및 환경 변수 설정

---

## 🔧 수정 사항

### 1. LoginForm.tsx 수정 ✅

**문제점**:
- 직접 백엔드 API (`/api/v1/ops/auth/login`) 호출
- 환경 변수 `NEXT_PUBLIC_OPS_API_BASE_URL` 미설정 시 상대 경로 사용으로 인한 문제
- 클라이언트 사이드에서 쿠키 직접 설정

**수정 내용**:
- Next.js API Route (`/api/auth/login`) 사용
- 서버 사이드에서 백엔드 API 호출 및 쿠키 설정
- 클라이언트는 Next.js API Route만 호출

**변경 전**:
```typescript
const apiBaseUrl = process.env.NEXT_PUBLIC_OPS_API_BASE_URL || "/api/v1";
const response = await fetch(`${apiBaseUrl}/ops/auth/login`, {
  // ...
});
// 쿠키 직접 설정
document.cookie = `ops_token=${responseData.token}; ${cookieOptions}`;
```

**변경 후**:
```typescript
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword }),
  credentials: "include"
});
// 쿠키는 Next.js API Route에서 설정됨
```

---

### 2. 환경 변수 설정 스크립트 추가 ✅

**파일**: `scripts/deploy-ops-env-dev.sh`

**기능**:
- 개발 서버에 `.env.production` 파일 자동 생성
- 백엔드 API URL 설정 (`http://localhost:8080/api/v1`)
- Next.js 빌드 시 환경 변수 포함

**설정 내용**:
```bash
OPS_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_OPS_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_OPS_API_USE_MOCK=false
NODE_ENV=production
```

---

## 📋 배포 단계

### 1. 코드 배포 (완료)
```bash
git add frontend-ops/src/components/auth/LoginForm.tsx
git commit -m "fix: Ops Portal 로그인 플로우 수정"
git push origin develop
```

### 2. 환경 변수 설정 (필요)
```bash
# 개발 서버에서 실행
./scripts/deploy-ops-env-dev.sh
```

또는 수동으로:
```bash
ssh root@beta0629.cafe24.com
cd /opt/mindgarden/frontend-ops  # 또는 실제 경로
cat > .env.production << 'EOF'
OPS_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_OPS_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_OPS_API_USE_MOCK=false
NODE_ENV=production
EOF
```

### 3. Next.js 앱 재시작 (필요)
```bash
# PM2 사용 시
pm2 restart ops-portal

# systemd 사용 시
systemctl restart ops-portal

# 또는 수동 재시작
cd /opt/mindgarden/frontend-ops
npm run build
npm start
```

---

## 🧪 테스트 계획

### 1. 로그인 테스트
- URL: `https://ops.dev.e-trinity.co.kr/auth/login`
- 계정: `superadmin@mindgarden.com` / `admin123`
- 예상 결과: 로그인 성공 후 대시보드로 리다이렉트

### 2. API 테스트
```bash
# Next.js API Route 테스트
curl -X POST https://ops.dev.e-trinity.co.kr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin@mindgarden.com","password":"admin123"}'

# 백엔드 API 직접 테스트
curl -X POST http://localhost:8080/api/v1/ops/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin@mindgarden.com","password":"admin123"}'
```

### 3. 쿠키 확인
- 로그인 성공 후 브라우저 개발자 도구에서 쿠키 확인:
  - `ops_token`
  - `ops_actor_id`
  - `ops_actor_role`

---

## ✅ 기대 효과

1. **환경 변수 의존성 감소**: Next.js API Route가 서버 사이드에서 환경 변수 사용
2. **보안 향상**: 쿠키 설정을 서버 사이드에서 처리
3. **유지보수성 향상**: 단일 진입점 (Next.js API Route)으로 통일
4. **CORS 문제 해결**: 서버 사이드에서 백엔드 호출로 CORS 이슈 없음

---

## 📝 다음 단계

1. ✅ 코드 수정 완료
2. ⏳ 환경 변수 설정 (배포 스크립트 실행)
3. ⏳ Next.js 앱 재시작
4. ⏳ 브라우저 테스트 재진행
5. ⏳ 문제 해결 확인

---

**작성자**: AI Assistant  
**상태**: 수정 완료, 배포 대기

