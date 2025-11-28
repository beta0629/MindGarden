# 개발 서버 환경 설정 가이드

작성일: 2025-01-XX

---

## 1. 개요

개발 서버는 로컬 개발 환경과 운영 환경 사이의 중간 단계로, 실제 서버 환경에서의 테스트와 검증을 위한 환경입니다.

### 환경 구분
- **로컬 (Local)**: 개발자 개인 PC 환경 (`application-local.yml`) - **개발 서버 DB 사용**
- **개발 서버 (Dev Server)**: 공유 개발 서버 환경 (`application-dev.yml`) ← **이 문서**
- **운영 (Production)**: 실제 서비스 운영 환경 (`application-prod.yml`)

> **중요**: 로컬 환경(`application-local.yml`)도 개발 서버의 데이터베이스를 사용합니다. 로컬 PC에 별도의 MySQL 설치가 필요 없습니다.

---

## 2. 데이터베이스 설정

### 2.1 데이터베이스 접속 정보

개발 서버의 데이터베이스 접속 정보는 환경 변수로 관리됩니다. **로컬 환경(`application-local.yml`)도 동일한 개발 서버 DB를 사용합니다.**

```yaml
# application-dev.yml 및 application-local.yml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:core_solution}?...
    username: ${DB_USERNAME:mindgarden_dev}
    password: ${DB_PASSWORD:}  # 필수: 환경 변수로 설정
```

### 2.2 환경 변수 설정

**로컬 개발 환경**에서도 개발 서버 DB를 사용하므로, 로컬 PC에서 다음 환경 변수를 설정해야 합니다:

```bash
# 데이터베이스 접속 정보 (로컬 PC에서 실행 시)
export DB_HOST=your-dev-db-host  # 개발 서버 DB 호스트 주소
export DB_PORT=3306
export DB_NAME=core_solution
export DB_USERNAME=mindgarden_dev
export DB_PASSWORD="MindGardenDev2025!@#"  # 실제 비밀번호로 변경

# 기타 필수 환경 변수
export JWT_SECRET=your-jwt-secret-key
export PERSONAL_DATA_ENCRYPTION_KEY=your-encryption-key
export PERSONAL_DATA_ENCRYPTION_IV=your-encryption-iv
```

> **참고**: 로컬 PC에서 개발할 때는 개발 서버 DB에 접근할 수 있어야 합니다. 네트워크 연결 및 방화벽 설정을 확인하세요.

### 2.3 systemd 서비스 파일 예시

개발 서버에서 systemd로 서비스를 실행하는 경우:

```ini
# /etc/systemd/system/mindgarden-dev.service
[Unit]
Description=MindGarden Development Server
After=network.target mysql.service

[Service]
Type=simple
User=mindgarden
WorkingDirectory=/opt/mindgarden
EnvironmentFile=/etc/mindgarden/dev.env
ExecStart=/usr/bin/java -jar /opt/mindgarden/app.jar --spring.profiles.active=dev
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

환경 변수 파일 (`/etc/mindgarden/dev.env`):
```bash
# 데이터베이스 설정
DB_HOST=your-dev-db-host
DB_PORT=3306
DB_NAME=core_solution
DB_USERNAME=mindgarden_dev
DB_PASSWORD=MindGardenDev2025!@#

# JWT 설정
JWT_SECRET=dev-jwt-secret-key-change-me

# 암호화 설정
PERSONAL_DATA_ENCRYPTION_KEY=dev-encryption-key-32-chars-long
PERSONAL_DATA_ENCRYPTION_IV=dev-iv-16-chars

# 기타 설정
SERVER_PORT=8080
FRONTEND_BASE_URL=http://dev.m-garden.co.kr
```

---

## 3. 프로파일 활성화

### 3.1 애플리케이션 실행 시

```bash
# 방법 1: JAR 실행 시 프로파일 지정
java -jar app.jar --spring.profiles.active=dev

# 방법 2: 환경 변수로 설정
export SPRING_PROFILES_ACTIVE=dev
java -jar app.jar

# 방법 3: Gradle 실행 시
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### 3.2 확인

애플리케이션 시작 시 로그에서 다음을 확인할 수 있습니다:

```
The following profiles are active: dev
```

또는 Actuator 엔드포인트를 통해 확인:

```bash
curl http://localhost:8080/actuator/info
```

---

## 4. 데이터베이스 사용자 생성

개발 서버용 데이터베이스 사용자를 생성하는 SQL:

