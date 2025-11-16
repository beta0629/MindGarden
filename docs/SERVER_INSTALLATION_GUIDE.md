# 서버 설치 가이드 (Cafe24)

## 📋 개요

Cafe24 서버에 MindGarden Spring Boot 애플리케이션을 설치하는 단계별 가이드입니다.

## 🎯 서버 환경설정 선택

### 서버 환경설정 화면에서 선택할 항목

1. **OS 선택**: ✅ **Ubuntu 22.04** (운영 환경과 동일)
2. **설치사항**: ✅ **OS만 설치** (중요!)
   - ❌ "OS+APM 설치"는 선택하지 마세요
   - APM(Apache/PHP/MySQL)은 PHP 전용 환경으로 Java 설치가 제한될 수 있습니다
3. **보안설정**: ✅ **사용** (권장)

### 선택 사항 비교

| 항목 | OS만 설치 | OS+APM 설치 |
|------|----------|-------------|
| OS | ✅ Ubuntu 22.04 | ✅ Ubuntu 22.04 |
| Java 설치 | ✅ 가능 (직접 설치) | ⚠️ 제한적 또는 불가능 |
| MySQL | ⚠️ 직접 설치 필요 | ✅ 자동 설치 |
| PHP | ❌ 불필요 | ✅ 자동 설치 |
| 권장 | ✅ **Spring Boot용** | ❌ PHP 애플리케이션용 |

## 📝 설치 단계

### 1단계: 서버 생성 및 초기 접속

1. Cafe24 관리 페이지에서 서버 생성 완료 대기
2. SSH 접속 정보 확인 (IP, 사용자명, 비밀번호)
3. SSH 접속 테스트

```bash
ssh username@your-server-ip
```

### 2단계: Java 17 설치

```bash
# 패키지 목록 업데이트
sudo apt update

# Java 17 설치
sudo apt install -y openjdk-17-jdk

# 설치 확인
java -version
# 예상 출력: openjdk version "17.0.x" OpenJDK Runtime Environment ...

# JAVA_HOME 환경 변수 설정
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# JAVA_HOME 확인
echo $JAVA_HOME
```

### 3단계: MySQL 설치 및 설정

#### 옵션 A: MySQL 8.0 설치

```bash
# MySQL 서버 설치
sudo apt install -y mysql-server

# MySQL 서비스 시작 및 자동 시작 설정
sudo systemctl start mysql
sudo systemctl enable mysql

# MySQL 보안 설정
sudo mysql_secure_installation
# - 비밀번호 정책 설정
# - 익명 사용자 제거
# - 원격 접근 허용 여부
```

#### 옵션 B: MariaDB 10.x 설치

```bash
# MariaDB 서버 설치
sudo apt install -y mariadb-server

# MariaDB 서비스 시작 및 자동 시작 설정
sudo systemctl start mariadb
sudo systemctl enable mariadb

# MariaDB 보안 설정
sudo mysql_secure_installation
```

### 4단계: 데이터베이스 생성

```bash
# MySQL/MariaDB root 사용자로 접속
sudo mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE mind_garden 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

# 전용 사용자 생성 (권장)
CREATE USER 'mindgarden'@'localhost' IDENTIFIED BY 'your-secure-password';

# 권한 부여
GRANT ALL PRIVILEGES ON mind_garden.* TO 'mindgarden'@'localhost';
FLUSH PRIVILEGES;

# 확인
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user='mindgarden';

# 종료
EXIT;
```

### 5단계: 방화벽 설정

```bash
# UFW 방화벽 상태 확인
sudo ufw status

# 필요한 포트 열기
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8080/tcp  # Spring Boot (개발/테스트용)

# 방화벽 활성화
sudo ufw enable

# 설정 확인
sudo ufw status numbered
```

### 6단계: 애플리케이션 디렉토리 준비

```bash
# 애플리케이션 디렉토리 생성
mkdir -p ~/mindgarden
cd ~/mindgarden

# 로그 디렉토리 생성
mkdir -p logs
mkdir -p backups
```

### 7단계: 환경 변수 설정

```bash
# 환경 변수 파일 생성
nano ~/mindgarden/.env.production
```

다음 내용 추가:

```bash
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mind_garden
DB_USERNAME=mindgarden
DB_PASSWORD=your-secure-password

# 운영 서버가 MySQL이면 DB_TYPE 설정 불필요 (기본값: mysql)
# 개발 서버가 MariaDB이면:
# DB_TYPE=mariadb

# JWT 설정
JWT_SECRET=your-jwt-secret-key-32-characters-minimum

# 개인정보 암호화 설정
PERSONAL_DATA_ENCRYPTION_KEY=your-32-character-encryption-key
PERSONAL_DATA_ENCRYPTION_IV=your-16-character-iv

# 서버 설정
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=prod
```

