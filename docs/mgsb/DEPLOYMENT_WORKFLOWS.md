# 개발 서버 배포 워크플로우 가이드

**작성일**: 2025-11-21  
**목적**: 각 프로젝트를 독립적으로 배포하여 배포 시간 단축

---

## 📋 개요

기존의 통합 워크플로우(`deploy-dev.yml`)는 모든 프로젝트를 한 번에 빌드하고 배포하기 때문에 시간이 오래 걸립니다.  
이제 각 프로젝트별로 독립적인 워크플로우가 분리되어 있어, 변경된 부분만 빠르게 배포할 수 있습니다.

---

## 🚀 분리된 워크플로우

### 1. 백엔드 배포 (`deploy-backend-dev.yml`)

**트리거 조건:**
- `src/**` 경로 변경
- `pom.xml` 변경
- 수동 실행 (`workflow_dispatch`)

**배포 내용:**
- Spring Boot 백엔드 빌드 및 배포
- JAR 파일 업로드
- systemd 서비스 재시작
- 헬스체크

**예상 소요 시간:** 약 5-10분

---

### 2. CoreSolution 프론트엔드 배포 (`deploy-frontend-dev.yml`)

**트리거 조건:**
- `frontend/**` 경로 변경
- 수동 실행 (`workflow_dispatch`)

**배포 내용:**
- React 프론트엔드 빌드
- 정적 파일 업로드 (`/var/www/html-dev/`)
- 파일 권한 설정

**예상 소요 시간:** 약 3-5분

---

### 3. Trinity 프론트엔드 배포 (`deploy-trinity-dev.yml`)

**트리거 조건:**
- `frontend-trinity/**` 경로 변경
- 수동 실행 (`workflow_dispatch`)

**배포 내용:**
- Next.js 프론트엔드 빌드 (정적 export)
- 정적 파일 업로드 (`/var/www/html-trinity/`)
- 파일 권한 설정

**예상 소요 시간:** 약 3-5분

---

### 4. Ops 프론트엔드 배포 (`deploy-ops-dev.yml`)

**트리거 조건:**
- `frontend-ops/**` 경로 변경
- 수동 실행 (`workflow_dispatch`)

**배포 내용:**
- Next.js 프론트엔드 빌드 (정적 export)
- 정적 파일 업로드 (`/var/www/html-ops/`)
- 파일 권한 설정

**예상 소요 시간:** 약 3-5분

---

## 📊 배포 시간 비교

### 통합 워크플로우 (기존)
- **전체 빌드 및 배포:** 약 15-20분
- **모든 프로젝트를 한 번에 빌드**

### 분리된 워크플로우 (신규)
- **백엔드만:** 약 5-10분
- **프론트엔드만 (각각):** 약 3-5분
- **변경된 부분만 빌드 및 배포**

---

## 🔧 사용 방법

### 자동 배포 (권장)

각 프로젝트의 경로가 변경되면 해당 워크플로우가 자동으로 트리거됩니다.

예시:
```bash
# 백엔드만 변경
git add src/main/java/com/coresolution/...
git commit -m "fix: 백엔드 수정"
git push origin develop
# → deploy-backend-dev.yml만 실행됨

# 프론트엔드만 변경
git add frontend/src/...
git commit -m "fix: 프론트엔드 수정"
git push origin develop
# → deploy-frontend-dev.yml만 실행됨
```

### 수동 배포

GitHub Actions에서 직접 워크플로우를 실행할 수 있습니다:

1. GitHub 저장소 → **Actions** 탭
2. 왼쪽 사이드바에서 원하는 워크플로우 선택
3. **Run workflow** 버튼 클릭
4. 브랜치 선택 후 실행

---

## ⚠️ 주의사항

### 1. Nginx 설정 변경

프론트엔드 배포 시 Nginx 설정이 변경된 경우, 별도로 업데이트해야 할 수 있습니다.

**Nginx 설정 파일 경로:**
- `config/nginx/core-solution-dev.conf`

**수동 업데이트 방법:**
```bash
# 개발 서버에 SSH 접속
ssh root@${DEV_SERVER_HOST}

# Nginx 설정 파일 복사
sudo cp /tmp/core-solution-dev.conf /etc/nginx/sites-available/core-solution-dev
sudo ln -sf /etc/nginx/sites-available/core-solution-dev /etc/nginx/sites-enabled/core-solution-dev

# Nginx 설정 테스트 및 재시작
sudo nginx -t
sudo systemctl reload nginx
```

### 2. 통합 워크플로우 (`deploy-dev.yml`)

기존 통합 워크플로우는 여전히 사용 가능하지만, 모든 프로젝트를 한 번에 빌드하므로 시간이 오래 걸립니다.

**사용 시나리오:**
- 초기 설정 또는 전체 재배포가 필요한 경우
- 여러 프로젝트를 동시에 변경한 경우

### 3. 의존성 관계

일부 경우 여러 프로젝트를 동시에 배포해야 할 수 있습니다:

- **백엔드 API 변경 + 프론트엔드 연동 변경**
  - 백엔드 먼저 배포 → 프론트엔드 배포

- **Nginx 설정 변경**
  - 모든 프론트엔드 배포 후 Nginx 재시작

---

## 📝 워크플로우 파일 위치

```
.github/workflows/
├── deploy-backend-dev.yml      # 백엔드 배포
├── deploy-frontend-dev.yml     # CoreSolution 프론트엔드 배포
├── deploy-trinity-dev.yml      # Trinity 프론트엔드 배포
├── deploy-ops-dev.yml          # Ops 프론트엔드 배포
└── deploy-dev.yml              # 통합 배포 (기존)
```

---

## 🔍 트러블슈팅

### 워크플로우가 트리거되지 않는 경우

1. **경로 필터 확인**
   - 변경한 파일 경로가 워크플로우의 `paths` 필터와 일치하는지 확인

2. **브랜치 확인**
   - `develop` 브랜치에 push했는지 확인

3. **수동 실행**
   - GitHub Actions에서 수동으로 워크플로우 실행

### 배포 실패 시

1. **로그 확인**
   - GitHub Actions의 워크플로우 실행 로그 확인

2. **서버 상태 확인**
   ```bash
   ssh root@${DEV_SERVER_HOST}
   sudo systemctl status mindgarden-dev.service
   sudo journalctl -u mindgarden-dev.service -n 50
   ```

3. **파일 권한 확인**
   ```bash
   ls -la /var/www/html-dev/
   ls -la /var/www/html-trinity/
   ls -la /var/www/html-ops/
   ```

---

## 📚 관련 문서

- [개발 서버 도메인 설정](./DEV_SERVER_DOMAIN_CONFIGURATION.md)
- [Nginx 프론트엔드/백엔드 설정](./NGINX_FRONTEND_BACKEND_CONFIG.md)
- [502 Bad Gateway 트러블슈팅](./502_BAD_GATEWAY_TROUBLESHOOTING.md)

