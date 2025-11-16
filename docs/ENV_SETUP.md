# 환경 변수 설정 가이드

## 📋 개요

Mac에서 사용하는 환경 설정을 서버에 동일하게 반영하기 위해 환경 변수를 사용합니다.

## 🔧 현재 설정 구조

```
src/main/resources/
├── application.yml          # 공통 설정 (Git 포함) - 환경 변수 사용
└── application-local.yml    # 로컬 개발 설정 (Git 제외) - Mac에서 사용

.gitignore에서 제외:
- application-*.yml
- .env*
```

## 💡 Mac에서 사용 중인 설정 반영 방법

### 방법 1: 환경 변수 사용 (권장)

`application.yml`은 Git에 포함되어 있으며, 환경 변수를 통해 값을 주입합니다.

#### Mac에서 환경 변수 설정

```bash
# ~/.zshrc 또는 ~/.bash_profile에 추가

# 데이터베이스 설정 - 로컬 DB 사용 (기본값)
# DB_HOST, DB_PORT, DB_NAME을 설정하지 않으면 자동으로 localhost:3306/mind_garden 사용
export DB_USERNAME=root
export DB_PASSWORD=your-local-password

# 데이터베이스 설정 - 개발 서버 DB 사용 (추가 설정)
# export DB_HOST=dev-server.example.com
# export DB_PORT=3306
# export DB_NAME=mind_garden_dev
# export DB_USERNAME=dev-user
# export DB_PASSWORD=dev-password

# JWT 설정
export JWT_SECRET=your-local-jwt-secret

# 기타 필요한 환경 변수
export SERVER_PORT=8080
```

#### 서버에서 환경 변수 설정

```bash
# 서버 배포 시 동일한 환경 변수 설정
export DB_USERNAME=production-user
export DB_PASSWORD=production-password
export JWT_SECRET=production-jwt-secret
export SERVER_PORT=8080
```

### 방법 2: application-local.yml 사용 (로컬 전용)

Mac에서만 사용하는 설정 파일 (Git 제외됨):

```yaml
# src/main/resources/application-local.yml (로컬에서 직접 생성)
spring:
  profiles:
    active: local
  
  datasource:
    username: root
    password: your-local-password  # Mac 로컬 비밀번호
    
  # 기타 로컬 전용 설정
```

서버에서는 프로덕션 환경 변수만 사용하면 됩니다.

## 🗄️ 데이터베이스 환경 전환

환경 변수를 통해 로컬/개발/프로덕션 DB를 쉽게 전환할 수 있습니다.

### 로컬 DB 사용 (기본값)

환경 변수를 설정하지 않으면 자동으로 로컬 DB를 사용합니다:

```bash
# 환경 변수 설정 없이 실행하면 자동으로 localhost:3306/mind_garden 사용
mvn spring-boot:run
```

### 개발 서버 DB 사용

개발 서버의 DB를 사용하려면 환경 변수를 설정합니다:

```bash
# ~/.zshrc 또는 ~/.bash_profile에 추가

# MySQL 사용 시
export DB_HOST=dev-server.example.com
export DB_PORT=3306
export DB_NAME=mind_garden_dev
export DB_USERNAME=dev-user
export DB_PASSWORD=dev-password

# MariaDB 사용 시 (MySQL 호환, 동일한 설정 사용 가능)
# MariaDB는 MySQL과 호환되므로 DB_TYPE을 설정하지 않아도 됩니다.
# 또는 명시적으로 설정하려면:
export DB_TYPE=mariadb
export DB_HOST=dev-server.example.com
export DB_PORT=3306
export DB_NAME=mind_garden_dev
export DB_USERNAME=dev-user
export DB_PASSWORD=dev-password

# 또는 실행 시 일시적으로 설정
DB_HOST=dev-server.example.com \
DB_PORT=3306 \
DB_NAME=mind_garden_dev \
DB_USERNAME=dev-user \
DB_PASSWORD=dev-password \
mvn spring-boot:run
```

### 프로덕션 DB 사용

프로덕션 환경에서는 다음과 같이 설정합니다:

