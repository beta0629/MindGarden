# CI/CD 워크플로우 가이드  

작성일: 2025-01-XX

---

## 1. 개요

이 문서는 MindGarden 플랫폼의 CI/CD 워크플로우를 설명합니다.

### 배포 전략

```
로컬 개발 → GitHub (develop/main) → 개발 서버 → 테스트 → 운영 서버
```

### 브랜치 전략

- **`develop`**: 개발 브랜치 (개발 서버에만 배포)
- **`main`**: 운영 브랜치 (개발 서버 + 운영 서버 모두 배포)

---

## 2. 배포 워크플로우

### 2.1 개발 서버 배포

**트리거:**
- `main` 또는 `develop` 브랜치에 push
- GitHub Actions에서 수동 실행

**워크플로우 파일:** `.github/workflows/deploy-dev.yml`

**배포 서버:** `beta0629.cafe24.com` (개발 서버)

**프로세스:**
1. 코드 체크아웃
2. Java 17 + Node.js 18 환경 구성
3. 백엔드 빌드 (Maven)
4. 프론트엔드 빌드 (React)
5. 개발 서버로 파일 업로드
6. systemd 서비스 재시작
7. 헬스체크

### 2.2 운영 서버 배포

**트리거:**
- `main` 브랜치에 push (develop 브랜치에서는 실행되지 않음)
- GitHub Actions에서 수동 실행

**워크플로우 파일:** `.github/workflows/deploy-production.yml`

**배포 서버:** `beta74.cafe24.com` (운영 서버)

**프로세스:**
1. 코드 체크아웃
2. Java 17 + Node.js 18 환경 구성
3. 백엔드 빌드 (Maven)
4. 프론트엔드 빌드 (React)
5. 운영 서버로 파일 업로드
6. systemd 서비스 재시작
7. 헬스체크

---

## 3. 개발 → 운영 배포 플로우

### 3.1 표준 플로우

```
1. 로컬에서 개발
   ↓
2. develop 브랜치에 push
   ↓
3. 자동으로 개발 서버에 배포
   ↓
4. 개발 서버에서 테스트 및 확인
   ↓
5. 문제 없으면 main 브랜치로 머지
   ↓
6. 자동으로 개발 서버 + 운영 서버에 배포
```

### 3.2 단계별 상세

#### Step 1: 로컬 개발

```bash
# develop 브랜치에서 작업
git checkout develop
git pull origin develop

# 기능 개발
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin develop
```

#### Step 2: 개발 서버 자동 배포

`develop` 브랜치에 push하면 자동으로 개발 서버에 배포됩니다.

**확인 방법:**
1. GitHub 저장소 > Actions 탭에서 배포 진행 상황 확인
2. 개발 서버 접속하여 확인:
   ```bash
   ssh root@beta0629.cafe24.com
   sudo systemctl status mindgarden-dev.service
   curl http://localhost:8080/actuator/health
   ```

#### Step 3: 개발 서버에서 테스트

개발 서버에서 다음을 확인:
- [ ] 애플리케이션 정상 시작
- [ ] 데이터베이스 연결 정상
- [ ] 주요 기능 동작 확인
- [ ] 에러 로그 없음

#### Step 4: 운영 서버 배포

개발 서버에서 문제가 없으면 `main` 브랜치로 머지:

```bash
# main 브랜치로 전환
git checkout main
git pull origin main

# develop 브랜치 머지
git merge develop

# main 브랜치에 push (운영 서버 자동 배포)
git push origin main
```

**주의:** `main` 브랜치에 push하면 **개발 서버와 운영 서버 모두**에 배포됩니다.

---

## 4. GitHub Secrets 설정

### 4.1 개발 서버 Secrets

| Secret Name | 설명 | 값 |
|------------|------|-----|
| `DEV_SERVER_HOST` | 개발 서버 호스트 | `beta0629.cafe24.com` |
| `DEV_SERVER_USER` | SSH 사용자명 | `root` |
| `DEV_SERVER_SSH_KEY` | SSH 개인키 | 아래 참조 |

### 4.2 운영 서버 Secrets

| Secret Name | 설명 | 값 |
|------------|------|-----|
| `PRODUCTION_HOST` | 운영 서버 호스트 | `beta74.cafe24.com` |
| `PRODUCTION_USER` | SSH 사용자명 | `root` |
| `PRODUCTION_SSH_KEY` | SSH 개인키 | 아래 참조 |

### 4.3 SSH 키 설정

**개발 서버 SSH 키 설정:**

```bash
# SSH 키 생성 스크립트 실행
./scripts/setup-dev-server-ssh.sh
```

또는 수동으로:

```bash
# 1. SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "github-actions-dev" -f ~/.ssh/github_actions_dev

# 2. 공개키를 개발 서버에 등록
ssh-copy-id -i ~/.ssh/github_actions_dev.pub root@beta0629.cafe24.com

# 3. 개인키를 GitHub Secrets에 등록
cat ~/.ssh/github_actions_dev
# 출력된 내용을 GitHub Secrets의 DEV_SERVER_SSH_KEY에 등록
```

