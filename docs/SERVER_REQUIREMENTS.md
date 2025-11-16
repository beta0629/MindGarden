# 서버 환경 요구사항 가이드

## 📋 개요

MindGarden 프로젝트는 **Java Spring Boot 애플리케이션**입니다. PHP는 필요 없습니다.

## ⚠️ 중요: PHP 선택 불필요

**Cafe24 등 호스팅 관리 페이지의 PHP 8.4 옵션은 선택할 필요가 없습니다.**

- 이 프로젝트는 Java 기반 Spring Boot 애플리케이션입니다
- PHP는 필요 없습니다
- PHP 관련 설정은 무시하셔도 됩니다

## 🛠️ 필수 서버 요구사항

### 1. Java 런타임 환경

```bash
# Java 17 이상 필요
java -version  # OpenJDK 17 또는 Oracle JDK 17+
```

**설치 확인:**
```bash
java -version
# 예상 출력: openjdk version "17.0.x" 또는 java version "17.0.x"
```

**서버에 Java 설치 방법:**
- Linux: `sudo apt install openjdk-17-jdk` (Ubuntu/Debian) 또는 `sudo yum install java-17-openjdk` (CentOS/RHEL)
- Windows: Oracle JDK 또는 OpenJDK 다운로드 설치

### 2. 데이터베이스

**운영 서버:**
- MySQL 8.0+ (기본값)
- 또는 MariaDB 10.x+ (호환)

**개발 서버:**
- MySQL 8.0+ 또는 MariaDB 10.x+

**데이터베이스 설정:**
- 데이터베이스 이름: `mind_garden`
- 문자셋: `utf8mb4`
- 콜레이션: `utf8mb4_unicode_ci`

### 3. 웹 서버 (선택사항)

**Spring Boot 내장 Tomcat 사용 (기본):**
- Spring Boot에는 내장된 Tomcat 웹 서버가 포함되어 있습니다
- 별도 웹 서버 설치 불필요
- 포트 8080에서 실행 (설정 변경 가능)

**리버스 프록시 사용 (권장, 운영 환경):**
- Apache HTTP Server
- 또는 Nginx
- 80/443 포트에서 외부 접속 받고 내부 8080 포트로 프록시

## 🚀 Cafe24 서버 환경 설정

### 서버 환경설정에서 선택할 항목

**중요: 운영 환경과 동일한 설정을 권장합니다.**

1. **OS 선택**: 
   - ✅ **Ubuntu 22.04** (운영 환경과 동일하게)
   - 또는 Rocky 8.x (선택 가능)

2. **설치사항**:
   - ✅ **OS만 설치** 선택 (중요!)
   - ❌ "OS+APM 설치"는 선택하지 마세요 (APM은 Apache/PHP/MySQL 자동 설치로 PHP 전용 환경)
   - OS만 설치하면 Java와 필요한 소프트웨어를 직접 설치할 수 있습니다

3. **보안설정**:
   - ✅ **사용** (권장)

4. **데이터베이스**: 
   - OS만 설치 후 SSH로 접속하여 MySQL 8.0 또는 MariaDB 10.x 설치
   - 또는 제공되는 DB 서버 사용 (별도 호스팅)

### 서버 설치 후 필수 작업

**1. SSH 접속 확인:**
```bash
ssh username@your-server.com
```

**2. Java 17 설치:**
```bash
# Ubuntu 22.04에서 Java 17 설치
sudo apt update
sudo apt install -y openjdk-17-jdk

# 설치 확인
java -version
# 출력 예: openjdk version "17.0.x"
```

**3. MySQL/MariaDB 설치 (필요시):**
```bash
# MySQL 8.0 설치
sudo apt install -y mysql-server

# 또는 MariaDB 10.x 설치
sudo apt install -y mariadb-server

# 데이터베이스 시작 및 서비스 등록
sudo systemctl enable mysql  # 또는 mariadb
sudo systemctl start mysql   # 또는 mariadb
```

