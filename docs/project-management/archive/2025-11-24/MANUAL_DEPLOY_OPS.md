# Ops Portal 수동 배포 가이드

**작성일**: 2025-11-24  
**상황**: GitHub Actions 자동 배포가 트리거되지 않은 경우

---

## 🔧 수동 배포 방법

### 방법 1: GitHub 웹에서 수동 실행 (권장)

1. GitHub 저장소 접속: `https://github.com/beta0629/MindGarden`
2. **Actions** 탭 클릭
3. 왼쪽 사이드바에서 **"🔧 Ops 프론트엔드 개발 서버 배포"** 워크플로우 선택
4. **"Run workflow"** 버튼 클릭
5. Branch: `develop` 선택
6. **"Run workflow"** 버튼 클릭

### 방법 2: 개발 서버에서 직접 빌드 및 배포

```bash
# 개발 서버 접속
ssh root@beta0629.cafe24.com

# 프로젝트 디렉토리로 이동 (경로 확인 필요)
cd /opt/mindgarden  # 또는 실제 프로젝트 경로

# Git pull
git pull origin develop

# frontend-ops 빌드
cd frontend-ops
npm ci
NEXT_PUBLIC_OPS_API_BASE_URL="" NEXT_PUBLIC_OPS_API_USE_MOCK="false" NODE_ENV=production npm run build

# 빌드 결과 확인
ls -la out/

# 배포 (정적 파일 복사)
sudo cp -r out/* /var/www/html-ops/
sudo chown -R www-data:www-data /var/www/html-ops
sudo chmod -R 755 /var/www/html-ops

echo "✅ 배포 완료"
```

---

## 📋 변경된 파일 목록

최근 커밋에서 변경된 frontend-ops 파일들:

1. `frontend-ops/src/components/auth/LoginForm.tsx`
   - 중복 변수 제거
   - API URL 상대 경로 사용

2. `frontend-ops/src/services/clientApi.ts`
   - `credentials: "include"` 추가
   - 쿠키 파싱 디버깅 로그 추가
   - 토큰 체크 로그 추가

3. `frontend-ops/app/api/auth/login/route.ts`
   - 쿠키 secure 설정 조정

4. `.github/workflows/deploy-ops-dev.yml`
   - 빌드 환경 변수 설정

---

## ✅ 배포 확인

배포 후 확인 사항:

1. **파일 확인**:
   ```bash
   ssh root@beta0629.cafe24.com
   ls -la /var/www/html-ops/_next/static/chunks/ | head -10
   ```

2. **브라우저에서 확인**:
   - `https://ops.dev.e-trinity.co.kr/auth/login` 접속
   - 브라우저 개발자 도구 → Network 탭
   - 로그인 후 API 요청에서 Authorization 헤더 확인

3. **Console 로그 확인**:
   - 브라우저 개발자 도구 → Console 탭
   - `[resolveClientRuntimeConfig] 쿠키 파싱:` 로그 확인
   - `[clientApiFetch] 토큰이 없습니다:` 에러 확인

---

**작성자**: AI Assistant  
**상태**: 수동 배포 가이드 작성 완료