```sql
-- 데이터베이스 생성 (필요한 경우)
CREATE DATABASE IF NOT EXISTS core_solution 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 개발 서버 전용 사용자 생성
CREATE USER IF NOT EXISTS 'mindgarden_dev'@'%' IDENTIFIED BY 'MindGardenDev2025!@#';

-- 권한 부여
GRANT ALL PRIVILEGES ON core_solution.* TO 'mindgarden_dev'@'%';

-- 권한 새로고침
FLUSH PRIVILEGES;

-- 사용자 확인
SELECT User, Host FROM mysql.user WHERE User = 'mindgarden_dev';
```

---

## 5. 보안 주의사항

### 5.1 환경 변수 보안

- **절대 코드에 비밀번호를 하드코딩하지 마세요**
- 환경 변수 파일(`.env`, `dev.env`)은 `.gitignore`에 추가되어야 합니다
- GitHub Actions Secrets에 개발 서버용 비밀번호를 등록하세요

### 5.2 접근 제어

- 개발 서버는 내부 네트워크에서만 접근 가능하도록 설정
- 방화벽 규칙으로 외부 접근 차단
- VPN 또는 IP 화이트리스트 사용 권장

---

## 6. CI/CD 연동

### 6.1 GitHub Actions Secrets

GitHub Actions에서 개발 서버로 배포할 때 필요한 Secrets:

```
DEV_DB_HOST
DEV_DB_PORT
DEV_DB_NAME
DEV_DB_USERNAME
DEV_DB_PASSWORD
DEV_JWT_SECRET
DEV_PERSONAL_DATA_ENCRYPTION_KEY
DEV_PERSONAL_DATA_ENCRYPTION_IV
```

### 6.2 배포 워크플로우 예시

```yaml
# .github/workflows/deploy-dev.yml
name: Deploy to Development Server

on:
  push:
    branches: [ develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build application
        run: ./gradlew build -x test
      
      - name: Deploy to dev server
        env:
          DB_HOST: ${{ secrets.DEV_DB_HOST }}
          DB_USERNAME: ${{ secrets.DEV_DB_USERNAME }}
          DB_PASSWORD: ${{ secrets.DEV_DB_PASSWORD }}
        run: |
          # 배포 스크립트 실행
          ./deploy-dev.sh
```

---

## 7. 모니터링 및 로깅

### 7.1 로그 위치

개발 서버의 로그는 다음 위치에 저장됩니다:

```
logs/mindgarden-dev.log
logs/error-dev.log
```

### 7.2 Health Check

개발 서버의 상태 확인:

```bash
# Health Check
curl http://dev-server:8080/actuator/health

# 정보 확인
curl http://dev-server:8080/actuator/info
```

---

## 8. 문제 해결

### 8.1 데이터베이스 연결 실패

**증상**: `Communications link failure` 또는 `Access denied`

**해결 방법**:
1. 환경 변수 `DB_PASSWORD`가 올바르게 설정되었는지 확인
2. 데이터베이스 사용자 권한 확인
3. 방화벽 규칙 확인
4. 데이터베이스 서버가 실행 중인지 확인

```bash
# 환경 변수 확인
echo $DB_PASSWORD

# 데이터베이스 연결 테스트
mysql -h $DB_HOST -u $DB_USERNAME -p$DB_PASSWORD $DB_NAME -e "SELECT 1"
```

### 8.2 프로파일이 적용되지 않음

**증상**: 개발 서버 설정이 적용되지 않음

**해결 방법**:
1. `SPRING_PROFILES_ACTIVE=dev` 환경 변수 확인
2. `application-dev.yml` 파일이 올바른 위치에 있는지 확인
3. 애플리케이션 재시작

---

## 9. 관련 문서

- [운영 환경 설정 가이드](./internal-ops/ENV_PRODUCTION_SETUP.md)
- [내부 운영 포털 환경 설정](./internal-ops/ENV_SETUP.md)
- [아키텍처 개요](./ARCHITECTURE_OVERVIEW.md)

---

## 10. 체크리스트

개발 서버 설정 완료 체크리스트:

- [ ] 데이터베이스 사용자 생성 완료 (`mindgarden_dev`)
- [ ] 환경 변수 파일 생성 및 설정 완료
- [ ] systemd 서비스 파일 생성 및 활성화
- [ ] 프로파일 활성화 확인 (`dev`)
- [ ] 데이터베이스 연결 테스트 성공
- [ ] Health Check 엔드포인트 응답 확인
- [ ] 로그 파일 생성 확인
- [ ] GitHub Actions Secrets 등록 완료
- [ ] 방화벽 규칙 설정 완료
- [ ] 접근 제어 설정 완료