**4. 데이터베이스 생성:**
```bash
# MySQL 접속
sudo mysql -u root

# 데이터베이스 생성
CREATE DATABASE mind_garden CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 (선택사항)
CREATE USER 'mindgarden'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON mind_garden.* TO 'mindgarden'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**5. 방화벽 포트 설정 (필요시):**
```bash
# 포트 8080 허용 (Spring Boot 기본 포트)
sudo ufw allow 8080/tcp
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

**서버 환경 설정 요약:**

| 설정 항목 | 선택 값 | 설명 |
|----------|--------|------|
| OS 선택 | **Ubuntu 22.04** | 운영 환경과 동일하게 |
| 설치사항 | **OS만 설치** | 중요! APM 설치 안 함 |
| 보안설정 | **사용** | 권장 |
| PHP 버전 | 선택 불필요 | Java 애플리케이션이므로 불필요 |

**설치 후 SSH로 접속하여 직접 설치:**
- Java 17+ (필수)
- MySQL 8.0 또는 MariaDB 10.x (필요시)
- 기타 필요한 도구들

## 📝 서버 환경 변수 설정

서버에 SSH 접속 후 환경 변수를 설정합니다:

```bash
# 데이터베이스 설정
export DB_HOST=localhost  # 또는 제공된 DB 호스트
export DB_PORT=3306
export DB_NAME=mind_garden
export DB_USERNAME=your-db-username
export DB_PASSWORD=your-db-password

# 운영 서버가 MySQL이면 DB_TYPE 설정 불필요 (기본값: mysql)
# 개발 서버가 MariaDB이면:
# export DB_TYPE=mariadb

# JWT 설정
export JWT_SECRET=your-jwt-secret-key-32-chars-minimum

# 기타 필요한 환경 변수
export SERVER_PORT=8080
export SPRING_PROFILES_ACTIVE=prod
```

## 🔧 애플리케이션 실행

### JAR 파일로 실행

```bash
# JAR 파일 실행
java -jar -Dspring.profiles.active=prod consultation-management-system-1.0.0.jar

# 또는 환경 변수로 프로파일 설정
export SPRING_PROFILES_ACTIVE=prod
java -jar consultation-management-system-1.0.0.jar
```

### Systemd 서비스로 실행 (권장, Linux)

`/etc/systemd/system/mindgarden.service` 파일 생성:

```ini
[Unit]
Description=MindGarden Spring Boot Application
After=network.target mysql.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/mindgarden
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod app.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="JAVA_OPTS=-Xms512m -Xmx2g"

[Install]
WantedBy=multi-user.target
```

서비스 활성화 및 시작:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mindgarden
sudo systemctl start mindgarden
sudo systemctl status mindgarden
```

## 🌐 리버스 프록시 설정 (선택사항)

### Nginx 설정 예시

`/etc/nginx/sites-available/mindgarden`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Apache 설정 예시

`/etc/apache2/sites-available/mindgarden.conf`:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:8080/
    ProxyPassReverse / http://localhost:8080/
    
    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>
</VirtualHost>
```

## ✅ 요약

### 선택하지 말아야 할 것
- ❌ PHP 8.4 (필요 없음)
- ❌ 프로그램 자동설치 (PHP용)

### 선택/설정해야 할 것
- ✅ MySQL 8.0 또는 MariaDB 10.x
- ✅ Java 17+ 설치
- ✅ 데이터베이스 생성 및 접속 정보
- ✅ 환경 변수 설정
- ✅ JAR 파일 실행 또는 Systemd 서비스 등록

### 체크리스트

- [ ] Java 17+ 설치 확인
- [ ] MySQL/MariaDB 접속 정보 확인
- [ ] 데이터베이스 `mind_garden` 생성 확인
- [ ] 환경 변수 설정 완료
- [ ] JAR 파일 실행 또는 서비스 등록 완료
- [ ] 포트 8080 접근 가능 확인
- [ ] 리버스 프록시 설정 (선택사항)

## 🔗 관련 문서

- [환경 변수 설정 가이드](ENV_SETUP.md)
- [데이터베이스 설정 가이드](DATABASE_SETUP.md)
- [배포 체크리스트](../DEPLOYMENT_CHECKLIST.md)

