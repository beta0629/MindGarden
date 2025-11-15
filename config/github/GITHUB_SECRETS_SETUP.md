# 🔑 GitHub Secrets 설정 가이드

## 📍 GitHub 저장소 설정 경로
1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables** > **Actions** 클릭

## 🔐 운영 서버 Secrets (기존)

### 1. PRODUCTION_HOST
- **Name:** `PRODUCTION_HOST`
- **Value:** `beta74.cafe24.com`

### 2. PRODUCTION_USER  
- **Name:** `PRODUCTION_USER`
- **Value:** `root`

### 3. PRODUCTION_SSH_KEY
- **Name:** `PRODUCTION_SSH_KEY`
- **Value:** 아래 명령어로 출력되는 SSH 개인키 전체 내용

```bash
cat ~/.ssh/mindgarden_github_actions
```

**⚠️ 중요:** SSH 개인키 전체를 복사해서 붙여넣으세요 (-----BEGIN 부터 -----END 까지 모든 내용)

---

## 🧪 개발 서버 Secrets (신규)

### 1. DEV_SERVER_HOST
- **Name:** `DEV_SERVER_HOST`
- **Value:** `beta0629.cafe24.com`

### 2. DEV_SERVER_USER  
- **Name:** `DEV_SERVER_USER`
- **Value:** `root`

### 3. DEV_SERVER_SSH_KEY
- **Name:** `DEV_SERVER_SSH_KEY`
- **Value:** 개발 서버 SSH 개인키 전체 내용

**개발 서버 SSH 키 생성 방법:**

1. **로컬 PC에서 SSH 키 생성** (또는 기존 키 사용):
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-dev" -f ~/.ssh/github_actions_dev
```

2. **공개키를 개발 서버에 등록**:
```bash
# 개발 서버에 접속
ssh root@beta0629.cafe24.com

# authorized_keys에 공개키 추가
echo "공개키 내용" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

또는 로컬에서:
```bash
ssh-copy-id -i ~/.ssh/github_actions_dev.pub root@beta0629.cafe24.com
```

3. **개인키를 GitHub Secrets에 등록**:
```bash
# 로컬 PC에서 개인키 내용 확인
cat ~/.ssh/github_actions_dev
```

출력된 전체 내용(-----BEGIN 부터 -----END 까지)을 복사하여 GitHub Secrets의 `DEV_SERVER_SSH_KEY`에 등록합니다.

**⚠️ 중요:** 
- 개인키 전체를 복사해야 합니다
- 줄바꿈 문자도 포함해야 합니다
- 공개키가 아닌 **개인키**를 등록해야 합니다

## 🧪 테스트 방법

1. **GitHub Secrets 설정 완료 후:**
```bash
git add .github/workflows/deploy-production.yml docs/GITHUB_ACTIONS_SETUP.md GITHUB_SECRETS_SETUP.md
git commit -m "feat: GitHub Actions 자동 배포 워크플로우 추가"
git push origin main
```

2. **GitHub Actions 확인:**
   - GitHub 저장소 > Actions 탭에서 배포 진행 상황 확인
   - 각 단계별 로그 확인 가능

3. **배포 완료 확인:**
   - 서비스 상태: `sudo systemctl status mindgarden.service`
   - 애플리케이션 접근: `http://m-garden.co.kr`

## 🔄 배포 플로우

```mermaid
graph TD
    A[git push origin main] --> B[GitHub Actions 트리거]
    B --> C[백엔드 빌드]
    B --> D[프론트엔드 빌드]
    C --> E[서버 배포]
    D --> E
    E --> F[서비스 재시작]
    F --> G[헬스체크]
    G --> H[메모리 정리]
    H --> I[배포 완료]
```

## 🎯 주요 특징

- ✅ **자동 백업**: 기존 파일 자동 백업
- ✅ **롤백 지원**: 배포 실패 시 이전 버전으로 복구 가능
- ✅ **헬스체크**: 배포 후 자동 상태 확인
- ✅ **메모리 관리**: 자동 메모리 정리 및 모니터링
- ✅ **Zero Downtime**: systemd 서비스 관리로 최소 다운타임

## 🚨 문제 해결

### 배포 실패 시
1. GitHub Actions 로그 확인
2. 서버 SSH 접속하여 수동 복구:
```bash
cd /var/www/mindgarden
sudo systemctl stop mindgarden.service
cp app.jar.backup.YYYYMMDD_HHMMSS app.jar
sudo systemctl start mindgarden.service
```

### SSH 연결 실패 시
- GitHub Secrets의 `SERVER_SSH_KEY` 값 재확인
- SSH 키 형식 확인 (-----BEGIN ~ -----END 포함)

---

**🎉 설정 완료 후 `git push origin main`으로 자동 배포를 테스트해보세요!**
# GitHub Actions 자동 배포 테스트 완료
