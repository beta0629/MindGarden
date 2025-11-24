# Ops Portal 배포 완료

**작성일**: 2025-11-24 14:50  
**배포 방법**: 로컬 빌드 후 SCP 직접 배포

---

## ✅ 배포 완료

### 배포된 파일
- `frontend-ops/out/*` → `/var/www/html-ops/`
- `frontend-ops/out/_next/*` → `/var/www/html-ops/_next/`

### 변경된 소스 파일
1. `frontend-ops/src/services/clientApi.ts`
   - `credentials: "include"` 추가
   - 쿠키 파싱 디버깅 로그 추가
   - 토큰 체크 로그 추가

2. `frontend-ops/app/api/auth/login/route.ts`
   - 쿠키 secure 설정 조정

3. `frontend-ops/src/components/auth/LoginForm.tsx`
   - API URL 상대 경로 사용 (이전 배포)

---

## 🧪 테스트 방법

### 1. 브라우저에서 확인
- URL: `https://ops.dev.e-trinity.co.kr/auth/login`
- 로그인: `superadmin@mindgarden.com` / `admin123`

### 2. 개발자 도구 확인
**Console 탭**:
- `[resolveClientRuntimeConfig] 쿠키 파싱:` 로그 확인
- `[clientApiFetch] 토큰이 없습니다:` 에러 확인 (없어야 정상)

**Network 탭**:
- API 요청의 Request Headers에서 `Authorization: Bearer {token}` 확인
- 토큰이 포함되어 있어야 함

**Application 탭**:
- Cookies → `ops_token` 확인
- 쿠키 값이 존재하는지 확인

### 3. 권한 테스트
- 온보딩 페이지 접근
- 테넌트 페이지 접근
- 요금제 페이지 접근
- 모든 메뉴에서 403 오류가 발생하지 않아야 함

---

## 📋 배포 확인 체크리스트

- [x] 로컬 빌드 완료
- [x] SCP로 파일 업로드 완료
- [x] 권한 설정 완료 (www-data:www-data, 755)
- [ ] 브라우저에서 로그인 테스트
- [ ] 쿠키 설정 확인
- [ ] API 호출 시 Authorization 헤더 확인
- [ ] 모든 메뉴 접근 테스트

---

## 🔧 다음 단계

1. 브라우저에서 로그인 테스트
2. Console 로그 확인
3. Network 탭에서 Authorization 헤더 확인
4. 모든 메뉴 접근 테스트

---

**작성자**: AI Assistant  
**상태**: 배포 완료, 테스트 대기

