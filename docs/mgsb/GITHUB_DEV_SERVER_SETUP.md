# GitHub Actions 개발 서버 배포 설정 가이드

작성일: 2025-01-XX

---

## 1. 개요

이 문서는 GitHub Actions를 통해 개발 서버(`beta0629.cafe24.com`)로 자동 배포하는 설정 방법을 안내합니다.

### 배포 트리거
- `main` 또는 `develop` 브랜치에 push 시 자동 배포
- GitHub Actions에서 수동 실행 가능 (`workflow_dispatch`)

---

## 2. GitHub Secrets 설정

### 2.1 설정 경로

1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables** > **Actions** 클릭
4. **New repository secret** 버튼 클릭

### 2.2 필수 Secrets

다음 Secrets를 추가해야 합니다:

#### 개발 서버 접속 정보

| Secret Name | 설명 | 예시 값 |
|------------|------|---------|
| `DEV_SERVER_HOST` | 개발 서버 호스트 주소 | `beta0629.cafe24.com` |
| `DEV_SERVER_USER` | SSH 사용자명 | `root` |
| `DEV_SERVER_SSH_KEY` | SSH 개인키 (전체 내용) | 아래 참조 |

#### SSH 키 생성 및 등록

**1. 개발 서버에서 SSH 키 생성 (이미 있으면 생략)**

```bash
# 개발 서버에 접속
ssh root@beta0629.cafe24.com

# SSH 키 생성 (없는 경우)
ssh-keygen -t rsa -b 4096 -C "github-actions-dev" -f ~/.ssh/github_actions_dev
```

**2. 공개키를 authorized_keys에 추가**

```bash
# 개발 서버에서 실행
cat ~/.ssh/github_actions_dev.pub >> ~/.authorized_keys
chmod 600 ~/.authorized_keys
```

**3. 개인키를 GitHub Secrets에 등록**

로컬 PC에서:

```bash
# 개인키 내용 확인
cat ~/.ssh/github_actions_dev
```

출력된 전체 내용(-----BEGIN 부터 -----END 까지)을 복사하여 GitHub Secrets의 `DEV_SERVER_SSH_KEY`에 등록합니다.

**⚠️ 중요**: 
- 개인키 전체를 복사해야 합니다
- 줄바꿈 문자도 포함해야 합니다
- 공개키가 아닌 **개인키**를 등록해야 합니다

---

## 3. 배포 워크플로우

### 3.1 자동 배포

`main` 또는 `develop` 브랜치에 push하면 자동으로 개발 서버에 배포됩니다:

```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main  # 또는 develop
```

### 3.2 수동 배포

GitHub Actions에서 수동으로 배포할 수 있습니다:

1. GitHub 저장소 > **Actions** 탭
2. **🧪 MindGarden 개발 서버 배포** 워크플로우 선택
3. **Run workflow** 버튼 클릭
4. 브랜치 선택 후 **Run workflow** 실행

---

## 4. 배포 프로세스

### 4.1 배포 단계

1. **코드 체크아웃**: GitHub에서 최신 코드 다운로드
2. **Java 17 설정**: Java 17 환경 구성
3. **Node.js 18 설정**: Node.js 18 환경 구성
4. **백엔드 빌드**: Maven으로 JAR 파일 생성
5. **프론트엔드 빌드**: React 앱 빌드
6. **SSH 연결 테스트**: 개발 서버 접속 확인
7. **배포 준비**: 기존 파일 백업
8. **파일 업로드**: 빌드된 파일을 개발 서버로 전송
9. **서비스 재시작**: systemd 서비스 재시작
10. **헬스체크**: 배포 성공 여부 확인

### 4.2 배포 위치

- **백엔드**: `/var/www/mindgarden-dev/app.jar`
- **프론트엔드**: `/var/www/html-dev/`
- **설정 파일**: `/var/www/mindgarden-dev/application-dev.yml`
- **환경 변수**: `/etc/mindgarden/dev.env`
- **백업**: `/var/www/mindgarden-dev/backups/`