파일 저장: `Ctrl+O`, `Enter`, `Ctrl+X`

### 8단계: 애플리케이션 배포 및 실행

```bash
# JAR 파일을 서버에 업로드 (로컬에서)
# scp target/consultation-management-system-1.0.0.jar username@your-server-ip:~/mindgarden/app.jar

# 서버에서 환경 변수 로드
source ~/mindgarden/.env.production

# 애플리케이션 실행 (테스트)
cd ~/mindgarden
java -jar -Dspring.profiles.active=prod app.jar

# 백그라운드 실행 (nohup 사용)
nohup java -jar -Dspring.profiles.active=prod app.jar > logs/app.log 2>&1 &

# 로그 확인
tail -f logs/app.log
```

### 9단계: Systemd 서비스 등록 (권장)

서비스 파일 생성:

```bash
sudo nano /etc/systemd/system/mindgarden.service
```

다음 내용 추가:

```ini
[Unit]
Description=MindGarden Spring Boot Application
After=network.target mysql.service

[Service]
Type=simple
User=your-username
Group=your-username
WorkingDirectory=/home/your-username/mindgarden
EnvironmentFile=/home/your-username/mindgarden/.env.production
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod /home/your-username/mindgarden/app.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="JAVA_OPTS=-Xms512m -Xmx2g -XX:+UseG1GC"

[Install]
WantedBy=multi-user.target
```

서비스 활성화 및 시작:

```bash
# systemd 재로드
sudo systemctl daemon-reload

# 서비스 활성화 (부팅 시 자동 시작)
sudo systemctl enable mindgarden

# 서비스 시작
sudo systemctl start mindgarden

# 서비스 상태 확인
sudo systemctl status mindgarden

# 로그 확인
sudo journalctl -u mindgarden -f
```

### 10단계: 애플리케이션 확인

```bash
# 서비스 상태 확인
sudo systemctl status mindgarden

# 포트 8080에서 실행 중인지 확인
sudo netstat -tlnp | grep :8080
# 또는
sudo ss -tlnp | grep :8080

# 헬스체크 (로컬에서)
curl http://your-server-ip:8080/actuator/health

# 브라우저에서 접속 테스트
# http://your-server-ip:8080
```

## ✅ 설치 확인 체크리스트

- [ ] SSH 접속 가능
- [ ] Java 17 설치 및 확인 (`java -version`)
- [ ] MySQL/MariaDB 설치 및 실행 중 (`sudo systemctl status mysql`)
- [ ] 데이터베이스 `mind_garden` 생성 완료
- [ ] 방화벽 포트 설정 완료 (22, 80, 443, 8080)
- [ ] 환경 변수 파일 설정 완료 (`.env.production`)
- [ ] JAR 파일 업로드 완료
- [ ] 애플리케이션 실행 확인
- [ ] Systemd 서비스 등록 및 자동 시작 설정 완료
- [ ] 헬스체크 API 응답 확인 (`/actuator/health`)

## 🔧 문제 해결

### Java가 설치되지 않음

```bash
# Java 설치 확인
which java
java -version

# 설치되지 않았다면
sudo apt update
sudo apt install -y openjdk-17-jdk
```

### MySQL 연결 실패

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 로그 확인
sudo tail -f /var/log/mysql/error.log

# MySQL 접속 테스트
mysql -u mindgarden -p mind_garden
```

### 포트 8080이 열리지 않음

```bash
# 방화벽 상태 확인
sudo ufw status

# 포트 열기
sudo ufw allow 8080/tcp
sudo ufw reload

# 포트 리스닝 확인
sudo netstat -tlnp | grep :8080
```

### 애플리케이션 시작 실패

```bash
# 로그 확인
sudo journalctl -u mindgarden -n 100
# 또는
tail -100 ~/mindgarden/logs/app.log

# 환경 변수 확인
cat ~/mindgarden/.env.production

# JAR 파일 권한 확인
ls -la ~/mindgarden/app.jar
```

## 📚 다음 단계

- [Nginx 리버스 프록시 설정](SERVER_REQUIREMENTS.md#리버스-프록시-설정-선택사항)
- [SSL 인증서 설치 (Let's Encrypt)](https://certbot.eff.org/)
- [도메인 연결 및 DNS 설정](ENV_SETUP.md)
- [모니터링 설정](../deployment/pre-deployment-checklist.md#모니터링-설정)

## 🔗 관련 문서

- [서버 환경 요구사항](SERVER_REQUIREMENTS.md)
- [환경 변수 설정 가이드](ENV_SETUP.md)
- [배포 체크리스트](../deployment/pre-deployment-checklist.md)

