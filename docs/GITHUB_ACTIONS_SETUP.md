# 🚀 GitHub Actions 자동 배포 설정 가이드

## 📋 개요
MindGarden 프로젝트의 GitHub Actions를 통한 자동 배포 시스템 설정 가이드입니다.

## 🔑 GitHub Secrets 설정

GitHub 저장소 > Settings > Secrets and variables > Actions에서 다음 시크릿을 추가하세요:

### 필수 시크릿

| 시크릿 이름 | 설명 | 값 |
|------------|------|-----|
| `SERVER_HOST` | 운영 서버 호스트 | `beta74.cafe24.com` |
| `SERVER_USER` | 서버 사용자명 | `root` |
| `SERVER_SSH_KEY` | SSH 개인키 | SSH 개인키 전체 내용 |

### SSH 키 생성 및 설정

1. **로컬에서 SSH 키 생성:**
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@mindgarden.com" -f ~/.ssh/mindgarden_github_actions
```

2. **공개키를 서버에 추가:**
```bash
ssh-copy-id -i ~/.ssh/mindgarden_github_actions.pub root@beta74.cafe24.com
```

3. **개인키를 GitHub Secrets에 추가:**
```bash
cat ~/.ssh/mindgarden_github_actions
```
위 명령의 출력 전체를 `SERVER_SSH_KEY` 시크릿으로 추가

## 🔄 배포 프로세스

### 자동 배포 트리거
- `main` 브랜치에 푸시할 때마다 자동 실행
- GitHub 웹에서 수동 실행 가능 (Actions 탭 > workflow_dispatch)

### 배포 단계
1. **📥 코드 체크아웃**
2. **☕ Java 17 & 📦 Node.js 18 설정**
3. **🏗️ 백엔드 빌드** (`mvn clean package -DskipTests`)
4. **🏗️ 프론트엔드 빌드** (`npm ci && npm run build`)
5. **🚀 서버 배포** (서비스 중지, 백업, 파일 업로드)
6. **🔄 서비스 재시작** (systemd 서비스 관리)
7. **🏥 헬스체크** (서비스 상태, HTTP, 프론트엔드 확인)
8. **🧹 메모리 정리** (백업 파일 정리, 시스템 캐시 클리어)

## 📁 배포 구조

```
/var/www/mindgarden/
├── app.jar                    # Spring Boot 애플리케이션
├── app.jar.backup.YYYYMMDD_HHMMSS  # 자동 백업
├── frontend/                  # React 빌드 파일
│   ├── static/
│   ├── index.html
│   └── ...
└── frontend.backup.YYYYMMDD_HHMMSS.tar.gz  # 자동 백업
```

## 🔧 systemd 서비스 관리

### 서비스 파일 위치
- `/etc/systemd/system/mindgarden.service`

### 주요 명령어
```bash
# 서비스 상태 확인
sudo systemctl status mindgarden.service

# 서비스 재시작
sudo systemctl restart mindgarden.service

# 로그 확인
sudo journalctl -u mindgarden.service -f
```

## 🏥 헬스체크 엔드포인트

- **백엔드:** `http://localhost:8080/actuator/health`
- **프론트엔드:** `http://localhost/login`
- **Nginx:** `http://m-garden.co.kr`

## 🧹 자동 정리 기능

### 백업 파일 정리
- 7일 이상 된 백업 파일 자동 삭제
- 패턴: `*.backup.*`

### 메모리 정리
- 시스템 캐시 클리어 (`drop_caches`)
- 메모리 사용량 모니터링

## ⚠️ 주의사항

1. **환경변수는 systemd 서비스 파일에서 관리**
   - `application-prod.yml`은 `.gitignore`에 포함
   - 민감한 정보는 `/etc/systemd/system/mindgarden.service`에 설정

2. **배포 실패 시 자동 롤백**
   - 백업 파일이 자동 생성됨
   - 수동 복구: `cp app.jar.backup.YYYYMMDD_HHMMSS app.jar`

3. **브랜치 보호**
   - `main` 브랜치 푸시 시에만 배포
   - 개발용 브랜치는 배포되지 않음

## 🔍 트러블슈팅

### 배포 실패 시
1. GitHub Actions 로그 확인
2. 서버 로그 확인: `sudo journalctl -u mindgarden.service -n 50`
3. 백업에서 복구: `cp app.jar.backup.YYYYMMDD_HHMMSS app.jar`

### SSH 연결 실패 시
1. SSH 키 권한 확인: `chmod 600 ~/.ssh/mindgarden_github_actions`
2. 서버 접근 확인: `ssh -i ~/.ssh/mindgarden_github_actions root@beta74.cafe24.com`

## 📊 배포 모니터링

배포 완료 후 다음 사항을 확인하세요:
- ✅ GitHub Actions 성공 상태
- ✅ 서비스 정상 실행
- ✅ HTTP 헬스체크 통과
- ✅ 프론트엔드 정상 접근
- ✅ 메모리 사용량 정상

---

**🎯 이제 `git push origin main`만 하면 자동으로 배포됩니다!**