```bash
# 운영 서버가 MySQL인 경우 (기본값, DB_TYPE 설정 불필요)
export DB_HOST=prod-server.example.com
export DB_PORT=3306
export DB_NAME=mind_garden_prod
export DB_USERNAME=prod-user
export DB_PASSWORD=prod-password

# 운영 서버가 MariaDB인 경우에만 DB_TYPE 설정
# export DB_TYPE=mariadb
# export DB_HOST=prod-server.example.com
# export DB_PORT=3306
# export DB_NAME=mind_garden_prod
# export DB_USERNAME=prod-user
# export DB_PASSWORD=prod-password
```

**중요:** 운영 서버가 MySQL이면 `DB_TYPE` 환경 변수를 설정하지 않아도 자동으로 MySQL을 사용합니다 (기본값).

### 사용 가능한 데이터베이스 환경 변수

| 환경 변수 | 기본값 | 설명 |
|----------|--------|------|
| `DB_TYPE` | `mysql` | 데이터베이스 타입 (`mysql` 또는 `mariadb`) |
| `DB_HOST` | `localhost` | 데이터베이스 호스트 |
| `DB_PORT` | `3306` | 데이터베이스 포트 |
| `DB_NAME` | `mind_garden` | 데이터베이스 이름 |
| `DB_USERNAME` | `root` | 데이터베이스 사용자명 |
| `DB_PASSWORD` | (없음) | 데이터베이스 비밀번호 |
| `DB_USE_SSL` | `false` | SSL 사용 여부 |
| `DB_TIMEZONE` | `Asia/Seoul` | 타임존 설정 |
| `DB_ALLOW_PUBLIC_KEY_RETRIEVAL` | `true` | 공개 키 검색 허용 |
| `DB_DIALECT` | `org.hibernate.dialect.MySQL8Dialect` | Hibernate Dialect (일반적으로 설정 불필요) |

### MariaDB 사용 시 주의사항

**MariaDB는 MySQL과 호환됩니다:**
- MariaDB 10.x는 MySQL 8.x와 호환됩니다
- MySQL JDBC 드라이버를 그대로 사용할 수 있습니다
- `DB_TYPE` 환경 변수를 설정하지 않아도 자동으로 작동합니다
- 필요시 `DB_TYPE=mariadb`로 명시적으로 설정할 수 있습니다

**Cafe24 등 호스팅 서버에서 MariaDB 사용 시:**
- 서버 관리자에게 제공된 MariaDB 호스트, 포트, 데이터베이스 이름, 사용자명, 비밀번호를 환경 변수로 설정하면 됩니다
- 추가 설치나 설정 변경 없이 바로 사용 가능합니다

## 🚀 서버 배포 시 설정

서버 배포 시 `application.yml`이 이미 포함되어 있으므로, 환경 변수만 설정하면 됩니다:

```bash
# 서버에서 JAR 실행 시
export DB_USERNAME=prod-user
export DB_PASSWORD=prod-password
export JWT_SECRET=prod-jwt-secret

java -jar consultation-management-system-1.0.0.jar --spring.profiles.active=prod
```

또는 프로덕션 전용 설정 파일 (`application-prod.yml`)을 만들어 사용할 수도 있습니다 (이 파일도 Git에 포함 가능 - 환경 변수 사용).

## ✅ 현재 설정이 안전한 이유

1. **`application.yml` (Git 포함)**:
   - 민감한 정보는 환경 변수 사용: `${DB_PASSWORD:}`
   - 기본값이 비어있어서 안전
   - 공통 설정은 모든 환경에서 동일하게 사용

2. **`application-local.yml` (Git 제외)**:
   - Mac 로컬 개발용 실제 값 설정 가능
   - 각 개발자마다 다른 설정 가능

3. **서버 배포**:
   - `application.yml`은 Git에서 가져옴
   - 환경 변수로 실제 값 주입

## 🔒 보안 권장사항

- ✅ 민감한 정보(비밀번호, API 키)는 환경 변수 사용
- ✅ `application-local.yml`은 절대 Git에 커밋하지 않음
- ✅ 서버에서는 환경 변수나 시크릿 관리 도구 사용

## 📚 관련 문서

- [서버 환경 요구사항 가이드](SERVER_REQUIREMENTS.md) - Java 설치, 웹 서버 설정 등
- [데이터베이스 설정 가이드](DATABASE_SETUP.md) - MySQL/MariaDB 설치 및 설정