### 4.3 systemd 서비스

배포 시 자동으로 systemd 서비스가 생성/업데이트됩니다:

- **서비스명**: `mindgarden-dev.service`
- **실행 명령**: `java -jar /var/www/mindgarden-dev/app.jar --spring.profiles.active=dev`
- **환경 변수**: `/etc/mindgarden/dev.env`에서 로드

---

## 5. 환경 변수 설정

### 5.1 자동 생성

배포 시 환경 변수 파일이 자동으로 생성됩니다 (`/etc/mindgarden/dev.env`).

### 5.2 수동 수정 (필요 시)

개발 서버에 SSH 접속하여 수정:

```bash
ssh root@beta0629.cafe24.com
sudo nano /etc/mindgarden/dev.env
```

수정 후 서비스 재시작:

```bash
sudo systemctl restart mindgarden-dev.service
```

---

## 6. 모니터링 및 로그

### 6.1 서비스 상태 확인

```bash
# 서비스 상태
sudo systemctl status mindgarden-dev.service

# 서비스 로그
sudo journalctl -u mindgarden-dev.service -f

# 최근 로그 (50줄)
sudo journalctl -u mindgarden-dev.service -n 50
```

### 6.2 헬스체크

```bash
# Health Check
curl http://localhost:8080/actuator/health

# 또는 개발 서버 외부에서
curl http://beta0629.cafe24.com:8080/actuator/health
```

---

## 7. 문제 해결

### 7.1 배포 실패

**증상**: GitHub Actions에서 배포 실패

**해결 방법**:
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

**증상**: 배포 후 서비스가 시작되지 않음

**해결 방법**:
1. 환경 변수 파일 확인:
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

### 7.3 데이터베이스 연결 실패

**증상**: 서비스는 시작되지만 DB 연결 실패

**해결 방법**:
1. 환경 변수 확인:
   ```bash
   cat /etc/mindgarden/dev.env | grep DB_
   ```
2. DB 연결 테스트:
   ```bash
   mysql -h beta0629.cafe24.com -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution -e "SELECT 1"
   ```

---

## 8. 보안 주의사항

### 8.1 SSH 키 관리

- SSH 개인키는 절대 공개하지 마세요
- GitHub Secrets에만 저장하고 로컬에도 안전하게 보관
- 정기적으로 키 로테이션 권장

### 8.2 환경 변수 보안

- `/etc/mindgarden/dev.env` 파일 권한: `600` (소유자만 읽기/쓰기)
- 비밀번호는 강력하게 설정
- 정기적으로 비밀번호 변경

### 8.3 접근 제어

- 개발 서버는 내부 네트워크에서만 접근 가능하도록 설정
- 방화벽 규칙으로 외부 접근 제한
- VPN 또는 IP 화이트리스트 사용 권장

---

## 9. 체크리스트

개발 서버 자동 배포 설정 완료 체크리스트:

- [ ] 개발 서버 SSH 키 생성 완료
- [ ] GitHub Secrets 등록 완료 (`DEV_SERVER_HOST`, `DEV_SERVER_USER`, `DEV_SERVER_SSH_KEY`)
- [ ] SSH 연결 테스트 성공
- [ ] GitHub Actions 워크플로우 파일 생성 완료 (`.github/workflows/deploy-dev.yml`)
- [ ] 테스트 배포 실행 및 성공 확인
- [ ] systemd 서비스 자동 생성 확인
- [ ] 환경 변수 파일 자동 생성 확인
- [ ] 헬스체크 엔드포인트 응답 확인
- [ ] 서비스 로그 정상 출력 확인

---

## 10. 관련 문서

- [개발 서버 설정 가이드](./DEV_SERVER_SETUP.md)
- [로컬 환경 설정 가이드](./LOCAL_ENV_SETUP.md)
- [아키텍처 개요](./ARCHITECTURE_OVERVIEW.md)
- [운영 환경 설정 가이드](./internal-ops/ENV_PRODUCTION_SETUP.md)