**상세 가이드:** [GitHub 개발 서버 설정 가이드](./GITHUB_DEV_SERVER_SETUP.md)

---

## 5. 배포 확인

### 5.1 개발 서버 확인

```bash
# 서비스 상태
ssh root@beta0629.cafe24.com
sudo systemctl status mindgarden-dev.service

# 헬스체크
curl http://beta0629.cafe24.com:8080/actuator/health

# 로그 확인
sudo journalctl -u mindgarden-dev.service -f
```

### 5.2 운영 서버 확인

```bash
# 서비스 상태
ssh root@beta74.cafe24.com
sudo systemctl status mindgarden.service

# 헬스체크
curl http://beta74.cafe24.com:8080/actuator/health

# 로그 확인
sudo journalctl -u mindgarden.service -f
```

---

## 6. 롤백 방법

### 6.1 개발 서버 롤백

```bash
ssh root@beta0629.cafe24.com
cd /var/www/mindgarden-dev

# 백업 파일 확인
ls -lh backups/

# 이전 버전으로 복원
sudo systemctl stop mindgarden-dev.service
cp backups/app.jar.backup.YYYYMMDD_HHMMSS app.jar
sudo systemctl start mindgarden-dev.service
```

### 6.2 운영 서버 롤백

```bash
ssh root@beta74.cafe24.com
cd /var/www/mindgarden

# 백업 파일 확인
ls -lh *.backup.*

# 이전 버전으로 복원
sudo systemctl stop mindgarden.service
cp app.jar.backup.YYYYMMDD_HHMMSS app.jar
sudo systemctl start mindgarden.service
```

---

## 7. 문제 해결

### 7.1 배포 실패

**증상:** GitHub Actions에서 배포 실패

**해결 방법:**
1. GitHub Actions 로그 확인
2. SSH 연결 확인:
   ```bash
   ssh -i ~/.ssh/github_actions_dev root@beta0629.cafe24.com
   ```
3. 서비스 로그 확인:
   ```bash
   sudo journalctl -u mindgarden-dev.service -n 100
   ```

### 7.2 서비스 시작 실패

**증상:** 배포 후 서비스가 시작되지 않음

**해결 방법:**
1. 환경 변수 확인:
   ```bash
   cat /etc/mindgarden/dev.env
   ```
2. JAR 파일 확인:
   ```bash
   ls -lh /var/www/mindgarden-dev/app.jar
   ```
3. 수동 실행 테스트:
   ```bash
   cd /var/www/mindgarden-dev
   java -jar app.jar --spring.profiles.active=dev
   ```

---

## 8. 체크리스트

### 개발 서버 배포 체크리스트

- [ ] GitHub Secrets 설정 완료 (`DEV_SERVER_HOST`, `DEV_SERVER_USER`, `DEV_SERVER_SSH_KEY`)
- [ ] SSH 키 생성 및 개발 서버 등록 완료
- [ ] `develop` 브랜치에 push하여 개발 서버 배포 테스트
- [ ] 개발 서버 헬스체크 성공
- [ ] 개발 서버에서 기능 테스트 완료

### 운영 서버 배포 체크리스트

- [ ] 개발 서버에서 테스트 완료
- [ ] `main` 브랜치로 머지 완료
- [ ] GitHub Secrets 설정 완료 (`PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`)
- [ ] 운영 서버 헬스체크 성공
- [ ] 운영 서버에서 기능 확인 완료

---

## 9. 관련 문서

- [개발 서버 설정 가이드](./DEV_SERVER_SETUP.md)
- [GitHub 개발 서버 설정 가이드](./GITHUB_DEV_SERVER_SETUP.md)
- [GitHub Secrets 설정 가이드](../config/github/GITHUB_SECRETS_SETUP.md)
- [로컬 환경 설정 가이드](./LOCAL_ENV_SETUP.md)
- [아키텍처 개요](./ARCHITECTURE_OVERVIEW.md)

---

## 10. 워크플로우 다이어그램

```
┌─────────────┐
│ 로컬 개발    │
└──────┬──────┘
       │ git push develop
       ↓
┌─────────────┐
│ GitHub      │
│ (develop)   │
└──────┬──────┘
       │ GitHub Actions
       ↓
┌─────────────┐
│ 개발 서버    │ ◄─── 테스트 및 확인
│ 배포        │
└──────┬──────┘
       │ 문제 없음
       ↓
┌─────────────┐
│ GitHub      │
│ (main)      │
└──────┬──────┘
       │ git merge develop → main
       │ git push main
       ↓
┌─────────────┐     ┌─────────────┐
│ 개발 서버    │     │ 운영 서버    │
│ 재배포      │     │ 배포         │
└─────────────┘     └─────────────┘
```

