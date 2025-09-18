# CI/CD 설정 가이드

## GitHub Actions 자동 배포 설정

### 1. 개요

MindGarden 프로젝트는 GitHub Actions를 사용하여 `main` 브랜치에 push할 때마다 자동으로 운영 서버에 배포됩니다.

### 2. 필요한 GitHub Secrets 설정

GitHub 리포지토리의 **Settings > Secrets and variables > Actions**에서 다음 시크릿을 설정해야 합니다:

| Secret 이름 | 값 | 설명 |
|------------|-----|------|
| `PRODUCTION_HOST` | `beta74.cafe24.com` | 운영 서버 호스트명 |
| `PRODUCTION_USER` | `root` | SSH 접속 사용자명 |
| `PRODUCTION_SSH_KEY` | [SSH 프라이빗 키] | SSH 접속용 프라이빗 키 |

#### SSH 프라이빗 키 내용:
```
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

### 3. CI/CD 파이프라인 구성

#### 3.1 자동 배포 조건
- `main` 브랜치에 push 시 자동 실행
- 수동 실행 (`workflow_dispatch`) 지원
- `docs/**`, `*.md`, `.gitignore` 변경 시 제외

#### 3.2 배포 단계

1. **🚀 배포 시작**: 배포 프로세스 시작 알림
2. **📥 코드 체크아웃**: GitHub 리포지토리에서 소스 코드 다운로드
3. **☕ Java 17 설정**: Java 17 런타임 환경 설정
4. **📦 Maven 캐시**: Maven 의존성 캐시 설정
5. **🔨 백엔드 빌드**: Spring Boot JAR 파일 빌드
6. **📱 Node.js 설정**: Node.js 18 환경 설정
7. **🎨 프론트엔드 빌드**: React 프로덕션 빌드
8. **📤 서버 배포**: 운영 서버 준비 및 백업
9. **📁 파일 업로드**: 빌드된 파일들을 서버에 업로드
10. **🔄 애플리케이션 재시작**: systemd service를 통한 애플리케이션 재시작
11. **🔍 배포 검증**: 배포 상태 확인 및 검증
12. **📢 배포 완료 알림**: 배포 완료 메시지

### 4. SystemD Service 관리

운영 서버에서는 `mindgarden.service`를 통해 애플리케이션을 관리합니다:

```bash
# 서비스 상태 확인
sudo systemctl status mindgarden.service

# 서비스 시작
sudo systemctl start mindgarden.service

# 서비스 중지
sudo systemctl stop mindgarden.service

# 서비스 재시작
sudo systemctl restart mindgarden.service

# 로그 확인
sudo journalctl -u mindgarden.service -f
```

### 5. 환경변수 관리

모든 환경변수는 systemd service 파일(`/etc/systemd/system/mindgarden.service`)에서 관리됩니다:

- `PERSONAL_DATA_ENCRYPTION_KEY`: 개인정보 암호화 키
- `DB_HOST`, `DB_PORT`, `DB_NAME`: 데이터베이스 연결 정보
- `DB_USERNAME`, `DB_PASSWORD`: 데이터베이스 인증 정보
- `REDIS_HOST`, `REDIS_PORT`: Redis 연결 정보
- `OAUTH2_BASE_URL`, `FRONTEND_BASE_URL`: OAuth2 및 프론트엔드 URL

### 6. 자동 배포 기능

#### 6.1 공통코드 자동 마이그레이션
- 배포 시 `deployment/complete-common-codes-migration.sql` 자동 실행
- 지점 코드, 권한 코드 등 기본 데이터 동기화

#### 6.2 프론트엔드 자동 배포
- React 빌드 파일을 `/var/www/html/`에 자동 배포
- Nginx를 통한 정적 파일 서빙

#### 6.3 백엔드 자동 배포
- Spring Boot JAR 파일 교체
- systemd service를 통한 무중단 재시작

### 7. 배포 모니터링

#### 7.1 배포 실패 시 확인사항
1. GitHub Actions 워크플로우 로그 확인
2. 서버 SSH 접속 가능성 확인
3. systemd service 상태 확인
4. 애플리케이션 로그 확인

#### 7.2 헬스체크
- 배포 후 `/actuator/health` 엔드포인트 자동 확인
- 포트 8081에서 애플리케이션 상태 검증

### 8. 수동 배포 방법

긴급 상황 시 수동 배포 가능:

```bash
# 1. GitHub Actions에서 수동 실행
# Repository > Actions > Deploy to Production > Run workflow

# 2. 로컬에서 수동 배포
./deployment/manual-deploy.sh
```

### 9. 롤백 절차

배포 실패 시 이전 버전으로 롤백:

```bash
# 1. 백업된 JAR 파일 확인
ls -la /var/www/mindgarden-backup/

# 2. 이전 버전으로 복원
cp /var/www/mindgarden-backup/[날짜]/app.jar /var/www/mindgarden/

# 3. 서비스 재시작
sudo systemctl restart mindgarden.service
```

### 10. 보안 고려사항

- SSH 키 기반 인증 사용
- GitHub Secrets를 통한 민감정보 관리
- 서버 접근 권한 최소화
- 정기적인 SSH 키 교체 권장
